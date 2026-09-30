/* ============================================
   بانه بابا - پنل مدیریت (نسخه حرفه‌ای)
   با فشرده‌سازی عکس + نمایش پیشرفت آپلود
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
let compressedImageBase64 = null;

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
// 📊 نمایش پیشرفت آپلود
// ============================================
function showUploadProgress(percent, text = 'در حال آپلود...') {
  let box = document.getElementById('uploadProgress');
  if (!box) {
    box = document.createElement('div');
    box.id = 'uploadProgress';
    box.style.cssText = `
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      background: white; padding: 30px;
      border-radius: 16px; z-index: 99999;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      width: 90%; max-width: 400px;
      text-align: center; font-family: inherit;
    `;
    box.innerHTML = `
      <div style="font-size: 40px; margin-bottom: 15px;">📤</div>
      <h3 id="progressText" style="margin-bottom: 20px; color: #333; font-size: 16px;">در حال آپلود...</h3>
      <div style="background: #f0f0f0; border-radius: 20px; height: 20px; overflow: hidden; margin-bottom: 15px;">
        <div id="progressBar" style="background: linear-gradient(90deg, #FF6B35, #e55a25); height: 100%; width: 0%; transition: width 0.3s; border-radius: 20px;"></div>
      </div>
      <div id="progressPercent" style="font-size: 24px; font-weight: 700; color: #FF6B35;">۰٪</div>
    `;
    document.body.appendChild(box);
  }
  
  const bar = document.getElementById('progressBar');
  const textEl = document.getElementById('progressText');
  const percentEl = document.getElementById('progressPercent');
  
  if (bar) bar.style.width = percent + '%';
  if (textEl) textEl.textContent = text;
  if (percentEl) percentEl.textContent = percent.toLocaleString('fa-IR') + '٪';
}

function hideUploadProgress() {
  const box = document.getElementById('uploadProgress');
  if (box) box.remove();
}

function showSuccessAnimation(message) {
  const box = document.createElement('div');
  box.style.cssText = `
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: #27ae60; color: white;
    padding: 40px; border-radius: 20px;
    z-index: 99999; text-align: center;
    box-shadow: 0 10px 40px rgba(39,174,96,0.4);
    animation: popIn 0.3s ease;
  `;
  box.innerHTML = `
    <div style="font-size: 60px; margin-bottom: 15px;">✅</div>
    <h2 style="font-size: 20px; margin-bottom: 10px;">${message}</h2>
    <p style="font-size: 14px; opacity: 0.9;">محصول با موفقیت ذخیره شد</p>
  `;
  document.body.appendChild(box);
  
  setTimeout(() => box.remove(), 2000);
}

// ============================================
// 🗜️ فشرده‌سازی عکس
// ============================================
function compressImage(file, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    console.log('🗜️ شروع فشرده‌سازی...');
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        console.log('✅ تصویر لود شد:', img.width, 'x', img.height);
        
        // محاسبه ابعاد جدید
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        console.log('📐 ابعاد جدید:', width, 'x', height);
        
        // کشیدن روی canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // تبدیل به Base64 فشرده
        const compressed = canvas.toDataURL('image/jpeg', quality);
        
        const originalSize = file.size / 1024;
        const newSize = (compressed.length * 0.75) / 1024; // تخمین
        
        console.log('✅ فشرده شد: از ' + originalSize.toFixed(0) + ' KB به ~' + newSize.toFixed(0) + ' KB');
        
        resolve({
          base64: compressed,
          originalSize: originalSize,
          newSize: newSize,
          width: width,
          height: height
        });
      };
      
      img.onerror = () => {
        console.error('❌ خطا در لود تصویر');
        reject(new Error('خطا در لود تصویر'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      console.error('❌ خطا در خواندن فایل');
      reject(new Error('خطا در خواندن فایل'));
    };
    
    reader.readAsDataURL(file);
  });
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
              <thead>
                <tr>
                  <th>کد پیگیری</th>
                  <th>مشتری</th>
                  <th>مبلغ</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                ${orders.slice().reverse().map(o => {
                  const statusText = {
                    pending: '⏳ در حال پردازش',
                    shipped: '🚚 ارسال شده',
                    delivered: '✅ تحویل داده شده',
                    cancelled: '❌ لغو شده'
                  }[o.status] || '⏳ در حال پردازش';
                  
                  return `
                    <tr>
                      <td><span class="badge badge-info">${o.trackingCode || '-'}</span></td>
                      <td>${o.customer?.name || o.user?.name || 'ناشناس'}</td>
                      <td>${formatPrice(o.amount || 0)}</td>
                      <td>${statusText}</td>
                      <td style="white-space:nowrap;">
                        <button class="btn-icon btn-view" onclick="viewOrder(${o.id})" title="جزئیات">👁️</button>
                        <button class="btn-icon btn-edit" onclick="changeStatus(${o.id})" title="تغییر وضعیت">✏️</button>
                        <button class="btn-icon btn-delete" onclick="deleteOrder(${o.id})" title="حذف">🗑️</button>
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

async function changeStatus(orderId) {
  const o = orders.find(x => x.id === orderId);
  if (!o) return;

  const current = o.status || 'pending';
  const options = ['pending', 'shipped', 'delivered', 'cancelled'];
  const labels = { pending: 'در حال پردازش', shipped: 'ارسال شده', delivered: 'تحویل داده شده', cancelled: 'لغو شده' };

  const choice = prompt(
    `وضعیت فعلی: ${labels[current]}\n\n` +
    `وضعیت جدید را وارد کنید:\n` +
    `1 = در حال پردازش\n` +
    `2 = ارسال شده\n` +
    `3 = تحویل داده شده\n` +
    `4 = لغو شده`,
    String(options.indexOf(current) + 1)
  );

  const idx = parseInt(choice) - 1;
  if (isNaN(idx) || idx < 0 || idx > 3) return;

  const newStatus = options[idx];
  const updates = { status: newStatus };

  // اگه ارسال شده، کد رهگیری پستی بگیر
  if (newStatus === 'shipped') {
    const code = prompt('کد رهگیری پستی (اختیاری):', o.postalTrackingCode || '');
    if (code) updates.postalTrackingCode = code;
  }

  try {
    await apiCall('/orders/' + orderId, 'PUT', updates);
    showToast('✅ وضعیت تغییر کرد');
    await loadOrders();
    switchPage('orders');
  } catch (e) {
    showToast('خطا در تغییر وضعیت', 'error');
  }
}

async function deleteOrder(orderId) {
  if (!confirm('این سفارش حذف بشه؟')) return;
  try {
    await apiCall('/orders/' + orderId, 'DELETE');
    showToast('🗑️ سفارش حذف شد');
    await loadOrders();
    switchPage('orders');
  } catch (e) {
    showToast('خطا در حذف سفارش', 'error');
  }
}

function viewOrder(orderId) {
  const o = orders.find(x => x.id === orderId);
  if (!o) return;

  const statusText = {
    pending: '⏳ در حال پردازش',
    shipped: '🚚 ارسال شده',
    delivered: '✅ تحویل داده شده',
    cancelled: '❌ لغو شده'
  }[o.status] || '⏳ در حال پردازش';

  const itemsHtml = (o.items || []).map(item => `
    <div style="display:flex; gap:10px; align-items:center; padding:10px; background:#f9f9f9; border-radius:8px; margin-bottom:8px;">
      <div style="font-size:24px;">${item.image ? `<img src="${item.image}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;">` : '📦'}</div>
      <div style="flex:1;">
        <div style="font-weight:600; font-size:13px;">${item.name}</div>
        <div style="font-size:11px; color:#777;">تعداد: ${item.quantity}</div>
      </div>
      <div style="font-size:12px; color:#004E89; font-weight:700;">
        ${Number(item.price * item.quantity).toLocaleString('fa-IR')} تومان
      </div>
    </div>
  `).join('');

  const c = o.customer || o.user || {};

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:99999; display:flex; align-items:center; justify-content:center; padding:15px;';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div style="background:white; border-radius:18px; padding:22px; max-width:480px; width:100%; max-height:88vh; overflow-y:auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
        <h3 style="font-size:17px;">📦 جزئیات سفارش</h3>
        <button onclick="this.closest('div[style*=fixed]').remove()" style="background:#f0f0f0; border:none; width:30px; height:30px; border-radius:50%; cursor:pointer; font-size:15px;">✕</button>
      </div>

      <div style="background:#f9f9f9; border-radius:10px; padding:14px; margin-bottom:15px;">
        <div style="display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid #e0e0e0; font-size:13px;">
          <span style="color:#777;">کد پیگیری:</span><strong style="direction:ltr;">${o.trackingCode || '-'}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid #e0e0e0; font-size:13px;">
          <span style="color:#777;">وضعیت:</span><strong>${statusText}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid #e0e0e0; font-size:13px;">
          <span style="color:#777;">تاریخ:</span><strong>${o.date || '-'}</strong>
        </div>
        ${o.postalTrackingCode ? `<div style="display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid #e0e0e0; font-size:13px;"><span style="color:#777;">کد پستی:</span><strong style="direction:ltr;">${o.postalTrackingCode}</strong></div>` : ''}
      </div>

      <div style="background:#e3f0fa; border-radius:10px; padding:14px; margin-bottom:15px;">
        <h4 style="font-size:13px; margin-bottom:10px; color:#004E89;">👤 اطلاعات مشتری:</h4>
        <div style="font-size:13px; line-height:1.9;">
          <div><strong>نام:</strong> ${c.name || '-'}</div>
          <div><strong>موبایل:</strong> <span style="direction:ltr;">${c.phone || '-'}</span></div>
          ${c.province ? `<div><strong>استان:</strong> ${c.province}</div>` : ''}
          ${c.city ? `<div><strong>شهر:</strong> ${c.city}</div>` : ''}
          ${c.address ? `<div><strong>آدرس:</strong> ${c.address}</div>` : ''}
          ${c.postalCode ? `<div><strong>کد پستی:</strong> <span style="direction:ltr;">${c.postalCode}</span></div>` : ''}
        </div>
      </div>

      <h4 style="font-size:13px; margin-bottom:10px;">📦 محصولات:</h4>
      ${itemsHtml || '<p style="color:#999; text-align:center;">محصولی ثبت نشده</p>'}

      <div style="margin-top:15px; padding-top:12px; border-top:2px solid #f0f0f0; display:flex; justify-content:space-between;">
        <span style="font-weight:700;">جمع کل:</span>
        <strong style="color:#27ae60; font-size:17px;">${Number(o.amount || 0).toLocaleString('fa-IR')} تومان</strong>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}
// ============================================
// 🎟️ کد تخفیف
// ============================================
function renderCoupons() {
  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title"><span class="icon">🎟️</span> کدهای تخفیف</h3>
        <button class="btn btn-primary" onclick="openCouponModal()">➕ افزودن کد</button>
      </div>
      <div id="couponsList">
        <div style="text-align:center; padding:40px; color:#999;">⏳ در حال بارگذاری...</div>
      </div>
    </div>
  `;
}

async function loadCoupons() {
  const list = document.getElementById('couponsList');
  if (!list) return;
  
  try {
    const data = await apiCall('/coupons');
    if (!data.success || !data.coupons || data.coupons.length === 0) {
      list.innerHTML = '<div style="text-align:center; padding:40px; color:#999;"><div style="font-size:50px;">🎟️</div><p style="margin-top:10px;">هنوز کد تخفیفی ساخته نشده</p></div>';
      return;
    }
    
    list.innerHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>کد</th>
              <th>نوع</th>
              <th>مقدار</th>
              <th>استفاده</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            ${data.coupons.map(c => `
              <tr>
                <td><strong style="direction:ltr; color:#FF6B35;">${c.code}</strong></td>
                <td>${c.type === 'percentage' ? 'درصدی' : 'مبلغی'}</td>
                <td>${c.type === 'percentage' ? c.value + '٪' : Number(c.value).toLocaleString('fa-IR') + ' تومان'}</td>
                <td>${c.usedCount || 0} / ${c.maxUses ? c.maxUses : '∞'}</td>
                <td>${c.isActive ? '<span class="badge badge-success">فعال</span>' : '<span class="badge badge-danger">غیرفعال</span>'}</td>
                <td>
                  <button class="btn-icon btn-delete" onclick="deleteCoupon('${c.code}')">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) {
    list.innerHTML = '<div style="text-align:center; padding:40px; color:#e74c3c;">خطا در بارگذاری</div>';
  }
}

function openCouponModal() {
  const code = prompt('کد تخفیف (مثلاً WELCOME10):');
  if (!code) return;
  
  const type = prompt('نوع کد (بنویسید: percentage یا fixed):', 'percentage');
  if (!type) return;
  
  const value = prompt(type === 'percentage' ? 'درصد تخفیف (مثلاً 10):' : 'مبلغ تخفیف (مثلاً 50000):');
  if (!value) return;
  
  const maxUses = prompt('حداکثر تعداد استفاده (خالی = نامحدود):') || null;
  const minPurchase = prompt('حداقل خرید (خالی = بدون محدودیت):') || 0;
  
  createCoupon({ 
    code: code.trim().toUpperCase(), 
    type, 
    value: Number(value), 
    maxUses: maxUses ? Number(maxUses) : null, 
    minPurchase: Number(minPurchase) 
  });
}

async function createCoupon(data) {
  try {
    const r = await apiCall('/coupons', 'POST', data);
    if (r.success) {
      showToast('✅ کد تخفیف ساخته شد');
      loadCoupons();
    } else {
      showToast(r.error || 'خطا', 'error');
    }
  } catch (e) {
    showToast('خطا در ساخت کد', 'error');
  }
}

async function deleteCoupon(code) {
  if (!confirm(`کد «${code}» حذف بشه؟`)) return;
  try {
    await apiCall('/coupons/' + code, 'DELETE');
    showToast('🗑️ حذف شد');
    loadCoupons();
  } catch (e) {
    showToast('خطا در حذف', 'error');
  }
}
// ============================================
// 🎁 جوایز
// ============================================
function renderRewards() {
  return `
    <div class="section">
      <div class="section-header">
        <h3 class="section-title"><span class="icon">🎁</span> جوایز</h3>
        <button class="btn btn-primary" onclick="openRewardModal()">➕ افزودن جایزه</button>
      </div>
      <div id="rewardsList">
        <div style="text-align:center; padding:40px; color:#999;">⏳ در حال بارگذاری...</div>
      </div>
    </div>
  `;
}

async function loadRewards() {
  const list = document.getElementById('rewardsList');
  if (!list) return;
  
  try {
    const data = await apiCall('/rewards');
    if (!data.success || !data.rewards || data.rewards.length === 0) {
      list.innerHTML = '<div style="text-align:center; padding:40px; color:#999;"><div style="font-size:50px;">🎁</div><p style="margin-top:10px;">هنوز جایزه‌ای ساخته نشده</p></div>';
      return;
    }
    
    list.innerHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>کد</th>
              <th>نوع</th>
              <th>مقدار</th>
              <th>مشتری</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            ${data.rewards.map(r => `
              <tr>
                <td><strong style="direction:ltr; color:#FF6B35;">${r.code}</strong></td>
                <td>${r.type === 'cash' ? '💰 نقدی' : r.type === 'product' ? '📦 محصول' : '🎟️ تخفیف'}</td>
                <td>${Number(r.value).toLocaleString('fa-IR')}${r.type === 'cash' ? ' تومان' : ''}</td>
                <td>${r.phone || '-'}</td>
                <td>${r.status === 'active' ? '<span class="badge badge-success">فعال</span>' : '<span class="badge badge-danger">استفاده شده</span>'}</td>
                <td>
                  <button class="btn-icon btn-delete" onclick="deleteReward(${r.id})">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) {
    list.innerHTML = '<div style="text-align:center; padding:40px; color:#e74c3c;">خطا در بارگذاری</div>';
  }
}

function openRewardModal() {
  const phone = prompt('شماره موبایل مشتری:');
  if (!phone) return;
  
  const type = prompt('نوع جایزه:\nبنویسید: cash (نقدی) یا product (محصول):', 'cash');
  if (!type) return;
  
  const value = prompt(type === 'cash' ? 'مبلغ (تومان - مثلاً 100000):' : 'ارزش محصول (تومان):');
  if (!value) return;
  
  const description = prompt('توضیحات (اختیاری):') || '';
  
  createReward({ phone, type, value: Number(value), description });
}

async function createReward(data) {
  try {
    const r = await apiCall('/rewards', 'POST', data);
    if (r.success) {
      showToast('✅ جایزه ساخته شد');
      loadRewards();
    } else {
      showToast(r.error || 'خطا', 'error');
    }
  } catch (e) {
    showToast('خطا در ساخت جایزه', 'error');
  }
}

async function deleteReward(id) {
  if (!confirm('این جایزه حذف بشه؟')) return;
  try {
    await apiCall('/rewards/' + id, 'DELETE');
    showToast('🗑️ حذف شد');
    loadRewards();
  } catch (e) {
    showToast('خطا در حذف', 'error');
  }
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
    messages: ['پیام‌ها', 'پیام‌های دریافتی'],
   coupons: ['کد تخفیف', 'مدیریت کدهای تخفیف'],
rewards: ['جوایز', 'مدیریت جوایز مشتریان']
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
    case 'coupons': content.innerHTML = renderCoupons(); setTimeout(loadCoupons, 100); break;
    case 'rewards': content.innerHTML = renderRewards(); setTimeout(loadRewards, 100); break;   
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
  compressedImageBase64 = null;
  
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

  // ============================================
  // 📸 انتخاب و فشرده‌سازی عکس
  // ============================================
  const imageInput = document.getElementById('productImage');
  if (imageInput) {
    imageInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      if (!file.type.startsWith('image/')) {
        showToast('❌ فقط فایل عکس مجاز است', 'error');
        return;
      }
      
      if (file.size > 20 * 1024 * 1024) {
        showToast('❌ حجم عکس باید کمتر از ۲۰ مگابایت باشه', 'error');
        return;
      }
      
      selectedImageFile = file;
      compressedImageBase64 = null;
      
      // نمایش پیام فشرده‌سازی
      showToast('🗜️ در حال فشرده‌سازی عکس...', 'info');
      
      try {
        const compressed = await compressImage(file, 1200, 0.75);
        
        compressedImageBase64 = compressed.base64;
        
        // نمایش پیش‌نمایش
        const img = document.getElementById('imagePreview');
        if (img) {
          img.src = compressed.base64;
          img.style.display = 'block';
        }
        const wrap = document.getElementById('imagePreviewWrapper');
        if (wrap) wrap.style.display = 'inline-block';
        
        showToast(`✅ عکس آماده شد (${compressed.originalSize.toFixed(0)} → ~${compressed.newSize.toFixed(0)} KB)`, 'success');
        
      } catch (err) {
        console.error('خطا در فشرده‌سازی:', err);
        showToast('❌ خطا در خواندن عکس', 'error');
        selectedImageFile = null;
      }
    });
  }

  // ============================================
  // 💾 ذخیره محصول
  // ============================================
  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const id = getVal('productId');
        const name = getVal('productName').trim();
        const description = getVal('productDescription').trim();
        const price = parseInt(getVal('productPrice'));
        const discountPrice = getVal('productDiscount') 
          ? parseInt(getVal('productDiscount')) 
          : null;
        const rating = parseFloat(getVal('productRating')) || 4.5;
        const category = getVal('productCategory');
        const subcategory = getVal('productSubcategory') || '';
        let image = getVal('productExistingImage') || '';

        if (!name || !price) {
          showToast('نام و قیمت الزامی است', 'error');
          return;
        }

        // ============================================
        // 📤 آپلود عکس با نمایش پیشرفت
        // ============================================
        if (compressedImageBase64) {
          // نمایش پیشرفت آپلود
          showUploadProgress(0, 'آماده‌سازی...');
          
          await new Promise(r => setTimeout(r, 200));
          showUploadProgress(20, 'خواندن عکس...');
          
          await new Promise(r => setTimeout(r, 200));
          showUploadProgress(50, 'ارسال به سرور...');
          
          try {
            const uploadResult = await apiCall('/upload', 'POST', { 
              image: compressedImageBase64 
            });
            
            showUploadProgress(90, 'پردازش...');
            
            await new Promise(r => setTimeout(r, 300));
            
            if (uploadResult.success && uploadResult.url) {
              image = uploadResult.url;
              showUploadProgress(100, '✅ آپلود شد!');
              
              await new Promise(r => setTimeout(r, 500));
              hideUploadProgress();
            } else {
              hideUploadProgress();
              throw new Error(uploadResult.error || 'خطا در آپلود');
            }
          } catch (err) {
            hideUploadProgress();
            showToast('❌ خطا در آپلود: ' + err.message, 'error');
            return;
          }
        }

        // ============================================
        // 💾 ذخیره محصول
        // ============================================
        showUploadProgress(100, '💾 ذخیره در دیتابیس...');
        
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

        try {
          if (id) {
            await apiCall('/products/' + id, 'PUT', productData);
          } else {
            await apiCall('/products', 'POST', productData);
          }
          
          hideUploadProgress();
          showSuccessAnimation(id ? 'ویرایش شد!' : 'اضافه شد!');
          
          selectedImageFile = null;
          compressedImageBase64 = null;
          
          await loadProducts();
          updateCounts();
          closeModal('productModal');
          
          setTimeout(() => {
            switchPage(currentPage);
          }, 500);
          
        } catch (err) {
          hideUploadProgress();
          showToast('❌ خطا: ' + err.message, 'error');
        }
        
      } catch (outerErr) {
        hideUploadProgress();
        showError('خطای کلی: ' + outerErr.message);
      }
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
