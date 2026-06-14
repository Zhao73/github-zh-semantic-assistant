import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

await import("../src/defaults.js");

const ghzh = globalThis.GHZH_DEFAULTS;
const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));

assert.equal(ghzh.translateUiText("Pull requests"), "拉取请求");
assert.equal(ghzh.translateUiText("12 stars"), "12 星标");
assert.equal(ghzh.translateUiText("Updated 2 days ago"), "2 天前更新");
assert.equal(ghzh.translateUiText("Security and quality"), "安全与质量");
assert.equal(ghzh.translateUiText("Folders and files"), "文件夹和文件");
assert.equal(ghzh.translateUiText("last month"), "上个月");
assert.equal(ghzh.translateUiText("stars"), "星标");
assert.equal(ghzh.translateUiText("watching"), "关注者");
assert.equal(ghzh.translateUiText("forks"), "派生");
assert.equal(ghzh.translateUiText("Platform"), "平台");
assert.equal(ghzh.translateUiText("Solutions"), "解决方案");
assert.equal(ghzh.translateUiText("Open Source"), "开源");
assert.equal(ghzh.translateUiText("Pricing"), "定价");
assert.equal(ghzh.translateUiText("Home"), "首页");
assert.equal(ghzh.translateUiText("All issues"), "全部议题");
assert.equal(ghzh.translateUiText("All pull requests"), "全部拉取请求");
assert.equal(ghzh.translateUiText("All repositories"), "全部仓库");
assert.equal(ghzh.translateUiText("Top repositories"), "常用仓库");
assert.equal(ghzh.translateUiText("MCP registry"), "MCP 注册表");
assert.equal(ghzh.translateUiText("Feed"), "动态");
assert.equal(ghzh.translateUiText("Read more"), "阅读更多");
assert.equal(ghzh.translateUiText("Write code"), "编写代码");
assert.equal(ghzh.hasAiConfig(ghzh.mergeSettings({ ai: { baseUrl: "http://localhost:11434/v1", model: "qwen2.5" } })), true);
assert.equal(ghzh.hasAiConfig(ghzh.mergeSettings({ ai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4.1-mini" } })), false);
assert.equal(ghzh.looksLikeProtectedName("openai/openai-cookbook"), true);
assert.equal(ghzh.looksLikeProtectedName("LangChain"), true);
assert.equal(ghzh.looksLikeProtectedName("repository"), false);
assert.ok(ghzh.extractProtectedTerms("LangChain agents in openai/openai-cookbook use Qwen2.5.").includes("LangChain"));
assert.ok(manifest.commands["toggle-extension"]);
assert.ok(manifest.commands["translate-page"]);

console.log("smoke tests passed");
