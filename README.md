# Electrician Site — Firestore-ready (SQySystems Admin compatible)

Static HTML/CSS/vanilla-JS site with background Firestore hydration. No build step, no frameworks.
The page works fully without Firebase; Firestore only overrides content that exists.

## Structure

```
index.html            Static Greek baseline (SEO, JSON-LD, all content)
privacy.html          Privacy policy template (edit before launch)
404.html              Not-found page
css/styles.css        Mobile-first styles
js/config.js          Firebase config + collection names  ← edit this
js/firebase.js        Lazy SDK loader (Firebase v10.14.1 modular, via gstatic CDN)
js/hydrate.js         settings/site_info + site_items hydration (onSnapshot)
js/forms.js           leads + messages submission, validation, honeypot
js/ui.js              toast, modal, loading state
js/app.js             entry point
vercel.json           cleanUrls, security headers, cache, CORS
firestore.rules       Security rules (deploy to the client's project)
firebase.json / firestore.indexes.json   For `firebase deploy --only firestore`
```

## Setup

1. **Firebase project**: create one, enable Firestore (Native mode), add a Web app, and paste the config into `js/config.js`.
2. **Rules**: `firebase deploy --only firestore:rules` (or paste `firestore.rules` into the console).
3. **Placeholders to replace** in `index.html` / `privacy.html` / `sitemap.xml` / `robots.txt`:
   business name, phone `+306970000000`, emergency phone `+306970000001`, address, hours, license number,
   email, canonical/OG URLs (`https://www.example.gr`), JSON-LD block. Also review the marketing claims
   (e.g. "Εγγύηση εργασιών") so they match what the business really offers.
4. **Local dev**: serve the folder root on port 5500 (e.g. VS Code Live Server). Paths are root-absolute (`/css/...`).
5. **Deploy**: import the folder into Vercel (framework preset: Other, no build command).

## Firestore data model (for the Admin Panel)

### `settings/site_info` (single doc, public read)
| field | type | binds to |
|---|---|---|
| `businessName` | string | `[data-bind="business-name"]` |
| `phone` | string | `[data-bind="phone"]` + `tel:` links (`data-bind-href="phone"`) |
| `emergencyPhone` | string | `[data-bind="emergency-phone"]` + `tel:` links |
| `address` | string | `[data-bind="address"]` + Google Maps link |
| `hours` | string (lines separated by `\n`) or string[] | `[data-bind="hours"]`; first line → `hours-short` |
| `email` | string | `[data-bind="email"]` + `mailto:` |
| `license` | string | `[data-bind="license"]` |
| `announcement` | `{ active: boolean, text: string }` | floating banner (`announcementActive` / `announcementText` flat fields also work) |

Only fields that exist and are non-empty override the static HTML. The last known settings are cached in
`localStorage` for instant repeat visits. The announcement banner is a fixed overlay, so toggling it never shifts layout.

### `site_items` (public read only when `active == true`)
| field | type | notes |
|---|---|---|
| `title` | string | required |
| `description` | string | |
| `iconOrImageUrl` | string | `https://…` image, or icon name (`zap`, `wrench`, `shield`, `file-check`, `home`, `sprout`, `power`, `lightbulb`), or a short emoji |
| `category` | string | `"portfolio"` → shown in the Portfolio section (hidden until it has items); anything else → Services grid |
| `active` | boolean | must be `true` to be visible |
| `order` | number (optional) | ascending sort; ties sorted by title |

If at least one active non-portfolio item exists, it replaces the static service cards. If none exist, the static cards stay.

### `leads` (public create, admin read/update/delete)
`clientName, phone (+30 69XXXXXXXX), area, serviceType, notes, status ("new"|"in_progress"|"completed"|"archived"), createdAt (server timestamp), source ("website_quote_form")`

### `messages` (public create, admin read/update/delete)
`name, email, subject, message, status ("unread"), createdAt (server timestamp), source ("website_contact_form")`

## Admin role

The rules expect a custom claim `role: "admin"`. Set it once with the Admin SDK (Node):

```js
import { getAuth } from 'firebase-admin/auth';
await getAuth().setCustomUserClaims('<ADMIN_UID>', { role: 'admin' });
```

## Notes & deliberate deviations from the brief

- **Rules are stricter than `allow create: if true`**: public creates must match the exact field set, sizes,
  `status`, `source` and `createdAt == request.time`, so the open endpoint can't be used to store arbitrary junk.
  If the Admin Panel ever needs to create leads from the client side with extra fields, extend `validLead()`.
- **Forms**: honeypot field, 30 s cooldown per form, GDPR consent checkbox, 15 s server-ack timeout with a
  "call us" fallback message. If Firebase isn't configured, forms show that fallback message instead of failing silently.
- **CORS on Vercel**: static hosting can't echo the Origin dynamically, so `vercel.json` has one `has: origin`
  rule per allowed origin (`sqysystems.com`, `www.sqysystems.com`, `localhost:5500`). Vercel doesn't guarantee
  custom handling of preflight `OPTIONS` for static files; for real API endpoints add an `/api` function that answers `OPTIONS`.
  Remove the `localhost:5500` block before launch if you don't want it in production.
- **CSP** allows only `self` + `gstatic.com` scripts and Firestore connections; no inline scripts/styles are used.
  If you add Google Fonts, analytics or a map embed, extend the policy in `vercel.json`.
- **Caching**: CSS/JS use 1 day + stale-while-revalidate (files aren't hashed). Put versioned images under `/assets/` for 1-year immutable caching.
- No `og:image` is set because none is bundled; add a 1200×630 JPG under `/assets/` and an `og:image` meta tag.
