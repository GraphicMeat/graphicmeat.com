#!/usr/bin/env node
'use strict';

// Generates the static localized Graphic Meat pages. Run from the repository root.
// Translation is deliberately a build step: every locale is real HTML for crawlers
// and the production server never depends on a translation service.

const fs = require('fs');
const https = require('https');
const path = require('path');

const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const locales = [
    { key: 'en', html: 'en', route: '', file: '', flag: '🇬🇧', label: 'English' },
    { key: 'de', html: 'de', route: 'de', file: 'de', flag: '🇩🇪', label: 'Deutsch' },
    { key: 'fr', html: 'fr', route: 'fr', file: 'fr', flag: '🇫🇷', label: 'Français' },
    { key: 'es', html: 'es', route: 'es', file: 'es', flag: '🇪🇸', label: 'Español' },
    { key: 'it', html: 'it', route: 'it', file: 'it', flag: '🇮🇹', label: 'Italiano' },
    { key: 'ja', html: 'ja', route: 'ja', file: 'ja', flag: '🇯🇵', label: '日本語' },
    { key: 'ko', html: 'ko', route: 'ko', file: 'ko', flag: '🇰🇷', label: '한국어' },
    { key: 'zh-Hans', html: 'zh-Hans', route: 'zh-hans', file: 'zh-hans', flag: '🇨🇳', label: '简体中文' },
    { key: 'pt-BR', html: 'pt-BR', route: 'pt-br', file: 'pt-br', flag: '🇧🇷', label: 'Português (Brasil)', target: 'pt' },
];

const pages = [
    { source: 'index.html', stem: 'index', route: '/' },
    { source: 'blog.html', stem: 'blog', route: '/blog' },
    { source: 'contact.html', stem: 'contact', route: '/contact' },
    { source: 'app-privacy.html', stem: 'app-privacy', route: '/app-privacy' },
    { source: 'subscribed.html', stem: 'subscribed', route: '/subscribed', noindex: true },
];

const protectedText = /^(?:Graphic|Meat|Graphic Meat|GraphicMeat|MailVault|PhotoBooks|KISS|SOLID|macOS|Linux|Gmail|Outlook|IMAP|Apple|GitHub|X|graphicmeat\.com|rokas-ambrazevicius|@GraphicMeat|you@example\.com|\.eml|\d+|[\W_]+)$/i;
const translateAttrs = /\b(?:aria-label|alt|placeholder|data-(?:pending|already|expired|invalid)-(?:title|body))="([^"]+)"/g;
const masks = new Map([
    ['GraphicMeat', '__BRAND_COMPACT__'], ['Graphic Meat', '__BRAND__'],
    ['MailVault', '__MAILVAULT__'], ['PhotoBooks', '__PHOTOBOOKS__'], ['macOS', '__MACOS__'],
]);
function mask(value) { for (const [word, token] of masks) value = value.split(word).join(token); return value; }
function unmask(value) { for (const [word, token] of masks) value = value.split(token).join(word); return value; }

function routeFor(page, locale) {
    return locale.route ? `/${locale.route}${page.route === '/' ? '' : page.route}` : page.route;
}
function outputFor(page, locale) {
    return locale.key === 'en' ? page.source : `${page.stem}-${locale.file}.html`;
}
function shouldTranslate(value) {
    const v = value.replace(/\s+/g, ' ').trim();
    return /[A-Za-z]/.test(v) && !protectedText.test(v) && !/^https?:|^\/|^[\w.+-]+@[\w.-]+$/.test(v);
}

function jsonStrings(html) {
    const values = [];
    html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (_, raw) => {
        try {
            const visit = (value, key = '') => {
                if (typeof value === 'string' && ['name', 'description', 'slogan', 'headline', 'about'].includes(key) && shouldTranslate(value)) values.push(value);
                else if (Array.isArray(value)) value.forEach((v) => visit(v, key));
                else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => visit(v, k));
            };
            visit(JSON.parse(raw));
        } catch (_) { /* invalid structured data is caught by verification */ }
        return _;
    });
    return values;
}

function collect(html) {
    const values = [];
    let inScript = false, inStyle = false;
    for (const part of html.split(/(<[^>]+>)/g)) {
        if (/^<script\b/i.test(part)) inScript = true;
        if (/^<style\b/i.test(part)) inStyle = true;
        if (!part.startsWith('<') && !inScript && !inStyle && shouldTranslate(part)) values.push(part.trim());
        if (/^<\/script/i.test(part)) inScript = false;
        if (/^<\/style/i.test(part)) inStyle = false;
    }
    html.replace(translateAttrs, (_, value) => { if (shouldTranslate(value)) values.push(value); return _; });
    html.replace(/<meta\s+(?:name|property)="(?:description|og:title|og:description|og:image:alt|twitter:title|twitter:description|twitter:image:alt)"\s+content="([^"]+)"/g, (_, value) => { if (shouldTranslate(value)) values.push(value); return _; });
    values.push(...jsonStrings(html));
    return [...new Set(values)];
}

function requestTranslation(text, target) {
    const body = new URLSearchParams({ client: 'gtx', sl: 'en', tl: target, dt: 't', q: text }).toString();
    return new Promise((resolve, reject) => {
        const req = https.request({ hostname: 'translate.googleapis.com', path: '/translate_a/single', method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'content-length': Buffer.byteLength(body), 'user-agent': 'graphicmeat-localizer/1.0' } }, (res) => {
            let raw = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { raw += chunk; });
            res.on('end', () => {
                if (res.statusCode !== 200) return reject(new Error(`translation HTTP ${res.statusCode}: ${raw.slice(0, 120)}`));
                try { resolve(JSON.parse(raw)[0].map((piece) => piece[0]).join('')); }
                catch (error) { reject(new Error(`translation response: ${error.message}`)); }
            });
        });
        req.on('error', reject);
        req.setTimeout(30000, () => req.destroy(new Error('translation timeout')));
        req.end(body);
    });
}

async function translateValues(values, locale) {
    const result = new Map();
    const chunks = [];
    let chunk = [];
    for (const value of values) {
        const trial = [...chunk, value];
        if (trial.join('\n__GM_0000__\n').length > 3600 && chunk.length) { chunks.push(chunk); chunk = [value]; }
        else chunk = trial;
    }
    if (chunk.length) chunks.push(chunk);
    for (let c = 0; c < chunks.length; c += 1) {
        const marker = (i) => `__GM_${c}_${i}__`;
        const payload = chunks[c].map((value, i) => `${marker(i)}\n${mask(value)}`).join('\n');
        const translated = await requestTranslation(payload, locale.target || locale.key);
        const pattern = new RegExp(`__GM_${c}_(\\d+)__\\s*`, 'g');
        const found = [...translated.matchAll(pattern)];
        if (found.length !== chunks[c].length) throw new Error(`lost translation markers for ${locale.key} chunk ${c}`);
        found.forEach((match, i) => {
            const start = match.index + match[0].length;
            const end = i + 1 < found.length ? found[i + 1].index : translated.length;
            result.set(chunks[c][Number(match[1])], unmask(translated.slice(start, end).trim()));
        });
    }
    return result;
}

function replaceText(html, translations) {
    let inScript = false, inStyle = false;
    html = html.split(/(<[^>]+>)/g).map((part) => {
        if (/^<script\b/i.test(part)) inScript = true;
        if (/^<style\b/i.test(part)) inStyle = true;
        let out = part;
        if (!part.startsWith('<') && !inScript && !inStyle && shouldTranslate(part)) {
            const leading = part.match(/^\s*/)[0], trailing = part.match(/\s*$/)[0];
            out = leading + (translations.get(part.trim()) || part.trim()) + trailing;
        }
        if (/^<\/script/i.test(part)) inScript = false;
        if (/^<\/style/i.test(part)) inStyle = false;
        return out;
    }).join('');
    html = html.replace(translateAttrs, (all, value) => all.replace(value, translations.get(value) || value));
    html = html.replace(/(<meta\s+(?:name|property)="(?:description|og:title|og:description|og:image:alt|twitter:title|twitter:description|twitter:image:alt)"\s+content=")([^"]+)(")/g, (all, before, value, after) => before + (translations.get(value) || value) + after);
    return html;
}

function localizeJsonLd(html, translations, locale) {
    return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (all, raw) => {
        try {
            const data = JSON.parse(raw);
            const visit = (value, key = '') => {
                if (typeof value === 'string') {
                    if (key === 'inLanguage') return locale.html;
                    return translations.get(value) || value;
                }
                if (Array.isArray(value)) return value.map((v) => visit(v, key));
                if (value && typeof value === 'object') {
                    const result = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, visit(v, k)]));
                    if (['WebPage', 'Blog', 'ContactPage'].includes(result['@type'])) result.inLanguage = locale.html;
                    return result;
                }
                return value;
            };
            return `<script type="application/ld+json">\n${JSON.stringify(visit(data), null, 2)}\n    </script>`;
        } catch (_) { return all; }
    });
}

function picker(page, current) {
    const labels = { en: 'Choose language', de: 'Sprache wählen', fr: 'Choisir la langue', es: 'Elegir idioma', it: 'Scegli la lingua', ja: '言語を選択', ko: '언어 선택', 'zh-Hans': '选择语言', 'pt-BR': 'Escolher idioma' };
    const links = locales.map((locale) => `<li><a href="${routeFor(page, locale)}" lang="${locale.html}" hreflang="${locale.html}" data-language="${locale.key}"${locale.key === current.key ? ' aria-current="page"' : ''}><span aria-hidden="true">${locale.flag}</span> ${locale.label}</a></li>`).join('');
    return `<div class="pb-language-switcher article-language-switcher site-language-switcher" role="navigation" aria-label="${labels[current.key]}"><ul>${links}</ul></div>`;
}

function alternates(page) {
    return locales.map((locale) => `    <link rel="alternate" hreflang="${locale.html}" href="https://graphicmeat.com${routeFor(page, locale)}">`).join('\n')
        + `\n    <link rel="alternate" hreflang="x-default" href="https://graphicmeat.com${page.route}">\n`;
}

function rewriteLinks(html, locale) {
    if (locale.key === 'en') return html;
    const known = ['/', '/blog', '/contact', '/app-privacy', '/subscribed', '/photobooks', '/blog/automatic-masonry-layouts-photobooks'];
    for (const url of known.sort((a, b) => b.length - a.length)) {
        const localized = `/${locale.route}${url === '/' ? '' : url}`;
        html = html.replace(new RegExp(`href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=([#?"]|$))`, 'g'), `href="${localized}`);
    }
    return html;
}

function decorate(source, page, locale, translations) {
    let html = replaceText(source, translations);
    html = localizeJsonLd(html, translations, locale);
    if (locale.key !== 'en') {
        const absoluteRoutes = ['/blog/automatic-masonry-layouts-photobooks', '/photobooks', '/app-privacy', '/contact', '/blog', '/subscribed'];
        for (const route of absoluteRoutes) html = html.split(`https://graphicmeat.com${route}`).join(`https://graphicmeat.com/${locale.route}${route}`);
    }
    html = html.replace(/<html lang="[^"]+">/, `<html lang="${locale.html}">`);
    html = html.replace(/\s*<link rel="alternate" hreflang="(?:en|de|fr|es|it|ja|ko|zh-Hans|pt-BR|x-default)"[^>]*>/g, '');
    html = html.replace(/(\s*<link rel="canonical")/, `\n${alternates(page)}$1`);
    const canonical = `https://graphicmeat.com${routeFor(page, locale)}`;
    html = html.replace(/(<link rel="canonical" href=")[^"]+/, `$1${canonical}`);
    html = html.replace(/(<meta property="og:url" content=")[^"]+/, `$1${canonical}`);
    html = html.replace(/[ \t]*<div class="pb-language-switcher article-language-switcher site-language-switcher"[\s\S]*?<\/div>/, '');
    html = rewriteLinks(html, locale);
    html = html.replace(/(<\/nav>)/, `$1\n        ${picker(page, locale)}`);
    html = html.replace(/(<input type="hidden" name="locale" value=")[^"]*(")/g, `$1${locale.route}$2`);
    return html;
}

(async () => {
    const sources = new Map(pages.map((page) => [page.source, fs.readFileSync(path.join(publicDir, page.source), 'utf8')]));
    const allValues = [...new Set([...sources.values()].flatMap(collect))];
    for (const locale of locales) {
        const translations = locale.key === 'en' ? new Map() : await translateValues(allValues, locale);
        for (const page of pages) {
            const output = decorate(sources.get(page.source), page, locale, translations);
            fs.writeFileSync(path.join(publicDir, outputFor(page, locale)), output);
        }
        process.stdout.write(`localized ${locale.key}\n`);
    }
    const sitemapPath = path.join(publicDir, 'sitemap.xml');
    let sitemap = fs.readFileSync(sitemapPath, 'utf8');
    sitemap = sitemap.replace(/\n  <!-- localized-site:start -->[\s\S]*?<!-- localized-site:end -->/g, '');
    const localizedUrls = pages.filter((page) => !page.noindex).flatMap((page) => locales.slice(1).map((locale) => {
        const frequency = page.route === '/app-privacy' ? 'yearly' : (page.route === '/contact' ? 'monthly' : 'weekly');
        const priority = page.route === '/' ? '0.9' : (page.route === '/blog' ? '0.7' : page.route === '/contact' ? '0.5' : '0.4');
        return `  <url><loc>https://graphicmeat.com${routeFor(page, locale)}</loc><lastmod>2026-07-16</lastmod><changefreq>${frequency}</changefreq><priority>${priority}</priority></url>`;
    })).join('\n');
    sitemap = sitemap.replace('\n</urlset>', `\n  <!-- localized-site:start -->\n${localizedUrls}\n  <!-- localized-site:end -->\n</urlset>`);
    fs.writeFileSync(sitemapPath, sitemap);
})().catch((error) => { console.error(error); process.exitCode = 1; });
