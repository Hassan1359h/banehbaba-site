const API_URL = 'https://banehbaba-backend.vercel.app/api';

let products = [];
let cart = JSON.parse(localStorage.getItem('banehbaba_cart') || '[]');

const categoryInfo = {
  camping: { name: 'کوهنوردی و کمپ', icon: '🏕️' },
  home: { name: 'لوازم خانگی', icon: '🏠' },
  beauty: { name: 'سلامت و زیبایی', icon: '💄' },
  car: { name: 'لوازم یدکی خودرو', icon: '🚗' }
};

function formatPrice(n) {
  return Number(n).toLocaleString('fa-IR') + ' تومان';
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;

  t.textContent = msg;
  t.className = 'toast show ' + type;

  setTimeout(() => {
    t.className = 'toast ' + type;
  }, 2500);
}

function updateCartBadge() {
  const b = document.getElementById('cartBadge');
  if (b) {
    b.textContent = cart
      .reduce((s, i) => s + i.quantity, 0)
      .toLocaleString('fa-IR');
  }
}

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

function displayTodayDate() {
  const d = document.getElementById('todayDate');
  if (d) d.textContent = '📅 امروز: ' + getPersianDate();
}

async function loadProductsFromAPI() {
  try {
    const r = await fetch(API_URL + '/products');
    if (!r.ok) throw new Error('خطا در دریافت محصولات');

    const d = await r.json();

    if (d.success) {
      products = d.products || [];
      return true;
    }

    return false;
  } catch (e) {
    console.error(e);
    showToast('خطا در بارگذاری محصولات', 'error');
    return false;
  }
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function renderProducts(filterCategory = null, subName = null) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  let list = products;

  if (filterCategory) {
    list = products.filter(p => p.category === filterCategory);

    if (subName) {
      list = list.filter(p => p.subcategory === subName);
    }
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#999;">
        <div style="font-size:60px;margin-bottom:15px;">📦</div>
        <h3>محصولی وجود ندارد</h3>
        ${filterCategory ? `
          <button onclick="clearFilter()"
            style="margin-top:20px;padding:10px 20px;background:#FF6B35;color:white;border:none;border-radius:8px;cursor:pointer;font-family:inherit;">
            نمایش همه
          </button>
        ` : ''}
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(p => {
    const price = Number(p.price) || 0;
    const discountPrice = Number(p.discountPrice) || 0;
    const hasDisc = discountPrice > 0 && discountPrice < price;
    const pct = hasDisc
      ? Math.round((1 - discountPrice / price) * 100)
      : 0;

    const img = p.image
      ? `<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}"
           style="width:100%;height:100%;object-fit:cover;">`
      : '';

    return `
      <div class="product-card" style="position:relative;">
        <div class="product-image" style="position:relative;">
          ${img}
          ${hasDisc ? `
            <span style="position:absolute;top:10px;left:10px;background:#e74c3c;color:white;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:700;z-index:2;">
              ${pct}٪ تخفیف
            </span>
          ` : ''}
        </div>

        <div class="product-info">
          <h3>${escapeHTML(p.name)}</h3>
          <p class="description">${escapeHTML(p.description || '')}</p>

          <div class="product-price-row">
            <div>
              ${hasDisc
                ? `
                  <div style="font-size:12px;text-decoration:line-through;color:#999;">
                    ${formatPrice(price)}
                  </div>
                  <div class="product-price" style="color:#27ae60;">
                    ${formatPrice(discountPrice)}
                  </div>
                `
                : `<div class="product-price">${formatPrice(price)}</div>`
              }
            </div>

            <span class="product-rating">
              ⭐ ${escapeHTML(p.rating ?? 4.5)}
            </span>
          </div>

          <button class="btn-add-to-cart"
                  data-product-id="${escapeHTML(p.id)}">
            🛒 افزودن به سبد
          </button>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.btn-add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      addToCart(btn.dataset.productId);
    });
  });
}

function updateActiveCategory(catId = null) {
  document.querySelectorAll('#categoryCircles .category-circle')
    .forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === catId);
    });

  const showAll = document.getElementById('showAllCategories');
  if (showAll) showAll.hidden = !catId;
}

function filterByCategory(catId, subName = null) {
  const cat = categoryInfo[catId];
  if (!cat) return;

  const h = document.getElementById('productsTitle');
  const sh = document.getElementById('productsSubtitle');

  if (h) {
    h.textContent = subName
      ? `${subName} — ${cat.name}`
      : `${cat.icon} ${cat.name}`;
  }

  if (sh) {
    sh.textContent = subName
      ? `محصولات زیردسته «${subName}»`
      : `تمام محصولات دسته «${cat.name}»`;
  }

  updateActiveCategory(catId);
  renderProducts(catId, subName);

  document.getElementById('productsSection')
    ?.scrollIntoView({ behavior: 'smooth' });

  document.getElementById('mainNav')
    ?.classList.remove('active');
}

function clearFilter() {
  const h = document.getElementById('productsTitle');
  const sh = document.getElementById('productsSubtitle');

  if (h) h.textContent = 'محصولات ویژه ⭐';
  if (sh) sh.textContent = 'جدیدترین و پرطرفدارترین کالاها';

  updateActiveCategory();
  renderProducts();

  document.getElementById('productsSection')
    ?.scrollIntoView({ behavior: 'smooth' });
}

function addToCart(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;

  const originalPrice = Number(p.price) || 0;
  const discounted = Number(p.discountPrice) || 0;

  const price = discounted > 0 && discounted < originalPrice
    ? discounted
    : originalPrice;

  const ex = cart.find(i => String(i.id) === String(id));

  if (ex) {
    ex.quantity++;
  } else {
    cart.push({ ...p, price, quantity: 1 });
  }

  localStorage.setItem('banehbaba_cart', JSON.stringify(cart));

  updateCartBadge();
  showToast(`✅ ${p.name} به سبد اضافه شد`);

  setTimeout(() => {
    window.location.href = 'cart.html';
  }, 800);
}

function initMobileMenu() {
  const m = document.getElementById('menuToggle');
  const n = document.getElementById('mainNav');

  if (m && n) {
    m.addEventListener('click', () => {
      n.classList.toggle('active');
    });
  }
}

function initCategoryFilters() {
  const container = document.getElementById('categoryCircles');

  if (container) {
    container.addEventListener('click', e => {
      const btn = e.target.closest('.category-circle');
      if (!btn || !container.contains(btn)) return;

      filterByCategory(btn.dataset.category);
    });
  }

  const showAll = document.getElementById('showAllCategories');

  if (showAll) {
    showAll.addEventListener('click', clearFilter);
  }
}

function scrollToProducts() {
  document.getElementById('productsSection')
    ?.scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadProductsFromAPI();

  renderProducts();
  updateCartBadge();
  displayTodayDate();
  initMobileMenu();
  initCategoryFilters();

  const cartBtn = document.getElementById('cartBtn');

  if (cartBtn) {
    cartBtn.addEventListener('click', () => {
      window.location.href = 'cart.html';
    });
  }

  const userBtn =
    document.getElementById('registerBtn') ||
    document.getElementById('userBtn');

  if (userBtn) {
    const token = localStorage.getItem('banehbaba_token');

    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('banehbaba_user') || 'null');
    } catch (e) {
      user = null;
    }

    if (token && user) {
      userBtn.addEventListener('click', () => {
        window.location.href = 'user-account.html';
      });

      const rt = userBtn.querySelector('.register-text');
      if (rt && user.name) {
        rt.textContent = user.name.split(' ')[0];
      }
    } else {
      userBtn.addEventListener('click', () => {
        window.location.href = 'user-login.html';
      });
    }
  }
});
