// Optional development checks: node tests/validate.mjs (Node 22+). No packages.
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { CONTACT, LANGUAGE, SERVICE_IDS, TRANSLATIONS, contactLink } from '../js/config.js';
import { normalizePhone, formatMessage } from '../js/forms.js';
import { setLanguage, getLanguage } from '../js/i18n.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
for (const file of ['firebase.json', 'firestore.rules', 'firestore.indexes.json', 'js/firebase.js']) {
  assert.equal(existsSync(resolve(root, file)), false, `Remove obsolete file: ${file}`);
}
assert.equal(LANGUAGE.default, 'el');
assert.deepEqual(Object.keys(TRANSLATIONS.el).sort(), Object.keys(TRANSLATIONS.en).sort());
for (const lang of LANGUAGE.supported) {
  for (const id of SERVICE_IDS) assert.ok(TRANSLATIONS[lang][`service.${id}`]);
}
for (const filename of ['index.html', 'privacy.html', '404.html']) {
  const source = readFileSync(resolve(root, filename), 'utf8');
  assert.match(source, /<html lang="el">/);
  for (const match of source.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)) {
    for (const lang of LANGUAGE.supported) assert.ok(TRANSLATIONS[lang][match[1]], `${filename}: ${match[1]}`);
  }
  assert.doesNotMatch(source, /gstatic\.com|firestore|firebase/i);
}
for (const filename of readdirSync(resolve(root, 'js')).filter((name) => name.endsWith('.js'))) {
  const source = readFileSync(resolve(root, 'js', filename), 'utf8');
  assert.doesNotMatch(source, /firebase|firestore|onSnapshot|addDoc|XMLHttpRequest|\bfetch\s*\(/i);
  for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    assert.ok(match[1].startsWith('./'));
    assert.ok(existsSync(resolve(root, 'js', match[1])));
  }
}
for (const [input, expected] of [
  ['697 123 4567', '+306971234567'], ['0030 697 123 4567', '+306971234567'],
  ['+30 (2410) 123-456', '+302410123456'], ['+44 7700 900123', '+447700900123'],
  ['', null], ['abc6971234567', null], ['123', null], ['+3069123', null], ['69712345678', null]
]) assert.equal(normalizePhone(input), expected, input);

// Isolate language-dependent formatting from browser-only DOM integration.
const savedDocument = globalThis.document;
globalThis.document = { documentElement: {}, querySelectorAll: () => [], querySelector: () => null, dispatchEvent: () => {} };
const sample = { name: 'Alex & <Test>', phone: '+447700900123', area: 'Street 5 & 7', serviceType: 'lighting', notes: 'Issue #1 + ? = &\nPlease call.' };
for (const lang of ['el', 'en']) {
  setLanguage(lang, false);
  const message = formatMessage(sample);
  assert.match(message, lang === 'el' ? /Ονοματεπώνυμο/ : /Full name/);
  assert.ok(message.includes(TRANSLATIONS[lang]['service.lighting']));
  const link = new URL(contactLink('whatsapp', message));
  assert.equal(link.hostname, 'wa.me');
  assert.equal(link.pathname, `/${CONTACT.whatsappPhone.replace(/\D/g, '')}`);
  assert.equal(link.searchParams.get('text'), message);
  assert.ok(formatMessage(sample, 'contact').startsWith(TRANSLATIONS[lang]['message.contact']));
}
setLanguage('unsupported', false);
assert.equal(getLanguage(), 'el');
globalThis.document = savedDocument;
assert.equal(contactLink('viber'), CONTACT.endpoints.viber + encodeURIComponent(CONTACT.viberPhone));
assert.equal(contactLink('phone'), `tel:${CONTACT.phone}`);
assert.equal(contactLink('emergency-phone'), `tel:${CONTACT.emergencyPhone}`);
const hosting = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));
const security = hosting.headers.flatMap((item) => item.headers);
assert.ok(security.some((item) => item.key === 'Content-Security-Policy' && item.value.includes("connect-src 'none'")));
assert.equal(security.some((item) => item.key.startsWith('Access-Control-')), false);
console.log('PASS: translation coverage, local module graph, removed legacy files, phone validation, bilingual message encoding and hosting policy.');
