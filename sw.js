'use strict';

/* =========================================================
نظام الاختتام الشتاءي — Service Worker
   النسخة v1.0.2 — «الأيقونات التلقائية»
   ---------------------------------------------------------
   🐛 إصلاح نهائي لمشكلة «إنشاء اختصار» بدل «تثبيت التطبيق»:
   كروم يشترط أيقونة PNG حقيقية — وهذه النسخة تولّد الأيقونات
   (192 + 512 + maskable) تلقائياً وتخدمها بنفسها، وتقدّم نسخة
   manifest محسّنة بأيقونات مضمّنة.
   → لا حاجة لرفع أي ملف صور يدوياً.
   ========================================================= */

const CACHE_NAME    = 'sc-cache-v1.1.0';
const RUNTIME_CACHE = 'sc-runtime-v1.0';

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
   './js/firebase-config.js',
  './manifest.json',
  './icons/icon.svg'
];

/* =============================================================
   1) توليد الأيقونات تلقائياً (بدون أي ملفات صور)
   ============================================================= */

/* مستطيل بزوايا مستديرة */
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* رسم قبعة التخرج بإحداثيات تصميم 512×512 */
function drawCap(ctx) {
  /* القاعدة */
  ctx.fillStyle = '#dcecea';
  ctx.beginPath();
  ctx.moveTo(168, 262);
  ctx.lineTo(168, 330);
  ctx.quadraticCurveTo(168, 344, 182, 351);
  ctx.quadraticCurveTo(222, 372, 256, 372);
  ctx.quadraticCurveTo(290, 372, 330, 351);
  ctx.quadraticCurveTo(344, 344, 344, 330);
  ctx.lineTo(344, 262);
  ctx.lineTo(256, 302);
  ctx.closePath();
  ctx.fill();

  /* اللوح */
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(256, 152);
  ctx.lineTo(428, 228);
  ctx.lineTo(256, 304);
  ctx.lineTo(84, 228);
  ctx.closePath();
  ctx.fill();

  /* الزر + الشرابة الذهبية */
  ctx.fillStyle = '#d69e2e';
  ctx.beginPath();
  ctx.arc(256, 222, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#d69e2e';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(256, 222);
  ctx.lineTo(410, 240);
  ctx.lineTo(410, 330);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(410, 348, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(396, 362);
  ctx.lineTo(410, 408);
  ctx.lineTo(424, 362);
  ctx.closePath();
  ctx.fill();
}

/* توليد صورة PNG بالحجم المطلوب */
async function drawIcon(size, maskable) {
  const oc  = new OffscreenCanvas(size, size);
  const ctx = oc.getContext('2d');
  const k   = size / 512;

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#14867c');
  grad.addColorStop(1, '#094640');

  if (maskable) {
    /* نسخة maskable: خلفية كاملة والمحتوى داخل المنطقة الآمنة */
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    ctx.translate(size / 2, size / 2);
    ctx.scale(0.78, 0.78);
    ctx.translate(-256 * k, -256 * k);
  } else {
    ctx.fillStyle = grad;
    rr(ctx, 0, 0, size, size, 104 * k);
    ctx.fill();
  }

  ctx.scale(k, k);
  drawCap(ctx);

  return oc.convertToBlob({ type: 'image/png' });
}

/* تحويل Blob إلى data URL — يدوياً (FileReader غير متاح في SW) */
function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

async function blobToDataURL(blob) {
  return 'data:image/png;base64,' + bufToBase64(await blob.arrayBuffer());
}

/* ذاكرة مؤقتة للأيقونات المولّدة */
const iconBlobs = {};
async function getIconBlob(size, maskable) {
  const key = size + (maskable ? 'm' : '');
  if (!iconBlobs[key]) iconBlobs[key] = await drawIcon(size, maskable);
  return iconBlobs[key];
}

/* =============================================================
   2) manifest محسّن بأيقونات مضمّنة
   ============================================================= */
const DEFAULT_MANIFEST = {
  name: 'نظام الاختتام الشتاء — Summer Closing System',
  short_name: 'الاختتام الشتاء',
  description: 'نظام إدارة الاختبارات ويوم الاختتام الشتاء',
  id: './',
  start_url: './index.html',
  scope: './',
  display: 'standalone',
  dir: 'rtl',
  lang: 'ar',
  background_color: '#094640',
  theme_color: '#0d5c55'
};

let manifestJSONCache = null;

async function buildManifest() {
  if (manifestJSONCache) return manifestJSONCache;

  /* نبدأ من الـ manifest الأصلي المخزّن (نحتفظ بأي تعديلات مستقبلية) */
  let base = null;
  try {
    const hit = await caches.match('./manifest.json');
    if (hit) base = await hit.json();
  } catch (e) { /* تجاهل */ }
  if (!base || typeof base !== 'object') base = Object.assign({}, DEFAULT_MANIFEST);

  /* أيقونات مضمّنة + مسارات الملفات (تخدمها الوحدة أدناه) */
  const d192  = await blobToDataURL(await getIconBlob(192, false));
  const d512  = await blobToDataURL(await getIconBlob(512, false));
  const d512m = await blobToDataURL(await getIconBlob(512, true));

  base.icons = [
    { src: d192,  sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: d512,  sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: d512m, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ];

  manifestJSONCache = JSON.stringify(base);
  return manifestJSONCache;
}

function isIconURL(url) {
  return /\/icons\/icon-(192|512)(-maskable)?\.png$/i.test(url.pathname);
}
function isManifestURL(url) {
  return /\/manifest\.json$/i.test(url.pathname);
}

/* خدمة الأيقونات: المخزنة → الحقيقية → المولّدة تلقائياً */
async function iconResponse(req, url) {
  const cached = await caches.match(req);
  if (cached) return cached;

  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(req, copy));
      return res;
    }
  } catch (e) { /* غير موجودة — نولّدها */ }

  try {
    const size     = url.pathname.indexOf('192') !== -1 ? 192 : 512;
    const maskable = url.pathname.indexOf('maskable') !== -1;
    const blob     = await getIconBlob(size, maskable);
    return new Response(blob, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' }
    });
  } catch (e) {
    return fetch(req);
  }
}

/* =============================================================
   3) التثبيت والتفعيل
   ============================================================= */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(APP_FILES.map(f => cache.add(f))))
      .then(() => self.skipWaiting())
  );
});

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
   4) الاعتراض على الطلبات
   ============================================================= */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (err) { return; }

  /* ---------- خطوط جوجل ---------- */
  if (url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(req).then(hit => {
        const net = fetch(req)
          .then(res => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(RUNTIME_CACHE).then(c => c.put(req, copy));
            }
            return res;
          })
          .catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  /* ---------- الأيقونات (أي نوع طلب) ---------- */
  if (isIconURL(url)) {
    e.respondWith(iconResponse(req, url));
    return;
  }

  /* ---------- manifest المحسّن ---------- */
  if (isManifestURL(url)) {
    e.respondWith(
      buildManifest()
        .then(json => new Response(json, {
          headers: {
            'Content-Type': 'application/manifest+json',
            'Cache-Control': 'no-store'
          }
        }))
        .catch(async () => {
          const hit = await caches.match('./manifest.json');
          return hit || fetch('./manifest.json');
        })
    );
    return;
  }

  /* ---------- التنقل: شبكة أولاً ---------- */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  /* ---------- بقية الملفات: كاش أولاً ---------- */
  e.respondWith(
    caches.match(req).then(hit =>
      hit ||
      fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      })
    )
  );
});
