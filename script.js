/* ============================================
   بانه بابا - فروشگاه آنلاین
   نسخه کامل با ورود، آدرس، و پیگیری سفارش
   ============================================ */

const API_URL = 'https://banehbaba-backend.vercel.app/api';

// ============================================
// 💾 State
// ============================================
let products = [];
let cart = JSON.parse(localStorage.getItem('banehbaba_cart') || '[]');
let currentUser = JSON.parse(localStorage.getItem('banehbaba_user') || 'null');
let currentFilter = null;

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
  setTimeout(() => { toast.className = 'toast ' + type; }, 3000);
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
function renderProducts(filterCategory = null, subName = null) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  let list = products;
  
  if (filterCategory) {
    list = products.filter(p => p.category === filterCategory);
    
    if (subName) {
      const filtered = list.filter(p => p.subcategory === subName);
      if (filtered.length > 0) {
        list = filtered;
      }
    }
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:#999;">
        <div style="font-size:60px; margin-bottom:15px;">📦</div>
        <h3>محصولی در این دسته وجود ندارد</h3>
        <p style="font-size:14px; margin-top:10px;">به‌زودی محصولات جدید اضافه می‌شوند</p>
        ${filterCategory ? '<button onclick="clearFilter()" style="margin-top:20px; padding:10px 20px; background:#FF6B35; color:white; border:none; border-radius:8px; cursor:pointer; font-family:inherit;">نمایش همه محصولات</button>' : ''}
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
      : '';

    return `
      <div class="product-card" style="position:relative;">
        <div class="product-image" style="position:relative;">
          ${imageHtml}
          ${hasDiscount ? `<span style="position:absolute;top:10px;left:10px;background:#e74c3c;color:white;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:700;z-index:2;">${discountPercent}٪ تخفیف</span>` : ''}
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

// ============================================
// 🎯 فیلتر دسته‌بندی
// ============================================
const categoryInfo = {
  camping: { name: 'لوازم کوهنوردی و کمپ', icon: '🏔️' },
  home: { name: 'لوازم خانگی', icon: '🏠' },
  beauty: { name: 'سلامت و زیبایی', icon: '💄' },
  car: { name: 'لوازم یدکی خودرو', icon: '🚗' }
};

function filterByCategory(categoryId, subName = null) {
  currentFilter = categoryId;
  
  const cat = categoryInfo[categoryId];
  const header = document.querySelector('.section-header h2');
  const subHeader = document.querySelector('.section-header p');
  
  if (header && cat) {
    header.textContent = subName 
      ? `${subName} — ${cat.name}` 
      : `${cat.icon} ${cat.name}`;
  }
  
  if (subHeader && cat) {
    subHeader.textContent = subName 
      ? `محصولات زیردسته «${subName}»`
      : `محصولات دسته «${cat.name}»`;
  }
  
  renderProducts(categoryId, subName);
  
  const section = document.getElementById('productsSection');
  if (section) section.scrollIntoView({ behavior: 'smooth' });
  
  document.getElementById('mainNav')?.classList.remove('active');
}

function clearFilter() {
  currentFilter = null;
  
  const header = document.querySelector('.section-header h2');
  const subHeader = document.querySelector('.section-header p');
  
  if (header) header.textContent = 'محصولات ویژه ⭐';
  if (subHeader) subHeader.textContent = 'جدیدترین و پرطرفدارترین کالاها';
  
  renderProducts();
  
  const section = document.getElementById('productsSection');
  if (section) section.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// 🛒 سبد
// ============================================
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const price = product.discountPrice && product.discountPrice < product.price 
    ? product.discountPrice 
    : product.price;
  
  const existing = cart.find(i => i.id === productId);
  if (existing) existing.quantity++;
  else cart.push({ ...product, price, quantity: 1 });
  
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
    showToast('لطفاً ابتدا وارد شوید', 'error');
    closeModal('cartModal');
    setTimeout(() => openModal('loginModal'), 300);
    return;
  }
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const a = document.getElementById('checkoutAmount');
  if (a) a.textContent = formatPrice(total);
  const d = document.getElementById('orderDateTime');
  if (d) d.textContent = getPersianDateTime();
  
  // پر کردن فیلدها با اطلاعات کاربر
  const nameEl = document.getElementById('checkoutName');
  if (nameEl && currentUser.name) nameEl.value = currentUser.name;
  const phoneEl = document.getElementById('checkoutPhone');
  if (phoneEl && currentUser.phone) phoneEl.value = currentUser.phone;
  
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
// 🎉 نمایش موفقیت سفارش
// ============================================
function showOrderSuccess(trackingCode, amount) {
  const old = document.getElementById('orderSuccessBox');
  if (old) old.remove();
  
  const box = document.createElement('div');
  box.id = 'orderSuccessBox';
  box.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.85); z-index: 99999;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  `;
  box.innerHTML = `
    <div style="background: white; border-radius: 20px; padding: 35px 25px; max-width: 420px; width: 100%; text-align: center;">
      <div style="font-size: 70px; margin-bottom: 15px;">🎉</div>
      <h2 style="font-size: 22px; color: #27ae60; margin-bottom: 10px;">سفارش شما ثبت شد!</h2>
      <p style="font-size: 14px; color: #666; margin-bottom: 25px;">از خرید شما سپاسگزاریم</p>
      
      <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: right;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
          <span style="color: #777; font-size: 13px;">کد پیگیری شما:</span>
          <strong style="color: #FF6B35; font-size: 16px; direction: ltr;">${trackingCode}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #777; font-size: 13px;">مبلغ پرداختی:</span>
          <strong style="color: #27ae60; font-size: 15px;">${amount.toLocaleString('fa-IR')} تومان</strong>
        </div>
      </div>
      
      <div style="background: #fff9e6; border-right: 3px solid #FFB800; padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: right;">
        <p style="font-size: 12px; color: #666; line-height: 1.7; margin: 0;">
          📌 لطفاً کد پیگیری را نزد خود نگه دارید.<br>
          📞 پشتیبانی: <strong>09029885583</strong>
        </p>
      </div>
      
      <button onclick="document.getElementById('orderSuccessBox').remove(); document.body.style.overflow='';" 
              style="width: 100%; background: #27ae60; color: white; border: none; padding: 14px; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit;">
        ✅ متوجه شدم
      </button>
      
      <a href="track.html" style="display: block; margin-top: 12px; color: #FF6B35; text-decoration: none; font-size: 13px; font-weight: 600;">
        📦 پیگیری سفارش
      </a>
    </div>
  `;
  document.body.appendChild(box);
  document.body.style.overflow = 'hidden';
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
// 🎯 راه‌اندازی فیلتر دسته‌بندی
// ============================================
function initCategoryFilters() {
  document.querySelectorAll('.category-title').forEach(el => {
    el.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) return;
      
      e.preventDefault();
      
      const text = el.textContent.trim();
      let categoryId = null;
      
      if (text.includes('کوهنوردی') || text.includes('کمپ')) categoryId = 'camping';
      else if (text.includes('خانگی')) categoryId = 'home';
      else if (text.includes('زیبایی') || text.includes('سلامت')) categoryId = 'beauty';
      else if (text.includes('یدکی') || text.includes('خودرو')) categoryId = 'car';
      
      if (categoryId) {
        filterByCategory(categoryId);
      }
    });
  });

  document.querySelectorAll('.submenu a').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      
      const subName = el.textContent.trim();
      const parentCategory = el.closest('.dropdown-category');
      const parentTitle = parentCategory?.querySelector('.category-title')?.textContent || '';
      
      let categoryId = null;
      if (parentTitle.includes('کوهنوردی') || parentTitle.includes('کمپ')) categoryId = 'camping';
      else if (parentTitle.includes('خانگی')) categoryId = 'home';
      else if (parentTitle.includes('زیبایی') || parentTitle.includes('سلامت')) categoryId = 'beauty';
      else if (parentTitle.includes('یدکی') || parentTitle.includes('خودرو')) categoryId = 'car';
      
      if (categoryId) {
        filterByCategory(categoryId, subName);
      }
      
      document.getElementById('mainNav')?.classList.remove('active');
    });
  });
}

// ============================================
// 🎬 اجرا
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  
  await loadProductsFromAPI();
  renderProducts();
  updateCartBadge();
  displayTodayDate();
  initMobileMenu();
  initCategoryFilters();

  // ============================================
  // 🛒 دکمه سبد خرید
  // ============================================
  const cartBtn = document.getElementById('cartBtn');
  if (cartBtn) {
    cartBtn.addEventListener('click', () => { 
      renderCart(); 
      openModal('cartModal'); 
    });
  }

  // ============================================
  // 👤 دکمه ثبت‌نام/ورود
  // ============================================
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      if (currentUser) {
        if (confirm(`خوش آمدید ${currentUser.name} 👋\n\nمی‌خواید از حساب خارج بشید؟`)) {
          localStorage.removeItem('banehbaba_user');
          currentUser = null;
          location.reload();
        }
        return;
      }
      openModal('loginModal');
    });
    
    // اگه کاربر قبلاً لاگین کرده، اسمش رو نشون بده
    if (currentUser) {
      const regText = registerBtn.querySelector('.register-text');
      if (regText) regText.textContent = currentUser.name.split(' ')[0];
    }
  }

  // ============================================
  // ❌ دکمه‌های بستن Modal
  // ============================================
  const closeRegister = document.getElementById('closeRegister');
  if (closeRegister) closeRegister.addEventListener('click', () => closeModal('registerModal'));
  
  const closeLogin = document.getElementById('closeLogin');
  if (closeLogin) closeLogin.addEventListener('click', () => closeModal('loginModal'));
  
  const closeCart = document.getElementById('closeCart');
  if (closeCart) closeCart.addEventListener('click', () => closeModal('cartModal'));
  
  const closeCheckout = document.getElementById('closeCheckout');
  if (closeCheckout) closeCheckout.addEventListener('click', () => closeModal('checkoutModal'));

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { 
        overlay.classList.remove('active'); 
        document.body.style.overflow = ''; 
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      document.body.style.overflow = '';
    }
  });

  // ============================================
  // 📝 فرم ثبت‌نام
  // ============================================
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('regName').value.trim();
      const phone = document.getElementById('regPhone').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;

      if (!name || !phone || !password) { 
        showToast('لطفاً همه فیلدها را پر کنید', 'error'); 
        return; 
      }
      if (phone.length < 10) { 
        showToast('شماره موبایل معتبر نیست', 'error'); 
        return; 
      }
      if (password.length < 4) { 
        showToast('رمز عبور حداقل ۴ کاراکتر', 'error'); 
        return; 
      }

      try {
        const response = await fetch(API_URL + '/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, email, password })
        });
        
        const data = await response.json();
        
        if (data.success || response.ok) {
          currentUser = { name, phone, email, registerDate: getPersianDate() };
          localStorage.setItem('banehbaba_user', JSON.stringify(currentUser));
          
          showToast(`🎉 ثبت‌نام موفق! خوش آمدید ${name}`);
          registerForm.reset();
          closeModal('registerModal');
          
          const regText = registerBtn.querySelector('.register-text');
          if (regText) regText.textContent = name.split(' ')[0];
        } else {
          showToast(data.error || 'این شماره قبلاً ثبت‌نام کرده', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('خطا در ارتباط با سرور', 'error');
      }
    });
  }

  // ============================================
  // 🔐 فرم ورود
  // ============================================
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const phone = document.getElementById('loginPhone').value.trim();
      const password = document.getElementById('loginPassword').value;
      
      if (!phone || !password) {
        showToast('لطفاً همه فیلدها را پر کنید', 'error');
        return;
      }
      
      if (phone.length < 10) {
        showToast('شماره موبایل معتبر نیست', 'error');
        return;
      }
      
      try {
        const response = await fetch(API_URL + '/users');
        const data = await response.json();
        
        if (!data.success) {
          showToast('خطا در دریافت اطلاعات', 'error');
          return;
        }
        
        const users = data.users || [];
        const user = users.find(u => u.phone === phone && u.password === password);
        
        if (!user) {
          showToast('شماره موبایل یا رمز عبور اشتباه است', 'error');
          return;
        }
        
        currentUser = { 
          name: user.name, 
          phone: user.phone, 
          email: user.email || '' 
        };
        localStorage.setItem('banehbaba_user', JSON.stringify(currentUser));
        
        showToast(`🎉 خوش آمدید ${user.name}`);
        loginForm.reset();
        closeModal('loginModal');
        
        const regText = registerBtn.querySelector('.register-text');
        if (regText) regText.textContent = user.name.split(' ')[0];
        
      } catch (err) {
        console.error(err);
        showToast('خطا در ورود', 'error');
      }
    });
  }

  // ============================================
  // 🔗 لینک ثبت‌نام از Modal ورود
  // ============================================
  const goToRegister = document.getElementById('goToRegister');
  if (goToRegister) {
    goToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal('loginModal');
      setTimeout(() => openModal('registerModal'), 300);
    });
  }

  // ============================================
  // 💳 فرم پرداخت
  // ============================================
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('checkoutName').value.trim();
      const phone = document.getElementById('checkoutPhone').value.trim();
      const address = document.getElementById('checkoutAddress').value.trim();
      const postalCode = document.getElementById('checkoutPostalCode').value.trim();
      const trackingCode = document.getElementById('trackingCode').value.trim();
      
      if (!name || !phone || !address || !trackingCode) {
        showToast('لطفاً همه فیلدهای ستاره‌دار را پر کنید', 'error');
        return;
      }
      
      if (phone.length < 10) {
        showToast('شماره موبایل معتبر نیست', 'error');
        return;
      }
      
      if (trackingCode.length < 5) {
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
        customer: { name, phone, address, postalCode },
        user: currentUser ? { ...currentUser } : { name, phone }
      };

      try {
        const response = await fetch(API_URL + '/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
        
        const data = await response.json();
        
        if (data.success) {
          showOrderSuccess(trackingCode, total);
          cart = [];
          saveCart();
          updateCartBadge();
          setTimeout(() => {
            closeModal('checkoutModal');
            checkoutForm.reset();
          }, 6000);
        } else {
          showToast('خطا در ثبت سفارش', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('خطا در ارتباط با سرور', 'error');
      }
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
