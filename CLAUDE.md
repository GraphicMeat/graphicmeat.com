# graphicmeat.com

Umbrella site for the GraphicMeat product studio. Express server (`app.js`) serving static pages from `public/` (home `index.html`, `/contact`, `/photobooks`, `/subscribed`) plus API routes for the contact form and newsletter signup. Deploys to a self-managed **Hetzner VPS** over SSH (own Node process behind nginx; own MariaDB/MySQL). Shared styling/scripts live in `public/site.css` + `public/site.js`.

Tagline: "Well done isn't a requirement". Est. 2013. Aesthetic: dark cyberpunk (red `#cc1028` / orange `#e8601e` / silver, Chakra Petch + Share Tech Mono, circuit canvas, corner brackets).

## Run

```bash
npm install
cp .env.example .env   # fill in Purelymail SMTP creds
npm start              # http://localhost:3000
```

## SEO is a hard requirement

**Every change to the website must keep it SEO-accessible.** Before finishing any website work, verify:

- Real content is in the **static HTML** — never rendered only by JS. Crawlers must see it without running scripts. (Product cards are hand-written `<article>` blocks for this reason; to add a product, duplicate the block in `public/index.html`.)
- Exactly one `<h1>`; sections use `<h2>`/`<h3>` in order. Don't replace headings with styled `<div>`s.
- `<title>`, meta description, `<link rel="canonical">`, `robots` meta present and accurate.
- Open Graph + Twitter Card tags present, with a valid `og:image` absolute URL.
- JSON-LD structured data (`Organization` + product `ItemList`/`SoftwareApplication`) kept in sync with on-page content.
- `public/robots.txt` and `public/sitemap.xml` updated when pages/URLs change.
- Images have `alt`, plus `width`/`height` to limit layout shift.
- Semantic landmarks (`header`/`section`/`footer`), labelled form controls, sensible `aria-*`.

## Contact form

- Email address is **never displayed** on the page (anti-harvesting). Contact happens only via the form on the `/contact` page.
- `POST /api/contact` in `app.js` sends mail via Purelymail SMTP (nodemailer) to `CONTACT_TO`.
- Spam defenses: hidden honeypot field `website`, JS time-trap (`started`), `express-rate-limit` (5 / 15 min / IP), server-side validation. No captcha.
- Works without JS (form posts and server 303-redirects to `/contact?sent=1` / `?error=`); JS upgrades to inline fetch.
- Secrets live in `.env` (gitignored) — see `.env.example`. Never commit credentials.

## Newsletter (double opt-in)

- Signup field is in the footer on every page (`#newsletter-form` → `POST /api/subscribe`). Same spam defenses as the contact form (honeypot, time-trap, rate limit, validation).
- **Double opt-in:** subscribe inserts a `pending` row with a random token (48 h expiry) and emails the subscriber a confirm link. `GET /api/subscribe/confirm?token=…` marks them `confirmed`, then emails us (`NEWSLETTER_NOTIFY`, defaults to `CONTACT_TO`) that there's a new subscriber. Users land on `/subscribed` (noindex) which shows the right message via `?pending`/`?already`/`?error`.
- **Storage:** MariaDB/MySQL via `mysql2/promise` in `db.js` (`subscribers` table, auto-created on boot). Mirrors the mail-vault-app website API. Degrades gracefully: if `DB_*` env vars are missing, `/api/subscribe` reports "not configured" instead of crashing.
- To add newsletter sending later, read confirmed rows (`status='confirmed'`) from `subscribers`.

## Deploy

Self-managed Hetzner VPS over SSH. Node app runs via a process manager (pm2/systemd) behind nginx; set the env vars from `.env.example` in `.env` on the box. Provide a MariaDB/MySQL database and set `DB_*`. `PORT` comes from the environment / nginx upstream. Run `npm run indexnow` after deploying to ping IndexNow.
