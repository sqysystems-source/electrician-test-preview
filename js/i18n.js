import { LANGUAGE, TRANSLATIONS } from './config.js';

let language = LANGUAGE.default;
export const getLanguage = () => language;
export const t = (key) => TRANSLATIONS[language][key] ?? TRANSLATIONS[LANGUAGE.default][key] ?? key;

function applyTranslations() {
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  ['aria-label', 'placeholder', 'content', 'title'].forEach((attribute) => {
    document.querySelectorAll(`[data-i18n-${attribute}]`).forEach((node) => {
      node.setAttribute(attribute, t(node.getAttribute(`data-i18n-${attribute}`)));
    });
  });
  document.querySelectorAll('[data-language]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  });
  document.querySelector('meta[property="og:locale"]')?.setAttribute('content', language === 'el' ? 'el_GR' : 'en_GB');
}

export function setLanguage(next, persist = true) {
  language = LANGUAGE.supported.includes(next) ? next : LANGUAGE.default;
  if (persist) {
    try { localStorage.setItem(LANGUAGE.storageKey, language); } catch { /* private/restricted storage */ }
  }
  applyTranslations();
  document.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
}

export function initLanguage() {
  let saved = LANGUAGE.default;
  try { saved = localStorage.getItem(LANGUAGE.storageKey) || saved; } catch { /* Greek remains the default */ }
  setLanguage(saved, false);
  document.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => {
      setLanguage(button.dataset.language);
    });
  });
}
