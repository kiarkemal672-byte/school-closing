'use strict';

/* =========================================================
   نظام الاختتام الصيفي — أدوات الواجهة (UI Toolkit)
   الملف رقم (6) من (12) : js/ui.js
   ---------------------------------------------------------
   المحتويات:
     1) النوافذ المنبثقة UI.modal — تدعم التكديس (نافذة فوق نافذة)
        • إغلاق بزر ✕ / النقر خارجها / زر Escape
        • أزرار data-close داخل التذييل
     2) التنبيهات UI.toast (success / error / info)
     3) نافذة التأكيد UI.confirm → تُرجع Promise<boolean>
        (+ اختصار UI.confirmDelete)
     4) أدوات بناء: حقول النماذج، شرائط النسبة، الميداليات،
        بطاقات الإحصائيات، حالة الفراغ، أزرار الجداول...
     5) أدوات عامة: esc (تأمين HTML)، تنسيق التاريخ، debounce
   ========================================================= */

const UI = (() => {

  /* =============================================================
     أدوات عامة
     ============================================================= */

  /* تأمين نص قبل إدراجه في HTML (يمنع حقن الوسوم من أسماء الطلاب) */
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* اختصارات البحث */
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* تنسيق طابع زمني حسب اللغة الحالية */
  function formatDateTime(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    const localeMap = { ar: 'ar', am: 'am-ET', en: 'en-GB' };
    const loc = localeMap[I18n.getLang()] || undefined;
    try {
      return d.toLocaleString(loc, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return d.toLocaleString();
    }
  }

  /* تأخير تنفيذ (لبحث حي دون إغراق) */
  function debounce(fn, ms) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms || 250);
    };
  }

  /* تاريخ اليوم بصيغة حقل date */
  function todayStr() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  /* =============================================================
     1) النوافذ المنبثقة (Modals) — مع دعم التكديس
     ============================================================= */
  const modalStack = [];   // النوافذ المفتوحة حالياً (الأعلى = الأخيرة)

  /* Escape يغلق النافذة العليا فقط */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalStack.length) {
      const top = modalStack[modalStack.length - 1];
      if (top.closable) top.api.close();
    }
  });

  /* البناء:
     UI.modal({
       title:   '✏️ عنوان',           // نص/HTML
       body:    '<p>...</p>' | عنصر,  // محتوى
       footer:  '<button data-close>...', // أزرار التذييل
       wide:    false,                // نافذة عريضة
       gold:    false,                // ترويسة ذهبية (لوحة المشرف)
       closable:true,                 // السماح بالإغلاق بـ ✕ / الخارج / Escape
       onMount: (el, api) => {},      // بعد الإدراج — ربط الأحداث هنا
       onClose: () => {}              // عند الإغلاق
     })
     → تُرجع { close(), el }                                    */
  function modal(opts) {
    const o = Object.assign({ closable: true, wide: false, gold: false }, opts || {});
    const root = document.getElementById('modalRoot');
    if (!root) return { close() {}, el: null };

    /* بناء الهيكل */
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
      <div class="modal ${o.wide ? 'modal-wide' : ''}" role="dialog" aria-modal="true">
        <div class="modal-header ${o.gold ? 'modal-gold' : ''}">
          <div class="modal-title">${o.title || ''}</div>
          ${o.closable ? '<button type="button" class="modal-close" aria-label="✕">✕</button>' : ''}
        </div>
        <div class="modal-body"></div>
        ${o.footer !== undefined ? '<div class="modal-footer"></div>' : ''}
      </div>`;

    /* المحتوى: نص HTML أو عنصر DOM */
    const bodyEl = overlay.querySelector('.modal-body');
    if (typeof o.body === 'string') bodyEl.innerHTML = o.body;
    else if (o.body instanceof Node) bodyEl.appendChild(o.body);

    const footerEl = overlay.querySelector('.modal-footer');
    if (footerEl) {
      if (typeof o.footer === 'string') footerEl.innerHTML = o.footer;
      else if (o.footer instanceof Node) footerEl.appendChild(o.footer);
    }

    root.appendChild(overlay);

    /* الإغلاق */
    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      overlay.remove();
      const idx = modalStack.findIndex(s => s.api === api);
      if (idx > -1) modalStack.splice(idx, 1);
      if (typeof o.onClose === 'function') o.onClose();
    }

    const api = { close, el: overlay, body: bodyEl };

    /* الأحداث:
       • النقر على الخلفية (وليس داخل النافذة) = إغلاق
       • زر ✕ = إغلاق
       • أي زر يحمل data-close = إغلاق */
    overlay.addEventListener('click', e => {
      if (e.target === overlay && o.closable) { close(); return; }
      const closer = e.target.closest && e.target.closest('[data-close]');
      if (closer) close();
    });
    const xBtn = overlay.querySelector('.modal-close');
    if (xBtn) xBtn.addEventListener('click', close);

    /* تسجيل في الكومة + تركيز أول حقل */
    modalStack.push({ api, closable: o.closable });
    setTimeout(() => {
      const first = overlay.querySelector('input, select, textarea');
      if (first) first.focus();
    }, 60);

    /* استدعاء onMount بعد الجاهزية */
    if (typeof o.onMount === 'function') o.onMount(overlay, api);

    return api;
  }

  /* إغلاق كل النوافذ المفتوحة (نادراً ما يُحتاج) */
  function closeAllModals() {
    [...modalStack].reverse().forEach(s => s.api.close());
  }

  /* =============================================================
     2) التنبيهات (Toasts)
     ============================================================= */
  const TOAST_ICONS = { success: '✅', error: '❌', info: 'ℹ️' };

  /* UI.toast('تم الحفظ ✓', 'success') */
  function toast(msg, type, ms) {
    const root = document.getElementById('toastRoot');
    if (!root) return;

    /* حد أقصى 4 تنبيهات ظاهرة — الأقدم يُحذف */
    while (root.children.length >= 4) root.firstElementChild.remove();

    const t = document.createElement('div');
    t.className = 'toast toast-' + (type || 'info');

    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = TOAST_ICONS[type] || TOAST_ICONS.info;

    const text = document.createElement('span');
    text.textContent = String(msg);   /* نص آمن — بلا HTML */

    t.append(icon, text);
    root.appendChild(t);

    let killed = false;
    function kill() {
      if (killed) return;
      killed = true;
      t.classList.add('hide');
      setTimeout(() => t.remove(), 350);
    }

    t.addEventListener('click', kill);            /* نقر = إخفاء */
    setTimeout(kill, ms > 0 ? ms : 3200);         /* إخفاء تلقائي */
  }

  /* =============================================================
     3) نافذة التأكيد — Promise<boolean>
     ---------------------------------------------------------
     const ok = await UI.confirm('حذف الطالب؟');
     await UI.confirmDelete('حذف «أحمد»؟');  // نسخة حمراء بزر حذف
     ============================================================= */
  function confirmDlg(msg, opts) {
    const o = opts || {};
    return new Promise(resolve => {
      let settled = false;
      const done = v => { if (!settled) { settled = true; resolve(v); } };

      modal({
        title: (o.danger ? '🗑️ ' : '⚠️ ') + I18n.t('confirm_title'),
        body: `<p style="font-size:1.05rem;font-weight:700;line-height:1.8">${esc(msg)}</p>`,
        footer: `
          <button type="button" class="btn btn-ghost" data-no>${I18n.t(o.noLabel || 'cancel')}</button>
          <button type="button" class="btn ${o.danger ? 'btn-danger' : 'btn-primary'}" data-yes>
            ${I18n.t(o.yesLabel || 'confirm')}
          </button>`,
        onClose() { done(false); },
        onMount(el, api) {
          el.querySelector('[data-no]').addEventListener('click', () => { done(false); api.close(); });
          const yesBtn = el.querySelector('[data-yes]');
          yesBtn.addEventListener('click', () => { done(true); api.close(); });
          setTimeout(() => yesBtn.focus(), 60);

          /* Enter = تأكيد */
          el.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); done(true); api.close(); }
          });
        }
      });
    });
  }

  function confirmDelete(msg) {
    return confirmDlg(msg, { danger: true, yesLabel: 'delete' });
  }

  /* =============================================================
     4) أدوات بناء الواجهة (HTML Builders)
     ============================================================= */

  /* ---------- حقل نموذج موحّد ----------
     UI.fieldHTML({
       id, label, type ('text'|'number'|'password'|'date'|'select'|'textarea'),
       value, placeholder, hint, required, min, step, rows,
       options: [{value, label}]   (لـ select)
     })                                          */
  function fieldHTML(o) {
    const req = o.required ? ' <span style="color:var(--danger)">*</span>' : '';
    const common =
      ` id="${o.id}"` +
      (o.placeholder ? ` placeholder="${esc(o.placeholder)}"` : '');

    let input = '';
    if (o.type === 'select') {
      input = `<select${common}>` + (o.options || []).map(op =>
        `<option value="${esc(op.value)}"${String(op.value) === String(o.value == null ? '' : o.value) ? ' selected' : ''}>${esc(op.label)}</option>`
      ).join('') + `</select>`;
    } else if (o.type === 'textarea') {
      input = `<textarea${common} rows="${o.rows || 3}">${esc(o.value == null ? '' : o.value)}</textarea>`;
    } else {
      input =
        `<input type="${o.type || 'text'}"${common}` +
        ` value="${esc(o.value == null ? '' : o.value)}"` +
        (o.min !== undefined ? ` min="${o.min}"` : '') +
        (o.step ? ` step="${o.step}"` : '') +
        `>`;
    }

    return `<div class="field">
      <label for="${o.id}">${esc(o.label)}${req}</label>
      ${input}
      ${o.hint ? `<p class="hint">${esc(o.hint)}</p>` : ''}
      <p class="error-msg hidden" id="${o.id}Err"></p>
    </div>`;
  }

  /* ---------- شريط نسبة مئوية ملون حسب التقدير ---------- */
  function progress(p) {
    const info = DB.gradeInfo(Number(p) || 0);
    const w = Math.min(100, Math.max(0, Number(p) || 0));
    return `<div class="progress-bar ${info.cls}">
              <div class="progress-fill" style="width:${w}%"></div>
            </div>`;
  }

  /* ---------- وسام التقدير (ممتاز/جيد/مقبول/ضعيف) ---------- */
  function gradePill(p) {
    const info = DB.gradeInfo(Number(p) || 0);
    return `<span class="grade-pill ${info.pill}">${DB.gradeLabel(Number(p) || 0)}</span>`;
  }

  /* ---------- ميدالية الترتيب (ذهبية/فضية/برونزية/رقم) ---------- */
  function medal(rank) {
    const icons = { 1: '🥇', 2: '🥈', 3: '🥉' };
    const cls = rank >= 1 && rank <= 3 ? ' rank-' + rank : '';
    return `<span class="rank-badge${cls}">${icons[rank] || rank}</span>`;
  }

  /* ---------- وسام الدرجة العظمى «من 25» ---------- */
  function maxBadge(max) {
    return `<span class="max-badge">🎯 ${I18n.t('out_of', { max })}</span>`;
  }

  /* ---------- عنوان قسم فرعي ---------- */
  function sectionTitle(icon, text) {
    return `<h2 class="section-title">${icon} ${esc(text)}</h2>`;
  }

  /* ---------- شبكة إحصائيات ----------
     UI.statsGrid([{icon:'👨‍🎓', value:25, label:'الطلاب'}, ...]) */
  function statsGrid(items) {
    return '<div class="stats-grid">' + (items || []).map(i => `
      <div class="stat-card">
        <div class="stat-icon">${i.icon || '📊'}</div>
        <div>
          <div class="stat-value">${esc(String(i.value))}</div>
          <div class="stat-label">${esc(i.label)}</div>
        </div>
      </div>`).join('') + '</div>';
  }

  /* ---------- بطاقة عامة ----------
     UI.card({icon, title, tools, body, cls})
     • title/tools: HTML (المتصل مسؤول عن التأمين)
     • body: HTML أو سلسلة فارغة                        */
  function card(o) {
    return `<div class="card ${o.cls || ''}">
      <div class="card-header">
        <div class="card-title">
          ${o.icon ? `<span class="exam-icon">${o.icon}</span>` : ''}
          <span>${o.title || ''}</span>
        </div>
        <div class="row">${o.tools || ''}</div>
      </div>
      ${o.body || ''}
    </div>`;
  }

  /* ---------- حالة الفراغ ---------- */
  function emptyState(icon, text) {
    return `<div class="empty-state">
      <div class="empty-icon">${icon || '📭'}</div>
      <p>${esc(text)}</p>
    </div>`;
  }

  /* ---------- أزرار إجراءات الجداول ----------
     UI.actBtn('edit', 'تعديل') → زر ✏️
     الأزرار تحمل data-action — تُربط لاحقاً بالتفويض:
     tbody.addEventListener('click', e => {
       const btn = e.target.closest('[data-action]');
       const row = e.target.closest('tr[data-id]');
       ...
     })                                                     */
  function actBtn(action, title, opts) {
    const o = opts || {};
    const cls  = o.cls  || (action === 'delete' ? 'del' : action === 'edit' ? 'edit' : 'view');
    const icon = o.icon || (action === 'delete' ? '🗑️' : action === 'edit' ? '✏️' : '👁️');
    return `<button type="button" class="act-btn ${cls}" data-action="${esc(action)}"
            title="${esc(title)}"${o.disabled ? ' disabled' : ''}>${icon}</button>`;
  }

  /* ---------- زر عادي موحّد ---------- */
  function btn(label, action, cls, opts) {
    const o = opts || {};
    return `<button type="button" class="btn ${cls || 'btn-ghost'} ${o.small ? 'btn-sm' : ''}"
            data-action="${esc(action)}"${o.disabled ? ' disabled' : ''}>${label}</button>`;
  }

  /* =============================================================
     الواجهة العامة للوحدة
     ============================================================= */
  return {
    /* نوافذ وتنبيهات */
    modal, toast,
    confirm: confirmDlg, confirmDelete,
    closeAllModals,

    /* بنّاؤو HTML */
    fieldHTML, progress, gradePill, medal, maxBadge,
    sectionTitle, statsGrid, card, emptyState, actBtn, btn,

    /* أدوات */
    esc, $, $$,
    formatDateTime, debounce, todayStr
  };
})();
