'use strict';

/* =========================================================
   نظام الاختتام الصيفي — تصدير التقارير PDF
   الملف رقم (7) من (12) : js/pdf-export.js
   ---------------------------------------------------------
   المبدأ: بدلاً من مكتبات PDF الخارجية (التي تكسر الحروف
   العربية والأمهرية)، نبني تقرير HTML منسقاً داخل إطار مخفي
   ثم نستدعي print() — والمستخدم يختار «حفظ كـ PDF».
   النتيجة: دعم مثالي للغات الثلاث + عمل كامل بدون إنترنت.
   ---------------------------------------------------------
   التقارير المتاحة (كلها بضغطة زر واحدة):
     • PDFExport.examReport(examId)        → تقرير اختبار واحد
       (الاسم، الدرجة، النسبة، الترتيب 🥇، التقدير، التوقيعات)
     • PDFExport.overallRanking('adults'|'kids') → الترتيب النهائي
     • PDFExport.studentsList('adults'|'kids')   → كشف الطلاب
     • PDFExport.ceremonyProgram()         → برنامج المهرجانية
   ---------------------------------------------------------
   ملاحظات تقنية:
     • اسم ملف PDF المقترح = عنوان التقرير (من <title>)
     • اتجاه التقرير يتبع اللغة الحالية (RTL/LTR) تلقائياً
     • رؤوس الجداول تتكرر عند امتداد التقرير لعدة صفحات
     • الصفوف لا تنقسم بين صفحتين
   ========================================================= */

const PDFExport = (() => {

  /* =============================================================
     أدوات داخلية
     ============================================================= */
  const esc = s => UI.esc(s);

  /* رسالة فشل موحدة عند غياب البيانات */
  function fail() {
    UI.toast(I18n.t('pdf_no_data'), 'error');
    return false;
  }

  /* التاريخ الحالي منسق حسب اللغة */
  function dateNow() {
    const localeMap = { ar: 'ar', am: 'am-ET', en: 'en-GB' };
    try {
      return new Date().toLocaleDateString(
        localeMap[I18n.getLang()] || undefined,
        { year: 'numeric', month: 'long', day: 'numeric' }
      );
    } catch (e) {
      return new Date().toLocaleDateString();
    }
  }

  /* اسم المستخدم الحالي (لخانة «أُنشئ بواسطة») */
  function currentUserName() {
    const u = Auth.getUser();
    return u ? DB.accountName(u) : '—';
  }

  /* اسم أستاذ الطالب (أو — إن حُذف حسابه) */
  function teacherName(student) {
    if (!student || !student.teacherId) return '—';
    const acc = DB.findAccount(student.teacherId);
    return acc ? DB.accountName(acc) : '—';
  }

  /* =============================================================
     الخطوط — تُحمَّل عند توفر الإنترنت، وإلا خطوط النظام
     (كل الأنظمة تحتوي خطوطاً عربية وأمهرية افتراضية)
     ============================================================= */
  function fontLinks() {
    return '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800' +
      '&family=Noto+Sans+Ethiopic:wght@400;500;700&display=swap" rel="stylesheet">';
  }

  /* =============================================================
     تنسيقات الطباعة (A4 — أبيض وأسود ناصع مع لمسات لونية خفيفة)
     ============================================================= */
  function printCSS() {
    return `
      @page { size: A4; margin: 12mm 10mm; }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      html, body {
        font-family: 'Tajawal', 'Noto Sans Ethiopic', 'Segoe UI',
                     Tahoma, 'Nyala', sans-serif;
        color: #000;
        line-height: 1.55;
        font-size: 12.5px;
      }

      /* ---------- ترويسة التقرير ---------- */
      .rpt-head {
        text-align: center;
        border-bottom: 3px double #0d5c55;
        padding-bottom: 10px;
        margin-bottom: 12px;
      }
      .rpt-head .school {
        font-size: 15px; font-weight: 700; color: #0d5c55;
      }
      .rpt-head .title {
        font-size: 21px; font-weight: 800; margin-top: 4px;
      }
      .rpt-head .sub {
        font-size: 13px; color: #444; margin-top: 3px;
      }

      /* ---------- بيانات وصفية ---------- */
      .meta {
        display: flex; flex-wrap: wrap; gap: 6px;
        margin-bottom: 12px;
      }
      .meta div {
        border: 1px solid #b9cbc8; border-radius: 6px;
        padding: 3px 10px; font-size: 11.5px; background: #f2f6f5;
      }
      .meta b { color: #0d5c55; }

      /* ---------- صناديق الإحصائيات ---------- */
      .stats-boxes {
        display: flex; gap: 8px; margin-bottom: 12px;
      }
      .stats-boxes .bx {
        flex: 1; text-align: center;
        border: 1px solid #b9cbc8; border-radius: 8px;
        padding: 6px 4px; background: #f7faf9;
      }
      .bx .v { font-size: 16px; font-weight: 800; color: #0d5c55; }
      .bx .l { font-size: 10.5px; color: #555; }

      /* ---------- الجدول الرئيسي ---------- */
      table.main {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 6px;
      }
      table.main thead { display: table-header-group; }  /* يتكرر كل صفحة */
      table.main tr   { page-break-inside: avoid; }      /* لا ينقسم صفاً */
      table.main th {
        background: #0d5c55; color: #fff;
        padding: 6px 8px; font-size: 11.5px;
        border: 1px solid #0d5c55;
      }
      table.main td {
        padding: 5px 8px;
        border: 1px solid #b9cbc8;
        word-wrap: break-word;
      }
      table.main tbody tr:nth-child(even) td { background: #f4f8f7; }

      /* المراكز الثلاثة الأولى */
      tr.top td { background: #fdf6e3 !important; font-weight: 700; }
      tr.top td:first-child { color: #975a16; }

      td.c, th.c { text-align: center; }
      td.b { font-weight: 800; }
      .medal { font-size: 13px; }

      /* ---------- التوقيعات ---------- */
      .sig {
        display: flex; gap: 40px;
        margin-top: 34px;
        page-break-inside: avoid;
      }
      .sig > div { flex: 1; text-align: center; }
      .sig .l { font-size: 12px; font-weight: 700; margin-bottom: 34px; }
      .sig .line {
        border-top: 1.5px dotted #555;
        padding-top: 4px;
        font-size: 10px; color: #777;
      }

      /* ---------- تذييل ---------- */
      .foot {
        margin-top: 18px; padding-top: 6px;
        border-top: 1px solid #ccc;
        text-align: center; font-size: 10px; color: #888;
      }

      /* ---------- برنامج المهرجانية ---------- */
      h2.sec {
        font-size: 15px; color: #fff; background: #6b46c1;
        padding: 5px 12px; border-radius: 6px;
        margin: 14px 0 8px;
        page-break-after: avoid;
      }
      h2.sec.kids { background: #c2410c; }

      .seg {
        border: 1px solid #cfc3ea; border-radius: 8px;
        padding: 6px 10px; margin-bottom: 6px;
        page-break-inside: avoid;
        background: #fbf9fe;
      }
      .seg .seg-head {
        font-weight: 800; font-size: 12.5px;
        display: flex; align-items: center; gap: 8px;
      }
      .seg .num {
        background: #6b46c1; color: #fff;
        min-width: 20px; height: 20px; border-radius: 50%;
        display: inline-flex; align-items: center; justify-content: center;
        font-size: 10.5px;
      }
      .seg .cnt {
        font-size: 10px; color: #6b46c1;
        border: 1px dashed #6b46c1; border-radius: 999px;
        padding: 0 7px;
      }
      .seg .parts {
        margin-top: 3px; padding-inline-start: 30px;
        font-size: 11.5px; color: #333;
      }
      .seg .parts.none { color: #999; font-style: italic; }

      .pb { page-break-before: always; }
    `;
  }

  /* =============================================================
     بناء مستند التقرير الكامل
     ============================================================= */
  function buildDoc(docTitle, bodyHTML) {
    return `<!DOCTYPE html>
<html lang="${I18n.getLang()}" dir="${I18n.getDir()}">
<head>
  <meta charset="UTF-8">
  ${fontLinks()}
  <title>${esc(docTitle)}</title>
  <style>${printCSS()}</style>
</head>
<body>
  ${bodyHTML}
</body>
</html>`;
  }

  /* =============================================================
     مولدات أجزاء التقرير
     ============================================================= */

  /* الترويسة */
  function header(title, sub) {
    return `
      <div class="rpt-head">
        <div class="school">🎓 ${esc(I18n.t('pdf_school'))}</div>
        <div class="title">${esc(title)}</div>
        ${sub ? `<div class="sub">${sub}</div>` : ''}
      </div>`;
  }

  /* البيانات الوصفية */
  function meta(pairs) {
    return '<div class="meta">' + (pairs || []).map(p =>
      `<div><b>${esc(p[0])}:</b> ${esc(p[1])}</div>`
    ).join('') + '</div>';
  }

  /* صناديق إحصائية */
  function statBoxes(items) {
    return '<div class="stats-boxes">' + items.map(i =>
      `<div class="bx"><div class="v">${esc(String(i.v))}</div><div class="l">${esc(i.l)}</div></div>`
    ).join('') + '</div>';
  }

  /* خانات التوقيع */
  function signature() {
    return `
      <div class="sig">
        <div>
          <div class="l">${esc(I18n.t('pdf_signature'))}</div>
          <div class="line">${esc(I18n.t('name'))}</div>
        </div>
        <div>
          <div class="l">${esc(I18n.t('pdf_signature_supervisor'))}</div>
          <div class="line">${esc(I18n.t('name'))}</div>
        </div>
      </div>`;
  }

  /* التذييل */
  function footer() {
    return `<div class="foot">${esc(I18n.t('pdf_footer'))} — ${esc(dateNow())}</div>`;
  }

  /* =============================================================
     فتح الطباعة — قلب المحرك
     ---------------------------------------------------------
     يبني إطاراً مخفياً بمقاس 1×1 (مطلوب بقاؤه في الصفحة لكي
     تطبع المتصفحات محتواه)، ينتظر جاهزية الخطوط (حتى 2.5 ثانية
     عند وجود إنترنت)، ثم يستدعي print() وينظف نفسه بعدها.
     ============================================================= */
  function openPrint(html) {

    UI.toast(I18n.t('pdf_preparing'), 'info', 2000);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
      'position:fixed;inset:auto 0 0 auto;width:1px;height:1px;' +
      'opacity:0;border:0;pointer-events:none;';
    document.body.appendChild(iframe);

    let cleaned = false;
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      iframe.remove();
    }

    iframe.onload = () => {
      const win = iframe.contentWindow;
      if (!win) { cleanup(); return; }

      /* التنظيف بعد إغلاق حوار الطباعة */
      win.addEventListener('afterprint', () => setTimeout(cleanup, 600));

      const doPrint = () => {
        try {
          win.focus();
          win.print();
        } catch (e) {
          console.error('[PDF] فشل فتح الطباعة:', e);
        }
        /* شبكة أمان: تنظيف بعد دقيقة ونصف إن لم يصل afterprint */
        setTimeout(cleanup, 90000);
      };

      /* انتظار الخطوط (سباق مع مهلة 2.5 ثانية للأوفلاين) */
      let fontsReady = Promise.resolve();
      try {
        if (win.document.fonts && win.document.fonts.ready) {
          fontsReady = win.document.fonts.ready;
        }
      } catch (e) { /* تجاهل */ }

      Promise.race([
        fontsReady,
        new Promise(r => setTimeout(r, 2500))
      ]).then(() => setTimeout(doPrint, 120))
        .catch(() => doPrint());
    };

    iframe.srcdoc = html;
    return true;
  }

  /* =============================================================
     1) تقرير اختبار واحد — مرتب بالنسبة المئوية 🥇
     ============================================================= */
  function examReport(examId) {
    const exam = DB.findExam(examId);
    if (!exam) return fail();

    const rows = DB.rankedForExam(examId);
    if (!rows.length) return fail();

    const title = DB.examTitle(exam);
    const groupLabel = I18n.t(exam.group === 'kids' ? 'kids_group' : 'adults_group');

    /* إحصائيات */
    const avgPct = DB.examAveragePct(examId) || 0;
    const topPct = rows[0].pct;
    const lowPct = rows[rows.length - 1].pct;

    /* صفوف الجدول */
    const trs = rows.map((r, i) => {
      const rank = i + 1;
      const medal = rank === 1 ? ' <span class="medal">🥇</span>'
                  : rank === 2 ? ' <span class="medal">🥈</span>'
                  : rank === 3 ? ' <span class="medal">🥉</span>' : '';
      return `
        <tr class="${rank <= 3 ? 'top' : ''}">
          <td class="c b">${rank}${medal}</td>
          <td>${esc(r.student.name)}</td>
          <td>${esc(teacherName(r.student))}</td>
          <td class="c b">${r.score}</td>
          <td class="c b">${r.pct}%</td>
          <td class="c">${esc(DB.gradeLabel(r.pct))}</td>
        </tr>`;
    }).join('');

    const body =
      header(
        I18n.t('pdf_exam_report', { exam: title }),
        `${esc(groupLabel)} — ${esc(I18n.t('out_of', { max: exam.maxScore }))}`
      ) +
      meta([
        [I18n.t('pdf_date'), dateNow()],
        [I18n.t('pdf_generated_by'), currentUserName()],
        [I18n.t('students'), rows.length],
        [I18n.t('max_score'), exam.maxScore]
      ]) +
      statBoxes([
        { v: rows.length,        l: I18n.t('students') },
        { v: avgPct + '%',       l: I18n.t('avg') },
        { v: topPct + '%',       l: '🥇 ' + I18n.t('percentage') },
        { v: lowPct + '%',       l: '⬇️ ' + I18n.t('percentage') }
      ]) +
      `<table class="main">
        <thead>
          <tr>
            <th class="c" style="width:11%">${esc(I18n.t('rank'))}</th>
            <th>${esc(I18n.t('student_name'))}</th>
            <th style="width:22%">${esc(I18n.t('assigned_teacher'))}</th>
            <th class="c" style="width:10%">${esc(I18n.t('score'))}</th>
            <th class="c" style="width:12%">${esc(I18n.t('percentage'))}</th>
            <th class="c" style="width:14%">${esc(I18n.t('grade_level'))}</th>
          </tr>
        </thead>
        <tbody>${trs}</tbody>
      </table>` +
      signature() +
      footer();

    return openPrint(buildDoc(
      I18n.t('pdf_exam_report', { exam: title }), body
    ));
  }

  /* =============================================================
     2) الترتيب النهائي لمجموعة (متوسط النسب عبر كل الاختبارات)
     ============================================================= */
  function overallRanking(group) {
    const rows = DB.overallRanking(group);
    if (!rows.length) return fail();

    const exams = DB.getExams(group);
    const groupLabel = I18n.t(group === 'kids' ? 'kids_group' : 'adults_group');
    const examsList = exams.map(e => DB.examTitle(e)).join(' + ');

    const trs = rows.map((r, i) => {
      const rank = i + 1;
      const medal = rank === 1 ? ' <span class="medal">🥇</span>'
                  : rank === 2 ? ' <span class="medal">🥈</span>'
                  : rank === 3 ? ' <span class="medal">🥉</span>' : '';
      const total = r.sumScore + ' / ' + r.sumMax;
      return `
        <tr class="${rank <= 3 ? 'top' : ''}">
          <td class="c b">${rank}${medal}</td>
          <td>${esc(r.student.name)}</td>
          <td>${esc(teacherName(r.student))}</td>
          <td class="c">${r.count}</td>
          <td class="c b">${total}</td>
          <td class="c b">${r.avgPct}%</td>
          <td class="c">${esc(DB.gradeLabel(r.avgPct))}</td>
        </tr>`;
    }).join('');

    const body =
      header(I18n.t('ranking'), esc(groupLabel)) +
      meta([
        [I18n.t('pdf_date'), dateNow()],
        [I18n.t('pdf_generated_by'), currentUserName()],
        [I18n.t('exams'), exams.length],
        [I18n.t('students'), rows.length]
      ]) +
      (examsList ? `<div style="font-size:10.5px;color:#555;margin-bottom:10px">
          <b>${esc(I18n.t('exams'))}:</b> ${esc(examsList)}
        </div>` : '') +
      `<table class="main">
        <thead>
          <tr>
            <th class="c" style="width:9%">${esc(I18n.t('rank'))}</th>
            <th>${esc(I18n.t('student_name'))}</th>
            <th style="width:19%">${esc(I18n.t('assigned_teacher'))}</th>
            <th class="c" style="width:9%">${esc(I18n.t('exams'))}</th>
            <th class="c" style="width:13%">${esc(I18n.t('total'))}</th>
            <th class="c" style="width:12%">${esc(I18n.t('percentage'))}</th>
            <th class="c" style="width:12%">${esc(I18n.t('grade_level'))}</th>
          </tr>
        </thead>
        <tbody>${trs}</tbody>
      </table>` +
      signature() +
      footer();

    return openPrint(buildDoc(I18n.t('ranking') + ' — ' + groupLabel, body));
  }

  /* =============================================================
     3) كشف الطلاب (أسماء + أساتذة + أعمار + ملاحظات)
     ============================================================= */
  function studentsList(group) {
    const students = DB.getStudents(group);
    if (!students.length) return fail();

    const groupLabel = I18n.t(group === 'kids' ? 'kids_group' : 'adults_group');

    const trs = students.map((s, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td class="b">${esc(s.name)}</td>
        <td class="c">${s.age || '—'}</td>
        <td>${esc(teacherName(s))}</td>
        <td>${esc(s.notes || '—')}</td>
      </tr>`).join('');

    const body =
      header(I18n.t('students'), esc(groupLabel)) +
      meta([
        [I18n.t('pdf_date'), dateNow()],
        [I18n.t('pdf_generated_by'), currentUserName()],
        [I18n.t('students'), students.length]
      ]) +
      `<table class="main">
        <thead>
          <tr>
            <th class="c" style="width:8%">#</th>
            <th>${esc(I18n.t('student_name'))}</th>
            <th class="c" style="width:10%">${esc(I18n.t('age'))}</th>
            <th style="width:24%">${esc(I18n.t('assigned_teacher'))}</th>
            <th style="width:26%">${esc(I18n.t('notes'))}</th>
          </tr>
        </thead>
        <tbody>${trs}</tbody>
      </table>` +
      signature() +
      footer();

    return openPrint(buildDoc(I18n.t('students') + ' — ' + groupLabel, body));
  }

  /* =============================================================
     4) برنامج يوم الاختتام الصيفي (المهرجانية) 🎉
     ============================================================= */
  function ceremonyProgram() {
    const adults = DB.getSegments('adults');
    const kids = DB.getSegments('kids');
    if (!adults.length && !kids.length) return fail();

    /* قسم واحد (كبار/صغار) بفقراته المرقمة ومشاركيه */
    function section(list, label, isKids) {
      if (!list.length) return '';
      const segsHTML = list.map((seg, i) => {
        const parts = seg.participants || [];
        const names = parts.map(p => esc(p.name)).join(' • ');
        return `
          <div class="seg">
            <div class="seg-head">
              <span class="num">${i + 1}</span>
              <span>${esc(DB.segmentTitle(seg))}</span>
              <span class="cnt">${parts.length} ${esc(I18n.t('participants'))}</span>
            </div>
            <div class="parts ${names ? '' : 'none'}">${names || esc(I18n.t('no_participants'))}</div>
          </div>`;
      }).join('');

      return `<h2 class="sec ${isKids ? 'kids' : ''}">
                ${isKids ? '🧒' : '📖'} ${esc(label)}
              </h2>${segsHTML}`;
    }

    const totalParticipants =
      adults.concat(kids).reduce(
        (acc, s) => acc + (s.participants || []).length, 0
      );

    const body =
      header(
        I18n.t('ceremony_title'),
        I18n.t('ceremony_desc')
      ) +
      meta([
        [I18n.t('pdf_date'), dateNow()],
        [I18n.t('pdf_generated_by'), currentUserName()],
        [I18n.t('segments'), adults.length + kids.length],
        [I18n.t('participants'), totalParticipants]
      ]) +
      section(adults, I18n.t('adults_section'), false) +
      /* قسم الصغار في صفحة جديدة عند وجود القسمين معاً */
      (adults.length && kids.length
        ? '<div class="pb"></div>' + section(kids, I18n.t('kids_section'), true)
        : section(kids, I18n.t('kids_section'), true)) +
      signature() +
      footer();

    return openPrint(buildDoc(I18n.t('ceremony_title'), body));
  }

  /* =============================================================
     الواجهة العامة للوحدة
     ============================================================= */
  return {
    examReport,
    overallRanking,
    studentsList,
    ceremonyProgram
  };
})();
