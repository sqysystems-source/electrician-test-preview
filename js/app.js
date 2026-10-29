// Dependency-free static entry point. Everything is loaded from this website.
import { initNav } from './ui.js';
import { initForms } from './forms.js';
import { initLanguage } from './i18n.js';
import { applyContactConfig } from './hydrate.js';

function boot() {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  document.addEventListener('languagechange', applyContactConfig);
  initLanguage();
  initNav();
  initForms();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
