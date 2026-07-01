# graphicmeat.com

Umbrella site for the GraphicMeat product studio. Express server (`app.js`) serving a single static page (`public/index.html`) plus one API route for the contact form. Deploys to Hostinger Node.js hosting.

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

- Email address is **never displayed** on the page (anti-harvesting). Contact happens only via the form in `#contact`.
- `POST /api/contact` in `app.js` sends mail via Purelymail SMTP (nodemailer) to `CONTACT_TO`.
- Spam defenses: hidden honeypot field `website`, JS time-trap (`started`), `express-rate-limit` (5 / 15 min / IP), server-side validation. No captcha.
- Works without JS (form posts and server 303-redirects to `?sent=1` / `?error=`); JS upgrades to inline fetch.
- Secrets live in `.env` (gitignored) — see `.env.example`. Never commit credentials.

## Deploy

Hostinger Node.js app. Set the same env vars from `.env.example` in the Hostinger panel. `PORT` is provided by Hostinger.
