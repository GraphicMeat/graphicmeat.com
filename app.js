try { require('dotenv').config(); } catch (_) { /* dotenv optional in prod */ }

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const { getPool, initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1); // behind nginx reverse proxy (Hetzner) — needed for correct client IP in rate limiter
app.use(express.urlencoded({ extended: false, limit: '32kb' }));
app.use(express.json({ limit: '32kb' }));

// Send as grill@graphicmeat.com via its Purelymail app password.
// Secret is stored under GRILL_EMAIL_SMTP_APP_PASSWORD; map to the SMTP_* names the code uses.
process.env.SMTP_USER ||= 'grill@graphicmeat.com';
process.env.SMTP_PASS ||= process.env.GRILL_EMAIL_SMTP_APP_PASSWORD;

// ---- Shared config ----
const CONTACT_TO = process.env.CONTACT_TO || 'prime@graphicmeat.com';
const CONTACT_FROM = process.env.CONTACT_FROM || process.env.SMTP_USER || CONTACT_TO;
const SITE_URL = (process.env.SITE_URL || 'https://graphicmeat.com').replace(/\/$/, '');
const NEWSLETTER_NOTIFY = process.env.NEWSLETTER_NOTIFY || CONTACT_TO;

// Hash client IP (privacy) — stored alongside subscribers/contacts for abuse triage.
function getClientIP(req) {
    return req.ip || req.socket?.remoteAddress || '';
}
function hashIP(ip) {
    return crypto.createHash('sha256').update(ip + (process.env.IP_SALT || '')).digest('hex').slice(0, 64);
}
const smtpConfigured = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
function getTransporter() {
    if (transporter) return transporter;
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.purelymail.com',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: String(process.env.SMTP_SECURE ?? 'true') === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    return transporter;
}

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: 'Too many messages. Try again later.' },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const wantsJson = (req) =>
    (req.get('accept') || '').includes('application/json') ||
    req.get('x-requested-with') === 'fetch';

const SITE_LOCALES = new Set(['de', 'fr', 'es', 'it', 'ja', 'ko', 'zh-hans', 'pt-br']);
function localePrefix(value) {
    const locale = String(value || '').toLowerCase();
    return SITE_LOCALES.has(locale) ? `/${locale}` : '';
}

function fail(req, res, code, msg) {
    if (wantsJson(req)) return res.status(code).json({ ok: false, error: msg });
    return res.redirect(303, `${localePrefix(req.body?.locale)}/contact?error=` + encodeURIComponent(msg));
}

app.post('/api/contact', contactLimiter, async (req, res) => {
    const b = req.body || {};

    // Honeypot: real users never fill this hidden field.
    if (b.website) return res.status(200).json({ ok: true }); // silently accept, drop

    // Time-trap: forms submitted in under 3s are almost always bots (JS-set field).
    const started = Number(b.started);
    if (started && Date.now() - started < 3000) {
        return fail(req, res, 400, 'Submitted too quickly — please try again.');
    }

    const name = String(b.name || '').trim();
    const email = String(b.email || '').trim();
    const message = String(b.message || '').trim();

    if (name.length < 1 || name.length > 100) return fail(req, res, 400, 'Please enter your name.');
    if (!EMAIL_RE.test(email) || email.length > 200) return fail(req, res, 400, 'Please enter a valid email.');
    if (message.length < 5 || message.length > 5000) return fail(req, res, 400, 'Please enter a message.');

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('Contact form: SMTP credentials not configured.');
        return fail(req, res, 500, 'Mail is not configured yet. Please try again later.');
    }

    try {
        await getTransporter().sendMail({
            from: `"GraphicMeat site" <${CONTACT_FROM}>`,
            to: CONTACT_TO,
            replyTo: `"${name}" <${email}>`,
            subject: `Contact form — ${name}`,
            text: `From: ${name} <${email}>\n\n${message}`,
        });
    } catch (err) {
        console.error('Contact form send failed:', err.message);
        return fail(req, res, 500, 'Could not send right now. Please try again later.');
    }

    if (wantsJson(req)) return res.json({ ok: true });
    return res.redirect(303, `${localePrefix(b.locale)}/contact?sent=1`);
});

// ---- Newsletter (double opt-in) ----
const subscribeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: 'Too many attempts. Try again later.' },
});

// Respond to a subscribe request as JSON (fetch) or a redirect (no-JS form post).
function subReply(req, res, code, jsonBody, redirectPath) {
    if (wantsJson(req)) return res.status(code).json(jsonBody);
    return res.redirect(303, redirectPath);
}

app.post('/api/subscribe', subscribeLimiter, async (req, res) => {
    const b = req.body || {};
    const subscribedPath = `${localePrefix(b.locale)}/subscribed`;

    // Honeypot + time-trap (same defenses as the contact form).
    if (b.website) {
        return subReply(req, res, 200, { ok: true, message: 'Almost there — check your email to confirm.' }, `${subscribedPath}?pending=1`);
    }
    const started = Number(b.started);
    if (started && Date.now() - started < 3000) {
        return subReply(req, res, 400, { ok: false, error: 'Submitted too quickly — please try again.' }, `${subscribedPath}?error=1`);
    }

    const email = String(b.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 200) {
        return subReply(req, res, 400, { ok: false, error: 'Please enter a valid email.' }, `${subscribedPath}?error=1`);
    }

    const pool = getPool();
    if (!pool || !smtpConfigured()) {
        console.error('Newsletter: DB or SMTP not configured.');
        return subReply(req, res, 503, { ok: false, error: 'Newsletter is not configured yet. Please try again later.' }, `${subscribedPath}?error=1`);
    }

    try {
        const [rows] = await pool.execute('SELECT id, status FROM subscribers WHERE email = ?', [email]);
        if (rows.length && rows[0].status === 'confirmed') {
            return subReply(req, res, 200, { ok: true, message: "You're already subscribed." }, `${subscribedPath}?already=1`);
        }

        const token = crypto.randomBytes(24).toString('hex'); // 48 hex chars
        const ipHash = hashIP(getClientIP(req));
        if (rows.length) {
            await pool.execute(
                "UPDATE subscribers SET status = 'pending', token = ?, token_expires = DATE_ADD(NOW(), INTERVAL 48 HOUR), ip_hash = ? WHERE email = ?",
                [token, ipHash, email]
            );
        } else {
            await pool.execute(
                "INSERT INTO subscribers (email, status, token, token_expires, ip_hash) VALUES (?, 'pending', ?, DATE_ADD(NOW(), INTERVAL 48 HOUR), ?)",
                [email, token, ipHash]
            );
        }

        const link = `${SITE_URL}/api/subscribe/confirm?token=${token}&lang=${encodeURIComponent(String(b.locale || ''))}`;
        await getTransporter().sendMail({
            from: `"GraphicMeat" <${CONTACT_FROM}>`,
            to: email,
            subject: 'Confirm your GraphicMeat newsletter subscription',
            text: `Confirm your subscription to the GraphicMeat newsletter:\n\n${link}\n\nIf you didn't request this, just ignore this email. The link expires in 48 hours.`,
            html: `<p>Confirm your subscription to the <strong>GraphicMeat</strong> newsletter:</p>`
                + `<p><a href="${link}">Confirm my subscription</a></p>`
                + `<p style="color:#6a6e7a;font-size:13px">If you didn't request this, just ignore this email. The link expires in 48 hours.</p>`,
        });
    } catch (err) {
        console.error('Subscribe failed:', err.message);
        return subReply(req, res, 500, { ok: false, error: 'Could not subscribe right now. Please try again later.' }, `${subscribedPath}?error=1`);
    }

    return subReply(req, res, 200, { ok: true, message: 'Almost there — check your email to confirm.' }, `${subscribedPath}?pending=1`);
});

app.get('/api/subscribe/confirm', async (req, res) => {
    const token = String(req.query.token || '');
    const subscribedPath = `${localePrefix(req.query.lang)}/subscribed`;
    const pool = getPool();
    if (!pool || !/^[a-f0-9]{32,64}$/.test(token)) return res.redirect(303, `${subscribedPath}?error=1`);

    try {
        const [rows] = await pool.execute(
            'SELECT id, email, (token_expires < NOW()) AS expired FROM subscribers WHERE token = ?',
            [token]
        );
        if (!rows.length) return res.redirect(303, `${subscribedPath}?error=1`);
        if (rows[0].expired) return res.redirect(303, `${subscribedPath}?error=expired`);

        await pool.execute(
            "UPDATE subscribers SET status = 'confirmed', confirmed_at = NOW(), token = NULL, token_expires = NULL WHERE id = ?",
            [rows[0].id]
        );

        // Notify us of the new confirmed subscriber (fire-and-forget).
        if (smtpConfigured()) {
            getTransporter().sendMail({
                from: `"GraphicMeat" <${CONTACT_FROM}>`,
                to: NEWSLETTER_NOTIFY,
                subject: 'New newsletter subscriber',
                text: `New confirmed newsletter subscriber: ${rows[0].email}`,
                html: `<p>New confirmed newsletter subscriber: <strong>${rows[0].email}</strong></p>`,
            }).catch((err) => console.error('Subscriber notification failed:', err.message));
        }
    } catch (err) {
        console.error('Confirm failed:', err.message);
        return res.redirect(303, `${subscribedPath}?error=1`);
    }

    return res.redirect(303, subscribedPath);
});

// ---- Static site ----
app.use(express.static(path.join(__dirname, 'public')));

// Preserve previously shared/indexed PhotoBooks asset URLs after organizing media.
app.get('/photobooks.png', (req, res) => res.redirect(301, '/assets/photobooks/images/icon.png'));
app.get('/photobooks-app.webp', (req, res) => res.redirect(301, '/assets/photobooks/images/app-workspace.webp'));
app.get('/photobooks-sample.pdf', (req, res) => res.redirect(301, '/assets/photobooks/documents/sample-photobook.pdf'));

// Clean URLs for standalone pages.
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/app-privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'app-privacy.html'));
});

app.get('/photobooks', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'photobooks.html'));
});

app.get('/mrukis', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mrukis.html'));
});

app.get('/en/mrukis', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mrukis-en.html'));
});

const MRUKIS_PAGES = {
    '/mrukis/parduotuve': 'mrukis-shop.html',
    '/mrukis/apie-mus': 'mrukis-about.html',
    '/mrukis/renginiai': 'mrukis-events.html',
    '/mrukis/receptai': 'mrukis-recipes.html',
    '/mrukis/receptai/jautienos-kumpio-suktinukai': 'mrukis-recipe-jautienos-kumpio-suktinukai.html',
    '/mrukis/receptai/neiprastas-befstrogenas': 'mrukis-recipe-neiprastas-befstrogenas.html',
    '/mrukis/receptai/vengriskas-guliasas': 'mrukis-recipe-vengriskas-guliasas.html',
    '/mrukis/receptai/sprandine-sous-vide': 'mrukis-recipe-sprandine-sous-vide.html',
    '/mrukis/receptai/mesainis-su-melynuoju-suriu': 'mrukis-recipe-mesainis-su-melynuoju-suriu.html',
    '/mrukis/receptai/mesainis-su-karamelizuotais-persikais': 'mrukis-recipe-mesainis-su-karamelizuotais-persikais.html',
    '/mrukis/duk': 'mrukis-faq.html',
    '/mrukis/privacy-policy': 'mrukis-privacy.html',
    '/mrukis/refund_returns': 'mrukis-terms.html',
    '/en/mrukis/shop': 'mrukis-shop-en.html',
    '/en/mrukis/about': 'mrukis-about-en.html',
    '/en/mrukis/events': 'mrukis-events-en.html',
    '/en/mrukis/recipes': 'mrukis-recipes-en.html',
    '/en/mrukis/faq': 'mrukis-faq-en.html',
    '/en/mrukis/privacy': 'mrukis-privacy-en.html',
    '/en/mrukis/terms': 'mrukis-terms-en.html',
};
for (const [route, file] of Object.entries(MRUKIS_PAGES)) {
    app.get(route, (req, res) => res.sendFile(path.join(__dirname, 'public', file)));
}

const PHOTOBOOK_LOCALES = ['de', 'fr', 'es', 'it', 'ja', 'ko', 'zh-hans', 'pt-br'];
const LOCALIZED_SITE_PAGES = {
    '': 'index',
    '/blog': 'blog',
    '/contact': 'contact',
    '/app-privacy': 'app-privacy',
    '/subscribed': 'subscribed',
};
for (const locale of PHOTOBOOK_LOCALES) {
    for (const [route, file] of Object.entries(LOCALIZED_SITE_PAGES)) {
        app.get(`/${locale}${route}`, (req, res) => {
            res.sendFile(path.join(__dirname, 'public', `${file}-${locale}.html`));
        });
    }
}
for (const locale of PHOTOBOOK_LOCALES) {
    app.get(`/${locale}/photobooks`, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', `photobooks-${locale}.html`));
    });
}

app.get('/blog', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

app.get('/blog/automatic-masonry-layouts-photobooks', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog-automatic-masonry-layouts-photobooks.html'));
});

for (const locale of PHOTOBOOK_LOCALES) {
    app.get(`/${locale}/blog/automatic-masonry-layouts-photobooks`, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', `blog-automatic-masonry-layouts-photobooks-${locale}.html`));
    });
}

// ---- Download: always redirect to the latest PhotoBooks .dmg ----
// Release asset filenames carry the version (PhotoBooks-x.y.z.dmg), so there's no
// stable GitHub URL — resolve the newest via the API and 302 to it.
const PB_REPO = 'GraphicMeat/PhotoBooks';
const PB_RELEASES = `https://github.com/${PB_REPO}/releases/latest`;
let pbCache = { url: null, at: 0 }; // ponytail: in-memory cache, fine for one process; add shared cache only if multi-instance

async function latestPhotoBooksDmg() {
    if (pbCache.url && Date.now() - pbCache.at < 15 * 60 * 1000) return pbCache.url;
    const r = await fetch(`https://api.github.com/repos/${PB_REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'graphicmeat.com' },
    });
    if (!r.ok) throw new Error(`GitHub API ${r.status}`);
    const dmg = ((await r.json()).assets || []).find((a) => a.name.endsWith('.dmg'));
    if (!dmg) throw new Error('no .dmg asset in latest release');
    pbCache = { url: dmg.browser_download_url, at: Date.now() };
    return pbCache.url;
}

app.get('/download/photobooks', async (req, res) => {
    try {
        res.redirect(302, await latestPhotoBooksDmg());
    } catch (err) {
        console.error('PhotoBooks download redirect failed:', err.message);
        res.redirect(302, PB_RELEASES); // fall back to the releases page — user still gets the latest
    }
});

app.get('/subscribed', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'subscribed.html'));
});

// Hidden internal download-stats dashboard. Not linked, not in sitemap; noindex
// header + meta keep it out of search/AI crawlers. Stats fetched client-side from
// the GitHub public API, so no server work here.
app.get('/downloads', (req, res) => {
    res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.sendFile(path.join(__dirname, 'public', 'downloads.html'));
});

app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDatabase().catch((err) => console.error('DB init failed:', err.message));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
