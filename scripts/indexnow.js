#!/usr/bin/env node
// Ping IndexNow (Bing, Yandex, Seznam — and Brave's supplemental results) with the
// site's URLs. Run AFTER deploying so the key file is reachable at the live domain:
//
//   node scripts/indexnow.js
//
// Requires the IndexNow key file (public/<key>.txt) to be live at
// https://<host>/<key>.txt — IndexNow verifies ownership by fetching it.

const fs = require('fs');
const path = require('path');

const HOST = process.env.INDEXNOW_HOST || 'graphicmeat.com';
const ORIGIN = `https://${HOST}`;
const publicDir = path.join(__dirname, '..', 'public');

function findKey() {
    if (process.env.INDEXNOW_KEY) return process.env.INDEXNOW_KEY.trim();
    const f = fs.readdirSync(publicDir).find((n) => /^[a-f0-9]{8,}\.txt$/i.test(n));
    if (!f) throw new Error('No IndexNow key file (public/<hexkey>.txt) found and INDEXNOW_KEY not set.');
    return fs.readFileSync(path.join(publicDir, f), 'utf8').trim();
}

function urlsFromSitemap() {
    const xml = fs.readFileSync(path.join(publicDir, 'sitemap.xml'), 'utf8');
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function main() {
    const key = findKey();
    const urlList = urlsFromSitemap();
    if (!urlList.length) throw new Error('No <loc> URLs found in sitemap.xml.');

    const body = {
        host: HOST,
        key,
        keyLocation: `${ORIGIN}/${key}.txt`,
        urlList,
    };

    console.log(`Submitting ${urlList.length} URL(s) to IndexNow for ${HOST}:`);
    urlList.forEach((u) => console.log('  ' + u));

    const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body),
    });

    // IndexNow returns 200 or 202 on success.
    console.log(`IndexNow responded: ${res.status} ${res.statusText}`);
    if (res.status !== 200 && res.status !== 202) {
        console.error(await res.text().catch(() => ''));
        process.exit(1);
    }
    console.log('Done.');
}

main().catch((err) => {
    console.error('IndexNow submit failed:', err.message);
    process.exit(1);
});
