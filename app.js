// ======================
// EXO — Cart & Checkout
// ======================

const PAYPAL_EMAIL = 'your-paypal@email.com'; // <-- swap with your actual PayPal email
const DISCOUNT_CODE = 'BRAHIM';
const DISCOUNT_PERCENT = 0.20; // 20% off

let cart = [];
let discountApplied = false;
let selectedModel = null;

// ---- MODEL SELECTOR (Wheelie Bar) ----
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

// ---- ADD WHEELIE BAR (requires model) ----
function addToCartWithModel() {
  if (!selectedModel) {
    document.getElementById('model-error').textContent = 'Pick your scooter model first';
    return;
  }
  const name = `Wheelie Bar (${selectedModel})`;
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    const idx = cart.findIndex(i => i.name.startsWith('Wheelie Bar'));
    if (idx !== -1) cart.splice(idx, 1);
    cart.push({ name, price: 65, qty: 1 });
  }
  renderCart();
  updateCartCount();
  showToast(`Wheelie Bar (${selectedModel}) added ✓`);
}

// ---- ADD TO CART ----
function addToCart(name, price) {
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  renderCart();
  updateCartCount();
  showToast(`${name} added ✓`);
}

// ---- RENDER CART ----
function renderCart() {
  const ul = document.getElementById('cart-items');
  const emptyMsg = document.getElementById('cart-empty');

  ul.querySelectorAll('.cart-item').forEach(el => el.remove());

  if (cart.length === 0) {
    emptyMsg.style.display = 'block';
  } else {
    emptyMsg.style.display = 'none';
    cart.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        <div class="cart-item-left">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-qty">
            <button class="qty-btn" onclick="changeQty(${index}, -1)">−</button>
            ${item.qty}
            <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
          </span>
        </div>
        <div class="cart-item-right">
          <span class="cart-item-price">€${(item.price * item.qty).toFixed(2)}</span>
          <button class="remove-btn" onclick="removeItem(${index})" aria-label="Remove">✕</button>
        </div>
      `;
      ul.appendChild(li);
    });
  }

  updateTotals();
}

// ---- CHANGE QTY ----
function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  renderCart();
  updateCartCount();
}

// ---- REMOVE ITEM ----
function removeItem(index) {
  const name = cart[index].name;
  cart.splice(index, 1);
  renderCart();
  updateCartCount();
  showToast(`${name} removed`);
}

// ---- CART COUNT ----
function updateCartCount() {
  const total = cart.reduce((acc, item) => acc + item.qty, 0);
  document.getElementById('cart-count').textContent = total;
}

// ---- APPLY DISCOUNT ----
function applyDiscount() {
  const input = document.getElementById('discount-input').value.trim().toUpperCase();
  const msg = document.getElementById('discount-msg');

  if (input === DISCOUNT_CODE) {
    discountApplied = true;
    msg.textContent = '✓ Code applied — 20% off';
    msg.className = 'discount-msg success';
    showToast('20% discount applied ✓');
  } else {
    discountApplied = false;
    msg.textContent = '✗ Invalid code.';
    msg.className = 'discount-msg error';
  }
  updateTotals();
}

// ---- TOTALS ----
function updateTotals() {
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const discount = discountApplied ? subtotal * DISCOUNT_PERCENT : 0;
  const total = subtotal - discount;

  document.getElementById('subtotal').textContent = `€${subtotal.toFixed(2)}`;
  document.getElementById('total-final').textContent = `€${total.toFixed(2)}`;

  const discountRow = document.getElementById('discount-row');
  if (discountApplied && subtotal > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('discount-amount').textContent = `-€${discount.toFixed(2)}`;
  } else {
    discountRow.style.display = 'none';
  }
}

// ---- SUBMIT ORDER (form validation → PayPal) ----
function submitOrder(e) {
  e.preventDefault();

  if (cart.length === 0) {
    showToast('Add something to your cart first');
    window.scrollTo({ top: document.getElementById('products').offsetTop - 80, behavior: 'smooth' });
    return;
  }

  // Gather form values
  const name     = document.getElementById('f-name').value.trim();
  const email    = document.getElementById('f-email').value.trim();
  const address  = document.getElementById('f-address').value.trim();
  const city     = document.getElementById('f-city').value.trim();
  const postcode = document.getElementById('f-postcode').value.trim();
  const country  = document.getElementById('f-country').value;
  const notes    = document.getElementById('f-notes').value.trim();

  // All required fields filled (browser handles required attr but double check)
  if (!name || !email || !address || !city || !postcode || !country) {
    showToast('Fill in all required fields');
    return;
  }

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const discount = discountApplied ? subtotal * DISCOUNT_PERCENT : 0;
  const total = (subtotal - discount).toFixed(2);

  const itemDesc = cart.map(item => `${item.name} x${item.qty}`).join(', ');
  const discountNote = discountApplied ? ' (-20%)' : '';
  const customerNote = `Ship to: ${name}, ${address}, ${city}, ${postcode}, ${country}${notes ? ' | Note: ' + notes : ''}`;

  const paypalURL = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick`
    + `&business=${encodeURIComponent(PAYPAL_EMAIL)}`
    + `&item_name=${encodeURIComponent('EXO: ' + itemDesc + discountNote)}`
    + `&amount=${total}`
    + `&currency_code=EUR`
    + `&custom=${encodeURIComponent(customerNote)}`
    + `&no_shipping=1`;

  showToast(`Going to PayPal — €${total}`);
  setTimeout(() => { window.open(paypalURL, '_blank'); }, 700);
}

// ---- TOAST ----
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ---- NAV scroll ----
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  navbar.style.background = window.scrollY > 50
    ? 'rgba(8,8,8,0.98)'
    : 'rgba(12,12,12,0.88)';
});
