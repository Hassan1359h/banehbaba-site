/* ============================================
   بانه بابا - فروشگاه آنلاین
   فایل جاوااسکریپت کامل با تاریخ شمسی
   ============================================ */

// ============================================
// 📦 داده محصولات
// ============================================
const products = [
  { 
    id: 1, 
    name: "گوشی سامسونگ Galaxy S24", 
    description: "حافظه ۲۵۶ گیگ، دوربین ۲۰۰ مگاپیکسل، باتری ۵۰۰۰ میلی‌آمپر", 
    price: 45000000, 
    emoji: "📱", 
    rating: 4.8 
  },
  { 
    id: 2, 
    name: "لپ‌تاپ ایسوس ROG", 
    description: "پردازنده Core i9، رم ۳۲ گیگ، کارت گرافیک RTX 4070", 
    price: 95000000, 
    emoji: "💻", 
    rating: 4.9 
  },
  { 
    id: 3, 
    name: "هدفون سونی WH-1000XM5", 
    description: "نویز کنسلینگ فوق‌العاده، ۳۰ ساعت شارژ مداوم", 
    price: 15000000, 
    emoji: "🎧", 
    rating: 4.7 
  },
  { 
    id: 4, 
    name: "ساعت هوشمند Apple Watch 9", 
    description: "نمایشگر رتینا، ضدآب، GPS داخلی، پایش سلامت", 
    price: 22000000, 
    emoji: "⌚", 
    rating: 4.6 
  },
  { 
    id: 5, 
    name: "پلی‌استیشن 5", 
    description: "نسخه دیسک‌خور، همراه با ۲ دسته بی‌سیم DualSense", 
    price: 42000000, 
    emoji: "🎮", 
    rating: 4.9 
  },
  { 
    id: 6, 
    name: "ایرپاد پرو نسل ۲", 
    description: "نویز کنسلینگ فعال، شارژ مغناطیسی، ضدآب", 
    price: 8500000, 
    emoji: "🎵", 
    rating: 4.5 
  },
  { 
    id: 7, 
    name: "تبلت آیپد ایر", 
    description: "نمایشگر ۱۱ اینچ، تراشه M2، پشتیبانی از Apple Pencil", 
    price: 38000000, 
    emoji: "📲", 
    rating: 4.8 
  },
  { 
    id: 8, 
    name: "دوربین کنون EOS R6", 
    description: "سنسور فول‌فریم، فیلم‌برداری 4K، لرزشگیر داخلی", 
    price: 120000000, 
    emoji: "📷", 
    rating: 4.9 
  }
];

// ============================================
// 🗓️ توابع تاریخ شمسی
// ============================================
function getPersianDate() {
  return new Date().toLocaleDateString('fa-IR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getPersianDateShort() {
  return new Date().toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function getPersianDateTime() {
  return new Date().toLocaleString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getPersianTime() {
  return new Date().toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function displayTodayDate() {
  const dateEl = document.getElementById('todayDate');
  if (dateEl) {
    dateEl.textContent = '📅 امروز: ' + getPersianDate();
  }
  
  const cartDateEl = document.getElementById('cartDateInfo');
  if (cartDateEl) {
    cartDateEl.textContent = '📅 امروز: ' + getPersianDate();
  }
}

// ============================================
// 💾 وضعیت برنامه
// ============================================
let cart = JSON.parse(localStorage.getItem('banehbaba_cart') || '[]');
let currentUser = JSON.parse(localStorage.getItem('banehbaba_user') || 'null');
let orders = JSON.parse(localStorage.getItem('banehbaba_orders') || '[]');

// ============================================
// 🛠 ابزارهای کمکی
// ============================================
function formatPrice(num) {
  return num.toLocaleString('fa-IR') + ' تومان';
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.className = 'toast show ' + type;
  
  setTimeout(() => {
    toast.className = 'toast ' + type;
  }, 2500);
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.textContent = count.toLocaleString('fa-IR');
}

// ============================================
// 🎨 نمایش محصولات
// ============================================
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  
  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-image">${p.emoji}</div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <p class="description">${p.description}</p>
        <div class="product-price-row">
          <span class="product-price">${formatPrice(p.price)}</span>
          <span class="product-rating">⭐ ${p.rating}</span>
        </div>
        <button class="btn-add-to-cart" onclick="addToCart(${p.id})">
          🛒 افزودن به سبد
        </button>
      </div>
    </div>
  `).join('');
}

// ============================================
// 🛒 عملیات سبد خرید
// ============================================
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const existing = cart.find(item => item.id === productId);
  
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  
  saveCart();
  updateCartBadge();
  showToast(`✅ ${product.name} به سبد اضافه شد`, 'success');
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
  
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-image">${item.emoji}</div>
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
  `).join('');
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = formatPrice(total);
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  
  item.quantity += delta;
  
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  
  saveCart();
  updateCartBadge();
  renderCart();
}

function removeFromCart(productId) {
  const item = cart.find(i => i.id === productId);
  cart = cart.filter(i => i.id !== productId);
  
  saveCart();
  updateCartBadge();
  renderCart();
  
  if (item) {
    showToast(`❌ ${item.name} از سبد حذف شد`, 'error');
  }
}

// ============================================
// 💳 پرداخت
// ============================================
function checkout() {
  if (cart.length === 0) {
    showToast('سبد خرید شما خالی است!', 'error');
    return;
  }
  
  if (!currentUser) {
    showToast('لطفاً ابتدا ثبت‌نام کنید', 'error');
    closeModal('cartModal');
    setTimeout(() => openModal('registerModal'), 300);
    return;
  }
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const amountEl = document.getElementById('checkoutAmount');
  if (amountEl) amountEl.textContent = formatPrice(total);
  
  const dateEl = document.getElementById('orderDateTime');
  if (dateEl) dateEl.textContent = getPersianDateTime();
  
  closeModal('cartModal');
  setTimeout(() => openModal('checkoutModal'), 300);
}

// ============================================
// 🪟 مدیریت Modal‌ها
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
// 📱 منوی موبایل و دسته‌بندی
// ============================================
function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      mainNav.classList.toggle('active');
    });
  }
  
  // زیرمنو در موبایل - با کلیک باز بشه
  const categoryTitles = document.querySelectorAll('.category-title');
  categoryTitles.forEach(title => {
    title.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const category = title.parentElement;
        category.classList.toggle('active');
      }
    });
  });
}

// ============================================
// 🎬 رویدادها
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  
  // نمایش محصولات
  renderProducts();
  updateCartBadge();
  displayTodayDate();
  initMobileMenu();
  
  // نمایش تاریخ شمسی در همه عناصر با کلاس persian-date
  document.querySelectorAll('.persian-date').forEach(el => {
    el.textContent = getPersianDateShort();
  });
  
  // دکمه سبد خرید
  const cartBtn = document.getElementById('cartBtn');
  if (cartBtn) {
    cartBtn.addEventListener('click', () => {
      renderCart();
      openModal('cartModal');
    });
  }
  
  // دکمه ثبت‌نام
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      if (currentUser) {
        showToast(`خوش آمدید ${currentUser.name} 👋`, 'success');
        return;
      }
      openModal('registerModal');
    });
  }
  
  // بستن Modal‌ها
  const closeRegister = document.getElementById('closeRegister');
  const closeCart = document.getElementById('closeCart');
  const closeCheckout = document.getElementById('closeCheckout');
  
  if (closeRegister) closeRegister.addEventListener('click', () => closeModal('registerModal'));
  if (closeCart) closeCart.addEventListener('click', () => closeModal('cartModal'));
  if (closeCheckout) closeCheckout.addEventListener('click', () => closeModal('checkoutModal'));
  
  // بستن Modal با کلیک روی پس‌زمینه
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
  
  // بستن Modal با کلید Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => {
        m.classList.remove('active');
      });
      document.body.style.overflow = '';
    }
  });
  
  // فرم ثبت‌نام
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('regName').value.trim();
      const phone = document.getElementById('regPhone').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      
      if (!name || !phone || !password) {
        showToast('لطفاً همه فیلدهای لازم را پر کنید', 'error');
        return;
      }
      
      if (phone.length < 10) {
        showToast('شماره موبایل معتبر نیست', 'error');
        return;
      }
      
      if (password.length < 4) {
        showToast('رمز عبور باید حداقل ۴ کاراکتر باشد', 'error');
        return;
      }
      
      currentUser = { 
        name, 
        phone, 
        email,
        registerDate: getPersianDate(),
        registerDateTime: getPersianDateTime()
      };
      localStorage.setItem('banehbaba_user', JSON.stringify(currentUser));
      
      showToast(`🎉 ثبت‌نام موفق! خوش آمدید ${name}`, 'success');
      registerForm.reset();
      closeModal('registerModal');
      
      const regText = registerBtn.querySelector('.register-text');
      if (regText) regText.textContent = name.split(' ')[0];
    });
  }
  
  // فرم پرداخت
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const trackingCode = document.getElementById('trackingCode').value.trim();
      
      if (!trackingCode) {
        showToast('لطفاً شماره پیگیری را وارد کنید', 'error');
        return;
      }
      
      if (trackingCode.length < 5) {
        showToast('شماره پیگیری معتبر نیست', 'error');
        return;
      }
      
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // ثبت سفارش با تاریخ شمسی
      const order = {
        id: Date.now(),
        trackingCode: trackingCode,
        date: getPersianDate(),
        dateTime: getPersianDateTime(),
        shortDate: getPersianDateShort(),
        time: getPersianTime(),
        amount: total,
        items: [...cart],
        user: { ...currentUser }
      };
      
      orders.push(order);
      localStorage.setItem('banehbaba_orders', JSON.stringify(orders));
      
      showToast(`✅ پرداخت ثبت شد - ${getPersianDateShort()}`, 'success');
      
      cart = [];
      saveCart();
      updateCartBadge();
      
      setTimeout(() => {
        closeModal('checkoutModal');
        checkoutForm.reset();
      }, 1500);
    });
  }
  
  // لینک ورود در فرم
  const loginLink = document.querySelector('.modal-footer-text a');
  if (loginLink) {
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('سیستم ورود به‌زودی اضافه می‌شود', 'success');
    });
  }
});

// ============================================
// 🎯 اسکرول به محصولات
// ============================================
function scrollToProducts() {
  const section = document.getElementById('productsSection');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}

// ============================================
// 📅 خروجی توابع
// ============================================
window.getPersianDate = getPersianDate;
window.getPersianDateShort = getPersianDateShort;
window.getPersianDateTime = getPersianDateTime;
window.getPersianTime = getPersianTime;
