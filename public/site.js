// ===== Site-wide localization preference =====
(function () {
    const prefixes = { en: '', de: '/de', fr: '/fr', es: '/es', it: '/it', ja: '/ja', ko: '/ko', 'zh-Hans': '/zh-hans', 'pt-BR': '/pt-br' };
    const pages = ['/', '/blog', '/contact', '/app-privacy', '/subscribed', '/photobooks', '/blog/automatic-masonry-layouts-photobooks'];
    const pathsFor = (page) => Object.fromEntries(Object.entries(prefixes).map(([locale, prefix]) => [locale, page === '/' ? (prefix || '/') : prefix + page]));
    let selected = null;
    try { selected = localStorage.getItem('graphicmeat-language'); } catch (_) {}

    function browserLanguage() {
        const languages = navigator.languages || [navigator.language || ''];
        for (const raw of languages) {
            const value = String(raw).replace('_', '-').toLowerCase();
            const language = value.split('-')[0];
            if (language === 'zh' && (value.includes('hans') || /-(cn|sg)(-|$)/.test(value))) return 'zh-Hans';
            if (language === 'pt') return 'pt-BR';
            if (['de', 'fr', 'es', 'it', 'ja', 'ko'].includes(language)) return language;
            if (language === 'en') return 'en';
        }
        return 'en';
    }

    const englishPage = pages.find((page) => location.pathname === page || (page !== '/' && location.pathname === page + '/'));
    if (englishPage) {
        const destination = pathsFor(englishPage)[selected || browserLanguage()];
        if (destination !== englishPage) {
            location.replace(destination + location.search + location.hash);
            return;
        }
    }

    document.querySelectorAll('.pb-language-switcher [data-language]').forEach((link) => {
        link.addEventListener('click', () => {
            try { localStorage.setItem('graphicmeat-language', link.dataset.language); } catch (_) {}
        });
    });

    // Keep a saved choice site-wide, including pages that have not yet been visited.
    if (selected && prefixes[selected] !== undefined) {
        pages.forEach((page) => {
            document.querySelectorAll(`a[href="${page}"]:not([data-language]), a[href^="${page}#"]:not([data-language])`).forEach((link) => {
                const suffix = link.getAttribute('href').slice(page.length);
                link.href = pathsFor(page)[selected] + suffix;
            });
        });
    }
})();

// ===== Contact form (no-ops on pages without the form) =====
(function () {
    const form = document.getElementById('contact-form');
    const statusEl = document.getElementById('form-status');
    if (!form || !statusEl) return;

    const startedEl = document.getElementById('cf-started');
    const submitBtn = document.getElementById('cf-submit');
    const contactTranslations = {
        de: ['Danke — Ihre Nachricht ist unterwegs.', 'Wird gesendet…', 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.', 'Netzwerkfehler. Bitte versuchen Sie es erneut.'],
        fr: ['Merci — votre message a bien été envoyé.', 'Envoi…', 'Un problème est survenu. Veuillez réessayer.', 'Erreur réseau. Veuillez réessayer.'],
        es: ['Gracias, tu mensaje está en camino.', 'Enviando…', 'Algo ha salido mal. Inténtalo de nuevo.', 'Error de red. Inténtalo de nuevo.'],
        it: ['Grazie — il tuo messaggio è stato inviato.', 'Invio…', 'Qualcosa è andato storto. Riprova.', 'Errore di rete. Riprova.'],
        ja: ['ありがとうございます。メッセージを送信しました。', '送信中…', '問題が発生しました。もう一度お試しください。', 'ネットワークエラーです。もう一度お試しください。'],
        ko: ['감사합니다. 메시지가 전송되었습니다.', '전송 중…', '문제가 발생했습니다. 다시 시도해 주세요.', '네트워크 오류입니다. 다시 시도해 주세요.'],
        'zh-Hans': ['谢谢，您的消息已发送。', '正在发送…', '出现问题，请重试。', '网络错误，请重试。'],
        'pt-BR': ['Obrigado — sua mensagem foi enviada.', 'Enviando…', 'Algo deu errado. Tente novamente.', 'Erro de rede. Tente novamente.']
    };
    const messages = contactTranslations[document.documentElement.lang];
    if (startedEl) startedEl.value = Date.now();

    function setStatus(msg, kind) {
        statusEl.textContent = msg;
        statusEl.className = 'form-status' + (kind ? ' ' + kind : '');
    }

    // No-JS fallback feedback (server redirects to ?sent=1 / ?error=...)
    const params = new URLSearchParams(location.search);
    if (params.get('sent') === '1') setStatus(messages ? messages[0] : 'Thanks — your message is on its way.', 'ok');
    else if (params.get('error')) setStatus(messages ? messages[2] : params.get('error'), 'err');
    if (params.has('sent') || params.has('error')) {
        history.replaceState(null, '', location.pathname + location.hash);
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        setStatus(messages ? messages[1] : 'Sending…', '');
        if (submitBtn) submitBtn.disabled = true;
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'X-Requested-With': 'fetch'
                },
                body: new URLSearchParams(new FormData(form)).toString()
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.ok) {
                setStatus(messages ? messages[0] : 'Thanks — your message is on its way.', 'ok');
                form.reset();
                if (startedEl) startedEl.value = Date.now();
            } else {
                setStatus(messages ? messages[2] : (data.error || 'Something went wrong. Please try again.'), 'err');
            }
        } catch (_) {
            setStatus(messages ? messages[3] : 'Network error. Please try again.', 'err');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
})();

// ===== Newsletter signup (no-ops on pages without the form) =====
(function () {
    const form = document.getElementById('newsletter-form');
    const statusEl = document.getElementById('newsletter-status');
    if (!form || !statusEl) return;

    const locale = document.documentElement.lang;
    const translations = {
        de: ['Wird gesendet…', 'Fast geschafft — bestätigen Sie die Anmeldung in Ihrer E-Mail.', 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.', 'Netzwerkfehler. Bitte versuchen Sie es erneut.'],
        fr: ['Envoi…', 'Presque terminé — confirmez votre inscription dans votre e-mail.', 'Un problème est survenu. Veuillez réessayer.', 'Erreur réseau. Veuillez réessayer.'],
        es: ['Enviando…', 'Ya casi está — confirma la suscripción en tu correo.', 'Algo ha salido mal. Inténtalo de nuevo.', 'Error de red. Inténtalo de nuevo.'],
        it: ['Invio…', 'Ci siamo quasi — conferma l’iscrizione nella tua e-mail.', 'Qualcosa è andato storto. Riprova.', 'Errore di rete. Riprova.'],
        ja: ['送信中…', 'あと少しです。メールで登録を確認してください。', '問題が発生しました。もう一度お試しください。', 'ネットワークエラーです。もう一度お試しください。'],
        ko: ['전송 중…', '거의 완료되었습니다. 이메일에서 구독을 확인해 주세요.', '문제가 발생했습니다. 다시 시도해 주세요.', '네트워크 오류입니다. 다시 시도해 주세요.'],
        'zh-Hans': ['正在发送…', '即将完成 — 请在电子邮件中确认订阅。', '出现问题，请重试。', '网络错误，请重试。'],
        'pt-BR': ['Enviando…', 'Quase lá — confirme a inscrição no seu e-mail.', 'Algo deu errado. Tente novamente.', 'Erro de rede. Tente novamente.']
    };
    const messages = translations[locale];

    const startedEl = document.getElementById('nl-started');
    const submitBtn = document.getElementById('nl-submit');
    if (startedEl) startedEl.value = Date.now();

    function setStatus(msg, kind) {
        statusEl.textContent = msg;
        statusEl.className = 'newsletter-status' + (kind ? ' ' + kind : '');
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        setStatus(messages ? messages[0] : 'Sending…', '');
        if (submitBtn) submitBtn.disabled = true;
        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'X-Requested-With': 'fetch'
                },
                body: new URLSearchParams(new FormData(form)).toString()
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.ok) {
                setStatus(messages ? messages[1] : (data.message || 'Almost there — check your email to confirm.'), 'ok');
                form.reset();
                if (startedEl) startedEl.value = Date.now();
            } else {
                setStatus(messages ? messages[2] : (data.error || 'Something went wrong. Please try again.'), 'err');
            }
        } catch (_) {
            setStatus(messages ? messages[3] : 'Network error. Please try again.', 'err');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
})();

// ===== GitHub star counts (progressive enhancement) =====
(function () {
    const badges = document.querySelectorAll('.gh-stars[data-repo]');
    badges.forEach(async (el) => {
        try {
            const r = await fetch('https://api.github.com/repos/' + el.dataset.repo);
            if (!r.ok) return;
            const n = (await r.json()).stargazers_count;
            const c = el.querySelector('.count');
            if (c && Number.isFinite(n)) { c.textContent = n; c.hidden = false; }
        } catch (_) { /* offline / rate-limited — link + label still shown */ }
    });
})();

// ===== Screenshot lightbox (progressive enhancement) =====
(function () {
    const shots = Array.from(document.querySelectorAll('.shots .shot img'));
    if (!shots.length) return;

    let index = 0, lastFocus = null;

    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Screenshot viewer');
    box.innerHTML =
        '<span class="lightbox-count" aria-hidden="true"></span>' +
        '<button class="lightbox-btn lightbox-close" type="button" aria-label="Close">&times;</button>' +
        '<button class="lightbox-btn lightbox-prev" type="button" aria-label="Previous screenshot">&#8249;</button>' +
        '<button class="lightbox-btn lightbox-next" type="button" aria-label="Next screenshot">&#8250;</button>' +
        '<figure class="lightbox-figure"><img alt=""><figcaption class="lightbox-cap"></figcaption></figure>';
    document.body.appendChild(box);

    const imgEl = box.querySelector('.lightbox-figure img');
    const capEl = box.querySelector('.lightbox-cap');
    const countEl = box.querySelector('.lightbox-count');

    function show(i) {
        index = (i + shots.length) % shots.length;
        const src = shots[index];
        imgEl.src = src.currentSrc || src.src;
        imgEl.alt = src.alt || '';
        capEl.textContent = src.alt || '';
        countEl.textContent = (index + 1) + ' / ' + shots.length;
    }
    function open(i) {
        lastFocus = document.activeElement;
        show(i);
        box.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        box.querySelector('.lightbox-close').focus();
    }
    function close() {
        box.classList.remove('is-open');
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus();
    }

    shots.forEach((img, i) => {
        const li = img.closest('.shot');
        li.tabIndex = 0;
        li.setAttribute('role', 'button');
        li.setAttribute('aria-label', 'View screenshot: ' + (img.alt || 'screenshot'));
        li.addEventListener('click', () => open(i));
        li.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
        });
    });

    box.querySelector('.lightbox-close').addEventListener('click', close);
    box.querySelector('.lightbox-prev').addEventListener('click', () => show(index - 1));
    box.querySelector('.lightbox-next').addEventListener('click', () => show(index + 1));
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    document.addEventListener('keydown', (e) => {
        if (!box.classList.contains('is-open')) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft') show(index - 1);
        else if (e.key === 'ArrowRight') show(index + 1);
    });
})();

// ===== Cursor glow =====
(function () {
    const glow = document.getElementById('glow');
    if (!glow) return;
    let glowOn = false;
    document.addEventListener('mousemove', (e) => {
        if (!glowOn) { glow.style.opacity = '1'; glowOn = true; }
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    });
    document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; glowOn = false; });
})();

// ===== Floating pixel particles =====
(function createPixels() {
    const colors = ['#cc1028', '#e8192e', '#e8601e', '#f08030', '#b8bcc8'];
    const count = Math.min(15, Math.floor(window.innerWidth / 100));
    for (let i = 0; i < count; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        const size = 3 + Math.random() * 4;
        pixel.style.width = size + 'px';
        pixel.style.height = size + 'px';
        pixel.style.left = Math.random() * 100 + 'vw';
        pixel.style.bottom = '-10px';
        pixel.style.background = colors[Math.floor(Math.random() * colors.length)];
        pixel.style.animationDuration = (6 + Math.random() * 10) + 's';
        pixel.style.animationDelay = (Math.random() * 12) + 's';
        pixel.style.opacity = '0';
        document.body.appendChild(pixel);
    }
})();

// ===== Circuit-trace canvas background =====
(function () {
    const canvas = document.getElementById('bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let seed = 77;
        function rng() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
        ctx.strokeStyle = 'rgba(200, 16, 40, 0.04)';
        ctx.lineWidth = 1;
        const traceCount = Math.floor((canvas.width * canvas.height) / 50000);
        for (let i = 0; i < traceCount; i++) {
            let x = rng() * canvas.width;
            let y = rng() * canvas.height;
            const segments = 3 + Math.floor(rng() * 5);
            ctx.beginPath();
            ctx.moveTo(x, y);
            for (let s = 0; s < segments; s++) {
                const dir = Math.floor(rng() * 4);
                const len = 20 + rng() * 60;
                if (dir === 0) x += len; else if (dir === 1) x -= len;
                else if (dir === 2) y += len; else y -= len;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
            if (rng() > 0.5) {
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(200, 16, 40, 0.06)';
                ctx.fill();
            }
        }
    }
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        draw();
    }
    resize();
    window.addEventListener('resize', resize);
})();
