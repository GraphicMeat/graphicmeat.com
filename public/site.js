// ===== Contact form (no-ops on pages without the form) =====
(function () {
    const form = document.getElementById('contact-form');
    const statusEl = document.getElementById('form-status');
    if (!form || !statusEl) return;

    const startedEl = document.getElementById('cf-started');
    const submitBtn = document.getElementById('cf-submit');
    if (startedEl) startedEl.value = Date.now();

    function setStatus(msg, kind) {
        statusEl.textContent = msg;
        statusEl.className = 'form-status' + (kind ? ' ' + kind : '');
    }

    // No-JS fallback feedback (server redirects to ?sent=1 / ?error=...)
    const params = new URLSearchParams(location.search);
    if (params.get('sent') === '1') setStatus('Thanks — your message is on its way.', 'ok');
    else if (params.get('error')) setStatus(params.get('error'), 'err');
    if (params.has('sent') || params.has('error')) {
        history.replaceState(null, '', location.pathname + location.hash);
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        setStatus('Sending…', '');
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
                setStatus('Thanks — your message is on its way.', 'ok');
                form.reset();
                if (startedEl) startedEl.value = Date.now();
            } else {
                setStatus(data.error || 'Something went wrong. Please try again.', 'err');
            }
        } catch (_) {
            setStatus('Network error. Please try again.', 'err');
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

    const startedEl = document.getElementById('nl-started');
    const submitBtn = document.getElementById('nl-submit');
    if (startedEl) startedEl.value = Date.now();

    function setStatus(msg, kind) {
        statusEl.textContent = msg;
        statusEl.className = 'newsletter-status' + (kind ? ' ' + kind : '');
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        setStatus('Sending…', '');
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
                setStatus(data.message || 'Almost there — check your email to confirm.', 'ok');
                form.reset();
                if (startedEl) startedEl.value = Date.now();
            } else {
                setStatus(data.error || 'Something went wrong. Please try again.', 'err');
            }
        } catch (_) {
            setStatus('Network error. Please try again.', 'err');
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
