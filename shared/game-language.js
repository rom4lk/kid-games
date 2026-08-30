(function initializeGameLanguage(global) {
  const STORAGE_KEY = "kidGamesLanguageV1";
  const SUPPORTED_LANGUAGES = new Set(["en", "ru"]);
  const TRANSLATED_ATTRIBUTES = ["aria-label", "title", "placeholder", "content"];
  const textSources = new WeakMap();
  const textRenders = new WeakMap();
  const attributeSources = new WeakMap();
  const attributeRenders = new WeakMap();
  const listeners = new Set();
  let translations = { pairs: [], templates: [] };
  let language = readLanguage();
  let observer;

  function readLanguage() {
    try {
      const saved = global.localStorage.getItem(STORAGE_KEY);
      return SUPPORTED_LANGUAGES.has(saved) ? saved : "en";
    } catch {
      return "en";
    }
  }

  function saveLanguage() {
    try {
      global.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Private browsing modes can refuse writes. The choice stays for this session only.
    }
  }

  function escapePattern(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function compileTemplate(template) {
    const names = [];
    let cursor = 0;
    let expression = "^";
    const placeholder = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;
    let match = placeholder.exec(template);

    while (match) {
      expression += escapePattern(template.slice(cursor, match.index));
      expression += "(.+?)";
      names.push(match[1]);
      cursor = match.index + match[0].length;
      match = placeholder.exec(template);
    }

    expression += `${escapePattern(template.slice(cursor))}$`;
    return { expression: new RegExp(expression), names };
  }

  function normalizeTranslations(value) {
    const pairs = Array.isArray(value?.pairs)
      ? value.pairs.filter((pair) => Array.isArray(pair) && pair.length === 2)
      : [];
    const templates = Array.isArray(value?.templates)
      ? value.templates
        .filter((pair) => Array.isArray(pair) && pair.length === 2)
        .map(([english, russian]) => ({
          en: { template: english, ...compileTemplate(english) },
          ru: { template: russian, ...compileTemplate(russian) },
        }))
      : [];
    return { pairs, templates };
  }

  function translateExact(value, targetLanguage) {
    for (const [english, russian] of translations.pairs) {
      if (value === english || value === russian) {
        return targetLanguage === "ru" ? russian : english;
      }
    }
    return value;
  }

  function fillTemplate(template, values) {
    return template.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (_, name) => values[name] ?? "");
  }

  function translateTemplate(value, targetLanguage) {
    for (const pair of translations.templates) {
      for (const sourceLanguage of ["en", "ru"]) {
        const source = pair[sourceLanguage];
        const match = value.match(source.expression);
        if (!match) continue;
        const values = Object.fromEntries(source.names.map((name, index) => [
          name,
          translateExact(match[index + 1], targetLanguage),
        ]));
        return fillTemplate(pair[targetLanguage].template, values);
      }
    }
    return value;
  }

  function translate(value, targetLanguage = language) {
    if (typeof value !== "string" || value.trim() === "") return value;
    const leading = value.match(/^\s*/)?.[0] ?? "";
    const trailing = value.match(/\s*$/)?.[0] ?? "";
    const core = value.slice(leading.length, value.length - trailing.length);
    const exact = translateExact(core, targetLanguage);
    const translated = exact === core ? translateTemplate(core, targetLanguage) : exact;
    return `${leading}${translated}${trailing}`;
  }

  function translateTextNode(node) {
    const current = node.nodeValue ?? "";
    if (textRenders.get(node) !== current) textSources.set(node, current);
    const source = textSources.get(node) ?? current;
    const rendered = translate(source);
    textRenders.set(node, rendered);
    if (current !== rendered) node.nodeValue = rendered;
  }

  function attributeMap(store, element) {
    if (!store.has(element)) store.set(element, new Map());
    return store.get(element);
  }

  function translateAttribute(element, attribute) {
    if (!element.hasAttribute(attribute)) return;
    if (attribute === "content" && element.tagName !== "META") return;
    const sources = attributeMap(attributeSources, element);
    const renders = attributeMap(attributeRenders, element);
    const current = element.getAttribute(attribute) ?? "";
    if (renders.get(attribute) !== current) sources.set(attribute, current);
    const source = sources.get(attribute) ?? current;
    const rendered = translate(source);
    renders.set(attribute, rendered);
    if (current !== rendered) element.setAttribute(attribute, rendered);
  }

  function applyNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.parentElement?.closest("script, style")) translateTextNode(node);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_NODE) return;

    const root = node.nodeType === Node.DOCUMENT_NODE ? node.documentElement : node;
    if (root instanceof Element) {
      TRANSLATED_ATTRIBUTES.forEach((attribute) => translateAttribute(root, attribute));
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      if (current.nodeType === Node.TEXT_NODE) {
        if (!current.parentElement?.closest("script, style")) translateTextNode(current);
      } else {
        TRANSLATED_ATTRIBUTES.forEach((attribute) => translateAttribute(current, attribute));
      }
      current = walker.nextNode();
    }
  }

  function syncSelectors() {
    document.querySelectorAll("[data-language-select]").forEach((select) => {
      select.value = language;
    });
  }

  function applyLanguage() {
    document.documentElement.lang = language;
    applyNode(document);
    syncSelectors();
  }

  function setLanguage(nextLanguage) {
    if (!SUPPORTED_LANGUAGES.has(nextLanguage) || nextLanguage === language) return;
    language = nextLanguage;
    saveLanguage();
    applyLanguage();
    listeners.forEach((listener) => listener(language));
  }

  function bindSelectors() {
    document.querySelectorAll("[data-language-select]").forEach((select) => {
      if (select.dataset.languageBound === "true") return;
      select.dataset.languageBound = "true";
      select.addEventListener("change", () => setLanguage(select.value));
    });
    syncSelectors();
  }

  function observeChanges() {
    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") translateTextNode(mutation.target);
        if (mutation.type === "attributes") translateAttribute(mutation.target, mutation.attributeName);
        mutation.addedNodes.forEach(applyNode);
      });
      bindSelectors();
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATED_ATTRIBUTES,
    });
  }

  async function loadTranslations() {
    const source = document.body?.dataset.translations || "translations.json";
    try {
      const response = await global.fetch(source, { cache: "no-store" });
      if (!response.ok) throw new Error(`Translation request failed with ${response.status}`);
      translations = normalizeTranslations(await response.json());
    } catch (error) {
      console.warn("Interface translations could not be loaded.", error);
    }
    bindSelectors();
    applyLanguage();
    observeChanges();
    return language;
  }

  const ready = document.readyState === "loading"
    ? new Promise((resolve) => document.addEventListener("DOMContentLoaded", () => resolve(loadTranslations()), { once: true }))
    : loadTranslations();

  global.GameLanguage = Object.freeze({
    getLanguage: () => language,
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    ready,
    setLanguage,
    translate,
  });
}(window));
