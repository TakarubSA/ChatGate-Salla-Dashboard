export type Language = 'en' | 'ar';

export const translations = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      orders: 'Orders',
      campaigns:"Campaigns",
      abandonCarts: 'Abandoned Carts',
      reports: 'Reports',
      team: 'Team',
      templates:"Templates",
      reminderRules: 'Reminder Rules',
    },
        campaigns: {
      title:"Campaigns",
        pageSubtitle: 'Send template messages to your audiences and track delivery',

  exportPage: 'Export',
  exportSuccessTitle: 'Export ready',
  exportSuccessDescription: 'Campaigns were exported to Excel.',

  newCampaign: 'New Campaign',
  newCampaignDescription: 'Send a template message to a chosen audience.',
  submitCampaign: 'Create campaign',
  duplicateCampaign: 'Duplicate Campaign',

  search: 'Search',
  searchHint: 'Name, template, status...',

  name: 'Name',
  template: 'Template',
  audience: 'Audience',
  status: 'Status',
  scheduled: 'Scheduled',
  recipients: 'Recipients',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Failed',
  actions: 'Actions',

  loading: 'Loading campaigns...',
  noCampaignsFound: 'No campaigns found',
  tryAdjustingSearch: 'Try adjusting your search',

  showingCampaigns: 'Showing {{from}}–{{to}} of {{total}} campaigns',
  campaignsCount: '{{count}} campaigns',

  previous: 'Previous',
  next: 'Next',

  duplicate: 'Duplicate',
  delete: 'Delete',
  cancel: 'Cancel',

  createSuccessTitle: 'Campaign created',
  createSuccessNowDescription: 'Your campaign is being sent.',
  createSuccessScheduledDescription: 'Your campaign has been scheduled.',

  createErrorTitle: 'Failed to create campaign',
  createErrorDescription: 'Something went wrong.',

  deleteSuccessTitle: 'Campaign deleted',
  deleteSuccessDescription: 'The campaign was removed.',

  deleteErrorTitle: 'Failed to delete campaign',
  deleteErrorDescription: 'Something went wrong.',

  deleteConfirmTitle: 'Delete campaign',
  deleteConfirmDescription:
    'This will permanently delete "{{name}}". This action cannot be undone.',

  failedToLoadDetails: 'Failed to load campaign details',
    },
    login: {
      title: 'Welcome back',
      subtitle: 'Sign in to your ChatGate account.',
      email: 'Email',
      password: 'Password',
      submit: 'Sign In',
      submitting: 'Signing in...',
      demoHint: 'Demo credentials',
      invalidCredentials: 'Invalid email or password.',
      inactiveAccount: 'This account is not active yet.',
    },
    common: {
        load: 'Load',
      viewAs: 'View As',
      admin: 'Admin',
      marketing: 'Marketing',
      administrator: 'Administrator',
      marketingUser: 'Marketing User',
      adminRole: 'Admin Role',
      marketingRole: 'Marketing Role',
      language: 'Language',
      english: 'English',
      arabic: 'Arabic',
      refresh: 'Refresh',
      export: 'Export',
      search: 'Search',
      allStatuses: 'All Statuses',
      active: 'Active',
      reminded: 'Reminded',
      purchased: 'Purchased',
      expired: 'Expired',
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
      item: 'item',
      items: 'items',
      logout: 'Log out',
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Monitor and recover slipping revenue.',
      totalAbandoned: 'Total Abandoned',
      cartsInLast30Days: 'Carts in the last 30 days',
      recoveredRevenue: 'Recovered Revenue',
      cartsPurchased: 'carts purchased',
      conversionRate: 'Conversion Rate',
      purchased:"Purchased",
      afterReminders: 'After reminders',
      remindersSent: 'Reminders Sent',
      viaChannel: 'Via WhatsApp/SMS',
      searchCustomer: 'Search customer...',
      customer: 'Customer',
      cartValue: 'Cart Value',
      status: 'Status',
      timing: 'Timing',
      action: 'Action',
      remind: 'Remind',
      loadingCarts: 'Loading carts...',
      noCartsFound: 'No abandoned carts found',
      tryAdjustingFilters: 'Try adjusting your filters',
      sent: 'sent',
      last: 'Last',
      totalOrders:"Total Orders",
      noContactInfo: 'No contact info',
      reminderSentTitle: 'Reminder sent',
      reminderSentDescription: 'The abandoned cart reminder was sent successfully.',
      reminderFailedTitle: 'Failed to send reminder',
      reminderFailedDescription: 'There was an error sending the reminder. Please try again.',
      exportSuccessTitle: 'Export ready',
      exportSuccessDescription: 'Abandoned carts were exported to Excel.',
      latest_orders:"Latest Orders",
      latest_abandon:"Latest Abandon Carts",
      loading:"loading...",
         "pending": "Pending",
    "processing": "Processing",
    "failed": "Failed",
    
    "active": "Active",
    "notified": "Notified",
    "order_created": "Order Created",
    "expired": "Expired"
    },
    templates: {
  title: 'Templates',
  newTemplateDescription:"Submit template",
  pageSubtitle: 'Manage your WhatsApp message templates.',
  exportPage: 'Export Templates',

  searchPlaceholder: 'Search templates...',
  loadTemplatesButton: 'Load Templates',

  template: 'Template',
  createdAt: 'Created At',
image: 'Image',
  name: 'Name',
  category: 'Category',
  language: 'Language',
  newTemplate:"Add new Template",
  topic: 'Topic',
  useCase: 'Use Case',
  header: 'Header',
  body: 'Body',
  buttons: 'Buttons',
  parameters: 'Parameters',
  industries: 'Industries',

  loading: 'Loading templates...',
  noTemplatesFound: 'No templates found',
  noTemplatesDescription: 'No templates match your search.',

  templateDetails: 'Template Details',

  url: 'URL',
  phone: 'Phone',
  type: 'Type',

  previous: 'Previous',
  next: 'Next',

  showingPage: 'Showing page',
  of: 'of',
  totalTemplates: 'total templates',

  exportSuccessTitle: 'Export ready',
  exportSuccessDescription: 'Templates were exported to Excel.',
   search: 'Search',
  searchHint: 'Name, category, status...',
  status: 'Status',
  loadingDetails: 'Loading...',
  exampleParams: 'Example params',
  headerImage: 'Header image',
  code: 'Code',
  failedToLoadDetails: 'Failed to load template details',
  tryAdjustingSearch: 'Try adjusting your search',
  showingTemplates: 'Showing {{from}}–{{to}} of {{total}} templates',
  templatesCount: '{{count}} templates',
  actions: 'Actions',

  createSuccessTitle: 'Template submitted',
  createSuccessDescription: 'Your template was submitted for approval.',

  createErrorTitle: 'Failed to create template',
  createErrorDescription: 'Something went wrong.',

  deleteSuccessTitle: 'Template deleted',
  deleteSuccessDescription: 'The template was removed.',

  deleteErrorTitle: 'Failed to delete template',
  deleteErrorDescription: 'Something went wrong.',

  deleteConfirmTitle: 'Delete template',
  deleteConfirmDescription:
    'This will permanently delete "{{name}}". This action cannot be undone.',

  delete: 'Delete',
  duplicate: 'Duplicate',

  submitTemplate: 'Submit template',
  duplicateTemplate: 'Duplicate Template',

  cancel: 'Cancel',
    builderTitle: 'Template builder',
  builderDescription: 'Create a WhatsApp template for approval.',
  saveTemplate: 'Save template',

  approvalMetadata: 'Approval metadata',

  format: 'Format',

  optionalOpeningContent: 'Optional opening content',

  none: 'None',
  text: 'Text',
  video: 'Video',
  document: 'Document',

  headerText: 'Header text',
  headerTextPlaceholder: 'Your order is ready',

  sampleMediaUrl: 'Sample media URL',
  sampleMediaUrlPlaceholder: 'https://example.com/header.jpg',


  footer: 'Footer',
  footerPlaceholder: 'Reply STOP to opt out',

  variableExamples: 'Variable examples',
  variableExamplesDescription: 'Sample values for approval preview',
  variableExamplePlaceholder: 'Example {{number}}',


  marketing: 'Marketing',
  utility: 'Utility',
  authentication: 'Authentication',
},
    
    orders: {
      title: 'Orders',
      subtitle: 'Track conversions and total sales performance.',
      totalRevenue: 'Total Revenue',
      acrossAllOrders: 'Across all orders',
      totalOrders: 'Total Orders',
      completedCount: 'completed',
      recoveredViaChatgate: 'Recovered via ChatGate',
      ordersFromReminders: 'Orders from cart reminders',
      pendingFulfillment: 'Pending Fulfillment',
      awaitingProcessing: 'Awaiting processing',
      searchOrders: 'Search orders...',
      order: 'Order',
      customer: 'Customer',
      amount: 'Amount',
      status: 'Status',
      source: 'Source',
      date: 'Date',
      direct: 'Direct',
      recovered: 'Recovered',
      loadingOrders: 'Loading orders...',
      noOrdersFound: 'No orders found',
      tryAdjustingFilters: 'Try adjusting your filters',
      orderDetails: 'Order',
      totalAmount: 'Total Amount',
      viewInSalla: 'View in Salla',
      failedToLoad: 'Failed to load order details.',
      exportSuccessTitle: 'Export ready',
      exportSuccessDescription: 'Orders were exported to Excel.',
        pageSubtitle: 'Orders synced from your connected Salla stores.',
  exportPage: 'Export Page',
  exportPageHint: 'Exports the currently loaded page only',

  startDate: 'Start Date',
  endDate: 'End Date',
  loadOrdersButton: 'Load Orders',

  orderIdPlaceholder: 'Customer, mobile, order id...',

  items: 'Items',
  total: 'Total',
  store: 'Store',

  loading: 'Loading...',
  loadingOrdersTable: 'Loading orders...',
  noOrdersDescription: 'Try adjusting your filters or date range',

  showingPage: 'Showing page',
  of: 'of',
  totalOrdersLabel: 'total orders',

  previous: 'Previous',
  next: 'Next',

  orderTotal: 'Order Total',
  reference: 'Reference',
  createdOn: 'Created On',

  noLineItems: 'No line items for this order',

  sku: 'SKU',
  qty: 'Qty',
    },
    abandonedCarts: {
      sendSelected:"Send Selected",
      sendReminder:"Send Reminder",
      loadCarts:"load carts",
      title: 'Abandoned Carts',
      subtitle: 'Track and recover carts customers left behind.',
      totalValue: 'Total Value',
      acrossAllCarts: 'Across all carts',
      totalCarts: 'Total Carts',
      activeCount: 'active',
      recoveredViaChatgate: 'Recovered via ChatGate',
      cartsFromReminders: 'Carts recovered from reminders',
      expiredCarts: 'Expired Carts',
      noLongerRecoverable: 'No longer recoverable',
      searchCarts: 'Search carts...',
      cart: 'Cart',
      customer: 'Customer',
      amount: 'Amount',
      status: 'Status',
      sendCount: 'Reminders Sent',
      date: 'Date',
      loadingCarts: 'Loading carts...',
      noCartsFound: 'No abandoned carts found',
      tryAdjustingFilters: 'Try adjusting your filters',
      cartDetails: 'Cart',
      cartValue: 'Cart Value',
      abandonedOn: 'Abandoned On',
      nextReminder: 'Next Reminder',
      viewCheckout: 'View Checkout',
      failedToLoad: 'Failed to load cart details.',
      statusActive: 'Active',
      statusNotified: 'Notified',
      statusRecovered: 'Recovered',
      statusExpired: 'Expired',
      exportSuccessTitle: 'Export ready',
      exportSuccessDescription: 'Abandoned carts were exported to Excel.',

      // Selection toolbar & pagination
      clear: 'Clear',
      remind: 'Remind',
      cartsSelectedSuffix: 'selected',
      page: 'Page',
      previous: 'Previous',
      next: 'Next',

      // Send reminder + coupon dialog
      sendWhatsappReminderTitle: 'Send WhatsApp Reminder',
      sendReminderDescriptionMulti: 'This will message {{count}} customers about their abandoned carts.',
      sendReminderDescriptionSingle: 'This will message the customer about their abandoned cart.',
      discountCouponLabel: 'Discount coupon (optional)',
      couponPlaceholder: 'e.g. COMEBACK10',
      couponHelperText: 'Leave blank to send the reminder without a discount code.',
      cancel: 'Cancel',
      sending: 'Sending...',
      send: 'Send',

      // Send result toasts
      noCartsSelectedTitle: 'No carts selected',
      remindersSentTitle: 'Reminders sent',
      remindersSentDescription: '{{count}} reminder(s) sent successfully.',
      failedToSendTitle: 'Failed to send',
      failedToSendDescription: 'The reminder could not be sent. Please try again.',
    },
    reports: {
      title: 'Reports',
      subtitle: 'High-level insights into recovery performance.',
      last30Days: 'Last 30 Days',
      totalRevenue: 'Total Revenue',
      averageOrderValue: 'Average Order Value',
      recoveryRate: 'Recovery Rate',
      revenueTrend: 'Revenue Trend',
      cartRecovery: 'Cart Recovery',
    },
    team: {
      title: 'Team Management',
      subtitle: 'Manage access for your marketing and operations team.',
      addMember: 'Add Member',
      member: 'Member',
      role: 'Role',
      status: 'Status',
      actions: 'Actions',
      invited: 'Invited',
    },
    reminderRules: {
      title: 'Abandoned Cart Reminders',
      subtitle: 'Automatically remind customers to complete their purchase based on how long a cart has been abandoned.',
      createNew: 'Create New Reminder',
      editReminder: 'Edit Reminder',
      createReminder: 'Create New Reminder',
      ruleId: 'Rule ID',
      reminderAfter: 'Reminder after',
      hours: 'hour(s)',
      cartTotalLabel: 'Cart Total',
      couponLabel: 'Coupon',
      couponValueLabel: 'Coupon Value',
      noCartTotal: 'Any cart total',
      noCoupon: 'No coupon',
      active: 'Active',
      inactive: 'Inactive',
      abandonedTimeField: 'Abandoned Time',
      abandonedTimePlaceholder: 'e.g. 2',
      cartTotalField: 'Cart Total (Optional)',
      cartTotalPlaceholder: 'Minimum cart total to trigger',
      couponField: 'Coupon',
      couponPlaceholder: 'e.g. SAVE10',
      couponValueField: 'Coupon Value',
      couponValuePlaceholder: 'e.g. 15.00',
      publish: 'Publish Reminder',
      saveChanges: 'Save Changes',
      cancel: 'Cancel',
      noRules: 'No reminder rules yet',
      noRulesDescription: 'Create your first rule to start sending automatic reminders.',
      deleteConfirm: 'Are you sure you want to delete this reminder rule?',
      createSuccess: 'Reminder rule created',
      updateSuccess: 'Reminder rule updated',
      deleteSuccess: 'Reminder rule deleted',
      errorGeneric: 'Something went wrong. Please try again.',
      edit: 'Edit',
      delete: 'Delete',
    },
  },

ar: {
  nav: {
    dashboard: 'لوحة التحكم',
    orders: 'الطلبات',
    abandonCarts: 'السلات المتروكة',
    reports: 'التقارير',
    team: 'الفريق',
    reminderRules: 'قواعد التذكير',
    templates: 'القوالب',
    campaigns: 'الحملات',
  },

  login: {
    title: 'مرحبًا بعودتك',
    subtitle: 'سجّل دخولك إلى حسابك في ChatGate.',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    submit: 'تسجيل الدخول',
    submitting: 'جارٍ تسجيل الدخول...',
    demoHint: 'بيانات الدخول التجريبية',
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    inactiveAccount: 'حسابك غير مفعّل حتى الآن.',
  },

  common: {
    load: 'تحميل',
    viewAs: 'العرض كـ',
    admin: 'مسؤول',
    marketing: 'تسويق',
    administrator: 'مسؤول النظام',
    marketingUser: 'مستخدم التسويق',
    adminRole: 'صلاحية المسؤول',
    marketingRole: 'صلاحية التسويق',
    language: 'اللغة',
    english: 'الإنجليزية',
    arabic: 'العربية',
    refresh: 'تحديث',
    export: 'تصدير',
    search: 'بحث',
    allStatuses: 'كل الحالات',
    active: 'نشط',
    reminded: 'تم التذكير',
    purchased: 'تم الشراء',
    expired: 'منتهي',
    pending: 'قيد الانتظار',
    processing: 'قيد المعالجة',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    refunded: 'مسترد',
    item: 'منتج',
    items: 'منتجات',
    logout: 'تسجيل الخروج',
  },

  dashboard: {
    title: 'لوحة التحكم',
    subtitle: 'تابع أداء المبيعات واستعد الإيرادات من السلات المتروكة.',
    
    totalAbandoned: 'إجمالي السلات المتروكة',
    cartsInLast30Days: 'السلات خلال آخر 30 يومًا',
    
    recoveredRevenue: 'مجموع المبيعات',
    purchased: 'تم الشراء',
    cartsPurchased: 'السلات التي تم شراؤها',
    
    conversionRate: 'معدل التحويل',
    afterReminders: 'بعد التذكيرات',
    
    remindersSent: 'التذكيرات المرسلة',
    viaChannel: 'عبر واتساب / SMS',
    
    searchCustomer: 'البحث عن عميل...',
    customer: 'العميل',
    cartValue: 'قيمة السلة',
    status: 'الحالة',
    timing: 'التوقيت',
    action: 'الإجراء',
    remind: 'إرسال تذكير',
    
    loadingCarts: 'جارٍ تحميل السلات...',
    noCartsFound: 'لا توجد سلات متروكة',
    tryAdjustingFilters: 'حاول تعديل عوامل التصفية',
    
    sent: 'تم الإرسال',
    last: 'آخر',
    totalOrders: 'إجمالي الطلبات',
    
    noContactInfo: 'لا تتوفر بيانات للتواصل',
    
    reminderSentTitle: 'تم إرسال التذكير',
    reminderSentDescription: 'تم إرسال تذكير السلة المتروكة بنجاح.',
    
    reminderFailedTitle: 'تعذر إرسال التذكير',
    reminderFailedDescription: 'حدث خطأ أثناء إرسال التذكير. يرجى المحاولة مرة أخرى.',
    
    exportSuccessTitle: 'التصدير جاهز',
    exportSuccessDescription: 'تم تصدير السلات المتروكة إلى ملف Excel.',
    
    latest_orders: 'أحدث الطلبات',
    latest_abandon: 'أحدث السلات المتروكة',
    
    pending: 'قيد الانتظار',
    processing: 'قيد المعالجة',
    failed: 'فشل',
    active: 'نشط',
    notified: 'تم إشعاره',
    order_created: 'تم إنشاء الطلب',
    expired: 'منتهي',
    
    loading: 'جارٍ التحميل...',
    noRecentOrders: 'لا توجد طلبات حديثة',
    noRecentAbandonedCarts: 'لا توجد سلات متروكة حديثة',
    deliveryErrors: 'طلبات بها أخطاء في التسليم',
  },

 templates: {
  title: 'القوالب',
  newTemplateDescription:
    'أنشئ قالبًا جديدًا لإرساله للموافقة.',

  pageSubtitle:
    'أنشئ وأدر قوالب رسائل واتساب الخاصة بك.',

  exportPage: 'تصدير القوالب',

  searchPlaceholder:
    'ابحث في القوالب...',

  loadTemplatesButton:
    'تحميل القوالب',

  template: 'القالب',
  name: 'الاسم',
  category: 'الفئة',
  language: 'اللغة',
  status: 'الحالة',
  createdAt: 'تاريخ الإنشاء',
  image: 'صورة',

  newTemplate:
    'إضافة قالب جديد',

  topic: 'الموضوع',
  useCase: 'حالة الاستخدام',
  header: 'الرأس',
  body: 'المحتوى',
  buttons: 'الأزرار',
  parameters: 'المتغيرات',
  industries: 'القطاعات',

  loading:
    'جارٍ تحميل القوالب...',

  noTemplatesFound:
    'لا توجد قوالب',

  noTemplatesDescription:
    'لا توجد قوالب تطابق البحث.',

  templateDetails:
    'تفاصيل القالب',

  url: 'الرابط',
  phone: 'رقم الجوال',
  type: 'النوع',

  previous: 'السابق',
  next: 'التالي',

  showingPage: 'عرض الصفحة',
  of: 'من',
  totalTemplates:
    'إجمالي القوالب',

  exportSuccessTitle:
    'التصدير جاهز',

  exportSuccessDescription:
    'تم تصدير القوالب إلى ملف Excel.',

  search: 'بحث',

  searchHint:
    'الاسم، الفئة، الحالة...',

  loadingDetails:
    'جارٍ التحميل...',

  exampleParams:
    'أمثلة على المتغيرات',

  headerImage:
    'صورة الرأس',

  code: 'الرمز',

  failedToLoadDetails:
    'تعذر تحميل تفاصيل القالب',

  tryAdjustingSearch:
    'حاول تعديل البحث',

  showingTemplates:
    'عرض {{from}}–{{to}} من أصل {{total}} قالب',

  templatesCount:
    '{{count}} قالب',

  actions:
    'الإجراءات',

  createSuccessTitle:
    'تم إرسال القالب',

  createSuccessDescription:
    'تم إرسال القالب للمراجعة والموافقة.',

  createErrorTitle:
    'تعذر إنشاء القالب',

  createErrorDescription:
    'حدث خطأ ما. يرجى المحاولة مرة أخرى.',

  deleteSuccessTitle:
    'تم حذف القالب',

  deleteSuccessDescription:
    'تم حذف القالب بنجاح.',

  deleteErrorTitle:
    'تعذر حذف القالب',

  deleteErrorDescription:
    'حدث خطأ أثناء حذف القالب. يرجى المحاولة مرة أخرى.',

  deleteConfirmTitle:
    'حذف القالب',

  deleteConfirmDescription:
    'سيتم حذف "{{name}}" نهائيًا، ولا يمكن التراجع عن هذا الإجراء.',

  delete: 'حذف',
  duplicate: 'نسخ',

  submitTemplate:
    'إرسال القالب',

  duplicateTemplate:
    'نسخ القالب',

  cancel: 'إلغاء',

  builderTitle:
    'منشئ القوالب',

  builderDescription:
    'أنشئ قالب واتساب وأرسله للموافقة.',

  saveTemplate:
    'حفظ القالب',

  approvalMetadata:
    'بيانات الموافقة',

  format:
    'التنسيق',

  optionalOpeningContent:
    'محتوى افتتاحي اختياري',

  none: 'بدون',
  text: 'نص',
  video: 'فيديو',
  document: 'مستند',

  headerText:
    'نص الرأس',

  headerTextPlaceholder:
    'طلبك جاهز',

  sampleMediaUrl:
    'رابط الوسائط التجريبي',

  sampleMediaUrlPlaceholder:
    'https://example.com/header.jpg',

  footer: 'التذييل',

  footerPlaceholder:
    'أرسل STOP لإلغاء الاشتراك',

  variableExamples:
    'أمثلة على المتغيرات',

  variableExamplesDescription:
    'قيم تجريبية لمعاينة القالب قبل الموافقة',

  variableExamplePlaceholder:
    'مثال {{number}}',

  marketing: 'تسويقي',
  utility: 'خدمي',
  authentication: 'مصادقة',


 },

   orders: {
    title: 'الطلبات',
    subtitle: 'تتبع التحويلات وأداء المبيعات الإجمالي.',

    totalRevenue: 'إجمالي الإيرادات',
    acrossAllOrders: 'من جميع الطلبات',

    totalOrders: 'إجمالي الطلبات',
    completedCount: 'مكتملة',

    recoveredViaChatgate: 'مستردة عبر ChatGate',
    ordersFromReminders: 'الطلبات الناتجة عن تذكيرات السلات',

    pendingFulfillment: 'طلبات قيد التنفيذ',
    awaitingProcessing: 'في انتظار المعالجة',

    searchOrders: 'البحث في الطلبات...',

    order: 'الطلب',
    customer: 'العميل',
    amount: 'المبلغ',
    status: 'الحالة',
    source: 'المصدر',
    date: 'التاريخ',

    direct: 'مباشر',
    recovered: 'مسترد',

    loadingOrders: 'جارٍ تحميل الطلبات...',
    noOrdersFound: 'لا توجد طلبات',
    tryAdjustingFilters: 'حاول تعديل عوامل التصفية',

    orderDetails: 'تفاصيل الطلب',
    totalAmount: 'المبلغ الإجمالي',
    viewInSalla: 'عرض في سلة',

    failedToLoad: 'تعذر تحميل تفاصيل الطلب.',

    exportSuccessTitle: 'التصدير جاهز',
    exportSuccessDescription: 'تم تصدير الطلبات إلى ملف Excel.',

    pageSubtitle: 'الطلبات المتزامنة من متاجر سلة المتصلة.',

    exportPage: 'تصدير الصفحة',
    exportPageHint: 'يتم تصدير الصفحة الحالية فقط',

    startDate: 'تاريخ البداية',
    endDate: 'تاريخ النهاية',
    loadOrdersButton: 'تحميل الطلبات',

    orderIdPlaceholder: 'العميل، الجوال، رقم الطلب...',

    items: 'المنتجات',
    total: 'الإجمالي',
    store: 'المتجر',

    loading: 'جارٍ التحميل...',
    loadingOrdersTable: 'جارٍ تحميل الطلبات...',

    noOrdersDescription:
      'حاول تعديل عوامل التصفية أو نطاق التاريخ.',

    showingPage: 'عرض الصفحة',
    of: 'من',
    totalOrdersLabel: 'إجمالي الطلبات',

    previous: 'السابق',
    next: 'التالي',

    orderTotal: 'إجمالي الطلب',
    reference: 'المرجع',
    createdOn: 'تاريخ الإنشاء',

    noLineItems: 'لا توجد منتجات مضافة إلى هذا الطلب',

    sku: 'رمز المنتج',
    qty: 'الكمية',
  },

  abandonedCarts: {
    sendSelected: 'تذكير بالمختارين',
    sendReminder: 'إرسال تذكير',
    loadCarts: 'تحميل السلات',

    title: 'السلات المتروكة',
    subtitle: 'تتبع السلات المتروكة وساعد العملاء على إكمال عمليات الشراء.',

    totalValue: 'إجمالي القيمة',
    acrossAllCarts: 'من جميع السلات',

    totalCarts: 'إجمالي السلات',
    activeCount: 'نشطة',

    recoveredViaChatgate: 'مستردة عبر ChatGate',
    cartsFromReminders: 'السلات المستردة من خلال التذكيرات',

    expiredCarts: 'السلات المنتهية',
    noLongerRecoverable: 'لم تعد قابلة للاسترداد',

    searchCarts: 'البحث في السلات...',

    cart: 'السلة',
    customer: 'العميل',
    amount: 'المبلغ',
    status: 'الحالة',
    sendCount: 'التذكيرات المرسلة',
    date: 'التاريخ',

    loadingCarts: 'جارٍ تحميل السلات...',
    noCartsFound: 'لا توجد سلات متروكة',
    tryAdjustingFilters: 'حاول تعديل عوامل التصفية',

    cartDetails: 'تفاصيل السلة',
    cartValue: 'قيمة السلة',
    abandonedOn: 'تاريخ ترك السلة',
    nextReminder: 'التذكير القادم',
    viewCheckout: 'عرض صفحة الدفع',

    failedToLoad: 'تعذر تحميل تفاصيل السلة.',

    statusActive: 'نشطة',
    statusNotified: 'تم التذكير',
    statusRecovered: 'مستردة',
    statusExpired: 'منتهية',

    exportSuccessTitle: 'التصدير جاهز',
    exportSuccessDescription:
      'تم تصدير السلات المتروكة إلى ملف Excel.',

    clear: 'مسح',
    remind: 'تذكير',
    cartsSelectedSuffix: 'محددة',

    page: 'صفحة',
    previous: 'السابق',
    next: 'التالي',

    sendWhatsappReminderTitle: 'إرسال تذكير عبر واتساب',

    sendReminderDescriptionMulti:
      'سيتم إرسال رسالة إلى {{count}} عميل لتذكيرهم بسلاتهم المتروكة.',

    sendReminderDescriptionSingle:
      'سيتم إرسال رسالة إلى العميل لتذكيره بالسلة المتروكة.',

    discountCouponLabel: 'كوبون خصم (اختياري)',
    couponPlaceholder: 'مثال: COMEBACK10',

    couponHelperText:
      'اترك الحقل فارغًا لإرسال التذكير دون كود خصم.',

    cancel: 'إلغاء',
    sending: 'جارٍ الإرسال...',
    send: 'إرسال',

    noCartsSelectedTitle: 'لم يتم تحديد أي سلة',
    remindersSentTitle: 'تم إرسال التذكيرات',

    remindersSentDescription:
      'تم إرسال {{count}} تذكير بنجاح.',

    failedToSendTitle: 'تعذر الإرسال',

    failedToSendDescription:
      'تعذر إرسال التذكير. يرجى المحاولة مرة أخرى.',
  },

  reports: {
    title: 'التقارير',
    subtitle: 'نظرة سريعة على أداء استرداد السلات.',

    last30Days: 'آخر 30 يومًا',
    totalRevenue: 'إجمالي الإيرادات',
    averageOrderValue: 'متوسط قيمة الطلب',
    recoveryRate: 'معدل الاسترداد',
    revenueTrend: 'اتجاه الإيرادات',
    cartRecovery: 'استرداد السلات',
  },

  team: {
    title: 'إدارة الفريق',
    subtitle: 'أدر صلاحيات الوصول لفريق التسويق والعمليات.',
    addMember: 'إضافة عضو',
    member: 'العضو',
    role: 'الصلاحية',
    status: 'الحالة',
    actions: 'الإجراءات',
    invited: 'تمت دعوته',
  },

  reminderRules: {
    title: 'تذكيرات السلات المتروكة',

    subtitle:
      'يذكّر ChatGate العملاء تلقائيًا بإكمال عمليات الشراء بناءً على مدة ترك السلة.',

    createNew: 'إنشاء تذكير جديد',
    editReminder: 'تعديل التذكير',
    createReminder: 'إنشاء تذكير جديد',

    ruleId: 'رقم القاعدة',

    reminderAfter: 'التذكير بعد',
    hours: 'ساعة/ساعات',

    cartTotalLabel: 'إجمالي السلة',
    couponLabel: 'الكوبون',
    couponValueLabel: 'قيمة الكوبون',

    noCartTotal: 'أي قيمة للسلة',
    noCoupon: 'بدون كوبون',

    active: 'نشط',
    inactive: 'غير نشط',

    abandonedTimeField: 'مدة ترك السلة',
    abandonedTimePlaceholder: 'مثال: 2',

    cartTotalField: 'إجمالي السلة (اختياري)',
    cartTotalPlaceholder: 'الحد الأدنى لقيمة السلة لتفعيل التذكير',

    couponField: 'الكوبون',
    couponPlaceholder: 'مثال: SAVE10',

    couponValueField: 'قيمة الكوبون',
    couponValuePlaceholder: 'مثال: 15.00',

    publish: 'نشر التذكير',
    saveChanges: 'حفظ التغييرات',
    cancel: 'إلغاء',

    noRules: 'لا توجد قواعد تذكير حتى الآن',

    noRulesDescription:
      'أنشئ أول قاعدة لبدء إرسال التذكيرات تلقائيًا.',

    deleteConfirm:
      'هل أنت متأكد من رغبتك في حذف قاعدة التذكير هذه؟',

    createSuccess: 'تم إنشاء قاعدة التذكير',
    updateSuccess: 'تم تحديث قاعدة التذكير',
    deleteSuccess: 'تم حذف قاعدة التذكير',

    errorGeneric:
      'حدث خطأ ما. يرجى المحاولة مرة أخرى.',

    edit: 'تعديل',
    delete: 'حذف',
  },

  campaigns: {
    title: 'الحملات',

    pageSubtitle:
      'أرسل رسائل القوالب لجمهورك وتابع نتائج الإرسال.',

    exportPage: 'تصدير',

    exportSuccessTitle: 'التصدير جاهز',
    exportSuccessDescription:
      'تم تصدير الحملات إلى ملف Excel.',

    newCampaign: 'حملة جديدة',

    newCampaignDescription:
      'أرسل رسالة باستخدام قالب إلى جمهور محدد.',

    submitCampaign: 'إنشاء الحملة',
    duplicateCampaign: 'نسخ الحملة',

    search: 'بحث',
    searchHint: 'الاسم، القالب، الحالة...',

    name: 'الاسم',
    template: 'القالب',
    audience: 'الجمهور',
    status: 'الحالة',
    scheduled: 'موعد الإرسال',
    recipients: 'المستلمون',

    sent: 'تم الإرسال',
    delivered: 'تم التسليم',
    read: 'تمت القراءة',
    failed: 'فشل',

    actions: 'الإجراءات',

    loading: 'جارٍ تحميل الحملات...',
    noCampaignsFound: 'لا توجد حملات',
    tryAdjustingSearch: 'حاول تعديل البحث',

    showingCampaigns:
      'عرض {{from}}–{{to}} من أصل {{total}} حملة',

    campaignsCount: '{{count}} حملة',

    previous: 'السابق',
    next: 'التالي',

    duplicate: 'نسخ',
    delete: 'حذف',
    cancel: 'إلغاء',

    createSuccessTitle: 'تم إنشاء الحملة',

    createSuccessNowDescription:
      'جارٍ إرسال الحملة الآن.',

    createSuccessScheduledDescription:
      'تمت جدولة الحملة بنجاح.',

    createErrorTitle: 'تعذر إنشاء الحملة',
    createErrorDescription:
      'حدث خطأ ما. يرجى المحاولة مرة أخرى.',

    deleteSuccessTitle: 'تم حذف الحملة',
    deleteSuccessDescription:
      'تم حذف الحملة بنجاح.',

    deleteErrorTitle: 'تعذر حذف الحملة',
    deleteErrorDescription:
      'حدث خطأ أثناء حذف الحملة. يرجى المحاولة مرة أخرى.',

    deleteConfirmTitle: 'حذف الحملة',

    deleteConfirmDescription:
      'سيتم حذف "{{name}}" نهائيًا، ولا يمكن التراجع عن هذا الإجراء.',

    failedToLoadDetails:
      'تعذر تحميل تفاصيل الحملة',
  },
} as const
}


export type TranslationDict = {
  [K in keyof typeof translations.en]: {
    [K2 in keyof (typeof translations.en)[K]]: string;
  };
};