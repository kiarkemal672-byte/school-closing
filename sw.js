'use strict';

/* =========================================================
   نظام الاختتام الصيفي — عامل الخدمة (Service Worker)
   النسخة v1.0.1 المصححة — استبدل ملف sw.js القديم بهاذا
   ---------------------------------------------------------
   الإصلاحات في هذه النسخة:
     🐛 إصلاح خطأ فادح: كانت قائمة الملفات تُخزَّن دفعة واحدة
        (addAll) فأي ملف مفقود = فشل التثبيت بالكامل!
        الآن كل ملف يُخزَّن مستقلاً — والملفات الناقصة تُتجاهل.
     🐛 حذف make-icons.html من القائمة (كان يفشل إذا حذفته)
   ---------------------------------------------------------
   ⚠️ عند تعديل أي ملف مستقبلاً: غيّر رقم النسخة في CACHE_NAME
      (مثلاً v1.0.2) ليصل التحديث لكل الأجهزة المثبتة.
   ========================================================= */

const CACHE_NAME    = 'sc-cache-v1.0.1';
const RUNTIME_CACHE = 'sc-runtime-v1.0';

/* ملفات التطبيق الأساسية — تُخزَّن عند التثبيت الأول */
const APP_FILES = [
  './',
  './index.html',
  './css/style.css',
  './js/i18n.js',
  './js/storage.js',
  './js/auth.js',
  './js/ui.js',
  './js/pdf-export.js',
  './js/students.js',
  './js/ceremony.js',
  './js/admin.js',
  './js/app.js',
  './manifest.json',
  './icons/icon.svg',
  './pwa-check.html'
  /* ملاحظة: أيقونات PNG تُخزَّن تلقائياً عند أول طلب لها */
];

/* =============================================================
   التثبيت — 🐛 هنا كان الخطأ:
   كل ملف يُخزَّن مستقلاً (cache.add) ونجمع النتائج بـ allSettled
   → ملف مفقود واحد لا يفشل التثبيت كاملاً
   ============================================================= */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache =>
        Promise.allSettled(
          APP_FILES.map(file => cache.add(file))
        )
      )
      .then(() => self.skipWaiting())
  );
});

/* =============================================================
   التفعيل: حذف الكاشات القديمة + السيطرة الفورية
   ============================================================= */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* =============================================================
   الاعتراض على الطلبات
   ============================================================= */
self.addEventListener('fetch', e => {
  const req = e.request;

  /* نتعامل مع GET فقط */
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (err) { return; }

  /* ---------- 1) التنقل: شبكة أولاً + رجوع للكاش ---------- */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME)
            .then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  /* ---------- 2) خطوط جوجل: كاش أولاً + تحديث خلفي ---------- */
  if (url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(req).then(hit => {
        const netFetch = fetch(req)
          .then(res => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(RUNTIME_CACHE)
                .then(c => c.put(req, copy));
            }
            return res;
          })
          .catch(() => hit);
        return hit || netFetch;
      })
    );
    return;
  }

  /* ---------- 3) ملفات النظام: كاش أولاً ---------- */
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then(hit =>
        hit ||
        fetch(req).then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME)
              .then(c => c.put(req, copy));
          }
          return res;
        })
      )
    );
  }
});
