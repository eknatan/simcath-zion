# מדריך פיתוח AI - מערכת תמיכה למשפחות

**תאריך:** אוקטובר 2025
**גרסה:** 2.0
**מטרה:** הנחיות מסודרות לפיתוח עם AI בדגש על ארכיטקטורה נקייה

---

## תוכן עניינים

1. [עקרונות פיתוח SOLID](#עקרונות-פיתוח-solid)
2. [תמיכה בעברית ואנגלית (RTL/i18n)](#תמיכה-בעברית-ואנגלית)
3. [Supabase - Database & Auth](#supabase-database--auth)
4. [ארכיטקטורה ומבנה תיקיות](#ארכיטקטורה-ומבנה-תיקיות)
5. [קומפוננטות משותפות](#קומפוננטות-משותפות)
6. [עקרונות עיצוב עם Shadcn/UI](#עקרונות-עיצוב-עם-shadcnui)
7. [ניהול State והקשרים (Contexts)](#ניהול-state-והקשרים)
8. [שלבי פיתוח מפורטים](#שלבי-פיתוח-מפורטים)
9. [כללי קוד ו-Best Practices](#כללי-קוד-ו-best-practices)

---

## עקרונות פיתוח SOLID

### S - Single Responsibility Principle
**כל קומפוננטה עושה דבר אחד בלבד**

```tsx
// ✅ קומפוננטה עם אחריות אחת ברורה
// components/wedding/WeddingDate.tsx
export function WeddingDate({ hebrewDate, gregorianDate }) {
  return (
    <div className="flex gap-2">
      <span>{hebrewDate}</span>
      <span>({gregorianDate})</span>
    </div>
  );
}
```

**למה זה חשוב:**
- קל לבדיקה
- קל לשימוש חוזר
- שינויים לא משפיעים על קוד אחר

---

### O - Open/Closed Principle
**פתוח להרחבה, סגור לשינוי**

```tsx
// ✅ DataTable גנרי שאפשר להרחיב ללא שינוי
// components/shared/DataTable.tsx
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ data, columns, onRowClick }: DataTableProps<T>) {
  // לוגיקת טבלה גנרית
}

// שימוש ספציפי - מרחיב ללא שינוי
export function WeddingCasesTable() {
  const columns = useMemo(() => createWeddingColumns(), []);
  return <DataTable data={cases} columns={columns} />;
}
```

---

### L - Liskov Substitution Principle
**קומפוננטות נגזרות הן תחליף מלא לבסיס**

```tsx
// ✅ SubmitButton הוא Button מיוחד - אפשר להחליף
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline';
}

export function SubmitButton(props: ButtonProps) {
  return <Button {...props} type="submit" />;
}
```

---

### I - Interface Segregation Principle
**ממשקים ספציפיים ולא ממשק אחד גדול**

```tsx
// ✅ ממשקים ממוקדים
interface CaseBase {
  id: string;
  case_number: number;
  status: string;
}

interface WeddingCase extends CaseBase {
  wedding_date_hebrew: string;
  groom_first_name: string;
  bride_first_name: string;
}

interface CleaningCase extends CaseBase {
  family_name: string;
  child_name: string;
  monthly_amount: number;
}
```

---

### D - Dependency Inversion Principle
**תלוי באבסטרקציות, לא במימושים**

```tsx
// ✅ הגדרת ממשק
export interface ICaseService {
  getCases(filters: CaseFilters): Promise<Case[]>;
  updateCase(id: string, data: Partial<Case>): Promise<Case>;
}

// מימוש
export class SupabaseCaseService implements ICaseService {
  async getCases(filters: CaseFilters) {
    return supabase.from('cases').select('*').match(filters);
  }
}

// שימוש בממשק, לא במימוש ספציפי
export function CaseList({ caseService }: { caseService: ICaseService }) {
  const cases = await caseService.getCases();
}
```

---

## תמיכה בעברית ואנגלית

### דרישה: המערכת חייבת לתמוך ב-2 שפות

- **עברית** - שפת ברירת מחדל (RTL)
- **אנגלית** - לתרומות בינלאומיות (LTR)

### ספרייה: next-intl

```bash
npm install next-intl
```

### מבנה תיקיות תרגומים

```
├── messages/
│   ├── he.json      # עברית
│   └── en.json      # אנגלית
```

### דוגמת קובץ תרגום

**messages/he.json:**
```json
{
  "common": {
    "save": "שמור",
    "cancel": "בטל",
    "delete": "מחק",
    "edit": "ערוך",
    "loading": "טוען..."
  },
  "dashboard": {
    "title": "לוח בקרה",
    "stats": {
      "totalCases": "סה״כ תיקים",
      "pending": "ממתינים",
      "transferred": "הועברו"
    }
  },
  "cases": {
    "wedding": {
      "title": "תיקי חתונות",
      "groomName": "שם החתן",
      "brideName": "שם הכלה",
      "weddingDate": "תאריך החתונה"
    },
    "cleaning": {
      "title": "תיקי ילדים חולים",
      "familyName": "שם משפחה",
      "childName": "שם הילד"
    }
  },
  "validation": {
    "required": "שדה חובה",
    "invalidEmail": "כתובת מייל לא תקינה",
    "invalidPhone": "מספר טלפון לא תקין"
  }
}
```

**messages/en.json:**
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading..."
  },
  "dashboard": {
    "title": "Dashboard",
    "stats": {
      "totalCases": "Total Cases",
      "pending": "Pending",
      "transferred": "Transferred"
    }
  },
  // ... המשך בדומה
}
```

### התקנת next-intl

**1. קובץ: `i18n.ts`**
```typescript
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default
}));
```

**2. קובץ: `middleware.ts`**
```typescript
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['he', 'en'],
  defaultLocale: 'he',
  localePrefix: 'as-needed'
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

**3. עדכון: `next.config.js`**
```javascript
const withNextIntl = require('next-intl/plugin')('./i18n.ts');

module.exports = withNextIntl({
  // ... rest of config
});
```

**4. מבנה App Router עם שפות:**
```
app/
├── [locale]/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── cases/
│   │       └── wedding/
│   │           └── page.tsx
│   └── layout.tsx
```

### שימוש בקומפוננטות

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function WeddingCaseCard({ case }) {
  const t = useTranslations('cases.wedding');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{t('groomName')}: {case.groom_first_name}</p>
        <p>{t('brideName')}: {case.bride_first_name}</p>
      </CardContent>
    </Card>
  );
}
```

### מחליף שפה (Language Switcher)

```tsx
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant={locale === 'he' ? 'default' : 'outline'}
        onClick={() => switchLocale('he')}
        size="sm"
      >
        עברית
      </Button>
      <Button
        variant={locale === 'en' ? 'default' : 'outline'}
        onClick={() => switchLocale('en')}
        size="sm"
      >
        English
      </Button>
    </div>
  );
}
```

### תמיכה ב-RTL (Right-to-Left)

**tailwind.config.js:**
```javascript
module.exports = {
  plugins: [
    require('tailwindcss-rtl'),
  ],
}
```

**Layout עם תמיכה בכיוון:**
```tsx
import { getLocale } from 'next-intl/server';

export default async function LocaleLayout({ children }) {
  const locale = await getLocale();
  const dir = locale === 'he' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body className={locale === 'he' ? 'font-hebrew' : 'font-english'}>
        {children}
      </body>
    </html>
  );
}
```

**CSS לפי כיוון:**
```css
/* globals.css */
[dir="rtl"] .ml-4 {
  margin-left: 0;
  margin-right: 1rem;
}

[dir="rtl"] .text-left {
  text-align: right;
}
```

**או עם Tailwind:**
```tsx
<div className="ms-4 text-start">
  {/* ms = margin-start (שמאל ב-LTR, ימין ב-RTL) */}
  {/* text-start (שמאל ב-LTR, ימין ב-RTL) */}
</div>
```

### חשוב! קונבנציות תרגום

1. **תמיד השתמש במפתחות, לא בטקסט ישיר**
   ```tsx
   // ✅ נכון
   <Button>{t('common.save')}</Button>

   // ❌ לא נכון
   <Button>שמור</Button>
   ```

2. **שמות מפתחות בנויים היררכית**
   ```json
   {
     "section": {
       "subsection": {
         "key": "value"
       }
     }
   }
   ```

3. **ולידציה בשפה נכונה**
   ```tsx
   const schema = z.object({
     email: z.string().email(t('validation.invalidEmail'))
   });
   ```

---

## Supabase - Database & Auth

### למה Supabase?

1. ✅ **PostgreSQL מובנה** - בדיוק מה שצריך
2. ✅ **Auth מוכן** - Email/Password + OAuth
3. ✅ **Row Level Security (RLS)** - אבטחה ברמת השורה
4. ✅ **Storage** - קבצים (תמונות, PDF)
5. ✅ **Realtime** - עדכונים בזמן אמת (אופציונלי)
6. ✅ **חינמי עד 50K משתמשים**

### התקנה

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### הגדרת Supabase Client

**lib/supabase/client.ts:**
```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});
```

**lib/supabase/server.ts (Server Components):**
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export const createClient = () => {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
};
```

### מבנה Database (SQL)

**יצירת טבלאות ב-Supabase Dashboard → SQL Editor:**

```sql
-- Table: users (מנוהל ע"י Supabase Auth אוטומטית)
-- נוסיף רק שדות מותאמים ב-public.profiles

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'secretary',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Table: applicants
CREATE TABLE public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_type VARCHAR(50) NOT NULL CHECK (case_type IN ('wedding', 'cleaning')),
  form_data JSONB NOT NULL,
  email_sent_to_secretary BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: cases
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number BIGSERIAL UNIQUE,
  case_type VARCHAR(50) NOT NULL CHECK (case_type IN ('wedding', 'cleaning')),
  applicant_id UUID REFERENCES public.applicants(id),
  created_by UUID REFERENCES auth.users(id),
  status VARCHAR(50) NOT NULL,

  -- Wedding fields
  wedding_date_hebrew VARCHAR(100),
  wedding_date_gregorian DATE,
  groom_first_name VARCHAR(100),
  groom_last_name VARCHAR(100),
  groom_id VARCHAR(20),
  bride_first_name VARCHAR(100),
  bride_last_name VARCHAR(100),
  bride_id VARCHAR(20),
  venue VARCHAR(255),
  guests_count INTEGER,
  total_cost NUMERIC(10, 2),

  -- Cleaning fields
  family_name VARCHAR(100),
  child_name VARCHAR(100),
  parent1_id VARCHAR(20),
  parent1_name VARCHAR(100),
  parent2_id VARCHAR(20),
  parent2_name VARCHAR(100),
  start_date DATE,
  end_date DATE,
  end_reason VARCHAR(100),

  -- Common fields
  address TEXT,
  city VARCHAR(100),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  raw_form_json JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX cases_case_type_idx ON public.cases(case_type);
CREATE INDEX cases_status_idx ON public.cases(status);
CREATE INDEX cases_wedding_date_idx ON public.cases(wedding_date_gregorian);

-- RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all cases"
  ON public.cases FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert cases"
  ON public.cases FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Table: translations
CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  lang_from VARCHAR(5) DEFAULT 'he',
  lang_to VARCHAR(5) NOT NULL,
  content_json JSONB NOT NULL,
  edited_by_user BOOLEAN DEFAULT FALSE,
  translated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: files
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  file_type VARCHAR(50) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  path_or_url TEXT NOT NULL,
  size_bytes INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: bank_details
CREATE TABLE public.bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  bank_number VARCHAR(10) NOT NULL,
  branch VARCHAR(10) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  payment_type VARCHAR(50) NOT NULL,
  payment_month DATE,
  amount_usd NUMERIC(10, 2),
  amount_ils NUMERIC(10, 2) NOT NULL,
  exchange_rate NUMERIC(10, 4),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  approved_amount NUMERIC(10, 2),
  approved_by UUID REFERENCES auth.users(id),
  transferred_at TIMESTAMP WITH TIME ZONE,
  receipt_reference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: transfers_export
CREATE TABLE public.transfers_export (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type VARCHAR(50) NOT NULL,
  exported_by UUID REFERENCES auth.users(id),
  exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  filename VARCHAR(255),
  file_url TEXT,
  cases_included JSONB,
  total_amount NUMERIC(10, 2),
  total_count INTEGER
);

-- Table: case_history (audit log)
CREATE TABLE public.case_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: email_logs
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  email_type VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'sent'
);
```

### ייצור TypeScript Types מ-Database

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

### Authentication עם Supabase

**lib/auth/AuthContext.tsx:**
```tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### שימוש ב-Supabase בקומפוננטות

```tsx
// Client Component
'use client';

import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function CaseList() {
  const [cases, setCases] = useState([]);

  useEffect(() => {
    async function fetchCases() {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('case_type', 'wedding');

      if (!error) setCases(data);
    }
    fetchCases();
  }, []);

  return <div>{/* render cases */}</div>;
}
```

```tsx
// Server Component
import { createClient } from '@/lib/supabase/server';

export default async function CasesPage() {
  const supabase = createClient();
  const { data: cases } = await supabase
    .from('cases')
    .select('*')
    .eq('case_type', 'wedding');

  return <div>{/* render cases */}</div>;
}
```

### Supabase Storage - קבצים

```typescript
// העלאת קובץ
const uploadFile = async (file: File, caseId: string) => {
  const fileName = `${caseId}/${Date.now()}_${file.name}`;

  const { data, error } = await supabase.storage
    .from('case-files')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // קבלת URL ציבורי
  const { data: { publicUrl } } = supabase.storage
    .from('case-files')
    .getPublicUrl(fileName);

  return publicUrl;
};
```

---

## ארכיטקטורה ומבנה תיקיות

### מבנה תיקיות מומלץ

```
src/
├── app/
│   ├── [locale]/                 # i18n routes
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── cases/
│   │   │   │   ├── wedding/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── _components/
│   │   │   │   └── cleaning/
│   │   │   ├── calendar/
│   │   │   ├── transfers/
│   │   │   └── applicants/
│   │   │
│   │   └── public-forms/
│   │       ├── wedding/
│   │       └── cleaning/
│   │
│   └── api/
│       ├── auth/
│       ├── cases/
│       ├── payments/
│       └── transfers/
│
├── components/
│   ├── ui/                       # shadcn/ui
│   ├── shared/                   # Business shared
│   │   ├── DataTable/
│   │   ├── Forms/
│   │   ├── StatusBadge/
│   │   ├── FileUpload/
│   │   ├── CurrencyConverter/
│   │   └── HebrewCalendar/
│   ├── layout/
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   └── LanguageSwitcher/
│   └── features/
│       ├── cases/
│       ├── payments/
│       └── applicants/
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── services/
│   ├── hooks/
│   └── utils/
│
├── contexts/
│   └── AuthContext.tsx
│
├── types/
│   ├── supabase.ts              # Auto-generated
│   ├── case.types.ts
│   └── payment.types.ts
│
├── messages/                     # i18n
│   ├── he.json
│   └── en.json
│
└── config/
    └── site.config.ts
```

---

## קומפוננטות משותפות

### 1. DataTable

**components/shared/DataTable/DataTable.tsx:**
```tsx
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  isLoading = false
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={onRowClick ? 'cursor-pointer hover:bg-muted' : ''}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                אין תוצאות
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

### 2. FormField

**components/shared/Forms/FormField.tsx:**
```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
  helperText?: string;
}

export function FormField({
  label,
  error,
  required,
  helperText,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={props.id}>
        {label}
        {required && <span className="text-destructive ms-1">*</span>}
      </Label>
      <Input
        {...props}
        className={cn(error && 'border-destructive')}
        aria-invalid={!!error}
      />
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
```

---

### 3. StatusBadge

**components/shared/StatusBadge/StatusBadge.tsx:**
```tsx
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

const STATUS_VARIANTS = {
  new: 'default',
  pending_transfer: 'secondary',
  transferred: 'success',
  rejected: 'destructive',
  expired: 'outline',
  active: 'success',
  inactive: 'secondary',
} as const;

interface StatusBadgeProps {
  status: keyof typeof STATUS_VARIANTS;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('status');

  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      {t(status)}
    </Badge>
  );
}
```

---

### 4. FileUpload

**components/shared/FileUpload/FileUpload.tsx:**
```tsx
'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxSize?: number; // MB
  accept?: Record<string, string[]>;
  multiple?: boolean;
}

export function FileUpload({
  onFilesSelected,
  maxSize = 5,
  accept = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/pdf': ['.pdf']
  },
  multiple = false,
}: FileUploadProps) {
  const t = useTranslations('common');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    maxSize: maxSize * 1024 * 1024,
    accept,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      )}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-sm text-muted-foreground">
        {isDragActive ? t('dropHere') : t('dragOrClick')}
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        {t('maxSize', { size: maxSize })}
      </p>
    </div>
  );
}
```

---

### 5. CurrencyConverter

**components/shared/CurrencyConverter/CurrencyConverter.tsx:**
```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CurrencyConverterProps {
  onConvert: (ilsAmount: number, rate: number) => void;
}

export function CurrencyConverter({ onConvert }: CurrencyConverterProps) {
  const t = useTranslations('payments');
  const [usdAmount, setUsdAmount] = useState('');
  const [rate, setRate] = useState('');
  const [ilsAmount, setIlsAmount] = useState('');

  const handleFetchRate = async () => {
    // TODO: API call to get exchange rate
    const currentRate = 3.7;
    setRate(currentRate.toString());
    if (usdAmount) {
      const calculated = parseFloat(usdAmount) * currentRate;
      setIlsAmount(calculated.toFixed(2));
    }
  };

  const handleConvert = () => {
    if (usdAmount && rate) {
      const calculated = parseFloat(usdAmount) * parseFloat(rate);
      setIlsAmount(calculated.toFixed(2));
      onConvert(calculated, parseFloat(rate));
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div>
        <Label>{t('usdAmount')}</Label>
        <Input
          type="number"
          value={usdAmount}
          onChange={(e) => setUsdAmount(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label>{t('exchangeRate')}</Label>
          <Input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        <Button onClick={handleFetchRate} variant="outline" className="mt-8">
          {t('updateRate')}
        </Button>
      </div>
      <ArrowDown className="mx-auto h-6 w-6" />
      <div>
        <Label>{t('ilsAmount')}</Label>
        <Input type="number" value={ilsAmount} readOnly className="bg-muted" />
      </div>
      <Button onClick={handleConvert} className="w-full">
        {t('convert')}
      </Button>
    </div>
  );
}
```

---

## עקרונות עיצוב עם Shadcn/UI

### התקנה

```bash
npx shadcn-ui@latest init
```

**תצורה:**
- Style: Default
- Base color: Slate
- CSS variables: Yes
- RTL support: Yes

### רשימת קומפוננטות נדרשות

```bash
npx shadcn-ui@latest add button input label card badge
npx shadcn-ui@latest add form select textarea checkbox
npx shadcn-ui@latest add tabs dialog table toast
npx shadcn-ui@latest add calendar dropdown-menu sheet
npx shadcn-ui@latest add avatar alert progress
```

### כללי שימוש

1. **תמיד השתמש בקומפוננטות shadcn**
2. **התאמה דרך className בלבד**
3. **צור variants במקום קומפוננטות חדשות**

---

## ניהול State והקשרים

### AuthContext

**contexts/AuthContext.tsx** - ראה למעלה בסעיף Supabase

### NotificationContext

```tsx
'use client';

import { createContext, useContext } from 'react';
import { toast } from 'sonner';

interface NotificationContextType {
  success: (message: string) => void;
  error: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  return (
    <NotificationContext.Provider value={{
      success: (msg) => toast.success(msg),
      error: (msg) => toast.error(msg),
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};
```

### Custom Hooks

**lib/hooks/useCases.ts:**
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function useCases(filters?: { case_type?: string; status?: string }) {
  return useQuery({
    queryKey: ['cases', filters],
    queryFn: async () => {
      let query = supabase.from('cases').select('*');

      if (filters?.case_type) {
        query = query.eq('case_type', filters.case_type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: updated, error } = await supabase
        .from('cases')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}
```

---

## שלבי פיתוח מפורטים

### Phase 1: Setup (שבוע 1)

#### טאסק ל-AI:

```
צור פרויקט Next.js חדש עם:

1. התקנה:
npm create next-app@latest . --typescript --tailwind --app --src-dir
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @tanstack/react-query axios zod
npm install next-intl
npm install @hebcal/core
npm install react-dropzone
npm install sonner

2. התקנת shadcn:
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label card badge form select textarea tabs dialog table toast calendar

3. צור מבנה תיקיות:
src/app/[locale]/
src/components/ui/
src/components/shared/
src/lib/supabase/
src/contexts/
src/types/
messages/

4. קבצי config:
- .env.local (עם Supabase keys)
- i18n.ts
- middleware.ts (next-intl)
- tailwind.config.js (עם RTL)

5. קבצי תרגום בסיסיים:
messages/he.json
messages/en.json
```

---

### Phase 2: Database & Auth (שבוע 1-2)

#### טאסק ל-AI:

```
1. התחבר ל-Supabase:
- צור lib/supabase/client.ts
- צור lib/supabase/server.ts

2. הרץ SQL (בעתק מסעיף Supabase למעלה):
- כל הטבלאות
- RLS policies
- Indexes

3. ייצר types:
npx supabase gen types typescript --project-id XXX > types/supabase.ts

4. צור AuthContext:
contexts/AuthContext.tsx

5. צור דף login:
app/[locale]/(auth)/login/page.tsx
עם shadcn Form + Supabase Auth

6. Middleware להגנה:
middleware.ts (בדיקת session)
```

---

### Phase 3: קומפוננטות משותפות (שבוע 2)

#### טאסק ל-AI:

```
צור את הקומפוננטות המשותפות (העתק מהמסמך):

1. components/shared/DataTable/DataTable.tsx
2. components/shared/Forms/FormField.tsx
3. components/shared/StatusBadge/StatusBadge.tsx
4. components/shared/FileUpload/FileUpload.tsx
5. components/shared/CurrencyConverter/CurrencyConverter.tsx

כל קומפוננטה עם:
- TypeScript מלא
- תמיכה ב-i18n (useTranslations)
- shadcn/ui components
- תמיכה ב-RTL
```

---

### Phase 4: Layout (שבוע 2)

#### טאסק ל-AI:

```
צור layout מלא:

1. components/layout/Header/Header.tsx:
- לוגו
- LanguageSwitcher
- שם משתמש
- כפתור logout

2. components/layout/Sidebar/Sidebar.tsx:
- תפריט עם קישורים
- collapsible
- responsive (mobile menu)

3. app/[locale]/(dashboard)/layout.tsx:
- Grid: Header + Sidebar + Content
- AuthProvider wrapper
- ReactQuery wrapper

4. components/layout/LanguageSwitcher/LanguageSwitcher.tsx:
- מחליף בין עברית/אנגלית
```

---

### Phase 5: טופס חתונה חיצוני (שבוע 3)

#### טאסק ל-AI:

```
צור טופס חיצוני לחתונות:

1. app/[locale]/public-forms/wedding/page.tsx
- כל השדות מהמפרט (SPECIFICATION.md סעיף 2.1)
- react-hook-form + zod
- שימוש ב-FormField משותף
- חלוקה ל-3 סקשנים

2. lib/validation/wedding-form.schema.ts:
- Zod schema עם כל הולידציות
- תרגום errors ב-i18n

3. app/api/applicants/route.ts:
- POST endpoint
- שמירה ב-Supabase
- שליחת מייל למזכירות

4. עיצוב:
- responsive
- progress bar
- loading states
```

---

### Phase 6: ניהול בקשות (שבוע 3)

#### טאסק ל-AI:

```
צור מסך ניהול בקשות:

1. app/[locale]/(dashboard)/applicants/page.tsx:
- DataTable עם בקשות
- כפתורי אישור/דחייה
- סינונים

2. Dialog לאישור:
- סיכום הבקשה
- כפתור "פתח תיק"

3. API:
- GET /api/applicants
- POST /api/applicants/[id]/approve
- POST /api/applicants/[id]/reject

4. lib/hooks/useApplicants.ts
```

---

### Phase 7-10: המשך...

הפאזות הנותרות זהות למסמך המקורי, רק עם עדכונים:
- שימוש ב-Supabase במקום Prisma
- i18n בכל קומפוננטה
- RTL support

---

## כללי קוד ו-Best Practices

### TypeScript Strict

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### קונבנציות שמות

```typescript
// Components: PascalCase
export function WeddingCaseCard() {}

// Files: kebab-case.tsx
// wedding-case-card.tsx

// Functions: camelCase
function calculateTotal() {}

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5;
```

### ארגון Imports

```typescript
// 1. React & Next
import { useState } from 'react';
import { useTranslations } from 'next-intl';

// 2. External
import { useQuery } from '@tanstack/react-query';

// 3. Internal
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';

// 4. Types
import type { Case } from '@/types/supabase';
```

### Error Handling

```typescript
async function updateCase(id: string, data: any) {
  try {
    const { data: updated, error } = await supabase
      .from('cases')
      .update(data)
      .eq('id', id)
      .single();

    if (error) throw error;
    return updated;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

### Loading States

```typescript
function CaseList() {
  const { data, isLoading, isError } = useCases();

  if (isLoading) return <Skeleton />;
  if (isError) return <ErrorMessage />;
  if (!data?.length) return <EmptyState />;

  return <DataTable data={data} />;
}
```

---

## Checklist לכל קומפוננטה

- [ ] TypeScript מלא
- [ ] Props interface
- [ ] שימוש ב-shadcn/ui
- [ ] תמיכה ב-i18n (useTranslations)
- [ ] תמיכה ב-RTL
- [ ] Responsive
- [ ] Loading state
- [ ] Error state
- [ ] Empty state
- [ ] Accessibility

---

## סיכום - חובה ל-AI

### דברים שחייבים:

1. ✅ שימוש ב-Supabase לכל DB operations
2. ✅ i18n בכל טקסט (useTranslations)
3. ✅ RTL/LTR support (dir attribute)
4. ✅ shadcn/ui בלבד
5. ✅ TypeScript מלא
6. ✅ Custom hooks לכל לוגיקה
7. ✅ Error handling + toast
8. ✅ Loading states

### דברים שאסור:

1. ❌ טקסט ישיר ללא תרגום
2. ❌ Prisma או ORM אחר (רק Supabase)
3. ❌ שכפול קוד
4. ❌ any types
5. ❌ inline styles
6. ❌ לשכוח RTL

---

## תבנית בקשה ל-AI

```
צור [שם הפיצ'ר].

דרישות:
1. עקוב אחרי AI_DEVELOPMENT_GUIDE.md
2. Supabase לכל DB
3. i18n לכל טקסט
4. RTL support
5. shadcn/ui components
6. TypeScript מלא
7. Error handling

קבצים:
- [רשימה]
```

---

**סוף המדריך**

**גרסה:** 2.0 (עודכן עם i18n + Supabase + RTL)
**תאריך:** אוקטובר 2025
