// ======================
// EXO — App
// ======================

const PAYPAL_EMAIL   = 'your-paypal@email.com'; // <-- your PayPal email
const DISCOUNT_CODE  = 'BRAHIM';
const DISCOUNT_PCT   = 0.20; // 20%

let cart            = [];
let discountApplied = false;
let selectedModel   = null;

// ======================
// TAB NAVIGATION
// ======================
function showTab(tab) {
  // Hide all pages
  document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
  // Deactivate all nav tabs
  document.querySelectorAll('.nav-tab').forEach(a => a.classList.remove('active'));

  // Show target
  const page = document.getElementById('tab-' + tab);
  if (page) page.classList.add('active');

  // Highlight correct nav link
  const link = document.querySelector(`.nav-tab[data-tab="${tab}"]`);
  if (link) link.classList.add('active');

  // Close mobile menu
  closeMobileMenu();

  // Scroll to top of page
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// ======================
// HAMBURGER
// ======================
function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn  = document.getElementById('hamburger');
  const open = menu.classList.contains('open');
  menu.classList.toggle('open', !open);
  btn.classList.toggle('open', !open);
}

function closeMobileMenu() {
  document.getElementById('mobile-menu').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}

// Close menu on outside click
document.addEventListener('click', (e) => {
  const menu = document.getElementById('mobile-menu');
  const btn  = document.getElementById('hamburger');
  if (!menu.contains(e.target) && !btn.contains(e.target)) {
    closeMobileMenu();
  }
});

// ======================
// MODEL SELECTOR
// ======================
function selectModel(btn, model) {
  if (btn.classList.contains('active')) {
    btn.classList.remove('active');
    selectedModel = null;
    return;
  }
  document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedModel = model;
  document.getElementById('model-error').textContent = '';
}

// ======================
// ADD WHEELIE BAR
// ======================
function addToCartWithModel() {
  if (!selectedModel) {
    document.getElementById('model-error').textContent = 'Pick your scooter model first';
    return;
  }
  const name     = `Wheelie Bar (${selectedModel})`;
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    const old = cart.findIndex(i => i.name.startsWith('Wheelie Bar'));
    if (old !== -1) cart.splice(old, 1);
    cart.push({ name, price: 65, qty: 1 });
  }
  renderCart();
  updateCartCount();
  showToast(`Wheelie Bar (${selectedModel}) added ✓`);
}

// ======================
// ADD TO CART
// ======================
function addToCart(name, price) {
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  renderCart();
  updateCartCount();
  showToast(`${name} added ✓`);
}

// ======================
// RENDER CART
// ======================
function renderCart() {
  const ul       = document.getElementById('cart-items');
  const emptyMsg = document.getElementById('cart-empty');

  ul.querySelectorAll('.cart-item').forEach(el => el.remove());

  if (cart.length === 0) {
    emptyMsg.style.display = 'block';
  } else {
    emptyMsg.style.display = 'none';
    cart.forEach((item, i) => {
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        <div class="cart-item-left">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-qty">
            <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
            ${item.qty}
            <button class="qty-btn" onclick="changeQty(${i},1)">+</button>
          </span>
        </div>
        <div class="cart-item-right">
          <span class="cart-item-price">€${(item.price * item.qty).toFixed(2)}</span>
          <button class="remove-btn" onclick="removeItem(${i})" aria-label="Remove">✕</button>
        </div>`;
      ul.appendChild(li);
    });
  }
  updateTotals();
}

// ======================
// QTY / REMOVE
// ======================
function changeQty(i, d) {
  cart[i].qty += d;
  if (cart[i].qty <= 0) cart.splice(i, 1);
  renderCart();
  updateCartCount();
}

function removeItem(i) {
  const name = cart[i].name;
  cart.splice(i, 1);
  renderCart();
  updateCartCount();
  showToast(`${name} removed`);
}

// ======================
// CART COUNT
// ======================
function updateCartCount() {
  const n = cart.reduce((a, i) => a + i.qty, 0);
  document.getElementById('cart-count').textContent     = n;
  document.getElementById('cart-count-mob').textContent = n;
}

// ======================
// DISCOUNT
// ======================
function applyDiscount() {
  const val = document.getElementById('discount-input').value.trim().toUpperCase();
  const msg = document.getElementById('discount-msg');

  if (val === DISCOUNT_CODE) {
    discountApplied = true;
    msg.textContent = '✓ Code applied — 20% off';
    msg.className   = 'discount-msg success';
    showToast('20% discount applied ✓');
  } else {
    discountApplied = false;
    msg.textContent = '✗ Invalid code.';
    msg.className   = 'discount-msg error';
  }
  updateTotals();
}

// ======================
// TOTALS
// ======================
function updateTotals() {
  const sub      = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const discount = discountApplied ? sub * DISCOUNT_PCT : 0;
  const total    = sub - discount;

  document.getElementById('subtotal').textContent    = `€${sub.toFixed(2)}`;
  document.getElementById('total-final').textContent = `€${total.toFixed(2)}`;

  const row = document.getElementById('discount-row');
  if (discountApplied && sub > 0) {
    row.style.display = 'flex';
    document.getElementById('discount-amount').textContent = `-€${discount.toFixed(2)}`;
  } else {
    row.style.display = 'none';
  }
}

// ======================
// SUBMIT ORDER
// ======================
function submitOrder(e) {
  e.preventDefault();

  if (cart.length === 0) {
    showToast('Add something to your cart first');
    showTab('shop');
    return;
  }

  const name     = document.getElementById('f-name').value.trim();
  const email    = document.getElementById('f-email').value.trim();
  const address  = document.getElementById('f-address').value.trim();
  const city     = document.getElementById('f-city').value.trim();
  const postcode = document.getElementById('f-postcode').value.trim();
  const country  = document.getElementById('f-country').value;
  const notes    = document.getElementById('f-notes').value.trim();

  if (!name || !email || !address || !city || !postcode || !country) {
    showToast('Fill in all required fields');
    return;
  }

  const sub      = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const discount = discountApplied ? sub * DISCOUNT_PCT : 0;
  const total    = (sub - discount).toFixed(2);

  const items     = cart.map(i => `${i.name} x${i.qty}`).join(', ');
  const dNote     = discountApplied ? ' (-20%)' : '';
  const shipNote  = `${name}, ${address}, ${city}, ${postcode}, ${country}${notes ? ' | ' + notes : ''}`;

  const url = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick`
    + `&business=${encodeURIComponent(PAYPAL_EMAIL)}`
    + `&item_name=${encodeURIComponent('EXO: ' + items + dNote)}`
    + `&amount=${total}`
    + `&currency_code=EUR`
    + `&custom=${encodeURIComponent(shipNote)}`
    + `&no_shipping=1`;

  showToast(`Going to PayPal — €${total}`);
  setTimeout(() => window.open(url, '_blank'), 700);
}

// ======================
// TOAST
// ======================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2800);
}
