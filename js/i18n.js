'use strict';

/* =========================================================
   نظام الاختتام الصيفي — محرك اللغات الثلاث
   الملف رقم (3) من (12) : js/i18n.js  (نسخة كاملة مصححة)
   ---------------------------------------------------------
   اللغات: ar العربية (RTL) / am አማርኛ (LTR) / en English (LTR)
   + مفاتيح جديدة لتصدير PDF
   ========================================================= */

const I18N_DICT = {

  /* =============================================================
     العربية (اللغة الأساسية — المرجع عند نقص أي ترجمة)
     ============================================================= */
  ar: {
    /* ---------- عام ---------- */
    ok: 'موافق',
    save: 'حفظ',
    cancel: 'إلغاء',
    close: 'إغلاق',
    confirm: 'تأكيد',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    view: 'عرض',
    actions: 'إجراءات',
    search: 'بحث',
    name: 'الاسم',
    notes: 'ملاحظات',
    optional: 'اختياري',
    all: 'الكل',
    total: 'الإجمالي',
    average: 'المتوسط',
    print: '🖨️ طباعة',
    yes: 'نعم',
    no: 'لا',

    /* ---------- التطبيق ---------- */
    app_title: 'نظام الاختتام 'الشتاء,
    app_subtitle: 'خاص بالمشرف العام والأساتذة',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    login_btn: 'دخول',
    install_app: '📥 تثبيت التطبيق',
    add_account: '➕ زيادة حساب',
    change_my_password: 'تغيير كلمة المرور',
    logout: 'خروج',
    swipe_hint: '💡 اسحب يميناً أو يساراً للتنقل بين الأقسام',

    /* ---------- التبويبات ---------- */
    tab_10^: '📖 الكبار',
    tab_kids: '🧒 الصغار',
    tab_ceremony: '🎉 الاختتام الصيفي',
    tab_admin: '🛡️ لوحة المشرف',

    /* ---------- الأدوار ---------- */
    role_admin: 'المشرف العام',
    role_teacher: 'أستاذ',
    supervisor: 'المشرف العام',
    teacher: 'أستاذ',

    /* ---------- رسائل الدخول وكلمة المرور ---------- */
    login_error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
    login_success: 'مرحباً {name} 👋',
    logout_confirm: 'هل تريد تسجيل الخروج؟',
    logout_success: 'تم تسجيل الخروج بنجاح',
    current_password: 'كلمة المرور الحالية',
    new_password: 'كلمة المرور الجديدة',
    confirm_password: 'تأكيد كلمة المرور',
    wrong_current_password: 'كلمة المرور الحالية غير صحيحة',
    password_changed: 'تم تغيير كلمة المرور بنجاح ✓',
    password_mismatch: 'كلمتا المرور غير متطابقتين',
    password_too_short: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل',
    keep_password_hint: 'اتركه فارغاً للإبقاء على كلمة المرور الحالية',

    /* ---------- أسماء الأساتذة الافتراضيين ---------- */
    teacher_jihad: 'أستاذ جهاد أحمد',
    teacher_hassan: 'أستاذ حسن',
    teacher_nour: 'أستاذ محمد نور سبو',
    teacher_mohamed: 'أستاذ محمد حسن',
    teacher_khiyar: 'أستاذ خيار كمال',

    /* ---------- المواد ---------- */
    subj_quran: 'القرآن الكريم',
    subj_fiqh: 'الفقه',
    subj_aqidah: 'العقيدة',
    subj_sirah: 'السيرة النبوية',
    subj_tajwid: 'التجويد',
    subj_akhlaq: 'الأخلاق',
    subj_khat: 'الخط',
    subj_quran_kids: 'الاختبار القرآني الأساسي',

    /* ---------- الطلاب ---------- */
    students: 'الطلاب',
    student: 'الطالب',
    add_student: '➕ إضافة طالب',
    edit_student: '✏️ تعديل طالب',
    student_name: 'اسم الطالب',
    assigned_teacher: 'الأستاذ المسؤول',
    no_students: 'لا يوجد طلاب بعد — أضف أول طالب',
    delete_student_confirm: 'هل تريد حذف الطالب «{name}»؟',
    student_saved: 'تم حفظ الطالب بنجاح ✓',
    student_deleted: 'تم حذف الطالب ✓',
    search_student: '🔍 ابحث عن طالب...',
    student_count: '{count} طالب',
    age: 'العمر',
    kids_group: 'مجموعة الصغار',
    10^_group: 'مجموعة الكبار',

    /* ---------- الاختبارات ---------- */
    exams: 'الاختبارات',
    exam: 'اختبار',
    subject: 'المادة',
    add_exam: '➕ إنشاء اختبار',
    edit_exam: '✏️ تعديل الاختبار',
    exam_title: 'عنوان الاختبار',
    max_score: 'الدرجة العظمى',
    max_score_hint: 'مثال: 10 أو 25 أو 50 — تُحسب النسبة المئوية منها',
    delete_exam_confirm: 'حذف هذا الاختبار سيحذف درجاته أيضاً. هل أنت متأكد؟',
    exam_saved: 'تم حفظ الاختبار ✓',
    exam_deleted: 'تم حذف الاختبار ✓',
    no_exams: 'لا توجد اختبارات — أنشئ اختباراً جديداً',
    exam_date: 'تاريخ الاختبار (اختياري)',

    /* ---------- الدرجات والترتيب ---------- */
    grades: 'الدرجات',
    score: 'الدرجة',
    percentage: 'النسبة المئوية',
    rank: 'الترتيب',
    grade_level: 'التقدير',
    level_excellent: 'ممتاز',
    level_good: 'جيد',
    level_fair: 'مقبول',
    level_weak: 'ضعيف',
    enter_scores: 'تسجيل الدرجات',
    save_scores: '💾 حفظ الدرجات',
    scores_saved: 'تم حفظ الدرجات ✓',
    invalid_score: 'درجة غير صالحة',
    score_exceeds_max: 'الدرجة أكبر من العظمى ({max})',
    no_scores: 'لم تُسجل درجات بعد',
    out_of: 'من {max}',
    ranking: 'الترتيب النهائي (حسب النسبة المئوية)',
    sorted_by_pct: 'مرتبة تلقائياً: الأعلى نسبةً أولاً 🥇',
    avg: 'المتوسط',

    /* ---------- 🆕 تصدير PDF ---------- */
    export_pdf: '📄 PDF',
    export_pdf_report: '📄 تصدير التقرير PDF',
    pdf_report_title: 'تقرير درجات الطلاب',
    pdf_exam_report: 'تقرير اختبار: {exam}',
    pdf_generated_by: 'أُنشئ بواسطة',
    pdf_date: 'التاريخ',
    pdf_school: 'مدرسة الاختتام الشتاء',
    pdf_print_hint: 'اختر «حفظ كـ PDF» من نافذة الطباعة للحفظ',
    pdf_preparing: 'جاري تحضير التقرير...',
    pdf_ready: 'فتح نافذة الطباعة — اختر «حفظ كـ PDF» 📄',
    pdf_no_data: 'لا توجد بيانات للتصدير',
    pdf_footer: 'نظام الاختتام الشتاء — تقرير آلي',
    pdf_signature: 'توقيع الأستاذ',
    pdf_signature_supervisor: 'توقيع المشرف العام',

    /* ---------- المهرجانية (يوم الاختتام) ---------- */
    ceremony_title: 'يوم اختتام الصيف (المهرجانية) 🎉',
    ceremony_desc: 'برنامج عروض الطلاب أمام المجتمع — قابل للتعديل والإضافة في أي وقت',
    segments: 'فقرات البرنامج',
    participants: 'المشاركون',
    add_segment: '➕ إضافة فقرة',
    edit_segment: '✏️ تعديل الفقرة',
    segment_title: 'عنوان الفقرة',
    delete_segment_confirm: 'هل تريد حذف فقرة «{title}»؟',
    segment_saved: 'تم حفظ الفقرة ✓',
    segment_deleted: 'تم حذف الفقرة ✓',
    no_segments: 'لا توجد فقرات — أضف فقرة جديدة',
    participants_count: '{count} مشارك',
    add_participant: 'إضافة مشارك',
    participant_name: 'اسم المشارك',
    no_participants: 'لا يوجد مشاركون بعد',
    adults_section: 'قسم الكبار',
    kids_section: 'قسم الصغار',
    choose_student: 'اختر طالباً من القائمة أو اكتب اسماً حراً',
    order: 'الترتيب',

    /* فقرات الكبار الافتراضية */
    seg_stories: 'قصص الصحابة',
    seg_poetry: 'الشعر',
    seg_khutbah: 'الخطبة',
    seg_virtues: 'فضائل القرآن',
    seg_fiqh_qa: 'الفقه (طالبان: سؤال وجواب بتحضير ذاتي)',
    seg_aqidah_self: 'العقيدة (تحضير ذاتي)',
    seg_sirah_c: 'السيرة',
    seg_tajwid_c: 'التجويد',

    /* فقرات الصغار الافتراضية */
    seg_k_aqidah: 'العقيدة (سؤال وجواب)',
    seg_k_fiqh: 'الفقه (سؤال وجواب / كيفية الصلاة)',
    seg_k_sirah: 'السيرة',
    seg_k_tajwid: 'التجويد',
    seg_k_akhlaq: 'الأخلاق',
    seg_k_quran_hifz: 'القرآن الكريم (قسم الحفظ)',
    seg_k_norania: 'القاعدة النورانية (الحروف الهجائية + الدرس الرابع والخامس: أبدا، أحد، أخذ، أذن، أمر)',

    /* ---------- لوحة المشرف ---------- */
    admin_panel: 'لوحة المشرف العام',
    admin_welcome: 'مراقبة وإدارة شاملة لكل شيء في النظام',
    accounts: 'الحسابات',
    account_name: 'الاسم الكامل',
    account_username: 'اسم المستخدم',
    account_password: 'كلمة المرور',
    account_role: 'الدور',
    add_account_title: 'إنشاء حساب جديد',
    edit_account_title: 'تعديل الحساب',
    delete_account_confirm: 'هل تريد حذف حساب «{name}»؟',
    account_saved: 'تم حفظ الحساب ✓',
    account_deleted: 'تم حذف الحساب ✓',
    username_exists: 'اسم المستخدم مستخدم مسبقاً',
    cannot_delete_self: 'لا يمكنك حذف حسابك الحالي',
    cannot_delete_last_admin: 'لا يمكن حذف آخر حساب مشرف',
    system_stats: 'إحصائيات النظام',
    total_students: 'إجمالي الطلاب',
    total_exams: 'إجمالي الاختبارات',
    total_accounts: 'إجمالي الحسابات',
    total_segments: 'فقرات المهرجانية',
    records_overview: 'سجلات الأساتذة',
    teacher_records: 'إدخالات {teacher}',
    monitoring_note: 'بصفتك مشرفاً عاماً يمكنك تعديل أو حذف أي إدخال. الأساتذة يرون كل شيء لكن يعدّلون إدخالاتهم فقط.',
    edit_restricted: 'أستاذ: يعدّل إدخالاته فقط — المشرف: يعدّل كل شيء',
    created_by: 'أُنشئ بواسطة: {name}',
    backup: '💾 نسخة احتياطية',
    restore: '♻️ استعادة نسخة',
    backup_saved: 'تم تنزيل النسخة الاحتياطية ✓',
    backup_restored: 'تمت استعادة البيانات ✓',
    backup_invalid: 'ملف النسخة الاحتياطية غير صالح',

    /* ---------- تنبيهات عامة ---------- */
    confirm_title: 'تأكيد',
    error_title: 'خطأ',
    success_title: 'نجاح',
    saved: 'تم الحفظ ✓',
    deleted: 'تم الحذف ✓',
    error_generic: 'حدث خطأ — حاول مجدداً',

    /* ---------- PWA ---------- */
    installed: 'تم تثبيت التطبيق 🎉',
    offline_ready: 'التطبيق جاهز للعمل بدون إنترنت ✓'
  },

  /* =============================================================
     አማርኛ — الأمهرية
     ============================================================= */
  am: {
    /* ---------- አጠቃላይ ---------- */
    ok: 'እሺ',
    save: 'አስቀምጥ',
    cancel: 'ተው',
    close: 'ዝጋ',
    confirm: 'አረጋግጥ',
    delete: 'አጥፋ',
    edit: 'አስተካክል',
    add: 'ጨምር',
    view: 'ተመልከት',
    actions: 'ተግባራት',
    search: 'ፍለጋ',
    name: 'ስም',
    notes: 'ማስታወሻዎች',
    optional: 'አማራጭ',
    all: 'ሁሉም',
    total: 'ጠቅላላ',
    average: 'አማካይ',
    print: '🖨️ አትም',
    yes: 'አዎ',
    no: 'አይ',

    /* ---------- መተግበሪያ ---------- */
    app_title: 'የክረምት ማጠናቀቂያ ሥርዓት',
    app_subtitle: 'ለዋና ሱፐርቫይዘር እና መምህራን ብቻ',
    username: 'የተጠቃሚ ስም',
    password: 'የመግቢያ ቃል',
    login_btn: 'ግባ',
    install_app: '📥 መተግበሪያ ጫን',
    add_account: '➕ መለያ ጨምር',
    change_my_password: 'የመግቢያ ቃል ቀይር',
    logout: 'ውጣ',
    swipe_hint: '💡 በክፍሎች መካከል ለመንቀሳቀስ ወደ ቀኝ ወይም ግራ ይጎትቱ',

    /* ---------- ትሮች ---------- */
    tab_10^: '📖 ትላልቆች',
    tab_kids: '🧒 ልጆች',
    tab_ceremony: '🎉 የበጋ ማጠናቀቂያ',
    tab_admin: '🛡️ የሱፐርቫይዘር ፓነል',

    /* ---------- ሚናዎች ---------- */
    role_admin: 'ዋና ሱፐርቫይዘር',
    role_teacher: 'መምህር',
    supervisor: 'ዋና ሱፐርቫይዘር',
    teacher: 'መምህር',

    /* ---------- የግቢያ መልእክቶች ---------- */
    login_error: 'የተጠቃሚ ስም ወይም የመግቢያ ቃል ትክክል አይደለም',
    login_success: 'እንኳን ደህና መጡ {name} 👋',
    logout_confirm: 'መውጣት ይፈልጋሉ?',
    logout_success: 'በተሳካ ሁኔታ ወጥተዋል',
    current_password: 'አሁን ያለው የመግቢያ ቃል',
    new_password: 'አዲስ የመግቢያ ቃል',
    confirm_password: 'የመግቢያ ቃል ደግመው ይጻፉ',
    wrong_current_password: 'አሁን ያለው የመግቢያ ቃል ትክክል አይደለም',
    password_changed: 'የመግቢያ ቃል ተቀይሯል ✓',
    password_mismatch: 'የመግቢያ ቃላቱ አይመሳሰሉም',
    password_too_short: 'የመግቢያ ቃል ቢያንስ 4 ፊደላት መሆን አለበት',
    keep_password_hint: 'ነባሩን ለመቀጠል ባዶ ይተዉት',

    /* ---------- የመምህራን ስሞች ---------- */
    teacher_jihad: 'መምህር ጅሃድ አሕመድ',
    teacher_hassan: 'መምህር ሀሰን',
    teacher_nour: 'መምህር ሙሐመድ ኑር ሰቡ',
    teacher_mohamed: 'መምህር ሙሐመድ ሀሰን',
    teacher_khiyar: 'መምህር ኪያር ከማል',

    /* ---------- ትምህርቶች ---------- */
    subj_quran: 'ቁርዓን',
    subj_fiqh: 'ፊቅህ',
    subj_aqidah: 'አቂዳ',
    subj_sirah: 'ሲራ',
    subj_tajwid: 'ተጅዊድ',
    subj_akhlaq: 'አኽላቅ (ሞራል)',
    subj_khat: 'ጽሕፈት ኸጥ (ካሊግራፊ)',
    subj_quran_kids: 'መሰረታዊ የቁርዓን ፈተና',

    /* ---------- ተማሪዎች ---------- */
    students: 'ተማሪዎች',
    student: 'ተማሪ',
    add_student: '➕ ተማሪ ጨምር',
    edit_student: '✏️ ተማሪ አስተካክል',
    student_name: 'የተማሪው ስም',
    assigned_teacher: 'ተጠያቂ መምህር',
    no_students: 'እስካሁን ተማሪ የለም — የመጀመሪያውን ተማሪ ይጨምሩ',
    delete_student_confirm: '«{name}» የተባለውን ተማሪ ማጥፋት ይፈልጋሉ?',
    student_saved: 'ተማሪው ተቀምጧል ✓',
    student_deleted: 'ተማሪው ጠፍቷል ✓',
    search_student: '🔍 ተማሪ ይፈልጉ...',
    student_count: '{count} ተማሪ',
    age: 'ዕድሜ',
    kids_group: 'የልጆች ቡድን',
    adults_group: 'የትላልቆች ቡድን',

    /* ---------- ፈተናዎች ---------- */
    exams: 'ፈተናዎች',
    exam: 'ፈተና',
    subject: 'ትምህርት',
    add_exam: '➕ ፈተና ፍጠር',
    edit_exam: '✏️ ፈተና አስተካክል',
    exam_title: 'የፈተናው ርዕስ',
    max_score: 'ከፍተኛ ነጥብ',
    max_score_hint: 'ምሳሌ፦ 10፣ 25 ወይም 50 — መቶኛው ከዚህ ይሰላል',
    delete_exam_confirm: 'ይህን ፈተና ማጥፋት ነጥቦቹንም ያጠፋል። እርግጠኛ ነዎት?',
    exam_saved: 'ፈተናው ተቀምጧል ✓',
    exam_deleted: 'ፈተናው ተጠፍቷል ✓',
    no_exams: 'ፈተና የለም — አዲስ ፈተና ይፍጠሩ',
    exam_date: 'የፈተናው ቀን (አማራጭ)',

    /* ---------- ነጥቦችና ደረጃ ---------- */
    grades: 'ነጥቦች',
    score: 'ነጥብ',
    percentage: 'መቶኛ',
    rank: 'ደረጃ',
    grade_level: 'ግምገማ',
    level_excellent: 'በጣም ጥሩ',
    level_good: 'ጥሩ',
    level_fair: 'መካከለኛ',
    level_weak: 'ደካማ',
    enter_scores: 'ነጥቦችን መዝግብ',
    save_scores: '💾 ነጥቦችን አስቀምጥ',
    scores_saved: 'ነጥቦቹ ተቀምጠዋል ✓',
    invalid_score: 'የተሳሳተ ነጥብ',
    score_exceeds_max: 'ነጥቡ ከከፍተኛው ይበልጣል ({max})',
    no_scores: 'እስካሁን ነጥብ አልተመዘገበም',
    out_of: 'ከ{max}',
    ranking: 'የመጨረሻ ደረጃ (በመቶኛ)',
    sorted_by_pct: 'በራስ-ሰር ተለይቷል፦ ከፍተኛ መቶኛ በመጀመሪያ 🥇',
    avg: 'አማካይ',

    /* ---------- 🆕 PDF ላክ ---------- */
    export_pdf: '📄 PDF',
    export_pdf_report: '📄 ሪፖርት ወደ PDF ላክ',
    pdf_report_title: 'የተማሪዎች ነጥብ ሪፖርት',
    pdf_exam_report: 'የፈተና ሪፖርት፦ {exam}',
    pdf_generated_by: 'ተፈጠረ በ',
    pdf_date: 'ቀን',
    pdf_school: 'የክረምት ማጠናቀቂያ ትምህርት ቤት',
    pdf_print_hint: 'ለማስቀመጥ ከህትመት መስኮቱ «እንደ PDF አስቀምጥ» ይምረጡ',
    pdf_preparing: 'ሪፖርቱ በዝግጅት ላይ...',
    pdf_ready: 'የህትመት መስኮት ተከፈተ — «እንደ PDF አስቀምጥ» ይምረጡ 📄',
    pdf_no_data: 'ለመላክ የሚሆን መረጃ የለም',
    pdf_footer: 'የክረምት ማጠናቀቂያ ሥርዓት — ራስ-ሰር ሪፖርት',
    pdf_signature: 'የመምህሩ ፊርማ',
    pdf_signature_supervisor: 'የሱፐርቫይዘሩ ፊርማ',

    /* ---------- የማጠናቀቂያ ቀን ---------- */
    ceremony_title: 'የክረምት ማጠናቀቂያ ቀን (መዝጊያ) 🎉',
    ceremony_desc: 'የተማሪዎች ትርኢቶች ለማህበረሰብ — በየትኛውም ጊዜ ማስተካከል፣ መጨመር ወይም ማጥፋት ይቻላል',
    segments: 'የፕሮግራም ክፍሎች',
    participants: 'ተሳታፊዎች',
    add_segment: '➕ ክፍል ጨምር',
    edit_segment: '✏️ ክፍል አስተካክል',
    segment_title: 'የክፍሉ ርዕስ',
    delete_segment_confirm: '«{title}» ክፍልን ማጥፋት ይፈልጋሉ?',
    segment_saved: 'ክፍሉ ተቀምጧል ✓',
    segment_deleted: 'ክፍሉ ጠፍቷል ✓',
    no_segments: 'ክፍል የለም — አዲስ ክፍል ይጨምሩ',
    participants_count: '{count} ተሳታፊ',
    add_participant: 'ተሳታፊ ጨምር',
    participant_name: 'የተሳታፊው ስም',
    no_participants: 'እስካሁን ተሳታፊ የለም',
    adults_section: 'የትላልቆች ክፍል',
    kids_section: 'የልጆች ክፍል',
    choose_student: 'ከዝርዝሩ ተማሪ ይምረጡ ወይም ነጻ ስም ይጻፉ',
    order: 'ቅደም ተከተል',

    /* የትላልቆች ክፍሎች */
    seg_stories: 'የሰሃባዎች ታሪኮች',
    seg_poetry: 'ግጥም',
    seg_khutbah: 'ኹጥባ (ምክር)',
    seg_virtues: 'የቁርዓን ትሩፋቶች',
    seg_fiqh_qa: 'ፍቅህ (ሁለት ተማሪዎች፦ ጥያቄና መልስ በራስ ዝግጅት)',
    seg_aqidah_self: 'አቂዳ (በራስ ዝግጅት)',
    seg_sirah_c: 'ሲራ',
    seg_tajwid_c: 'ተጅዊድ',

    /* የልጆች ክፍሎች */
    seg_k_aqidah: 'አቂዳ (ጥያቄና መልስ)',
    seg_k_fiqh: 'ፍቅህ (ጥያቄና መልስ / የሶላት አከባበል)',
    seg_k_sirah: 'ሲራ',
    seg_k_tajwid: 'ተጅዊድ',
    seg_k_akhlaq: 'አኽላቅ (ፀባይ)',
    seg_k_quran_hifz: 'ቁርዓን (የማስታወስ ክፍል)',
    seg_k_norania: 'ቃዒዳ ኑራኒያ(ፊደላት + አራተኛና አምስተኛ ትምህርት)',

    /* ---------- የሱፐርቫይዘር ፓነል ---------- */
    admin_panel: 'የዋና ሱፐርቫይዘር ፓነል',
    admin_welcome: 'በሥርዓቱ ውስጥ ያለውን ሁሉ መከታተልና ማስተዳደር',
    accounts: 'መለያዎች',
    account_name: 'ሙሉ ስም',
    account_username: 'የተጠቃሚ ስም',
    account_password: 'የመግቢያ ቃል',
    account_role: 'ሚና',
    add_account_title: 'አዲስ መለያ ፍጠር',
    edit_account_title: 'መለያ አስተካክል',
    delete_account_confirm: '«{name}» መለያን ማጥፋት ይፈልጋሉ?',
    account_saved: 'መለያው ተቀምጧል ✓',
    account_deleted: 'መለያው ጠፍቷል ✓',
    username_exists: 'የተጠቃሚ ስም ቀድሞ ተጠቅሷል',
    cannot_delete_self: 'የእርስዎን የአሁኑ መለያ ማጥፋት አይችሉም',
    cannot_delete_last_admin: 'የመጨረሻውን የሱፐርቫይዘር መለያ ማጥፋት አይቻልም',
    system_stats: 'የሥርዓት ስታቲስቲክስ',
    total_students: 'ጠቅላላ ተማሪዎች',
    total_exams: 'ጠቅላላ ፈተናዎች',
    total_accounts: 'ጠቅላላ መለያዎች',
    total_segments: 'የዝግጅቱ ክፍሎች',
    records_overview: 'የመምህራን መዛግብት',
    teacher_records: 'የ{teacher} ግብዓቶች',
    monitoring_note: 'እንደ ዋና ሱፐርቫይዘር ማንኛውንም ግብዓት ማስተካከል ወይም ማጥፋት ይችላሉ። መምህራን ሁሉንም ያያሉ ግን የራሳቸውን ግብዓት ብቻ ያስተካክላሉ።',
    edit_restricted: 'መምህር፦ የራሱን ግብዓት ብቻ — ሱፐርቫይዘር፦ ሁሉንም',
    created_by: 'ተፈጠረ በ{name}',
    backup: '💾 መጠባበቂያ ቅጂ',
    restore: '♻️ መጠባበቂያ መልስ',
    backup_saved: 'መጠባበቂያው ወርዷል ✓',
    backup_restored: 'መረጃው ተመልሷል ✓',
    backup_invalid: 'የመጠባበቂያ ፋይሉ ትክክል አይደለም',

    /* ---------- አጠቃላይ መልእክቶች ---------- */
    confirm_title: 'ማረጋገጫ',
    error_title: 'ስህተት',
    success_title: 'ስኬት',
    saved: 'ተቀምጧል ✓',
    deleted: 'ጠፍቷል ✓',
    error_generic: 'ስህተት ተከስቷል — እንደገና ይሞክሩ',

    /* ---------- PWA ---------- */
    installed: 'መተግበሪያው ተጭኗል 🎉',
    offline_ready: 'መተግበሪያው ያለ ኢንተርኔት ዝግጁ ነው ✓'
  },

  /* =============================================================
     English
     ============================================================= */
  en: {
    /* ---------- Common ---------- */
    ok: 'OK',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    view: 'View',
    actions: 'Actions',
    search: 'Search',
    name: 'Name',
    notes: 'Notes',
    optional: 'optional',
    all: 'All',
    total: 'Total',
    average: 'Average',
    print: '🖨️ Print',
    yes: 'Yes',
    no: 'No',

    /* ---------- App ---------- */
    app_title: 'Summer Closing System',
    app_subtitle: 'For the General Supervisor & Teachers only',
    username: 'Username',
    password: 'Password',
    login_btn: 'Login',
    install_app: '📥 Install App',
    add_account: '➕ Add Account',
    change_my_password: 'Change my password',
    logout: 'Logout',
    swipe_hint: '💡 Swipe right or left to navigate between sections',

    /* ---------- Tabs ---------- */
    tab_10^: '📖 Adults',
    tab_kids: '🧒 Kids',
    tab_ceremony: '🎉 Summer Closing',
    tab_admin: '🛡️ Supervisor Panel',

    /* ---------- Roles ---------- */
    role_admin: 'Supervisor',
    role_teacher: 'Teacher',
    supervisor: 'General Supervisor',
    teacher: 'Teacher',

    /* ---------- Login & password ---------- */
    login_error: 'Incorrect username or password',
    login_success: 'Welcome {name} 👋',
    logout_confirm: 'Do you want to log out?',
    logout_success: 'Logged out successfully',
    current_password: 'Current password',
    new_password: 'New password',
    confirm_password: 'Confirm password',
    wrong_current_password: 'Current password is incorrect',
    password_changed: 'Password changed successfully ✓',
    password_mismatch: 'Passwords do not match',
    password_too_short: 'Password must be at least 4 characters',
    keep_password_hint: 'Leave empty to keep the current password',

    /* ---------- Default teacher names ---------- */
    teacher_jihad: 'Ustaz Jihad Ahmed',
    teacher_hassan: 'Ustaz Hassan',
    teacher_nour: 'Ustaz Muhamed Nur Sabu',
    teacher_mohamed: 'Ustaz Mohamed Hassan',
    teacher_khiyar: 'Ustaz Khiyar Kamal',

    /* ---------- Subjects ---------- */
    subj_quran: 'Quran',
    subj_fiqh: 'Fiqh',
    subj_aqidah: 'Aqidah',
    subj_sirah: 'Sirah',
    subj_tajwid: 'Tajwid',
    subj_akhlaq: 'Akhlaq (Manners)',
    subj_khat: 'Calligraphy',
    subj_quran_kids: 'Basic Quran Exam',

    /* ---------- Students ---------- */
    students: 'Students',
    student: 'Student',
    add_student: '➕ Add Student',
    edit_student: '✏️ Edit Student',
    student_name: 'Student name',
    assigned_teacher: 'Supervising teacher',
    no_students: 'No students yet — add the first one',
    delete_student_confirm: 'Delete student "{name}"?',
    student_saved: 'Student saved ✓',
    student_deleted: 'Student deleted ✓',
    search_student: '🔍 Search student...',
    student_count: '{count} students',
    age: 'Age',
    kids_group: 'Kids group',
    adults_group: '10^ group',

    /* ---------- Exams ---------- */
    exams: 'Exams',
    exam: 'Exam',
    subject: 'Subject',
    add_exam: '➕ Create Exam',
    edit_exam: '✏️ Edit Exam',
    exam_title: 'Exam title',
    max_score: 'Max score',
    max_score_hint: 'e.g. 10, 25 or 50 — the percentage is computed from it',
    delete_exam_confirm: 'Deleting this exam will also delete its scores. Are you sure?',
    exam_saved: 'Exam saved ✓',
    exam_deleted: 'Exam deleted ✓',
    no_exams: 'No exams yet — create a new one',
    exam_date: 'Exam date (optional)',

    /* ---------- Grades & ranking ---------- */
    grades: 'Grades',
    score: 'Score',
    percentage: 'Percentage',
    rank: 'Rank',
    grade_level: 'Level',
    level_excellent: 'Excellent',
    level_good: 'Good',
    level_fair: 'Fair',
    level_weak: 'Weak',
    enter_scores: 'Enter scores',
    save_scores: '💾 Save Scores',
    scores_saved: 'Scores saved ✓',
    invalid_score: 'Invalid score',
    score_exceeds_max: 'Score exceeds the maximum ({max})',
    no_scores: 'No scores recorded yet',
    out_of: 'out of {max}',
    ranking: 'Final ranking (by percentage)',
    sorted_by_pct: 'Auto-sorted: highest percentage first 🥇',
    avg: 'Avg',

    /* ---------- 🆕 PDF export ---------- */
    export_pdf: '📄 PDF',
    export_pdf_report: '📄 Export Report PDF',
    pdf_report_title: 'Student Grades Report',
    pdf_exam_report: 'Exam report: {exam}',
    pdf_generated_by: 'Generated by',
    pdf_date: 'Date',
    pdf_school: 'Summer Closing School',
    pdf_print_hint: 'Choose "Save as PDF" in the print dialog to save',
    pdf_preparing: 'Preparing report...',
    pdf_ready: 'Print dialog opened — choose "Save as PDF" 📄',
    pdf_no_data: 'No data to export',
    pdf_footer: 'Summer Closing System — automated report',
    pdf_signature: 'Teacher signature',
    pdf_signature_supervisor: 'Supervisor signature',

    /* ---------- Ceremony day ---------- */
    ceremony_title: 'Summer Closing Day (Festival) 🎉',
    ceremony_desc: 'Program of student performances in front of the community — editable anytime',
    segments: 'Program segments',
    participants: 'Participants',
    add_segment: '➕ Add Segment',
    edit_segment: '✏️ Edit Segment',
    segment_title: 'Segment title',
    delete_segment_confirm: 'Delete segment "{title}"?',
    segment_saved: 'Segment saved ✓',
    segment_deleted: 'Segment deleted ✓',
    no_segments: 'No segments yet — add a new one',
    participants_count: '{count} participants',
    add_participant: 'Add participant',
    participant_name: 'Participant name',
    no_participants: 'No participants yet',
    adults_section: 'Adults Section',
    kids_section: 'Kids Section',
    choose_student: 'Pick a student from the list or type a free name',
    order: 'Order',

    /* Default adults segments */
    seg_stories: 'Stories of the Companions',
    seg_poetry: 'Poetry',
    seg_khutbah: 'Khutbah (Speech)',
    seg_virtues: 'Virtues of the Quran',
    seg_fiqh_qa: 'Fiqh (two students: Q&A with self-preparation)',
    seg_aqidah_self: 'Aqidah (self-prepared)',
    seg_sirah_c: 'Sirah',
    seg_tajwid_c: 'Tajwid',

    /* Default kids segments */
    seg_k_aqidah: 'Aqidah (Q&A)',
    seg_k_fiqh: 'Fiqh (Q&A / How to perform Prayer)',
    seg_k_sirah: 'Sirah',
    seg_k_tajwid: 'Tajwid',
    seg_k_akhlaq: 'Akhlaq (Manners)',
    seg_k_quran_hifz: 'Quran (Memorization section)',
    seg_k_norania: 'Norania Qaida (alphabet + lessons 4 & 5)',

    /* ---------- Supervisor panel ---------- */
    admin_panel: 'General Supervisor Panel',
    admin_welcome: 'Full monitoring & management of everything in the system',
    accounts: 'Accounts',
    account_name: 'Full name',
    account_username: 'Username',
    account_password: 'Password',
    account_role: 'Role',
    add_account_title: 'Create New Account',
    edit_account_title: 'Edit Account',
    delete_account_confirm: 'Delete account "{name}"?',
    account_saved: 'Account saved ✓',
    account_deleted: 'Account deleted ✓',
    username_exists: 'Username already taken',
    cannot_delete_self: 'You cannot delete your own current account',
    cannot_delete_last_admin: 'Cannot delete the last supervisor account',
    system_stats: 'System Statistics',
    total_students: 'Total students',
    total_exams: 'Total exams',
    total_accounts: 'Total accounts',
    total_segments: 'Festival segments',
    records_overview: 'Teachers records',
    teacher_records: 'Entries by {teacher}',
    monitoring_note: 'As a supervisor you can edit or delete any entry. Teachers can see everything but edit only their own entries.',
    edit_restricted: 'Teacher: edits own entries only — Supervisor: edits everything',
    created_by: 'Created by: {name}',
    backup: '💾 Backup',
    restore: '♻️ Restore backup',
    backup_saved: 'Backup downloaded ✓',
    backup_restored: 'Data restored ✓',
    backup_invalid: 'Invalid backup file',

    /* ---------- General messages ---------- */
    confirm_title: 'Confirmation',
    error_title: 'Error',
    success_title: 'Success',
    saved: 'Saved ✓',
    deleted: 'Deleted ✓',
    error_generic: 'An error occurred — please try again',

    /* ---------- PWA ---------- */
    installed: 'App installed 🎉',
    offline_ready: 'App is ready to work offline ✓'
  }
};


/* =============================================================
   محرك اللغات I18n
   ============================================================= */
const I18n = (() => {
  const STORAGE_KEY = 'sc_lang';
  const LANGS = ['ar', 'am', 'en'];
  const DIRS  = { ar: 'rtl', am: 'ltr', en: 'ltr' };
  const NATIVE_NAMES = { ar: 'العربية', am: 'አማርኛ', en: 'English' };

  let current = 'ar';
  const listeners = [];

  function dict(lang) {
    return I18N_DICT[lang] || I18N_DICT.ar;
  }

  /* ترجمة مفتاح مع متغيرات اختيارية:
     I18n.t('out_of', {max: 25}) → "من 25" */
  function t(key, params) {
    let str = dict(current)[key];
    if (str === undefined) str = I18N_DICT.ar[key];  // رجوع للعربية
    if (str === undefined) return key;               // أخيراً: المفتاح نفسه
    if (params) {
      Object.keys(params).forEach(p => {
        str = str.split('{' + p + '}').join(String(params[p]));
      });
    }
    return str;
  }

  /* تطبيق الترجمة على عناصر DOM:
     يدعم data-i18n / data-i18n-title / data-i18n-placeholder */
  function applyToDOM(root) {
    const scope = root || document;

    scope.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });

    scope.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });

    scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
  }

  /* مزامنة أزرار وقوائم اللغة في الواجهة */
  function updateLangUI() {
    document.querySelectorAll('#langSelect').forEach(sel => {
      sel.value = current;
    });
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === current);
    });
  }

  /* تبديل اللغة */
  function setLang(lang, options) {
    if (!LANGS.includes(lang)) lang = 'ar';
    current = lang;

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* وضع خاص */ }

    /* اتجاه الصفحة واللغة (يقلب التصميم RTL/LTR تلقائياً) */
    document.documentElement.lang = lang;
    document.documentElement.dir  = DIRS[lang] || 'rtl';

    applyToDOM(document);
    updateLangUI();

    if (!options || !options.silent) {
      /* إبلاغ بقية الوحدات لإعادة رسم المحتوى الديناميكي */
      listeners.forEach(fn => {
        try { fn(lang); } catch (e) { console.error('[i18n] listener error:', e); }
      });
      window.dispatchEvent(new CustomEvent('sc:langchange', { detail: { lang } }));
    }
  }

  /* التهيئة (تُستدعى تلقائياً عند التحميل) */
  function init() {
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* تجاهل */ }
    if (!LANGS.includes(saved)) saved = 'ar';
    setLang(saved, { silent: true });
  }

  /* أدوات مساعدة */
  function getLang()     { return current; }
  function getDir()      { return DIRS[current] || 'rtl'; }
  function isRTL()       { return getDir() === 'rtl'; }
  function nativeName(l) { return NATIVE_NAMES[l] || l; }
  function onLangChange(fn) { if (typeof fn === 'function') listeners.push(fn); }

  return {
    init, setLang, t, applyToDOM,
    getLang, getDir, isRTL, nativeName, onLangChange,
    LANGS
  };
})();

/* تشغيل فوري (السكربتات في نهاية body فالعناصر جاهزة) */
I18n.init();
