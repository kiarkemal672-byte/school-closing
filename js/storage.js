'use strict';

/* =========================================================
   نظام الاختتام الصيفي — قاعدة البيانات السحابية المتزامنة
   js/storage.js — النسخة 2 (مزامنة فورية بين الأجهزة)
   ---------------------------------------------------------
   ☁️ أي إضافة/تعديل/حذف على أي جهاز يظهر على بقية الأجهزة
      خلال ثانية تقريباً — تلقائياً بلا أي زر.
   💾 عند انقطاع الإنترنت: يعمل محلياً ويزامن عند عودة الاتصال.
   🔄 أول فتح بعد التحديث: بيانات هذا الجهاز تُرحَّل للسحابة
      تلقائياً (افتح جهاز المشرف صاحب البيانات أولاً!).
   ---------------------------------------------------------
   بقية الملفات لا تتغير — نفس الواجهة تماماً.
   ========================================================= */

const DB = (() => {

  const KEY = 'sc_data_v1';
  const VERSION = 1;

  /* ملف الإعدادات + مكتبات Firebase (تُحمَّل ديناميكياً) */
  const CONFIG_URL = 'js/firebase-config.js';
  const SDK_URLS = [
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js'
  ];
  const DATA_PATH = 'scData';

  let state = null;
  const listeners = [];

  /* حالة المزامنة: local | connecting | cloud */
  let dbRef = null;
  let syncMode = 'local';
  let lastPushedJSON = '';
  let pushTimer = null;
  let connecting = false;
  let configMissing = false;

  /* =============================================================
     ترجمات المزامنة
     ============================================================= */
  (function extendI18n() {
    const extra = {
      ar: { sync_on: '☁️ تم الربط بالمزامنة السحابية',
            sync_off: '📴 لا اتصال — الوضع المحلي (سيُزامن تلقائياً)' },
      am: { sync_on: '☁️ የደመና ማመሳሰል ተገናኝቷል',
            sync_off: '📴 እንደገና ይመሳሰላል' },
      en: { sync_on: '☁️ Cloud sync connected',
            sync_off: '📴 Offline — will sync automatically' }
    };
    Object.keys(extra).forEach(l => {
      if (I18N_DICT[l]) Object.assign(I18N_DICT[l], extra[l]);
    });
  })();

  /* =============================================================
     أدوات عامة
     ============================================================= */
  function uid(prefix) {
    return (prefix || 'id') + '_' +
           Date.now().toString(36) +
           Math.random().toString(36).slice(2, 8);
  }
  function now() { return Date.now(); }

  function emitChange() {
    listeners.forEach(fn => {
      try { fn(); } catch (e) { console.error('[DB] listener:', e); }
    });
    window.dispatchEvent(new CustomEvent('sc:datachange'));
  }

  function emitSync() {
    window.dispatchEvent(new CustomEvent('sc:syncchange', { detail: { mode: syncMode } }));
  }

  /* =============================================================
     التخزين المحلي (المرآة)
     ============================================================= */
  function loadLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p === 'object' && Array.isArray(p.accounts)) state = p;
      }
    } catch (e) { console.error('[DB] load local:', e); }

    if (!state) {
      state = {
        version: VERSION, seeded: false,
        accounts: [], students: [], exams: [], scores: {}, segments: []
      };
    }
    if (!state.seeded) seed();
    migrate();
    saveLocal();
  }

  function saveLocal() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.error('[DB] save local:', e); }
  }

  /* =============================================================
     الزرع الافتراضي (مرة واحدة عند أول تشغيل)
     ============================================================= */
  function seed() {
    const t = now();

    const admin = {
      id: 'acc_admin', username: 'kiar', password: 'kiar2024',
      fullName: 'المشرف العام', nameKey: 'supervisor',
      role: 'admin', createdAt: t, createdBy: 'system'
    };

    const teachersData = [
      { username: 'jihad',   nameKey: 'teacher_jihad'   },
      { username: 'hassan',  nameKey: 'teacher_hassan'  },
      { username: 'nour',    nameKey: 'teacher_nour'    },
      { username: 'mohamed', nameKey: 'teacher_mohamed' },
      { username: 'khiyar',  nameKey: 'teacher_khiyar'  }
    ];

    state.accounts = [admin, ...teachersData.map((td, i) => ({
      id: 'acc_t' + i, username: td.username, password: '1234',
      fullName: '', nameKey: td.nameKey,
      role: 'teacher', createdAt: t, createdBy: 'system'
    }))];

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
      id: 'exam_a_' + i, titleKey: e.key, title: '',
      group: 'adults', icon: e.icon, maxScore: e.max,
      order: i, createdAt: t, createdBy: 'system'
    }));

    state.exams.push({
      id: 'exam_k_0', titleKey: 'subj_quran_kids', title: '',
      group: 'kids', icon: '📖', maxScore: 50,
      order: 0, createdAt: t, createdBy: 'system'
    });

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
        id: 'seg_a_' + i, titleKey: k, title: '', section: 'adults',
        participants: [], order: i, createdAt: t, createdBy: 'system'
      })),
      ...kidsSegs.map((k, i) => ({
        id: 'seg_k_' + i, titleKey: k, title: '', section: 'kids',
        participants: [], order: i, createdAt: t, createdBy: 'system'
      }))
    ];

    state.students = [];
    state.scores = {};
    state.seeded = true;
  }

  function migrate() {
    if (!state.scores || typeof state.scores !== 'object' || Array.isArray(state.scores)) state.scores = {};
    if (!Array.isArray(state.students)) state.students = [];
    if (!Array.isArray(state.exams)) state.exams = [];
    if (!Array.isArray(state.segments)) state.segments = [];
    if (!Array.isArray(state.accounts)) state.accounts = [];
    state.version = VERSION;
  }

  /* =============================================================
     الحفظ: محلي فوراً + رفع للسحابة (بعد مهلة قصيرة للدمج)
     ============================================================= */
  function persist() {
    saveLocal();
    emitChange();
    schedulePush(250);
  }

  function schedulePush(delay) {
    if (!dbRef) return;              /* غير متصل → محلي فقط */
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushRemote, delay == null ? 250 : delay);
  }

  function pushRemote() {
    if (!dbRef) return;
    try {
      lastPushedJSON = JSON.stringify(state);
      dbRef.set(state).catch(err => console.warn('[DB] push failed:', err));
    } catch (e) { console.error('[DB] push:', e); }
  }

  /* =============================================================
     المزامنة السحابية
     ============================================================= */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('load failed: ' + src));
      document.head.appendChild(s);
    });
  }

  /* تنظيف البيانات القادمة من السحابة
     (Firebase لا يحفظ المصفوفات الفارغة فتُحذف المفاتيح) */
  function sanitize(st) {
    if (!st || typeof st !== 'object') return null;
    st.accounts = Array.isArray(st.accounts) ? st.accounts : [];
    st.students = Array.isArray(st.students) ? st.students : [];
    st.exams    = Array.isArray(st.exams) ? st.exams : [];
    st.segments = Array.isArray(st.segments) ? st.segments : [];
    st.scores   = (st.scores && typeof st.scores === 'object' && !Array.isArray(st.scores)) ? st.scores : {};
    st.version  = VERSION;
    return st;
  }

  /* هل البيانات مجرد الافتراضيات (بلا أي إدخال حقيقي)؟ */
  function isFreshSeed(st) {
    if (!st) return true;
    if (st.students.length > 0) return false;
    if (Object.keys(st.scores).some(k => Object.keys(st.scores[k]).length > 0)) return false;
    if ((st.segments || []).some(g => (g.participants || []).length > 0)) return false;
    if ((st.accounts || []).some(a => a.createdBy !== 'system')) return false;
    if ((st.exams || []).some(e => e.createdBy !== 'system')) return false;
    return true;
  }

  /* استقبال بيانات من السحابة (تغيير من جهاز آخر أو صدى كتابتنا) */
  function applyRemote(remote, force) {
    const clean = sanitize(remote);
    if (!clean || !Array.isArray(clean.accounts) || clean.accounts.length === 0) return;

    const json = JSON.stringify(clean);

    /* صدى كتابتنا نحن */
    if (!force && json === lastPushedJSON) {
      if (json !== JSON.stringify(state)) {
        /* عندنا تعديلات أحدث لم تُرفع بعد → نبقيها ونرفعها فوراً */
        schedulePush(0);
      } else {
        state = clean; saveLocal();
      }
      return;
    }

    /* لا تغيير فعلي */
    if (json === JSON.stringify(state)) { state = clean; saveLocal(); return; }

    /* تغيير حقيقي من جهاز آخر → اعتماده وإعادة الرسم */
    state = clean;
    migrate();
    saveLocal();
    emitChange();
  }

  async function connectCloud() {
    if (connecting || dbRef || configMissing) return;
    connecting = true;

    try {
      /* 1) ملف الإعدادات */
      await loadScript(CONFIG_URL);
      if (!window.FIREBASE_CONFIG || !FIREBASE_CONFIG.databaseURL ||
          String(FIREBASE_CONFIG.databaseURL).indexOf('ضع') !== -1) {
        configMissing = true;      /* لم تُضبط الإعدادات → وضع محلي */
        return;
      }

      /* 2) مكتبات Firebase */
      for (const u of SDK_URLS) await loadScript(u);

      /* 3) الاتصال */
      const app = (firebase.apps && firebase.apps.length)
        ? firebase.app()
        : firebase.initializeApp(FIREBASE_CONFIG);
      dbRef = app.database().ref(DATA_PATH);

      /* 4) أول قراءة: السحابة فارغة؟ */
      const snap = await Promise.race([
        dbRef.get(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))
      ]);

      if (!snap.exists()) {
        /* فارغة → نرحّل بيانات هذا الجهاز إن كانت حقيقية */
        if (state && !isFreshSeed(state)) pushRemote();
        /* وإن كانت افتراضية → ننتظر بيانات أول جهاز حقيقي */
      } else {
        applyRemote(snap.val(), true);   /* السحابة هي المرجع */
      }

      /* 5) الاستماع الدائم للتغييرات من بقية الأجهزة */
      dbRef.on('value', s => {
        try { applyRemote(s.val()); } catch (e) { /* تجاهل */ }
      });

      syncMode = 'cloud';
      emitSync();
      if (typeof UI !== 'undefined' && UI.toast) {
        UI.toast(I18n.t('sync_on'), 'success', 2200);
      }

    } catch (err) {
      console.warn('[DB] السحابة غير متاحة — وضع محلي:', err);
      dbRef = null;
      syncMode = 'local';
      emitSync();
    } finally {
      connecting = false;
    }
  }

  /* إعادة المحاولة تلقائياً عند عودة الإنترنت */
  window.addEventListener('online', () => {
    if (!dbRef) setTimeout(connectCloud, 1500);
  });

  /* =============================================================
     الحسابات
     ============================================================= */
  function getAccounts() {
    return [...state.accounts].sort((a, b) =>
      (a.role === 'admin' ? -1 : 1) - (b.role === 'admin' ? -1 : 1) ||
      accountName(a).localeCompare(accountName(b))
    );
  }
  function findAccount(id) { return state.accounts.find(a => a.id === id) || null; }
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

  function addAccount({ username, password, fullName, role }) {
    let by = 'system';
    try { const u = Auth.getUser(); if (u) by = u.id; } catch (e) { /* تجاهل */ }
    const acc = {
      id: uid('acc'), username: String(username).trim(),
      password: String(password), fullName: String(fullName || '').trim(),
      nameKey: null, role: role === 'admin' ? 'admin' : 'teacher',
      createdAt: now(), createdBy: by
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
      acc.nameKey = null;
    }
    if (patch.role !== undefined) acc.role = patch.role === 'admin' ? 'admin' : 'teacher';
    persist();
    return acc;
  }

  function deleteAccount(id) {
    const acc = findAccount(id);
    if (!acc) return false;
    if (acc.role === 'admin' && adminCount() <= 1) return false;
    state.accounts = state.accounts.filter(a => a.id !== id);
    persist();
    return true;
  }

  /* =============================================================
     الطلاب
     ============================================================= */
  function getStudents(group) {
    let list = [...state.students];
    if (group) list = list.filter(s => s.group === group);
    return list.sort((a, b) => String(a.name).localeCompare(String(b.name), 'ar'));
  }
  function findStudent(id) { return state.students.find(s => s.id === id) || null; }

  function addStudent({ name, group, age, teacherId, notes }, user) {
    const st = {
      id: uid('st'), name: String(name).trim(),
      group: group === 'kids' ? 'kids' : 'adults',
      age: age ? Number(age) : null,
      teacherId: teacherId || null,
      notes: String(notes || '').trim(),
      createdAt: now(), createdBy: user ? user.id : 'system',
      updatedAt: now(), updatedBy: user ? user.id : null
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
    Object.keys(state.scores).forEach(examId => {
      if (state.scores[examId][id]) delete state.scores[examId][id];
    });
    state.segments.forEach(seg => {
      seg.participants = (seg.participants || []).filter(p => p.studentId !== id);
    });
    persist();
    return true;
  }

  /* =============================================================
     الاختبارات
     ============================================================= */
  function getExams(group) {
    let list = [...state.exams];
    if (group) list = list.filter(e => e.group === group);
    return list.sort((a, b) =>
      (a.order || 0) - (b.order || 0) || a.createdAt - b.createdAt
    );
  }
  function findExam(id) { return state.exams.find(e => e.id === id) || null; }

  function examTitle(exam) {
    if (!exam) return '';
    if (exam.title && exam.title.trim()) return exam.title.trim();
    if (exam.titleKey && I18N_DICT.ar[exam.titleKey]) return I18n.t(exam.titleKey);
    return exam.titleKey || '';
  }

  function addExam({ title, group, icon, maxScore }, user) {
    const ex = {
      id: uid('exam'), titleKey: null,
      title: String(title || '').trim(),
      group: group === 'kids' ? 'kids' : 'adults',
      icon: icon || '📝',
      maxScore: Math.max(1, Number(maxScore) || 10),
      order: 999, createdAt: now(),
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
      ex.maxScore = Math.max(1, Number(patch.maxScore) || ex.maxScore);
    }
    if (patch.group !== undefined) ex.group = patch.group === 'kids' ? 'kids' : 'adults';
    ex.updatedAt = now();
    ex.updatedBy = user ? user.id : null;
    persist();
    return ex;
  }

  function deleteExam(id) {
    state.exams = state.exams.filter(e => e.id !== id);
    if (state.scores[id]) delete state.scores[id];
    persist();
    return true;
  }

  /* =============================================================
     الدرجات
     ============================================================= */
  function getScore(examId, studentId) {
    return (state.scores[examId] || {})[studentId] || null;
  }
  function getScoresForExam(examId) { return state.scores[examId] || {}; }

  function setScore(examId, studentId, score, user) {
    if (!state.scores[examId]) state.scores[examId] = {};
    if (score === null || score === '' || isNaN(Number(score))) {
      delete state.scores[examId][studentId];
    } else {
      state.scores[examId][studentId] = {
        score: Number(score), updatedAt: now(),
        updatedBy: user ? user.id : null
      };
    }
    persist();
  }

  /* =============================================================
     فقرات المهرجانية
     ============================================================= */
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

  function addSegment({ title, section }, user) {
    const seg = {
      id: uid('seg'), titleKey: null,
      title: String(title || '').trim(),
      section: section === 'kids' ? 'kids' : 'adults',
      participants: [], order: 999,
      createdAt: now(), createdBy: user ? user.id : 'system'
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

  function addParticipant(segId, { name, studentId }, user) {
    const seg = findSegment(segId);
    if (!seg) return null;
    seg.participants = seg.participants || [];
    seg.participants.push({
      id: uid('part'), name: String(name).trim(),
      studentId: studentId || null,
      addedAt: now(), addedBy: user ? user.id : null
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
     الصلاحيات
     ============================================================= */
  function isAdmin(user) { return !!user && user.role === 'admin'; }

  function canEdit(entry, user) {
    if (!user || !entry) return false;
    if (user.role === 'admin') return true;
    const owner = entry.createdBy || entry.addedBy || entry.updatedBy;
    return owner === user.id || owner === 'system';
  }

  function canManageAccounts(user) { return isAdmin(user); }

  /* =============================================================
     النسبة والترتيب والتقديرات
     ============================================================= */
  function pct(score, maxScore) {
    const s = Number(score), m = Number(maxScore);
    if (!isFinite(s) || !isFinite(m) || m <= 0) return 0;
    return Math.round((s / m) * 1000) / 10;
  }

  function gradeInfo(p) {
    if (p >= 90) return { key: 'excellent', cls: 'grade-excellent', pill: 'excellent' };
    if (p >= 75) return { key: 'good',      cls: 'grade-good',      pill: 'good' };
    if (p >= 60) return { key: 'fair',      cls: 'grade-fair',      pill: 'fair' };
    return            { key: 'weak',        cls: 'grade-poor',      pill: 'poor' };
  }

  function gradeLabel(p) { return I18n.t('level_' + gradeInfo(p).key); }

  function rankedForExam(examId) {
    const exam = findExam(examId);
    if (!exam) return [];
    const rows = [];
    state.students.forEach(st => {
      if (st.group !== exam.group) return;
      const sc = getScore(examId, st.id);
      if (sc && isFinite(Number(sc.score))) {
        rows.push({
          student: st, score: Number(sc.score),
          pct: pct(sc.score, exam.maxScore), entry: sc
        });
      }
    });
    rows.sort((a, b) =>
      b.pct - a.pct || b.score - a.score ||
      String(a.student.name).localeCompare(String(b.student.name), 'ar')
    );
    return rows;
  }

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

  function examAveragePct(examId) {
    const rows = rankedForExam(examId);
    if (!rows.length) return null;
    const sum = rows.reduce((acc, r) => acc + r.pct, 0);
    return Math.round((sum / rows.length) * 10) / 10;
  }

  /* =============================================================
     إحصائيات ونشاط
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
     النسخ الاحتياطي
     ============================================================= */
  function exportBackup() { return JSON.stringify(state, null, 2); }

  function importBackup(jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || !Array.isArray(parsed.accounts) ||
          !Array.isArray(parsed.students) ||
          !Array.isArray(parsed.exams) ||
          !Array.isArray(parsed.segments)) {
        return false;
      }
      state = parsed;
      migrate();
      persist();                       /* ← يُرفع للسحابة فوراً */
      return true;
    } catch (e) {
      console.error('[DB] نسخة احتياطية غير صالحة:', e);
      return false;
    }
  }

  function resetAll() {
    state = null;
    loadLocal();
    persist();                         /* ← يعيد الافتراضيات للسحابة أيضاً */
  }

  /* =============================================================
     التشغيل
     ============================================================= */
  function onChange(fn) { if (typeof fn === 'function') listeners.push(fn); }

  loadLocal();

  /* الاتصال بالسحابة بالخلفية بعد جاهزية الصفحة — لا يعطل الواجهة */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(connectCloud, 400));
  } else {
    setTimeout(connectCloud, 400);
  }

  /* ---------- الواجهة العامة (نفس أسماء النسخة السابقة) ---------- */
  return {
    data, uid,
    getAccounts, findAccount, findAccountByUsername,
    accountName, usernameTaken, adminCount,
    addAccount, updateAccount, deleteAccount,
    getStudents, findStudent, addStudent, updateStudent, deleteStudent,
    getExams, findExam, examTitle, addExam, updateExam, deleteExam,
    getScore, getScoresForExam, setScore,
    getSegments, findSegment, segmentTitle,
    addSegment, updateSegment, deleteSegment,
    addParticipant, removeParticipant,
    isAdmin, canEdit, canManageAccounts,
    pct, gradeInfo, gradeLabel,
    rankedForExam, overallRanking, examAveragePct,
    stats, teacherActivity,
    exportBackup, importBackup, resetAll,
    onChange,
    getSyncMode: () => syncMode
  };

  function data() { return state; }
})();
