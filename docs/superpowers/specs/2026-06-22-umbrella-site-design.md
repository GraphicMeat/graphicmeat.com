# GraphicMeat Umbrella Site — Design

Date: 2026-06-22
Status: Approved (pending spec review)

## Goal

Convert graphicmeat.com from a single "coming soon" page into an umbrella/portfolio hub that showcases GraphicMeat's products. First product listed: MailVault. The structure must make adding future products trivial.

## Scope

- One scrollable landing page at `/`.
- Each product = a card that links OUT to its own site. No in-site per-product pages, no modals.
- Reuse the existing cyberpunk brand (dark, red/orange/silver, Chakra Petch + Share Tech Mono, circuit canvas, corner brackets, noise texture).
- Product list is data-driven: a JS array of product objects rendered into cards.
- Only MailVault is listed now. GraphicMeat is the parent studio brand (hero).

Out of scope: CMS, backend, analytics, contact form, additional products, build tooling changes.

## Architecture

Unchanged hosting model: Express static server (`app.js`) serving `public/`, single-page `public/index.html` with inline `<style>` and `<script>` (matches the current file's pattern). Catch-all route already serves `index.html`.

```
graphicmeat.com/
  app.js                 (unchanged)
  public/
    index.html           (rewritten: hero + products + footer)
    logo.png             (existing GraphicMeat logo, reused in hero)
    mailvault.png        (NEW — copied from mail-vault-app/website/icon-128.png)
```

### Page sections (top → bottom)

1. **Hero**
   - GraphicMeat `logo.png` (existing) OR styled `GRAPHIC MEAT` wordmark — use the existing PNG logo for brand fidelity.
   - Tagline: "Well done isn't a requirement" (existing, with dash flanks).
   - Studio line: "Independent product studio · Est. 2013".
   - Keep ambient animations (logo fade-in, pixels, circuit canvas). **Remove** the "Coming Soon" status pulse — site is now live as a hub.

2. **Products** — heading `// WHAT WE'RE BUILDING` (mono, silver-dim, red `//`). Below it a responsive card grid (`auto-fit, minmax(~300px, 1fr)`). One card now.

3. **Footer** — `graphicmeat.com` · `prime@graphicmeat.com` · `Est. 2013` (mono, dim, uppercase, letter-spaced). Email is a `mailto:` link.

### Product data model

```js
const PRODUCTS = [
  {
    name: "MailVault",
    logo: "mailvault.png",
    tagline: "Your mailbox is full. Your archive doesn't have to be.",
    blurb: "Archive your IMAP emails locally as standard .eml files — free up server storage, keep everything searchable offline. Forever.",
    features: ["Local .eml archive", "Offline search", "Multi-account IMAP", "Free & open source"],
    providers: ["Gmail", "Outlook", "iCloud", "IMAP"],
    status: "live",            // "live" | "beta" | "soon" — drives badge color/label
    platforms: "macOS · Linux",
    url: "https://mailvaultapp.com",
    cta: "Visit MailVault"
  }
];
```

A `renderProducts()` function maps each object to a card and injects into the grid container. Adding a product later = append one object.

### Card layout (per product)

- Header row: small logo icon + product name (left); status badge (right).
  - Badge: `live` → green, `beta` → orange, `soon` → amber. Label = "Live" / "Beta" / "Coming soon".
- Tagline (orange accent).
- Blurb (silver body).
- Feature chips (wrap, dark pill, dim icon + label).
- Footer row of card: providers line "Works with · Gmail · Outlook · iCloud · IMAP" + platforms (left); CTA button → `url` (right). CTA is an `<a target="_blank" rel="noopener">`.
- Hover: red border brighten + red glow (reuse existing logo drop-shadow style).

## Visual / CSS changes vs current file

- `html, body { overflow: hidden }` → allow vertical scroll. Body changes from full-height flex-center to top-aligned column with max-width content wrapper centered horizontally.
- Circuit `<canvas>`, corner brackets, noise, cursor glow stay `fixed` (background layers) so they persist while scrolling.
- Keep CSS custom properties (`--bg`, `--red`, `--orange`, `--silver`, etc.). Add `--green` for the Live badge.
- Mobile (`max-width: 600px`): single-column cards, brackets/corner-info hidden (as today), reduced hero logo.

## Data flow

Static. On load: existing canvas/pixel scripts run; `renderProducts()` builds cards from `PRODUCTS`; cursor-glow + resize listeners attach. No fetch, no state.

## Error handling

- Minimal — static page. If a product's `logo` is missing, `<img>` `onerror` hides the icon (card still renders with name).
- External CTA links use `rel="noopener noreferrer"`.

## Testing / verification

- `npm start`, load `http://localhost:3000`: hero renders, MailVault card renders with Live badge, CTA links to mailvaultapp.com (new tab).
- Resize to mobile width: single column, no horizontal scroll, brackets hidden.
- Page scrolls; background layers stay fixed.
- Add a throwaway 2nd object to `PRODUCTS` → second card auto-renders in grid (then remove).

## Assets

Copy `mail-vault-app/website/icon-128.png` → `public/mailvault.png`. (Source confirmed to exist.)
