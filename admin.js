/* ============================================
   بانه بابا - پنل مدیریت (نسخه کامل)
   ============================================ */

// ============================================
// 🔐 بررسی لاگین
// ============================================
if (sessionStorage.getItem('banehbaba_admin') !== 'logged_in') {
  window.location.href = 'admin.html';
}

// ============================================
// 📦 داده‌های پیش‌فرض
// ============================================
const defaultProducts = [
  { id: 1, name: "گوشی سامسونگ Galaxy S24", description: "حافظه ۲۵۶ گیگ، دوربین ۲۰۰ مگاپیکسل", price: 45000000, emoji: "📱", rating: 4.8, category: "home", image: "" },
  { id: 2, name: "لپ‌تاپ ایسوس ROG", description: "پردازنده i9، رم ۳۲ گیگ", price: 95000000, emoji: "💻", rating: 4.9, category: "home", image: "" },
  { id: 3, name: "هدفون سونی WH-1000XM5", description: "نویز کنسلینگ، ۳۰ ساعت شارژ", price: 15000000, emoji: "🎧", rating: 4.7, category: "home", image: "" },
  { id: 4, name: "ساعت هوشمند Apple Watch 9", description: "نمایشگر رتینا، ضدآب", price: 22000000, emoji: "⌚", rating: 4.6, category: "home", image: "" },
  { id: 5, name: "پلی‌استیشن 5", description: "دیسک‌خور، ۲ دسته بی‌سیم", price: 42000000, emoji: "🎮", rating: 4.9, category: "home", image: "" },
  { id: 6, name: "ایرپاد پرو نسل ۲", description: "نویز کنسلینگ، شارژ مغناطیسی", price: 8500000, emoji: "🎵", rating: 4.5, category: "home", image: "" },
  { id: 7, name: "تبلت آیپد ایر", description: "۱۱ اینچ، تراشه M2", price: 38000000, emoji: "📲", rating: 4.8, category: "home", image: "" },
  { id: 8, name: "دوربین کنون EOS R6", description: "سنسور فول‌فریم، 4K", price: 120000000, emoji: "📷", rating: 4.9, category: "home", image: "" }
];

const defaultCategories = [
  { id: 'camping', name: 'لوازم کوهنوردی و کمپ', icon: '🏔️', subs: ['عینک', 'چادر کوهنوردی', 'کیسه خواب', 'چراغ پیشانی', 'باتوم', 'اجاق کمپ', 'ابزار کوه', 'شکار'] },
  { id: 'home', name: 'لوازم خانگی', icon: '🏠', subs: ['تلویزیون', 'لباسشویی', 'ظرفشویی', 'کولر گازی', 'سرخ کن', 'اتو بخار', 'آبمیوه گیری'] },
  { id: 'beauty', name: 'سلامت و زیبایی', icon: '💄', subs: ['سفید کننده دندان', 'لمینت دندان', 'پوست', 'مو'] },
  { id: 'car', name: 'لوازم یدکی خودرو', icon: '🚗', subs: ['لنت'] }
];

// ============================================
// 💾 State
// ============================================
let products = JSON.parse(localStorage.getItem('banehbaba_products') || 'null') || [...defaultProducts];
let categories = JSON.parse(localStorage.getItem('banehbaba_categories') || 'null') || [...defaultCategories];
let orders = JSON.parse(localStorage.getItem('banehbaba_orders') || '[]');
let messages = JSON.parse(localStorage.getItem('banehbaba_messages') || '[]');
let customers = JSON.parse(localStorage.getItem('banehbaba_customers') || '[]');
let currentPage = 'dashboard';
let searchTerm = '';

// اگه مشتری‌ها خالی بود، از سفارشات استخراج کن
if (customers.length === 0 && orders.length > 0) {
  const customerMap = {};
  orders.forEach(o => { if (o.user?.phone) customerMap[o.user.phone] = o.user; });
  customers = Object.values(customerMap);
}

// ============================================
// 🛠 توابع کمکی
// ============================================
function formatPrice(num) { return Number(num).toLocaleString('fa-IR') + ' تومان'; }
function formatNumber(num) { return Number(num).toLocaleString('fa-IR'); }
function getPersianDate() {
  return new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
}
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'admin-toast show ' + (type === 'info' ? '' : type);
  setTimeout(() => { toast.className = 'admin-toast'; }, 2500);
}
function saveAll() {
  localStorage.setItem('banehbaba_products', JSON.stringify(products));
  localStorage.setItem('banehbaba_categories', JSON.stringify(categories));
}
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function logout() {
  if (confirm('از پنل خارج می‌شید؟')) {
    sessionStorage.removeItem('banehbaba_admin');
    window.location.href = 'admin.html';
  }
}

// ============================================
// 📊 داشبورد
// ============================================
function renderDashboard() {
  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const newMessages = messages.length;

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
          <h3>${formatNumber(newMessages)}</h3>
          <p>پیام</p>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h3 class="section-title"><span class="icon">📦</span> آخرین محصولات</h3>
        <button class="btn btn-primary btn-sm" onclick="openProductModal()">➕ افزودن محصول</button>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>تصویر</th>
              <th>نام محصول</th>
              <th>قیمت</th>
              <th>امتیاز</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            ${products.slice(0, 5).map(p => `
              <tr>
                <td>
                  <div class="product-thumb">
                    ${p.image ? `<img src="${p.image}" alt="${p.name}">` : p.emoji}
                  </div>
                </td>
                <td><strong>${p.name}</strong></td>
                <td>${formatPrice(p.price)}</td>
                <td>⭐ ${p.rating}</td>
                <td>
                  <button class="btn-icon btn-edit" onclick="editProduct(${p.id})" title="ویرایش">✏️</button>
                  <button class="btn-icon btn-delete" onclick="deleteProduct(${p.id})" title="حذف">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h3 class="section-title"><span class="icon">🕐</span> آخرین سفارشات</h3>
      </div>
      ${orders.length === 0
        ? `<div class="empty-state"><div class="icon">🛒</div><h3>هنوز سفارشی ثبت نشده</h3><p>سفارشات جدید اینجا نمایش داده می‌شوند</p></div>`
        : `<div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>کد پیگیری</th><th>مشتری</th><th>مبلغ</th><th>تاریخ</th></tr></thead>
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
// 📦 محصولات
// ============================================
function renderProducts() {
  const filtered = searchTerm
    ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : products;

  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title"><span class="icon">📦</span> محصولات (${formatNumber(filtered.length)})</h3>
        <div class="section-actions">
          <div class="search-box">
            <input type="text" placeholder="جستجو..." oninput="setSearch(this.value)" value="${searchTerm}">
          </div>
          <button class="btn btn-primary" onclick="openProductModal()">➕ افزودن محصول</button>
        </div>
      </div>

      ${filtered.length === 0
        ? `<div class="empty-state"><div class="icon">📦</div><h3>محصولی یافت نشد</h3><p>روی «افزودن محصول» بزنید</p></div>`
        : `<div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>تصویر</th>
                  <th>نام</th>
                  <th>توضیحات</th>
                  <th>قیمت</th>
                  <th>امتیاز</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(p => `
                  <tr>
                    <td>
                      <div class="product-thumb">
                        ${p.image ? `<img src="${p.image}" alt="${p.name}">` : p.emoji}
                      </div>
                    </td>
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

function setSearch(value) {
  searchTerm = value;
  document.getElementById('pageContent').innerHTML = renderProducts();
}

function openProductModal(productId = null) {
  const form = document.getElementById('productForm');
  form.reset();
  document.getElementById('productId').value = '';
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('productImageData').value = '';

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
      
      if (p.image) {
        const preview = document.getElementById('imagePreview');
        preview.src = p.image;
        preview.style.display = 'block';
        document.getElementById('productImageData').value = p.image;
      }
    }
  } else {
    document.getElementById('modalTitle').textContent = 'افزودن محصول جدید';
    document.getElementById('productEmoji').value = '📦';
    document.getElementById('productRating').value = '4.5';
  }

  openModal('productModal');
}

function editProduct(id) { openProductModal(id); }

function deleteProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`«${p.name}» حذف بشه؟`)) return;
  products = products.filter(x => x.id !== id);
  saveAll();
  updateCounts();
  switchPage(currentPage);
  showToast('🗑️ محصول حذف شد');
}

// آپلود تصویر
document.addEventListener('DOMContentLoaded', () => {
  const imageInput = document.getElementById('productImage');
  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = document.getElementById('imagePreview');
        preview.src = ev.target.result;
        preview.style.display = 'block';
        document.getElementById('productImageData').value = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
});

// فرم محصول
document.addEventListener('DOMContentLoaded', () => {
  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('productId').value;
      const name = document.getElementById('productName').value.trim();
      const description = document.getElementById('productDescription').value.trim();
      const price = parseInt(document.getElementById('productPrice').value);
      const emoji = document.getElementById('productEmoji').value.trim() || '📦';
      const rating = parseFloat(document.getElementById('productRating').value) || 4.5;
      const category = document.getElementById('productCategory').value;
      const image = document.getElementById('productImageData').value;

      if (!name || !price) { showToast('❌ نام و قیمت الزامی است', 'error'); return; }

      if (id) {
        const idx = products.findIndex(p => p.id === Number(id));
        if (idx !== -1) products[idx] = { ...products[idx], name, description, price, emoji, rating, category, image };
        showToast('✅ محصول ویرایش شد');
      } else {
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: newId, name, description, price, emoji, rating, category, image });
        showToast('✅ محصول اضافه شد');
      }

      saveAll();
      updateCounts();
      closeModal('productModal');
      switchPage(currentPage);
    });
  }
});

// ============================================
// 📂 دسته‌بندی‌ها
// ============================================
function renderCategories() {
  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title"><span class="icon">📂</span> دسته‌بندی‌ها</h3>
        <button class="btn btn-primary" onclick="openCategoryModal()">➕ افزودن دسته</button>
      </div>

      <div class="categories-grid">
        ${categories.map(cat => {
          const count = products.filter(p => p.category === cat.id).length;
          return `
            <div class="category-card">
              <div class="category-header">
                <h4>${cat.icon} ${cat.name}</h4>
                <div>
                  <button class="btn-icon btn-edit" onclick="editCategory('${cat.id}')">✏️</button>
                  <button class="btn-icon btn-delete" onclick="deleteCategory('${cat.id}')">🗑️</button>
                </div>
              </div>
              <p style="font-size: 12px; color: var(--text-light); margin-bottom: 12px;">
                ${formatNumber(count)} محصول • ${cat.subs.length} زیردسته
              </p>
              <div class="category-subs">
                ${cat.subs.map(s => `<span class="badge badge-info">${s}</span>`).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function openCategoryModal(categoryId = null) {
  const form = document.getElementById('categoryForm');
  form.reset();
  document.getElementById('categoryId').value = '';
  document.getElementById('categoryIcon').value = '📂';

  if (categoryId) {
    const c = categories.find(x => x.id === categoryId);
    if (c) {
      document.getElementById('categoryModalTitle').textContent = 'ویرایش دسته‌بندی';
      document.getElementById('categoryId').value = c.id;
      document.getElementById('categoryName').value = c.name;
      document.getElementById('categoryIcon').value = c.icon;
      document.getElementById('categorySubs').value = c.subs.join('، ');
    }
  } else {
    document.getElementById('categoryModalTitle').textContent = 'افزودن دسته‌بندی';
  }

  openModal('categoryModal');
}

function editCategory(id) { openCategoryModal(id); }

function deleteCategory(id) {
  const c = categories.find(x => x.id === id);
  if (!c) return;
  if (!confirm(`دسته «${c.name}» حذف بشه؟`)) return;
  categories = categories.filter(x => x.id !== id);
  saveAll();
  switchPage('categories');
  showToast('🗑️ دسته‌بندی حذف شد');
}

// فرم دسته‌بندی
document.addEventListener('DOMContentLoaded', () => {
  const categoryForm = document.getElementById('categoryForm');
  if (categoryForm) {
    categoryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('categoryId').value;
      const name = document.getElementById('categoryName').value.trim();
      const icon = document.getElementById('categoryIcon').value.trim() || '📂';
      const subsText = document.getElementById('categorySubs').value.trim();
      const subs = subsText ? subsText.split(/[,،]/).map(s => s.trim()).filter(s => s) : [];

      if (!name) { showToast('❌ نام دسته الزامی است', 'error'); return; }

      if (id) {
        const idx = categories.findIndex(c => c.id === id);
        if (idx !== -1) categories[idx] = { ...categories[idx], name, icon, subs };
        showToast('✅ دسته ویرایش شد');
      } else {
        const newId = 'cat_' + Date.now();
        categories.push({ id: newId, name, icon, subs });
        showToast('✅ دسته اضافه شد');
      }

      saveAll();
      closeModal('categoryModal');
      switchPage('categories');
    });
  }
});

// ============================================
// 🛒 سفارشات
// ============================================
function renderOrders() {
  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title"><span class="icon">🛒</span> سفارشات (${formatNumber(orders.length)})</h3>
      </div>
      ${orders.length === 0
        ? `<div class="empty-state"><div class="icon">🛒</div><h3>هنوز سفارشی ثبت نشده</h3><p>سفارشات جدید اینجا نمایش داده می‌شوند</p></div>`
        : `<div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>کد پیگیری</th>
                  <th>مشتری</th>
                  <th>موبایل</th>
                  <th>مبلغ</th>
                  <th>تاریخ</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                ${orders.slice().reverse().map(o => `
                  <tr>
                    <td><span class="badge badge-info">${o.trackingCode || '-'}</span></td>
                    <td>${o.user?.name || 'ناشناس'}</td>
                    <td>${o.user?.phone || '-'}</td>
                    <td>${formatPrice(o.amount || 0)}</td>
                    <td>${o.shortDate || '-'}</td>
                    <td>
                      <button class="btn-icon btn-view" onclick="viewOrder(${o.id})">👁️</button>
                      <button class="btn-icon btn-delete" onclick="deleteOrder(${o.id})">🗑️</button>
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

function viewOrder(orderId) {
  const o = orders.find(x => x.id === orderId);
  if (!o) return;
  
  const itemsHtml = (o.items || []).map(item => `
    <div style="display: flex; gap: 10px; align-items: center; padding: 10px; background: #f9f9f9; border-radius: 8px; margin-bottom: 8px;">
      <div style="font-size: 24px;">${item.emoji || '📦'}</div>
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: 14px;">${item.name}</div>
        <div style="font-size: 12px; color: #777;">تعداد: ${item.quantity}</div>
      </div>
      <div style="font-size: 13px; color: var(--secondary); font-weight: 600;">${formatPrice(item.price * item.quantity)}</div>
    </div>
  `).join('');

  document.getElementById('orderDetails').innerHTML = `
    <div style="margin-bottom: 15px;">
      <p style="font-size: 13px; color: #777; margin-bottom: 5px;">کد پیگیری</p>
      <p style="font-weight: 600;">${o.trackingCode || '-'}</p>
    </div>
    <div style="margin-bottom: 15px;">
      <p style="font-size: 13px; color: #777; margin-bottom: 5px;">مشتری</p>
      <p style="font-weight: 600;">${o.user?.name || 'ناشناس'} • ${o.user?.phone || '-'}</p>
    </div>
    <div style="margin-bottom: 15px;">
      <p style="font-size: 13px; color: #777; margin-bottom: 5px;">تاریخ</p>
      <p>${o.date || '-'} • ${o.time || ''}</p>
    </div>
    <div style="margin-bottom: 15px;">
      <p style="font-size: 13px; color: #777; margin-bottom: 10px;">محصولات</p>
      ${itemsHtml || '<p>محصولی ثبت نشده</p>'}
    </div>
    <div style="padding-top: 15px; border-top: 2px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-weight: 600;">جمع کل:</span>
      <strong style="font-size: 18px; color: var(--secondary);">${formatPrice(o.amount || 0)}</strong>
    </div>
  `;
  
  openModal('orderModal');
}

function deleteOrder(orderId) {
  if (!confirm('این سفارش حذف بشه؟')) return;
  orders = orders.filter(o => o.id !== orderId);
  localStorage.setItem('banehbaba_orders', JSON.stringify(orders));
  updateCounts();
  switchPage('orders');
  showToast('🗑️ سفارش حذف شد');
}

// ============================================
// 👥 مشتریان
// ============================================
function renderCustomers() {
  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title"><span class="icon">👥</span> مشتریان (${formatNumber(customers.length)})</h3>
      </div>
      ${customers.length === 0
        ? `<div class="empty-state"><div class="icon">👥</div><h3>هنوز مشتری‌ای نیست</h3><p>مشتریان جدید اینجا نمایش داده می‌شوند</p></div>`
        : `<div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr><th>نام</th><th>موبایل</th><th>ایمیل</th><th>تاریخ ثبت‌نام</th></tr>
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
// 💬 پیام‌ها
// ============================================
function renderMessages() {
  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title"><span class="icon">💬</span> پیام‌ها (${formatNumber(messages.length)})</h3>
      </div>
      ${messages.length === 0
        ? `<div class="empty-state"><div class="icon">💬</div><h3>هنوز پیامی نیست</h3><p>پیام‌های فرم تماس اینجا نمایش داده می‌شوند</p></div>`
        : messages.slice().reverse().map(m => `
            <div style="background: #f9f9f9; border-radius: 12px; padding: 18px; margin-bottom: 12px; border-right: 4px solid var(--primary);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                <strong style="font-size: 15px;">${m.name || 'ناشناس'}</strong>
                <div>
                  <span class="badge badge-info" style="font-size: 11px;">${m.subject || 'سایر'}</span>
                  <button class="btn-icon btn-delete" onclick="deleteMessage(${m.id})" style="margin-right: 5px;">🗑️</button>
                </div>
              </div>
              <div style="font-size: 12px; color: var(--text-light); margin-bottom: 10px;">
                📞 ${m.phone || '-'} | 📧 ${m.email || '-'} | 📅 ${m.date || '-'}
              </div>
              <p style="font-size: 14px; line-height: 1.8;">${m.message || ''}</p>
            </div>
          `).join('')
      }
    </div>
  `;
}

function deleteMessage(id) {
  if (!confirm('این پیام حذف بشه؟')) return;
  messages = messages.filter(m => m.id !== id);
  localStorage.setItem('banehbaba_messages', JSON.stringify(messages));
  updateCounts();
  switchPage('messages');
  showToast('🗑️ پیام حذف شد');
}

// ============================================
// ⚙️ تنظیمات
// ============================================
function renderSettings() {
  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title"><span class="icon">⚙️</span> تنظیمات فروشگاه</h3>
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
        <button class="btn btn-primary" onclick="showToast('✅ تنظیمات ذخیره شد')">💾 ذخیره تنظیمات</button>
      </div>
    </div>
    <div class="section">
      <div class="section-header">
        <h3 class="section-title"><span class="icon">🗑️</span> منطقه خطر</h3>
      </div>
      <p style="font-size: 13px; color: var(--text-light); margin-bottom: 15px;">همه داده‌ها پاک می‌شوند.</p>
      <button class="btn btn-danger" onclick="resetAllData()">🗑️ پاک کردن همه داده‌ها</button>
    </div>
  `;
}

function resetAllData() {
  if (!confirm('⚠️ همه داده‌ها پاک می‌شوند. مطمئنید؟')) return;
  if (!confirm('این کار قابل بازگشت نیست!')) return;
  localStorage.removeItem('banehbaba_products');
  localStorage.removeItem('banehbaba_categories');
  localStorage.removeItem('banehbaba_orders');
  localStorage.removeItem('banehbaba_messages');
  localStorage.removeItem('banehbaba_customers');
  products = [...defaultProducts];
  categories = [...defaultCategories];
  orders = [];
  messages = [];
  customers = [];
  saveAll();
  updateCounts();
  switchPage('dashboard');
  showToast('🗑️ همه داده‌ها پاک شد');
}

// ============================================
// 🎬 ناوبری
// ============================================
function switchPage(page) {
  currentPage = page;
  searchTerm = '';
  document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
  document.querySelector(`.menu-item[data-page="${page}"]`)?.classList.add('active');

  const titles = {
    dashboard: ['داشبورد', 'نمای کلی فروشگاه'],
    products: ['محصولات', 'مدیریت محصولات'],
    categories: ['دسته‌بندی‌ها', 'مدیریت دسته‌بندی'],
    orders: ['سفارشات', 'لیست سفارشات'],
    customers: ['مشتریان', 'لیست مشتریان'],
    messages: ['پیام‌ها', 'پیام‌های دریافتی'],
    settings: ['تنظیمات', 'تنظیمات فروشگاه']
  };
  document.getElementById('pageTitle').textContent = titles[page][0];
  document.getElementById('pageSubtitle').textContent = titles[page][1];

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

  document.getElementById('sidebar').classList.remove('active');
}

document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => switchPage(item.dataset.page));
});

// ============================================
// 🔢 شمارنده‌ها
// ============================================
function updateCounts() {
  document.getElementById('productsCount').textContent = formatNumber(products.length);
  document.getElementById('ordersCount').textContent = formatNumber(orders.length);
  document.getElementById('messagesCount').textContent = formatNumber(messages.length);
}

// ============================================
// 📱 موبایل
// ============================================
document.getElementById('menuToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('active');
});

document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('menuToggle');
  if (window.innerWidth <= 900 && sidebar.classList.contains('active') && 
      !sidebar.contains(e.target) && !toggle.contains(e.target)) {
    sidebar.classList.remove('active');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.admin-modal.active').forEach(m => m.classList.remove('active'));
  }
});

// ============================================
// 🚀 اجرا
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  updateCounts();
  switchPage('dashboard');
  showToast('👋 خوش آمدید', 'info');
});
