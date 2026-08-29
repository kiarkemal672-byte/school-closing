'use strict';

/* =========================================================
   نظام الاختتام الصيفي — الدخول والجلسات والحسابات
   الملف رقم (5) من (12) : js/auth.js
   ---------------------------------------------------------
   المحتويات:
     1) الجلسة الدائمة: تُحفظ في localStorage وتُستعاد تلقائياً
        عند فتح التطبيق — لا تُطلب كلمة المرور مجدداً إلا بعد
        الضغط على زر (خروج) الذي يمسح الجلسة نهائياً.
     2) تسجيل الدخول: التحقق من اسم المستخدم وكلمة المرور.
     3) الخروج: مع نافذة تأكيد ثم مسح الجلسة.
     4) تغيير كلمة المرور الخاصة بالحساب الحالي (نافذة منبثقة).
     5) ربط واجهة شاشة الدخول بالمنطق.
   ---------------------------------------------------------
   أحداث تُبَث للنظام:
     • 'sc:authchange' : عند الدخول أو الخروج
       (app.js يسمعها لتبديل الشاشات وتحديث الشريط العلوي)
   ========================================================= */

const Auth = (() => {

  const SESSION_KEY = 'sc_session';   // مفتاح الجلسة في localStorage

  let sessionUserId = null;           // معرّف الحساب المسجل دخوله
  let loginAt = null;                 // وقت الدخول (لطابع زمني فقط)

  /* =============================================================
     أدوات داخلية
     ============================================================= */

  /* إخبار بقية النظام بتغيير حالة الدخول */
  function dispatch() {
    window.dispatchEvent(new CustomEvent('sc:authchange', {
      detail: { user: getUser() }
    }));
  }

  /* حفظ الجلسة في التخزين المحلي (تدوم للأبد حتى الخروج) */
  function saveSession() {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        userId: sessionUserId,
        loginAt: loginAt
      }));
    } catch (e) {
      /* وضع التصفح الخاص: الجلسة تعمل بالذاكرة فقط لهذه الزيارة */
      console.warn('[Auth] لا يمكن حفظ الجلسة محلياً:', e);
    }
  }

  /* مسح الجلسة نهائياً (زر الخروج فقط يستدعي هذا) */
  function clearSession() {
    sessionUserId = null;
    loginAt = null;
    try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* تجاهل */ }
  }

  /* استعادة الجلسة المحفوظة عند فتح التطبيق */
  function restoreSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);

      /* التحقق أن الحساب ما زال موجوداً (قد يحذفه المشرف) */
      if (parsed && parsed.userId && DB.findAccount(parsed.userId)) {
        sessionUserId = parsed.userId;
        loginAt = parsed.loginAt || null;
      } else {
        /* حساب محذوف أو بيانات فاسدة → مسح الجلسة */
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {
      clearSession();
    }
  }

  /* =============================================================
     تسجيل الدخول
     ============================================================= */
  function login(username, password) {
    const acc = DB.findAccountByUsername(username);

    /* تحقق من الحساب وكلمة المرور */
    if (!acc || acc.password !== String(password)) {
      return { ok: false, error: 'login_error' };
    }

    /* نجاح → إنشاء جلسة دائمة */
    sessionUserId = acc.id;
    loginAt = Date.now();
    saveSession();
    dispatch();

    return { ok: true, user: acc };
  }

  /* =============================================================
     الخروج — نهائي حتى الدخول مجدداً بكلمة المرور
     ============================================================= */
  function logout() {
    clearSession();
    dispatch();
    return true;
  }

  /* =============================================================
     المستخدم الحالي
     ---------------------------------------------------------
     تُستعاد نسخة حية من قاعدة البيانات في كل استدعاء —
     حتى تنعكس فوراً أي تعديلات (تغيير الاسم/الدور) من المشرف.
     ============================================================= */
  function getUser() {
    if (!sessionUserId) return null;
    const acc = DB.findAccount(sessionUserId);
    if (!acc) return null;          // الحساب حُذف → يُعد خارجاً
    return { ...acc };              // نسخة آمنة من التعديل العرضي
  }

  function isLoggedIn() {
    return !!getUser();
  }

  function isAdmin() {
    const u = getUser();
    return !!u && u.role === 'admin';
  }

  /* =============================================================
     تغيير كلمة المرور الخاصة بالحساب الحالي
     ============================================================= */
  function changePassword(currentPw, newPw, confirmPw) {
    const user = getUser();
    if (!user) return { ok: false, error: 'error_generic' };

    /* 1) كلمة المرور الحالية صحيحة؟ */
    if (user.password !== String(currentPw)) {
      return { ok: false, error: 'wrong_current_password' };
    }
    /* 2) الطول الأدنى */
    if (String(newPw).length < 4) {
      return { ok: false, error: 'password_too_short' };
    }
    /* 3) التطابق */
    if (String(newPw) !== String(confirmPw)) {
      return { ok: false, error: 'password_mismatch' };
    }

    DB.updateAccount(user.id, { password: String(newPw) });
    return { ok: true };
  }

  /* =============================================================
     ربط الواجهة — يستدعيه app.js بعد تحميل كل الوحدات
     ============================================================= */
  function initUI() {

    /* ---------- نموذج الدخول ---------- */
    const form       = document.getElementById('loginForm');
    const userInput  = document.getElementById('loginUsername');
    const passInput  = document.getElementById('loginPassword');
    const errEl      = document.getElementById('loginError');

    function showError(key) {
      if (!errEl) return;
      errEl.textContent = I18n.t(key);
      errEl.classList.remove('hidden');
      /* إعادة تشغيل حركة الاهتزاز */
      errEl.style.animation = 'none';
      void errEl.offsetWidth;         // إعادة تدفق
      errEl.style.animation = '';
    }
    function hideError() {
      if (errEl) errEl.classList.add('hidden');
    }

    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        hideError();

        const u = (userInput.value || '').trim();
        const p = passInput.value || '';

        if (!u || !p) {
          showError('login_error');
          return;
        }

        const res = login(u, p);

        if (res.ok) {
          /* تفريغ الحقول وتوليد رسالة ترحيب */
          userInput.value = '';
          passInput.value = '';

          if (typeof UI !== 'undefined' && UI.toast) {
            UI.toast(
              I18n.t('login_success', { name: DB.accountName(res.user) }),
              'success'
            );
          }
          /* app.js يسمع الحدث sc:authchange ويفتح الشاشة الرئيسية */
        } else {
          showError(res.error);
          passInput.select();
        }
      });
    }

    /* ---------- زر الخروج (الوحيد الذي ينهي الجلسة) ---------- */
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        /* نافذة تأكيد قبل الخروج */
        let confirmed = true;
        if (typeof UI !== 'undefined' && UI.confirm) {
          confirmed = await UI.confirm(I18n.t('logout_confirm'));
        }
        if (confirmed) {
          logout();
          if (typeof UI !== 'undefined' && UI.toast) {
            UI.toast(I18n.t('logout_success'), 'info');
          }
        }
      });
    }

    /* ---------- زر تغيير كلمة المرور 🔑 ---------- */
    const myPassBtn = document.getElementById('myPasswordBtn');
    if (myPassBtn) {
      myPassBtn.addEventListener('click', openChangePasswordModal);
    }

    /* ---------- تركيز تلقائي على حقل الدخول عند ظهور الشاشة ---------- */
    window.addEventListener('sc:authchange', () => {
      if (!isLoggedIn()) {
        setTimeout(() => {
          const el = document.getElementById('loginUsername');
          if (el) el.focus();
        }, 60);
      }
    });
  }

  /* =============================================================
     نافذة تغيير كلمة المرور (تستخدم UI.modal من الملف 6)
     ============================================================= */
  function openChangePasswordModal() {
    if (typeof UI === 'undefined' || !UI.modal) return;

    const m = UI.modal({
      title: '🔑 ' + I18n.t('change_my_password'),
      body: `
        <div class="field">
          <label for="cpCurrent">${I18n.t('current_password')}</label>
          <input type="password" id="cpCurrent" autocomplete="current-password">
        </div>
        <div class="field">
          <label for="cpNew">${I18n.t('new_password')}</label>
          <input type="password" id="cpNew" autocomplete="new-password">
          <p class="hint">${I18n.t('password_too_short')}</p>
        </div>
        <div class="field">
          <label for="cpConfirm">${I18n.t('confirm_password')}</label>
          <input type="password" id="cpConfirm" autocomplete="new-password">
        </div>
        <p class="login-error hidden" id="cpError" role="alert"></p>
      `,
      footer: `
        <button type="button" class="btn btn-ghost" data-close>${I18n.t('cancel')}</button>
        <button type="button" class="btn btn-primary" id="cpSave">${I18n.t('save')}</button>
      `,
      onMount(el) {
        el.querySelector('#cpCurrent').focus();

        el.querySelector('#cpSave').addEventListener('click', () => {
          const cur = el.querySelector('#cpCurrent').value;
          const nw  = el.querySelector('#cpNew').value;
          const cf  = el.querySelector('#cpConfirm').value;

          const res = changePassword(cur, nw, cf);
          const errEl = el.querySelector('#cpError');

          if (res.ok) {
            m.close();
            UI.toast(I18n.t('password_changed'), 'success');
          } else {
            errEl.textContent = I18n.t(res.error);
            errEl.classList.remove('hidden');
            /* إعادة تشغيل حركة الاهتزاز */
            errEl.style.animation = 'none';
            void errEl.offsetWidth;
            errEl.style.animation = '';
          }
        });

        /* Enter داخل الحقول = حفظ */
        ['cpCurrent', 'cpNew', 'cpConfirm'].forEach(id => {
          el.querySelector('#' + id).addEventListener('keydown', e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              el.querySelector('#cpSave').click();
            }
          });
        });
      }
    });
  }

  /* =============================================================
     التشغيل: استعادة الجلسة فوراً عند تحميل الملف
     (قبل app.js — فيقرر التطبيق الشاشة الافتتاحية)
     ============================================================= */
  restoreSession();

  /* ---------- الواجهة العامة للوحدة ---------- */
  return {
    login,
    logout,
    getUser,
    isLoggedIn,
    isAdmin,
    changePassword,
    initUI
  };
})();
