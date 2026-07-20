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
    { source: 'blog-what-is-graphic-meat.html', stem: 'blog-what-is-graphic-meat', route: '/blog/what-is-graphic-meat' },
    { source: 'meatpad.html', stem: 'meatpad', route: '/meatpad' },
];

const onlyIndex = process.argv.indexOf('--only');
const onlyStem = onlyIndex === -1 ? '' : process.argv[onlyIndex + 1];
if (onlyIndex !== -1 && !onlyStem) throw new Error('--only requires a page stem');
const selectedPages = onlyStem ? pages.filter((page) => page.stem === onlyStem) : pages;
if (!selectedPages.length) throw new Error(`unknown page stem: ${onlyStem}`);

const protectedText = /^(?:Graphic|Meat|Graphic Meat|GraphicMeat|MailVault|PhotoBooks|MeatPad|Markdown|Swift|Rust|TypeScript|JavaScript|Python|SourceKit-LSP|rust-analyzer|typescript-language-server|Pyright|SwiftUI|LSP|KISS|SOLID|macOS|Linux|Gmail|Outlook|IMAP|Apple|GitHub|X|graphicmeat\.com|rokas-ambrazevicius|@GraphicMeat|you@example\.com|Cooked over an|open GPU|by|Est\. 2013|\.eml|\d+|[\W_]+)$/i;
const translateAttrs = /\b(?:aria-label|alt|placeholder|data-(?:pending|already|expired|invalid)-(?:title|body))="([^"]+)"/g;
// Mask tokens must not contain dictionary words — Google Translate translates
// them (e.g. __BRAND__ → __ブランド__) and unmask then misses. Digit-suffixed
// nonsense tokens survive like the chunk markers do.
const masks = new Map([
    ['GraphicMeat', '__GMW_1__'], ['Graphic Meat', '__GMW_2__'],
    ['MailVault', '__GMW_3__'], ['PhotoBooks', '__GMW_4__'], ['macOS', '__GMW_5__'],
    ['MeatPad', '__GMW_6__'], ['Markdown', '__GMW_7__'], ['SwiftUI', '__GMW_8__'],
    ['SourceKit-LSP', '__GMW_9__'], ['rust-analyzer', '__GMW_10__'],
    ['typescript-language-server', '__GMW_11__'], ['Pyright', '__GMW_12__'], ['LSP', '__GMW_13__'],
]);

// Human-reviewed campaign lines. Machine translation supplies the long-form body
// copy; these high-visibility phrases need idiomatic product language, not literal
// word-for-word output (especially "editor", which can mean a person/publisher).
const manualTranslations = {
    de: {
        'Start with a note.': 'Starten Sie mit einer Notiz.',
        'Stay for the editor.': 'Bleiben Sie wegen des Editors.',
        'Get the launch update': 'Zum Start benachrichtigen',
        'See the workspace': 'Arbeitsbereich ansehen',
        'Find the sentence.': 'Finden Sie den Satz.',
        'Not the file.': 'Nicht die Datei.',
        'A notebook that can grow teeth': 'Ein Notizbuch mit Biss',
        'Plain text when it should be. A project when it must be.': 'Klartext, wenn er genügt. Ein Projekt, wenn es sein muss.',
        'Project-aware completion': 'Projektbezogene Vervollständigung',
        'Bring your own intelligence': 'Intelligenz aus Ihren eigenen Tools',
        'Your language server. Your machine. No cloud middleman.': 'Ihr Language Server. Ihr Mac. Keine Cloud dazwischen.',
        'Every token has a color. You choose it.': 'Jedes Token hat seine Farbe. Sie bestimmen welche.',
        'No account. No sync engine. No hostage data.': 'Kein Konto. Keine Sync-Engine. Keine Daten als Geisel.',
        'The editor is ready.': 'Der Editor ist bereit.',
        'The release is next.': 'Als Nächstes kommt die Veröffentlichung.',
        'Get the MeatPad launch email': 'Zum MeatPad-Start benachrichtigen',
    },
    fr: {
        'Start with a note.': 'Commencez par une note.',
        'Stay for the editor.': 'Restez pour l’éditeur.',
        'Get the launch update': 'Me prévenir au lancement',
        'See the workspace': 'Découvrir l’espace de travail',
        'Find the sentence.': 'Retrouvez la phrase.',
        'Not the file.': 'Pas le fichier.',
        'A notebook that can grow teeth': 'Un carnet qui a du mordant',
        'Plain text when it should be. A project when it must be.': 'Du texte brut quand il suffit. Un projet quand il le faut.',
        'Project-aware completion': 'Complétion adaptée au projet',
        'Bring your own intelligence': 'Apportez votre propre intelligence',
        'Your language server. Your machine. No cloud middleman.': 'Votre serveur de langage. Votre Mac. Aucun intermédiaire dans le cloud.',
        'Every token has a color. You choose it.': 'Chaque élément syntaxique a sa couleur. À vous de la choisir.',
        'No account. No sync engine. No hostage data.': 'Aucun compte. Aucun moteur de synchronisation. Vos données restent à vous.',
        'The editor is ready.': 'L’éditeur est prêt.',
        'The release is next.': 'La sortie arrive.',
        'Get the MeatPad launch email': 'Recevoir l’annonce du lancement de MeatPad',
    },
    es: {
        'Start with a note.': 'Empieza con una nota.',
        'Stay for the editor.': 'Quédate por el editor.',
        'Get the launch update': 'Avísame cuando se lance',
        'See the workspace': 'Ver el espacio de trabajo',
        'Find the sentence.': 'Encuentra la frase.',
        'Not the file.': 'No el archivo.',
        'A notebook that can grow teeth': 'Un cuaderno con carácter',
        'Plain text when it should be. A project when it must be.': 'Texto sin formato cuando basta. Un proyecto cuando hace falta.',
        'Project-aware completion': 'Completado según el proyecto',
        'Bring your own intelligence': 'Usa tu propia inteligencia',
        'Your language server. Your machine. No cloud middleman.': 'Tu servidor de lenguaje. Tu Mac. Sin intermediarios en la nube.',
        'Every token has a color. You choose it.': 'Cada elemento tiene un color. Tú lo eliges.',
        'No account. No sync engine. No hostage data.': 'Sin cuenta. Sin motor de sincronización. Tus datos son tuyos.',
        'The editor is ready.': 'El editor está listo.',
        'The release is next.': 'El lanzamiento es lo siguiente.',
        'Get the MeatPad launch email': 'Recibe el aviso de lanzamiento de MeatPad',
    },
    it: {
        'Start with a note.': 'Inizia da una nota.',
        'Stay for the editor.': 'Resta per l’editor.',
        'Get the launch update': 'Avvisami al lancio',
        'See the workspace': 'Scopri l’area di lavoro',
        'Find the sentence.': 'Trova la frase.',
        'Not the file.': 'Non il file.',
        'A notebook that can grow teeth': 'Un taccuino che sa farsi valere',
        'Plain text when it should be. A project when it must be.': 'Testo semplice quando basta. Un progetto quando serve.',
        'Project-aware completion': 'Completamento basato sul progetto',
        'Bring your own intelligence': 'Porta la tua intelligenza',
        'Your language server. Your machine. No cloud middleman.': 'Il tuo language server. Il tuo Mac. Nessun intermediario cloud.',
        'Every token has a color. You choose it.': 'Ogni token ha un colore. Lo scegli tu.',
        'No account. No sync engine. No hostage data.': 'Nessun account. Nessun motore di sincronizzazione. I dati restano tuoi.',
        'The editor is ready.': 'L’editor è pronto.',
        'The release is next.': 'Ora manca solo il rilascio.',
        'Get the MeatPad launch email': 'Ricevi l’annuncio del lancio di MeatPad',
    },
    ja: {
        'Start with a note.': 'メモから始める。',
        'Stay for the editor.': 'エディタで続ける。',
        'Get the launch update': 'リリース通知を受け取る',
        'See the workspace': 'ワークスペースを見る',
        'Find the sentence.': '文章を見つける。',
        'Not the file.': 'ファイルではなく。',
        'A notebook that can grow teeth': '本格派へ育つノート',
        'Plain text when it should be. A project when it must be.': '必要なときはプレーンテキスト。必要ならプロジェクト。',
        'Project-aware completion': 'プロジェクト対応補完',
        'Bring your own intelligence': '使い慣れた知能を持ち込む',
        'Your language server. Your machine. No cloud middleman.': 'あなたの言語サーバー。あなたの Mac。クラウドは介在しません。',
        'Every token has a color. You choose it.': 'すべてのトークンに色を。選ぶのはあなたです。',
        'No account. No sync engine. No hostage data.': 'アカウントなし。同期エンジンなし。データの囲い込みなし。',
        'The editor is ready.': 'エディタの準備は完了。',
        'The release is next.': 'あとはリリースだけ。',
        'Get the MeatPad launch email': 'MeatPad のリリース通知を受け取る',
    },
    ko: {
        'Start with a note.': '메모로 시작하세요.',
        'Stay for the editor.': '편집기로 이어가세요.',
        'Get the launch update': '출시 알림 받기',
        'See the workspace': '작업 공간 보기',
        'Find the sentence.': '문장을 찾으세요.',
        'Not the file.': '파일이 아니라.',
        'A notebook that can grow teeth': '본격적인 도구로 자라는 노트',
        'Plain text when it should be. A project when it must be.': '간단할 때는 일반 텍스트. 필요할 때는 프로젝트.',
        'Project-aware completion': '프로젝트 인식 자동 완성',
        'Bring your own intelligence': '익숙한 인텔리전스를 그대로',
        'Your language server. Your machine. No cloud middleman.': '내 언어 서버. 내 Mac. 클라우드 중개자 없이.',
        'Every token has a color. You choose it.': '모든 토큰에 색을. 선택은 당신이.',
        'No account. No sync engine. No hostage data.': '계정 없음. 동기화 엔진 없음. 데이터 종속 없음.',
        'The editor is ready.': '편집기는 준비됐습니다.',
        'The release is next.': '이제 출시만 남았습니다.',
        'Get the MeatPad launch email': 'MeatPad 출시 알림 받기',
    },
    'zh-Hans': {
        'Start with a note.': '从一条笔记开始。',
        'Stay for the editor.': '因编辑器而留下。',
        'Get the launch update': '获取发布通知',
        'See the workspace': '查看工作区',
        'Find the sentence.': '找到那句话。',
        'Not the file.': '而不是那个文件。',
        'A notebook that can grow teeth': '会成长为利器的笔记本',
        'Plain text when it should be. A project when it must be.': '简单时用纯文本，需要时用项目。',
        'Project-aware completion': '项目感知补全',
        'Bring your own intelligence': '使用你自己的智能工具',
        'Your language server. Your machine. No cloud middleman.': '你的语言服务器。你的 Mac。无需云端中间商。',
        'Every token has a color. You choose it.': '每种语法标记都有颜色，由你决定。',
        'No account. No sync engine. No hostage data.': '无需账户。无需同步引擎。数据绝不被锁定。',
        'The editor is ready.': '编辑器已就绪。',
        'The release is next.': '下一步就是发布。',
        'Get the MeatPad launch email': '获取 MeatPad 发布通知',
    },
    'pt-BR': {
        'Start with a note.': 'Comece com uma nota.',
        'Stay for the editor.': 'Fique pelo editor.',
        'Get the launch update': 'Avise-me no lançamento',
        'See the workspace': 'Ver o espaço de trabalho',
        'Find the sentence.': 'Encontre a frase.',
        'Not the file.': 'Não o arquivo.',
        'A notebook that can grow teeth': 'Um bloco de notas que ganha força',
        'Plain text when it should be. A project when it must be.': 'Texto simples quando basta. Um projeto quando precisa.',
        'Project-aware completion': 'Conclusão contextual do projeto',
        'Bring your own intelligence': 'Traga sua própria inteligência',
        'Your language server. Your machine. No cloud middleman.': 'Seu servidor de linguagem. Seu Mac. Sem intermediário na nuvem.',
        'Every token has a color. You choose it.': 'Cada token tem uma cor. Você escolhe.',
        'No account. No sync engine. No hostage data.': 'Sem conta. Sem mecanismo de sincronização. Seus dados continuam seus.',
        'The editor is ready.': 'O editor está pronto.',
        'The release is next.': 'O lançamento vem a seguir.',
        'Get the MeatPad launch email': 'Receba o aviso de lançamento do MeatPad',
    },
};
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
                if (typeof value === 'string' && ['name', 'description', 'slogan', 'headline', 'about', 'text'].includes(key) && shouldTranslate(value)) values.push(value);
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
    for (const [source, translation] of Object.entries(manualTranslations[locale.key] || {})) {
        result.set(source, translation);
    }
    const reviewed = manualTranslations[locale.key];
    if (reviewed) {
        result.set(
            'Start with a note. Stay for the editor.',
            `${reviewed['Start with a note.']} ${reviewed['Stay for the editor.']}`
        );
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
    const known = ['/', '/blog', '/contact', '/app-privacy', '/subscribed', '/photobooks', '/meatpad', '/blog/automatic-masonry-layouts-photobooks', '/blog/what-is-graphic-meat'];
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
        const absoluteRoutes = ['/blog/automatic-masonry-layouts-photobooks', '/blog/what-is-graphic-meat', '/photobooks', '/meatpad', '/app-privacy', '/contact', '/blog', '/subscribed'];
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
    if (locale.key !== 'en') {
        html = html
            .replace(/(["'])logo\.png/g, '$1/logo.png')
            .replace(/(["'])site\.css/g, '$1/site.css')
            .replace(/(["'])site\.js/g, '$1/site.js')
            .replace(/(["'])assets\//g, '$1/assets/');
    }
    html = html.replace(/(<\/nav>)/, `$1\n        ${picker(page, locale)}`);
    html = html.replace(/(<input type="hidden" name="locale" value=")[^"]*(")/g, `$1${locale.route}$2`);
    if (page.stem === 'meatpad' && locale.key !== 'en') {
        html = html.replace(/assets\/meatpad\/images\/(0[1-6]-[^".]+\.webp)/g, `assets/meatpad/images/${locale.file}/$1`);
    }
    return html;
}

(async () => {
    const sources = new Map(selectedPages.map((page) => [page.source, fs.readFileSync(path.join(publicDir, page.source), 'utf8')]));
    const allValues = [...new Set([...sources.values()].flatMap(collect))];
    for (const locale of locales) {
        const translations = locale.key === 'en' ? new Map() : await translateValues(allValues, locale);
        for (const page of selectedPages) {
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
        const priority = page.route === '/' ? '0.9' : (['/blog', '/meatpad'].includes(page.route) ? '0.7' : page.route === '/contact' ? '0.5' : '0.4');
        const lastmod = page.route === '/meatpad' ? '2026-07-20' : '2026-07-16';
        return `  <url><loc>https://graphicmeat.com${routeFor(page, locale)}</loc><lastmod>${lastmod}</lastmod><changefreq>${frequency}</changefreq><priority>${priority}</priority></url>`;
    })).join('\n');
    sitemap = sitemap.replace('\n</urlset>', `\n  <!-- localized-site:start -->\n${localizedUrls}\n  <!-- localized-site:end -->\n</urlset>`);
    fs.writeFileSync(sitemapPath, sitemap);
})().catch((error) => { console.error(error); process.exitCode = 1; });
