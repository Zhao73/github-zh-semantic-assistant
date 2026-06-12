(() => {
  const GHZH = globalThis.GHZH_DEFAULTS;
  const STORE_KEY = "ghzhSettings";
  const TRANSLATION_SELECTORS = [
    "#readme article.markdown-body h1",
    "#readme article.markdown-body h2",
    "#readme article.markdown-body h3",
    "#readme article.markdown-body h4",
    "#readme article.markdown-body p",
    "#readme article.markdown-body li",
    "#readme article.markdown-body blockquote",
    "#readme article.markdown-body td",
    "#readme article.markdown-body th",
    ".comment-body .markdown-body p",
    ".comment-body .markdown-body li",
    ".comment-body .markdown-body blockquote",
    ".js-issue-title",
    "[data-testid='repository-description']",
    ".BorderGrid-row .f4"
  ];

  const SKIP_SELECTOR = [
    "script",
    "style",
    "noscript",
    "template",
    "textarea",
    "input",
    "select",
    "option",
    "code",
    "pre",
    "kbd",
    "samp",
    "svg",
    "canvas",
    ".blob-code",
    ".blob-num",
    ".CodeMirror",
    ".cm-editor",
    ".highlight",
    ".ghzh-translation",
    ".ghzh-relative-time",
    ".ghzh-hidden-original"
  ].join(",");

  const state = {
    settings: null,
    observer: null,
    scheduled: 0,
    originals: new WeakMap(),
    attrOriginals: new WeakMap(),
    htmlOriginals: new WeakMap(),
    pendingIds: new Set()
  };

  start();

  async function start() {
    state.settings = await loadSettings();
    chrome.storage.onChanged.addListener(handleStorageChange);
    chrome.runtime.onMessage.addListener(handleRuntimeMessage);

    if (state.settings.enabled) {
      runNow();
      installObserver();
      installNavigationListeners();
    }
  }

  async function loadSettings() {
    const stored = await chrome.storage.local.get(STORE_KEY);
    return GHZH.mergeSettings(stored[STORE_KEY]);
  }

  function handleStorageChange(changes, areaName) {
    if (areaName !== "local" || !changes[STORE_KEY]) return;
    state.settings = GHZH.mergeSettings(changes[STORE_KEY].newValue);
    if (state.settings.enabled) {
      runNow();
      installObserver();
    } else {
      restorePage();
      uninstallObserver();
    }
  }

  function handleRuntimeMessage(message, sender, sendResponse) {
    if (!message || typeof message.type !== "string") return false;
    if (message.type === "GHZH_RUN_NOW") {
      runNow();
      sendResponse({ ok: true });
      return true;
    }
    if (message.type === "GHZH_RESET_PAGE") {
      restorePage();
      sendResponse({ ok: true });
      return true;
    }
    return false;
  }

  function installNavigationListeners() {
    ["turbo:render", "turbo:load", "pjax:end", "popstate"].forEach((eventName) => {
      window.addEventListener(eventName, () => scheduleRun(), { passive: true });
    });
  }

  function installObserver() {
    if (state.observer || !document.documentElement) return;
    state.observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.addedNodes.length || mutation.type === "characterData")) {
        scheduleRun();
      }
    });
    state.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function uninstallObserver() {
    if (!state.observer) return;
    state.observer.disconnect();
    state.observer = null;
  }

  function scheduleRun() {
    clearTimeout(state.scheduled);
    state.scheduled = window.setTimeout(runNow, 450);
  }

  function runNow() {
    if (!state.settings || !state.settings.enabled || !document.body) return;
    if (state.settings.translateUi) translateUi(document.body);
    if (state.settings.translateLongText) translateSemanticBlocks();
  }

  function translateUi(root) {
    translateTextNodes(root);
    translateAttributes(root);
    translateRelativeTimes(root);
  }

  function translateTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !GHZH.normalizeLabel(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;
        if (state.originals.has(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (const node of nodes) {
      const translated = GHZH.translateUiText(node.nodeValue);
      if (translated && translated !== node.nodeValue) {
        state.originals.set(node, node.nodeValue);
        node.nodeValue = translated;
      }
    }
  }

  function translateAttributes(root) {
    const elements = root.querySelectorAll("[aria-label], [title], [placeholder], input[type='submit'][value], input[type='button'][value], button[value]");
    elements.forEach((element) => {
      if (shouldSkipAttributeElement(element)) return;
      const originalMap = state.attrOriginals.get(element) || {};
      ["aria-label", "title", "placeholder", "value"].forEach((attribute) => {
        if (!element.hasAttribute(attribute)) return;
        const value = element.getAttribute(attribute);
        const translated = GHZH.translateUiText(value);
        if (translated && translated !== value) {
          if (!originalMap[attribute]) originalMap[attribute] = value;
          element.setAttribute(attribute, translated);
        }
      });
      if (Object.keys(originalMap).length) state.attrOriginals.set(element, originalMap);
    });
  }

  function translateRelativeTimes(root) {
    root.querySelectorAll("relative-time, time-ago").forEach((element) => {
      if (shouldSkipAttributeElement(element)) return;
      const translated = formatRelativeTime(element.getAttribute("datetime")) || GHZH.translateUiText(element.textContent || "");
      if (translated && translated !== element.textContent) {
        const replacement = document.createElement("span");
        replacement.className = "ghzh-relative-time";
        replacement.textContent = translated;
        if (element.getAttribute("title")) replacement.title = element.getAttribute("title");
        if (element.getAttribute("datetime")) replacement.dataset.datetime = element.getAttribute("datetime");
        element.replaceWith(replacement);
      }
    });
  }

  function formatRelativeTime(datetime) {
    if (!datetime) return "";
    const timestamp = new Date(datetime).getTime();
    if (!Number.isFinite(timestamp)) return "";
    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (seconds < 60) return "刚刚";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} 天前`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} 周前`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${Math.max(1, months)} 个月前`;
    const years = Math.floor(days / 365);
    return `${Math.max(1, years)} 年前`;
  }

  function translateSemanticBlocks() {
    if (!GHZH.hasAiConfig(state.settings)) return;

    const candidates = collectSemanticCandidates()
      .slice(0, Math.max(1, state.settings.maxBlocksPerRun || 32));

    if (!candidates.length) return;

    candidates.forEach((item) => {
      item.element.dataset.ghzhState = "loading";
      state.pendingIds.add(item.id);
    });

    chrome.runtime.sendMessage(
      {
        type: "GHZH_TRANSLATE_BATCH",
        pageTerms: derivePageProtectedTerms(),
        items: candidates.map((item) => ({
          id: item.id,
          text: item.text,
          protectedTerms: item.protectedTerms
        }))
      },
      (response) => {
        if (chrome.runtime.lastError) {
          markCandidates(candidates, "error", chrome.runtime.lastError.message);
          return;
        }
        if (!response?.ok) {
          markCandidates(candidates, "error", response?.error || "翻译失败");
          return;
        }
        const byId = new Map((response.translations || []).map((entry) => [entry.id, entry.zh]));
        candidates.forEach((item) => {
          const zh = byId.get(item.id);
          if (zh) {
            renderTranslation(item.element, zh);
            item.element.dataset.ghzhState = "done";
          } else {
            item.element.dataset.ghzhState = "skipped";
          }
          state.pendingIds.delete(item.id);
        });
      }
    );
  }

  function collectSemanticCandidates() {
    const elements = new Set();
    TRANSLATION_SELECTORS.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => elements.add(element));
    });

    const candidates = [];
    elements.forEach((element) => {
      if (!(element instanceof HTMLElement)) return;
      if (shouldSkipElement(element)) return;
      if (element.dataset.ghzhState || element.nextElementSibling?.classList.contains("ghzh-translation")) return;

      const text = visibleText(element);
      if (!isTranslatableLongText(text)) return;

      const id = element.dataset.ghzhId || GHZH.hashString(`${location.pathname}:${text}`);
      element.dataset.ghzhId = id;
      if (state.pendingIds.has(id)) return;
      candidates.push({
        id,
        text,
        element,
        protectedTerms: GHZH.extractProtectedTerms(text)
      });
    });
    return candidates;
  }

  function derivePageProtectedTerms() {
    const terms = [];
    const pathParts = location.pathname.split("/").filter(Boolean);
    if (pathParts[0]) terms.push(pathParts[0], `@${pathParts[0]}`);
    if (pathParts[1]) terms.push(pathParts[1], `${pathParts[0]}/${pathParts[1]}`);
    const repoTitle = document.querySelector("strong[itemprop='name'] a, [data-testid='repository-title'] a");
    if (repoTitle?.textContent) terms.push(repoTitle.textContent.trim());
    const owner = document.querySelector("span.author a, a[data-hovercard-type='organization'], a[data-hovercard-type='user']");
    if (owner?.textContent) terms.push(owner.textContent.trim());
    return terms
      .flatMap((term) => [term, ...GHZH.extractProtectedTerms(term)])
      .map((term) => String(term || "").trim())
      .filter(Boolean)
      .filter((term, index, all) => all.indexOf(term) === index)
      .slice(0, 80);
  }

  function visibleText(element) {
    return element.innerText || element.textContent || "";
  }

  function isTranslatableLongText(text) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (clean.length < 18 || clean.length > 2200) return false;
    if (/[\u4e00-\u9fff]/.test(clean) && chineseRatio(clean) > 0.22) return false;
    if (englishRatio(clean) < 0.32) return false;
    if (looksLikeCode(clean)) return false;
    return true;
  }

  function englishRatio(text) {
    const letters = (text.match(/[A-Za-z]/g) || []).length;
    return letters / Math.max(text.length, 1);
  }

  function chineseRatio(text) {
    const chars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    return chars / Math.max(text.length, 1);
  }

  function looksLikeCode(text) {
    const codeSignals = (text.match(/[{}();=<>]|::|=>|npm\s+|pnpm\s+|yarn\s+|git\s+|docker\s+/g) || []).length;
    return codeSignals >= 5 || /^[\w./-]+\s*[:=]\s*[\w./-]+$/.test(text);
  }

  function renderTranslation(element, zh) {
    const clean = String(zh || "").trim();
    if (!clean) return;

    const existing = element.nextElementSibling;
    if (existing?.classList.contains("ghzh-translation")) {
      existing.textContent = clean;
      return;
    }

    if (state.settings.mode === "replace" && canSafelyReplace(element)) {
      if (!state.htmlOriginals.has(element)) state.htmlOriginals.set(element, element.innerHTML);
      element.textContent = clean;
      element.classList.add("ghzh-replaced");
      return;
    }

    const panel = document.createElement("div");
    panel.className = "ghzh-translation";
    panel.lang = "zh-CN";
    panel.textContent = clean;
    element.insertAdjacentElement("afterend", panel);
  }

  function canSafelyReplace(element) {
    const interactive = element.querySelector("a, button, input, select, textarea, code, pre, kbd, samp");
    return !interactive && element.children.length <= 1;
  }

  function markCandidates(candidates, stateName, message) {
    candidates.forEach((item) => {
      item.element.dataset.ghzhState = stateName;
      item.element.dataset.ghzhError = message || "";
      state.pendingIds.delete(item.id);
    });
  }

  function shouldSkipElement(element) {
    return Boolean(element.closest(SKIP_SELECTOR));
  }

  function shouldSkipAttributeElement(element) {
    return Boolean(element.closest("script, style, noscript, template, code, pre, kbd, samp, svg, canvas, .blob-code, .blob-num, .CodeMirror, .cm-editor, .highlight, .ghzh-translation"));
  }

  function restorePage() {
    document.querySelectorAll(".ghzh-translation").forEach((element) => element.remove());
    document.querySelectorAll("[data-ghzh-state], [data-ghzh-id], [data-ghzh-error]").forEach((element) => {
      delete element.dataset.ghzhState;
      delete element.dataset.ghzhId;
      delete element.dataset.ghzhError;
    });
    document.querySelectorAll(".ghzh-replaced").forEach((element) => {
      if (state.htmlOriginals.has(element)) element.innerHTML = state.htmlOriginals.get(element);
      element.classList.remove("ghzh-replaced");
    });
    state.originals = new WeakMap();
    state.attrOriginals = new WeakMap();
    state.htmlOriginals = new WeakMap();
    location.reload();
  }
})();
