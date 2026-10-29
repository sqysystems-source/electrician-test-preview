// Entry point: UI behaviours first, Firestore hydration in the background.
import { $, $$, initModal } from './ui.js';
import { initForms } from './forms.js';
import { applyCachedSettings, initAnnouncementDismiss, startHydration } from './hydrate.js';

function initNav() {
  const toggle = $('.nav-toggle');
  const nav = $('#primary-nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

function boot() {
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  initNav();
  initModal();
  initForms();
  initAnnouncementDismiss();
  applyCachedSettings();

  // Connect to Firestore only once the browser is idle, so first paint is never delayed.
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 300));
  idle(() => startHydration(), { timeout: 2500 });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
