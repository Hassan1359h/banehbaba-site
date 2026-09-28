// ============================================
// بانه بابا - پنل مدیریت (تست ساده)
// ============================================

const API_URL = 'https://banehbaba-backend.vercel.app/api';
const adminToken = sessionStorage.getItem('banehbaba_token');
const isAdmin = sessionStorage.getItem('banehbaba_admin');

console.log('🚀 admin.js شروع شد');
console.log('Token:', adminToken);
console.log('isAdmin:', isAdmin);

// اگه لاگین نیست
if (isAdmin !== 'logged_in' || !adminToken) {
  console.log('❌ لاگین نیست، میره به admin.html');
  window.location.replace('admin.html');
}

// تست ساده
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOM لود شد');
  
  const content = document.getElementById('pageContent');
  if (!content) {
    console.error('❌ pageContent پیدا نشد!');
    return;
  }
  
  console.log('✅ pageContent پیدا شد');
  
  content.innerHTML = `
    <div style="padding: 40px; text-align: center; background: white; border-radius: 12px; margin: 20px;">
      <h1>✅ پنل کار می‌کنه!</h1>
      <p>این یه تست ساده بود.</p>
      <p>اگه این رو می‌بینی، یعنی HTML و JS درست لود میشن.</p>
      <button onclick="testAPI()" style="padding: 15px 30px; font-size: 16px; background: #FF6B35; color: white; border: none; border-radius: 8px; margin-top: 20px; cursor: pointer;">
        🔍 تست API
      </button>
      <pre id="result" style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: left; direction: ltr; overflow-x: auto;"></pre>
    </div>
  `;
});

async function testAPI() {
  const result = document.getElementById('result');
  result.textContent = 'در حال تست...';
  
  try {
    const r = await fetch(API_URL + '/products');
    const d = await r.json();
    result.textContent = JSON.stringify(d, null, 2);
  } catch (e) {
    result.textContent = 'خطا: ' + e.message;
  }
}

// منوی موبایل
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.toggle('active');
    });
  }
});
