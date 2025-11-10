# מסמך תכנון - מודול העברות בנקאיות

**תאריך:** נובמבר 2025
**גרסה:** 2.0
**מטרה:** אפיון מפורט למודול העברות בנקאיות - מוכן לפיתוח עם AI

---

## תוכן עניינים

1. [סקירה כללית](#1-סקירה-כללית)
2. [מבנה נתונים ו-Database](#2-מבנה-נתונים-ו-database)
3. [ארכיטקטורת קומפוננטות](#3-ארכיטקטורת-קומפוננטות)
4. [ממשק משתמש](#4-ממשק-משתמש)
5. [לוגיקה עסקית](#5-לוגיקה-עסקית)
6. [הוראות פיתוח](#6-הוראות-פיתוח)
7. [שלבי פיתוח](#7-שלבי-פיתוח)

---

## 1. סקירה כללית

### 1.1 מטרת המודול

מודול מרכזי לניהול העברות בנקאיות לשני סוגי תמיכה:
- **חתונות יתומים** - העברות חד-פעמיות
- **ילדים חולים** - העברות חודשיות חוזרות

### 1.2 תזרים עבודה

```
1. אישור תשלום בתיק → payments.status = 'approved'
   ↓
2. מודול העברות: רשימה מסוננת לפי סוג (2 טאבים)
   ↓
3. סימון שורות + בחירת סוג ייצוא
   ↓
4. ייצוא → Excel/MASAV
   ↓
5. מייל סיכום + עדכון אוטומטי של סטטוסים
```

### 1.3 דרישות מפתח

- ✅ הפרדה בין סוגי העברות (2 טאבים)
- ✅ סינונים מתקדמים וחיפוש
- ✅ ייצוא כפול: Excel רגיל + MASAV
- ✅ i18n מלא (עברית/אנגלית)
- ✅ RTL/LTR support
- ✅ Responsive design
- ✅ Audit trail
- ✅ בקרת שגיאות

---

## 2. מבנה נתונים ו-Database

### 2.1 ⚠️ חשוב: המערכת משתמשת בטבלאות קיימות!

**אין ליצור טבלאות חדשות!** המודול עובד עם:

#### טבלאות קיימות:

**`payments`** - טבלת תשלומים (המקור להעברות)
```sql
-- שדות קריטיים:
id, case_id, payment_type, payment_month,
amount_usd, amount_ils, exchange_rate,
status, approved_amount, approved_by,
transferred_at, receipt_reference
```

**`bank_details`** - פרטי בנק
```sql
-- 1:1 עם cases
id, case_id, bank_number, branch,
account_number, account_holder_name
```

**`cases`** - תיקים
```sql
-- שדות רלוונטיים:
id, case_number, case_type, status, previous_status,
groom_first_name, bride_first_name,
family_name, child_name, city
```

**`transfers_export`** - היסטוריית יצואים
```sql
id, export_type, exported_by, exported_at,
filename, file_url, cases_included,
total_amount, total_count
```

### 2.2 Queries עיקריים (Supabase)

**העברות ממתינות:**
```typescript
// חתונות
const { data } = await supabase
  .from('payments')
  .select(`
    *,
    cases!inner(case_number, case_type, groom_first_name, bride_first_name, city),
    bank_details!inner(bank_number, branch, account_number, account_holder_name)
  `)
  .eq('status', 'approved')
  .eq('payment_type', 'wedding_transfer')
  .is('transferred_at', null);

// ילדים חולים
.eq('payment_type', 'cleaning_monthly')
```

**עדכון אחרי ייצוא:**
```typescript
await supabase
  .from('payments')
  .update({
    status: 'transferred',
    transferred_at: new Date(),
    receipt_reference: 'REF_123'
  })
  .in('id', selectedIds);
```

### 2.3 אינדקסים נדרשים

```sql
CREATE INDEX IF NOT EXISTS payments_payment_type_status_idx
  ON payments(payment_type, status);

CREATE INDEX IF NOT EXISTS payments_approved_pending_idx
  ON payments(approved_amount)
  WHERE status = 'approved' AND transferred_at IS NULL;
```

---

## 3. ארכיטקטורת קומפוננטות

### 3.1 מבנה תיקיות

```
src/
├── app/[locale]/(dashboard)/transfers/
│   ├── page.tsx                          # מסך ראשי
│   └── _components/                      # קומפוננטות מקומיות
│       ├── TransfersTabs.tsx
│       ├── TransfersTable.tsx
│       ├── TransferFilters.tsx
│       ├── ExportDialog.tsx
│       ├── TransferSummary.tsx
│       └── BulkActions.tsx
│
├── lib/
│   ├── services/
│   │   ├── transfers.service.ts          # Supabase queries
│   │   ├── export.service.ts             # Excel export
│   │   └── masav.service.ts              # MASAV export
│   │
│   └── hooks/
│       ├── useTransfers.ts               # Data fetching
│       ├── useTransferFilters.ts         # Filters state
│       └── useExportTransfers.ts         # Export logic
│
├── types/
│   ├── transfers.types.ts
│   └── export.types.ts
│
└── messages/                             # i18n
    ├── he.json                           # transfers.*
    └── en.json
```

### 3.2 קומפוננטות משותפות (קיימות)

- `DataTable` - טבלה גנרית עם selection
- `StatusBadge` - תצוגת סטטוסים
- `DateRangePicker` - בחירת טווח תאריכים
- `CurrencyDisplay` - תצוגת מטבעות

### 3.3 shadcn/ui Components נדרשים

```bash
# ודא שהקומפוננטות הבאות מותקנות:
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add button
```

---

## 4. ממשק משתמש

### 4.1 פריסת מסך (Wireframe)

```
┌──────────────────────────────────────────────────┐
│ [🏠 חתונות יתומים] [👨‍👩‍👧‍👦 ילדים חולים]           │
├──────────────────────────────────────────────────┤
│ סינונים: [תאריך] [סכום] [חיפוש...]  [נקה]     │
├──────────────────────────────────────────────────┤
│ ☑️ סמן הכל  [📥 Excel] [🏦 MASAV] [📧 מייל]    │
├──────────────────────────────────────────────────┤
│ ☑ │ תיק │ שם      │ סכום    │ בנק     │ סטטוס │
│ ☐ │ 123 │ דוד כהן │ 5,000₪  │ הפועלים │ ממתין │
└──────────────────────────────────────────────────┘
```

### 4.2 טאבים

#### טאב 1: חתונות יתומים
**עמודות:**
1. Checkbox
2. תאריך יצירה
3. מס' תיק
4. שם החתן/כלה
5. תאריך חתונה
6. סכום ₪
7. סכום $
8. בעל חשבון
9. בנק/סניף/חשבון
10. סטטוס

**סינונים ייחודיים:**
- טווח תאריכי חתונה
- טווח סכומים (USD/ILS)
- עיר

#### טאב 2: ילדים חולים
**עמודות:**
1. Checkbox
2. תאריך יצירה
3. מס' תיק
4. שם משפחה
5. שם הילד
6. חודש תשלום
7. סכום ₪
8. בעל חשבון
9. בנק/סניף/חשבון
10. סטטוס

**סינונים ייחודיים:**
- חודש תשלום
- טווח סכומים

### 4.3 דיאלוגים

**ייצוא Excel:**
- שם קובץ
- כלול כותרות / סיכום
- בחירת עמודות

**ייצוא MASAV:**
- סוג ייצוא (רגיל/דחוף)
- תאריך ביצוע
- בדיקת תקינות

---

## 5. לוגיקה עסקית

### 5.1 Validation Rules

**חשבון בנק:**
- בנק: 2-3 ספרות
- סניף: 3 ספרות
- חשבון: עד 20 תווים
- שם בעל חשבון: 2-255 תווים

**סכומים:**
- חתונות: 1,000 - 50,000 ₪
- ילדים חולים: 100 - 720 ₪

### 5.2 MASAV Export

🔥 **קריטי: חובה להשתמש בספריית `masav` npm**

```bash
npm install masav
```

**למה?**
- ✅ ולידציה בנקאית אוטומטית
- ✅ פורמט תקני של בנק ישראל
- ✅ checksums אוטומטיים
- ❌ **אסור לממש לוגיקה בנקאית ידנית!**

**הגדרות נדרשות ל-MASAV:**

⚠️ **לפני יצוא MASAV לראשונה**, יש לעדכן את ההגדרות ב-`system_settings`:

```sql
-- עדכון הגדרות המוסד ל-MASAV
UPDATE system_settings
SET setting_value = '{
  "institution_id": "12345678",        -- מספר מוסד (8 ספרות) שהתקבל מהבנק
  "institution_name": "Shimchat Zion", -- שם המוסד
  "bank_code": "12",                   -- קוד בנק של המוסד (2 ספרות)
  "branch_code": "345",                -- קוד סניף (3 ספרות)
  "account_number": "1234567",         -- מספר חשבון המוסד
  "sequence_number": "001"             -- מספר רצף (3 ספרות)
}'::jsonb
WHERE setting_key = 'masav_organization';
```

**פרטים להשיג מהבנק:**
1. **מספר מוסד** (`institution_id`) - מספר ייחודי בן 8 ספרות שהבנק מקצה לארגון
2. **פרטי חשבון המוסד** - החשבון ממנו יוצאים התשלומים (בנק, סניף, חשבון)

**שימוש בסיסי:**
```typescript
import masav from 'masav';

const masavRecords = transfers.map(t => ({
  beneficiaryName: t.account_holder_name,
  bankCode: t.bank_number,
  branchCode: t.branch,
  accountNumber: t.account_number,
  amount: t.amount,
  reference: t.case_number
}));

const masavFile = masav.createFile(masavRecords);
```

### 5.3 Email Integration

**אחרי ייצוא:**
- נמענים: מזכירות
- נושא: "סיכום העברות - [תאריך]"
- תוכן: כמות + סכום כולל
- קובץ מצורף: Excel/MASAV

---

## 6. הוראות פיתוח

### 6.1 עקרונות SOLID (בתמצות)

**Single Responsibility:**
- כל קומפוננטה עושה דבר אחד
- כל service מטפל בתחום אחד

**Open/Closed:**
- קומפוננטות גנריות ניתנות להרחבה
- דוגמה: `DataTable<T>`, `Exporter<T>`

**Dependency Inversion:**
- שימוש ב-interfaces
- Custom hooks מפשטים תלויות

### 6.2 i18n Standards

**מבנה messages:**
```json
{
  "transfers": {
    "title": "העברות בנקאיות",
    "tabs": {
      "wedding": "חתונות יתומים",
      "cleaning": "ילדים חולים"
    },
    "status": {
      "pending": "ממתין",
      "transferred": "הועבר"
    },
    "actions": {
      "exportExcel": "ייצוא Excel",
      "exportMasav": "ייצוא MASAV"
    },
    "filters": {
      "dateFrom": "מתאריך",
      "dateTo": "עד תאריך"
    }
  }
}
```

**שימוש בקומפוננטות:**
```typescript
'use client';
import { useTranslations } from 'next-intl';

export function TransfersHeader() {
  const t = useTranslations('transfers');
  return <h1>{t('title')}</h1>;
}
```

### 6.3 RTL Support

**Layout:**
```tsx
// התאמה אוטומטית לפי locale
<html dir={locale === 'he' ? 'rtl' : 'ltr'}>
```

**Tailwind Classes:**
```tsx
// השתמש ב-logical properties
<div className="ms-4 text-start">  {/* לא ml-4 / text-left */}
```

### 6.4 Supabase Integration

**Client Component:**
```typescript
'use client';
import { supabase } from '@/lib/supabase/client';
```

**Server Component:**
```typescript
import { createClient } from '@/lib/supabase/server';
const supabase = createClient();
```

**Custom Hook דוגמה:**
```typescript
export function useTransfers(filters) {
  return useQuery({
    queryKey: ['transfers', filters],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select('*, cases(*), bank_details(*)')
        .eq('status', 'approved');
      return data;
    }
  });
}
```

### 6.5 Error Handling

**Custom Error:**
```typescript
export class TransferError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}
```

**שימוש:**
```typescript
try {
  await exportTransfers();
} catch (error) {
  if (error instanceof TransferError) {
    toast.error(t(`errors.${error.code}`));
  }
}
```

### 6.6 TypeScript Standards

**strict mode:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

**Types מוגדרים:**
```typescript
// types/transfers.types.ts
export interface Transfer {
  id: string;
  case_id: string;
  amount_ils: number;
  amount_usd?: number;
  bank_details: BankDetails;
  case: Case;
}
```

### 6.7 Component Checklist

לכל קומפוננטה:
- [ ] TypeScript מלא
- [ ] i18n (useTranslations)
- [ ] RTL support (ms-*, text-start)
- [ ] Responsive design
- [ ] Loading state
- [ ] Error state
- [ ] Empty state
- [ ] Accessibility (aria-*)

---

## 7. שלבי פיתוח

### Phase 1: Foundation (2-3 ימים)

**משימות:**
1. הבנת מבנה ה-DB הקיים
2. יצירת Types:
   ```bash
   npx supabase gen types typescript > types/supabase.ts
   ```
3. יצירת `transfers.types.ts`, `export.types.ts`
4. Services בסיסיים:
   - `transfers.service.ts` - Supabase queries
   - `export.service.ts` - Excel logic
   - `masav.service.ts` - MASAV integration
5. i18n messages: `transfers.*` בעברית ואנגלית

**תוצרים:**
- ✅ Types מוגדרים
- ✅ Services בסיסיים
- ✅ i18n messages

---

### Phase 2: Core Components (3-4 ימים)

**משימות:**
1. **TransfersTabs** - 2 טאבים (חתונות/ילדים חולים)
2. **TransfersTable** - טבלה עם selection
   - שימוש ב-DataTable משותף
   - Columns שונים לכל טאב
   - Row selection state
3. **TransferFilters** - סינונים
   - טווח תאריכים
   - טווח סכומים
   - חיפוש חופשי
4. **Custom Hooks:**
   - `useTransfers(type, filters)` - fetch data
   - `useTransferFilters()` - filters state
   - `useTransferSelection()` - selection state

**תוצרים:**
- ✅ טבלה עובדת עם selection
- ✅ סינונים פונקציונליים
- ✅ Pagination (אם נדרש)

---

### Phase 3: Export Functionality (3-4 ימים)

**משימות:**
1. **Excel Export:**
   - Service: `exportToExcel(transfers, options)`
   - כותרות בעברית/אנגלית
   - סיכום כולל
2. **MASAV Export:**
   - התקנה: `npm install masav`
   - Service: `exportToMasav(transfers, options)`
   - ולידציה אוטומטית
3. **ExportDialog:**
   - 2 מצבים: Excel / MASAV
   - אופציות ייצוא
   - Progress indicator
4. **API Endpoints:**
   - `POST /api/transfers/export/excel`
   - `POST /api/transfers/export/masav`
5. **Email Service:**
   - שליחת מייל עם קובץ מצורף
   - תבנית מייל בעברית/אנגלית

**תוצרים:**
- ✅ Excel export עובד
- ✅ MASAV export עובד
- ✅ מיילים נשלחים

---

### Phase 4: Integration & Polish (2-3 ימים)

**משימות:**
1. **BulkActions:**
   - Select all / none
   - Bulk export
   - Bulk status update
2. **TransferSummary:**
   - סטטיסטיקות (כמות, סכום)
   - פילוח לפי סטטוס
3. **Status Updates:**
   - עדכון אוטומטי אחרי ייצוא
   - Optimistic updates
   - Invalidate queries
4. **Error Handling:**
   - Toast notifications
   - Retry logic
   - Graceful degradation
5. **Loading States:**
   - Skeletons
   - Spinners
   - Disabled states

**תוצרים:**
- ✅ UI מלא עם 2 טאבים
- ✅ Bulk operations
- ✅ Status updates אוטומטיים

---

### Phase 5: Testing & Quality (2 ימים)

**משימות:**
1. **Manual Testing:**
   - כל תרחישי שימוש
   - Edge cases
   - Error scenarios
2. **Performance:**
   - Query optimization
   - Large datasets (1000+ rows)
   - Export performance
3. **i18n Verification:**
   - כל הטקסטים מתורגמים
   - RTL נראה נכון
4. **Accessibility:**
   - Keyboard navigation
   - Screen reader support
   - ARIA labels

**תוצרים:**
- ✅ Bug-free
- ✅ Performance מקובל
- ✅ i18n + RTL מלא

---

### Phase 6: Final Polish (1 יום)

**משימות:**
1. Code Review
2. Refactoring לפי SOLID
3. Documentation (comments)
4. Deployment check

**תוצרים:**
- ✅ Production ready
- ✅ Clean code
- ✅ Documentation

---

## סיכום - Criteria for Completion

### פונקציונליות:
- [ ] 2 טאבים עובדים (חתונות/ילדים חולים)
- [ ] סינונים מתקדמים
- [ ] Selection מרובה
- [ ] Excel export
- [ ] MASAV export
- [ ] Email notifications
- [ ] Status updates אוטומטיים

### איכות קוד:
- [ ] TypeScript strict
- [ ] i18n מלא (עברית/אנגלית)
- [ ] RTL/LTR support
- [ ] SOLID principles
- [ ] Error handling
- [ ] Loading states

### Performance:
- [ ] Page load < 2s
- [ ] Table render < 500ms (1000 rows)
- [ ] Export < 30s (1000 transfers)

### Production Ready:
- [ ] No console errors
- [ ] Responsive design
- [ ] Accessibility
- [ ] Security (input validation)

---

**מסמך תכנון העברות בנקאיות - גרסה 2.0**
**תאריך:** נובמבר 2025
**מוכן לפיתוח:** ✅
