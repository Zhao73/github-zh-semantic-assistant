import assert from "node:assert/strict";
import http from "node:http";
import { mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = loadPlaywright();

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const extensionPath = root;
const userDataDir = resolve(root, ".tmp/chrome-real-page-profile");
const chromePath = process.env.GHZH_USE_SYSTEM_CHROME === "1"
  ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  : "";
const screenshotPath = resolve(root, "assets/screenshots/github-openai-cookbook.png");

mkdirSync(resolve(root, "assets/screenshots"), { recursive: true });
rmSync(userDataDir, { recursive: true, force: true });

const aiRequests = [];
const server = http.createServer(async (request, response) => {
  if (request.method !== "POST" || !request.url.includes("/chat/completions")) {
    response.writeHead(404);
    response.end("not found");
    return;
  }

  let body = "";
  for await (const chunk of request) body += chunk;
  const parsed = JSON.parse(body);
  const userPrompt = parsed.messages.find((message) => message.role === "user")?.content || "";
  const items = extractItems(userPrompt);
  aiRequests.push({ userPrompt, items });

  const translations = items.map((item) => ({
    id: item.id,
    zh: translateForTest(item.text)
  }));

  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({
    choices: [
      {
        message: {
          content: JSON.stringify({ translations })
        }
      }
    ]
  }));
});

await new Promise((resolveServer) => server.listen(0, "127.0.0.1", resolveServer));
const port = server.address().port;

const consoleMessages = [];
const pageErrors = [];
let context;

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    ...(chromePath ? { executablePath: chromePath } : {}),
    headless: false,
    viewport: { width: 1440, height: 1000 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      "--no-first-run",
      "--no-default-browser-check"
    ]
  });

  let serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) serviceWorker = await context.waitForEvent("serviceworker", { timeout: 15000 });
  const extensionId = new URL(serviceWorker.url()).host;

  await serviceWorker.evaluate(async () => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const stored = await chrome.storage.local.get("ghzhSettings");
      if (stored.ghzhSettings) return;
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
  });

  await serviceWorker.evaluate(async ({ port }) => {
    const defaults = globalThis.GHZH_DEFAULTS.DEFAULT_SETTINGS;
    await chrome.storage.local.set({
      ghzhSettings: {
        ...defaults,
        enabled: true,
        translateUi: true,
        translateLongText: true,
        mode: "bilingual",
        maxBlocksPerRun: 5,
        ai: {
          ...defaults.ai,
          baseUrl: `http://127.0.0.1:${port}/v1`,
          model: "test-translator",
          apiKey: "",
          useJsonMode: true
        }
      }
    });
  }, { port });

  const page = await context.newPage();
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("https://github.com/openai/openai-cookbook", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await page.waitForSelector(".ghzh-control", { timeout: 10000 });
  const controlText = await page.locator(".ghzh-control").innerText({ timeout: 5000 });
  const controlSwitchState = await page.locator(".ghzh-control__switch").getAttribute("aria-checked", { timeout: 5000 });
  assert.match(controlText, /中文|翻译/);
  assert.equal(controlSwitchState, "true");
  await page.locator(".ghzh-control__minimize").click();
  await expectClass(page, ".ghzh-control", /ghzh-control--mini/);
  await page.locator(".ghzh-control__minimize").click();
  await page.locator(".ghzh-control__head").dragTo(page.locator("body"), {
    targetPosition: { x: 1220, y: 220 }
  });
  const movedLeft = await page.locator(".ghzh-control").evaluate((node) => node.getBoundingClientRect().left);
  assert.ok(movedLeft > 1000, "expected draggable control panel to move horizontally");
  const [optionsPage] = await Promise.all([
    context.waitForEvent("page", { timeout: 10000 }),
    page.locator(".ghzh-control__settings").click()
  ]);
  await optionsPage.waitForLoadState("domcontentloaded", { timeout: 10000 });
  assert.equal(optionsPage.url(), `chrome-extension://${extensionId}/options.html`);
  await optionsPage.close();
  await page.bringToFront();
  await serviceWorker.evaluate(async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      try {
        await chrome.tabs.sendMessage(tabs[0].id, { type: "GHZH_RUN_NOW" });
      } catch (error) {
        // The content script also runs automatically; this only removes first-install timing flake.
      }
    }
  });
  await page.waitForSelector(".ghzh-translation", { timeout: 30000 });

  const bodyText = await page.locator("body").innerText({ timeout: 10000 });
  assert.match(bodyText, /代码|拉取请求|议题|自动化|星标/);
  assert.match(bodyText, /openai-cookbook/);
  assert.match(bodyText, /LangChain|OpenAI|Cookbook|API|GPT|Python/i);
  assert.ok(await page.locator(".ghzh-translation").count() > 0, "expected at least one Chinese translation panel");

  const promptText = aiRequests.map((entry) => entry.userPrompt).join("\n");
  assert.match(promptText, /openai\/openai-cookbook/);
  assert.match(promptText, /openai-cookbook/);
  assert.match(promptText, /专名保护名单/);

  const commands = await serviceWorker.evaluate(async () => chrome.commands.getAll());
  assert.ok(commands.some((command) => command.name === "toggle-extension" && /(?:Alt\+Shift\+G|⌥⇧G)/.test(command.shortcut)));
  assert.ok(commands.some((command) => command.name === "translate-page" && /(?:Alt\+Shift\+T|⌥⇧T)/.test(command.shortcut)));

  await page.screenshot({ path: screenshotPath, fullPage: false });

  const fatalConsole = consoleMessages.filter((message) => {
    return !/Failed to load resource|favicon|net::ERR_BLOCKED_BY_CLIENT|Content Security Policy/i.test(message);
  });
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(fatalConsole, []);

  await page.goto("https://github.com/trending", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await serviceWorker.evaluate(async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      try {
        await chrome.tabs.sendMessage(tabs[0].id, { type: "GHZH_RUN_NOW" });
      } catch (error) {
        // The content script also runs automatically; this only removes first-install timing flake.
      }
    }
  });
  await page.waitForSelector(".ghzh-translation", { timeout: 30000 });
  const trendingText = await page.locator("body").innerText({ timeout: 10000 });
  assert.match(trendingText, /趋势|开发者|日期范围|今天|自然语言|编程语言/);

  console.log(JSON.stringify({
    ok: true,
    extensionId,
    url: "https://github.com/openai/openai-cookbook",
    extraUrl: page.url(),
    aiRequestCount: aiRequests.length,
    screenshotPath
  }, null, 2));
} finally {
  if (context) await context.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}

function extractItems(prompt) {
  const marker = "待翻译片段 JSON:";
  const index = prompt.indexOf(marker);
  if (index < 0) return [];
  const jsonText = prompt.slice(index + marker.length).trim();
  return JSON.parse(jsonText);
}

function loadPlaywright() {
  const candidates = [
    "playwright",
    "/Users/zhaojiapeng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"
  ];
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch (error) {
      // Try the next candidate.
    }
  }
  throw new Error("Playwright is required for real Chrome validation. Install it with npm i -D playwright.");
}

function translateForTest(text) {
  const source = String(text || "");
  return source
    .replace(/\bAgentic workflows?\b/gi, "智能体工作流")
    .replace(/\bagents?\b/gi, "智能体")
    .replace(/\bRAG\b/g, "检索增强生成")
    .replace(/\btool calling\b/gi, "工具调用")
    .replace(/\bissues?\b/gi, "议题")
    .replace(/\bpull requests?\b/gi, "拉取请求")
    .replace(/\brepository\b/gi, "仓库")
    .replace(/\brepositories\b/gi, "仓库")
    .replace(/\bmaintainers?\b/gi, "维护者")
    .replace(/\bcontext\b/gi, "上下文");
}

async function expectClass(page, selector, pattern) {
  const className = await page.locator(selector).getAttribute("class", { timeout: 5000 });
  assert.match(className || "", pattern);
}
