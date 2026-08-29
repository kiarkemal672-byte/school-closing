'use strict';

/* =========================================================
   نظام الاختتام الصيفي — يوم الاختتام (المهرجانية) 🎉
   الملف رقم (9) من (12) : js/ceremony.js
   ---------------------------------------------------------
   المحتويات:
     1) إحصائيات عامة (الفقرات + المشاركون)
     2) قسم الكبار: 8 فقرات افتراضية (قصص الصحابة، الشعر،
        الخطبة، فضائل القرآن، الفقه بطالبين، العقيدة، السيرة،
        التجويد) — قابلة للزيادة والتعديل والحذف
     3) قسم الصغار: 7 فقرات افتراضية (العقيدة، الفقه، السيرة،
        التجويد، الأخلاق، القرآن بالحفظ، القاعدة النورانية)
     4) إدارة المشاركين: اختيار طالب مسجل أو اسم حر
     5) إعادة ترتيب الفقرات (⬆️ أعلى / ⬇️ أسفل)
     6) تصدير البرنامج كاملاً PDF
   ---------------------------------------------------------
   الصلاحيات:
     • القراءة: للجميع
     • تعديل/حذف الفقرة: المشرف ← الكل | الأستاذ ← فقراته
       والفقرات النظامية المشتركة (system)
     • إضافة مشارك: متاح للجميع
     • إزالة مشارك: المشرف ← الكل | الأستاذ ← فقراته أو
       المشاركون الذين أضافهم هو
   ========================================================= */

const Ceremony = (() => {

  const esc = UI.esc;
  const C   = 'style="text-align:center"';

  /* =============================================================
     مفاتيح ترجمة إضافية (تُدمج في القاموس — لا تلمس i18n.js)
     ============================================================= */
  (function extendI18n() {
    const extra = {
      ar: {
        order_up: 'تحريك الفقرة للأعلى',
        order_down: 'تحريك الفقرة للأسفل',
        pick_student: 'اختيار طالب مسجل (اختياري)',
        free_name: 'أو اكتب اسماً حراً (اختياري)',
        pick_or_type: 'اختر طالباً أو اكتب اسماً واحداً على الأقل',
        participants_total: 'إجمالي المشاركين',
        already_added: 'مضاف مسبقاً في هذه الفقرة'
      },
      am: {
        order_up: 'ክፍሉን ወደ ላይ አንቀሳቅስ',
        order_down: 'ክፍሉን ወደ ታች አንቀሳቅስ',
        pick_student: 'የተመዘገበ ተማሪ ይምረጡ (አማራጭ)',
        free_name: 'ወይም ነጻ ስም ይጻፉ (አማራጭ)',
        pick_or_type: 'ቢያንስ አንድ ተማሪ ይምረጡ ወይም ስም ይጻፉ',
        participants_total: 'ጠቅላላ ተሳታፊዎች',
        already_added: 'በዚህ ክፍል ቀድሞ ታክሏል'
      },
      en: {
        order_up: 'Move segment up',
        order_down: 'Move segment down',
        pick_student: 'Pick a registered student (optional)',
        free_name: 'Or type a free name (optional)',
        pick_or_type: 'Pick a student or type at least one name',
        participants_total: 'Total participants',
        already_added: 'Already added to this segment'
      }
    };
    Object.keys(extra).forEach(lang => {
      if (I18N_DICT[lang]) Object.assign(I18N_DICT[lang], extra[lang]);
    });
  })();

  /* =============================================================
     الصلاحيات (Students.canEditEntry من الملف 8 — منطق موحّد)
     ============================================================= */
  function segEditable(seg) {
    return Students.canEditEntry(seg);
  }

  /* إزالة مشارك: مشرف / فقرة قابلة للتعديل / المشارك من أضافه هو */
  function canRemoveParticipant(seg, part) {
    const user = Auth.getUser();
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (segEditable(seg)) return true;
    return part.addedBy === user.id;
  }

  /* =============================================================
     مساعدو أزرار
     ============================================================= */
  function hbtn(label, action, id, cls, title, disabled) {
    return `<button type="button" class="btn ${cls || 'btn-ghost'}" data-action="${action}"` +
      (id ? ` data-id="${esc(id)}"` : '') +
      (title ? ` title="${esc(title)}"` : '') +
      (disabled ? ' disabled' : '') + `>${esc(label)}</button>`;
  }

  function fieldError(el, id, msg) {
    const input = el.querySelector('#' + id);
    const err   = el.querySelector('#' + id + 'Err');
    if (input) {
      input.classList.add('input-error');
      input.focus();
      input.addEventListener('input', function clear() {
        input.classList.remove('input-error');
        if (err) { err.textContent = ''; err.classList.add('hidden'); }
        input.removeEventListener('input', clear);
      });
    }
    if (err) { err.textContent = msg; err.classList.remove('hidden'); }
  }

  /* =============================================================
     الرسم
     ============================================================= */
  function render() {
    const el = document.getElementById('view-ceremony');
    if (!el) return;

    const adults = DB.getSegments('adults');
    const kids   = DB.getSegments('kids');
    const totalParticipants =
      adults.concat(kids).reduce((n, s) => n + (s.participants || []).length, 0);

    el.innerHTML =
      UI.statsGrid([
        { icon: '🎭', value: adults.length + kids.length, label: I18n.t('segments') },
        { icon: '👥', value: totalParticipants,           label: I18n.t('participants_total') },
        { icon: '📖', value: adults.length,               label: I18n.t('adults_section') },
        { icon: '🧒', value: kids.length,                 label: I18n.t('kids_section') }
      ]) +

      UI.card({
        icon: '🎉',
        title: esc(I18n.t('ceremony_title')),
        tools:
          hbtn('📄 ' + I18n.t('export_pdf'), 'pdf-ceremony', null, 'btn-ghost btn-sm') +
          hbtn(I18n.t('add_segment'), 'add-segment', null, 'btn-primary btn-sm'),
        body: `<div class="card-body">
          <p class="text-muted" style="font-size:.9rem">${esc(I18n.t('ceremony_desc'))}</p>
        </div>`
      }) +

      sectionHTML('adults', adults) +
      sectionHTML('kids', kids);
  }

  /* ---------- قسم واحد (كبار/صغار) ---------- */
  function sectionHTML(section, segments) {
    const isKids = section === 'kids';
    const label  = isKids ? I18n.t('kids_section') : I18n.t('adults_section');

    let html = `<div class="row-between" style="margin:1.4rem 0 .8rem">
      <h2 class="section-title" style="margin:0;flex:1">
        ${isKids ? '🧒' : '📖'} ${esc(label)}
        <span class="max-badge">${segments.length}</span>
      </h2>
      ${hbtn('➕ ' + I18n.t('add_segment'), 'add-segment', section, 'btn-ghost btn-sm')}
    </div>`;

    if (!segments.length) {
      return html + UI.card({
        cls: isKids ? 'segment-card kids-seg' : 'segment-card adults-seg',
        title: esc(label),
        body: `<div class="card-body">${UI.emptyState('🎭', I18n.t('no_segments'))}</div>`
      });
    }

    return html + segments.map((seg, i) => segmentCard(seg, i)).join('');
  }

  /* ---------- بطاقة فقرة واحدة ---------- */
  function segmentCard(seg, index) {
    const isKids   = seg.section === 'kids';
    const editable = segEditable(seg);
    const parts    = seg.participants || [];

    /* شريحة مشارك (الاسم + زر إزالة إن سُمح) */
    const chips = parts.map(p => {
      const canRm = canRemoveParticipant(seg, p);
      return `<span class="participant-chip">
        ${canRm
          ? `<button type="button" class="rm" data-action="rm-part"
                     data-id="${esc(seg.id)}" data-part="${esc(p.id)}"
                     title="${esc(I18n.t('delete'))}">✕</button>`
          : '<span class="rm" style="cursor:default;opacity:.4">🔒</span>'}
        <span>${esc(p.name)}</span>
      </span>`;
    }).join('');

    const tools =
      hbtn('👤 ' + I18n.t('add_participant'), 'add-part', seg.id, 'btn-primary btn-sm') +
      hbtn('⬆️', 'seg-up', seg.id, 'btn-ghost btn-sm icon-btn', I18n.t('order_up')) +
      hbtn('⬇️', 'seg-down', seg.id, 'btn-ghost btn-sm icon-btn', I18n.t('order_down')) +
      hbtn('✏️', 'edit-segment', seg.id, 'btn-ghost btn-sm icon-btn',
           editable ? I18n.t('edit_segment') : I18n.t('edit_restricted'), !editable) +
      hbtn('🗑️', 'del-segment', seg.id, 'btn-soft-danger btn-sm icon-btn',
           editable ? I18n.t('delete') : I18n.t('edit_restricted'), !editable);

    const body =
      `<div class="card-body">
        ${chips
          ? `<div class="row">${chips}</div>`
          : `<p class="text-muted" style="font-size:.88rem">
               ${esc(I18n.t('no_participants'))}</p>`}
      </div>`;

    return UI.card({
      cls: 'segment-card ' + (isKids ? 'kids-seg' : 'adults-seg'),
      icon: isKids ? '🧒' : '🎭',
      title:
        `<span style="display:inline-flex;align-items:center;gap:.5rem">` +
        `<span class="rank-badge" style="width:28px;height:28px;font-size:.85rem">${index + 1}</span>` +
        esc(DB.segmentTitle(seg)) +
        `</span>` +
        ` <span class="max-badge">👥 ` +
        esc(I18n.t('participants_count', { count: parts.length })) + `</span>`,
      tools,
      body
    });
  }

  /* =============================================================
     نافذة إضافة/تعديل فقرة
     ============================================================= */
  function openSegmentModal(section, segId) {
    const seg = segId ? DB.findSegment(segId) : null;
    if (segId && !seg) return;
    if (seg && !segEditable(seg)) return;

    const seeded = !!(seg && seg.titleKey);   /* فقرة افتراضية مترجمة */

    UI.modal({
      title: seg
        ? '✏️ ' + I18n.t('edit_segment') + ' — ' + esc(DB.segmentTitle(seg))
        : '➕ ' + I18n.t('add_segment'),
      body: `
        ${UI.fieldHTML({
          id: 'sgTitle', label: I18n.t('segment_title'),
          value: seg ? (seg.title || '') : '',
          required: !seeded,
          placeholder: seeded ? DB.segmentTitle(seg) : '',
          hint: seeded ? I18n.t('auto_title_hint') : null
        })}
        ${UI.fieldHTML({
          id: 'sgSection', label: I18n.t('group'), type: 'select',
          value: seg ? seg.section : (section || 'adults'),
          options: [
            { value: 'adults', label: I18n.t('adults_section') },
            { value: 'kids',   label: I18n.t('kids_section') }
          ]
        })}
      `,
      footer: `
        <button type="button" class="btn btn-ghost" data-close>${esc(I18n.t('cancel'))}</button>
        <button type="button" class="btn btn-primary" id="sgSave">${esc(I18n.t('save'))}</button>
      `,
      onMount(el, api) {
        el.querySelector('#sgSave').addEventListener('click', () => {
          const title   = el.querySelector('#sgTitle').value.trim();
          const section = el.querySelector('#sgSection').value;

          if (!seeded && !title) {
            fieldError(el, 'sgTitle', I18n.t('segment_title'));
            return;
          }

          if (seg) DB.updateSegment(seg.id, { title, section }, Auth.getUser());
          else     DB.addSegment({ title, section }, Auth.getUser());

          api.close();
          UI.toast(I18n.t('segment_saved'), 'success');
        });
      }
    });
  }

  /* =============================================================
     نافذة إضافة مشارك (طالب مسجل أو اسم حر)
     ============================================================= */
  function openParticipantModal(segId) {
    const seg = DB.findSegment(segId);
    if (!seg) return;

    const students = DB.getStudents(seg.section);
    if (!students.length && !Auth.isAdmin()) {
      /* لا طلاب في المجموعة — يبقى خيار الاسم الحر متاحاً */
    }

    const studentOpts = [{ value: '', label: '—' }].concat(
      students.map(s => ({
        value: s.id,
        label: s.name + (s.age ? ' (' + s.age + ')' : '') +
               ' — ' + (Students.teacherName(s) || '—')
      }))
    );

    UI.modal({
      title: '👤 ' + I18n.t('add_participant') + ' — ' + esc(DB.segmentTitle(seg)),
      body: `
        <p class="text-muted" style="font-size:.88rem;margin-bottom:.9rem">
          ${esc(I18n.t('choose_student'))}
        </p>
        ${students.length ? UI.fieldHTML({
          id: 'ptStudent', label: I18n.t('pick_student'), type: 'select',
          value: '', options: studentOpts
        }) : ''}
        ${UI.fieldHTML({
          id: 'ptFree', label: I18n.t('free_name'),
          placeholder: '...'
        })}
        <p class="login-error hidden" id="ptErr" role="alert"></p>
      `,
      footer: `
        <button type="button" class="btn btn-ghost" data-close>${esc(I18n.t('cancel'))}</button>
        <button type="button" class="btn btn-primary" id="ptSave">${esc(I18n.t('add'))}</button>
      `,
      onMount(el, api) {
        /* اختيار طالب يفرغ حقل الاسم الحر والعكس */
        const sel  = el.querySelector('#ptStudent');
        const free = el.querySelector('#ptFree');
        if (sel) sel.addEventListener('change', () => { if (sel.value) free.value = ''; });
        if (free) free.addEventListener('input', () => { if (sel && free.value) sel.value = ''; });

        el.querySelector('#ptSave').addEventListener('click', () => {
          const errEl = el.querySelector('#ptErr');
          errEl.classList.add('hidden');

          let name = null, studentId = null;

          if (sel && sel.value) {
            const st = DB.findStudent(sel.value);
            if (!st) return;
            studentId = st.id;
            name = st.name;
          } else if (free && free.value.trim()) {
            name = free.value.trim();
          }

          if (!name) {
            errEl.textContent = I18n.t('pick_or_type');
            errEl.classList.remove('hidden');
            return;
          }

          /* منع التكرار المطلق في نفس الفقرة */
          const dup = (seg.participants || []).some(p =>
            (studentId && p.studentId === studentId) ||
            (!studentId && p.name === name)
          );
          if (dup) {
            errEl.textContent = I18n.t('already_added');
            errEl.classList.remove('hidden');
            return;
          }

          DB.addParticipant(seg.id, { name, studentId }, Auth.getUser());
          api.close();
          UI.toast(I18n.t('saved'), 'success');
        });
      }
    });
  }

  /* =============================================================
     الحذف (مع تأكيد)
     ============================================================= */
  async function deleteSegmentFlow(id) {
    const seg = DB.findSegment(id);
    if (!seg || !segEditable(seg)) return;

    const ok = await UI.confirmDelete(
      I18n.t('delete_segment_confirm', { title: DB.segmentTitle(seg) })
    );
    if (!ok) return;

    DB.deleteSegment(id);
    UI.toast(I18n.t('segment_deleted'), 'success');
  }

  /* =============================================================
     إعادة الترتيب: تبديل مع الجار وإعادة ترقيم القسم كاملاً
     ============================================================= */
  function moveSegment(segId, dir) {
    const seg = DB.findSegment(segId);
    if (!seg) return;

    const list = DB.getSegments(seg.section);   /* مرتبة حالياً */
    const idx  = list.findIndex(s => s.id === segId);
    const nIdx = dir === 'up' ? idx - 1 : idx + 1;

    if (idx < 0 || nIdx < 0 || nIdx >= list.length) return;

    /* تبديل */
    const tmp = list[idx]; list[idx] = list[nIdx]; list[nIdx] = tmp;

    /* إعادة ترقيم 0..n ثم الحفظ */
    list.forEach((s, i) => {
      if ((s.order || 0) !== i) {
        DB.updateSegment(s.id, { order: i }, Auth.getUser());
      }
    });
  }

  /* =============================================================
     ربط الأحداث (تفويض) + التشغيل
     ============================================================= */
  function init() {
    const el = document.getElementById('view-ceremony');
    if (el) {
      el.addEventListener('click', e => {
        const btn = e.target.closest && e.target.closest('[data-action]');
        if (!btn || btn.disabled) return;

        const action = btn.getAttribute('data-action');
        const id     = btn.getAttribute('data-id');
        const part   = btn.getAttribute('data-part');

        switch (action) {
          case 'add-segment':  openSegmentModal(id === 'adults' || id === 'kids' ? id : null); break;
          case 'edit-segment': openSegmentModal(null, id);  break;
          case 'del-segment':  deleteSegmentFlow(id);       break;
          case 'seg-up':       moveSegment(id, 'up');       break;
          case 'seg-down':     moveSegment(id, 'down');     break;
          case 'add-part':     openParticipantModal(id);    break;
          case 'rm-part':      removeParticipantFlow(id, part); break;
          case 'pdf-ceremony': PDFExport.ceremonyProgram(); break;
        }
      });
    }

    DB.onChange(render);
    I18n.onLangChange(render);
    window.addEventListener('sc:authchange', render);

    render();
  }

  /* إزالة مشارك (مع تأكيد خفيف) */
  async function removeParticipantFlow(segId, partId) {
    const seg = DB.findSegment(segId);
    if (!seg) return;
    const part = (seg.participants || []).find(p => p.id === partId);
    if (!part || !canRemoveParticipant(seg, part)) return;

    DB.removeParticipant(segId, partId, Auth.getUser());
    UI.toast(I18n.t('deleted'), 'success');
  }

  init();

  /* ---------- الواجهة العامة للوحدة ---------- */
  return {
    render
  };
})();
