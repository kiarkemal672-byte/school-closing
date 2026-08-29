'use strict';

/* =========================================================
   نظام الاختتام الصيفي — لوحة المشرف العام 🛡️
   الملف رقم (10) من (12) : js/admin.js
   ---------------------------------------------------------
   المحتويات:
     1) إحصائيات النظام الشاملة
     2) إدارة الحسابات: إنشاء / تعديل / حذف
        (+ ربط زر «➕ زيادة حساب» في الشريط العلوي)
     3) جدول مراقبة نشاط الأساتذة (من أضاف كم طالباً/اختباراً...)
     4) النسخ الاحتياطي: تنزيل ملف JSON + استعادة منه
     5) إعادة الضبط الكامل (تأكيد مزدوج)
   ---------------------------------------------------------
   الحمايات:
     • لا تُعرض اللوحة إلا للمشرف (app.js يخفي التبويب —
       وهنا حارس إضافي عند كل رسم)
     • لا يمكن حذف الحساب الحالي
     • لا يمكن حذف آخر حساب مشرف
     • اسم المستخدم فريد (تحقق عند الإنشاء والتعديل)
   ========================================================= */

const Admin = (() => {

  const esc = UI.esc;
  const C   = 'style="text-align:center"';

  /* =============================================================
     مفاتيح ترجمة إضافية (تُدمج في القاموس — لا تلمس i18n.js)
     ============================================================= */
  (function extendI18n() {
    const extra = {
      ar: {
        students_added: 'طلاب أضافهم',
        exams_created: 'اختبارات أنشأها',
        segments_created: 'فقرات أضافها',
        scores_entered: 'درجات سجلها',
        activity: 'النشاط',
        no_activity: 'لا نشاط بعد',
        total_entries: 'إجمالي الإدخالات',
        scores_entries: 'إدخالات الدرجات',
        reset_all: '⚠️ إعادة ضبط المصنع',
        reset_confirm_1: 'سيتم حذف كل البيانات (الطلاب والدرجات والاختبارات المخصصة والفقرات المخصصة) والعودة للإعدادات الافتراضية. هل أنت متأكد؟',
        reset_confirm_2: 'تأكيد أخير: هل تريد فعلاً محو كل شيء؟ لا يمكن التراجع!',
        reset_done: 'تمت إعادة الضبط — البيانات الافتراضية أعيدت ✓',
        restore_confirm: 'استعادة النسخة ستستبدل كل البيانات الحالية. هل تريد المتابعة؟',
        choose_backup_file: 'اختر ملف النسخة الاحتياطية (.json)',
        students_of_teacher: 'طلابه',
        username_hint: 'حروف إنجليزية وأرقام فقط (مثال: ahmed1)'
      },
      am: {
        students_added: 'ተማሪዎች ጨመረ',
        exams_created: 'ፈተናዎች ፈጠረ',
        segments_created: 'ክፍሎች ጨመረ',
        scores_entered: 'ነጥቦች መዘገበ',
        activity: 'እንቅስቃሴ',
        no_activity: 'እስካሁን እንቅስቃሴ የለም',
        total_entries: 'ጠቅላላ ግብዓቶች',
        scores_entries: 'የነጥብ ግብዓቶች',
        reset_all: '⚠️ ፋብሪካ ዳግም አስቀምጥ',
        reset_confirm_1: 'ሁሉም መረጃ ይጠፋል (ተማሪዎች፣ ነጥቦች፣ ብጁ ፈተናዎች፣ ብጁ ክፍሎች) እና ወደ ነባር ተመልሶ ይሆናል። እርግጠኛ ነዎት?',
        reset_confirm_2: 'የመጨረሻ ማረጋገጫ፦ በእውነት ሁሉንም ማጥፋት ይፈልጋሉ? መመለስ አይቻልም!',
        reset_done: 'ፋብሪካ ዳግም ተተከለ — ነባር መረጃዎች ተመልሰዋል ✓',
        restore_confirm: 'መጠባበቂያውን መልስ አሁኑን መረጃ በሙሉ ይተካል። መቀጠል ይፈልጋሉ?',
        choose_backup_file: 'የመጠባበቂያ ፋይል ይምረጡ (.json)',
        students_of_teacher: 'ተማሪዎቹ',
        username_hint: 'የእንግሊዝኛ ፊደላትና ቁጥሮች ብቻ (ምሳሌ፦ ahmed1)'
      },
      en: {
        students_added: 'Students added',
        exams_created: 'Exams created',
        segments_created: 'Segments added',
        scores_entered: 'Scores entered',
        activity: 'Activity',
        no_activity: 'No activity yet',
        total_entries: 'Total entries',
        scores_entries: 'Score entries',
        reset_all: '⚠️ Factory Reset',
        reset_confirm_1: 'All data will be deleted (students, scores, custom exams, custom segments) and defaults restored. Are you sure?',
        reset_confirm_2: 'Final confirmation: really wipe everything? This cannot be undone!',
        reset_done: 'Factory reset complete — defaults restored ✓',
        restore_confirm: 'Restoring the backup will replace ALL current data. Continue?',
        choose_backup_file: 'Choose a backup file (.json)',
        students_of_teacher: 'His students',
        username_hint: 'English letters and digits only (e.g. ahmed1)'
      }
    };
    Object.keys(extra).forEach(lang => {
      if (I18N_DICT[lang]) Object.assign(I18N_DICT[lang], extra[lang]);
    });
  })();

  /* =============================================================
     حارس الصلاحية
     ============================================================= */
  function render() {
    const el = document.getElementById('view-admin');
    if (!el) return;

    /* اللوحة للمشرف فقط — حماية إضافية */
    if (!Auth.isAdmin()) {
      el.innerHTML = '';
      return;
    }

    const s = DB.stats();

    el.innerHTML =
      /* ---------- 1) الإحصائيات ---------- */
      UI.statsGrid([
        { icon: '👨‍🎓', value: s.students,      label: I18n.t('total_students') },
        { icon: '📖', value: s.studentsAdults, label: I18n.t('adults_group') },
        { icon: '🧒', value: s.studentsKids,   label: I18n.t('kids_group') },
        { icon: '📝', value: s.exams,          label: I18n.t('total_exams') },
        { icon: '✍️', value: s.scored,         label: I18n.t('scores_entries') },
        { icon: '🎭', value: s.segments,       label: I18n.t('total_segments') }
      ]) +

      UI.card({
        icon: '🛡️',
        title: esc(I18n.t('admin_panel')),
        tools: `<span class="max-badge">👑 ${esc(I18n.t('role_admin'))}</span>`,
        body: `<div class="card-body">
          <p class="text-muted" style="font-size:.92rem;line-height:1.9">
            ℹ️ ${esc(I18n.t('monitoring_note'))}
          </p>
        </div>`
      }) +

      /* ---------- 2) الحسابات ---------- */
      accountsCard() +

      /* ---------- 3) نشاط الأساتذة ---------- */
      activityCard() +

      /* ---------- 4) النسخ الاحتياطي ---------- */
      backupCard();
  }

  /* =============================================================
     بطاقة الحسابات
     ============================================================= */
  function hbtn(label, action, id, cls, title, disabled) {
    return `<button type="button" class="btn ${cls || 'btn-ghost'}" data-action="${action}"` +
      (id ? ` data-id="${esc(id)}"` : '') +
      (title ? ` title="${esc(title)}"` : '') +
      (disabled ? ' disabled' : '') + `>${esc(label)}</button>`;
  }

  function accountsCard() {
    const accounts = DB.getAccounts();
    const me = Auth.getUser();

    const trs = accounts.map(a => {
      const isMe    = me && a.id === me.id;
      const lastAdmin = a.role === 'admin' && DB.adminCount() <= 1;
      const canDel = !isMe && !lastAdmin;

      /* عدد طلاب الأستاذ المسؤول عنهم */
      const stCount = a.role === 'teacher'
        ? DB.getStudents().filter(st => st.teacherId === a.id).length
        : null;

      return `<tr>
        <td>
          <span class="student-name">${esc(DB.accountName(a))}</span>
          ${isMe ? ' <span class="grade-pill good">' + esc(I18n.t('role_admin')) + ' •</span>' : ''}
          <div class="student-meta">@${esc(a.username)}</div>
        </td>
        <td ${C}>
          <span class="badge-role ${a.role}">${esc(I18n.t(a.role === 'admin' ? 'role_admin' : 'role_teacher'))}</span>
        </td>
        <td ${C}>${stCount !== null ? stCount : '—'}</td>
        <td class="student-meta">${esc(UI.formatDateTime(a.createdAt))}</td>
        <td ${C} style="white-space:nowrap">
          <button type="button" class="act-btn edit" data-action="edit-account"
                  data-id="${esc(a.id)}" title="${esc(I18n.t('edit'))}">✏️</button>
          <button type="button" class="act-btn del" data-action="del-account"
                  data-id="${esc(a.id)}"
                  title="${esc(isMe ? I18n.t('cannot_delete_self')
                          : lastAdmin ? I18n.t('cannot_delete_last_admin')
                          : I18n.t('delete'))}"
                  ${canDel ? '' : ' disabled'}>🗑️</button>
        </td>
      </tr>`;
    }).join('');

    return UI.card({
      icon: '👥',
      title: esc(I18n.t('accounts')) +
        ` <span class="max-badge">${accounts.length}</span>`,
      tools: hbtn(I18n.t('add_account'), 'add-account', null, 'btn-gold btn-sm'),
      body: `<div class="card-body p-0"><div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>${esc(I18n.t('account_name'))}</th>
            <th ${C}>${esc(I18n.t('account_role'))}</th>
            <th ${C}>${esc(I18n.t('students_of_teacher'))}</th>
            <th>${esc(I18n.t('pdf_date'))}</th>
            <th ${C}>${esc(I18n.t('actions'))}</th>
          </tr></thead>
          <tbody>${trs}</tbody>
        </table></div></div>`
    });
  }

  /* =============================================================
     بطاقة نشاط الأساتذة (جدول المراقبة)
     ============================================================= */
  function activityCard() {
    const acts = DB.teacherActivity();

    if (!acts.length) {
      return UI.card({
        title: '📊 ' + esc(I18n.t('records_overview')),
        body: `<div class="card-body">${UI.emptyState('📊', I18n.t('no_activity'))}</div>`
      });
    }

    const trs = acts.map(a => {
      const total = a.students + a.exams + a.segments + a.scores;
      return `<tr>
        <td><span class="student-name">${esc(DB.accountName(a.account))}</span></td>
        <td ${C}><b>${a.students}</b></td>
        <td ${C}><b>${a.exams}</b></td>
        <td ${C}><b>${a.segments}</b></td>
        <td ${C}><b>${a.scores}</b></td>
        <td ${C}><span class="max-badge">Σ ${total}</span></td>
      </tr>`;
    }).join('');

    return UI.card({
      icon: '📊',
      title: esc(I18n.t('records_overview')),
      body: `<div class="card-body p-0"><div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>${esc(I18n.t('teacher'))}</th>
            <th ${C}>${esc(I18n.t('students_added'))}</th>
            <th ${C}>${esc(I18n.t('exams_created'))}</th>
            <th ${C}>${esc(I18n.t('segments_created'))}</th>
            <th ${C}>${esc(I18n.t('scores_entered'))}</th>
            <th ${C}>${esc(I18n.t('total_entries'))}</th>
          </tr></thead>
          <tbody>${trs}</tbody>
        </table></div></div>`
    });
  }

  /* =============================================================
     بطاقة النسخ الاحتياطي والصيانة
     ============================================================= */
  function backupCard() {
    return UI.card({
      icon: '💾',
      title: esc(I18n.t('backup')),
      body: `<div class="card-body">
        <div class="row" style="gap:.6rem">
          ${hbtn('💾 ' + I18n.t('backup'), 'do-backup', null, 'btn-primary btn-sm')}
          ${hbtn('♻️ ' + I18n.t('restore'), 'do-restore', null, 'btn-ghost btn-sm')}
          <span class="grow"></span>
          ${hbtn(I18n.t('reset_all'), 'do-reset', null, 'btn-soft-danger btn-sm')}
        </div>
        <p class="hint mt-2" style="color:var(--text-faint);font-size:.8rem">
          💾 ${esc(I18n.t('choose_backup_file'))}
        </p>
      </div>`
    });
  }

  /* =============================================================
     نافذة إنشاء/تعديل حساب — يعمل أيضاً مع زر الرأس «زيادة حساب»
     ============================================================= */
  function openAccountModal(accountId) {
    if (!Auth.isAdmin()) return;          /* مشرف فقط */

    const acc = accountId ? DB.findAccount(accountId) : null;
    if (accountId && !acc) return;

    /* الاسم المعروض: المخصص أو المترجم (للحسابات الافتراضية) */
    const shownName = acc ? DB.accountName(acc) : '';

    UI.modal({
      title: acc
        ? '✏️ ' + I18n.t('edit_account_title') + ' — ' + esc(shownName)
        : '🟡 ' + I18n.t('add_account_title'),
      gold: !acc,                          /* ترويسة ذهبية للإنشاء */
      body: `
        ${UI.fieldHTML({
          id: 'acName', label: I18n.t('account_name'),
          value: shownName, required: true
        })}
        <div class="form-grid">
          ${UI.fieldHTML({
            id: 'acUsername', label: I18n.t('account_username'),
            value: acc ? acc.username : '', required: true,
            hint: I18n.t('username_hint')
          })}
          ${UI.fieldHTML({
            id: 'acRole', label: I18n.t('account_role'), type: 'select',
            value: acc ? acc.role : 'teacher',
            options: [
              { value: 'teacher', label: '🎓 ' + I18n.t('role_teacher') },
              { value: 'admin',   label: '🛡️ ' + I18n.t('role_admin') }
            ]
          })}
        </div>
        ${UI.fieldHTML({
          id: 'acPassword', label: acc
            ? I18n.t('account_password') + ' (' + I18n.t('optional') + ')'
            : I18n.t('account_password'),
          type: 'password', value: '',
          hint: acc ? I18n.t('keep_password_hint') : I18n.t('password_too_short')
        })}
        <p class="login-error hidden" id="acErr" role="alert"></p>
      `,
      footer: `
        <button type="button" class="btn btn-ghost" data-close>${esc(I18n.t('cancel'))}</button>
        <button type="button" class="btn ${acc ? 'btn-primary' : 'btn-gold'}" id="acSave">
          ${esc(I18n.t('save'))}
        </button>
      `,
      onMount(el, api) {
        el.querySelector('#acSave').addEventListener('click', () => {
          const errEl = el.querySelector('#acErr');
          const showErr = msg => {
            errEl.textContent = msg;
            errEl.classList.remove('hidden');
            errEl.style.animation = 'none';
            void errEl.offsetWidth;
            errEl.style.animation = '';
          };
          errEl.classList.add('hidden');

          const fullName = el.querySelector('#acName').value.trim();
          const username = el.querySelector('#acUsername').value.trim().toLowerCase();
          const role     = el.querySelector('#acRole').value;
          const password = el.querySelector('#acPassword').value;

          /* ---------- تحقق من الاسم الكامل ---------- */
          if (!fullName) { showErr(I18n.t('account_name')); return; }

          /* ---------- تحقق من اسم المستخدم ---------- */
          if (!username) { showErr(I18n.t('account_username')); return; }
          if (!/^[a-z0-9_]{3,20}$/.test(username)) {
            showErr(I18n.t('username_hint')); return;
          }

          /* فريد؟ */
          if (DB.usernameTaken(username, acc ? acc.id : null)) {
            showErr(I18n.t('username_exists')); return;
          }

          /* ---------- تحقق من كلمة المرور ---------- */
          if (!acc && password.length < 4) {
            showErr(I18n.t('password_too_short')); return;
          }
          if (acc && password !== '' && password.length < 4) {
            showErr(I18n.t('password_too_short')); return;
          }

          /* ---------- حماية: لا يُخفض آخر مشرف إلى أستاذ ---------- */
          if (acc && acc.role === 'admin' && role !== 'admin' && DB.adminCount() <= 1) {
            showErr(I18n.t('cannot_delete_last_admin')); return;
          }

          /* ---------- الحفظ ---------- */
          if (acc) {
            DB.updateAccount(acc.id, {
              fullName, username, role,
              password: password !== '' ? password : undefined
            });
          } else {
            DB.addAccount({ fullName, username, role, password });
          }

          api.close();
          UI.toast(I18n.t('account_saved'), 'success');
        });
      }
    });
  }

  /* =============================================================
     حذف حساب (مع التأكيد والحمايات)
     ============================================================= */
  async function deleteAccountFlow(id) {
    if (!Auth.isAdmin()) return;

    const acc = DB.findAccount(id);
    if (!acc) return;

    const me = Auth.getUser();
    if (me && acc.id === me.id) {
      UI.toast(I18n.t('cannot_delete_self'), 'error');
      return;
    }
    if (acc.role === 'admin' && DB.adminCount() <= 1) {
      UI.toast(I18n.t('cannot_delete_last_admin'), 'error');
      return;
    }

    const ok = await UI.confirmDelete(
      I18n.t('delete_account_confirm', { name: DB.accountName(acc) })
    );
    if (!ok) return;

    if (DB.deleteAccount(id)) {
      UI.toast(I18n.t('account_deleted'), 'success');
    } else {
      UI.toast(I18n.t('cannot_delete_last_admin'), 'error');
    }
  }

  /* =============================================================
     النسخ الاحتياطي: تنزيل ملف JSON
     ============================================================= */
  function doBackup() {
    if (!Auth.isAdmin()) return;

    const json = DB.exportBackup();
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    const fileName =
      'school-backup-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) +
      '-' + p(d.getHours()) + p(d.getMinutes()) + '.json';

    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1500);
    UI.toast(I18n.t('backup_saved'), 'success');
  }

  /* =============================================================
     الاستعادة من ملف JSON
     ============================================================= */
  function doRestore() {
    if (!Auth.isAdmin()) return;

    /* مدخل ملف مخفي يُنشأ للاستخدام مرة واحدة */
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';

    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      input.remove();
      if (!file) return;

      const okConfirm = await UI.confirm(I18n.t('restore_confirm'), { danger: true });
      if (!okConfirm) return;

      try {
        const text = await file.text();
        const ok = DB.importBackup(text);
        if (ok) {
          UI.toast(I18n.t('backup_restored'), 'success');
        } else {
          UI.toast(I18n.t('backup_invalid'), 'error');
        }
      } catch (e) {
        console.error('[Admin] فشل قراءة الملف:', e);
        UI.toast(I18n.t('backup_invalid'), 'error');
      }
    });

    document.body.appendChild(input);
    input.click();
  }

  /* =============================================================
     إعادة الضبط الكامل — تأكيد مزدوج
     ============================================================= */
  async function doReset() {
    if (!Auth.isAdmin()) return;

    const ok1 = await UI.confirm(I18n.t('reset_confirm_1'), { danger: true });
    if (!ok1) return;

    const ok2 = await UI.confirmDelete(I18n.t('reset_confirm_2'));
    if (!ok2) return;

    DB.resetAll();
    UI.toast(I18n.t('reset_done'), 'success');
  }

  /* =============================================================
     ربط الأحداث + التشغيل
     ============================================================= */
  function init() {
    const el = document.getElementById('view-admin');
    if (el) {
      el.addEventListener('click', e => {
        const btn = e.target.closest && e.target.closest('[data-action]');
        if (!btn || btn.disabled) return;

        const action = btn.getAttribute('data-action');
        const id     = btn.getAttribute('data-id');

        switch (action) {
          case 'add-account':  openAccountModal();    break;
          case 'edit-account': openAccountModal(id);  break;
          case 'del-account':  deleteAccountFlow(id); break;
          case 'do-backup':    doBackup();            break;
          case 'do-restore':   doRestore();           break;
          case 'do-reset':     doReset();             break;
        }
      });
    }

    /* زر «➕ زيادة حساب» في الشريط العلوي — نفس النافذة الذهبية */
    const addBtn = document.getElementById('addAccountBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => openAccountModal());
    }

    DB.onChange(render);
    I18n.onLangChange(render);
    window.addEventListener('sc:authchange', render);

    render();
  }

  init();

  /* ---------- الواجهة العامة للوحدة ---------- */
  return {
    render,
    openAccountModal
  };
})();
