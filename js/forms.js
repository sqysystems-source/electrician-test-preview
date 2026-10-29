// Lead (quote) and contact form handling → Firestore `leads` / `messages`.
import { loadFirebase } from './firebase.js';
import { COLLECTIONS, SUBMIT_TIMEOUT_MS, COOLDOWN_MS } from './config.js';
import { $, $$, toast, showModal, setLoading } from './ui.js';

const GREEK_MOBILE = /^(?:\+30|0030)?(69\d{8})$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const trim = (v) => String(v ?? '').trim();
const len = (v, min, max) => v.length >= min && v.length <= max;

function normalizeMobile(value) {
  const m = GREEK_MOBILE.exec(trim(value).replace(/[\s().-]/g, ''));
  return m ? `+30${m[1]}` : null;
}

/* --------------------------- form definitions --------------------------- */

const FORMS = {
  'quote-form': {
    collection: COLLECTIONS.leads,
    successTitle: 'Ευχαριστούμε!',
    successText: 'Το αίτημά σας εστάλη. Θα επικοινωνήσουμε μαζί σας το συντομότερο δυνατό.',
    prepare(data, form) {
      const errors = {};
      const clientName = trim(data.clientName);
      const area = trim(data.area);
      const serviceType = trim(data.serviceType);
      const notes = trim(data.notes);
      const phone = normalizeMobile(data.phone);
      const allowed = $$('select[name="serviceType"] option', form).map((o) => o.value).filter(Boolean);

      if (!len(clientName, 2, 100)) errors.clientName = 'Συμπληρώστε το ονοματεπώνυμό σας.';
      if (!phone) errors.phone = 'Εισάγετε έγκυρο ελληνικό κινητό (π.χ. 69X XXX XXXX).';
      if (!len(area, 2, 100)) errors.area = 'Συμπληρώστε την περιοχή σας.';
      if (!allowed.includes(serviceType)) errors.serviceType = 'Επιλέξτε είδος εργασίας.';
      if (notes.length > 2000) errors.notes = 'Το κείμενο είναι πολύ μεγάλο (έως 2000 χαρακτήρες).';
      if (!data.consent) errors.consent = 'Απαιτείται η συγκατάθεσή σας.';

      return {
        errors,
        payload: { clientName, phone, area, serviceType, notes, status: 'new', source: 'website_quote_form' }
      };
    }
  },

  'contact-form': {
    collection: COLLECTIONS.messages,
    successTitle: 'Το μήνυμα στάλθηκε',
    successText: 'Ευχαριστούμε για την επικοινωνία. Θα σας απαντήσουμε σύντομα.',
    prepare(data) {
      const errors = {};
      const name = trim(data.name);
      const email = trim(data.email);
      const subject = trim(data.subject);
      const message = trim(data.message);

      if (!len(name, 2, 100)) errors.name = 'Συμπληρώστε το όνομά σας.';
      if (!EMAIL.test(email) || email.length > 200) errors.email = 'Εισάγετε έγκυρη διεύθυνση email.';
      if (!len(subject, 2, 150)) errors.subject = 'Συμπληρώστε το θέμα.';
      if (!len(message, 5, 3000)) errors.message = 'Γράψτε το μήνυμά σας (5–3000 χαρακτήρες).';
      if (!data.consent) errors.consent = 'Απαιτείται η συγκατάθεσή σας.';

      return {
        errors,
        payload: { name, email, subject, message, status: 'unread', source: 'website_contact_form' }
      };
    }
  }
};

/* ------------------------------- helpers ------------------------------- */

function showErrors(form, errors) {
  $$('.field__error', form).forEach((p) => { p.textContent = ''; });
  $$('[aria-invalid]', form).forEach((i) => i.removeAttribute('aria-invalid'));

  let first = null;
  Object.entries(errors).forEach(([name, msg]) => {
    const input = form.elements[name];
    if (!input) return;
    input.setAttribute('aria-invalid', 'true');
    const id = input.getAttribute('aria-describedby');
    const slot = id ? document.getElementById(id) : null;
    if (slot) slot.textContent = msg;
    first = first || input;
  });
  first?.focus();
  return Boolean(first);
}

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

function cooldownActive(key) {
  try { return Date.now() - Number(localStorage.getItem(key) || 0) < COOLDOWN_MS; } catch { return false; }
}
function markSent(key) {
  try { localStorage.setItem(key, String(Date.now())); } catch { /* ignore */ }
}

function fallbackPhoneText() {
  const phone = $('[data-bind="phone"]')?.textContent?.trim();
  return phone ? ` Παρακαλούμε καλέστε μας στο ${phone}.` : '';
}

/* ------------------------------- submission ------------------------------- */

async function handleSubmit(form, cfg) {
  if (form.dataset.busy === '1') return;

  const data = Object.fromEntries(new FormData(form));
  data.consent = form.elements.consent?.checked || false;

  // Honeypot: bots fill the hidden field. Pretend success, store nothing.
  if (trim(data.website)) {
    form.reset();
    showModal(cfg.successTitle, cfg.successText);
    return;
  }

  const { errors, payload } = cfg.prepare(data, form);
  if (showErrors(form, errors)) return;

  const cooldownKey = `sqy:last:${cfg.collection}`;
  if (cooldownActive(cooldownKey)) {
    toast('Έχετε ήδη στείλει αίτημα πριν από λίγο. Παρακαλούμε περιμένετε λίγο.', 'info');
    return;
  }

  setLoading(form, true);
  try {
    const fb = await loadFirebase();
    if (!fb) throw new Error('unavailable');

    const { collection, addDoc, serverTimestamp } = fb.fs;
    await withTimeout(
      addDoc(collection(fb.db, cfg.collection), { ...payload, createdAt: serverTimestamp() }),
      SUBMIT_TIMEOUT_MS
    );

    markSent(cooldownKey);
    setLoading(form, false);
    form.reset();
    showErrors(form, {});
    showModal(cfg.successTitle, cfg.successText);
    toast('Εστάλη με επιτυχία ✔', 'success', 3500);
  } catch (err) {
    setLoading(form, false);
    const msg = err?.message === 'timeout'
      ? 'Δεν λάβαμε επιβεβαίωση αποστολής.'
      : 'Δεν ήταν δυνατή η αποστολή αυτή τη στιγμή.';
    toast(msg + fallbackPhoneText(), 'error', 8000);
  }
}

export function initForms() {
  Object.entries(FORMS).forEach(([id, cfg]) => {
    const form = document.getElementById(id);
    if (!form) return;

    form.addEventListener('submit', (e) => { e.preventDefault(); handleSubmit(form, cfg); });
    form.addEventListener('focusin', () => { loadFirebase(); }, { once: true }); // warm up the SDK
  });

  // Prefill the service dropdown from "Ζητήστε προσφορά" links on service cards.
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-service]');
    const select = document.getElementById('q-service');
    if (!trigger || !select) return;

    const wanted = trigger.dataset.service;
    const match = Array.from(select.options).find((o) => o.value === wanted);
    if (match) {
      select.value = wanted;
    } else {
      select.value = 'Άλλο';
      const notes = document.getElementById('q-notes');
      if (notes && !notes.value.trim()) notes.value = `Ενδιαφέρομαι για: ${wanted}`;
    }
  });
}
