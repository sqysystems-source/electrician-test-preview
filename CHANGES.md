# Changes

- Replaced SDK loading, remote settings/content hydration and form writes with
  local configuration and direct phone, WhatsApp and Viber links.
- Added complete Greek/English dictionaries in `js/config.js`, semantic HTML
  translation markers and `js/i18n.js`. Greek is the initial language; explicit
  selections persist with safe handling of unavailable storage.
- Updated both forms to collect name, phone, area/address, service and issue;
  added translated validation, app handoff, message preview and clipboard/manual
  copy fallback. Forms retain entered data and never claim confirmed delivery.
- Added an accessible header language selector and branded mobile phone /
  WhatsApp / Viber shortcuts; retained service cards, FAQ and the original design.
- Replaced the outdated privacy page and translated it and the 404 page.
- Removed dashboard CORS settings and external SDK/connection permissions from
  `vercel.json`. JS/CSS now revalidate to avoid long-lived stale module imports.
- Made page and asset paths relative for static hosting under a subdirectory.
- Removed the four paths in `DELETED_FILES.txt`. Apply those deletions manually
  when overlaying this ZIP onto the original project.

See `DEPLOYMENT.md` for setup and `VALIDATION.md` for the checks performed.
