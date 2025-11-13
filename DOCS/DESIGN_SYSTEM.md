# 🎨 מערכת עיצוב - Family Support System

**תאריך עדכון:** 2025-10-28
**סטטוס:** מסמך מחייב לכל הפיתוח
**גרסה:** 2.0 - Version B (Elegant & Soft) ⭐

---

## 📋 תוכן עניינים

1. [עקרונות עיצוב](#עקרונות-עיצוב)
2. [פלטת צבעים](#פלטת-צבעים)
3. [טיפוגרפיה](#טיפוגרפיה)
4. [מרווחים](#מרווחים)
5. [רדיוסים](#רדיוסים)
6. [צללים](#צללים)
7. [רכיבי UI](#רכיבי-ui)
8. [נגישות](#נגישות)
9. [דוגמאות קוד](#דוגמאות-קוד)

---

## 🎯 עקרונות עיצוב

### העקרונות המנחים למערכת:

1. **מקצועיות** - המערכת משרתת ארגון צדקה ומשרדים, חייבת להיראות אמינה ורצינית
2. **בהירות** - כל אלמנט חייב להיות ברור ונגיש, גם למשתמשים שאינם טכנולוגים
3. **עומק ויזואלי** - שימוש בגרדיאנטים, צללים ואפקטים ליצירת עומק
4. **עקביות** - שימוש חוזר באותם צבעים, מרווחים וסגנונות
5. **נגישות** - ניגודיות גבוהה, תמיכה ב-RTL, קריאות מעולה

---

## 🎨 פלטת צבעים

### גרסה B - אלגנטי ורך (נבחרה) ⭐

#### צבעים עיקריים (Primary Colors)

```css
/* כחול רך ומקצועי - צבע המותג */
--primary-50: oklch(0.98 0.01 230);
--primary-100: oklch(0.95 0.02 230);
--primary-200: oklch(0.88 0.05 230);
--primary-300: oklch(0.78 0.08 230);
--primary-400: oklch(0.65 0.12 230);
--primary-500: oklch(0.55 0.14 230); /* עיקרי */
--primary-600: oklch(0.50 0.15 230);
--primary-700: oklch(0.43 0.13 230);
--primary-800: oklch(0.35 0.10 230);
--primary-900: oklch(0.28 0.08 230);
```

**שימוש:**
- כפתורים ראשיים
- לינקים
- אייקונים פעילים
- הדגשות חשובות

#### צבעי סטטוס (Status Colors)

```css
/* Success - ירוק עדין */
--success-50: oklch(0.97 0.01 150);
--success-100: oklch(0.93 0.04 150);
--success-500: oklch(0.62 0.14 150); /* עיקרי */
--success-600: oklch(0.56 0.15 150);
--success-700: oklch(0.48 0.13 150);

/* Warning - כתום רך */
--warning-50: oklch(0.98 0.01 75);
--warning-100: oklch(0.94 0.04 75);
--warning-500: oklch(0.72 0.12 75); /* עיקרי */
--warning-600: oklch(0.65 0.13 75);
--warning-700: oklch(0.58 0.12 75);

/* Error/Destructive - אדום עדין */
--error-50: oklch(0.97 0.02 20);
--error-100: oklch(0.93 0.05 20);
--error-500: oklch(0.58 0.18 20); /* עיקרי */
--error-600: oklch(0.52 0.19 20);
--error-700: oklch(0.45 0.17 20);

/* Info - אינדיגו רך */
--info-50: oklch(0.97 0.01 255);
--info-100: oklch(0.93 0.03 255);
--info-500: oklch(0.58 0.14 255); /* עיקרי */
--info-600: oklch(0.52 0.15 255);
--info-700: oklch(0.45 0.13 255);
```

**שימוש:**
- Success: תיקים מאושרים, פעולות שהושלמו
- Warning: תיקים ממתינים, התראות
- Error: שגיאות, מחיקות, תיקים נדחים
- Info: מידע כללי, הודעות מערכת

#### צבעי רקע וטקסט

```css
/* Light Mode */
--background: oklch(0.98 0.01 230); /* לבן חם מעט */
--foreground: oklch(0.20 0.01 230); /* שחור עם גוון כחול עדין */

--card: oklch(1 0 0); /* לבן נקי */
--card-foreground: oklch(0.20 0.01 230);

--muted: oklch(0.96 0.01 230); /* רקע עדין */
--muted-foreground: oklch(0.50 0.01 230); /* טקסט משני */

--border: oklch(0.88 0.01 230);
--input: oklch(0.88 0.01 230);

/* Dark Mode */
.dark {
  --background: oklch(0.18 0.01 230);
  --foreground: oklch(0.98 0 0);

  --card: oklch(0.22 0.01 230);
  --card-foreground: oklch(0.98 0 0);

  --muted: oklch(0.26 0.01 230);
  --muted-foreground: oklch(0.65 0.01 230);

  --border: oklch(0.30 0.01 230);
  --input: oklch(0.30 0.01 230);
}
```

#### צבעי גרפים (Charts)

```css
--chart-1: oklch(0.55 0.14 230); /* כחול רך */
--chart-2: oklch(0.62 0.14 150); /* ירוק עדין */
--chart-3: oklch(0.72 0.12 75);  /* כתום רך */
--chart-4: oklch(0.58 0.14 255); /* אינדיגו */
--chart-5: oklch(0.58 0.18 20);  /* אדום עדין */
```

---

## 📝 טיפוגרפיה

### פונטים

```typescript
// משתמשים ב-Geist Sans (ברירת מחדל של shadcn/ui)
const fontFamily = {
  sans: 'var(--font-geist-sans)',
  mono: 'var(--font-geist-mono)',
};
```

### גדלים ומשקלים

```typescript
// כותרות (Headings)
const headings = {
  h1: {
    fontSize: '2.25rem',    // 36px
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '1.875rem',   // 30px
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '1.5rem',     // 24px
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.25rem',    // 20px
    fontWeight: 600,
    lineHeight: 1.5,
  },
};

// טקסט גוף (Body)
const body = {
  large: {
    fontSize: '1.125rem',   // 18px
    fontWeight: 400,
    lineHeight: 1.7,
  },
  base: {
    fontSize: '1rem',       // 16px
    fontWeight: 400,
    lineHeight: 1.6,
  },
  small: {
    fontSize: '0.875rem',   // 14px
    fontWeight: 400,
    lineHeight: 1.5,
  },
  xs: {
    fontSize: '0.75rem',    // 12px
    fontWeight: 400,
    lineHeight: 1.4,
  },
};

// טקסט חזק (Emphasized)
const emphasized = {
  fontWeight: 600,
};
```

### דוגמה לשימוש

```tsx
// כותרת ראשית
<h1 className="text-4xl font-bold tracking-tight">
  כותרת ראשית
</h1>

// כותרת משנית
<h2 className="text-3xl font-bold">
  כותרת משנית
</h2>

// טקסט רגיל
<p className="text-base text-muted-foreground">
  טקסט רגיל עם צבע משני
</p>

// טקסט קטן
<p className="text-sm text-muted-foreground">
  טקסט קטן למידע נוסף
</p>
```

---

## 📏 מרווחים (Spacing)

### מערכת מרווחים מבוססת 4px

```typescript
const spacing = {
  0: '0',
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
};
```

### שימושים נפוצים

```tsx
// רווח בין רכיבים בדף
<div className="space-y-6">        {/* 24px */}

// padding בכרטיס
<Card className="p-6">             {/* 24px */}

// רווח בין אלמנטים קטנים
<div className="gap-2">            {/* 8px */}

// רווח בין כפתורים
<div className="gap-3">            {/* 12px */}

// margin למיכל ראשי
<main className="container py-6 px-4">  {/* 24px top/bottom, 16px sides */}
```

---

## ⭕ רדיוסים (Border Radius)

### ערכים מוגדרים

```typescript
const borderRadius = {
  sm: '0.25rem',      // 4px  - badges, chips
  md: '0.5rem',       // 8px  - buttons, inputs
  lg: '0.75rem',      // 12px - cards
  xl: '1rem',         // 16px - modals, large containers
  '2xl': '1.5rem',    // 24px - hero sections
  full: '9999px',     // עיגול מלא - avatars, pills
};
```

### שימוש

```tsx
// כפתור רגיל
<Button className="rounded-md">  {/* 8px */}

// כרטיס
<Card className="rounded-lg">    {/* 12px */}

// אווטאר
<Avatar className="rounded-full">  {/* עיגול מלא */}

// badge
<Badge className="rounded-sm">   {/* 4px */}
```

---

## 🌑 צללים (Shadows)

### רמות צללים

```css
/* Subtle - לאלמנטים שקטים */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);

/* Medium - לכרטיסים רגילים */
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1),
             0 2px 4px -2px rgb(0 0 0 / 0.1);

/* Large - לכרטיסים מורמים */
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1),
             0 4px 6px -4px rgb(0 0 0 / 0.1);

/* Extra Large - למודלים */
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1),
             0 8px 10px -6px rgb(0 0 0 / 0.1);

/* Colored Shadow - לאפקטים מיוחדים */
--shadow-primary: 0 8px 16px -4px rgb(37 99 235 / 0.3);
--shadow-success: 0 8px 16px -4px rgb(34 197 94 / 0.3);
```

### שימוש

```tsx
// כרטיס רגיל
<Card className="shadow-md">

// כרטיס מורם (hover)
<Card className="shadow-lg hover:shadow-xl transition-shadow">

// כפתור ראשי עם צל צבעוני
<Button className="shadow-md shadow-primary/50">
```

---

## 🧩 רכיבי UI

### Cards (כרטיסים)

#### גרסה רגילה (Version B)

```tsx
<Card className="shadow-md border border-slate-200">
  <CardHeader>
    <CardTitle>כותרת הכרטיס</CardTitle>
    <CardDescription>תיאור קצר</CardDescription>
  </CardHeader>
  <CardContent>
    תוכן הכרטיס
  </CardContent>
</Card>
```

#### גרסה עם גרדיאנט עדין (Stat Card - Version B)

```tsx
<Card className="relative overflow-hidden border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
    <CardTitle className="text-sm font-semibold text-blue-900">
      כותרת
    </CardTitle>
    <div className="h-11 w-11 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
      <Icon className="h-6 w-6 text-blue-600" />
    </div>
  </CardHeader>
  <CardContent className="relative">
    <div className="text-3xl font-bold text-blue-900">248</div>
    <p className="text-xs text-blue-600 mt-1">מידע נוסף</p>
  </CardContent>
</Card>
```

### Buttons (כפתורים) - **חדש!** שימוש ב-ActionButton

**⚠️ חשוב:** במקום להשתמש ישירות ב-`Button` עם classes ידניים, השתמש ב-`ActionButton` המשותף!

#### ActionButton - רכיב משותף למערכת

```tsx
import { ActionButton } from '@/components/shared/ActionButton';
```

#### Variants זמינים:

##### 1. כפתורי Outline (לשימוש ברשימות/טבלאות) - **גרסה B: עדין ומאטי**

```tsx
// צפייה - אפור עדין (slate)
<ActionButton variant="view" size="sm">
  <Eye className="h-4 w-4 me-1" />
  צפה
</ActionButton>

// אישור - ירוק רך (emerald)
<ActionButton variant="approve" size="sm">
  <CheckCircle2 className="h-4 w-4 me-1" />
  אשר
</ActionButton>

// דחייה - אדום רך (rose)
<ActionButton variant="reject" size="sm">
  <XCircle className="h-4 w-4 me-1" />
  דחה
</ActionButton>

// שחזור - כחול רך (sky)
<ActionButton variant="restore" size="sm">
  <RotateCcw className="h-4 w-4 me-1" />
  שחזר
</ActionButton>

// ביטול - אפור עדין (slate)
<ActionButton variant="cancel">
  <X className="h-4 w-4 me-2" />
  ביטול
</ActionButton>
```

**סגנון:**
- `border-slate-300` (לא `border-2`) - גבולות עדינים ודקים
- צבעי טקסט `text-*-700` - לא בהירים מדי, לא כהים מדי
- hover: `hover:bg-*-50` - רקע עדין בהובר
- **ללא shadow-lg** - רק shadow-sm או בכלל בלי

##### 2. כפתורי Primary (לשימוש בדיאלוגים - עם רקע) - **גרסה B: מאטי**

```tsx
// אישור ראשי - ירוק רך (emerald)
<ActionButton variant="approve-primary">
  <CheckCircle2 className="h-4 w-4 me-2" />
  אשר
</ActionButton>

// דחייה ראשית - אדום רך (rose)
<ActionButton variant="reject-primary">
  <XCircle className="h-4 w-4 me-2" />
  דחה
</ActionButton>

// שחזור ראשי - כחול רך (sky)
<ActionButton variant="restore-primary">
  <RotateCcw className="h-4 w-4 me-2" />
  שחזר
</ActionButton>

// כפתור ראשי רגיל - כחול רך (sky)
<ActionButton variant="primary">
  שמור
</ActionButton>
```

**סגנון:**
- `bg-emerald-600` / `bg-rose-600` / `bg-sky-600` - צבעים רכים יותר
- `shadow-sm` בלבד - ללא shadow-lg או shadow-xl
- מאטי, לא מבריק

#### ✅ יתרונות ActionButton:

1. **שליטה מרכזית** - העיצוב מוגדר במקום אחד (`ActionButton.tsx`)
2. **התאמה אוטומטית** - משתמש ב-`ActiveDesignTokens` לגרסה הפעילה
3. **עקביות** - כל הכפתורים במערכת נראים אותו דבר
4. **קל לתחזוקה** - שינוי עיצוב במקום אחד משפיע על כל המערכת

#### 🎨 עיצוב גרסה B - Soft & Matte:

**פילוסופיה:**
- צבעים **עדינים** (emerald, rose, sky, slate) במקום חזקים (green, red, blue)
- גבולות **דקים** (`border` לא `border-2`)
- צללים **מינימליים** (`shadow-sm` לא `shadow-lg`)
- סגנון **מאטי** - ללא ברק, עדין לעין
- **פחות צבעוני** - יותר מקצועי ורגוע

### Badges (תגיות - Version B)

```tsx
// Primary
<Badge className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 font-medium">
  חדש
</Badge>

// Success
<Badge className="bg-green-100 text-green-700 border border-green-200 px-3 py-1 font-medium">
  אושר
</Badge>

// Warning
<Badge className="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 font-medium">
  ממתין
</Badge>

// Error
<Badge className="bg-red-100 text-red-700 border border-red-200 px-3 py-1 font-medium">
  דחוף
</Badge>

// Info
<Badge className="bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1 font-medium">
  VIP
</Badge>
```

### Icons (אייקונים - Version B)

```tsx
// אייקון בכרטיס Stat (Version B)
<div className="h-11 w-11 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
  <FileText className="h-6 w-6 text-blue-600" />
</div>

// אייקון בטקסט
<p className="text-xs text-blue-600 flex items-center gap-1">
  <TrendingUp className="h-3 w-3" />
  +12% מהחודש שעבר
</p>

// אייקון בכפתור
<Button>
  <Heart className="h-4 w-4 me-2" />
  טקסט
</Button>
```

---

## ♿ נגישות (Accessibility)

### עקרונות נגישות מחייבים

1. **ניגודיות מינימלית**
   - טקסט רגיל: יחס של 4.5:1 לפחות
   - טקסט גדול (18px+): יחס של 3:1 לפחות
   - אלמנטים אינטראקטיביים: 3:1 לפחות

2. **תמיכה ב-RTL**
   ```tsx
   // כל רכיב צריך לתמוך ב-RTL
   <div className={cn(
     locale === 'he' ? 'text-end' : 'text-start'
   )}>
   ```

3. **Focus States**
   ```tsx
   // כל אלמנט אינטראקטיבי צריך focus state ברור
   <Button className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
   ```

4. **ARIA Labels**
   ```tsx
   // כפתורים ללא טקסט חייבים aria-label
   <Button variant="ghost" size="icon" aria-label="סגור">
     <X className="h-4 w-4" />
   </Button>
   ```

5. **מבנה סמנטי**
   ```tsx
   // שימוש נכון ב-heading hierarchy
   <h1>כותרת ראשית</h1>
   <h2>כותרת משנית</h2>
   <h3>תת-כותרת</h3>
   ```

---

## 💻 דוגמאות קוד

### דף Dashboard מלא

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle2, Clock, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          דשבורד
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          סקירה כללית של המערכת
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-50/50 to-transparent opacity-60" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-blue-900">
              סה״כ תיקים
            </CardTitle>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900">248</div>
            <p className="text-xs text-blue-600 mt-1">+12% מהחודש שעבר</p>
          </CardContent>
        </Card>

        {/* יתר הכרטיסים... */}
      </div>
    </div>
  );
}
```

### טופס עם שדות

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FormExample() {
  return (
    <Card className="shadow-lg border-2">
      <CardHeader>
        <CardTitle className="text-2xl">טופס חדש</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">שם מלא</Label>
          <Input
            id="name"
            placeholder="הזן שם מלא"
            className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">אימייל</Label>
          <Input
            id="email"
            type="email"
            placeholder="example@mail.com"
            className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all">
            שמור
          </Button>
          <Button variant="outline" className="border-2 border-slate-300 hover:bg-slate-50">
            ביטול
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 📦 התקנה והטמעה

### שלבי יישום

1. **עדכון globals.css** - הוספת משתני הצבעים החדשים
2. **עדכון tailwind.config.ts** - הוספת הצבעים המותאמים אישית
3. **עדכון כל הרכיבים הקיימים** - התאמה למערכת החדשה
4. **בדיקת נגישות** - וידוא שכל הרכיבים עומדים בסטנדרטים

### קבצים לעדכון

```
src/
├── app/
│   └── globals.css          # משתני CSS הגלובליים
├── components/
│   ├── ui/                  # כל רכיבי shadcn/ui
│   ├── layout/              # Header, Sidebar, Footer
│   └── shared/              # רכיבים משותפים
└── lib/
    └── utils.ts             # פונקציות עזר
```

---

## 🚀 מעבר הדרגתי

אם מבצעים מעבר הדרגתי:

1. להתחיל מ-globals.css ומשתני הצבעים
2. לעדכון Header ו-Sidebar תחילה
3. לעדכן דף Dashboard
4. לעבור על יתר הדפים אחד אחד

---

## ✅ Checklist לפני Production

- [ ] כל הצבעים עומדים בדרישות נגישות (ניגודיות)
- [ ] תמיכה מלאה ב-RTL (עברית)
- [ ] Dark Mode עובד תקין
- [ ] כל הרכיבים responsive
- [ ] בדיקה על מכשירים שונים
- [ ] בדיקה עם screen readers
- [ ] טעינה מהירה (אופטימיזציה של תמונות)
- [ ] גרסה לדפדפנים ישנים (fallbacks)

---

## 📞 שאלות ותמיכה

למעבר על מסמך זה בכל פעם שמתחילים feature חדש או component חדש.

**תאריך אחרון עודכן:** 2025-10-28
**מטפל:** Claude Code Assistant
**שינויים:** תוקן באג בלוגיקה של design-tokens.ts, עודכן כל התיעוד לגרסה B

---

## 🎨 Preview

לצפיה בדוגמאות חיות: `/design-preview`

