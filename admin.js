// ============================================
// بانه بابا - پنل مدیریت
// نسخه اصلاح شده
// ============================================

const API_URL = 'https://banehbaba-backend.vercel.app/api';

const adminToken = sessionStorage.getItem('banehbaba_token');
const isAdmin = sessionStorage.getItem('banehbaba_admin');

console.log('🚀 admin.js شروع شد');
console.log('Token:', adminToken ? 'وجود دارد' : 'وجود ندارد');
console.log('isAdmin:', isAdmin);

// ============================================
// جلوگیری از Redirect Loop
// ============================================

if (isAdmin !== 'logged_in' || !adminToken) {
    console.warn('⚠️ اطلاعات ورود ادمین در sessionStorage وجود ندارد');

    document.addEventListener('DOMContentLoaded', () => {
        const content = document.getElementById('pageContent');

        if (content) {
            content.innerHTML = `
                <div style="
                    padding:40px;
                    margin:20px;
                    background:#fff;
                    border-radius:16px;
                    text-align:center;
                    box-shadow:0 4px 20px rgba(0,0,0,.08);
                ">
                    <div style="font-size:50px;margin-bottom:15px;">🔐</div>

                    <h2 style="margin-bottom:10px;">
                        ورود به پنل مدیریت
                    </h2>

                    <p style="color:#666;">
                        برای استفاده از پنل مدیریت ابتدا باید وارد حساب مدیریت شوید.
                    </p>

                    <p style="
                        margin-top:20px;
                        padding:12px;
                        background:#fff3cd;
                        border-radius:8px;
                        color:#856404;
                    ">
                        ⚠️ نشست ورود ادمین پیدا نشد.
                    </p>
                </div>
            `;
        }
    });

} else {

    console.log('✅ ادمین وارد شده است');

    // ============================================
    // نمایش داشبورد
    // ============================================

    document.addEventListener('DOMContentLoaded', () => {

        console.log('✅ DOM لود شد');

        const content = document.getElementById('pageContent');

        if (!content) {
            console.error('❌ pageContent پیدا نشد!');
            return;
        }

        console.log('✅ pageContent پیدا شد');

        content.innerHTML = `
            <div style="
                padding:40px;
                text-align:center;
                background:white;
                border-radius:16px;
                margin:20px;
                box-shadow:0 4px 20px rgba(0,0,0,.08);
            ">

                <div style="font-size:60px;margin-bottom:15px;">
                    🏪
                </div>

                <h1>
                    ✅ پنل مدیریت بانه بابا فعال است
                </h1>

                <p style="color:#666;margin-top:15px;">
                    ارتباط HTML و JavaScript برقرار است.
                </p>

                <button
                    onclick="testAPI()"
                    style="
                        padding:15px 30px;
                        font-size:16px;
                        background:#FF6B35;
                        color:white;
                        border:none;
                        border-radius:8px;
                        margin-top:20px;
                        cursor:pointer;
                    "
                >
                    🔍 تست API
                </button>

                <pre
                    id="result"
                    style="
                        background:#f5f5f5;
                        padding:15px;
                        border-radius:8px;
                        margin-top:20px;
                        text-align:left;
                        direction:ltr;
                        overflow-x:auto;
                        white-space:pre-wrap;
                    "
                ></pre>

            </div>
        `;

    });

}

// ============================================
// تست API
// ============================================

async function testAPI() {

    const result = document.getElementById('result');

    if (!result) return;

    result.textContent = 'در حال تست ارتباط با API...';

    try {

        const r = await fetch(API_URL + '/products');

        if (!r.ok) {
            throw new Error(
                'HTTP ' + r.status + ' - ' + r.statusText
            );
        }

        const d = await r.json();

        result.textContent =
            JSON.stringify(d, null, 2);

    } catch (e) {

        console.error('API Error:', e);

        result.textContent =
            'خطا در ارتباط با API:\n' + e.message;
    }
}

// ============================================
// منوی موبایل
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    const menuToggle =
        document.getElementById('menuToggle');

    const sidebar =
        document.getElementById('sidebar');

    if (menuToggle && sidebar) {

        menuToggle.addEventListener('click', () => {

            sidebar.classList.toggle('active');

        });

    }

});

// ============================================
// خروج
// ============================================

function logout() {

    sessionStorage.removeItem('banehbaba_token');
    sessionStorage.removeItem('banehbaba_admin');

    window.location.reload();

}
