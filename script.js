/* ============================================
   بانه بابا - فروشگاه آنلاین
   با اتصال به API
   ============================================ */

const API_URL = 'https://banehbaba-backend.vercel.app/api';

// ============================================
// 💾 State
// ============================================
let products = [];
let cart = JSON.parse(localStorage.getItem('banehbaba_cart') || '[]');
let currentUser = JSON.parse(localStorage.getItem('banehbaba_user') || 'null');

// ============================================
// 🗓️ توابع تاریخ شمسی
// ============================================
function getPersianDate() {
  return new Date().toLocaleDateString('fa-IR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}
function getPersianDateShort() {
  return new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}
function getPersianDateTime() {
  return new Date().toLocaleString('fa-IR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
function getPersianTime() {
  return new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}
function displayTodayDate() {
  const d1 = document.getElementById('todayDate');
  if (d1) d1.textContent = '📅 امروز: ' + getPersianDate();
  const d2 = document.getElementById('cartDateInfo');
  if (d2) d2.textContent = '📅 امروز: ' + getPersianDate();
}

// ============================================
// 🛠 توابع کمکی
// ============================================
function formatPrice(num) {
  return Number(num).toLocaleString('fa-IR') + ' تومان';
}
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast show ' + type;
  setTimeout(() => { toast.className = 'toast ' + type; }, 2500);
}
function updateCartBadge() {
  const b = document.getElementById('cartBadge');
  if (!b) return;
  b.textContent = cart.reduce((s, i) => s + i.quantity, 0).toLocaleString('fa-IR');
}

// ============================================
// 🔌 بارگذاری محصولات از API
// ============================================
async function loadProductsFromAPI() {
  try {
    const response = await fetch(API_URL + '/products');
    const data = await response.json();
    
    if (data.success) {
      products = data.products || [];
      console.log('✅ محصولات لود شد:', products.length);
      return true;
    }
    return false;
  } catch (e) {
    console.error('خطا در لود محصولات:', e);
    return false;
  }
}

// ============================================
// 📦 نمایش محصولات
// ============================================
function renderProducts(filterCategory = null) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  let list = products;
  if (filterCategory) {
    list = products.filter(p => p.category === filterCategory);
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:#999;">
        <div style="font-size:60px; margin-bottom:15px;">📦</div>
        <h3>محصولی یافت نشد</h3>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(p => {
    const hasDiscount = p.discountPrice && p.discountPrice < p.price;
    const discountPercent = hasDiscount 
      ? Math.round((1 - p.discountPrice / p.price) * 100) 
      : 0;

    const imageHtml = p.image
      ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">`
      : '📦';

    return `
      <div class="product-card">
        <div class="product-image">
          ${imageHtml}
          ${hasDiscount ? `<span style="position:absolute;top:10px;left:10px;background:#e74c3c;color:white;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:700;">${discountPercent}٪ تخفیف</span>` : ''}
        </div>
        <div class="product-info">
          <h3>${p.name}</h3>
          <p class="description">${p.description || ''}</p>
          <div class="product-price-row">
            <div>
              ${hasDiscount 
                ? `<div style="font-size:12px;text-decoration:line-through;color:#999;">${formatPrice(p.price)}</div>
                   <div class="product-price" style="color:#27ae60;">${formatPrice(p.discountPrice)}</div>`
                : `<div class="product-price">${formatPrice(p.price)}</div>`
              }
            </div>
            <span class="product-rating">⭐ ${p.rating || 4.5}</span>
          </div>
          <button class="btn-add-to-cart" onclick="addToCart(${p.id})">
            🛒 افزودن به سبد
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function filterByCategory(categoryId, subName = null) {
  const cat = {
    camping: { name: 'لوازم کوهنوردی و کمپ', icon: '🏔️' },
    home: { name: 'لوازم خانگی', icon: '🏠' },
    beauty: { name: 'سلامت و زیبایی', icon: '💄' },
    car: { name: 'لوازم یدکی خودرو', icon: '🚗' }
  }[categoryId];
  
  const header = document.querySelector('.section-header h2');
  if (header && cat) {
    header.textContent = subName 
      ? `${subName} — ${cat.name}` 
      : `${cat.icon} ${cat.name}`;
  }

  renderProducts(categoryId);
  const section = document.getElementById('productsSection');
  if (section) section.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// 🛒 سبد
// ============================================
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const existing = cart.find(i => i.id === productId);
  if (existing) existing.quantity++;
  else cart.push({ ...product, quantity: 1 });
  
  saveCart();
  updateCartBadge();
  showToast(`✅ ${product.name} به سبد اضافه شد`);
}

function saveCart() {
  localStorage.setItem('banehbaba_cart', JSON.stringify(cart));
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const empty = document.getElementById('cartEmpty');
  const summary = document.getElementById('cartSummary');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '';
    if (empty) empty.classList.add('active');
    if (summary) summary.style.display = 'none';
    return;
  }

  if (empty) empty.classList.remove('active');
  if (summary) summary.style.display = 'block';

  container.innerHTML = cart.map(item => {
    const img = item.image
      ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`
      : '📦';

    return `
      <div class="cart-item">
        <div class="cart-item-image">${img}</div>
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <span class="price">${formatPrice(item.price * item.quantity)}</span>
        </div>
        <div class="cart-item-actions">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
          <span class="qty-display">${item.quantity.toLocaleString('fa-IR')}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
          <button class="remove-item" onclick="removeFromCart(${item.id})">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const el = document.getElementById('cartTotal');
  if (el) el.textContent = formatPrice(total);
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) { removeFromCart(id); return; }
  saveCart(); updateCartBadge(); renderCart();
}

function removeFromCart(id) {
  const item = cart.find(i => i.id === id);
  cart = cart.filter(i => i.id !== id);
  saveCart(); updateCartBadge(); renderCart();
  if (item) showToast(`❌ ${item.name} حذف شد`, 'error');
}

// ============================================
// 💳 پرداخت
// ============================================
function checkout() {
  if (cart.length === 0) { showToast('سبد خرید خالی است!', 'error'); return; }
  if (!currentUser) {
    showToast('لطفاً ابتدا ثبت‌نام کنید', 'error');
    closeModal('cartModal');
    setTimeout(() => openModal('registerModal'), 300);
    return;
  }
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const a = document.getElementById('checkoutAmount');
  if (a) a.textContent = formatPrice(total);
  const d = document.getElementById('orderDateTime');
  if (d) d.textContent = getPersianDateTime();
  closeModal('cartModal');
  setTimeout(() => openModal('checkoutModal'), 300);
}

// ============================================
// 🪟 Modal
// ============================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ============================================
// 📱 منوی موبایل
// ============================================
function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => mainNav.classList.toggle('active'));
  }
  document.querySelectorAll('.category-title').forEach(title => {
    title.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        title.parentElement.classList.toggle('active');
      }
    });
  });
}

// ============================================
// 🎬 اجرا
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  
  // لود محصولات از API
  await loadProductsFromAPI();
  renderProducts();
  updateCartBadge();
  displayTodayDate();
  initMobileMenu();

  // دکمه‌ها
  const cartBtn = document.getElementById('cartBtn');
  if (cartBtn) cartBtn.addEventListener('click', () => { renderCart(); openModal('cartModal'); });

  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      if (currentUser) { showToast(`خوش آمدید ${currentUser.name} 👋`); return; }
      openModal('registerModal');
    });
  }

  ['closeRegister', 'closeCart', 'closeCheckout'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => {
      closeModal(id.replace('close', '').toLowerCase() + 'Modal');
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.classList.remove('active'); document.body.style.overflow = ''; }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      document.body.style.overflow = '';
    }
  });

  // فرم ثبت‌نام
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const phone = document.getElementById('regPhone').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;

      if (!name || !phone || !password) { showToast('لطفاً همه فیلدها را پر کنید', 'error'); return; }
      if (phone.length < 10) { showToast('شماره موبایل معتبر نیست', 'error'); return; }
      if (password.length < 4) { showToast('رمز عبور حداقل ۴ کاراکتر', 'error'); return; }

      currentUser = { name, phone, email, registerDate: getPersianDate() };
      localStorage.setItem('banehbaba_user', JSON.stringify(currentUser));

      // ارسال به API
      try {
        await fetch(API_URL + '/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, email, password })
        });
      } catch (e) { console.error(e); }

      showToast(`🎉 ثبت‌نام موفق! خوش آمدید ${name}`);
      registerForm.reset();
      closeModal('registerModal');
      const regText = registerBtn.querySelector('.register-text');
      if (regText) regText.textContent = name.split(' ')[0];
    });
  }

  // فرم پرداخت
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const trackingCode = document.getElementById('trackingCode').value.trim();
      if (!trackingCode || trackingCode.length < 5) {
        showToast('شماره پیگیری معتبر نیست', 'error');
        return;
      }
      const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
      const order = {
        trackingCode,
        date: getPersianDate(),
        dateTime: getPersianDateTime(),
        shortDate: getPersianDateShort(),
        time: getPersianTime(),
        amount: total,
        items: [...cart],
        user: { ...currentUser }
      };

      // ارسال به API
      try {
        await fetch(API_URL + '/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
      } catch (e) { console.error(e); }

      showToast(`✅ پرداخت ثبت شد - ${getPersianDateShort()}`);
      cart = [];
      saveCart();
      updateCartBadge();
      setTimeout(() => { closeModal('checkoutModal'); checkoutForm.reset(); }, 1500);
    });
  }
});

// ============================================
// 🎯 اسکرول
// ============================================
function scrollToProducts() {
  const section = document.getElementById('productsSection');
  if (section) section.scrollIntoView({ behavior: 'smooth' });
}
