// Small DOM / feedback helpers (toast, modal, loading state).

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function toast(message, type = 'info', ms = 5500) {
  const region = $('#toast-region');
  if (!region) return;

  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.textContent = message;
  region.append(el);

  requestAnimationFrame(() => el.classList.add('is-visible'));
  setTimeout(() => {
    el.classList.remove('is-visible');
    setTimeout(() => el.remove(), 300);
  }, ms);
}

export function showModal(title, text) {
  const dialog = $('#success-modal');
  if (!dialog) return toast(text, 'success');

  $('#modal-title', dialog).textContent = title;
  $('#modal-text', dialog).textContent = text;

  if (typeof dialog.showModal === 'function') {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }
  $('[data-close-modal]', dialog)?.focus();
}

export function initModal() {
  const dialog = $('#success-modal');
  if (!dialog) return;
  const close = () => (dialog.close ? dialog.close() : dialog.removeAttribute('open'));

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('[data-close-modal]')) close();
  });
}

export function setLoading(form, loading) {
  const btn = $('button[type="submit"]', form);
  form.classList.toggle('is-busy', loading);
  form.dataset.busy = loading ? '1' : '';
  form.setAttribute('aria-busy', String(loading));

  $$('input, select, textarea, button', form).forEach((el) => { el.disabled = loading; });
  if (btn) btn.classList.toggle('is-loading', loading);
}
