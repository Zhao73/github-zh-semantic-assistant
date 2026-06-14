importScripts("defaults.js");

const STORE_KEY = "ghzhSettings";
const CACHE_KEY = "ghzhCacheV1";
const MAX_CACHE_ENTRIES = 420;

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await chrome.storage.local.set({ [STORE_KEY]: settings });
  await updateBadge(settings);
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== "local" || !changes[STORE_KEY]) return;
  await updateBadge(globalThis.GHZH_DEFAULTS.mergeSettings(changes[STORE_KEY].newValue));
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-extension") {
    const settings = await getSettings();
    const next = { ...settings, enabled: !settings.enabled };
    await chrome.storage.local.set({ [STORE_KEY]: next });
    await updateBadge(next);
    await sendToActiveGitHubTab(next.enabled ? "GHZH_RUN_NOW" : "GHZH_RESET_PAGE");
    return;
  }

  if (command === "translate-page") {
    await sendToActiveGitHubTab("GHZH_RUN_NOW");
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== "string") return false;

  if (message.type === "GHZH_OPEN_OPTIONS") {
    chrome.runtime.openOptionsPage()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: readableError(error) }));
    return true;
  }

  if (message.type === "GHZH_TRANSLATE_BATCH") {
    translateBatch(message.items || [], { pageTerms: message.pageTerms || [] })
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: readableError(error) }));
    return true;
  }

  if (message.type === "GHZH_TEST_TRANSLATION") {
    translateBatch([{ id: "test", text: message.text || "Agentic workflows with RAG and tool calling." }], {
      bypassCache: true
    })
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: readableError(error) }));
    return true;
  }

  return false;
});

async function getSettings() {
  const stored = await chrome.storage.local.get(STORE_KEY);
  return globalThis.GHZH_DEFAULTS.mergeSettings(stored[STORE_KEY]);
}

async function updateBadge(settings) {
  await chrome.action.setBadgeText({ text: settings.enabled ? "中" : "" });
  await chrome.action.setBadgeBackgroundColor({ color: settings.enabled ? "#1f883d" : "#6e7781" });
}

async function sendToActiveGitHubTab(type) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.id || !/^https:\/\/github\.com\//.test(tab.url || "")) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type });
  } catch (error) {
    // The content script may not be injected yet on a freshly opened page.
  }
}

async function getCache() {
  const stored = await chrome.storage.local.get(CACHE_KEY);
  return stored[CACHE_KEY] && typeof stored[CACHE_KEY] === "object" ? stored[CACHE_KEY] : {};
}

async function saveCache(cache) {
  const entries = Object.entries(cache).sort((left, right) => (right[1].ts || 0) - (left[1].ts || 0));
  const trimmed = Object.fromEntries(entries.slice(0, MAX_CACHE_ENTRIES));
  await chrome.storage.local.set({ [CACHE_KEY]: trimmed });
}

async function translateBatch(items, options = {}) {
  const settings = await getSettings();
  const cleanItems = sanitizeItems(items);

  if (!settings.enabled) {
    return { ok: false, code: "disabled", error: "扩展已关闭。" };
  }

  if (!globalThis.GHZH_DEFAULTS.hasAiConfig(settings)) {
    return { ok: false, code: "missing_ai_config", error: "还没有配置可用的 AI 模型或 API Key。" };
  }

  if (!cleanItems.length) {
    return { ok: true, translations: [] };
  }

  const cache = await getCache();
  const glossaryHash = globalThis.GHZH_DEFAULTS.hashString(`${settings.glossary}|${settings.protectedTerms}`);
  const modelHash = globalThis.GHZH_DEFAULTS.hashString(`${settings.ai.baseUrl}|${settings.ai.model}|${glossaryHash}`);
  const translations = [];
  const missing = [];

  for (const item of cleanItems) {
    const cacheKey = `${modelHash}:${globalThis.GHZH_DEFAULTS.hashString(item.text)}`;
    if (!options.bypassCache && cache[cacheKey]?.zh) {
      translations.push({ id: item.id, zh: cache[cacheKey].zh, cached: true });
    } else {
      missing.push({ ...item, cacheKey });
    }
  }

  for (const chunk of chunkItems(missing, 8)) {
    const result = await callTranslator(settings, chunk, options.pageTerms || []);
    const now = Date.now();
    for (const entry of result) {
      if (!entry || !entry.id || !entry.zh) continue;
      translations.push({ id: entry.id, zh: cleanTranslation(entry.zh), cached: false });
      const source = chunk.find((item) => item.id === entry.id);
      if (source) cache[source.cacheKey] = { zh: cleanTranslation(entry.zh), ts: now };
    }
  }

  await saveCache(cache);
  return { ok: true, translations };
}

function sanitizeItems(items) {
  const seen = new Set();
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: String(item.id || "").slice(0, 80),
      text: String(item.text || "").replace(/\s+/g, " ").trim(),
      protectedTerms: Array.isArray(item.protectedTerms) ? item.protectedTerms.slice(0, 80) : []
    }))
    .filter((item) => item.id && item.text && item.text.length <= 2200)
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
}

function chunkItems(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function endpointFromBaseUrl(baseUrl) {
  const trimmed = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (/\/chat\/completions$/i.test(trimmed)) return trimmed;
  return `${trimmed || "https://api.openai.com/v1"}/chat/completions`;
}

async function callTranslator(settings, items, pageTerms = []) {
  const glossary = globalThis.GHZH_DEFAULTS.parseGlossary(settings.glossary)
    .map((entry) => `${entry.source} = ${entry.target}`)
    .join("\n");
  const protectedTerms = collectProtectedTerms(settings, items, pageTerms);

  const systemPrompt = [
    "你是专门处理 GitHub、开源工程和现代 AI 工程语境的英译中技术翻译器。",
    "目标是让中文读者正确理解原意，不做 Google Translate 式逐词机翻。",
    "规则:",
    "1. 输出简体中文，语气自然、专业、具体。",
    "2. 保留代码、命令、路径、包名、API 名称、模型名称、产品名、许可证名、版本号、用户名和仓库名。",
    "3. GitHub 的 pull request 译为拉取请求，issue 译为议题，fork 译为派生，release 译为发布版本。",
    "4. AI 术语按中文技术社区常用说法处理，例如 agent 译为智能体，RAG 译为检索增强生成，embedding 译为嵌入向量。",
    "5. 专名保护名单里的词必须原样保留，除非术语表明确给了中文译名。",
    "6. 人名、组织名、仓库名、包名、模型名、产品名默认不翻译。只翻译它周围的说明文字。",
    "7. 不添加原文没有的结论，不删减关键限制，不把简介翻成宣传腔。",
    "8. 只返回 JSON 对象，格式为 {\"translations\":[{\"id\":\"...\",\"zh\":\"...\"}]}。"
  ].join("\n");

  const userPrompt = [
    "术语表:",
    glossary || "无",
    "",
    "专名保护名单:",
    protectedTerms.length ? protectedTerms.join("\n") : "无",
    "",
    "待翻译片段 JSON:",
    JSON.stringify(items.map((item) => ({ id: item.id, text: item.text, protectedTerms: item.protectedTerms || [] })))
  ].join("\n");

  const body = {
    model: settings.ai.model,
    temperature: 0.1,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  };

  if (settings.ai.useJsonMode) {
    body.response_format = { type: "json_object" };
  }

  const headers = {
    "Content-Type": "application/json"
  };

  if (settings.ai.apiKey) {
    headers.Authorization = `Bearer ${settings.ai.apiKey}`;
  }

  const response = await fetch(endpointFromBaseUrl(settings.ai.baseUrl), {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`AI 请求失败 ${response.status}: ${responseText.slice(0, 240)}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (error) {
    throw new Error(`AI 返回不是 JSON: ${responseText.slice(0, 240)}`);
  }

  const content = data.choices?.[0]?.message?.content || data.output_text || "";
  const parsed = parseModelJson(content);
  if (!Array.isArray(parsed.translations)) {
    throw new Error("AI 返回缺少 translations 数组。");
  }

  return parsed.translations.map((entry) => ({
    id: String(entry.id || ""),
    zh: cleanTranslation(entry.zh || "")
  }));
}

function collectProtectedTerms(settings, items, pageTerms) {
  if (!settings.protectProperNouns) return [];
  const configured = globalThis.GHZH_DEFAULTS.parseProtectedTerms(settings.protectedTerms);
  const fromItems = items.flatMap((item) => [
    ...(item.protectedTerms || []),
    ...globalThis.GHZH_DEFAULTS.extractProtectedTerms(item.text)
  ]);
  return [...configured, ...pageTerms, ...fromItems]
    .map((term) => String(term || "").trim())
    .filter(Boolean)
    .filter((term, index, terms) => terms.indexOf(term) === index)
    .slice(0, 160);
}

function parseModelJson(content) {
  const raw = String(content || "").trim();
  const withoutFence = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(withoutFence);
  } catch (error) {
    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(withoutFence.slice(start, end + 1));
    }
    throw error;
  }
}

function cleanTranslation(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function readableError(error) {
  return error && error.message ? error.message : String(error || "未知错误");
}
