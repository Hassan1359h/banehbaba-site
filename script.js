const API_URL = 'https://banehbaba-backend.vercel.app/api';

let products = [];
let cart = JSON.parse(localStorage.getItem('banehbaba_cart') || '[]');

function formatPrice(n) { return Number(n).toLocaleString('fa-IR') + ' تومان'; }

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast ' + type, 2500);
}

function updateCartBadge() {
  const b = document.getElementById('cartBadge');
  if (b) b.textContent = cart.reduce((s, i) => s + i.quantity, 0).toLocaleString('fa-IR');
}

function getPersianDate() {
  return new Date().toLocaleDateString('fa-IR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}
function getPersianDateShort() {
  return new Date().toLocaleDateString('fa-IR', { year:'numeric', month:'2-digit', day:'2-digit' });
}
function displayTodayDate() {
  const d = document.getElementById('todayDate');
  if (d) d.textContent = '📅 امروز: ' + getPersianDate();
}

async function loadProductsFromAPI() {
  try {
    const r = await fetch(API_URL + '/products');
    const d = await r.json();
    if (d.success) { products = d.products || []; return true; }
    return false;
  } catch (e) { console.error(e); return false; }
}

function renderProducts(filterCategory = null, subName = null) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  let list = products;
  if (filterCategory) {
    list = products.filter(p => p.category === filterCategory);
    if (subName) {
      const f = list.filter(p => p.subcategory === subName);
      if (f.length > 0) list = f;
    }
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:#999;">
        <div style="font-size:60px; margin-bottom:15px;">📦</div>
        <h3>محصولی وجود ندارد</h3>
        ${filterCategory ? '<button onclick="clearFilter()" style="margin-top:20px; padding:10px 20px; background:#FF6B35; color:white; border:none; border-radius:8px; cursor:pointer; font-family:inherit;">نمایش همه</button>' : ''}
      </div>`;
    return;
  }

  grid.innerHTML = list.map(p => {
    const hasDisc = p.discountPrice && p.discountPrice < p.price;
    const pct = hasDisc ? Math.round((1 - p.discountPrice / p.price) * 100) : 0;
    const img = p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">` : '';

    return `
      <div class="product-card" style="position:relative;">
        <div class="product-image" style="position:relative;">
          ${img}
          ${hasDisc ? `<span style="position:absolute;top:10px;left:10px;background:#e74c3c;color:white;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:700;z-index:2;">${pct}٪ تخفیف</span>` : ''}
        </div>
        <div class="product-info">
          <h3>${p.name}</h3>
          <p class="description">${p.description || ''}</p>
          <div class="product-price-row">
            <div>
              ${hasDisc 
                ? `<div style="font-size:12px;text-decoration:line-through;color:#999;">${formatPrice(p.price)}</div>
                   <div class="product-price" style="color:#27ae60;">${formatPrice(p.discountPrice)}</div>`
                : `<div class="product-price">${formatPrice(p.price)}</div>`}
            </div>
            <span class="product-rating">⭐ ${p.rating || 4.5}</span>
          </div>
          <button class="btn-add-to-cart" onclick="addToCart(${p.id})">🛒 افزودن به سبد</button>
        </div>
      </div>`;
  }).join('');
}

const categoryInfo = {
  camping: { name: 'لوازم کوهنوردی و کمپ', icon: '🏔️' },
  home: { name: 'لوازم خانگی', icon: '🏠' },
  beauty: { name: 'سلامت و زیبایی', icon: '💄' },
  car: { name: 'لوازم یدکی خودرو', icon: '🚗' }
};

function filterByCategory(catId, subName = null) {
  const cat = categoryInfo[catId];
  const h = document.querySelector('.section-header h2');
  const sh = document.querySelector('.section-header p');
  if (h && cat) h.textContent = subName ? `${subName} — ${cat.name}` : `${cat.icon} ${cat.name}`;
  if (sh && cat) sh.textContent = subName ? `محصولات زیردسته «${subName}»` : `محصولات دسته «${cat.name}»`;
  renderProducts(catId, subName);
  const s = document.getElementById('productsSection');
  if (s) s.scrollIntoView({ behavior: 'smooth' });
  document.getElementById('mainNav')?.classList.remove('active');
}

function clearFilter() {
  const h = document.querySelector('.section-header h2');
  const sh = document.querySelector('.section-header p');
  if (h) h.textContent = 'محصولات ویژه ⭐';
  if (sh) sh.textContent = 'جدیدترین و پرطرفدارترین کالاها';
  renderProducts();
  document.getElementById('productsSection')?.scrollIntoView({ behavior: 'smooth' });
}

function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const price = p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price;
  const ex = cart.find(i => i.id === id);
  if (ex) ex.quantity++;
  else cart.push({ ...p, price, quantity: 1 });
  localStorage.setItem('banehbaba_cart', JSON.stringify(cart));
  updateCartBadge();
  showToast(`✅ ${p.name} به سبد اضافه شد`);
  setTimeout(() => window.location.href = 'cart.html', 800);
}

function initMobileMenu() {
  const m = document.getElementById('menuToggle');
  const n = document.getElementById('mainNav');
  if (m && n) m.addEventListener('click', () => n.classList.toggle('active'));
  document.querySelectorAll('.category-title').forEach(t => {
    t.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) { e.preventDefault(); t.parentElement.classList.toggle('active'); }
    });
  });
}

function initCategoryFilters() {
  document.querySelectorAll('.category-title').forEach(el => {
    el.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) return;
      e.preventDefault();
      const t = el.textContent.trim();
      let c = null;
      if (t.includes('کوهنوردی') || t.includes('کمپ')) c = 'camping';
      else if (t.includes('خانگی')) c = 'home';
      else if (t.includes('زیبایی')) c = 'beauty';
      else if (t.includes('یدکی') || t.includes('خودرو')) c = 'car';
      if (c) filterByCategory(c);
    });
  });
  document.querySelectorAll('.submenu a').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const sub = el.textContent.trim();
      const pc = el.closest('.dropdown-category')?.querySelector('.category-title')?.textContent || '';
      let c = null;
      if (pc.includes('کوهنوردی') || pc.includes('کمپ')) c = 'camping';
      else if (pc.includes('خانگی')) c = 'home';
      else if (pc.includes('زیبایی')) c = 'beauty';
      else if (pc.includes('یدکی') || pc.includes('خودرو')) c = 'car';
      if (c) filterByCategory(c, sub);
      document.getElementById('mainNav')?.classList.remove('active');
    });
  });
}

function scrollToProducts() {
  document.getElementById('productsSection')?.scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadProductsFromAPI();
  renderProducts();
  updateCartBadge();
  displayTodayDate();
  initMobileMenu();
  initCategoryFilters();

  const cartBtn = document.getElementById('cartBtn');
  if (cartBtn) cartBtn.addEventListener('click', () => window.location.href = 'cart.html');

  const userBtn = document.getElementById('userBtn');
  if (userBtn) {
    const token = localStorage.getItem('banehbaba_token');
    const user = JSON.parse(localStorage.getItem('banehbaba_user') || 'null');
    if (token && user) {
      userBtn.addEventListener('click', () => window.location.href = 'user-account.html');
      const rt = userBtn.querySelector('.register-text');
      if (rt) rt.textContent = user.name.split(' ')[0];
    } else {
      userBtn.addEventListener('click', () => window.location.href = 'user-login.html');
    }
  }
});
