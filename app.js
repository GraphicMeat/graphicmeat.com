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

function fail(req, res, code, msg) {
    if (wantsJson(req)) return res.status(code).json({ ok: false, error: msg });
    return res.redirect(303, '/contact?error=' + encodeURIComponent(msg));
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
    return res.redirect(303, '/contact?sent=1');
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

    // Honeypot + time-trap (same defenses as the contact form).
    if (b.website) {
        return subReply(req, res, 200, { ok: true, message: 'Almost there — check your email to confirm.' }, '/subscribed?pending=1');
    }
    const started = Number(b.started);
    if (started && Date.now() - started < 3000) {
        return subReply(req, res, 400, { ok: false, error: 'Submitted too quickly — please try again.' }, '/subscribed?error=1');
    }

    const email = String(b.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 200) {
        return subReply(req, res, 400, { ok: false, error: 'Please enter a valid email.' }, '/subscribed?error=1');
    }

    const pool = getPool();
    if (!pool || !smtpConfigured()) {
        console.error('Newsletter: DB or SMTP not configured.');
        return subReply(req, res, 503, { ok: false, error: 'Newsletter is not configured yet. Please try again later.' }, '/subscribed?error=1');
    }

    try {
        const [rows] = await pool.execute('SELECT id, status FROM subscribers WHERE email = ?', [email]);
        if (rows.length && rows[0].status === 'confirmed') {
            return subReply(req, res, 200, { ok: true, message: "You're already subscribed." }, '/subscribed?already=1');
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

        const link = `${SITE_URL}/api/subscribe/confirm?token=${token}`;
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
        return subReply(req, res, 500, { ok: false, error: 'Could not subscribe right now. Please try again later.' }, '/subscribed?error=1');
    }

    return subReply(req, res, 200, { ok: true, message: 'Almost there — check your email to confirm.' }, '/subscribed?pending=1');
});

app.get('/api/subscribe/confirm', async (req, res) => {
    const token = String(req.query.token || '');
    const pool = getPool();
    if (!pool || !/^[a-f0-9]{32,64}$/.test(token)) return res.redirect(303, '/subscribed?error=1');

    try {
        const [rows] = await pool.execute(
            'SELECT id, email, (token_expires < NOW()) AS expired FROM subscribers WHERE token = ?',
            [token]
        );
        if (!rows.length) return res.redirect(303, '/subscribed?error=1');
        if (rows[0].expired) return res.redirect(303, '/subscribed?error=expired');

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
        return res.redirect(303, '/subscribed?error=1');
    }

    return res.redirect(303, '/subscribed');
});

// ---- Static site ----
app.use(express.static(path.join(__dirname, 'public')));

// Clean URLs for standalone pages.
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/photobooks', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'photobooks.html'));
});

app.get('/subscribed', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'subscribed.html'));
});

app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDatabase().catch((err) => console.error('DB init failed:', err.message));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
