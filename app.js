try { require('dotenv').config(); } catch (_) { /* dotenv optional in prod */ }

const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1); // behind Hostinger proxy — needed for correct client IP in rate limiter
app.use(express.urlencoded({ extended: false, limit: '32kb' }));
app.use(express.json({ limit: '32kb' }));

// ---- Contact form ----
const CONTACT_TO = process.env.CONTACT_TO || 'prime@graphicmeat.com';
const CONTACT_FROM = process.env.CONTACT_FROM || process.env.SMTP_USER || CONTACT_TO;

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

// ---- Static site ----
app.use(express.static(path.join(__dirname, 'public')));

// Clean URLs for standalone pages.
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/photobooks', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'photobooks.html'));
});

app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
