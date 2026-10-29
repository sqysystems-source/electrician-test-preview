# Validation

Passed development checks:

- `node tests/validate.mjs` (Node 22+, no packages needed): both dictionaries have
  matching keys, every HTML marker resolves in both languages, service ids have
  translations, phone validation accepts Greek mobile/landline and international
  formats, messages round-trip through URL encoding, obsolete files are absent,
  all application imports are local, and the static security policy has no remote
  connection/dashboard permissions.
- HTML checks: no duplicate ids, every form label/error reference resolves, and
  in-page link targets exist.
- Automated Chromium integration checks against the actual static files with
  `vercel.json` security headers applied: first-visit Greek, English persistence
  after reload, title/metadata/placeholder/validation translation, both forms,
  retained values and stable service selection, service-card prefilling, encoded
  Greek/English WhatsApp messages including special characters and newlines,
  Viber URI/preview, successful and denied clipboard access, invalid/inaccessible
  language storage, privacy/404 pages, and JavaScript-disabled fallback.
- Responsive browser checks in both languages at 320, 375, 768, 1024, 1200 and
  1440 px: no horizontal overflow; mobile navigation and Escape behavior work.
  Desktop/mobile screenshots were inspected for the existing visual design.
- No console/runtime errors or third-party HTTP requests while rendering and
  interacting locally. Tests intercepted WhatsApp window opening and attempted
  the Viber URI without sending any message.

Limits: desktop automation cannot confirm a real phone's installed-app handling,
recipient registration or message delivery. Test WhatsApp, Viber and calls on the
client's phone after replacing the original sample contact numbers.
