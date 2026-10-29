// Bind static, local configuration only. No remote content or cached settings.
import { CONTACT, contactLink } from './config.js';
import { t } from './i18n.js';

const formatPhone = (phone) => phone.startsWith('+30') && phone.length === 13
  ? phone.slice(3).replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
  : phone;

export function applyContactConfig() {
  const values = {
    phone: formatPhone(CONTACT.phone),
    'emergency-phone': formatPhone(CONTACT.emergencyPhone),
    email: CONTACT.email
  };
  document.querySelectorAll('[data-bind]').forEach((node) => {
    const value = values[node.dataset.bind];
    if (value !== undefined) node.textContent = value;
  });
  document.querySelectorAll('[data-bind-href], [data-contact]').forEach((node) => {
    const key = node.dataset.contact || node.dataset.bindHref;
    const href = key === 'email' ? `mailto:${CONTACT.email}`
      : key === 'map' ? CONTACT.endpoints.map + encodeURIComponent(CONTACT.mapQuery)
      : contactLink(key);
    node.setAttribute('href', href);
  });
  // Keep the existing structured data consistent with the configured phone/name.
  const schema = document.querySelector('script[type="application/ld+json"]');
  if (schema) {
    try {
      const data = JSON.parse(schema.textContent);
      data.name = t('business.name');
      data.telephone = CONTACT.phone;
      schema.textContent = JSON.stringify(data);
    } catch { /* malformed optional metadata must not stop contact links */ }
  }
}
