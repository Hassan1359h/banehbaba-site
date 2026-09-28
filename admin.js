/* ============================================
   بانه بابا - پنل مدیریت (نسخه نهایی بدون آیکون)
   ============================================ */

const API_URL = 'https://banehbaba-backend.vercel.app/api';

// ============================================
// 🔐 بررسی لاگین
// ============================================
const adminToken = sessionStorage.getItem('banehbaba_token');
const isAdmin = sessionStorage.getItem('banehbaba_admin');

if (isAdmin !== 'logged_in' || !adminToken) {
  window.location.replace('login.html');
}

// ============================================
// 🐛 نمایش خطا
// ============================================
function showError(message) {
  let errorBox = document.getElementById('errorBox');
  if (!errorBox) {
    errorBox = document.createElement('div');
    errorBox.id = 'errorBox';
    errorBox.style.cssText = `
      position: fixed; top: 10px; left: 10px; right: 10px;
      background: #e74c3c; color: white; padding: 15px;
      border-radius: 10px; z-index: 99999; font-size: 13px;
      direction: ltr; text-align: left; word-break: break-all;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(errorBox);
  }
  errorBox.textContent = '❌ ' + message;
  errorBox.style.display = 'block';
  setTimeout(() => { if (errorBox) errorBox.style.display = 'none'; }, 10000);
}

window.onerror = function(msg, url, line) {
  showError(msg + ' - خط ' + line);
};

// ============================================
// 💾 State
// ============================================
let products = [];
let orders = [];
let messages = [];
let currentPage = 'dashboard';
let selectedImageFile = null;

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
  setTimeout(() => { toast.className = 'admin-toast'; }, 3000);
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
function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
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

  const response = await fetch(API_URL + endpoint, options);
  const data = await response.json();

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
                        ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">` : '📦'}
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
                          ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">` : '📦'}
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
  
  selectedImageFile = null;
  
  setVal('productId', '');
  setVal('productExistingImage', '');
  
  const preview = document.getElementById('imagePreviewWrapper');
  if (preview) preview.style.display = 'none';
  
  const imgPreview = document.getElementById('imagePreview');
  if (imgPreview) imgPreview.src = '';

  if (productId) {
    const p = products.find(x => x.id === productId);
    if (p) {
      const titleEl = document.getElementById('modalTitle');
      if (titleEl) titleEl.textContent = 'ویرایش محصول';
      
      setVal('productId', p.id);
      setVal('productName', p.name);
      setVal('productDescription', p.description || '');
      setVal('productPrice', p.price);
      setVal('productDiscount', p.discountPrice || '');
      setVal('productRating', p.rating || 4.5);
      setVal('productCategory', p.category || 'home');
      setVal('productSubcategory', p.subcategory || '');
      if (p.image) {
        setVal('productExistingImage', p.image);
        if (imgPreview) imgPreview.src = p.image;
        if (preview) preview.style.display = 'inline-block';
      }
    }
  } else {
    const titleEl = document.getElementById('modalTitle');
    if (titleEl) titleEl.textContent = 'افزودن محصول جدید';
    
    setVal('productRating', '4.5');
     setVal('productSubcategory', '');
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
  selectedImageFile = null;
  const input = document.getElementById('productImage');
  if (input) input.value = '';
  const img = document.getElementById('imagePreview');
  if (img) img.src = '';
  const wrap = document.getElementById('imagePreviewWrapper');
  if (wrap) wrap.style.display = 'none';
  setVal('productExistingImage', '');
}

// ============================================
// 🎬 رویدادها
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.toggle('active');
    });
  }

  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => switchPage(item.dataset.page));
  });

  // 📸 انتخاب عکس
  const imageInput = document.getElementById('productImage');
  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      if (file.size > 5 * 1024 * 1024) {
        showToast('حجم عکس باید کمتر از ۵ مگابایت باشه', 'error');
        return;
      }
      
      selectedImageFile = file;
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = document.getElementById('imagePreview');
        if (img) img.src = ev.target.result;
        const wrap = document.getElementById('imagePreviewWrapper');
        if (wrap) wrap.style.display = 'inline-block';
        showToast('✅ عکس انتخاب شد', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  // 💾 ذخیره محصول
  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = getVal('productId');
      const name = getVal('productName').trim();
      const description = getVal('productDescription').trim();
      const price = parseInt(getVal('productPrice'));
      const discountPrice = getVal('productDiscount') 
        ? parseInt(getVal('productDiscount')) 
        : null;
      const rating = parseFloat(getVal('productRating')) || 4.5;
      const category = getVal('productCategory');
      let image = getVal('productExistingImage') || '';

      if (!name || !price) {
        showToast('نام و قیمت الزامی است', 'error');
        return;
      }

      // آپلود عکس
      if (selectedImageFile) {
        showLoading(true);
        showToast('📤 در حال آپلود عکس...', 'info');
        
        try {
          const reader = new FileReader();
          const base64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('خطا در خواندن فایل'));
            reader.readAsDataURL(selectedImageFile);
          });

          const uploadResult = await apiCall('/upload', 'POST', { image: base64 });
          
          if (uploadResult.success && uploadResult.url) {
            image = uploadResult.url;
            showToast('✅ عکس آپلود شد', 'success');
          } else {
            throw new Error(uploadResult.error || 'خطا در آپلود');
          }
        } catch (err) {
          showLoading(false);
          showToast('❌ خطا در آپلود: ' + err.message, 'error');
          showError('Upload Error: ' + err.message);
          return;
        }
      }

      const subcategory = getVal('productSubcategory') || '';
const productData = { 
  name, 
  description, 
  price, 
  discountPrice, 
  rating, 
  category,
  subcategory,
  image
};

      showLoading(true);
      
      try {
        if (id) {
          await apiCall('/products/' + id, 'PUT', productData);
          showToast('✅ ویرایش شد', 'success');
        } else {
          await apiCall('/products', 'POST', productData);
          showToast('✅ اضافه شد', 'success');
        }
        
        selectedImageFile = null;
        
        await loadProducts();
        updateCounts();
        closeModal('productModal');
        switchPage(currentPage);
      } catch (err) {
        showToast('❌ خطا: ' + err.message, 'error');
        showError('Save Error: ' + err.message);
      }
      
      showLoading(false);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.admin-modal.active').forEach(m => m.classList.remove('active'));
    }
  });

  await loadProducts();
  await loadOrders();
  await loadMessages();
  updateCounts();
  switchPage('dashboard');
});
