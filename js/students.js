'use strict';

/* =========================================================
   نظام الاختتام الصيفي — شاشات الكبار والصغار
   الملف رقم (8) من (12) : js/students.js
   ---------------------------------------------------------
   لكل مجموعة (adults / kids):
     1) شريط إحصائيات
     2) بطاقة الطلاب (بحث + إضافة/تعديل/حذف + PDF كشف الأسماء)
     3) بطاقة لكل اختبار: الدرجة العظمى 🎯 + متوسط + ترتيب
        تلقائي بالنسبة المئوية (ذهبية/فضية/برونزية) + تعديل
        الاختبار ودرجته العظمى + تقرير PDF بضغطة واحدة
     4) الترتيب النهائي للمجموعة (متوسط النسب) + PDF
   ---------------------------------------------------------
   قواعد الصلاحيات المطبقة هنا:
     • القراءة: للجميع (المشرف وكل الأساتذة يرون كل شيء)
     • التعديل/الحذف: المشرف ← كل شيء | الأستاذ ← إدخالاته
       والإدخالات النظامية المشتركة (system) مثل الاختبارات
       السبعة الافتراضية
     • تسجيل الدرجات: متاح للجميع — درجة أدخلها مستخدم آخر
       تظهر مقفلة 🔒 لغير صاحبها (والمشرف يفتحها جميعاً)
   ========================================================= */

const Students = (() => {

  const esc = UI.esc;
  const C   = 'style="text-align:center"';   // توسيط خلايا الجداول

  /* حالة البحث لكل مجموعة */
  const filters = { adults: '', kids: '' };

  /* =============================================================
     مفاتيح ترجمة إضافية للنماذج (تُدمج في القاموس عند التحميل —
     لا حاجة لتعديل i18n.js)
     ============================================================= */
  (function extendI18n() {
    const extra = {
      ar: {
        group: 'المجموعة',
        icon: 'الرمز',
        score_locked: 'أدخلها مستخدم آخر — التعديل لصاحبها أو للمشرف العام',
        auto_title_hint: 'اتركه فارغاً للاحتفاظ بالاسم التلقائي المترجم',
        top_avg: 'أعلى متوسط',
        score_clear_hint: 'اترك الحقل فارغاً لحذف الدرجة',
        no_results: 'لا نتائج مطابقة للبحث'
      },
      am: {
        group: 'ቡድን',
        icon: 'ምልክት',
        score_locked: 'በሌላ ተጠቃሚ ገብቷል — ማስተካከል የሚቻለው በባለቤቱ ወይም በሱፐርቫይዘሩ ብቻ ነው',
        auto_title_hint: 'በራስ-ሰር የተተረጎመውን ስም ለመቀጠል ባዶ ይተዉት',
        top_avg: 'ከፍተኛ አማካይ',
        score_clear_hint: 'ነጥቡን ለማጥፋት ማስገቢያውን ባዶ ይተዉት',
        no_results: 'ተመሳሳይ ውጤት አልተገኘም'
      },
      en: {
        group: 'Group',
        icon: 'Icon',
        score_locked: 'Entered by another user — editable by its owner or the supervisor',
        auto_title_hint: 'Leave empty to keep the auto-translated name',
        top_avg: 'Top average',
        score_clear_hint: 'Leave a field empty to clear the score',
        no_results: 'No matching results'
      }
    };
    Object.keys(extra).forEach(lang => {
      if (I18N_DICT[lang]) Object.assign(I18N_DICT[lang], extra[lang]);
    });
  })();

  /* =============================================================
     الصلاحيات — نسخة موسعة عن DB.canEdit:
     الإدخالات النظامية (system) مشتركة يعدلها الجميع
     ============================================================= */
  function canEditEntry(entry) {
    const user = Auth.getUser();
    if (!user || !entry) return false;
    if (user.role === 'admin') return true;
    const owner = entry.createdBy || entry.addedBy || entry.updatedBy;
    return owner === user.id || owner === 'system';
  }

  /* اسم أستاذ الطالب */
  function teacherName(student) {
    if (!student || !student.teacherId) return '—';
    const acc = DB.findAccount(student.teacherId);
    return acc ? DB.accountName(acc) : '—';
  }

  /* =============================================================
     مساعدو أزرار (تحمل data-action + data-id للتفويض)
     ============================================================= */
  function hbtn(label, action, id, cls, title, disabled) {
    return `<button type="button" class="btn ${cls || 'btn-ghost'}" data-action="${action}"` +
      (id ? ` data-id="${esc(id)}"` : '') +
      (title ? ` title="${esc(title)}"` : '') +
      (disabled ? ' disabled' : '') + `>${esc(label)}</button>`;
  }

  function rowBtn(action, id, icon, title, disabled) {
    const cls = action.indexOf('del') === 0 ? 'del' : 'edit';
    return `<button type="button" class="act-btn ${cls}" data-action="${action}"` +
      ` data-id="${esc(id)}" title="${esc(title)}"${disabled ? ' disabled' : ''}>${icon}</button>`;
  }

  /* إظهار خطأ تحت حقل نموذج (يُمسح عند الكتابة) */
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
    renderGroup('adults', document.getElementById('view-adults'));
    renderGroup('kids',   document.getElementById('view-kids'));
  }

  /* يعيد رسم مجموعة واحدة مع الحفاظ على تركيز حقل البحث وموضع المؤشر */
  function renderGroup(group, container) {
    if (!container) return;

    const active = document.activeElement;
    let refocusId = null, caret = 0;
    if (active && active.id && container.contains(active)) {
      refocusId = active.id;
      try {
        caret = (active.selectionStart != null)
          ? active.selectionStart
          : (active.value ? active.value.length : 0);
      } catch (e) { caret = 0; }
    }

    container.innerHTML = groupHTML(group);

    if (refocusId) {
      const el = container.querySelector('#' + refocusId);
      if (el) {
        el.focus();
        try {
          if (el.setSelectionRange && el.value != null) el.setSelectionRange(caret, caret);
        } catch (e) { /* تجاهل */ }
      }
    }
  }

  /* ---------- هيكل المجموعة الكامل ---------- */
  function groupHTML(group) {
    const students = DB.getStudents(group);
    const exams    = DB.getExams(group);
    const ranking  = DB.overallRanking(group);
    const totalScored = exams.reduce((n, ex) => n + DB.rankedForExam(ex.id).length, 0);
    const topAvg = ranking.length ? ranking[0].avgPct + '%' : '—';

    return UI.statsGrid([
      { icon: '👨‍🎓', value: students.length, label: I18n.t('students') },
      { icon: '📝', value: exams.length,      label: I18n.t('exams') },
      { icon: '✍️', value: totalScored,       label: I18n.t('grades') },
      { icon: '🥇', value: topAvg,            label: I18n.t('top_avg') }
    ]) +
    studentsCard(group, students) +
    examsSection(group, exams) +
    rankingSection(group, ranking);
  }

  /* ---------- بطاقة الطلاب ---------- */
  function studentsCard(group, all) {
    const q = (filters[group] || '').trim().toLowerCase();
    const list = q ? all.filter(s => String(s.name).toLowerCase().includes(q)) : all;

    const tools =
      `<input type="search" id="search-${group}" class="search-input"
              placeholder="${esc(I18n.t('search_student'))}"
              value="${esc(filters[group] || '')}" autocomplete="off">` +
      hbtn('📄', 'pdf-students', group, 'btn-ghost btn-sm icon-btn', I18n.t('export_pdf_report')) +
      hbtn(I18n.t('add_student'), 'add-student', null, 'btn-primary btn-sm');

    let body;
    if (!all.length) {
      body = `<div class="card-body">${UI.emptyState('👨‍🎓', I18n.t('no_students'))}</div>`;
    } else if (!list.length) {
      body = `<div class="card-body">${UI.emptyState('🔍', I18n.t('no_results'))}</div>`;
    } else {
      const trs = list.map((s, i) => {
        const editable = canEditEntry(s);
        return `<tr>
          <td ${C}>${i + 1}</td>
          <td><span class="student-name">${esc(s.name)}</span></td>
          <td ${C}>${s.age || '—'}</td>
          <td>${esc(teacherName(s))}</td>
          <td class="text-muted">${esc(s.notes || '—')}</td>
          <td ${C} style="white-space:nowrap">
            ${rowBtn('edit-student', s.id, '✏️',
                editable ? I18n.t('edit') : I18n.t('edit_restricted'), !editable)}
            ${rowBtn('del-student', s.id, '🗑️',
                editable ? I18n.t('delete') : I18n.t('edit_restricted'), !editable)}
          </td>
        </tr>`;
      }).join('');

      body = `<div class="card-body p-0"><div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th ${C}>#</th>
            <th>${esc(I18n.t('student_name'))}</th>
            <th ${C}>${esc(I18n.t('age'))}</th>
            <th>${esc(I18n.t('assigned_teacher'))}</th>
            <th>${esc(I18n.t('notes'))}</th>
            <th ${C}>${esc(I18n.t('actions'))}</th>
          </tr></thead>
          <tbody>${trs}</tbody>
        </table></div></div>`;
    }

    return UI.card({
      icon: '👨‍🎓',
      title: `${esc(I18n.t('students'))} <span class="max-badge">` +
             `${esc(I18n.t('student_count', { count: all.length }))}</span>`,
      tools,
      body
    });
  }

  /* ---------- قسم الاختبارات ---------- */
  function examsSection(group, exams) {
    let html = `<div class="row-between" style="margin:1.4rem 0 .8rem">
      <h2 class="section-title" style="margin:0;flex:1">📝 ${esc(I18n.t('exams'))}</h2>
      ${hbtn(I18n.t('add_exam'), 'add-exam', null, 'btn-primary btn-sm')}
    </div>`;

    if (!exams.length) {
      html += UI.card({
        title: esc(I18n.t('exams')),
        body: `<div class="card-body">${UI.emptyState('📝', I18n.t('no_exams'))}</div>`
      });
    } else {
      html += exams.map(examCard).join('');
    }
    return html;
  }

  /* ---------- بطاقة اختبار واحد: العظمى + الترتيب التلقائي ---------- */
  function examCard(ex) {
    const editable = canEditEntry(ex);
    const rows = DB.rankedForExam(ex.id);       /* مرتبة تلقائياً 🥇 */
    const avg  = DB.examAveragePct(ex.id);

    const tools =
      hbtn('✍️ ' + I18n.t('enter_scores'), 'open-scores', ex.id, 'btn-primary btn-sm') +
      hbtn('📄', 'pdf-exam', ex.id, 'btn-ghost btn-sm icon-btn', I18n.t('export_pdf_report')) +
      hbtn('✏️', 'edit-exam', ex.id, 'btn-ghost btn-sm icon-btn',
           editable ? I18n.t('edit_exam') : I18n.t('edit_restricted'), !editable) +
      hbtn('🗑️', 'del-exam', ex.id, 'btn-soft-danger btn-sm icon-btn',
           editable ? I18n.t('delete') : I18n.t('edit_restricted'), !editable);

    let body;
    if (!rows.length) {
      body = `<div class="card-body">${UI.emptyState('✍️', I18n.t('no_scores'))}</div>`;
    } else {
      const trs = rows.map((r, i) => `
        <tr>
          <td ${C}>${UI.medal(i + 1)}</td>
          <td><span class="student-name">${esc(r.student.name)}</span>
              <div class="student-meta">${esc(teacherName(r.student))}</div></td>
          <td ${C}><b>${r.score}</b> <span class="student-meta">/ ${ex.maxScore}</span></td>
          <td>
            ${UI.progress(r.pct)}
            <div class="student-meta">${r.pct}%</div>
          </td>
          <td ${C}>${UI.gradePill(r.pct)}</td>
        </tr>`).join('');

      body = `<div class="card-body p-0"><div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th ${C}>${esc(I18n.t('rank'))}</th>
            <th>${esc(I18n.t('student_name'))}</th>
            <th ${C}>${esc(I18n.t('score'))}</th>
            <th>${esc(I18n.t('percentage'))}</th>
            <th ${C}>${esc(I18n.t('grade_level'))}</th>
          </tr></thead>
          <tbody>${trs}</tbody>
        </table></div></div>`;
    }

    const titleHTML =
      esc(DB.examTitle(ex)) + ' ' + UI.maxBadge(ex.maxScore) +
      (avg !== null
        ? ` <span class="grade-pill ${DB.gradeInfo(avg).pill}">` +
          `${esc(I18n.t('avg'))}: ${avg}%</span>`
        : '');

    return UI.card({
      cls: 'exam-card',
      icon: esc(ex.icon || '📝'),
      title: titleHTML,
      tools,
      body
    });
  }

  /* ---------- الترتيب النهائي للمجموعة ---------- */
  function rankingSection(group, ranking) {
    let html = `<div class="row-between" style="margin:1.4rem 0 .8rem">
      <h2 class="section-title" style="margin:0;flex:1">🏆 ${esc(I18n.t('ranking'))}</h2>
      ${hbtn('📄 ' + I18n.t('export_pdf'), 'pdf-ranking', group, 'btn-ghost btn-sm')}
    </div>`;

    if (!ranking.length) {
      return html + UI.card({
        title: esc(I18n.t('ranking')),
        body: `<div class="card-body">${UI.emptyState('🏆', I18n.t('no_scores'))}</div>`
      });
    }

    const trs = ranking.map((r, i) => `
      <tr>
        <td ${C}>${UI.medal(i + 1)}</td>
        <td><span class="student-name">${esc(r.student.name)}</span></td>
        <td>${esc(teacherName(r.student))}</td>
        <td ${C}><b>${r.sumScore}</b> <span class="student-meta">/ ${r.sumMax}</span></td>
        <td>${UI.progress(r.avgPct)}<div class="student-meta">${r.avgPct}%</div></td>
        <td ${C}>${UI.gradePill(r.avgPct)}</td>
      </tr>`).join('');

    html += UI.card({
      title: '🏅 ' + esc(I18n.t('sorted_by_pct')),
      body: `<div class="card-body p-0"><div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th ${C}>${esc(I18n.t('rank'))}</th>
            <th>${esc(I18n.t('student_name'))}</th>
            <th>${esc(I18n.t('assigned_teacher'))}</th>
            <th ${C}>${esc(I18n.t('total'))}</th>
            <th>${esc(I18n.t('percentage'))}</th>
            <th ${C}>${esc(I18n.t('grade_level'))}</th>
          </tr></thead>
          <tbody>${trs}</tbody>
        </table></div></div>`
    });

    return html;
  }

  /* =============================================================
     نافذة إضافة/تعديل طالب
     ============================================================= */
  function openStudentModal(group, studentId) {
    const st = studentId ? DB.findStudent(studentId) : null;
    if (studentId && !st) return;
    if (st && !canEditEntry(st)) return;

    const user = Auth.getUser();
    const teachers = DB.getAccounts().filter(a => a.role === 'teacher');

    const defTeacher = st ? (st.teacherId || '')
      : (user && user.role === 'teacher' ? user.id
        : (teachers[0] ? teachers[0].id : ''));

    const teacherOpts = [{ value: '', label: '—' }].concat(
      teachers.map(t => ({ value: t.id, label: DB.accountName(t) }))
    );

    UI.modal({
      title: (st ? '✏️ ' + I18n.t('edit_student') : '➕ ' + I18n.t('add_student')),
      body: `
        ${UI.fieldHTML({
          id: 'stName', label: I18n.t('student_name'),
          value: st ? st.name : '', required: true
        })}
        <div class="form-grid">
          ${UI.fieldHTML({
            id: 'stGroup', label: I18n.t('group'), type: 'select',
            value: st ? st.group : group,
            options: [
              { value: 'adults', label: I18n.t('adults_group') },
              { value: 'kids',   label: I18n.t('kids_group') }
            ]
          })}
          ${UI.fieldHTML({
            id: 'stAge', label: I18n.t('age') + ' (' + I18n.t('optional') + ')',
            type: 'number', value: st && st.age ? st.age : '', min: 3, step: 1
          })}
          ${UI.fieldHTML({
            id: 'stTeacher', label: I18n.t('assigned_teacher'),
            type: 'select', value: defTeacher, options: teacherOpts
          })}
        </div>
        ${UI.fieldHTML({
          id: 'stNotes', label: I18n.t('notes') + ' (' + I18n.t('optional') + ')',
          type: 'textarea', value: st ? st.notes : '', rows: 2
        })}
      `,
      footer: `
        <button type="button" class="btn btn-ghost" data-close>${esc(I18n.t('cancel'))}</button>
        <button type="button" class="btn btn-primary" id="stSave">${esc(I18n.t('save'))}</button>
      `,
      onMount(el, api) {
        el.querySelector('#stSave').addEventListener('click', () => {
          const name = el.querySelector('#stName').value.trim();
          if (!name) { fieldError(el, 'stName', I18n.t('student_name')); return; }

          const ageRaw = el.querySelector('#stAge').value.trim();
          if (ageRaw !== '') {
            const age = Number(ageRaw);
            if (!isFinite(age) || age < 3 || age > 99) {
              fieldError(el, 'stAge', I18n.t('invalid_score')); return;
            }
          }

          const data = {
            name,
            group: el.querySelector('#stGroup').value,
            age: ageRaw !== '' ? Number(ageRaw) : null,
            teacherId: el.querySelector('#stTeacher').value || null,
            notes: el.querySelector('#stNotes').value
          };

          if (st) DB.updateStudent(st.id, data, Auth.getUser());
          else    DB.addStudent(data, Auth.getUser());

          api.close();
          UI.toast(I18n.t('student_saved'), 'success');
        });
      }
    });
  }

  /* =============================================================
     نافذة إنشاء/تعديل اختبار (مع حقل الدرجة العظمى 🎯)
     ============================================================= */
  function openExamModal(group, examId) {
    const ex = examId ? DB.findExam(examId) : null;
    if (examId && !ex) return;
    if (ex && !canEditEntry(ex)) return;

    const seeded = !!(ex && ex.titleKey);   /* اختبار افتراضي مترجم */

    UI.modal({
      title: (ex ? '✏️ ' + I18n.t('edit_exam') : '➕ ' + I18n.t('add_exam')) +
             (ex ? ' — ' + esc(DB.examTitle(ex)) : ''),
      body: `
        ${UI.fieldHTML({
          id: 'exTitle', label: I18n.t('exam_title'),
          value: ex ? (ex.title || '') : '',
          required: !seeded,
          placeholder: seeded ? DB.examTitle(ex) : '',
          hint: seeded ? I18n.t('auto_title_hint') : null
        })}
        <div class="form-grid">
          ${UI.fieldHTML({
            id: 'exIcon', label: I18n.t('icon'),
            value: ex ? (ex.icon || '📝') : '📝'
          })}
          ${UI.fieldHTML({
            id: 'exMax', label: I18n.t('max_score'), type: 'number',
            value: ex ? ex.maxScore : 25, min: 1, step: 1,
            hint: I18n.t('max_score_hint'), required: true
          })}
          ${UI.fieldHTML({
            id: 'exGroup', label: I18n.t('group'), type: 'select',
            value: ex ? ex.group : group,
            options: [
              { value: 'adults', label: I18n.t('adults_group') },
              { value: 'kids',   label: I18n.t('kids_group') }
            ]
          })}
        </div>
      `,
      footer: `
        <button type="button" class="btn btn-ghost" data-close>${esc(I18n.t('cancel'))}</button>
        <button type="button" class="btn btn-primary" id="exSave">${esc(I18n.t('save'))}</button>
      `,
      onMount(el, api) {
        el.querySelector('#exSave').addEventListener('click', () => {
          const title = el.querySelector('#exTitle').value.trim();
          const icon  = el.querySelector('#exIcon').value.trim() || '📝';
          const max   = Number(el.querySelector('#exMax').value);
          const grp   = el.querySelector('#exGroup').value;

          if (!seeded && !title) {
            fieldError(el, 'exTitle', I18n.t('exam_title')); return;
          }
          if (!isFinite(max) || max < 1) {
            fieldError(el, 'exMax', I18n.t('max_score')); return;
          }

          if (ex) DB.updateExam(ex.id, { title, icon, maxScore: max, group: grp }, Auth.getUser());
          else    DB.addExam({ title, icon, maxScore: max, group: grp }, Auth.getUser());

          api.close();
          UI.toast(I18n.t('exam_saved'), 'success');
        });
      }
    });
  }

  /* =============================================================
     نافذة تسجيل الدرجات — لكل طلاب المجموعة دفعة واحدة
     ============================================================= */
  function openScoresModal(examId) {
    const ex = DB.findExam(examId);
    if (!ex) return;

    const user  = Auth.getUser();
    const admin = Auth.isAdmin();
    const students = DB.getStudents(ex.group);

    if (!students.length) {
      UI.toast(I18n.t('no_students'), 'error');
      return;
    }

    const trs = students.map(st => {
      const sc = DB.getScore(examId, st.id);
      const locked = sc && sc.updatedBy && sc.updatedBy !== (user && user.id) && !admin;
      const curPct = sc ? DB.pct(sc.score, ex.maxScore) : null;

      return `<tr data-id="${esc(st.id)}">
        <td><span class="student-name">${esc(st.name)}</span></td>
        <td class="student-meta">${esc(teacherName(st))}</td>
        <td ${C}>
          ${locked
            ? `🔒 <input type="number" class="score-input" value="${sc.score}" disabled
                 title="${esc(I18n.t('score_locked'))}">`
            : `<input type="number" class="score-input" data-score data-id="${esc(st.id)}"
                 min="0" max="${ex.maxScore}" step="0.5"
                 value="${sc ? sc.score : ''}">`}
        </td>
        <td ${C} class="pct-cell" data-id="${esc(st.id)}">
          ${curPct !== null ? curPct + '%' : '—'}
        </td>
      </tr>`;
    }).join('');

    UI.modal({
      title: '✍️ ' + esc(I18n.t('enter_scores')) + ' — ' +
             esc(DB.examTitle(ex)) + ' ' + UI.maxBadge(ex.maxScore),
      wide: true,
      body: `
        <div class="row" style="margin-bottom:.8rem">
          ${UI.maxBadge(ex.maxScore)}
          <span class="student-meta">${esc(I18n.t('score_clear_hint'))}</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>${esc(I18n.t('student_name'))}</th>
              <th>${esc(I18n.t('assigned_teacher'))}</th>
              <th ${C}>${esc(I18n.t('score'))}
                  (${esc(I18n.t('out_of', { max: ex.maxScore }))})</th>
              <th ${C}>${esc(I18n.t('percentage'))}</th>
            </tr></thead>
            <tbody>${trs}</tbody>
          </table>
        </div>
      `,
      footer: `
        <button type="button" class="btn btn-ghost" data-close>${esc(I18n.t('cancel'))}</button>
        <button type="button" class="btn btn-primary" id="scSave">${esc(I18n.t('save_scores'))}</button>
      `,
      onMount(el, api) {

        /* تحديث النسبة حياً أثناء الكتابة */
        el.addEventListener('input', e => {
          const inp = e.target.closest && e.target.closest('[data-score]');
          if (!inp) return;
          const cell = el.querySelector('.pct-cell[data-id="' + inp.dataset.id + '"]');
          if (!cell) return;
          const v = inp.value.trim();
          if (v === '' || isNaN(Number(v))) { cell.textContent = '—'; return; }
          cell.textContent = DB.pct(Number(v), ex.maxScore) + '%';
        });

        /* الحفظ مع التحقق من الحدود */
        el.querySelector('#scSave').addEventListener('click', () => {
          const inputs = el.querySelectorAll('[data-score]');
          let hasError = false;
          const changes = [];

          inputs.forEach(inp => {
            inp.classList.remove('input-error');
            const raw = inp.value.trim();
            const sid = inp.dataset.id;

            if (raw === '') { changes.push({ sid, val: null }); return; }

            const num = Number(raw);
            if (!isFinite(num) || num < 0 || num > ex.maxScore) {
              inp.classList.add('input-error');
              hasError = true;
              return;
            }
            changes.push({ sid, val: num });
          });

          if (hasError) {
            UI.toast(I18n.t('score_exceeds_max', { max: ex.maxScore }), 'error');
            return;
          }

          /* حفظ المتغيّر فقط (توفيراً للعمليات) */
          changes.forEach(ch => {
            const existing = DB.getScore(examId, ch.sid);
            if (ch.val === null && !existing) return;                       /* لا شيء */
            if (existing && ch.val !== null &&
                Number(existing.score) === ch.val) return;                  /* لم يتغير */
            DB.setScore(examId, ch.sid, ch.val, Auth.getUser());
          });

          api.close();
          UI.toast(I18n.t('scores_saved'), 'success');
        });
      }
    });
  }

  /* =============================================================
     عمليات الحذف (مع تأكيد)
     ============================================================= */
  async function deleteStudentFlow(id) {
    const st = DB.findStudent(id);
    if (!st || !canEditEntry(st)) return;

    const ok = await UI.confirmDelete(
      I18n.t('delete_student_confirm', { name: st.name })
    );
    if (!ok) return;

    DB.deleteStudent(id);
    UI.toast(I18n.t('student_deleted'), 'success');
  }

  async function deleteExamFlow(id) {
    const ex = DB.findExam(id);
    if (!ex || !canEditEntry(ex)) return;

    const ok = await UI.confirmDelete(I18n.t('delete_exam_confirm'));
    if (!ok) return;

    DB.deleteExam(id);
    UI.toast(I18n.t('exam_deleted'), 'success');
  }

  /* =============================================================
     ربط الأحداث (تفويض) + التشغيل
     ============================================================= */
  function makeClickHandler(group) {
    return function (e) {
      const btn = e.target.closest && e.target.closest('[data-action]');
      if (!btn || btn.disabled) return;

      const action = btn.getAttribute('data-action');
      const id     = btn.getAttribute('data-id');

      switch (action) {
        case 'add-student':  openStudentModal(group);        break;
        case 'edit-student': openStudentModal(group, id);    break;
        case 'del-student':  deleteStudentFlow(id);          break;
        case 'add-exam':     openExamModal(group);           break;
        case 'edit-exam':    openExamModal(group, id);       break;
        case 'del-exam':     deleteExamFlow(id);             break;
        case 'open-scores':  openScoresModal(id);            break;
        case 'pdf-exam':     PDFExport.examReport(id);       break;
        case 'pdf-ranking':  PDFExport.overallRanking(group);break;
        case 'pdf-students': PDFExport.studentsList(group);  break;
      }
    };
  }

  function makeInputHandler(group) {
    return function (e) {
      if (e.target && e.target.id === 'search-' + group) {
        filters[group] = e.target.value;
        renderGroup(group, document.getElementById('view-' + group));
      }
    };
  }

  function init() {
    ['adults', 'kids'].forEach(group => {
      const el = document.getElementById('view-' + group);
      if (!el) return;
      el.addEventListener('click', makeClickHandler(group));
      el.addEventListener('input', makeInputHandler(group));
    });

    DB.onChange(render);                        /* أي تغيير بيانات */
    I18n.onLangChange(render);                  /* تبديل اللغة */
    window.addEventListener('sc:authchange', render);  /* دخول/خروج */

    render();
  }

  init();

  /* ---------- الواجهة العامة (يستخدمها ceremony.js وadmin.js) ---------- */
  return {
    render,
    canEditEntry,
    teacherName
  };
})();
