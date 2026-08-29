'use strict';

/* =========================================================
   نظام الاختتام الصيفي — قاعدة البيانات المحلية
   الملف رقم (4) من (12) : js/storage.js
   ---------------------------------------------------------
   المحتويات:
     1) الحفظ والاسترجاع من localStorage (مع نسخة في الذاكرة)
     2) البيانات الافتراضية (الحسابات + الاختبارات + الفقرات)
     3) عمليات CRUD: حسابات / طلاب / اختبارات / درجات / فقرات
     4) قواعد الصلاحيات (المشرف يعدّل كل شيء — الأستاذ إدخالاته)
     5) محرك الترتيب والنسبة المئوية والتقديرات
     6) النسخ الاحتياطي والاستعادة + إحصائيات المشرف
   ---------------------------------------------------------
   ملاحظة مهمة: كل الحسابات تقرأ كل شيء (الطلاب/الدرجات/
   الاختبارات/الفقرات) — قاعدة الصلاحية تطبق على التعديل والحذف فقط.
   ========================================================= */

const DB = (() => {

  /* =============================================================
     إعدادات
     ============================================================= */
  const KEY = 'sc_data_v1';   // مفتاح التخزين في localStorage
  const VERSION = 1;          // رقم نسخة البيانات (للترقيات المستقبلية)

  let state = null;           // نسخة الذاكرة الحية
  const listeners = [];       // مستمعو التغيير لإعادة الرسم

  /* =============================================================
     أدوات مساعدة
     ============================================================= */

  /* توليد معرّف فريد قصير */
  function uid(prefix) {
    return (prefix || 'id') + '_' +
           Date.now().toString(36) +
           Math.random().toString(36).slice(2, 8);
  }

  /* وقت الآن (طابع زمني) */
  function now() { return Date.now(); }

  /* إشعار كل المستمعين بتغيير البيانات (تعيد الواجهة الرسم) */
  function emitChange() {
    listeners.forEach(fn => {
      try { fn(); } catch (e) { console.error('[DB] listener error:', e); }
    });
    window.dispatchEvent(new CustomEvent('sc:datachange'));
  }

  /* =============================================================
     الحفظ والتحميل
     ============================================================= */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.accounts)) {
          state = parsed;
        }
      }
    } catch (e) {
      console.error('[DB] فشل تحميل البيانات:', e);
    }

    /* بيانات جديدة أو تالفة → هيكل فارغ ثم زرع الافتراضيات */
    if (!state) {
      state = {
        version: VERSION,
        seeded: false,
        accounts: [],
        students: [],
        exams: [],
        scores: {},      // scores[examId][studentId] = {score, updatedAt, updatedBy}
        segments: []
      };
    }

    if (!state.seeded) seed();
    migrate();
    persist();
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.error('[DB] فشل الحفظ (مساحة ممتلئة؟):', e);
      alert('تعذر حفظ البيانات — مساحة التخزين ممتلئة!');
    }
    emitChange();
  }

  /* ترقيات مستقبلية لهيكل البيانات */
  function migrate() {
    if (!state.scores || typeof state.scores !== 'object') state.scores = {};
    if (!Array.isArray(state.students)) state.students = [];
    if (!Array.isArray(state.exams)) state.exams = [];
    if (!Array.isArray(state.segments)) state.segments = [];
    if (!Array.isArray(state.accounts)) state.accounts = [];
    state.version = VERSION;
  }

  /* =============================================================
     الزرع الافتراضي — يعمل مرة واحدة عند أول تشغيل
     ============================================================= */
  function seed() {
    const t = now();

    /* ---------- الحسابات الافتراضية ---------- */
    const admin = {
      id: 'acc_admin',
      username: 'kiar',
      password: 'kiar2024',
      fullName: 'المشرف العام',
      nameKey: 'supervisor',           // مفتاح ترجمة الاسم
      role: 'admin',
      createdAt: t,
      createdBy: 'system'
    };

    const teachersData = [
      { username: 'jihad',    nameKey: 'teacher_jihad'    },
      { username: 'hassan',   nameKey: 'teacher_hassan'   },
      { username: 'nour',     nameKey: 'teacher_nour'     },
      { username: 'mohamed',  nameKey: 'teacher_mohamed'  },
      { username: 'khiyar',   nameKey: 'teacher_khiyar'   }
    ];

    const teachers = teachersData.map((td, i) => ({
      id: 'acc_t' + i,
      username: td.username,
      password: '1234',
      fullName: '',                    // يُعرض من مفتاح الترجمة
      nameKey: td.nameKey,
      role: 'teacher',
      createdAt: t,
      createdBy: 'system'
    }));

    state.accounts = [admin, ...teachers];

    /* ---------- اختبارات الكبار: قرآني + 6 مواد ---------- */
    const adultsExams = [
      { key: 'subj_quran',  icon: '📖', max: 50 },
      { key: 'subj_fiqh',   icon: '🕌', max: 25 },
      { key: 'subj_aqidah', icon: '☝️', max: 25 },
      { key: 'subj_sirah',  icon: '🌙', max: 25 },
      { key: 'subj_tajwid', icon: '🗣️', max: 25 },
      { key: 'subj_akhlaq', icon: '🤝', max: 25 },
      { key: 'subj_khat',   icon: '✍️', max: 10 }
    ];

    state.exams = adultsExams.map((e, i) => ({
      id: 'exam_a_' + i,
      titleKey: e.key,                 // عنوان مترجم تلقائياً
      title: '',                       // عنوان مخصص (فارغ = استخدم الترجمة)
      group: 'adults',
      icon: e.icon,
      maxScore: e.max,                 // الدرجة العظمى — قابلة للتعديل
      order: i,
      createdAt: t,
      createdBy: 'system'
    }));

    /* ---------- اختبار الصغار: قرآني أساسي ---------- */
    state.exams.push({
      id: 'exam_k_0',
      titleKey: 'subj_quran_kids',
      title: '',
      group: 'kids',
      icon: '📖',
      maxScore: 50,
      order: 0,
      createdAt: t,
      createdBy: 'system'
    });

    /* ---------- فقرات المهرجانية الافتراضية ---------- */
    const adultsSegs = [
      'seg_stories', 'seg_poetry', 'seg_khutbah', 'seg_virtues',
      'seg_fiqh_qa', 'seg_aqidah_self', 'seg_sirah_c', 'seg_tajwid_c'
    ];
    const kidsSegs = [
      'seg_k_aqidah', 'seg_k_fiqh', 'seg_k_sirah', 'seg_k_tajwid',
      'seg_k_akhlaq', 'seg_k_quran_hifz', 'seg_k_norania'
    ];

    state.segments = [
      ...adultsSegs.map((k, i) => ({
        id: 'seg_a_' + i,
        titleKey: k,
        title: '',
        section: 'adults',
        participants: [],
        order: i,
        createdAt: t,
        createdBy: 'system'
      })),
      ...kidsSegs.map((k, i) => ({
        id: 'seg_k_' + i,
        titleKey: k,
        title: '',
        section: 'kids',
        participants: [],
        order: i,
        createdAt: t,
        createdBy: 'system'
      }))
    ];

    state.students = [];
    state.scores = {};
    state.seeded = true;
  }

  /* =============================================================
     الوصول للبيانات (قراءة — متاحة للجميع: مشرف وأساتذة)
     ============================================================= */

  /* الحالة الكاملة (للاستخدام الداخلي والعرض) */
  function data() { return state; }

  /* ---------- الحسابات ---------- */
  function getAccounts() {
    return [...state.accounts].sort((a, b) =>
      (a.role === 'admin' ? -1 : 1) - (b.role === 'admin' ? -1 : 1) ||
      accountName(a).localeCompare(accountName(b))
    );
  }
  function findAccount(id)       { return state.accounts.find(a => a.id === id) || null; }
  function findAccountByUsername(u) {
    return state.accounts.find(a =>
      a.username.toLowerCase() === String(u || '').toLowerCase().trim()
    ) || null;
  }
  function accountName(acc) {
    if (!acc) return '—';
    if (acc.nameKey && typeof I18n !== 'undefined' && I18N_DICT.ar[acc.nameKey]) {
      return I18n.t(acc.nameKey);
    }
    return acc.fullName || acc.username || '—';
  }
  function usernameTaken(username, exceptId) {
    return state.accounts.some(a =>
      a.id !== exceptId &&
      a.username.toLowerCase() === String(username).toLowerCase().trim()
    );
  }
  function adminCount() {
    return state.accounts.filter(a => a.role === 'admin').length;
  }

  /* ---------- الطلاب ---------- */
  function getStudents(group) {
    let list = [...state.students];
    if (group) list = list.filter(s => s.group === group);
    return list.sort((a, b) =>
      String(a.name).localeCompare(String(b.name), 'ar')
    );
  }
  function findStudent(id) { return state.students.find(s => s.id === id) || null; }

  /* ---------- الاختبارات ---------- */
  function getExams(group) {
    let list = [...state.exams];
    if (group) list = list.filter(e => e.group === group);
    return list.sort((a, b) =>
      (a.order || 0) - (b.order || 0) || a.createdAt - b.createdAt
    );
  }
  function findExam(id) { return state.exams.find(e => e.id === id) || null; }

  /* عنوان الاختبار المعروض: المخصص أولاً ثم ترجمة المفتاح */
  function examTitle(exam) {
    if (!exam) return '';
    if (exam.title && exam.title.trim()) return exam.title.trim();
    if (exam.titleKey && I18N_DICT.ar[exam.titleKey]) return I18n.t(exam.titleKey);
    return exam.titleKey || '';
  }

  /* ---------- الدرجات ---------- */
  function getScore(examId, studentId) {
    return (state.scores[examId] || {})[studentId] || null;
  }
  function getScoresForExam(examId) {
    return state.scores[examId] || {};
  }

  /* ---------- فقرات المهرجانية ---------- */
  function getSegments(section) {
    let list = [...state.segments];
    if (section) list = list.filter(g => g.section === section);
    return list.sort((a, b) =>
      (a.order || 0) - (b.order || 0) || a.createdAt - b.createdAt
    );
  }
  function findSegment(id) { return state.segments.find(g => g.id === id) || null; }
  function segmentTitle(seg) {
    if (!seg) return '';
    if (seg.title && seg.title.trim()) return seg.title.trim();
    if (seg.titleKey && I18N_DICT.ar[seg.titleKey]) return I18n.t(seg.titleKey);
    return seg.titleKey || '';
  }

  /* =============================================================
     عمليات الإضافة / التعديل / الحذف
     (user = المستخدم الحالي — يُسجل من قام بالإدخال)
     ============================================================= */

  /* ---------- الحسابات (المشرف فقط — التحقق في الواجهة) ---------- */
  function addAccount({ username, password, fullName, role }) {
    const acc = {
      id: uid('acc'),
      username: String(username).trim(),
      password: String(password),
      fullName: String(fullName || '').trim(),
      nameKey: null,
      role: role === 'admin' ? 'admin' : 'teacher',
      createdAt: now(),
      createdBy: 'current_user'
    };
    state.accounts.push(acc);
    persist();
    return acc;
  }

  function updateAccount(id, patch) {
    const acc = findAccount(id);
    if (!acc) return null;
    if (patch.username !== undefined) acc.username = String(patch.username).trim();
    if (patch.password !== undefined && patch.password !== '') acc.password = String(patch.password);
    if (patch.fullName !== undefined) {
      acc.fullName = String(patch.fullName).trim();
      acc.nameKey = null;   // اسم مخصص → ألغِ مفتاح الترجمة
    }
    if (patch.role !== undefined) acc.role = patch.role === 'admin' ? 'admin' : 'teacher';
    persist();
    return acc;
  }

  function deleteAccount(id) {
    /* حماية: لا يمكن حذف آخر مشرف */
    const acc = findAccount(id);
    if (!acc) return false;
    if (acc.role === 'admin' && adminCount() <= 1) return false;
    state.accounts = state.accounts.filter(a => a.id !== id);
    /* ملاحظة: إدخالات الأستاذ المحذوف تبقى محفوظة في النظام */
    persist();
    return true;
  }

  /* ---------- الطلاب ---------- */
  function addStudent({ name, group, age, teacherId, notes }, user) {
    const st = {
      id: uid('st'),
      name: String(name).trim(),
      group: group === 'kids' ? 'kids' : 'adults',
      age: age ? Number(age) : null,
      teacherId: teacherId || null,     // الأستاذ المسؤول
      notes: String(notes || '').trim(),
      createdAt: now(),
      createdBy: user ? user.id : 'system',
      updatedAt: now(),
      updatedBy: user ? user.id : null
    };
    state.students.push(st);
    persist();
    return st;
  }

  function updateStudent(id, patch, user) {
    const st = findStudent(id);
    if (!st) return null;
    if (patch.name !== undefined) st.name = String(patch.name).trim();
    if (patch.group !== undefined) st.group = patch.group === 'kids' ? 'kids' : 'adults';
    if (patch.age !== undefined) st.age = patch.age ? Number(patch.age) : null;
    if (patch.teacherId !== undefined) st.teacherId = patch.teacherId || null;
    if (patch.notes !== undefined) st.notes = String(patch.notes).trim();
    st.updatedAt = now();
    st.updatedBy = user ? user.id : null;
    persist();
    return st;
  }

  function deleteStudent(id) {
    state.students = state.students.filter(s => s.id !== id);
    /* حذف كل درجات الطالب من كل الاختبارات */
    Object.keys(state.scores).forEach(examId => {
      if (state.scores[examId][id]) delete state.scores[examId][id];
    });
    /* حذفه من قوائم المشاركين في المهرجانية */
    state.segments.forEach(seg => {
      seg.participants = (seg.participants || []).filter(p => p.studentId !== id);
    });
    persist();
    return true;
  }

  /* ---------- الاختبارات ---------- */
  function addExam({ title, group, icon, maxScore }, user) {
    const ex = {
      id: uid('exam'),
      titleKey: null,                  // اختبار مخصص — بلا ترجمة
      title: String(title || '').trim(),
      group: group === 'kids' ? 'kids' : 'adults',
      icon: icon || '📝',
      maxScore: Math.max(1, Number(maxScore) || 10),
      order: 999,                      // يضاف في النهاية
      createdAt: now(),
      createdBy: user ? user.id : 'system'
    };
    state.exams.push(ex);
    persist();
    return ex;
  }

  function updateExam(id, patch, user) {
    const ex = findExam(id);
    if (!ex) return null;
    if (patch.title !== undefined && patch.title.trim() !== '') ex.title = patch.title.trim();
    if (patch.icon !== undefined) ex.icon = patch.icon || ex.icon;
    if (patch.maxScore !== undefined) {
      const newMax = Math.max(1, Number(patch.maxScore) || ex.maxScore);
      ex.maxScore = newMax;
    }
    if (patch.group !== undefined) ex.group = patch.group === 'kids' ? 'kids' : 'adults';
    ex.updatedAt = now();
    ex.updatedBy = user ? user.id : null;
    persist();
    return ex;
  }

  function deleteExam(id) {
    state.exams = state.exams.filter(e => e.id !== id);
    if (state.scores[id]) delete state.scores[id];   // حذف درجات الاختبار
    persist();
    return true;
  }

  /* ---------- الدرجات ---------- */
  /* score = رقم صالح أو null للمسح */
  function setScore(examId, studentId, score, user) {
    if (!state.scores[examId]) state.scores[examId] = {};

    if (score === null || score === '' || isNaN(Number(score))) {
      delete state.scores[examId][studentId];        // مسح الدرجة
    } else {
      state.scores[examId][studentId] = {
        score: Number(score),
        updatedAt: now(),
        updatedBy: user ? user.id : null
      };
    }
    persist();
  }

  /* ---------- فقرات المهرجانية ---------- */
  function addSegment({ title, section }, user) {
    const seg = {
      id: uid('seg'),
      titleKey: null,
      title: String(title || '').trim(),
      section: section === 'kids' ? 'kids' : 'adults',
      participants: [],
      order: 999,
      createdAt: now(),
      createdBy: user ? user.id : 'system'
    };
    state.segments.push(seg);
    persist();
    return seg;
  }

  function updateSegment(id, patch, user) {
    const seg = findSegment(id);
    if (!seg) return null;
    if (patch.title !== undefined && patch.title.trim() !== '') seg.title = patch.title.trim();
    if (patch.section !== undefined) seg.section = patch.section === 'kids' ? 'kids' : 'adults';
    if (patch.order !== undefined) seg.order = Number(patch.order) || seg.order;
    seg.updatedAt = now();
    seg.updatedBy = user ? user.id : null;
    persist();
    return seg;
  }

  function deleteSegment(id) {
    state.segments = state.segments.filter(g => g.id !== id);
    persist();
    return true;
  }

  /* ---------- المشاركون في الفقرات ---------- */
  function addParticipant(segId, { name, studentId }, user) {
    const seg = findSegment(segId);
    if (!seg) return null;
    seg.participants = seg.participants || [];
    seg.participants.push({
      id: uid('part'),
      name: String(name).trim(),
      studentId: studentId || null,    // ربط اختياري بسجل طالب
      addedAt: now(),
      addedBy: user ? user.id : null
    });
    seg.updatedAt = now();
    seg.updatedBy = user ? user.id : null;
    persist();
    return seg;
  }

  function removeParticipant(segId, participantId, user) {
    const seg = findSegment(segId);
    if (!seg) return null;
    seg.participants = (seg.participants || []).filter(p => p.id !== participantId);
    seg.updatedAt = now();
    seg.updatedBy = user ? user.id : null;
    persist();
    return seg;
  }

  /* =============================================================
     قواعد الصلاحيات
     ---------------------------------------------------------
     • القراءة: متاحة للجميع (المشرف وكل الأساتذة يرون كل شيء)
     • التعديل/الحذف:
        - المشرف (admin): أي إدخال في النظام
        - الأستاذ: إدخالاته هو فقط (createdBy / addedBy / updatedBy)
     ============================================================= */
  function isAdmin(user) {
    return !!user && user.role === 'admin';
  }

  function canEdit(entry, user) {
    if (!user || !entry) return false;
    if (user.role === 'admin') return true;
    const owner = entry.createdBy || entry.addedBy || entry.updatedBy;
    return owner === user.id;
  }

  /* صلاحية إدارة الحسابات: المشرف فقط */
  function canManageAccounts(user) {
    return isAdmin(user);
  }

  /* =============================================================
     محرك النسبة المئوية والتقديرات والترتيب
     ============================================================= */

  /* النسبة المئوية (بدقة خانة عشرية واحدة) */
  function pct(score, maxScore) {
    const s = Number(score), m = Number(maxScore);
    if (!isFinite(s) || !isFinite(m) || m <= 0) return 0;
    return Math.round((s / m) * 1000) / 10;
  }

  /* التقدير حسب النسبة:
     ≥ 90 مماز | ≥ 75 جيد | ≥ 60 مقبول | أقل ضعيف */
  function gradeInfo(p) {
    if (p >= 90) return { key: 'excellent', cls: 'grade-excellent', pill: 'excellent' };
    if (p >= 75) return { key: 'good',      cls: 'grade-good',      pill: 'good' };
    if (p >= 60) return { key: 'fair',      cls: 'grade-fair',      pill: 'fair' };
    return            { key: 'weak',        cls: 'grade-poor',      pill: 'poor' };
  }

  function gradeLabel(p) {
    return I18n.t('level_' + gradeInfo(p).key);
  }

  /* الترتيب لاختبار واحد:
     الطلاب الذين لديهم درجات، مرتبين تنازلياً بالنسبة المئوية
     (الدرجة الأعلى أولاً 🥇) ثم بالدرجة ثم بالاسم أبجدياً */
  function rankedForExam(examId) {
    const exam = findExam(examId);
    if (!exam) return [];

    const rows = [];
    state.students.forEach(st => {
      if (st.group !== exam.group) return;      // الاختبار خاص بمجموعته
      const sc = getScore(examId, st.id);
      if (sc && isFinite(Number(sc.score))) {
        rows.push({
          student: st,
          score: Number(sc.score),
          pct: pct(sc.score, exam.maxScore),
          entry: sc
        });
      }
    });

    rows.sort((a, b) =>
      b.pct - a.pct ||                        // الأعلى نسبة أولاً
      b.score - a.score ||                    // ثم الدرجة الخام
      String(a.student.name).localeCompare(String(b.student.name), 'ar')
    );

    return rows;
  }

  /* الترتيب العام لمجموعة (متوسط النسب عبر كل اختباراتها) */
  function overallRanking(group) {
    const exams = getExams(group);
    return state.students
      .filter(s => s.group === group)
      .map(st => {
        let sumPct = 0, count = 0, sumScore = 0, sumMax = 0;
        exams.forEach(ex => {
          const sc = getScore(ex.id, st.id);
          if (sc && isFinite(Number(sc.score))) {
            sumPct += pct(sc.score, ex.maxScore);
            sumScore += Number(sc.score);
            sumMax += ex.maxScore;
            count++;
          }
        });
        return {
          student: st,
          avgPct: count ? Math.round((sumPct / count) * 10) / 10 : null,
          sumScore, sumMax, count
        };
      })
      .filter(r => r.count > 0)
      .sort((a, b) => (b.avgPct || 0) - (a.avgPct || 0) ||
              String(a.student.name).localeCompare(String(b.student.name), 'ar'));
  }

  /* متوسط نسبة اختبار معين */
  function examAveragePct(examId) {
    const rows = rankedForExam(examId);
    if (!rows.length) return null;
    const sum = rows.reduce((acc, r) => acc + r.pct, 0);
    return Math.round((sum / rows.length) * 10) / 10;
  }

  /* =============================================================
     إحصائيات لوحة المشرف
     ============================================================= */
  function stats() {
    return {
      students: state.students.length,
      studentsAdults: state.students.filter(s => s.group === 'adults').length,
      studentsKids: state.students.filter(s => s.group === 'kids').length,
      exams: state.exams.length,
      accounts: state.accounts.length,
      teachers: state.accounts.filter(a => a.role === 'teacher').length,
      segments: state.segments.length,
      scored: Object.values(state.scores)
        .reduce((acc, ex) => acc + Object.keys(ex).length, 0)
    };
  }

  /* نشاط كل أستاذ (عدد إدخالاته) — لجدول المراقبة في لوحة المشرف */
  function teacherActivity() {
    const map = {};
    state.accounts.forEach(a => {
      if (a.role === 'teacher') {
        map[a.id] = { account: a, students: 0, exams: 0, segments: 0, scores: 0 };
      }
    });

    state.students.forEach(s => { if (map[s.createdBy]) map[s.createdBy].students++; });
    state.exams.forEach(e => { if (map[e.createdBy]) map[e.createdBy].exams++; });
    state.segments.forEach(g => { if (map[g.createdBy]) map[g.createdBy].segments++; });

    Object.values(state.scores).forEach(examScores => {
      Object.values(examScores).forEach(sc => {
        if (map[sc.updatedBy]) map[sc.updatedBy].scores++;
      });
    });

    return Object.values(map).sort((a, b) =>
      (b.students + b.exams + b.segments + b.scores) -
      (a.students + a.exams + a.segments + a.scores)
    );
  }

  /* =============================================================
     النسخ الاحتياطي والاستعادة
     ============================================================= */
  function exportBackup() {
    return JSON.stringify(state, null, 2);
  }

  function importBackup(jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || !Array.isArray(parsed.accounts) ||
          !Array.isArray(parsed.students) ||
          !Array.isArray(parsed.exams) ||
          !Array.isArray(parsed.segments) ||
          typeof parsed.scores !== 'object') {
        return false;
      }
      state = parsed;
      migrate();
      persist();
      return true;
    } catch (e) {
      console.error('[DB] نسخة احتياطية غير صالحة:', e);
      return false;
    }
  }

  /* إعادة ضبط المصنع: حذف كل شيء وإرجاع الافتراضيات */
  function resetAll() {
    state = null;
    load();
    persist();
  }

  /* =============================================================
     مستمعو التغيير
     ============================================================= */
  function onChange(fn) {
    if (typeof fn === 'function') listeners.push(fn);
  }

  /* =============================================================
     التشغيل الفوري
     ============================================================= */
  load();

  /* ---------- الواجهة العامة للوحدة ---------- */
  return {
    /* بيانات */
    data, uid,

    /* حسابات */
    getAccounts, findAccount, findAccountByUsername,
    accountName, usernameTaken, adminCount,
    addAccount, updateAccount, deleteAccount,

    /* طلاب */
    getStudents, findStudent, addStudent, updateStudent, deleteStudent,

    /* اختبارات */
    getExams, findExam, examTitle,
    addExam, updateExam, deleteExam,

    /* درجات */
    getScore, getScoresForExam, setScore,

    /* مهرجانية */
    getSegments, findSegment, segmentTitle,
    addSegment, updateSegment, deleteSegment,
    addParticipant, removeParticipant,

    /* صلاحيات */
    isAdmin, canEdit, canManageAccounts,

    /* ترتيب وتقديرات */
    pct, gradeInfo, gradeLabel,
    rankedForExam, overallRanking, examAveragePct,

    /* إحصائيات */
    stats, teacherActivity,

    /* نسخ احتياطي */
    exportBackup, importBackup, resetAll,

    /* أحداث */
    onChange
  };
})();
