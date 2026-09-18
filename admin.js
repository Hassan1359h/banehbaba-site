/* ============================================
   بانه بابا - منطق پنل مدیریت
   ============================================ */

// ============================================
// 🔐 بررسی لاگین ادمین
// ============================================
const isAdmin = sessionStorage.getItem('banehbaba_admin');

if (isAdmin !== 'logged_in') {
  window.location.href = 'admin.html';
}

// ============================================
// 📦 داده محصولات (پیش‌فرض)
// ============================================
const defaultProducts = [
  { id: 1, name: "گوشی سامسونگ Galaxy S24", description: "حافظه ۲۵۶ گیگ، دوربین ۲۰۰ مگاپیکسل", price: 45000000, emoji: "📱", rating: 4.8, category: "home" },
  { id: 2, name: "لپ‌تاپ ایسوس ROG", description: "پردازنده i9، رم ۳۲ گیگ", price: 95000000, emoji: "💻", rating: 4.9, category: "home" },
  { id: 3, name: "هدفون سونی WH-1000XM5", description: "نویز کنسلینگ، ۳۰ ساعت شارژ", price: 15000000, emoji: "🎧", rating: 4.7, category: "home" },
  { id: 4, name: "ساعت هوشمند Apple Watch 9", description: "نمایشگر رتینا، ضدآب", price: 22000000, emoji: "⌚", rating: 4.6, category: "home" },
  { id: 5, name: "پلی‌استیشن 5", description: "دیسک‌خور، ۲ دسته بی‌سیم", price: 42000000, emoji: "🎮", rating: 4.9, category: "home" },
  { id: 6, name: "ایرپاد پرو نسل ۲", description: "نویز کنسلینگ، شارژ مغناطیسی", price: 8500000, emoji: "🎵", rating: 4.5, category: "home" },
  { id: 7, name: "تبلت آیپد ایر", description: "۱۱ اینچ، تراشه M2", price: 38000000, emoji: "📲", rating: 4.8, category: "home" },
  { id: 8, name: "دوربین کنون EOS R6", description: "سنسور فول‌فریم، 4K", price: 120000000, emoji: "📷", rating: 4.9, category: "home" }
];

// ============================================
// 💾 State
// ============================================
let products = JSON.parse(localStorage.getItem('banehbaba_products') || 'null') || defaultProducts;
let orders = JSON.parse(localStorage.getItem('banehbaba_orders') || '[]');
let messages = JSON.parse(localStorage.getItem('banehbaba_messages') || '[]');
let customers = JSON.parse(localStorage.getItem('banehbaba_customers') || '[]');
let currentPage = 'dashboard';

// اگه لیست مشتری‌ها خالی بود، از سفارشات استخراج کن
if (customers.length === 0 && orders.length > 0) {
  const customerMap = {};
  orders.forEach(o => {
    if (o.user && o.user.phone) {
      customerMap[o.user.phone] = o.user;
    }
  });
  customers = Object.values(customerMap);
}

// ============================================
// 🛠 توابع کمکی
// ============================================
function formatPrice(num) {
  return Number(num).toLocaleString('fa-IR') + ' تومان';
}

function formatNumber(num) {
  return Number(num).toLocaleString('fa-IR');
}

function getPersianDate() {
  return new Date().toLocaleDateString('fa-IR', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'admin-toast show ' + (type === 'info' ? '' : type);
  setTimeout(() => { toast.className = 'admin-toast'; }, 2500);
}

function saveProducts() {
  localStorage.setItem('banehbaba_products', JSON.stringify(products));
}

// ============================================
// 🔐 خروج
// ============================================
function logout() {
  if (confirm('آیا مطمئنید می‌خواید از پنل خارج بشید؟')) {
    sessionStorage.removeItem('banehbaba_admin');
    window.location.href = 'admin.html';
  }
}

// ============================================
// 📊 صفحه داشبورد
// ============================================
function renderDashboard() {
  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon orange">📦</div>
        <div class="stat-info">
          <h3>${formatNumber(products.length)}</h3>
          <p>محصول</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">🛒</div>
        <div class="stat-info">
          <h3>${formatNumber(orders.length)}</h3>
          <p>سفارش</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">💰</div>
        <div class="stat-info">
          <h3>${totalRevenue > 0 ? formatNumber(totalRevenue) : '۰'}</h3>
          <p>درآمد (تومان)</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">💬</div>
        <div class="stat-info">
          <h3>${formatNumber(messages.length)}</h3>
          <p>پیام</p>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h3 class="section-title">
          <span class="icon">📦</span>
          آخرین محصولات
        </h3>
        <button class="btn btn-primary btn-sm" onclick="openProductModal()">
          ➕ افزودن محصول
        </button>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>آیکون</th>
              <th>نام محصول</th>
              <th>قیمت</th>
              <th>امتیاز</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            ${products.slice(0, 5).map(p => `
              <tr>
                <td style="font-size: 24px;">${p.emoji}</td>
                <td>${p.name}</td>
                <td>${formatPrice(p.price)}</td>
                <td>⭐ ${p.rating}</td>
                <td>
                  <button class="btn-icon btn-edit" onclick="editProduct(${p.id})">✏️</button>
                  <button class="btn-icon btn-delete" onclick="deleteProduct(${p.id})">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h3 class="section-title">
          <span class="icon">🕐</span>
          آخرین سفارشات
        </h3>
      </div>
      
      ${orders.length === 0 
        ? `<div class="empty-state">
            <div class="icon">🛒</div>
            <h3>هنوز سفارشی ثبت نشده</h3>
            <p>سفارشات جدید در اینجا نمایش داده می‌شوند</p>
          </div>`
        : `<div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>کد پیگیری</th>
                  <th>مشتری</th>
                  <th>مبلغ</th>
                  <th>تاریخ</th>
                </tr>
              </thead>
              <tbody>
                ${orders.slice(-5).reverse().map(o => `
                  <tr>
                    <td><span class="badge badge-info">${o.trackingCode || '-'}</span></td>
                    <td>${o.user?.name || 'ناشناس'}</td>
                    <td>${formatPrice(o.amount || 0)}</td>
                    <td>${o.shortDate || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>`
      }
    </div>
  `;
}

// ============================================
// 📦 صفحه محصولات
// ============================================
function renderProducts() {
  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">
          <span class="icon">📦</span>
          همه محصولات (${formatNumber(products.length)})
        </h3>
        <button class="btn btn-primary" onclick="openProductModal()">
          ➕ افزودن محصول جدید
        </button>
      </div>

      ${products.length === 0
        ? `<div class="empty-state">
            <div class="icon">📦</div>
            <h3>هیچ محصولی وجود نداره</h3>
            <p>روی دکمه «افزودن محصول جدید» بزنید</p>
          </div>`
        : `<div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>آیکون</th>
                  <th>نام</th>
                  <th>توضیحات</th>
                  <th>قیمت</th>
                  <th>امتیاز</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                ${products.map(p => `
                  <tr>
                    <td style="font-size: 24px;">${p.emoji}</td>
                    <td><strong>${p.name}</strong></td>
                    <td style="max-width: 250px; font-size: 12px; color: #777;">${p.description || '-'}</td>
                    <td>${formatPrice(p.price)}</td>
                    <td>⭐ ${p.rating}</td>
                    <td>
                      <button class="btn-icon btn-edit" onclick="editProduct(${p.id})">✏️</button>
                      <button class="btn-icon btn-delete" onclick="deleteProduct(${p.id})">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>`
      }
    </div>
  `;
}

// ============================================
// 📂 صفحه دسته‌بندی‌ها
// ============================================
function renderCategories() {
  const categories = [
    { id: 'camping', name: '🏔️ لوازم کوهنوردی و کمپ', subs: ['عینک', 'چادر کوهنوردی', 'کیسه خواب', 'چراغ پیشانی', 'باتوم', 'اجاق کمپ', 'ابزار کوه', 'شکار'] },
    { id: 'home', name: '🏠 لوازم خانگی', subs: ['تلویزیون', 'لباسشویی', 'ظرفشویی', 'کولر گازی', 'سرخ کن', 'اتو بخار', 'آبمیوه گیری'] },
    { id: 'beauty', name: '💄 سلامت و زیبایی', subs: ['سفید کننده دندان', 'لمینت دندان', 'پوست', 'مو'] },
    { id: 'car', name: '🚗 لوازم یدکی خودرو', subs: ['لنت'] }
  ];

  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">
          <span class="icon">📂</span>
          دسته‌بندی‌های اصلی
        </h3>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">
        ${categories.map(cat => {
          const count = products.filter(p => p.category === cat.id).length;
          return `
            <div style="background: #f9f9f9; border-radius: 12px; padding: 18px; border-right: 4px solid var(--primary);">
              <h4 style="font-size: 15px; margin-bottom: 12px;">${cat.name}</h4>
              <p style="font-size: 12px; color: var(--text-light); margin-bottom: 12px;">
                ${count} محصول در این دسته
              </p>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${cat.subs.map(s => `<span class="badge badge-info" style="font-size: 11px;">${s}</span>`).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ============================================
// 🛒 صفحه سفارشات
// ============================================
function renderOrders() {
  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">
          <span class="icon">🛒</span>
          همه سفارشات (${formatNumber(orders.length)})
        </h3>
      </div>

      ${orders.length === 0
        ? `<div class="empty-state">
            <div class="icon">🛒</div>
            <h3>هنوز سفارشی ثبت نشده</h3>
            <p>سفارشات جدید در اینجا نمایش داده می‌شوند</p>
          </div>`
        : `<div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>کد پیگیری</th>
                  <th>مشتری</th>
                  <th>موبایل</th>
                  <th>مبلغ</th>
                  <th>تاریخ</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                ${orders.slice().reverse().map(o => `
                  <tr>
                    <td><span class="badge badge-info">${o.trackingCode || '-'}</span></td>
                    <td>${o.user?.name || 'ناشناس'}</td>
                    <td>${o.user?.phone || '-'}</td>
                    <td>${formatPrice(o.amount || 0)}</td>
                    <td>${o.shortDate || '-'} - ${o.time || ''}</td>
                    <td><span class="badge badge-success">✅ پرداخت شده</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>`
      }
    </div>
  `;
}

// ============================================
// 👥 صفحه مشتریان
// ============================================
function renderCustomers() {
  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">
          <span class="icon">👥</span>
          مشتریان (${formatNumber(customers.length)})
        </h3>
      </div>

      ${customers.length === 0
        ? `<div class="empty-state">
            <div class="icon">👥</div>
            <h3>هنوز مشتری‌ای ثبت‌نام نکرده</h3>
            <p>مشتریان جدید در اینجا نمایش داده می‌شوند</p>
          </div>`
        : `<div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>نام</th>
                  <th>موبایل</th>
                  <th>ایمیل</th>
                  <th>تاریخ ثبت‌نام</th>
                </tr>
              </thead>
              <tbody>
                ${customers.map(c => `
                  <tr>
                    <td><strong>${c.name || '-'}</strong></td>
                    <td>${c.phone || '-'}</td>
                    <td>${c.email || '-'}</td>
                    <td>${c.registerDate || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>`
      }
    </div>
  `;
}

// ============================================
// 💬 صفحه پیام‌ها
// ============================================
function renderMessages() {
  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">
          <span class="icon">💬</span>
          پیام‌های مشتریان (${formatNumber(messages.length)})
        </h3>
      </div>

      ${messages.length === 0
        ? `<div class="empty-state">
            <div class="icon">💬</div>
            <h3>هنوز پیامی دریافت نشده</h3>
            <p>پیام‌های فرم تماس با ما اینجا نمایش داده می‌شوند</p>
          </div>`
        : messages.slice().reverse().map(m => `
            <div style="background: #f9f9f9; border-radius: 12px; padding: 18px; margin-bottom: 12px; border-right: 4px solid var(--primary);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                <strong style="font-size: 15px;">${m.name || 'ناشناس'}</strong>
                <span class="badge badge-info" style="font-size: 11px;">${m.subject || 'سایر'}</span>
              </div>
              <div style="font-size: 12px; color: var(--text-light); margin-bottom: 10px;">
                📞 ${m.phone || '-'} | 📧 ${m.email || '-'} | 📅 ${m.date || '-'}
              </div>
              <p style="font-size: 14px; line-height: 1.8; color: var(--text);">
                ${m.message || ''}
              </p>
            </div>
          `).join('')
      }
    </div>
  `;
}

// ============================================
// ⚙️ صفحه تنظیمات
// ============================================
function renderSettings() {
  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">
          <span class="icon">⚙️</span>
          تنظیمات فروشگاه
        </h3>
      </div>

      <div style="max-width: 500px;">
        <div class="form-group" style="margin-bottom: 18px;">
          <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px;">نام فروشگاه</label>
          <input type="text" value="بانه بابا" style="width: 100%; padding: 11px 14px; border: 2px solid #e0e0e0; border-radius: 9px; font-family: inherit; direction: rtl;">
        </div>

        <div class="form-group" style="margin-bottom: 18px;">
          <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px;">شماره تماس</label>
          <input type="text" value="۰۹۱۲۳۴۵۶۷۸۹" style="width: 100%; padding: 11px 14px; border: 2px solid #e0e0e0; border-radius: 9px; font-family: inherit; direction: rtl;">
        </div>

        <div class="form-group" style="margin-bottom: 18px;">
          <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px;">شماره کارت</label>
          <input type="text" value="۶۰۳۷ - ۹۹۷۵ - ۱۲۳۴ - ۵۶۷۸" style="width: 100%; padding: 11px 14px; border: 2px solid #e0e0e0; border-radius: 9px; font-family: inherit; direction: ltr;">
        </div>

        <div class="form-group" style="margin-bottom: 18px;">
          <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px;">به نام</label>
          <input type="text" value="علی محمدی" style="width: 100%; padding: 11px 14px; border: 2px solid #e0e0e0; border-radius: 9px; font-family: inherit; direction: rtl;">
        </div>

        <button class="btn btn-primary" onclick="showToast('✅ تنظیمات ذخیره شد (نمایشی)')">
          💾 ذخیره تنظیمات
        </button>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h3 class="section-title">
          <span class="icon">🗑️</span>
          منطقه خطر
        </h3>
      </div>

      <p style="font-size: 13px; color: var(--text-light); margin-bottom: 15px;">
        با این کار همه محصولات، سفارشات و پیام‌ها پاک می‌شوند.
      </p>

      <button class="btn btn-primary" style="background: var(--danger);" onclick="resetAllData()">
        🗑️ پاک کردن همه داده‌ها
      </button>
    </div>
  `;
}

// ============================================
// 🎬 رویدادها
// ============================================

// تغییر صفحه
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    switchPage(page);
  });
});

function switchPage(page) {
  currentPage = page;

  // به‌روزرسانی منو
  document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
  document.querySelector(`.menu-item[data-page="${page}"]`)?.classList.add('active');

  // به‌روزرسانی عنوان
  const titles = {
    dashboard: ['داشبورد', 'نمای کلی فروشگاه'],
    products: ['محصولات', 'مدیریت محصولات فروشگاه'],
    categories: ['دسته‌بندی‌ها', 'مدیریت دسته‌بندی محصولات'],
    orders: ['سفارشات', 'لیست سفارشات مشتریان'],
    customers: ['مشتریان', 'لیست مشتریان ثبت‌نام‌شده'],
    messages: ['پیام‌ها', 'پیام‌های دریافتی از مشتریان'],
    settings: ['تنظیمات', 'تنظیمات فروشگاه']
  };
  document.getElementById('pageTitle').textContent = titles[page][0];
  document.getElementById('pageSubtitle').textContent = titles[page][1];

  // لود محتوا
  const content = document.getElementById('pageContent');
  switch (page) {
    case 'dashboard': content.innerHTML = renderDashboard(); break;
    case 'products': content.innerHTML = renderProducts(); break;
    case 'categories': content.innerHTML = renderCategories(); break;
    case 'orders': content.innerHTML = renderOrders(); break;
    case 'customers': content.innerHTML = renderCustomers(); break;
    case 'messages': content.innerHTML = renderMessages(); break;
    case 'settings': content.innerHTML = renderSettings(); break;
  }

  // بستن منوی موبایل
  document.getElementById('sidebar').classList.remove('active');
}

// ============================================
// 📦 مدیریت محصولات
// ============================================
function openProductModal(productId = null) {
  const modal = document.getElementById('productModal');
  const form = document.getElementById('productForm');
  form.reset();
  document.getElementById('productId').value = '';

  if (productId) {
    const p = products.find(x => x.id === productId);
    if (p) {
      document.getElementById('modalTitle').text
      if (productId) {
    const p = products.find(x => x.id === productId);
    if (p) {
      document.getElementById('modalTitle').textContent = 'ویرایش محصول';
      document.getElementById('productId').value = p.id;
      document.getElementById('productName').value = p.name;
      document.getElementById('productDescription').value = p.description || '';
      document.getElementById('productPrice').value = p.price;
      document.getElementById('productEmoji').value = p.emoji;
      document.getElementById('productRating').value = p.rating;
      document.getElementById('productCategory').value = p.category || 'home';
    }
  } else {
    document.getElementById('modalTitle').textContent = 'افزودن محصول جدید';
    document.getElementById('productEmoji').value = '📦';
    document.getElementById('productRating').value = '4.5';
  }

  modal.classList.add('active');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('active');
}

function editProduct(id) {
  openProductModal(id);
}

function deleteProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`آیا از حذف «${p.name}» مطمئنید؟`)) return;

  products = products.filter(x => x.id !== id);
  saveProducts();
  updateCounts();
  switchPage(currentPage);
  showToast('🗑️ محصول حذف شد');
}

// ============================================
// 🎬 فرم محصول
// ============================================
document.getElementById('productForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const id = document.getElementById('productId').value;
  const name = document.getElementById('productName').value.trim();
  const description = document.getElementById('productDescription').value.trim();
  const price = parseInt(document.getElementById('productPrice').value);
  const emoji = document.getElementById('productEmoji').value.trim() || '📦';
  const rating = parseFloat(document.getElementById('productRating').value) || 4.5;
  const category = document.getElementById('productCategory').value;

  if (!name || !price) {
    showToast('❌ نام و قیمت الزامی هستند', 'error');
    return;
  }

  if (id) {
    // ویرایش
    const idx = products.findIndex(p => p.id === Number(id));
    if (idx !== -1) {
      products[idx] = { ...products[idx], name, description, price, emoji, rating, category };
    }
    showToast('✅ محصول ویرایش شد');
  } else {
    // افزودن
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    products.push({ id: newId, name, description, price, emoji, rating, category });
    showToast('✅ محصول اضافه شد');
  }

  saveProducts();
  updateCounts();
  closeProductModal();
  switchPage(currentPage);
});

// ============================================
// 🗑️ ریست همه داده‌ها
// ============================================
function resetAllData() {
  if (!confirm('⚠️ هشدار! همه محصولات، سفارشات و پیام‌ها پاک می‌شوند. مطمئنید؟')) return;
  if (!confirm('این کار قابل بازگشت نیست! ادامه می‌دید؟')) return;

  localStorage.removeItem('banehbaba_products');
  localStorage.removeItem('banehbaba_orders');
  localStorage.removeItem('banehbaba_messages');
  localStorage.removeItem('banehbaba_customers');

  products = [...defaultProducts];
  orders = [];
  messages = [];
  customers = [];

  saveProducts();
  updateCounts();
  switchPage('dashboard');
  showToast('🗑️ همه داده‌ها پاک شدند');
}

// ============================================
// 🔢 به‌روزرسانی شمارنده‌ها
// ============================================
function updateCounts() {
  document.getElementById('productsCount').textContent = formatNumber(products.length);
  document.getElementById('ordersCount').textContent = formatNumber(orders.length);
  document.getElementById('messagesCount').textContent = formatNumber(messages.length);
}

// ============================================
// 📱 منوی موبایل
// ============================================
document.getElementById('menuToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('active');
});

// بستن سایدبار با کلیک بیرون
document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('menuToggle');
  if (window.innerWidth <= 900 && 
      sidebar.classList.contains('active') && 
      !sidebar.contains(e.target) && 
      !toggle.contains(e.target)) {
    sidebar.classList.remove('active');
  }
});

// بستن Modal با Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeProductModal();
  }
});

// ============================================
// 🚀 اجرای اولیه
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  updateCounts();
  switchPage('dashboard');
  showToast('👋 خوش آمدید به پنل مدیریت', 'info');
});
``
