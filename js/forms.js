// The form prepares a message locally. The visitor sends it inside the chosen app.
import { SERVICE_IDS, contactLink } from './config.js';
import { t } from './i18n.js';
import { $, $$ } from './ui.js';

const trim = (value) => String(value ?? '').trim();
const inRange = (value, min, max) => value.length >= min && value.length <= max;

export function normalizePhone(value) {
  let phone = trim(value).replace(/[\s().-]/g, '');
  if (phone.startsWith('00')) phone = `+${phone.slice(2)}`;
  if (/^(?:69\d{8}|2\d{9})$/.test(phone)) phone = `+30${phone}`;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) return null;
  if (phone.startsWith('+30') && !/^\+30(?:69\d{8}|2\d{9})$/.test(phone)) return null;
  return phone;
}

function readForm(form) {
  const data = Object.fromEntries(new FormData(form));
  return {
    name: trim(data.name), phone: normalizePhone(data.phone), area: trim(data.area),
    serviceType: trim(data.serviceType), notes: trim(data.notes)
  };
}

export function formatMessage(data, kind = 'quote') {
  return [
    t(kind === 'contact' ? 'message.contact' : 'message.quote'),
    t('message.greeting'), '',
    `${t('form.name')}: ${data.name}`,
    `${t('form.phone')}: ${data.phone || ''}`,
    `${t('form.area')}: ${data.area}`,
    `${t('form.service')}: ${SERVICE_IDS.includes(data.serviceType) ? t(`service.${data.serviceType}`) : ''}`,
    `${t('form.notes')}: ${data.notes}`
  ].join('\n');
}

function showError(form, name, key = '') {
  const input = form.elements.namedItem(name);
  if (!input) return;
  const slot = document.getElementById(input.getAttribute('aria-describedby'));
  if (key) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
  if (slot) {
    if (key) slot.dataset.i18n = key;
    else delete slot.dataset.i18n;
    slot.textContent = key ? t(key) : '';
  }
}

function validate(form, focus = true) {
  const data = readForm(form);
  const errors = {
    name: !inRange(data.name, 2, 100), phone: !data.phone,
    area: !inRange(data.area, 2, 200), serviceType: !SERVICE_IDS.includes(data.serviceType),
    notes: !inRange(data.notes, 5, 2000)
  };
  Object.entries(errors).forEach(([name, invalid]) => showError(form, name, invalid ? `error.${name}` : ''));
  const first = Object.keys(errors).find((name) => errors[name]);
  if (first && focus) form.elements.namedItem(first)?.focus();
  return !first;
}

function status(form, key) {
  const node = $('[data-form-status]', form);
  node.dataset.i18n = key;
  node.textContent = t(key);
}

function refreshMessage(form) {
  const message = formatMessage(readForm(form), form.id === 'contact-form' ? 'contact' : 'quote');
  $('[data-message-preview]', form).value = message;
  $('[data-open-whatsapp]', form).href = contactLink('whatsapp', message);
  $('[data-open-viber]', form).href = contactLink('viber');
  return message;
}

async function copyMessage(form) {
  const preview = $('[data-message-preview]', form);
  refreshMessage(form);
  try {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(preview.value);
    status(form, 'feedback.copied');
  } catch {
    // Works without Clipboard permission and on ordinary HTTP hosting.
    preview.focus();
    preview.select();
    status(form, 'feedback.copyFailed');
  }
}

export function initForms() {
  $$('#quote-form, #contact-form').forEach((form) => {
    // Static markup keeps submission disabled until its local handler is ready.
    $$('button[type="submit"]', form).forEach((button) => { button.disabled = false; });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!validate(form)) return;
      const channel = event.submitter?.value === 'viber' ? 'viber' : 'whatsapp';
      const message = refreshMessage(form);
      $('[data-message-panel]', form).hidden = false;
      status(form, `feedback.${channel}`);
      // Synchronous navigation preserves the user gesture. No network submission,
      // no reset, and no claim that a message has been delivered.
      if (channel === 'whatsapp') window.open(contactLink(channel, message), '_blank', 'noopener,noreferrer');
      else window.location.href = contactLink('viber');
    });
    $('[data-copy-message]', form).addEventListener('click', () => { copyMessage(form); });
    $$('[data-open-whatsapp], [data-open-viber]', form).forEach((link) => {
      link.addEventListener('click', (event) => {
        if (!validate(form)) { event.preventDefault(); return; }
        refreshMessage(form);
      });
    });
    form.addEventListener('input', (event) => {
      if (event.target.name) showError(form, event.target.name);
      if (!$('[data-message-panel]', form).hidden) refreshMessage(form);
    });
    document.addEventListener('languagechange', () => {
      if (!$('[data-message-panel]', form).hidden) refreshMessage(form);
    });
  });
  // Service ids are language-independent, so a switch never loses the choice.
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-service]');
    const select = $('#q-service');
    if (!trigger || !select) return;
    select.value = SERVICE_IDS.includes(trigger.dataset.service) ? trigger.dataset.service : 'other';
    select.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
