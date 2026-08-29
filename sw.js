'use strict';

/* =========================================================
   نظام الاختتام الصيفي — عامل الخدمة (Service Worker)
   الملف رقم (12-ب) : sw.js — في جذر المشروع
   ---------------------------------------------------------
   الاستراتيجية:
     • صفحات التنقل: شبكة أولاً + رجوع للكاش (تضمن التحديثات)
     • ملفات التطبيق: كاش أولاً (سرعة فورية + عمل أوفلاين)
     • خطوط جوجل: كاش أولاً مع تحديث بالخلفية — وعند غياب
       الإنترنت يتحول النظام تلقائياً لخطوط النظام
   ---------------------------------------------------------
   ⚠️ عند تعديل أي ملف مستقبلاً: غيّر رقم النسرة في CACHE_NAME
   (مثلاً v1.0.1) ليصل التحديث لكل الأجهزة المثبتة.
   ========================================================= */

const CACHE_NAME     = 'sc-cache-v1.0.0';
const RUNTIME_CACHE  = 'sc-runtime-v1.0';

/* كل ملفات التطبيق — تُخزَّن عند التثبيت الأول */
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
  './make-icons.html'
];

/* =============================================================
   التثبيت: تخزين كل الملفات + تفعيل فوري
   ============================================================= */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

/* =============================================================
   التفعيل: حذف الكاشات القديمة + السيطرة على العملاء
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

  /* ---------- 1) التنقل بين الصفحات: شبكة أولاً ---------- */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          /* نجاح → حدّث النسخة المخزنة */
          const copy = res.clone();
          caches.open(CACHE_NAME)
            .then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() =>
          /* أوفلاين → النسخة المخزنة */
          caches.match('./index.html')
        )
    );
    return;
  }

  /* ---------- 2) خطوط جوجل: كاش مع تحديث خلفي ---------- */
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

  /* ---------- 3) ملفات النظام (نفس الأصل): كاش أولاً ---------- */
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
