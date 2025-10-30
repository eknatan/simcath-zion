# 📋 תכנית פיתוח: מסך ניהול תיק (Case Management)

**תאריך יצירה:** 2025-10-29
**גרסה:** 1.0
**סטטוס:** בתכנון
**מסמכי עזר:**
- [SPECIFICATION.md](./SPECIFICATION.md) - אפיון מלא
- [AI_DEVELOPMENT_GUIDE.md](./AI_DEVELOPMENT_GUIDE.md) - הנחיות פיתוח
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - מערכת עיצוב

---

## 🎯 מטרה

בניית מסך ניהול תיק מלא שמשרת:
- 🎊 **תיקי חתונות** (4 טאבים)
- 🏥 **תיקי ילדים חולים** (2 טאבים)

---

## 📂 מבנה תיקיות מוצע

```
src/
├── app/
│   └── [locale]/
│       └── (dashboard)/
│           └── cases/
│               └── [id]/
│                   ├── page.tsx                    # עמוד ראשי (Server Component)
│                   └── _components/                # קומפוננטות ספציפיות לדף
│                       ├── CaseTabs.tsx
│                       ├── HebrewTab.tsx
│                       ├── EnglishTab.tsx
│                       ├── FilesTab.tsx
│                       ├── PaymentsTab.tsx
│                       └── CleaningPaymentsTab.tsx
│
├── components/
│   ├── shared/                                     # קומפוננטות משותפות
│   │   ├── ActionButton/                          # ✅ כבר קיים
│   │   ├── DataTable/                             # ✅ כבר קיים
│   │   ├── FormField/                             # ✅ כבר קיים
│   │   ├── StatusBadge/                           # ✅ כבר קיים
│   │   ├── FileUpload/                            # ✅ כבר קיים
│   │   ├── CurrencyConverter/                     # ✅ כבר קיים
│   │   │
│   │   ├── CaseHeader/                            # 🆕 ליצור
│   │   │   └── CaseHeader.tsx
│   │   ├── BankDetailsForm/                       # 🆕 ליצור
│   │   │   └── BankDetailsForm.tsx
│   │   ├── PaymentHistoryTable/                   # 🆕 ליצור
│   │   │   └── PaymentHistoryTable.tsx
│   │   └── AuditLogTimeline/                      # 🆕 ליצור
│   │       └── AuditLogTimeline.tsx
│   │
│   └── features/
│       └── cases/                                  # לוגיקה ספציפית למודול
│           ├── hooks/
│           │   ├── useCase.ts
│           │   ├── useCaseTranslation.ts
│           │   ├── useCaseFiles.ts
│           │   └── useCasePayments.ts
│           └── utils/
│               ├── case-validations.ts
│               └── case-formatting.ts
│
├── lib/
│   ├── services/
│   │   ├── translation.service.ts                  # AI translation
│   │   ├── file-storage.service.ts                 # Vercel Blob / S3
│   │   └── currency.service.ts                     # Exchange rates
│   └── validation/
│       └── case-form.schema.ts                     # Zod schemas
│
└── types/
    └── case.types.ts                               # Case-specific types
```

---

## 📅 שלבי פיתוח (Phases)

### ✅ Phase 0: הכנה
- [x] קריאת מסמכי אפיון
- [x] הבנת דרישות
- [x] תכנון ארכיטקטורה
- [x] יצירת מסמך מעקב

---

## 🎯 Phase 1: תשתית בסיסית + Case Header

**מטרה:** הקמת הדף הבסיסי, routing, טעינת נתונים, והצגת רצועת המידע הכללית.

### משימות

- [ ] **1.1 יצירת עמוד ראשי**
  - קובץ: `app/[locale]/(dashboard)/cases/[id]/page.tsx`
  - Server Component
  - Fetch נתונים מ-Supabase
  - Error handling (404, unauthorized)
  - העברת data ל-Client Components

- [ ] **1.2 יצירת Types**
  - קובץ: `types/case.types.ts`
  - `Case`, `CaseWithRelations`
  - `CaseStatus`, `CaseType`
  - Types לכל הטבלאות הקשורות

- [ ] **1.3 יצירת CaseHeader (משותף)**
  - קובץ: `components/shared/CaseHeader/CaseHeader.tsx`
  - Props interface מפורט
  - תצוגה לפי סוג תיק (wedding/cleaning)
  - כפתורי פעולה דינמיים
  - שימוש ב:
    - ✅ `ActionButton` (קיים)
    - ✅ `StatusBadge` (קיים)
    - ✅ `Badge` מ-shadcn/ui
    - ✅ `DropdownMenu` מ-shadcn/ui
    - ✅ `Select` מ-shadcn/ui

- [ ] **1.4 עיצוב לפי DESIGN_SYSTEM.md**
  - גרסה B (Elegant & Soft)
  - צבעים רכים: emerald, sky, rose, slate
  - `ActionButton` משותף לכל הפעולות
  - גבולות דקים, צללים מינימליים

- [ ] **1.5 בדיקות Phase 1**
  - ✅ Routing עובד: `/cases/[id]`
  - ✅ טעינת נתונים מהשרת
  - ✅ CaseHeader מוצג נכון
  - ✅ כפתורים מגיבים (console.log)
  - ✅ Error states: 404, Loading, Error
  - ✅ Responsive: Mobile, Tablet, Desktop

**זמן משוער:** 1-2 ימים

---

## 🎯 Phase 2: טאב "הבקשה בעברית" (Edit Mode)

**מטרה:** אפשרות צפייה ועריכה של כל הפרטים שהמשתמש מילא בטופס.

### משימות

- [ ] **2.1 יצירת מבנה Tabs**
  - קובץ: `app/[locale]/(dashboard)/cases/[id]/_components/CaseTabs.tsx`
  - ניהול מעבר בין טאבים
  - שמירת מצב ב-URL (?tab=hebrew)
  - אינדיקטורים (✅/⚠️/🔴)
  - שימוש ב: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` מ-shadcn/ui

- [ ] **2.2 יצירת HebrewTab**
  - קובץ: `app/[locale]/(dashboard)/cases/[id]/_components/HebrewTab.tsx`
  - 2 מצבים: View / Edit
  - שימוש ב:
    - ✅ `Card`, `CardHeader` מ-shadcn/ui
    - ✅ `FormField` (קיים)
    - ✅ `ActionButton` (קיים)
    - ✅ `useForm` מ-react-hook-form
    - ✅ `zodResolver` לולידציה

- [ ] **2.3 חלוקה לסקשנים**
  - חתונות: מידע חתונה + חתן + כלה
  - ילדים חולים: פרטי משפחה
  - כל סקשן ב-Card נפרד

- [ ] **2.4 יצירת Validation Schema**
  - קובץ: `lib/validation/case-form.schema.ts`
  - Zod schemas
  - וולידציה לכל השדות
  - הודעות שגיאה בעברית

- [ ] **2.5 יצירת Custom Hook: useCase**
  - קובץ: `components/features/cases/hooks/useCase.ts`
  - ניהול state עם SWR
  - `updateCase` עם Optimistic UI
  - Error handling + toast

- [ ] **2.6 Auto-save מנגנון**
  - Debounced save (1s)
  - אינדיקטור "נשמר ✓"
  - Loading state במהלך שמירה

- [ ] **2.7 בדיקות Phase 2**
  - ✅ טאב "הבקשה בעברית" פעיל
  - ✅ מצב View: הצגה נקייה
  - ✅ מצב Edit: כל השדות ניתנים לעריכה
  - ✅ Autosave עובד
  - ✅ אינדיקטור "נשמר ✓"
  - ✅ ולידציה realtime
  - ✅ Error handling

**זמן משוער:** 2-3 ימים

---

## 🎯 Phase 3: טאב "קבצים ומסמכים"

**מטרה:** העלאה, צפייה, ומחיקה של קבצים הקשורים לתיק.

### משימות

- [ ] **3.1 יצירת FilesTab**
  - קובץ: `app/[locale]/(dashboard)/cases/[id]/_components/FilesTab.tsx`
  - רשימת סוגי קבצים נדרשים
  - העלאה (drag & drop או כפתור)
  - תצוגה לפי סוג (PDF/תמונה)
  - מחיקה עם אישור
  - שימוש ב:
    - ✅ `FileUpload` (קיים)
    - ✅ `Card` מ-shadcn/ui
    - ✅ `ActionButton` (קיים)
    - ✅ `Progress` מ-shadcn/ui
    - ✅ `AlertDialog` מ-shadcn/ui

- [ ] **3.2 יצירת File Storage Service**
  - קובץ: `lib/services/file-storage.service.ts`
  - אינטגרציה עם Vercel Blob או S3
  - `uploadToStorage`
  - `deleteFromStorage`
  - `getPublicUrl`

- [ ] **3.3 יצירת Custom Hook: useCaseFiles**
  - קובץ: `components/features/cases/hooks/useCaseFiles.ts`
  - `uploadFile` עם progress
  - `deleteFile`
  - SWR לניהול רשימה

- [ ] **3.4 יצירת API Routes**
  - קובץ: `app/api/cases/[id]/files/route.ts`
    - `POST` - העלאת קובץ
    - `GET` - רשימת קבצים
  - קובץ: `app/api/files/[id]/route.ts`
    - `DELETE` - מחיקת קובץ

- [ ] **3.5 אינדיקטורים בטאב**
  - חישוב: כמה מתוך החובה הועלו
  - הצגה בכותרת הטאב: "3/4"
  - ✅/⚠️ לפי סטטוס

- [ ] **3.6 בדיקות Phase 3**
  - ✅ העלאת קבצים עובדת
  - ✅ Progress bar בהעלאה
  - ✅ הצגת קבצים לפי סוג
  - ✅ תצוגה מקדימה לתמונות
  - ✅ הורדת קבצים
  - ✅ מחיקה עם אישור
  - ✅ אינדיקטורים בטאב

**זמן משוער:** 2-3 ימים

---

## 🎯 Phase 4: טאב "תשלומים" - חלק 1 (בנק + אישור)

**מטרה:** ניהול פרטי בנק, סכומים, ואישור להעברה.

### משימות

- [ ] **4.1 יצירת BankDetailsForm (משותף)**
  - קובץ: `components/shared/BankDetailsForm/BankDetailsForm.tsx`
  - רשימת בנקים ישראליים
  - ולידציה (בנק, סניף, חשבון)
  - שימוש ב:
    - ✅ `FormField` (קיים)
    - ✅ `Select` מ-shadcn/ui
    - ✅ `Card` מ-shadcn/ui
    - ✅ `ActionButton` (קיים)

- [ ] **4.2 יצירת PaymentsTab (חתונות)**
  - קובץ: `app/[locale]/(dashboard)/cases/[id]/_components/PaymentsTab.tsx`
  - סקשנים:
    1. פרטי בנק
    2. עלות + תרומה
    3. המרת מטבע
    4. אישור להעברה
  - שימוש ב:
    - ✅ `BankDetailsForm` (שיצרנו)
    - ✅ `CurrencyConverter` (קיים!)
    - ✅ `ActionButton` (קיים)
    - ✅ `AlertDialog` מ-shadcn/ui

- [ ] **4.3 יצירת Currency Service**
  - קובץ: `lib/services/currency.service.ts`
  - `getExchangeRate(from, to)`
  - אינטגרציה עם API (exchangerate-api או BOI)

- [ ] **4.4 יצירת Custom Hook: useCasePayments**
  - קובץ: `components/features/cases/hooks/useCasePayments.ts`
  - `approvePayment` - יצירת payment + עדכון סטטוס
  - SWR לניהול רשימה

- [ ] **4.5 לוגיקת אישור תשלום**
  - ולידציה: פרטי בנק + סכום
  - Dialog אישור
  - יצירת רשומה ב-`payments`
  - עדכון סטטוס ל-`pending_transfer`
  - רישום ב-audit log
  - Toast notification

- [ ] **4.6 בדיקות Phase 4**
  - ✅ טופס פרטי בנק עובד
  - ✅ המרת מטבע עובדת
  - ✅ אישור תשלום עובד
  - ✅ סטטוס משתנה
  - ✅ רשומה נוספת ל-payments
  - ✅ Toast notifications

**זמן משוער:** 2-3 ימים

---

## 🎯 Phase 5: טאב "תשלומים" - חלק 2 (היסטוריה)

**מטרה:** הצגת היסטוריית תשלומים בטבלה.

### משימות

- [ ] **5.1 יצירת PaymentHistoryTable (משותף)**
  - קובץ: `components/shared/PaymentHistoryTable/PaymentHistoryTable.tsx`
  - עמודות: תאריך, סכום $, סכום ₪, סטטוס, הערות
  - פורמט מטבעות
  - שימוש ב:
    - ✅ `Table` מ-shadcn/ui
    - ✅ `StatusBadge` (קיים)
    - ✅ `Badge` מ-shadcn/ui

- [ ] **5.2 שילוב ב-PaymentsTab**
  - הוספת סקשן "היסטוריית תשלומים"
  - Import של `PaymentHistoryTable`

- [ ] **5.3 בדיקות Phase 5**
  - ✅ טבלת היסטוריה מוצגת
  - ✅ פורמט תאריכים נכון
  - ✅ פורמט מטבעות נכון
  - ✅ סטטוסים צבעוניים
  - ✅ Responsive

**זמן משוער:** 1 יום

---

## 🎯 Phase 6: טאב "הבקשה באנגלית" (AI Translation)

**מטרה:** תרגום אוטומטי של כל הפרטים לאנגלית עם אפשרות עריכה.

### משימות

- [ ] **6.1 יצירת Translation Service**
  - קובץ: `lib/services/translation.service.ts`
  - אינטגרציה עם Claude API או OpenAI
  - `translateCaseToEnglish(caseData)`
  - החזרת JSON מתורגם

- [ ] **6.2 יצירת EnglishTab**
  - קובץ: `app/[locale]/(dashboard)/cases/[id]/_components/EnglishTab.tsx`
  - 3 מצבים:
    1. טרם תורגם - כפתור "תרגם עכשיו"
    2. בתהליך תרגום - Spinner
    3. תורגם - הצגה + עריכה
  - שימוש ב:
    - ✅ `ActionButton` (קיים)
    - ✅ `Card` מ-shadcn/ui
    - ✅ `FormField` (קיים)
    - ✅ `Loader2` מ-lucide-react
    - ✅ `AlertDialog` מ-shadcn/ui

- [ ] **6.3 יצירת Custom Hook: useCaseTranslation**
  - קובץ: `components/features/cases/hooks/useCaseTranslation.ts`
  - `translate()` - קריאה ל-API
  - `isTranslating` state
  - SWR לשמירת תרגום

- [ ] **6.4 יצירת API Route**
  - קובץ: `app/api/cases/[id]/translate/route.ts`
  - `POST` - קריאה לתרגום + שמירה ב-DB
  - טבלה: `translations`

- [ ] **6.5 "תרגם מחדש" עם אזהרה**
  - AlertDialog: "זה ימחק את העריכות הידניות"
  - עדכון `edited_by_user = false`

- [ ] **6.6 בדיקות Phase 6**
  - ✅ כפתור "תרגם עכשיו" עובד
  - ✅ תרגום AI מוצלח
  - ✅ שמירה ב-DB
  - ✅ הצגת התרגום
  - ✅ עריכה ידנית אפשרית
  - ✅ "תרגם מחדש" עם אזהרה

**זמן משוער:** 2-3 ימים

---

## 🎯 Phase 7: היסטוריית שינויים (Audit Log)

**מטרה:** הצגת כל השינויים שנעשו בתיק בפורמט timeline.

### משימות

- [ ] **7.1 יצירת AuditLogTimeline (משותף)**
  - קובץ: `components/shared/AuditLogTimeline/AuditLogTimeline.tsx`
  - Fetch היסטוריה
  - הצגת timeline
  - פורמט תאריכים (formatDistanceToNow)
  - אייקונים לפי סוג שינוי
  - שימוש ב:
    - ✅ `Sheet`, `SheetTrigger`, `SheetContent` מ-shadcn/ui
    - ✅ `ActionButton` (קיים)
    - ✅ Icons מ-lucide-react

- [ ] **7.2 שילוב ב-CaseHeader**
  - כפתור "היסטוריה"
  - פותח Sheet מצד שמאל

- [ ] **7.3 Middleware לרישום שינויים**
  - קובץ: `lib/middleware/audit-log.middleware.ts`
  - `logChange(caseId, changedBy, field, oldValue, newValue, note)`
  - קריאה בכל update

- [ ] **7.4 אינטגרציה בכל המקומות**
  - HebrewTab - עריכת שדה
  - PaymentsTab - אישור תשלום
  - FilesTab - העלאה/מחיקה
  - CaseHeader - שינוי סטטוס

- [ ] **7.5 בדיקות Phase 7**
  - ✅ Drawer/Sheet פותח מצד
  - ✅ Timeline מוצג נכון
  - ✅ כל שינוי מתועד
  - ✅ פורמט זמנים יפה
  - ✅ אייקונים מתאימים

**זמן משוער:** 2 ימים

---

## 🎯 Phase 8: תיקי ילדים חולים (Cleaning Cases)

**מטרה:** התאמת המסך גם לתיקי ילדים חולים (פשוט יותר - 2 טאבים).

### משימות

- [ ] **8.1 יצירת CleaningPaymentsTab**
  - קובץ: `app/[locale]/(dashboard)/cases/[id]/_components/CleaningPaymentsTab.tsx`
  - סקשנים:
    1. פרטי בנק (read-only)
    2. הזנת תשלום חודשי
    3. היסטוריית תשלומים
  - שימוש ב:
    - ✅ `BankDetailsForm` (read-only)
    - ✅ `Select` מ-shadcn/ui - חודש
    - ✅ `FormField` (קיים)
    - ✅ `ActionButton` (קיים)
    - ✅ `PaymentHistoryTable` (שיצרנו)

- [ ] **8.2 עדכון CaseTabs - תנאי לפי סוג**
  - `if (caseType === 'wedding')` → 4 טאבים
  - `else` → 2 טאבים

- [ ] **8.3 עדכון CaseHeader - תנאי לפי סוג**
  - כפתורים שונים לכל סוג
  - חתונות: "אשר להעברה", "דחה"
  - ילדים חולים: "סגור תיק", "שחזר תיק"

- [ ] **8.4 לוגיקת תשלום חודשי**
  - בחירת חודש
  - תקרה: ₪720
  - ולידציה: לא להזין אותו חודש פעמיים
  - יצירת payment עם `payment_month`

- [ ] **8.5 סגירת תיק**
  - Dialog עם בחירת סיבה:
    - "הילד החלים"
    - "הילד נפטר"
    - "סיום תמיכה"
  - עדכון: `status = 'inactive'`, `end_date`, `end_reason`

- [ ] **8.6 בדיקות Phase 8**
  - ✅ תיקי ילדים חולים עובדים
  - ✅ 2 טאבים בלבד
  - ✅ הזנת תשלום חודשי
  - ✅ תקרה של ₪720
  - ✅ סגירת תיק עם סיבה

**זמן משוער:** 2 ימים

---

## 🎯 Phase 9: Polish & Testing

**מטרה:** בדיקות, תיקונים, אופטימיזציה.

### משימות

- [ ] **9.1 Responsive Testing**
  - ✅ Mobile: 320px-768px
  - ✅ Tablet: 768px-1024px
  - ✅ Desktop: 1024px+
  - בדיקה על מכשירים אמיתיים

- [ ] **9.2 RTL Testing**
  - ✅ עברית: כל האלמנטים ימין-שמאל
  - ✅ אנגלית: כל האלמנטים שמאל-ימין
  - ✅ Icons בכיוון נכון
  - ✅ Margins/Paddings נכונים

- [ ] **9.3 Performance**
  - ✅ Code splitting (dynamic imports)
  - ✅ Image optimization
  - ✅ Lazy loading לטאבים
  - ✅ Lighthouse score > 90

- [ ] **9.4 Accessibility**
  - ✅ Keyboard navigation
  - ✅ Focus states ברורים
  - ✅ ARIA labels לכל הכפתורים
  - ✅ Screen reader testing
  - ✅ Color contrast > 4.5:1

- [ ] **9.5 Error Scenarios**
  - ✅ 404 - תיק לא נמצא
  - ✅ 403 - אין הרשאות
  - ✅ Network error
  - ✅ Upload failed
  - ✅ Translation failed
  - ✅ Payment approval failed

- [ ] **9.6 i18n**
  - ✅ כל הטקסטים דרך `useTranslations`
  - ✅ הודעות שגיאה מתורגמות
  - ✅ Toast notifications מתורגמות

- [ ] **9.7 תיעוד קוד**
  - ✅ JSDoc לפונקציות מרכזיות
  - ✅ README לכל service
  - ✅ דוגמאות שימוש

**זמן משוער:** 2-3 ימים

---

## 📊 סיכום רכיבים

### קומפוננטות משותפות חדשות (shared):
1. 🆕 `CaseHeader` - רצועת מידע כללית
2. 🆕 `BankDetailsForm` - טופס פרטי בנק
3. 🆕 `PaymentHistoryTable` - טבלת היסטוריית תשלומים
4. 🆕 `AuditLogTimeline` - היסטוריית שינויים

### קומפוננטות ספציפיות לדף (_components):
1. 🆕 `CaseTabs` - מערכת טאבים
2. 🆕 `HebrewTab` - טאב עברית
3. 🆕 `EnglishTab` - טאב אנגלית
4. 🆕 `FilesTab` - טאב קבצים
5. 🆕 `PaymentsTab` - טאב תשלומים (חתונות)
6. 🆕 `CleaningPaymentsTab` - טאב תשלומים (ילדים חולים)

### Custom Hooks:
1. 🆕 `useCase` - ניהול נתוני תיק
2. 🆕 `useCaseTranslation` - תרגום
3. 🆕 `useCaseFiles` - קבצים
4. 🆕 `useCasePayments` - תשלומים

### Services:
1. 🆕 `translation.service.ts` - תרגום AI
2. 🆕 `file-storage.service.ts` - אחסון קבצים
3. 🆕 `currency.service.ts` - שער חליפין

### קומפוננטות קיימות בשימוש:
1. ✅ `ActionButton` - כל הכפתורים
2. ✅ `FormField` - כל שדות הטופס
3. ✅ `StatusBadge` - סטטוסים
4. ✅ `FileUpload` - העלאת קבצים
5. ✅ `CurrencyConverter` - המרת מטבע
6. ✅ `DataTable` - (אם נצטרך)

---

## ⏱️ אומדן זמנים

| Phase | תיאור | זמן משוער |
|-------|-------|-----------|
| Phase 1 | תשתית + CaseHeader | 1-2 ימים |
| Phase 2 | טאב עברית + עריכה | 2-3 ימים |
| Phase 3 | טאב קבצים | 2-3 ימים |
| Phase 4 | טאב תשלומים - בנק | 2-3 ימים |
| Phase 5 | טאב תשלומים - היסטוריה | 1 יום |
| Phase 6 | טאב אנגלית + AI | 2-3 ימים |
| Phase 7 | Audit Log | 2 ימים |
| Phase 8 | ילדים חולים | 2 ימים |
| Phase 9 | Polish & Testing | 2-3 ימים |
| **סה"כ** | | **~16-22 ימי עבודה** |

---

## 🔄 תהליך עבודה מומלץ

### לכל Phase:
1. ✅ קריאת המשימות
2. ✅ יצירת הקבצים הנדרשים
3. ✅ כתיבת הקוד לפי SOLID + הנחיות
4. ✅ בדיקה עצמית
5. ✅ סימון משימות כהושלמו
6. ✅ Commit עם הודעה ברורה
7. ✅ מעבר ל-Phase הבא

### Commit Messages:
```
feat(case): add CaseHeader component (Phase 1)
feat(case): add HebrewTab with edit mode (Phase 2)
feat(case): add file upload functionality (Phase 3)
feat(case): add payment approval flow (Phase 4)
fix(case): fix RTL layout in CaseHeader
docs(case): update development plan
```

---

## 📝 הערות חשובות

### עקרונות SOLID:
- **S** - כל קומפוננטה עושה דבר אחד
- **O** - פתוח להרחבה, סגור לשינוי
- **L** - קומפוננטות נגזרות תחליף מלא
- **I** - ממשקים ממוקדים
- **D** - תלוי באבסטרקציות

### עיצוב (Version B):
- צבעים רכים: emerald, rose, sky, slate
- גבולות דקים (`border` לא `border-2`)
- צללים מינימליים (`shadow-sm/md`)
- סגנון מאטי - ללא ברק

### i18n:
- **כל** הטקסטים דרך `useTranslations`
- אין טקסט ישיר בקוד
- תמיכה ב-RTL מלאה

### Supabase:
- שימוש ב-Row Level Security (RLS)
- Types אוטומטיים מ-DB
- Optimistic UI updates

---

## ✅ מוכן להתחיל?

הפאזה הראשונה מוכנה:
```bash
# יצירת המבנה הבסיסי
cd src
mkdir -p app/[locale]/\(dashboard\)/cases/[id]/_components
mkdir -p components/shared/CaseHeader
mkdir -p types
```

**נתחיל ב-Phase 1?**
