/* ============================================
   بانه بابا - پنل مدیریت (نسخه نهایی)
   ============================================ */

const API_URL = 'https://banehbaba-backend.vercel.app/api';

// ============================================
// 🔐 بررسی لاگین
// ============================================
const adminToken = sessionStorage.getItem('banehbaba_token');
const isAdmin = sessionStorage.getItem('banehbaba_admin');

console.log('🚀 Admin.js شروع شد');
console.log('Token:', adminToken ? '✅ دارد' : '❌ ندارد');

// اگه لاگین نیست
if (isAdmin !== 'logged_in' || !adminToken) {
  window.location.replace('login.html');
}

// ============================================
// 💾 State
// ============================================
let products = [];
let orders = [];
let messages = [];
let currentPage = 'dashboard';

const categories = [
  { id: 'camping', name: 'لوازم کوهنوردی و کمپ', icon: '🏔️' },
  { id: 'home', name: 'لوازم خانگی', icon: '🏠' },
  { id: 'beauty', name: 'سلامت و زیبایی', icon: '💄' },
  { id: 'car', name: 'لوازم یدکی خودرو', icon: '🚗' }
];

// ============================================
// 🛠 توابع کمکی
// ============================================
function formatPrice(num) {
  return Number(num).toLocaleString('fa-IR') + ' تومان';
}
function formatNumber(num) {
  return Number(num).toLocaleString('fa-IR');
}
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'admin-toast show ' + (type === 'info' ? '' : type);
  setTimeout(() => { toast.className = 'admin-toast'; }, 2500);
}
function showLoading(show = true) {
  const el = document.getElementById('loadingOverlay');
  if (el) el.classList.toggle('active', show);
}
function openModal(id) { 
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}
function closeModal(id) { 
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}
function logout() {
  if (confirm('از پنل خارج می‌شید؟')) {
    sessionStorage.clear();
    window.location.href = 'login.html';
  }
}

// ============================================
// 🔌 API Call
// ============================================
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + adminToken
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  console.log(`📡 ${method} ${API_URL + endpoint}`);

  const response = await fetch(API_URL + endpoint, options);
  const data = await response.json();

  console.log(`📥 Response:`, data);

  if (response.status === 401) {
    showToast('دسترسی منقضی شد', 'error');
    setTimeout(() => {
      sessionStorage.clear();
      window.location.href = 'login.html';
    }, 1500);
    throw new Error('Unauthorized');
  }

  return data;
}

// ============================================
// 📥 بارگذاری
// ============================================
async function loadProducts() {
  try {
    const data = await apiCall('/products');
    if (data.success) products = data.products || [];
  } catch (e) { console.error('محصولات:', e); }
}

async function loadOrders() {
  try {
    const data = await apiCall('/orders');
    if (data.success) orders = data.orders || [];
  } catch (e) { console.error('سفارشات:', e); }
}

async function loadMessages() {
  try {
    const data = await apiCall('/messages');
    if (data.success) messages = data.messages || [];
  } catch (e) { console.error('پیام‌ها:', e); }
}

// ============================================
// 🎨 رندر صفحات
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
          <p>درآمد</p>
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
        <h3 class="section-title"><span class="icon">📦</span> محصولات</h3>
        <button class="btn btn-primary btn-sm" onclick="openProductModal()">➕ افزودن</button>
      </div>
      ${products.length === 0
        ? `<div class="empty-state"><div class="icon">📦</div><h3>هنوز محصولی نیست</h3></div>`
        : `<div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>تصویر</th><th>نام</th><th>قیمت</th><th>عملیات</th></tr></thead>
              <tbody>
                ${products.map(p => `
                  <tr>
                    <td>
                      <div class="product-thumb">
                        ${p.image ? `<img src="${p.image}" alt="${p.name}">` : (p.emoji || '📦')}
                      </div>
                    </td>
                    <td><strong>${p.name}</strong></td>
                    <td>${formatPrice(p.discountPrice || p.price)}</td>
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

function renderProducts() {
  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title"><span class="icon">📦</span> محصولات (${formatNumber(products.length)})</h3>
        <button class="btn btn-primary" onclick="openProductModal()">➕ افزودن محصول</button>
      </div>
      ${products.length === 0
        ? `<div class="empty-state"><div class="icon">📦</div><h3>محصولی نیست</h3></div>`
        : `<div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>تصویر</th><th>نام</th><th>قیمت</th><th>تخفیف</th><th>عملیات</th></tr></thead>
              <tbody>
                ${products.map(p => {
                  let discount = '-';
                  if (p.discountPrice && p.discountPrice < p.price) {
                    const percent = Math.round((1 - p.discountPrice / p.price) * 100);
                    discount = `<span class="badge badge-success">${formatNumber(percent)}٪</span>`;
                  }
                  return `
                    <tr>
                      <td>
                        <div class="product-thumb">
                          ${p.image ? `<img src="${p.image}" alt="${p.name}">` : (p.emoji || '📦')}
                        </div>
                      </td>
                      <td><strong>${p.name}</strong></td>
                      <td>
                        ${p.discountPrice && p.discountPrice < p.price
                          ? `<div style="text-decoration: line-through; color: #999; font-size: 12px;">${formatPrice(p.price)}</div>
                             <div style="color: var(--secondary); font-weight: 700;">${formatPrice(p.discountPrice)}</div>`
                          : formatPrice(p.price)
                        }
                      </td>
                      <td>${discount}</td>
                      <td>
                        <button class="btn-icon btn-edit" onclick="editProduct(${p.id})">✏️</button>
                        <button class="btn-icon btn-delete" onclick="deleteProduct(${p.id})">🗑️</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>`
      }
    </div>
  `;
}

function renderCategories() {
  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title"><span class="icon">📂</span> دسته‌بندی‌ها</h3>
      </div>
      <div class="categories-grid">
        ${categories.map(cat => {
          const count = products.filter(p => p.category === cat.id).length;
          return `
            <div class="category-card">
              <div class="category-header">
                <h4>${cat.icon || '📂'} ${cat.name}</h4>
              </div>
              <p style="font-size: 12px; color: var(--text-light);">
                ${formatNumber(count)} محصول
              </p>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderOrders() {
  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title"><span class="icon">🛒</span> سفارشات (${formatNumber(orders.length)})</h3>
      </div>
      ${orders.length === 0
        ? `<div class="empty-state"><div class="icon">🛒</div><h3>هنوز سفارشی نیست</h3></div>`
        : `<div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>کد پیگیری</th><th>مشتری</th><th>مبلغ</th></tr></thead>
              <tbody>
                ${orders.map(o => `
                  <tr>
                    <td>${o.trackingCode || '-'}</td>
                    <td>${o.user?.name || 'ناشناس'}</td>
                    <td>${formatPrice(o.amount || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>`
      }
    </div>
  `;
}

function renderMessages() {
  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title"><span class="icon">💬</span> پیام‌ها (${formatNumber(messages.length)})</h3>
      </div>
      ${messages.length === 0
        ? `<div class="empty-state"><div class="icon">💬</div><h3>هنوز پیامی نیست</h3></div>`
        : messages.map(m => `
            <div style="background: #f9f9f9; border-radius: 12px; padding: 18px; margin-bottom: 12px; border-right: 4px solid var(--primary);">
              <strong>${m.name || 'ناشناس'}</strong>
              <div style="font-size: 12px; color: #777; margin: 8px 0;">
                📞 ${m.phone || '-'} | ${m.date || '-'}
              </div>
              <p>${m.message || ''}</p>
            </div>
          `).join('')
      }
    </div>
  `;
}

// ============================================
// 🎬 ناوبری
// ============================================
function switchPage(page) {
  currentPage = page;
  
  document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
  const activeItem = document.querySelector(`.menu-item[data-page="${page}"]`);
  if (activeItem) activeItem.classList.add('active');

  const titles = {
    dashboard: ['داشبورد', 'نمای کلی فروشگاه'],
    products: ['محصولات', 'مدیریت محصولات'],
    categories: ['دسته‌بندی‌ها', 'مدیریت دسته‌بندی'],
    orders: ['سفارشات', 'لیست سفارشات'],
    messages: ['پیام‌ها', 'پیام‌های دریافتی']
  };

  const titleEl = document.getElementById('pageTitle');
  const subtitleEl = document.getElementById('pageSubtitle');
  if (titleEl) titleEl.textContent = titles[page][0];
  if (subtitleEl) subtitleEl.textContent = titles[page][1];

  const content = document.getElementById('pageContent');
  if (!content) return;

  switch (page) {
    case 'dashboard': content.innerHTML = renderDashboard(); break;
    case 'products': content.innerHTML = renderProducts(); break;
    case 'categories': content.innerHTML = renderCategories(); break;
    case 'orders': content.innerHTML = renderOrders(); break;
    case 'messages': content.innerHTML = renderMessages(); break;
  }

  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('active');
}

function updateCounts() {
  const pc = document.getElementById('productsCount');
  const oc = document.getElementById('ordersCount');
  const mc = document.getElementById('messagesCount');
  if (pc) pc.textContent = formatNumber(products.length);
  if (oc) oc.textContent = formatNumber(orders.length);
  if (mc) mc.textContent = formatNumber(messages.length);
}

// ============================================
// 📦 مدیریت محصولات
// ============================================
function openProductModal(productId = null) {
  const form = document.getElementById('productForm');
  if (form) form.reset();
  
  const idEl = document.getElementById('productId');
  const existingEl = document.getElementById('productExistingImage');
  if (idEl) idEl.value = '';
  if (existingEl) existingEl.value = '';
  
  const preview = document.getElementById('imagePreviewWrapper');
  if (preview) preview.style.display = 'none';

  if (productId) {
    const p = products.find(x => x.id === productId);
    if (p) {
      document.getElementById('modalTitle').textContent = 'ویرایش محصول';
      document.getElementById('productId').value = p.id;
      document.getElementById('productName').value = p.name;
      document.getElementById('productDescription').value = p.description || '';
      document.getElementById('productPrice').value = p.price;
      document.getElementById('productDiscount').value = p.discountPrice || '';
      document.getElementById('productRating').value = p.rating || 4.5;
      document.getElementById('productCategory').value = p.category || 'home';
      
      if (p.image) {
        document.getElementById('productExistingImage').value = p.image;
        document.getElementById('imagePreview').src = p.image;
        document.getElementById('imagePreviewWrapper').style.display = 'inline-block';
      }
    }
  } else {
    document.getElementById('modalTitle').textContent = 'افزودن محصول جدید';
    document.getElementById('productRating').value = '4.5';
  }

  openModal('productModal');
}

function editProduct(id) { openProductModal(id); }

async function deleteProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`«${p.name}» حذف بشه؟`)) return;

  showLoading(true);
  try {
    await apiCall('/products/' + id, 'DELETE');
    showToast('🗑️ حذف شد');
    await loadProducts();
    updateCounts();
    switchPage(currentPage);
  } catch (e) {
    showToast('خطا در حذف', 'error');
  }
  showLoading(false);
}

function removeImage() {
  document.getElementById('productImage').value = '';
  document.getElementById('imagePreview').src = '';
  document.getElementById('imagePreviewWrapper').style.display = 'none';
  document.getElementById('productExistingImage').value = '';
}

// ============================================
// 🎬 رویدادها
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('✅ DOM لود شد');

  // منوی موبایل
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.toggle('active');
    });
  }

  // کلیک منوها
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => switchPage(item.dataset.page));
  });

  // آپلود تصویر
  const imageInput = document.getElementById('productImage');
  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      console.log('📸 عکس انتخاب شد:', file.name, file.size, 'bytes');
      
      if (file.size > 5 * 1024 * 1024) {
        showToast('حجم عکس باید کمتر از ۵ مگابایت باشه', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        document.getElementById('imagePreview').src = ev.target.result;
        document.getElementById('imagePreviewWrapper').style.display = 'inline-block';
        console.log('✅ پیش‌نمایش ساخته شد');
      };
      reader.readAsDataURL(file);
    });
  }

  // فرم محصول
  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('📝 فرم ارسال شد');
      
      const id = document.getElementById('productId').value;
      const name = document.getElementById('productName').value.trim();
      const description = document.getElementById('productDescription').value.trim();
      const price = parseInt(document.getElementById('productPrice').value);
      const discountPrice = document.getElementById('productDiscount').value 
        ? parseInt(document.getElementById('productDiscount').value) 
        : null;
      const rating = parseFloat(document.getElementById('productRating').value) || 4.5;
      const category = document.getElementById('productCategory').value;
      let image = document.getElementById('productExistingImage').value || '';

      if (!name || !price) {
        showToast('نام و قیمت الزامی است', 'error');
        return;
      }

      // آپلود عکس اگه فایل انتخاب شده
      const imageFile = document.getElementById('productImage').files[0];
      if (imageFile) {
        console.log('📤 شروع آپلود عکس...');
        showLoading(true);
        try {
          const reader = new FileReader();
          const base64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
          });

          console.log('📦 Base64 ساخته شد، طول:', base64.length);
          
          const uploadResult = await apiCall('/upload', 'POST', { image: base64 });
          
          console.log('✅ نتیجه آپلود:', uploadResult);
          
          if (uploadResult.success && uploadResult.url) {
            image = uploadResult.url;
            console.log('🖼️ URL عکس:', image);
          } else {
            throw new Error(uploadResult.error || 'خطا در آپلود');
          }
        } catch (err) {
          console.error('❌ خطا در آپلود:', err);
          showLoading(false);
          showToast('خطا در آپلود: ' + err.message, 'error');
          return;
        }
      }

      const productData = { name, description, price, discountPrice, rating, category, image, emoji: '📦' };
      console.log('💾 داده‌های محصول:', productData);

      showLoading(true);
      try {
        if (id) {
          await apiCall('/products/' + id, 'PUT', productData);
          showToast('✅ ویرایش شد');
        } else {
          await apiCall('/products', 'POST', productData);
          showToast('✅ اضافه شد');
        }
        await loadProducts();
        updateCounts();
        closeModal('productModal');
        switchPage(currentPage);
      } catch (err) {
        console.error('❌ خطا در ذخیره:', err);
        showToast('خطا: ' + err.message, 'error');
      }
      showLoading(false);
    });
  }

  // Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.admin-modal.active').forEach(m => m.classList.remove('active'));
    }
  });

  // لود داده‌ها
  await loadProducts();
  await loadOrders();
  await loadMessages();
  updateCounts();
  switchPage('dashboard');
  showToast('👋 خوش آمدید', 'info');
});
