(() => {
  const GHZH = globalThis.GHZH_DEFAULTS;
  const STORE_KEY = "ghzhSettings";

  const elements = {
    enabled: document.querySelector("#enabled"),
    status: document.querySelector("#status"),
    mode: document.querySelector("#mode"),
    translatePage: document.querySelector("#translatePage"),
    resetPage: document.querySelector("#resetPage"),
    options: document.querySelector("#openOptions")
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

  async function saveSettings(next) {
    settings = GHZH.mergeSettings(next);
    await chrome.storage.local.set({ [STORE_KEY]: settings });
    render();
  }

  function render() {
    elements.enabled.checked = settings.enabled;
    elements.mode.value = settings.mode;
    elements.status.textContent = GHZH.hasAiConfig(settings)
      ? `AI 已配置: ${settings.ai.model}`
      : "AI 未配置: 只能翻译 GitHub 固定界面词";
    elements.status.dataset.ready = GHZH.hasAiConfig(settings) ? "true" : "false";
  }

  function bindEvents() {
    elements.enabled.addEventListener("change", () => {
      saveSettings({ ...settings, enabled: elements.enabled.checked });
    });

    elements.mode.addEventListener("change", () => {
      saveSettings({ ...settings, mode: elements.mode.value });
    });

    elements.translatePage.addEventListener("click", () => sendToActiveTab("GHZH_RUN_NOW"));
    elements.resetPage.addEventListener("click", () => sendToActiveTab("GHZH_RESET_PAGE"));
    elements.options.addEventListener("click", () => chrome.runtime.openOptionsPage());
  }

  async function sendToActiveTab(type) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    chrome.tabs.sendMessage(tab.id, { type });
  }
})();
