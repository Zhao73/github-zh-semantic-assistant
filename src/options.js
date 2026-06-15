(() => {
  const GHZH = globalThis.GHZH_DEFAULTS;
  const STORE_KEY = "ghzhSettings";
  const CACHE_KEY = "ghzhCacheV1";

  const form = document.querySelector("#settingsForm");
  const fields = {
    enabled: document.querySelector("#enabled"),
    translateUi: document.querySelector("#translateUi"),
    translateLongText: document.querySelector("#translateLongText"),
    mode: document.querySelector("#mode"),
    maxBlocksPerRun: document.querySelector("#maxBlocksPerRun"),
    baseUrl: document.querySelector("#baseUrl"),
    model: document.querySelector("#model"),
    apiKey: document.querySelector("#apiKey"),
    useJsonMode: document.querySelector("#useJsonMode"),
    aiPresets: document.querySelector("#aiPresets"),
    glossary: document.querySelector("#glossary"),
    protectProperNouns: document.querySelector("#protectProperNouns"),
    protectedTerms: document.querySelector("#protectedTerms"),
    status: document.querySelector("#status"),
    testOutput: document.querySelector("#testOutput"),
    testText: document.querySelector("#testText")
  };

  const buttons = {
    test: document.querySelector("#testTranslation"),
    resetGlossary: document.querySelector("#resetGlossary"),
    resetProtectedTerms: document.querySelector("#resetProtectedTerms"),
    clearCache: document.querySelector("#clearCache")
  };

  let settings = null;

  init();

  async function init() {
    settings = await loadSettings();
    render();
    bindEvents();
  }

  async function loadSettings() {
    const stored = await chrome.storage.local.get(STORE_KEY);
    return GHZH.mergeSettings(stored[STORE_KEY]);
  }

  function render() {
    fields.enabled.checked = settings.enabled;
    fields.translateUi.checked = settings.translateUi;
    fields.translateLongText.checked = settings.translateLongText;
    fields.mode.value = settings.mode;
    fields.maxBlocksPerRun.value = settings.maxBlocksPerRun;
    fields.baseUrl.value = settings.ai.baseUrl;
    fields.model.value = settings.ai.model;
    fields.apiKey.value = settings.ai.apiKey;
    fields.useJsonMode.checked = settings.ai.useJsonMode;
    fields.glossary.value = settings.glossary;
    fields.protectProperNouns.checked = settings.protectProperNouns;
    fields.protectedTerms.value = settings.protectedTerms;
    renderAiPresets();
    setStatus(
      GHZH.hasAiConfig(settings) ? "AI 翻译已配置。" : "请先填写 API Key，或使用 localhost 兼容端点。",
      GHZH.hasAiConfig(settings) ? "ready" : "warn"
    );
  }

  function bindEvents() {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await saveFromForm();
    });

    buttons.test.addEventListener("click", testTranslation);
    fields.aiPresets.addEventListener("click", (event) => {
      const button = event.target.closest("[data-preset-id]");
      if (!button) return;
      const preset = GHZH.AI_PRESETS.find((item) => item.id === button.dataset.presetId);
      if (preset) applyAiPreset(preset);
    });
    buttons.resetGlossary.addEventListener("click", () => {
      fields.glossary.value = GHZH.DEFAULT_GLOSSARY;
      setStatus("术语表已恢复为默认内容，点击保存后生效。", "ready");
    });
    buttons.resetProtectedTerms.addEventListener("click", () => {
      fields.protectedTerms.value = GHZH.DEFAULT_PROTECTED_TERMS;
      setStatus("专名保护名单已恢复为默认内容，点击保存后生效。", "ready");
    });
    buttons.clearCache.addEventListener("click", async () => {
      await chrome.storage.local.remove(CACHE_KEY);
      setStatus("翻译缓存已清空。", "ready");
    });
  }

  function renderAiPresets() {
    fields.aiPresets.textContent = "";
    GHZH.AI_PRESETS.forEach((preset) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "presetButton";
      button.dataset.presetId = preset.id;
      button.setAttribute("aria-pressed", String(isActivePreset(preset)));

      const title = document.createElement("span");
      title.className = "presetButton__title";
      title.textContent = preset.label;

      const description = document.createElement("span");
      description.className = "presetButton__desc";
      description.textContent = preset.description;

      button.append(title, description);
      fields.aiPresets.append(button);
    });
  }

  function applyAiPreset(preset) {
    fields.baseUrl.value = preset.ai.baseUrl;
    fields.model.value = preset.ai.model;
    fields.useJsonMode.checked = preset.ai.useJsonMode;
    renderAiPresets();
    setStatus(`已应用 ${preset.label} 预设。填写 API Key 后保存即可生效。`, "ready");
  }

  function isActivePreset(preset) {
    return fields.baseUrl.value.trim() === preset.ai.baseUrl &&
      fields.model.value.trim() === preset.ai.model &&
      fields.useJsonMode.checked === preset.ai.useJsonMode;
  }

  async function saveFromForm() {
    settings = GHZH.mergeSettings({
      enabled: fields.enabled.checked,
      translateUi: fields.translateUi.checked,
      translateLongText: fields.translateLongText.checked,
      mode: fields.mode.value,
      maxBlocksPerRun: Number(fields.maxBlocksPerRun.value),
      ai: {
        baseUrl: fields.baseUrl.value.trim(),
        model: fields.model.value.trim(),
        apiKey: fields.apiKey.value.trim(),
        useJsonMode: fields.useJsonMode.checked
      },
      glossary: fields.glossary.value,
      protectProperNouns: fields.protectProperNouns.checked,
      protectedTerms: fields.protectedTerms.value
    });
    await chrome.storage.local.set({ [STORE_KEY]: settings });
    setStatus("设置已保存。刷新 GitHub 页面后会按新设置运行。", "ready");
  }

  async function testTranslation() {
    await saveFromForm();
    fields.testOutput.textContent = "测试中...";
    chrome.runtime.sendMessage(
      {
        type: "GHZH_TEST_TRANSLATION",
        text: fields.testText.value.trim()
      },
      (response) => {
        if (chrome.runtime.lastError) {
          fields.testOutput.textContent = chrome.runtime.lastError.message;
          setStatus("测试失败。", "error");
          return;
        }
        if (!response?.ok) {
          fields.testOutput.textContent = response?.error || "测试失败";
          setStatus("测试失败。", "error");
          return;
        }
        const translated = response.translations?.[0]?.zh || "没有返回翻译。";
        fields.testOutput.textContent = translated;
        setStatus("测试成功。", "ready");
      }
    );
  }

  function setStatus(text, tone) {
    fields.status.textContent = text;
    fields.status.dataset.tone = tone;
  }
})();
