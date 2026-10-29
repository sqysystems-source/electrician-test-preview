// Firestore hydration: settings/site_info + site_items.
// The static HTML is always the baseline; Firestore only overrides what exists.
// Every failure path is silent and leaves the static content untouched.
import { loadFirebase } from './firebase.js';
import { COLLECTIONS } from './config.js';
import { $, $$ } from './ui.js';

const CACHE_KEY = 'sqy:site_info:v1';
const BANNER_KEY = 'sqy:banner-dismissed';
const KNOWN_FIELDS = [
  'businessName', 'phone', 'emergencyPhone', 'address', 'hours', 'email', 'license',
  'announcement', 'announcementActive', 'announcementText'
];

/* ------------------------------ helpers ------------------------------ */

function toTel(value) {
  const s = String(value).replace(/[^\d+]/g, '');
  if (s.startsWith('+')) return s;
  if (s.startsWith('00')) return `+${s.slice(2)}`;
  if (/^(69\d{8}|2\d{9})$/.test(s)) return `+30${s}`;
  return s;
}

const hasValue = (v) => v !== undefined && v !== null && String(v).trim() !== '';

function bindText(key, value) {
  if (!hasValue(value)) return;
  const text = String(value);
  $$(`[data-bind="${key}"]`).forEach((el) => {
    if (el.textContent !== text) el.textContent = text;
  });
}

function bindHref(key, href) {
  $$(`[data-bind-href="${key}"]`).forEach((el) => {
    if (el.getAttribute('href') !== href) el.setAttribute('href', href);
  });
}

function safeUrl(value) {
  const v = String(value || '').trim();
  if (!/^(https:\/\/|\/(?!\/))/.test(v)) return null; // https or same-site path only
  try {
    const u = new URL(v, location.origin);
    return u.protocol === 'https:' || u.origin === location.origin ? u.href : null;
  } catch {
    return null;
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

/* --------------------------- site_info (settings) --------------------------- */

function applyAnnouncement(info) {
  const box = $('#announcement');
  if (!box) return;

  const a = info.announcement && typeof info.announcement === 'object'
    ? info.announcement
    : { active: info.announcementActive, text: info.announcementText };

  const text = hasValue(a.text) ? String(a.text).trim() : '';
  let dismissed = false;
  try { dismissed = sessionStorage.getItem(BANNER_KEY) === text; } catch { /* ignore */ }

  const show = a.active === true && text !== '' && !dismissed;
  bindText('announcement-text', text);
  box.hidden = !show;
}

export function applySettings(info = {}) {
  bindText('business-name', info.businessName);

  if (hasValue(info.phone)) {
    bindText('phone', info.phone);
    bindHref('phone', `tel:${toTel(info.phone)}`);
  }
  if (hasValue(info.emergencyPhone)) {
    bindText('emergency-phone', info.emergencyPhone);
    bindHref('emergency-phone', `tel:${toTel(info.emergencyPhone)}`);
  }
  if (hasValue(info.address)) {
    bindText('address', info.address);
    bindHref('map', `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.address)}`);
  }
  if (hasValue(info.hours) || (Array.isArray(info.hours) && info.hours.length)) {
    const lines = Array.isArray(info.hours) ? info.hours.map(String) : String(info.hours).split(/\r?\n/);
    bindText('hours', lines.join('\n'));
    bindText('hours-short', lines[0]);
  }
  if (hasValue(info.email)) {
    bindText('email', info.email);
    bindHref('email', `mailto:${info.email}`);
  }
  bindText('license', info.license);

  applyAnnouncement(info);
}

/** Apply last known settings synchronously on boot (avoids flashes on repeat visits). */
export function applyCachedSettings() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) applySettings(JSON.parse(raw));
  } catch { /* ignore corrupt cache */ }
}

function cacheSettings(data) {
  try {
    const picked = {};
    KNOWN_FIELDS.forEach((k) => { if (data[k] !== undefined) picked[k] = data[k]; });
    localStorage.setItem(CACHE_KEY, JSON.stringify(picked));
  } catch { /* storage may be unavailable */ }
}

export function initAnnouncementDismiss() {
  $('#announcement .announcement__close')?.addEventListener('click', () => {
    const box = $('#announcement');
    try { sessionStorage.setItem(BANNER_KEY, ($('[data-bind="announcement-text"]', box)?.textContent || '').trim()); } catch { /* ignore */ }
    box.hidden = true;
  });
}

/* ------------------------------ site_items ------------------------------ */

function iconNode(value) {
  const v = String(value || '').trim();
  const wrap = el('span', 'card__icon');
  wrap.setAttribute('aria-hidden', 'true');

  const url = safeUrl(v);
  if (url) {
    const img = document.createElement('img');
    img.src = url; img.alt = ''; img.width = 52; img.height = 52; img.loading = 'lazy'; img.decoding = 'async';
    wrap.append(img);
  } else if (/^[a-z0-9-]+$/i.test(v) && document.getElementById(`i-${v}`)) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'icon');
    const use = document.createElementNS(NS, 'use');
    use.setAttribute('href', `#i-${v}`);
    svg.append(use);
    wrap.append(svg);
  } else if (v && [...v].length <= 4) {
    wrap.textContent = v; // emoji / short glyph
  } else {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'icon');
    const use = document.createElementNS(NS, 'use');
    use.setAttribute('href', '#i-zap');
    svg.append(use);
    wrap.append(svg);
  }
  return wrap;
}

function serviceCard(item) {
  const card = el('article', 'card service-card');
  card.dataset.category = item.category || '';
  card.append(iconNode(item.iconOrImageUrl), el('h3', null, item.title), el('p', null, item.description || ''));

  const link = el('a', 'card__link', 'Ζητήστε προσφορά');
  link.href = '#quote';
  link.dataset.service = item.title;
  card.append(link);
  return card;
}

function portfolioCard(item) {
  const card = el('article', 'card portfolio-card');
  const url = safeUrl(item.iconOrImageUrl);
  if (url) {
    const img = document.createElement('img');
    img.className = 'portfolio-card__img';
    img.src = url; img.alt = item.title; img.width = 640; img.height = 480; img.loading = 'lazy'; img.decoding = 'async';
    card.append(img);
  }
  const body = el('div', 'portfolio-card__body');
  body.append(el('h3', null, item.title), el('p', null, item.description || ''));
  card.append(body);
  return card;
}

let staticServiceNodes = null;
let renderedKey = '';

function renderItems(rawItems) {
  const grid = $('#services-grid');
  const pSection = $('#portfolio');
  const pGrid = $('#portfolio-grid');

  if (grid && staticServiceNodes === null) {
    staticServiceNodes = Array.from(grid.childNodes).map((n) => n.cloneNode(true));
  }

  const items = rawItems
    .filter((i) => i.active === true && hasValue(i.title))
    .sort((a, b) => {
      const ao = Number.isFinite(a.order) ? a.order : 9999;
      const bo = Number.isFinite(b.order) ? b.order : 9999;
      return ao - bo || String(a.title).localeCompare(String(b.title), 'el');
    });

  const key = JSON.stringify(items.map((i) => [i.id, i.title, i.description, i.iconOrImageUrl, i.category, i.order]));
  if (key === renderedKey) return;
  renderedKey = key;

  const services = items.filter((i) => i.category !== 'portfolio');
  const portfolio = items.filter((i) => i.category === 'portfolio');

  if (grid) {
    grid.replaceChildren(
      ...(services.length ? services.map(serviceCard) : staticServiceNodes.map((n) => n.cloneNode(true)))
    );
  }
  if (pSection && pGrid) {
    pGrid.replaceChildren(...portfolio.map(portfolioCard));
    pSection.hidden = portfolio.length === 0;
  }
}

/* ------------------------------- bootstrap ------------------------------- */

export async function startHydration() {
  const fb = await loadFirebase();
  if (!fb) return; // not configured / offline → keep static content

  const { doc, collection, query, where, onSnapshot } = fb.fs;
  const silent = () => {};

  try {
    onSnapshot(
      doc(fb.db, COLLECTIONS.settings, COLLECTIONS.siteInfoDoc),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        cacheSettings(data);
        applySettings(data);
      },
      silent
    );

    onSnapshot(
      query(collection(fb.db, COLLECTIONS.items), where('active', '==', true)),
      (snap) => {
        if (snap.empty) return; // nothing dynamic yet → static defaults stay
        renderItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      silent
    );
  } catch {
    /* fall back to static content */
  }
}
