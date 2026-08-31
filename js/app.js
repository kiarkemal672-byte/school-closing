'use strict';

/* =========================================================
   نظام الاختتام الصيفي — قلب التشغيل
   الملف رقم (11) من (12) : js/app.js
   ---------------------------------------------------------
   المحتويات:
     1) إدارة الشاشات: الجلسة محفوظة → التطبيق مباشرة
        (بلا طلب كلمة مرور) | لا جلسة → شاشة الدخول
     2) التبويبات الثلاثة (+ تبويب المشرف للمشرف فقط)
     3) التنقل بالسحب يميناً/يساراً (يتكيف مع اتجاه اللغة)
     4) تحديث الشريط العلوي (الاسم، الدور، زر زيادة الحساب)
     5) ربط تبديل اللغة (القائمة + أزرار شاشة الدخول)
     6) تثبيت PWA: beforeinstallprompt + إرشادات iOS
     7) تسجيل Service Worker (ملف sw.js من الملف 12)
     8) دعم الطباعة للتبويب النشط (Ctrl+P)
   ========================================================= */

const App = (() => {

  const esc = UI.esc;

  /* ترتيب التبويبات (admin يظهر للمشرف فقط) */
  const TAB_ORDER = ['adults', 'kids', 'ceremony', 'admin'];
  let currentTab = 'adults';

  /* =============================================================
     مفاتيح ترجمة إضافية (تُدمج في القاموس — لا تلمس i18n.js)
     ============================================================= */
  (function extendI18n() {
    const extra = {
      ar: {
        install_ios_title: '📥 تثبيت التطبيق على iPhone/iPad',
        install_ios_1: 'افتح هذه الصفحة في متصفح Safari',
        install_ios_2: 'اضغط زر المشاركة',
        install_ios_3: 'اختر «إضافة إلى الشاشة الرئيسية»',
        install_ios_4: 'اضغط «إضافة» — سيعمل التطبيق بدون إنترنت',
        welcome_back: 'أهلاً بعودتك {name} 👋'
      },
      am: {
        install_ios_title: '📥 መተግበሪያውን በiPhone/iPad ላይ ጫን',
        install_ios_1: 'ይህን ገጽ በSafari ውስጥ ይክፈቱ',
        install_ios_2: 'የማጣቀሻ አዝራሩን ይንኩ',
        install_ios_3: '«ወደ መነሻ ስክሪን ጨምር» ይምረጡ',
        install_ios_4: '«ጨምር» ይንኩ — መተግበሪያው ያለ ኢንተርኔት ይሰራል',
        welcome_back: 'እንኳን ተመልሰው መጡ {name} 👋'
      },
      en: {
        install_ios_title: '📥 Install the App on iPhone/iPad',
        install_ios_1: 'Open this page in Safari',
        install_ios_2: 'Tap the Share button',
        install_ios_3: 'Choose "Add to Home Screen"',
        install_ios_4: 'Tap "Add" — the app will work offline',
        welcome_back: 'Welcome back {name} 👋'
      }
    };
    Object.keys(extra).forEach(lang => {
      if (I18N_DICT[lang]) Object.assign(I18N_DICT[lang], extra[lang]);
    });
  })();

  /* =============================================================
     1) إدارة الشاشات
     ============================================================= */
  function showLoginScreen() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('appScreen').classList.add('hidden');
    setTimeout(() => {
      const el = document.getElementById('loginUsername');
      if (el) el.focus();
    }, 80);
  }

  function showAppScreen() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');

    const user = Auth.getUser();
    if (!user) return;

    /* رسالة ترحيب عند العودة (الجلسة استُعيدت من التخزين) */
    UI.toast(I18n.t('welcome_back', { name: DB.accountName(user) }), 'info', 2600);
  }

  function refreshScreens() {
    if (Auth.isLoggedIn()) {
      updateHeader();
      /* أستاذ لا يجلس على تبويب المشرف */
      if (currentTab === 'admin' && !Auth.isAdmin()) currentTab = 'adults';
      switchTab(currentTab, { silent: true });
      showAppScreen();
    } else {
      currentTab = 'adults';
      showLoginScreen();
    }
  }

  /* =============================================================
     2) التبويبات
     ============================================================= */
  function visibleTabs() {
    return TAB_ORDER.filter(t => t !== 'admin' || Auth.isAdmin());
  }

  function switchTab(tab, opts) {
    /* التحقق من الصلاحية والوجود */
    if (tab === 'admin' && !Auth.isAdmin()) tab = 'adults';
    if (!TAB_ORDER.includes(tab)) tab = 'adults';
    currentTab = tab;

    /* أزرار التبويبات */
    document.querySelectorAll('#mainTabs .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    /* الأقسام + وسم الطباعة print-active */
    document.querySelectorAll('.tab-view').forEach(view => {
      const isTarget = view.id === 'view-' + tab;
      view.classList.toggle('hidden', !isTarget);
      view.classList.toggle('print-active', isTarget);
    });

    /* لا حاجة لإعادة الرسم — الوحدات تستمع لـ datachange بنفسها */
    if (!opts || !opts.silent) {
      /* تمرير لأعلى عند تبديل القسم */
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function bindTabs() {
    const tabsEl = document.getElementById('mainTabs');
    if (!tabsEl) return;

    tabsEl.addEventListener('click', e => {
      const btn = e.target.closest && e.target.closest('.tab-btn');
      if (!btn || btn.disabled) return;
      switchTab(btn.dataset.tab);
    });
  }

  /* =============================================================
     3) التنقل بالسحب يميناً/يساراً
     ---------------------------------------------------------
     اتجاه السحب يتبع اتجاه اللغة:
       • RTL (العربية): سحب لليمين ← التبويب التالي
       • LTR (أمهرية/إنجليزية): سحب لليسار ← التبويب التالي
     حمايات: يتجاهل السحب على الحقول والأزرار والجداول
     المتمررة أفقياً وأثناء فتح أي نافذة منبثقة.
     ============================================================= */
  function bindSwipe() {
    const area = document.getElementById('mainContent');
    if (!area) return;

    let startX = 0, startY = 0, tracking = false;

    area.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) { tracking = false; return; }

      const t = e.target;
      /* تجاهل: عناصر تفاعلية + جداول تتمرر أفقياً + نوافذ مفتوحة */
      if (document.querySelector('.modal-overlay')) { tracking = false; return; }
      if (t.closest && t.closest(
        'input, textarea, select, button, .table-wrap, .progress-bar'
      )) { tracking = false; return; }

      tracking = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    area.addEventListener('touchend', e => {
      if (!tracking) return;
      tracking = false;

      const t = e.changedTouches[0];
      if (!t) return;

      const dx = t.clientX - startX;   /* + يميناً / - يساراً */
      const dy = t.clientY - startY;

      /* عتبة: مسافة أفقية > 70 بكسل وأكبر بـ1.6 مرة من الرأسية */
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6) return;

      const tabs = visibleTabs();
      const idx = tabs.indexOf(currentTab);
      if (idx < 0) return;

      const rtl = I18n.isRTL();
      /* التالي: في RTL سحب يميناً، في LTR سحب يساراً */
      const next = rtl ? dx > 0 : dx < 0;

      let target;
      if (next) target = tabs[idx + 1];
      else      target = tabs[idx - 1];

      if (target) switchTab(target);
    }, { passive: true });
  }

  /* =============================================================
     4) الشريط العلوي — الاسم والدور وأزرار المشرف
     ============================================================= */
  function updateHeader() {
    const user = Auth.getUser();

    const nameEl = document.getElementById('currentUserName');
    const roleEl = document.getElementById('currentUserRole');
    if (nameEl) nameEl.textContent = user ? DB.accountName(user) : '';
    if (roleEl) {
      roleEl.textContent = user
        ? I18n.t(user.role === 'admin' ? 'role_admin' : 'role_teacher')
        : '';
      roleEl.className = 'role-badge' + (user && user.role === 'admin' ? ' admin' : '');
    }

    /* زر «➕ زيادة حساب» — للمشرف فقط */
    const addBtn = document.getElementById('addAccountBtn');
    if (addBtn) addBtn.classList.toggle('hidden', !Auth.isAdmin());

    /* تبويب المشرف — للمشرف فقط */
    const adminTab = document.getElementById('adminTabBtn');
    if (adminTab) adminTab.classList.toggle('hidden', !Auth.isAdmin());
  }

  /* =============================================================
     5) تبديل اللغة
     ============================================================= */
  function bindLangUI() {
    /* قائمة الرأس */
    const select = document.getElementById('langSelect');
    if (select) {
      select.addEventListener('change', () => {
        I18n.setLang(select.value);
      });
    }

    /* أزرار شاشة الدخول */
    document.getElementById('loginLangs').addEventListener('click', e => {
      const btn = e.target.closest && e.target.closest('.lang-btn');
      if (btn) I18n.setLang(btn.dataset.lang);
    });

    /* عند تغيير اللغة: تحديث الرأس (الأسماء المترجمة) + العنوان */
    I18n.onLangChange(() => {
      updateHeader();
      document.title = I18n.t('app_title');
    });

    /* حالة أولية */
    document.title = I18n.t('app_title');
    updateHeader();
  }

  /* =============================================================
     6) تثبيت PWA
     ============================================================= */
  function setupInstall() {
    const installBtn = document.getElementById('installBtn');
    if (!installBtn) return;

    let deferredPrompt = null;

    /* اندرويد / كروم / إيدج: حدث التثبيت الأصلي */
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
      installBtn.classList.remove('hidden');
    });

    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        try { await deferredPrompt.userChoice; } catch (err) { /* تجاهل */ }
        deferredPrompt = null;
        installBtn.classList.add('hidden');
      } else {
        /* iOS: نافذة إرشادات «إضافة إلى الشاشة الرئيسية» */
        showIOSInstallModal();
      }
    });

    window.addEventListener('appinstalled', () => {
      installBtn.classList.add('hidden');
      UI.toast(I18n.t('installed'), 'success');
    });

    /* iOS لا يطلق beforeinstallprompt → نظهر الزر يدوياً بإرشادات */
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone =
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isStandalone) {
      setTimeout(() => installBtn.classList.remove('hidden'), 1200);
    }
    if (isStandalone) installBtn.classList.add('hidden');
  }

  /* نافذة إرشادات iOS */
  function showIOSInstallModal() {
    UI.modal({
      title: '📱 ' + I18n.t('install_ios_title'),
      body: `
        <ol style="padding-inline-start:1.4rem;line-height:2.3;font-size:.98rem">
          <li>${esc(I18n.t('install_ios_1'))}</li>
          <li>${esc(I18n.t('install_ios_2'))} <b style="font-size:1.2rem">⎋</b></li>
          <li>${esc(I18n.t('install_ios_3'))}</li>
          <li>${esc(I18n.t('install_ios_4'))}</li>
        </ol>
      `,
      footer: `<button type="button" class="btn btn-primary" data-close>${esc(I18n.t('ok'))}</button>`
    });
  }

  /* =============================================================
     7) تسجيل Service Worker (يعمل فقط عبر http/https)
     ============================================================= */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (!location.protocol.startsWith('http')) return;   /* file:// غير مدعوم */

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(reg => {
          /* عند توفر تحديث جديد للملفات */
          reg.addEventListener('updatefound', () => {
            const nw = reg.installing;
            if (!nw) return;
            nw.addEventListener('statechange', () => {
              if (nw.state === 'installed' &&
                  navigator.serviceWorker.controller) {
                UI.toast(I18n.t('offline_ready'), 'info');
              }
            });
          });
        })
        .catch(err => console.warn('[SW] تعذر التسجيل:', err));
    });
  }

  /* =============================================================
     8) أحداث النظام
     ============================================================= */
  function bindSystemEvents() {
    /* دخول / خروج → تبديل الشاشات */
    window.addEventListener('sc:authchange', refreshScreens);
  }

  /* =============================================================
     التشغيل
     ============================================================= */
  function init() {
    Auth.initUI();       /* ربط نموذج الدخول وزر الخروج (الملف 5) */
    bindTabs();
    bindSwipe();
    bindLangUI();
    setupInstall();
    registerSW();
    bindSystemEvents();

    /* الشاشة الافتتاحية حسب الجلسة */
    refreshScreens();
  }

  init();

  /* ---------- الواجهة العامة للوحدة ---------- */
  return {
    switchTab
  };
})();
