(() => {
    const locale = document.body.dataset.locale === 'en' ? 'en' : 'lt';
    const copy = locale === 'en'
        ? { added: 'Added to cart', empty: 'Your cart is empty.<br>A great steak awaits below.', remove: 'Remove', perKg: '/ kg' }
        : { added: 'Įdėta į krepšelį', empty: 'Krepšelis dar tuščias.<br>Geras kepsnys laukia žemiau.', remove: 'Pašalinti', perKg: '/ kg' };
    const currency = new Intl.NumberFormat(locale === 'en' ? 'en-IE' : 'lt-LT', { style: 'currency', currency: 'EUR' });
    const storageKey = 'mrukis-cart-v1';
    let cart = {};
    try { cart = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch (_) { cart = {}; }
    document.querySelectorAll('[data-product-id]').forEach((product) => {
        const saved = cart[product.dataset.productId];
        if (saved) {
            saved.name = product.dataset.name;
            saved.price = Number(product.dataset.price);
        }
    });

    const drawer = document.querySelector('[data-cart-drawer]');
    const overlay = document.querySelector('[data-cart-overlay]');
    const items = document.querySelector('[data-cart-items]');
    const total = document.querySelector('[data-cart-total]');
    const toast = document.querySelector('[data-toast]');
    let lastFocus = null;

    function save() {
        localStorage.setItem(storageKey, JSON.stringify(cart));
        render();
    }
    function render() {
        const entries = Object.values(cart).filter((item) => item.quantity > 0);
        const count = entries.reduce((sum, item) => sum + item.quantity, 0);
        document.querySelectorAll('.cart-count').forEach((node) => { node.textContent = count; });
        if (!entries.length) {
            items.innerHTML = `<p class="cart-empty">${copy.empty}</p>`;
        } else {
            items.innerHTML = entries.map((item) => `
                <article class="cart-item" data-cart-id="${item.id}">
                    <h3>${item.name}</h3><span class="cart-item__price">${currency.format(item.price * item.quantity)}</span>
                    <div class="cart-item__controls"><button type="button" data-decrease aria-label="− ${item.name}">−</button><span>${item.quantity} kg</span><button type="button" data-increase aria-label="+ ${item.name}">+</button></div>
                    <button class="cart-item__remove" type="button" data-remove>${copy.remove}</button>
                </article>`).join('');
        }
        total.textContent = currency.format(entries.reduce((sum, item) => sum + item.price * item.quantity, 0));
    }
    function openCart() {
        lastFocus = document.activeElement;
        drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false'); overlay.hidden = false; document.body.classList.add('cart-open');
        drawer.querySelector('[data-cart-close]').focus();
    }
    function closeCart() {
        drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); overlay.hidden = true; document.body.classList.remove('cart-open');
        if (lastFocus) lastFocus.focus();
    }
    function showToast() {
        toast.textContent = copy.added; toast.classList.add('is-visible');
        window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 1800);
    }
    document.querySelectorAll('[data-add-to-cart]').forEach((button) => button.addEventListener('click', () => {
        const product = button.closest('[data-product-id]'); const id = product.dataset.productId;
        cart[id] = cart[id] || { id, name: product.dataset.name, price: Number(product.dataset.price), quantity: 0 };
        cart[id].quantity += 1; save(); showToast();
    }));
    document.querySelectorAll('[data-cart-open]').forEach((button) => button.addEventListener('click', openCart));
    document.querySelector('[data-cart-close]').addEventListener('click', closeCart); overlay.addEventListener('click', closeCart);
    items.addEventListener('click', (event) => {
        const row = event.target.closest('[data-cart-id]'); if (!row) return; const item = cart[row.dataset.cartId];
        if (event.target.closest('[data-increase]')) item.quantity += 1;
        if (event.target.closest('[data-decrease]')) item.quantity -= 1;
        if (event.target.closest('[data-remove]') || item.quantity <= 0) delete cart[row.dataset.cartId];
        save();
    });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && drawer.classList.contains('is-open')) closeCart(); });
    document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
        const category = button.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('is-active', item === button));
        document.querySelectorAll('.product').forEach((product) => { product.hidden = category !== 'all' && product.dataset.category !== category; });
    }));
    render();
})();
