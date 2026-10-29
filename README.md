# Electrician website — static Greek / English

HTML, CSS and browser-native JavaScript modules. No build, package installation,
server, database, authentication, dashboard, environment variables or SDKs.

## Configure

Edit `js/config.js`:

- `primaryPhone`: the real main phone in international format, for example `+30…`.
  Phone, WhatsApp and Viber use it by default. Override `whatsappPhone` or
  `viberPhone` if those accounts use different numbers.
- `CONTACT.emergencyPhone`, `CONTACT.email`, `CONTACT.mapQuery`.
- `TRANSLATIONS.el` and `TRANSLATIONS.en`: business name, address, hours, licence,
  all page content, field labels, validation and message headings.
- `CONTACT.endpoints`: all telephone and messaging URL schemes.

**The supplied phone numbers, email, street address, licence number and domain
are examples from the original project. Replace them before launch.** Confirm
that the real WhatsApp and Viber accounts are registered to the configured numbers.
The configured values override every bound visible number, contact link and the
structured-data telephone. Also update Greek HTML fallback text and `tel:` links
if you need the real business details available with JavaScript disabled.

Keep static Greek fallback content in sync when changing copy. Set the real
canonical and Open Graph URLs and structured-data address in `index.html`, and
the real domain in the existing `sitemap.xml` and `robots.txt`.

## Language

Greek is rendered directly in HTML and is the first-visit default regardless of
browser language. The `ΕΛ | EN` header buttons switch all copy without reloading,
including privacy/404 pages, labels, placeholders, errors, metadata, and prepared
messages. They update `html[lang]` and their `aria-pressed` state. Only the explicit
selection is stored under `electrician:language:v1`. Invalid or inaccessible
storage safely falls back to Greek. Form values and selected service survive a
language switch; service ids are independent of their translated labels.

This is a single-URL client-side translation design: Greek is the initial HTML
seen by crawlers. Separate indexable English routes/hreflang are not included.

## Contact forms

Both forms require name, phone, area/address, service and issue description.
Greek mobile/landline numbers and international numbers with a `+` country code
are accepted. Messages are formatted in the currently selected language.

- **WhatsApp** opens `https://wa.me/<digits>?text=<encoded message>` in a new tab.
  The visitor still has to press Send inside WhatsApp. A persistent preview and
  direct link are available if a popup is blocked.
- **Viber** opens `viber://chat?number=%2B<digits>`. The message stays visible in
  the page; use **Copy message**, open Viber and paste it into the chat. The
  personal-number chat link does not provide a documented draft parameter.
  Viber's documented prefilled business links require a registered Business
  account; this project does not assume the client has one.
- If copying is unavailable or denied, the text is selected for manual copying.
- No form data is stored, posted to the host, or marked as delivered. Fields stay
  filled so the visitor can retry. App launch/delivery cannot be detected by the
  site; confirm real-device handoff with the client's real accounts before launch.
- Header/emergency phone links, desktop messaging buttons and the three-button
  mobile contact bar work independently of form validation.

## Files

`index.html`, `privacy.html`, `404.html`, `css/styles.css`, `js/config.js`,
`js/i18n.js`, `js/forms.js`, `js/ui.js`, `js/hydrate.js`, `js/app.js`.
`hydrate.js` now only binds local config. All resources needed to render the site
are local. Third-party requests happen only when a visitor follows an external
contact/map link.

## Run / deploy

See `DEPLOYMENT.md` for applying the changed-files ZIP and removing obsolete files.
For local use run `python3 -m http.server 5500` at the project root, then visit
`http://localhost:5500`. Use HTTP/HTTPS, not `file://`, for ES modules.

Optional development checks (Node 22+): `node tests/validate.mjs`.
These checks are not needed for hosting.

Official messaging references:

- https://faq.whatsapp.com/425247423114725/
- https://help.viber.com/hc/en-us/articles/36712478644381-Get-your-Viber-chat-link-and-QR-code-for-Business-accounts
