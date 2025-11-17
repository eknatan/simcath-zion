# מדריך מהיר לפיתוח מודול ילדים חולים

**תאריך:** נובמבר 2025 | **גרסה:** 1.0 | **מטרה:** עבודה עם קומפוננטות משותפות - אפס שכפול!

---

## 🎯 עקרונות מרכזיים

### 1. REUSE, DON'T DUPLICATE!
**90% מהקומפוננטות כבר קיימות במערכת!**

### 2. SOLID Principles (חובה!)

#### **S - Single Responsibility (אחריות יחידה)**
```tsx
// ✅ נכון - קומפוננטה עושה דבר אחד
function MonthlyPaymentDialog({ caseId, onSave }) {
  // רק אחראית על הזנת תשלום חודשי
  return <Dialog>...</Dialog>;
}

// ❌ לא נכון - קומפוננטה עושה הכל
function CaseManager() {
  // מנהלת תיק + תשלומים + קבצים + בנק = יותר מדי!
}
```

**למה זה חשוב:**
- קל לבדיקה
- קל לתחזוקה
- קל לשימוש חוזר

---

#### **O - Open/Closed (פתוח להרחבה, סגור לשינוי)**
```tsx
// ✅ נכון - DataTable גנרי שאפשר להרחיב
<DataTable
  columns={cleaningColumns}  // עמודות מותאמות
  data={cases}
  onRowClick={handleClick}   // התנהגות מותאמת
/>

// ❌ לא נכון - קומפוננטה קשיחה
function CleaningCasesTable() {
  // עמודות קבועות, אי אפשר להתאים
}
```

**עיקרון:** הרחב עם Props, אל תשנה קוד קיים!

---

#### **L - Liskov Substitution (תחליף מלא)**
```tsx
// ✅ נכון - SubmitButton הוא Button מיוחד
<SubmitButton onClick={handleSubmit}>שמור</SubmitButton>
// זהה ל: <Button type="submit" onClick={handleSubmit}>שמור</Button>

// ❌ לא נכון - API שונה לחלוטין
<SpecialButton action={handleSubmit} />  // שדות שונים!
```

**עיקרון:** תת-קומפוננטה חייבת לעבוד בדיוק כמו הבסיס!

---

#### **I - Interface Segregation (ממשקים ממוקדים)**
```tsx
// ✅ נכון - ממשקים ספציפיים
interface CaseBase {
  id: string;
  case_number: number;
  status: string;
}

interface CleaningCase extends CaseBase {
  family_name: string;
  child_name: string;
  start_date: Date;
}

// ❌ לא נכון - ממשק ענק אחד
interface AllCasesData {
  id, case_number, status,
  family_name, child_name, start_date,  // ניקיון
  groom_name, bride_name, wedding_date, // חתונה
  // 50 שדות נוספים...
}
```

**עיקרון:** כל קומפוננטה מקבלת רק מה שהיא צריכה!

---

#### **D - Dependency Inversion (תלות באבסטרקציות)**
```tsx
// ✅ נכון - תלות בממשק
interface PaymentService {
  addPayment(data: PaymentData): Promise<Payment>;
}

function MonthlyPaymentDialog({ paymentService }: { paymentService: PaymentService }) {
  // משתמש בממשק, לא ביישום ספציפי
}

// ❌ לא נכון - תלות ישירה ב-Supabase
function MonthlyPaymentDialog() {
  const payment = await supabase.from('payments').insert(...);
  // קשור חזק ל-Supabase!
}
```

**עיקרון:** תלוי בממשקים (interfaces), לא במימושים קונקרטיים!

---

### 3. תמיכה ב-RTL/i18n (חובה!)

#### **כל טקסט חייב לעבור דרך תרגום:**
```tsx
// ✅ נכון
import { useTranslations } from 'next-intl';
const t = useTranslations('sickChildren');

<Button>{t('addPayment')}</Button>
<h1>{t('title')}</h1>

// ❌ לא נכון
<Button>הוסף תשלום</Button>
<h1>ילדים חולים</h1>
```

#### **Spacing: השתמש ב-logical properties**
```tsx
// ✅ נכון - עובד ב-RTL + LTR
className="ms-4 me-2"        // margin-start, margin-end
className="ps-6 pe-4"        // padding-start, padding-end
className="text-start"       // יישור לתחילה

// ❌ לא נכון - רק LTR
className="ml-4 mr-2"        // margin-left, margin-right
className="text-left"        // יישור שמאל
```

#### **כיוון דינמי:**
```tsx
const locale = useLocale();
const dir = locale === 'he' ? 'rtl' : 'ltr';

<div dir={dir} className="...">
  {content}
</div>
```

---

### 4. Supabase Patterns (חובה!)

#### **Client vs Server:**
```tsx
// Client Component
'use client';
import { supabase } from '@/lib/supabase/client';

// Server Component
import { createServerClient } from '@/lib/supabase/server';
const supabase = createServerClient();
```

#### **Error Handling:**
```tsx
const { data, error } = await supabase
  .from('cases')
  .select('*')
  .eq('id', caseId)
  .single();

if (error) {
  console.error('Supabase error:', error);
  toast.error(t('errors.loadFailed'));
  return;
}
```

#### **Row Level Security (RLS):**
```sql
-- כל ה-policies כבר מוגדרים!
-- אל תעקוף אותם ללא סיבה טובה
```

---

### 5. TypeScript Strict (חובה!)

```tsx
// ✅ נכון - types מלאים
interface MonthlyPaymentDialogProps {
  caseId: string;
  onSave: (payment: Payment) => Promise<void>;
  trigger?: React.ReactNode;
}

export function MonthlyPaymentDialog({
  caseId,
  onSave,
  trigger
}: MonthlyPaymentDialogProps) {
  // ...
}

// ❌ לא נכון - any או ללא types
export function MonthlyPaymentDialog(props: any) {
  // ...
}
```

**אסור:**
- `any` types
- `@ts-ignore`
- `as unknown as X` (אלא אם באמת הכרחי)

---

### 6. קונבנציות שמות

```typescript
// Components: PascalCase
MonthlyPaymentDialog.tsx
CaseHeader.tsx

// Files: kebab-case
monthly-payment-dialog.tsx
case-header.tsx

// Functions: camelCase
function calculateMonthlyTotal() {}
const handleSave = () => {};

// Constants: UPPER_SNAKE_CASE
const MAX_MONTHLY_AMOUNT = 720;
const DEFAULT_CURRENCY = 'ILS';

// Types/Interfaces: PascalCase
interface PaymentData {}
type CaseStatus = 'active' | 'inactive';
```

---

### 7. ארגון Imports

```typescript
// 1. React & Next
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

// 2. External libraries
import { toast } from 'sonner';
import { z } from 'zod';

// 3. Internal - UI
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

// 4. Internal - Shared
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';

// 5. Internal - Utils
import { formatCurrency } from '@/lib/utils/format';
import { supabase } from '@/lib/supabase/client';

// 6. Types
import type { Case, Payment } from '@/types/case.types';
```

---

### 8. Error Handling Pattern

```tsx
async function savePayment(data: PaymentData) {
  try {
    // 1. Validation
    const validated = paymentSchema.parse(data);

    // 2. API call
    const { data: payment, error } = await supabase
      .from('payments')
      .insert(validated)
      .select()
      .single();

    // 3. Error check
    if (error) throw error;

    // 4. Success
    toast.success(t('payment.saved'));
    return payment;

  } catch (error) {
    // 5. Error handling
    console.error('Payment save failed:', error);

    if (error instanceof z.ZodError) {
      toast.error(t('validation.failed'));
    } else {
      toast.error(t('errors.saveFailed'));
    }

    throw error; // Re-throw for caller
  }
}
```

---

### 9. Loading States Pattern

```tsx
function CaseList() {
  const { data: cases, isLoading, error } = useCases();

  // 1. Loading
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 2. Error
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // 3. Empty
  if (!cases?.length) {
    return <EmptyState message={t('cases.noCases')} />;
  }

  // 4. Success
  return <DataTable data={cases} columns={columns} />;
}
```

---

### ✅ כבר קיים ופועל
### ⚙️ צריך התאמה קלה
### ❌ צריך ליצור

---

## 📦 קומפוננטות משותפות - רשימה מלאה

### 1. קומפוננטות UI (shadcn)

| קומפוננטה | נתיב | שימוש |
|-----------|------|-------|
| Button | `ui/button.tsx` | ✅ כל הכפתורים |
| Input | `ui/input.tsx` | ✅ שדות טקסט |
| Textarea | `ui/textarea.tsx` | ✅ פרטים רפואיים |
| Select | `ui/select.tsx` | ✅ בחירת עיר, סטטוס |
| Card | `ui/card.tsx` | ✅ מיכלי תוכן |
| Tabs | `ui/tabs.tsx` | ✅ טאבים בתיק |
| Dialog | `ui/dialog.tsx` | ✅ אישורים, הזנה מהירה |
| Table | `ui/table.tsx` | ✅ טבלת היסטוריה |
| Badge | `ui/badge.tsx` | ✅ סטטוס (פעיל/לא פעיל) |
| Calendar | `ui/calendar.tsx` | ✅ תאריך התחלה |
| Form | `ui/form.tsx` | ✅ כל הטפסים |
| Alert | `ui/alert.tsx` | ✅ הודעות אזהרה |
| AlertDialog | `ui/alert-dialog.tsx` | ✅ סגירת תיק |
| Sheet | `ui/sheet.tsx` | ✅ לוג שינויים |
| Skeleton | `ui/skeleton.tsx` | ✅ Loading states |

**→ 15 קומפוננטות UI מוכנות לשימוש!**

---

### 2. קומפוננטות משותפות עסקיות

#### 2.1 **DataTable** ✅
```tsx
// נתיב: shared/DataTable/DataTable.tsx
<DataTable
  columns={cleaningCasesColumns}
  data={cases}
  onRowClick={(row) => router.push(`/cases/${row.id}`)}
  isLoading={isLoading}
/>
```
**שימוש:** רשימת משפחות, טבלת תשלומים

---

#### 2.2 **CaseHeader** ✅ **כבר תומך בילדים חולים!**
```tsx
// נתיב: shared/CaseHeader/CaseHeader.tsx
<CaseHeader caseData={caseData} locale={locale} />
```
**מציג:**
- שם משפחה (גדול)
- שם ילד (כותרת משנה)
- תאריך התחלה
- סכום כולל שהועבר
- מספר חודשים פעילים
- עיר

**כפתורי פעולה:**
- עריכה
- סגירת תיק (אם פעיל)
- החזרה לפעיל (אם סגור)
- ייצוא PDF
- לוג שינויים

**→ אין צורך ליצור Header חדש!**

---

#### 2.3 **CaseSummary** ✅ **כבר תומך בילדים חולים!**
```tsx
// נתיב: shared/CaseSummary/CaseSummary.tsx
<CaseSummary caseData={caseData} />
```
**מציג:**
- פרטי משפחה
- פרטי הילד
- פרטי הורים (2 הורים!)
- פרטי קשר (3 טלפונים!)
- פרטי תיק (התחלה, עיר, סכום, חודשים)
- היסטוריית תשלומים

**→ אין צורך ליצור Summary חדש!**

---

#### 2.4 **BankDetailsForm** ✅
```tsx
// נתיב: shared/BankDetailsForm/BankDetailsForm.tsx
<BankDetailsForm
  value={bankDetails}
  onChange={handleUpdate}
  errors={errors}
  readonly={false}
/>
```
**פיצ'רים:**
- 10 בנקים ישראליים (data.gov.il)
- חיפוש סניפים
- ולידציה מלאה
- מצב קריאה בלבד

**→ שימוש זהה לחתונות!**

---

#### 2.5 **FormSection** ✅
```tsx
// נתיב: shared/Forms/FormSection.tsx
<FormSection
  title="פרטי משפחה"
  stepNumber={1}
  withGradient
>
  {/* שדות הטופס */}
</FormSection>
```
**עיצוב:** רקע כחול עם גרדיאנט, מספר שלב

**→ להשתמש בטופס הציבורי!**

---

#### 2.6 **FormField** ✅
```tsx
// נתיב: shared/Forms/FormField.tsx
<FormField
  label="שם משפחה"
  value={familyName}
  onSave={handleSave}
  type="text"
  required
  icon={<Users />}
/>
```
**פיצ'רים:**
- עריכה בקליק
- שמירה אוטומטית
- ולידציה
- אייקון

**→ להשתמש במסך תיק (עריכה inline)!**

---

#### 2.7 **PaymentHistoryTable** ✅
```tsx
// נתיב: shared/PaymentHistoryTable/PaymentHistoryTable.tsx
<PaymentHistoryTable
  payments={payments}
  isLoading={isLoading}
  onDelete={handleDelete}
  deletingPaymentId={deletingId}
/>
```
**פיצ'רים:**
- Desktop table + Mobile cards
- מחיקת תשלומים (רק מאושרים)
- סטטוס בצבעים
- USD/ILS

**→ להשתמש לתשלומים חודשיים!**

---

#### 2.8 **FileUpload** ✅
```tsx
// נתיב: shared/FileUpload/FileUpload.tsx
<FileUpload
  onFilesSelected={handleFiles}
  maxSize={5}
  accept={{
    'application/pdf': ['.pdf'],
    'image/*': ['.jpg', '.jpeg', '.png']
  }}
  multiple
/>
```
**פיצ'רים:**
- Drag & Drop
- ולידציה (גודל, סוג)
- Multiple files

**→ להעלאת מסמכים רפואיים!**

---

#### 2.9 **StatusBadge** ✅
```tsx
// נתיב: shared/StatusBadge/StatusBadge.tsx
<StatusBadge status="active" />
<StatusBadge status="inactive" />
```
**צבעים:**
- `active` → ירוק (emerald)
- `inactive` → אפור (slate)

**→ להצגת סטטוס תיק!**

---

#### 2.10 **AuditLogTimeline** ✅
```tsx
// נתיב: shared/AuditLogTimeline/AuditLogTimeline.tsx
<AuditLogTimeline history={caseHistory} />
```
**פיצ'רים:**
- Timeline בצד שמאל (Sheet)
- אייקונים לפי סוג שינוי
- זמן יחסי ("לפני 5 דקות")
- ייחוס למשתמש

**→ לוג שינויים אוטומטי!**

---

#### 2.11 **ExportDocument** ✅
```tsx
// נתיב: shared/ExportDocument/ExportDocument.tsx
<ExportDocument
  filename={`case-${caseNumber}.pdf`}
  title="סיכום תיק"
  direction="rtl"
>
  <CaseSummary caseData={caseData} />
</ExportDocument>
```
**פיצ'רים:**
- ייצוא PDF
- תמיכה ב-RTL
- פונטים עבריים
- פורמט A4

**→ ייצוא סיכומי תיק!**

---

#### 2.12 **StatCard** ✅
```tsx
// נתיב: shared/StatCard/StatCard.tsx
<StatCard
  title="משפחות פעילות"
  value={activeCases}
  icon={Users}
  colorScheme="emerald"
  trend={{ value: "+12%", label: "מהחודש שעבר" }}
/>
```
**צבעים זמינים:** blue, emerald, orange, indigo, red, purple

**→ סטטיסטיקות בדשבורד!**

---

#### 2.13 **LoadingSpinner & ErrorDisplay** ✅
```tsx
// נתיב: shared/LoadingSpinner.tsx, shared/ErrorDisplay.tsx
{isLoading && <LoadingSpinner />}
{error && <ErrorDisplay error={error} />}
```

**→ כל מסך טעינה/שגיאה!**

---

### 3. Hooks (פונקציות React)

#### 3.1 **useDebounce** ✅
```tsx
// נתיב: hooks/useDebounce.ts
const debouncedValue = useDebounce(inputValue, 1000);

useEffect(() => {
  // נשמר אחרי שנייה ללא שינויים
  saveToAPI(debouncedValue);
}, [debouncedValue]);
```

**→ שמירה אוטומטית של שדות!**

---

#### 3.2 **useExportPDF** ✅
```tsx
// נתיב: hooks/useExportPDF.ts
const { isExporting, exportToPDF, contentRef } = useExportPDF({
  filename: 'case-summary.pdf',
  direction: 'rtl'
});

<div ref={contentRef}>
  <CaseSummary caseData={caseData} />
</div>

<Button onClick={exportToPDF}>ייצוא PDF</Button>
```

**→ ייצוא כל תוכן ל-PDF!**

---

#### 3.3 **useApplicants** ✅
```tsx
// נתיב: hooks/useApplicants.ts
const {
  applicants,
  isLoading,
  filters,
  updateFilters,
  approveApplicant,
  rejectApplicant
} = useApplicants();
```

**→ דוגמה ליצירת `useSickChildrenCases`!**

---

### 4. פונקציות עזר (Utils)

#### 4.1 **format.ts** ✅
```tsx
// נתיב: lib/utils/format.ts
import { formatCurrency, formatDate, formatPhone } from '@/lib/utils/format';

formatCurrency(720, 'he-IL')  // "₪720"
formatDate('2024-01-15')       // "15 בינואר 2024"
formatPhone('0501234567')      // "050-1234567"
```

**→ פורמט כל הערכים!**

---

#### 4.2 **payment-format.ts** ✅
```tsx
// נתיב: lib/utils/payment-format.ts
import { formatILS, getPaymentStatusLabel } from '@/lib/utils/payment-format';

formatILS(1234.56)                    // "₪1,234.56"
getPaymentStatusLabel('transferred')  // "הועבר"
```

**→ פורמט תשלומים!**

---

### 5. קומפוננטות שכבר קיימות לילדים חולים!

#### 5.1 **SickChildrenForm** ✅ **קיים!**
```
נתיב: src/components/features/sick-children-form/SickChildrenForm.tsx
```

**כולל:**
- FormSection עם כל השדות
- Validation (Zod schema)
- Bank details
- File upload

**→ טופס ציבורי מוכן!**

---

#### 5.2 **sick-children-form.schema.ts** ✅ **קיים!**
```
נתיב: src/lib/validations/sick-children-form.schema.ts
```

**→ Validation מלא!**

---

#### 5.3 **Public Form Page** ✅ **קיים!**
```
נתיב: src/app/[locale]/public-forms/sick-children/page.tsx
```

**→ דף ציבורי מוכן!**

---

## 🔧 מה צריך ליצור (רשימה קצרה!)

### ❌ 1. MonthlyPaymentDialog
```tsx
// נתיב מוצע: components/features/sick-children/MonthlyPaymentDialog.tsx
<MonthlyPaymentDialog
  caseId={caseId}
  onSave={handleSave}
  trigger={<Button>הוסף תשלום חודשי</Button>}
/>
```

**שימוש:**
- Dialog (shadcn) ✅
- Select (חודש/שנה) ✅
- Input (סכום) ✅
- Alert (אזהרה אם > 720) ✅

---

### ❌ 2. CloseCaseDialog
```tsx
// נתיב מוצע: components/features/sick-children/CloseCaseDialog.tsx
<CloseCaseDialog
  caseId={caseId}
  hasPendingPayments={pendingCount > 0}
  onClose={handleClose}
  trigger={<Button variant="destructive">סגור תיק</Button>}
/>
```

**שימוש:**
- AlertDialog (shadcn) ✅
- Select (סיבה: החלים, נפטר, אחר) ✅
- Textarea (הסבר אם "אחר") ✅
- Alert (אזהרה אם יש תשלומים ממתינים) ✅

---

### ❌ 3. BulkPaymentEntryDialog
```tsx
// נתיב מוצע: components/features/sick-children/BulkPaymentEntryDialog.tsx
<BulkPaymentEntryDialog
  trigger={<Button>הזנה מהירה</Button>}
/>
```

**שימוש:**
- Dialog (full-screen) ✅
- Select (חודש) ✅
- DataTable (משפחות + שדה סכום) ✅
- Button (שמור הכל) ✅

---

### ⚙️ 4. FormRenderer - הרחבה
```tsx
// נתיב: shared/FormRenderer/FormRenderer.tsx
// להוסיף תמיכה ב-CleaningFormData
```

**שינוי:** הוספת `case CleaningFormData` ל-switch

---

### ⚙️ 5. ApplicantsContent - הרחבה
```tsx
// נתיב: (app)/applicants/pending/_components/ApplicantsContent.tsx
// להוסיף טאב "ילדים חולים"
```

**שינוי:** פילטר `case_type = 'cleaning'` בטאב חדש

---

## 🗂️ מבנה API Routes

### קיימים ✅
```
POST   /api/cases                    - יצירת תיק
GET    /api/cases/[id]               - פרטי תיק
PATCH  /api/cases/[id]               - עדכון תיק
GET    /api/cases/[id]/payments      - רשימת תשלומים
POST   /api/cases/[id]/payments      - הוספת תשלום
DELETE /api/cases/[id]/payments/[id] - מחיקת תשלום
GET    /api/cases/[id]/bank-details  - פרטי בנק
PUT    /api/cases/[id]/bank-details  - עדכון בנק
GET    /api/banks                    - רשימת בנקים
GET    /api/banks/[code]/branches    - רשימת סניפים
```

### חדשים ❌
```
POST /api/cases/[id]/payments/monthly - תשלום חודשי (עם חודש/שנה)
POST /api/cases/[id]/close            - סגירת תיק (עם סיבה)
POST /api/cases/[id]/reopen           - פתיחה מחדש
POST /api/cases/bulk-payments         - הזנה מהירה
```

---

## 📐 דוגמת מבנה מסך תיק

```tsx
// app/[locale]/(app)/cases/[id]/page.tsx

export default function CaseDetailPage({ params }) {
  const { data: caseData } = useSWR(`/api/cases/${params.id}`);

  // בדיקת סוג תיק
  if (caseData.case_type === 'wedding') {
    return <WeddingCaseView caseData={caseData} />;
  }

  // ילדים חולים
  return (
    <div>
      {/* Header - כבר תומך! */}
      <CaseHeader caseData={caseData} locale={locale} />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">סקירה</TabsTrigger>
          <TabsTrigger value="payments">תשלומים</TabsTrigger>
          <TabsTrigger value="bank">בנק</TabsTrigger>
          <TabsTrigger value="files">קבצים</TabsTrigger>
        </TabsList>

        {/* טאב סקירה */}
        <TabsContent value="overview">
          <CaseSummary caseData={caseData} /> {/* כבר תומך! */}
        </TabsContent>

        {/* טאב תשלומים */}
        <TabsContent value="payments">
          <div className="space-y-4">
            {/* כפתור חדש */}
            <MonthlyPaymentDialog caseId={caseData.id} />

            {/* טבלה קיימת */}
            <PaymentHistoryTable payments={caseData.payments} />
          </div>
        </TabsContent>

        {/* טאב בנק */}
        <TabsContent value="bank">
          <BankDetailsForm
            value={caseData.bank_details}
            onChange={handleUpdate}
          />
        </TabsContent>

        {/* טאב קבצים */}
        <TabsContent value="files">
          <FileUpload onFilesSelected={handleUpload} />
          {/* רשימת קבצים */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**→ 80% קוד קיים! רק MonthlyPaymentDialog חדש**

---

## 🎨 עקרונות עיצוב

### צבעים (Version B: Elegant & Soft)
```tsx
// Primary (כחול)
className="bg-blue-600 text-white"

// Success (ירוק)
className="bg-emerald-600 text-white"

// Danger (אדום)
className="bg-rose-600 text-white"

// Warning (כתום)
className="bg-orange-600 text-white"

// Neutral (אפור)
className="bg-slate-600 text-white"
```

### גרדיאנטים
```tsx
className="bg-gradient-to-br from-white to-blue-50/30"
className="bg-gradient-to-br from-blue-50/80 to-blue-50/40"
```

### גבולות
```tsx
className="border border-slate-200"      // דק
className="border-2 border-blue-100"     // בינוני
```

### צללים
```tsx
className="shadow-sm"                    // עדין
className="shadow-md hover:shadow-xl"    // בינוני + hover
```

---

## 🌐 תמיכה ב-RTL/i18n

### שימוש בתרגום
```tsx
import { useTranslations } from 'next-intl';

const t = useTranslations('sickChildren'); // namespace

<h1>{t('title')}</h1>
<Button>{t('addPayment')}</Button>
```

### כיוון אוטומטי
```tsx
import { useLocale } from 'next-intl';

const locale = useLocale();
const dir = locale === 'he' ? 'rtl' : 'ltr';

<div dir={dir}>
  {/* תוכן */}
</div>
```

### Spacing classes
```tsx
// במקום ml-4, mr-4
className="ms-4"    // margin-start (שמאל ב-LTR, ימין ב-RTL)
className="me-4"    // margin-end

// במקום text-left, text-right
className="text-start"  // יישור לתחילה
className="text-end"    // יישור לסוף
```

---

## 📝 Checklist לכל קומפוננטה חדשה

לפני שיוצרים קומפוננטה חדשה, בדוק:

- [ ] **האם יש קומפוננטה דומה?** (בדוק ברשימה למעלה)
- [ ] **אפשר להשתמש בקומפוננטה קיימת עם props?**
- [ ] **אפשר להרחיב קומפוננטה קיימת?**
- [ ] **TypeScript מלא** (interface Props)
- [ ] **תמיכה ב-i18n** (useTranslations)
- [ ] **תמיכה ב-RTL** (dir, ms/me)
- [ ] **שימוש ב-shadcn/ui** בלבד
- [ ] **Loading state** (<LoadingSpinner />)
- [ ] **Error state** (<ErrorDisplay />)
- [ ] **Empty state** (אם רלוונטי)

---

## 🚀 תהליך עבודה מומלץ

### 1. לפני פיתוח
```bash
# חפש קומפוננטה דומה
grep -r "BankDetails" src/components/
grep -r "Payment" src/components/
```

### 2. בזמן פיתוח
```tsx
// ✅ נכון - שימוש בקומפוננטה קיימת
import { BankDetailsForm } from '@/components/shared/BankDetailsForm';

// ❌ לא נכון - יצירת קומפוננטה חדשה
function BankDetailsInput() { /* ... */ }
```

### 3. אחרי פיתוח
- [ ] בדוק שאין קוד כפול
- [ ] בדוק ש-import מקומפוננטות משותפות
- [ ] בדוק RTL
- [ ] בדוק תרגום

---

## 📚 קבצי עזר למסמך זה

### מסמכים קשורים:
1. `SPECIFICATION.md` - אפיון כללי
2. `SICK_CHILDREN_DETAILED_SPEC.md` - אפיון מפורט
3. `SICK_CHILDREN_DEVELOPMENT_PHASES.md` - שלבי פיתוח
4. `AI_DEVELOPMENT_GUIDE.md` - מדריך מלא (ארוך)

### קבצי קוד חשובים:
```
src/components/shared/
├── CaseHeader/CaseHeader.tsx           ← תומך בילדים חולים!
├── CaseSummary/CaseSummary.tsx         ← תומך בילדים חולים!
├── BankDetailsForm/BankDetailsForm.tsx ← שימוש ישיר
├── PaymentHistoryTable/                 ← שימוש ישיר
├── FormSection/FormSection.tsx         ← טפסים
├── FormField/FormField.tsx             ← עריכה inline
├── DataTable/DataTable.tsx             ← טבלאות
├── FileUpload/FileUpload.tsx           ← העלאת קבצים
├── StatusBadge/StatusBadge.tsx         ← סטטוס
└── ExportDocument/ExportDocument.tsx   ← PDF
```

---

## 💡 טיפים אחרונים

### 1. לפני שיוצרים קומפוננטה
**שאל:** "האם יש משהו דומה בחתונות?"

### 2. אם יוצרים קומפוננטה חדשה
**שאל:** "האם אפשר להשתמש בזה גם במקומות אחרים?"
→ אם כן, שים ב-`shared/`

### 3. אם משנים קומפוננטה משותפת
**שאל:** "האם זה ישבור משהו אחר?"
→ בדוק שימושים: `grep -r "ComponentName" src/`

### 4. בעיות נפוצות
- **Styling לא עובד ב-RTL** → השתמש ב-`ms`/`me` במקום `ml`/`mr`
- **תרגום חסר** → הוסף ל-`messages/he.json` וגם ל-`messages/en.json`
- **TypeScript error** → בדוק ש-interface תואם ל-Props

---

## 🎯 סיכום - הכי חשוב!

### מה כבר יש:
✅ 90% מהקומפוננטות
✅ CaseHeader + CaseSummary תומכים בילדים חולים
✅ BankDetailsForm, FileUpload, PaymentHistoryTable
✅ כל shadcn/ui components
✅ Hooks: useDebounce, useExportPDF
✅ Utils: format, payment-format
✅ טופס ציבורי + validation

### מה צריך ליצור:
❌ MonthlyPaymentDialog (Dialog פשוט)
❌ CloseCaseDialog (AlertDialog פשוט)
❌ BulkPaymentEntryDialog (Dialog + Table)
❌ 3-4 API routes
⚙️ הרחבות קלות (FormRenderer, ApplicantsContent)

### העיקרון:
**אל תמציא את הגלגל מחדש!**

---

**גרסה:** 2.0 | **תאריך:** 16/11/2024 | **עודכן לאחרונה:** הוספת SOLID Principles + Best Practices
