/* ============================================
   بانه بابا - پنل مدیریت (نسخه کامل)
   اتصال به Backend API + آپلود تصویر
   ============================================ */

// ============================================
// 🔐 بررسی لاگین
// ============================================
const isAdmin = sessionStorage.getItem('banehbaba_admin');
const adminToken = sessionStorage.getItem('banehbaba_token');

if (isAdmin !== 'logged_in' || !adminToken) {
  window.location.href = 'admin.html';
}

// ============================================
// 🌐 آدرس API
// ============================================
const API_URL = 'https://banehbaba-backend.vercel.app/api';

// ============================================
// 💾 State
// ============================================
let products = [];
let categories = [];
let orders = [];
let messages = [];
let customers = [];
let currentPage = 'dashboard';
let searchTerm = '';

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
function showLoading(show = true) {
  const el = document.getElementById('loadingOverlay');
  if (el) el.classList.toggle('active', show);
}
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function logout() {
  if (confirm('از پنل خارج می‌شید؟')) {
    sessionStorage.removeItem('banehbaba_admin');
    sessionStorage.removeItem('banehbaba_token');
    window.location.href = 'admin.html';
  }
}

// ============================================
// 🔌 API Helper
// ============================================
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (adminToken) {
    headers['Authorization'] = 'Bearer ' + adminToken;
  }
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  try {
    const response = await fetch(API_URL + endpoint, options);
    const data = await response.json();
    
    if (response.status === 401) {
      showToast('❌ دسترسی منقضی شده. لطفاً دوباره وارد شوید', 'error');
      setTimeout(() => {
        sessionStorage.clear();
        window.location.href = 'admin.html';
      }, 2000);
      throw new Error('Unauthorized');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============================================
// 📥 بارگذاری داده‌ها
// ============================================
async function loadProducts() {
  try {
    const data = await apiCall('/products');
    if (data.success) {
      products = data.products || [];
      updateCounts();
    }
  } catch (e) {
    console.error('خطا در بارگذاری محصولات:', e);
    showToast('خطا در بارگذاری محصولات', 'error');
  }
}

async function loadCategories() {
  try {
    const data = await apiCall('/categories');
    if (data.success) {
      categories = data.categories || [];
      
      // اگه دسته‌ای نیست، پیش‌فرض بساز
      if (categories.length === 0) {
        const defaults = [
          { id: 'camping', name: 'لوازم کوهنوردی و کمپ', icon: '🏔️', subs: ['عینک', 'چادر کوهنوردی', 'کیسه خواب', 'چراغ پیشانی', 'باتوم', 'اجاق کمپ', 'ابزار کوه', 'شکار'] },
          { id: 'home', name: 'لوازم خانگی', icon: '🏠', subs: ['تلویزیون', 'لباسشویی', 'ظرفشویی', 'کولر گازی', 'سرخ کن', 'اتو بخار', 'آبمیوه گیری'] },
          { id: 'beauty', name: 'سلامت و زیبایی', icon: '💄', subs: ['سفید کننده دندان', 'لمینت دندان', 'پوست', 'مو'] },
          { id: 'car', name: 'لوازم یدکی خودرو', icon: '🚗', subs: ['لنت'] }
        ];
        for (const cat of defaults) {
          try {
            await apiCall('/categories', 'POST', cat);
          } catch (e) { /* silent */ }
        }
        categories = defaults;
      }
    }
  } catch (e) {
    console.error('خطا در بارگذاری دسته‌ها:', e);
  }
}

async function loadOrders() {
  try {
    const data = await apiCall('/orders');
    if (data.success) {
      orders = data.orders || [];
      updateCounts();
    }
  } catch (e) { /* silent */ }
}

async function loadMessages() {
  try {
    const data = await apiCall('/messages');
    if (data.success) {
      messages = data.messages || [];
      updateCounts();
    }
  } catch (e) { /* silent */ }
}

async function loadCustomers() {
  try {
    const data = await apiCall('/users');
    if (data.success) {
      customers = data.users || [];
    }
  } catch (e) { /* silent */ }
}

async function loadAll() {
  showLoading(true);
  await Promise.all([
    loadProducts(),
    loadCategories(),
    loadOrders(),
    loadMessages(),
    loadCustomers()
  ]);
  showLoading(false);
}

// ============================================
// 📊 داشبورد
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
        <h3 class="section-title"><span class="icon">📦</span> آخرین محصولات</h3>
        <button class="btn btn-primary btn-sm" onclick="openProductModal()">➕ افزودن محصول</button>
      </div>
      ${products.length === 0
        ? `<div class="empty-state"><div class="icon">📦</div><h3>هنوز محصولی اضافه نکردید</h3><p>روی «افزودن محصول» بزنید</p></div>`
        : `<div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>تصویر</th>
                  <th>نام</th>
                  <th>قیمت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                ${products.slice(0, 5).map(p => `
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
                  <th>قیمت</th>
                  <th>تخفیف</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(p => {
                  let discountBadge = '-';
                  if (p.discountPrice && p.discountPrice < p.price) {
                    const percent = Math.round((1 - p.discountPrice / p.price) * 100);
                    discountBadge = `<span class="badge badge-success">${formatNumber(percent)}٪ تخفیف</span>`;
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
                      <td>${discountBadge}</td>
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

function setSearch(value) {
  searchTerm = value;
  document.getElementById('pageContent').innerHTML = renderProducts();
}

function openProductModal(productId = null) {
  const form = document.getElementById('productForm');
  form.reset();
  document.getElementById('productId').value = '';
  document.getElementById('productExistingImage').value = '';
  document.getElementById('imagePreviewWrapper').style.display = 'none';

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
    showToast('🗑️ محصول حذف شد');
    await loadProducts();
    switchPage(currentPage);
  } catch (e) {
    showToast('خطا در حذف محصول', 'error');
  }
  showLoading(false);
}

function removeImage() {
  document.getElementById('productImage').value = '';
  document.getElementById('imagePreview').src = '';
  document.getElementById('imagePreviewWrapper').style.display = 'none';
  document.getElementById('productExistingImage').value = '';
}

// آپلود تصویر
document.addEventListener('DOMContentLoaded', () => {
  const imageInput = document.getElementById('productImage');
  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // چک حجم (حداکثر ۵ مگابایت)
      if (file.size > 5 * 1024 * 1024) {
        showToast('❌ حجم عکس باید کمتر از ۵ مگابایت باشه', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        document.getElementById('imagePreview').src = ev.target.result;
        document.getElementById('imagePreviewWrapper').style.display = 'inline-block';
      };
      reader.readAsDataURL(file);
    });
  }
});

// فرم محصول
document.addEventListener('DOMContentLoaded', () => {
  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('productId').value;
      const name = document.getElementById('productName').value.trim();
      const description = document.getElementById('productDescription').value.trim();
      const price = parseInt(document.getElementById('productPrice').value);
      const discountPrice = document.getElementById('productDiscount').value 
        ? parseInt(document.getElementById('productDiscount').value) 
        : null;
      const rating = parseFloat(document.getElementById('productRating').value) || 4.5;
      const category = document.getElementById('productCategory').value;
      let image = document.getElementById('productExistingImage').value;

      if (!name || !price) {
        showToast('❌ نام و قیمت الزامی است', 'error');
        return;
      }

      if (discountPrice && discountPrice >= price) {
        showToast('❌ قیمت تخفیف باید کمتر از قیمت اصلی باشه', 'error');
        return;
      }

      // اگه عکس جدید انتخاب شده، آپلود کن
      const imageFile = document.getElementById('productImage').files[0];
      if (imageFile) {
        showLoading(true);
        try {
          const reader = new FileReader();
          const base64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
          });

          const uploadResult = await apiCall('/upload', 'POST', { image: base64 });
          if (uploadResult.success) {
            image = uploadResult.url;
          } else {
            throw new Error(uploadResult.error || 'خطا در آپلود');
          }
        } catch (err) {
          showLoading(false);
          showToast('❌ خطا در آپلود عکس: ' + err.message, 'error');
          return;
        }
      }

      const productData = {
        name,
        description,
        price,
        discountPrice,
        rating,
        category,
        image,
        emoji: '📦'
      };

      showLoading(true);
      try {
        if (id) {
          await apiCall('/products/' + id, 'PUT', productData);
          showToast('✅ محصول ویرایش شد');
        } else {
          await apiCall('/products', 'POST', productData);
          showToast('✅ محصول اضافه شد');
        }

        await loadProducts();
        closeModal('productModal');
        switchPage(currentPage);
      } catch (err) {
        showToast('❌ خطا: ' + err.message, 'error');
      }
      showLoading(false);
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
                <h4>${cat.icon || '📂'} ${cat.name}</h4>
                <div>
                  <button class="btn-icon btn-edit" onclick="editCategory('${cat.id}')">✏️</button>
                  <button class="btn-icon btn-delete" onclick="deleteCategory('${cat.id}')">🗑️</button>
                </div>
              </div>
              <p style="font-size: 12px; color: var(--text-light); margin-bottom: 12px;">
                ${formatNumber(count)} محصول • ${(cat.subs || []).length} زیردسته
              </p>
              <div class="category-subs">
                ${(cat.subs || []).map(s => `<span class="badge badge-info">${s}</span>`).join('')}
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
      document.getElementById('categoryIcon').value = c.icon || '📂';
      document.getElementById('categorySubs').value = (c.subs || []).join('، ');
    }
  } else {
    document.getElementById('categoryModalTitle').textContent = 'افزودن دسته‌بندی';
  }

  openModal('categoryModal');
}

function editCategory(id) { openCategoryModal(id); }

async function deleteCategory(id) {
  const c = categories.find(x => x.id === id);
  if (!c) return;
  if (!confirm(`دسته «${c.name}» حذف بشه؟`)) return;

  showLoading(true);
  try {
    await apiCall('/categories/' + id, 'DELETE');
    showToast('🗑️ دسته‌بندی حذف شد');
    await loadCategories();
    switchPage('categories');
  } catch (e) {
    showToast('خطا در حذف دسته', 'error');
  }
  showLoading(false);
}

// فرم دسته‌بندی
document.addEventListener('DOMContentLoaded', () => {
  const categoryForm = document.getElementById('categoryForm');
  if (categoryForm) {
    categoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('categoryId').value;
      const name = document.getElementById('categoryName').value.trim();
      const icon = document.getElementById('categoryIcon').value.trim() || '📂';
      const subsText = document.getElementById('categorySubs').value.trim();
      const subs = subsText ? subsText.split(/[,،]/).map(s => s.trim()).filter(s => s) : [];

      if (!name) { showToast('❌ نام دسته الزامی است', 'error'); return; }

      showLoading(true);
      try {
        if (id) {
          await apiCall('/categories/' + id, 'PUT', { name, icon, subs });
          showToast('✅ دسته ویرایش شد');
        } else {
          await apiCall('/categories', 'POST', { name, icon, subs });
          showToast('✅ دسته اضافه شد');
        }

        await loadCategories();
        closeModal('categoryModal');
        switchPage('categories');
      } catch (err) {
        showToast('خطا: ' + err.message, 'error');
      }
      showLoading(false);
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

async function deleteOrder(orderId) {
  if (!confirm('این سفارش حذف بشه؟')) return;
  showLoading(true);
  try {
    await apiCall('/orders/' + orderId, 'DELETE');
    showToast('🗑️ سفارش حذف شد');
    await loadOrders();
    switchPage('orders');
  } catch (e) {
    showToast('خطا در حذف سفارش', 'error');
  }
  showLoading(false);
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
                    <td>${c.registeredAt ? new Date(c.registeredAt).toLocaleDateString('fa-IR') : '-'}</td>
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

async function deleteMessage(id) {
  if (!confirm('این پیام حذف بشه؟')) return;
  showLoading(true);
  try {
    await apiCall('/messages/' + id, 'DELETE');
    showToast('🗑️ پیام حذف شد');
    await loadMessages();
    switchPage('messages');
  } catch (e) {
    showToast('خطا در حذف پیام', 'error');
  }
  showLoading(false);
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
    messages: ['پیام‌ها', 'پیام‌های دریافتی']
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
  const pc = document.getElementById('productsCount');
  const oc = document.getElementById('ordersCount');
  const mc = document.getElementById('messagesCount');
  if (pc) pc.textContent = formatNumber(products.length);
  if (oc) oc.textContent = formatNumber(orders.length);
  if (mc) mc.textContent = formatNumber(messages.length);
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
document.addEventListener('DOMContentLoaded', async () => {
  await loadAll();
  switchPage('dashboard');
  showToast('👋 خوش آمدید', 'info');
});
