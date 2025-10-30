# 📋 מסמך אפיון מפורט: מסך "תיק נתמך" - Case Management Screen

**תאריך:** 2025-10-29
**גרסה:** 1.0
**סטטוס:** אושר לפיתוח
**מטרה:** אפיון מלא של מסך ניהול תיק נתמך (חתונה/ניקיון)

**מסמכי עזר:**
- [SPECIFICATION.md](./SPECIFICATION.md) - אפיון כללי של המערכת
- [AI_DEVELOPMENT_GUIDE.md](./AI_DEVELOPMENT_GUIDE.md) - הנחיות פיתוח
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - מערכת עיצוב
- [CASE_MANAGEMENT_DEVELOPMENT_PLAN.md](./CASE_MANAGEMENT_DEVELOPMENT_PLAN.md) - תכנית פיתוח

---

## 📑 תוכן עניינים

1. [סקירה כללית](#1-סקירה-כללית)
2. [רצועת מידע כללית (Case Header)](#2-רצועת-מידע-כללית-case-header)
3. [מערכת הטאבים - מבנה כללי](#3-מערכת-הטאבים---מבנה-כללי)
4. [טאב 1: הבקשה בעברית](#4-טאב-1-הבקשה-בעברית)
5. [טאב 2: הבקשה באנגלית](#5-טאב-2-הבקשה-באנגלית)
6. [טאב 3: קבצים ומסמכים](#6-טאב-3-קבצים-ומסמכים)
7. [טאב 4: תשלומים והעברות](#7-טאב-4-תשלומים-והעברות)
8. [ניהול סטטוסים](#8-ניהול-סטטוסים)
9. [היסטוריית שינויים (Audit Log)](#9-היסטוריית-שינויים-audit-log)
10. [נגישות וחוויית משתמש](#10-נגישות-וחוויית-משתמש)
11. [שיקולים טכניים](#11-שיקולים-טכניים)
12. [תרחישי שימוש (Use Cases)](#12-תרחישי-שימוש-use-cases)

---

## 1. סקירה כללית

### 1.1 מטרת המסך

מסך ניהול תיק נתמך הוא **המסך המרכזי** שבו המזכירות מנהלת את כל המידע הקשור לנתמך - החל ממילוי פרטים, דרך תרגום לאנגלית, העלאת מסמכים ועד אישור תשלומים.

**המסך משרת שני סוגי תיקים:**
- 🎊 **תיקי חתונות** (wedding cases)
- 🏥 **תיקי ילדים חולים** (cleaning cases)

### 1.2 נקודות כניסה למסך

משתמש יכול להגיע למסך תיק מ:

1. **רשימת תיקים** - לחיצה על שורה בטבלה
2. **דשבורד** - לחיצה על חתונה בלוח השנה
3. **מסך בקשות** - אחרי אישור בקשה → מעבר ישיר לתיק החדש
4. **חיפוש** - מספר תיק או שם
5. **URL ישיר** - `/cases/[id]` (עם הרשאות)

### 1.3 עקרונות עיצוב

בהתאם ל-DESIGN_SYSTEM.md (Version B - Elegant & Soft):

- ✅ **צבעים רכים ועדינים** - emerald, sky, rose, slate
- ✅ **ActionButton משותף** - לכל הפעולות
- ✅ **גבולות דקים** - `border` לא `border-2`
- ✅ **צללים מינימליים** - `shadow-sm/md` בלבד
- ✅ **סגנון מאטי** - ללא ברק, מקצועי ורגוע
- ✅ **RTL מלא** - תמיכה בעברית
- ✅ **Responsive** - מובייל, טאבלט, דסקטופ

### 1.4 זרימת משתמש בסיסית

```
1. משתמש נכנס למסך תיק → רואה Case Header + טאבים
   ↓
2. קורא את פרטי הבקשה (טאב 1)
   ↓
3. [אופציונלי] מתרגם לאנגלית (טאב 2)
   ↓
4. מעלה קבצים נדרשים (טאב 3)
   ↓
5. מזין פרטי בנק + סכום (טאב 4)
   ↓
6. מאשר תשלום → סטטוס משתנה ל-"ממתין להעברה"
   ↓
7. [במודול העברות] מייצא MASAV → סטטוס "הועבר"
```

---

## 2. רצועת מידע כללית (Case Header)

### 2.1 מיקום

הרצועה מופיעה **מעל כל הטאבים**, קבועה בראש המסך (sticky או static).

### 2.2 מידע מוצג

#### לפי סוג תיק:

**חתונות:**
| שדה | דוגמה | הערות |
|------|--------|-------|
| **מספר תיק** | `#2458` | עם אייקון `FileText` |
| **סוג תיק** | `תיק חתונה` | Badge כחול עדין |
| **סטטוס** | `ממתין להעברה` | Badge צבעוני לפי סטטוס |
| **שם החתן** | `דוד כהן` | טקסט גדול + bold |
| **שם הכלה** | `שרה לוי` | טקסט גדול + bold |
| **תאריך חתונה עברי** | `כ' בתשרי תשפ"ה` | עם אייקון `Calendar` |
| **תאריך חתונה לועזי** | `23/10/2024` | בסוגריים |
| **עיר** | `ירושלים` | עם אייקון `MapPin` |
| **סכום מאושר** | `₪15,000` | בולט, ירוק אם אושר |

**ילדים חולים:**
| שדה | דוגמה | הערות |
|------|--------|-------|
| **מספר תיק** | `#3012` | עם אייקון `FileText` |
| **סוג תיק** | `תיק ילד חולה` | Badge סגול עדין |
| **סטטוס** | `פעיל` / `לא פעיל` | Badge ירוק/אפור |
| **שם משפחה** | `משפחת דוד` | טקסט גדול + bold |
| **שם ילד** | `יוסי` | טקסט גדול |
| **תאריך התחלה** | `ינואר 2024` | חודש ושנה |
| **סכום כולל הועבר** | `₪8,640` | (12 חודשים × 720) |
| **חודשים פעילים** | `12 חודשים` | מחושב אוטומטית |

### 2.3 פעולות זמינות (Action Buttons)

#### חתונות:

```tsx
<div className="flex gap-2">
  {/* כפתור עריכת סטטוס */}
  <ActionButton variant="view" size="sm">
    <Edit3 className="h-4 w-4 me-1" />
    עדכן סטטוס
  </ActionButton>

  {/* אישור להעברה - רק אם סטטוס "חדש" */}
  {status === 'new' && (
    <ActionButton variant="approve" size="sm">
      <CheckCircle2 className="h-4 w-4 me-1" />
      אשר להעברה
    </ActionButton>
  )}

  {/* דחיית בקשה */}
  <ActionButton variant="reject" size="sm">
    <XCircle className="h-4 w-4 me-1" />
    דחה בקשה
  </ActionButton>

  {/* עוד אפשרויות */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <ActionButton variant="view" size="sm">
        <MoreVertical className="h-4 w-4" />
      </ActionButton>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>
        <Printer className="h-4 w-4 me-2" />
        הדפס תיק
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Download className="h-4 w-4 me-2" />
        ייצא PDF
      </DropdownMenuItem>
      <DropdownMenuItem className="text-red-600">
        <Trash2 className="h-4 w-4 me-2" />
        מחק תיק
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

#### ילדים חולים:

```tsx
<div className="flex gap-2">
  {/* עריכת פרטים */}
  <ActionButton variant="view" size="sm">
    <Edit3 className="h-4 w-4 me-1" />
    ערוך פרטים
  </ActionButton>

  {/* סגירת תיק - רק אם פעיל */}
  {status === 'active' && (
    <ActionButton variant="reject" size="sm">
      <XCircle className="h-4 w-4 me-1" />
      סגור תיק
    </ActionButton>
  )}

  {/* שחזור תיק - רק אם לא פעיל */}
  {status === 'inactive' && (
    <ActionButton variant="restore" size="sm">
      <RotateCcw className="h-4 w-4 me-1" />
      שחזר תיק
    </ActionButton>
  )}
</div>
```

### 2.4 Layout ועיצוב

**מבנה:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Icon] #2458 | תיק חתונה | [Badge: ממתין להעברה]           │
│                                                             │
│ דוד כהן ♥ שרה לוי                                          │
│ 📅 כ' בתשרי תשפ"ה (23/10/2024) | 📍 ירושלים                │
│ 💰 סכום מאושר: ₪15,000                                     │
│                                                             │
│ [אשר להעברה] [דחה בקשה] [עוד...]                          │
└─────────────────────────────────────────────────────────────┘
```

**עיצוב (Version B):**
- רקע: `bg-gradient-to-br from-white to-sky-50/30`
- border: `border border-slate-200`
- shadow: `shadow-md`
- padding: `p-6`
- rounded: `rounded-lg`

---

## 3. מערכת הטאבים - מבנה כללי

### 3.1 רשימת טאבים

**חתונות:**
1. 📄 **הבקשה בעברית**
2. 🌍 **הבקשה באנגלית**
3. 📎 **קבצים ומסמכים**
4. 💰 **תשלומים**

**ילדים חולים:**
1. 📄 **פרטי המשפחה**
2. 💰 **תשלומים חודשיים**

### 3.2 התנהגות

- **ברירת מחדל:** טאב ראשון פתוח
- **שמירת מצב:** URL מעודכן בניווט → `/cases/[id]?tab=english`
- **Keyboard navigation:** Arrow keys, Tab
- **טעינה lazy:** תוכן הטאב נטען רק כשפותחים אותו (לא מראש)

### 3.3 אינדיקטורים ויזואליים

**על כל טאב יכול להיות:**
- ✅ **סימון ירוק** - אם הושלם (למשל: קבצים הועלו)
- ⚠️ **סימון כתום** - אם חסר מידע (למשל: טרם תורגם)
- 🔴 **סימון אדום** - אם יש שגיאה (למשל: קובץ נכשל)

**דוגמה:**
```
┌────────────────────────────────────────────────────────┐
│ [✅ הבקשה בעברית] [⚠️ הבקשה באנגלית] [🔴 קבצים] [💰 תשלומים] │
└────────────────────────────────────────────────────────┘
```

### 3.4 עיצוב Tabs (shadcn/ui)

```tsx
<Tabs defaultValue="hebrew" className="w-full">
  <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1">
    <TabsTrigger value="hebrew" className="data-[state=active]:bg-white">
      <FileText className="h-4 w-4 me-2" />
      הבקשה בעברית
    </TabsTrigger>
    {/* ... */}
  </TabsList>

  <TabsContent value="hebrew" className="mt-6">
    {/* תוכן טאב */}
  </TabsContent>
</Tabs>
```

---

## 4. טאב 1: הבקשה בעברית

### 4.1 מטרה

הצגת כל הפרטים שהמשתמש מילא בטופס החיצוני, **בעברית**, עם אפשרות עריכה.

### 4.2 מבנה התוכן

**חתונות - חלוקה ל-3 סקשנים:**

#### סקשן א: מידע על החתונה
```
┌───────────────────────────────────────┐
│ 🎊 מידע על החתונה                   │
├───────────────────────────────────────┤
│ תאריך עברי: [כ' בתשרי תשפ"ה]        │
│ תאריך לועזי: [23/10/2024]           │
│ עיר: [ירושלים]                       │
│ כמות מוזמנים: [300]                 │
│ עלות כוללת: [₪50,000]               │
└───────────────────────────────────────┘
```

#### סקשן ב: פרטי החתן
```
┌───────────────────────────────────────┐
│ 👨 פרטי החתן                         │
├───────────────────────────────────────┤
│ שם פרטי: [דוד]                       │
│ שם משפחה: [כהן]                      │
│ ת.ז.: [123456789]                    │
│ ישיבה: [תיכון תורת חיים]             │
│ שם האב: [משה כהן]                    │
│ עיסוק האב: [מהנדס]                   │
│ שם האם: [רחל כהן]                    │
│ עיסוק האם: [מורה]                    │
│ כתובת: [רחוב הרצל 10, תל אביב]       │
│ טלפון: [050-1234567]                 │
│ מייל: [david@example.com]            │
│ יום זיכרון: [ט' באב]                │
│ תיעוד רקע: [textarea גדול]          │
└───────────────────────────────────────┘
```

#### סקשן ג: פרטי הכלה
(זהה לסקשן החתן, עם שדות מקבילים)

---

**ילדים חולים - סקשן אחד:**

```
┌───────────────────────────────────────┐
│ 👨‍👩‍👧 פרטי המשפחה                      │
├───────────────────────────────────────┤
│ שם משפחה: [דוד]                      │
│ שם הילד החולה: [יוסי]                │
│ ת.ז. הורה 1: [111222333]             │
│ שם הורה 1: [אברהם דוד]               │
│ ת.ז. הורה 2: [444555666]             │
│ שם הורה 2: [שרה דוד]                 │
│ כתובת מלאה: [רחוב המלאכים 7]         │
│ עיר: [פתח תקווה]                     │
│ טלפון 1: [052-1111111]               │
│ טלפון 2: [052-2222222]               │
│ טלפון 3: [052-3333333]               │
│ מייל: [david.family@example.com]     │
└───────────────────────────────────────┘
```

### 4.3 מצבי תצוגה/עריכה

**2 מצבים:**

#### מצב צפייה (View Mode):
- כל השדות **read-only**
- תצוגה נקייה, ללא borders של input
- עיצוב כ-"definition list" (key: value)
- כפתור: **"עבור למצב עריכה"** בפינה עליונה

#### מצב עריכה (Edit Mode):
- כל השדות הופכים ל-`<Input>` / `<Textarea>` / `<Select>`
- שמירה **אוטומטית** (debounced) או כפתור "שמור"
- כפתור: **"בטל עריכה"** - חוזר למצב צפייה
- ולידציה realtime (תצוגת שגיאות מתחת לשדה)

### 4.4 שמירת שינויים

**אסטרטגיה:**

**אופציה A - Autosave (מומלץ):**
```
onChange → debounce 1s → API call → הצגת "נשמר ✓"
```
- יתרון: חוויה חלקה, אין צורך ללחוץ "שמור"
- חיסרון: עומס API אם עורכים הרבה

**אופציה B - שמירה ידנית:**
```
onChange → עדכון state מקומי
לחיצה על "שמור" → API call → הצגת הצלחה/שגיאה
```
- יתרון: פחות API calls
- חיסרון: צריך לזכור ללחוץ "שמור"

**המלצה:** **Autosave** + אינדיקטור ויזואלי:
```tsx
{isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
{justSaved && <Check className="h-4 w-4 text-green-600" />}
```

### 4.5 ולידציה

**חובה:**
- שם פרטי/משפחה: לא ריק, 2-50 תווים
- ת.ז.: בדיוק 9 ספרות
- טלפון: פורמט ישראלי (050-1234567 או 0501234567)
- מייל: פורמט מייל תקין
- תאריך: תאריך עתידי (לחתונה)

**הצגת שגיאות:**
```tsx
<FormField
  label="ת.ז."
  value={id}
  error={errors.id}  // "ת.ז. לא תקין - נדרשות 9 ספרות"
  onChange={handleChange}
/>
```

### 4.6 עיצוב

**Cards לכל סקשן:**
```tsx
<Card className="shadow-md border border-slate-200">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Users className="h-5 w-5 text-sky-600" />
      פרטי החתן
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* שדות */}
  </CardContent>
</Card>
```

**Grid layout:**
```tsx
<div className="grid gap-4 md:grid-cols-2">
  <FormField label="שם פרטי" ... />
  <FormField label="שם משפחה" ... />
</div>
```

---

## 5. טאב 2: הבקשה באנגלית

### 5.1 מטרה

תרגום **אוטומטי** של כל הפרטים לאנגלית (למערכות בינלאומיות), עם אפשרות עריכה ידנית.

### 5.2 זרימת תרגום

```
1. משתמש פותח טאב "הבקשה באנגלית"
   ↓
2. בדיקה: האם קיים תרגום ב-DB?
   ├─ כן → הצגת התרגום הקיים
   └─ לא → הצגת הודעה: "טרם תורגם"
   ↓
3. כפתור: "תרגם עכשיו" (AI)
   ↓
4. קריאה ל-API (Claude/GPT) עם כל השדות
   ↓
5. קבלת JSON מתורגם
   ↓
6. שמירה ב-DB בטבלה `translations`
   ↓
7. הצגת התוצאה
```

### 5.3 כפתורי פעולה

```tsx
<div className="flex gap-2 mb-6">
  {/* אם אין תרגום */}
  {!hasTranslation && (
    <ActionButton variant="primary" onClick={handleTranslate}>
      <Languages className="h-4 w-4 me-2" />
      תרגם לאנגלית (AI)
    </ActionButton>
  )}

  {/* אם יש תרגום */}
  {hasTranslation && (
    <>
      <ActionButton variant="view" onClick={handleEdit}>
        <Edit3 className="h-4 w-4 me-2" />
        ערוך תרגום
      </ActionButton>

      <ActionButton variant="restore" onClick={handleRetranslate}>
        <RefreshCw className="h-4 w-4 me-2" />
        תרגם מחדש
      </ActionButton>
    </>
  )}
</div>
```

### 5.4 מצבים

#### מצב 1: טרם תורגם
```
┌─────────────────────────────────────┐
│ 📝 תרגום לאנגלית                   │
├─────────────────────────────────────┤
│ התיק טרם תורגם לאנגלית.            │
│                                     │
│ [תרגם עכשיו]                        │
└─────────────────────────────────────┘
```

#### מצב 2: בתהליך תרגום
```
┌─────────────────────────────────────┐
│ ⏳ מתרגם...                         │
├─────────────────────────────────────┤
│ [Spinner] התרגום בתהליך, אנא המתן. │
│                                     │
│ צפוי לקחת 5-10 שניות.              │
└─────────────────────────────────────┘
```

#### מצב 3: תורגם בהצלחה
```
┌─────────────────────────────────────┐
│ ✅ Wedding Information              │
├─────────────────────────────────────┤
│ Hebrew Date: 20th of Tishrei 5785  │
│ Gregorian Date: October 23, 2024   │
│ City: Jerusalem                     │
│ Guest Count: 300                    │
│ Total Cost: ₪50,000                 │
│                                     │
│ 👨 Groom Details                    │
│ First Name: David                   │
│ Last Name: Cohen                    │
│ ...                                 │
└─────────────────────────────────────┘

[ערוך תרגום] [תרגם מחדש]
```

### 5.5 עריכה ידנית

- אותו מנגנון כמו טאב עברית
- שדות ניתנים לעריכה
- שמירה autosave
- **שמירת דגל:** `edited_by_user = true` (כדי לא לדרוס בתרגום מחדש)

### 5.6 "תרגם מחדש" - אזהרה

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <ActionButton variant="restore">
      <RefreshCw className="h-4 w-4 me-2" />
      תרגם מחדש
    </ActionButton>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
      <AlertDialogDescription>
        תרגום מחדש ימחק את כל העריכות הידניות שביצעת.
        הפעולה בלתי הפיכה.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <ActionButton variant="cancel">ביטול</ActionButton>
      <ActionButton variant="approve-primary">
        אישור תרגום מחדש
      </ActionButton>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 5.7 שמירה ב-DB

**טבלה: `translations`**
```sql
{
  id: uuid,
  case_id: uuid,  -- קישור לתיק
  lang_from: 'he',
  lang_to: 'en',
  content_json: {  -- JSON של כל השדות המתורגמים
    "wedding_info": {
      "date_hebrew": "20th of Tishrei 5785",
      "date_gregorian": "October 23, 2024",
      ...
    },
    "groom_info": { ... },
    "bride_info": { ... }
  },
  edited_by_user: false,  -- true אם ערכו ידנית
  translated_by: uuid,  -- מי ביצע את התרגום
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## 6. טאב 3: קבצים ומסמכים

### 6.1 מטרה

ניהול כל הקבצים הקשורים לתיק: תפריטים, הזמנות, תמונות, מכתבי תודה.

### 6.2 סוגי קבצים נדרשים (חתונות)

| סוג | שם | חובה? | פורמט | גודל מקסימלי |
|-----|-----|--------|-------|---------------|
| `menu` | תפריט החתונה | ✅ כן | PDF, JPG, PNG | 5MB |
| `invitation` | הזמנת החתונה | ✅ כן | PDF, JPG, PNG | 5MB |
| `groom_photo` | תמונת החתן | ✅ כן | JPG, PNG | 5MB |
| `bride_photo` | תמונת הכלה | ✅ כן | JPG, PNG | 5MB |
| `thank_you` | מכתב תודה | ❌ לא | PDF, JPG, PNG | 5MB |
| `other` | אחר | ❌ לא | PDF, JPG, PNG, DOCX | 5MB |

### 6.3 Layout המסך

```
┌─────────────────────────────────────────────────┐
│ 📎 קבצים ומסמכים                               │
├─────────────────────────────────────────────────┤
│                                                 │
│ [אזור drag & drop - העלאת קבצים]               │
│ גרור קבצים לכאן או לחץ לבחירה                  │
│ PDF, JPG, PNG עד 5MB                           │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📄 תפריט החתונה                                │
│ ├─ wedding_menu.pdf (2.3 MB) ✅                 │
│ └─ [צפה] [הורד] [מחק]                          │
│                                                 │
│ 🎫 הזמנת החתונה                                │
│ ├─ invitation.jpg (1.8 MB) ✅                   │
│ └─ [צפה] [הורד] [מחק]                          │
│                                                 │
│ 👨 תמונת החתן                                  │
│ ├─ [תמונה מוקטנת] groom.jpg (0.9 MB) ✅        │
│ └─ [צפה] [הורד] [מחק]                          │
│                                                 │
│ 👰 תמונת הכלה                                  │
│ ├─ ⚠️ טרם הועלה                                │
│ └─ [העלה קובץ]                                 │
│                                                 │
│ 💌 מכתב תודה (אופציונלי)                       │
│ ├─ ─ לא הועלה                                  │
│ └─ [העלה קובץ]                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 6.4 העלאת קבצים

**אפשרות 1: Drag & Drop**
```tsx
<FileUpload
  onFilesSelected={handleUpload}
  accept={{
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png']
  }}
  maxSize={5}  // MB
  multiple={false}
/>
```

**אפשרות 2: כפתור ליד כל סוג**
```tsx
<input
  type="file"
  accept=".pdf,.jpg,.jpeg,.png"
  onChange={handleFileSelect}
  style={{ display: 'none' }}
  ref={fileInputRef}
/>
<ActionButton onClick={() => fileInputRef.current?.click()}>
  <Upload className="h-4 w-4 me-2" />
  העלה קובץ
</ActionButton>
```

### 6.5 תהליך העלאה

```
1. משתמש בוחר קובץ
   ↓
2. ולידציה:
   ├─ גודל < 5MB?
   ├─ פורמט מותר?
   └─ שם ייחודי?
   ↓
3. העלאה ל-Vercel Blob / S3
   ↓
4. קבלת URL
   ↓
5. שמירה ב-DB (טבלת `files`)
   ↓
6. עדכון UI + הצגת הצלחה
```

**Progress Bar:**
```tsx
{isUploading && (
  <div className="w-full">
    <Progress value={uploadProgress} className="h-2" />
    <p className="text-xs text-muted-foreground mt-1">
      מעלה... {uploadProgress}%
    </p>
  </div>
)}
```

### 6.6 תצוגת קובץ

**לפי סוג:**

**PDF:**
```tsx
<div className="flex items-center gap-3 p-3 border rounded-lg">
  <FileText className="h-10 w-10 text-red-600" />
  <div className="flex-1">
    <p className="font-medium">{filename}</p>
    <p className="text-xs text-muted-foreground">{formatBytes(size)}</p>
  </div>
  <div className="flex gap-1">
    <ActionButton variant="view" size="sm" onClick={() => window.open(url)}>
      <Eye className="h-4 w-4" />
    </ActionButton>
    <ActionButton variant="view" size="sm" asChild>
      <a href={url} download>
        <Download className="h-4 w-4" />
      </a>
    </ActionButton>
    <ActionButton variant="reject" size="sm" onClick={handleDelete}>
      <Trash2 className="h-4 w-4" />
    </ActionButton>
  </div>
</div>
```

**תמונה:**
```tsx
<div className="relative group">
  <img
    src={thumbnailUrl}
    alt={filename}
    className="w-full h-48 object-cover rounded-lg border"
  />
  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
    <ActionButton variant="view" size="sm" onClick={handleView}>
      <Eye className="h-4 w-4" />
    </ActionButton>
    <ActionButton variant="view" size="sm" asChild>
      <a href={url} download>
        <Download className="h-4 w-4" />
      </a>
    </ActionButton>
    <ActionButton variant="reject" size="sm" onClick={handleDelete}>
      <Trash2 className="h-4 w-4" />
    </ActionButton>
  </div>
</div>
```

### 6.7 מחיקת קובץ

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <ActionButton variant="reject" size="sm">
      <Trash2 className="h-4 w-4" />
    </ActionButton>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>מחיקת קובץ</AlertDialogTitle>
      <AlertDialogDescription>
        האם אתה בטוח שברצונך למחוק את {filename}?
        פעולה זו בלתי הפיכה.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <ActionButton variant="cancel">ביטול</ActionButton>
      <ActionButton variant="reject-primary" onClick={confirmDelete}>
        מחק
      </ActionButton>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 6.8 אינדיקטורים

**בטאב עצמו:**
```tsx
// חישוב: כמה מתוך הקבצים החובה הועלו?
const requiredFiles = ['menu', 'invitation', 'groom_photo', 'bride_photo'];
const uploadedRequired = files.filter(f => requiredFiles.includes(f.file_type));
const completionRate = uploadedRequired.length / requiredFiles.length;

// הצגה בכותרת הטאב:
<TabsTrigger value="files">
  <Paperclip className="h-4 w-4 me-2" />
  קבצים
  {completionRate === 1 ? (
    <CheckCircle2 className="h-4 w-4 ms-2 text-green-600" />
  ) : (
    <Badge variant="warning" className="ms-2">{uploadedRequired.length}/{requiredFiles.length}</Badge>
  )}
</TabsTrigger>
```

---

## 7. טאב 4: תשלומים והעברות

### 7.1 מטרה

ניהול כל מה שקשור לכסף: פרטי בנק, סכומים, המרת מטבע, אישור להעברה, היסטוריה.

### 7.2 חלוקה לסקשנים

**חתונות:**
1. פרטי חשבון בנק
2. עלות החתונה וסכום תרומה
3. המרת מטבע (USD → ILS)
4. אישור להעברה
5. היסטוריית תשלומים

**ילדים חולים:**
1. פרטי חשבון בנק (read-only, מהטופס)
2. הזנת תשלום חודשי
3. היסטוריית תשלומים חודשיים

---

### 7.3 סקשן 1: פרטי חשבון בנק

**Layout:**
```
┌─────────────────────────────────────┐
│ 🏦 פרטי חשבון בנק                  │
├─────────────────────────────────────┤
│ בנק: [Select: 10 - בנק לאומי]       │
│ סניף: [Input: 123]                 │
│ מס' חשבון: [Input: 1234567]        │
│ שם בעל החשבון: [Input: דוד כהן]    │
│                                     │
│ [שמור פרטים]                        │
└─────────────────────────────────────┘
```

**רשימת בנקים (ישראל):**
```tsx
const banks = [
  { code: '10', name: 'בנק לאומי' },
  { code: '11', name: 'בנק דיסקונט' },
  { code: '12', name: 'בנק הפועלים' },
  { code: '13', name: 'בנק איגוד' },
  { code: '14', name: 'בנק אוצר החייל' },
  { code: '17', name: 'בנק מרכנתיל' },
  { code: '20', name: 'בנק מזרחי טפחות' },
  { code: '31', name: 'בנק הבינלאומי' },
  { code: '46', name: 'בנק מסד' },
  { code: '52', name: 'בנק פועלי אגודת ישראל' },
];
```

**ולידציה:**
- מספר בנק: 2 ספרות
- סניף: 3 ספרות
- חשבון: 6-9 ספרות
- שם בעל חשבון: לא ריק

---

### 7.4 סקשן 2: עלות וסכום תרומה (חתונות)

```
┌─────────────────────────────────────┐
│ 💰 עלות וסכום תרומה                │
├─────────────────────────────────────┤
│ עלות החתונה המדווחת:                │
│ ₪ [50,000] (ניתן לעדכון)            │
│                                     │
│ סכום תרומה בדולרים:                 │
│ $ [4,000]                           │
│                                     │
│ [כפתור המרה →]                      │
│                                     │
│ סכום מאושר להעברה (₪):              │
│ ₪ [15,000] (מחושב אוטומטית)        │
└─────────────────────────────────────┘
```

**לוגיקת חישוב:**
```
1. משתמש מזין: סכום תרומה ב-USD
2. לחיצה על "המר" → קריאה ל-API שער חליפין
3. חישוב: USD * שער = ILS
4. הצגת התוצאה בשדה "סכום מאושר"
5. [אופציונלי] משתמש יכול לעדכן ידנית
```

---

### 7.5 סקשן 3: המרת מטבע

**UI:**
```tsx
<Card className="bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-200">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <DollarSign className="h-5 w-5 text-emerald-600" />
      המרת מטבע
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <Label>סכום בדולרים (USD)</Label>
        <Input
          type="number"
          value={usdAmount}
          onChange={(e) => setUsdAmount(e.target.value)}
          placeholder="0.00"
          className="text-lg font-semibold"
        />
      </div>

      <div>
        <Label className="flex items-center justify-between">
          שער חליפין
          <ActionButton
            variant="view"
            size="sm"
            onClick={fetchExchangeRate}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            עדכן שער
          </ActionButton>
        </Label>
        <Input
          type="number"
          value={exchangeRate}
          onChange={(e) => setExchangeRate(e.target.value)}
          placeholder="3.70"
          step="0.01"
          className="text-lg font-semibold"
        />
      </div>
    </div>

    <div className="flex items-center justify-center py-2">
      <ArrowDown className="h-6 w-6 text-emerald-600" />
    </div>

    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
      <Label className="text-emerald-900">סכום בשקלים (ILS)</Label>
      <div className="text-3xl font-bold text-emerald-700 mt-2">
        ₪ {(parseFloat(usdAmount || 0) * parseFloat(exchangeRate || 0)).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>

    <ActionButton variant="primary" className="w-full" onClick={handleConvert}>
      <CheckCircle2 className="h-4 w-4 me-2" />
      אשר סכום זה
    </ActionButton>
  </CardContent>
</Card>
```

**API לשער חליפין:**
```typescript
// Option 1: Bank of Israel API
const fetchExchangeRate = async () => {
  const response = await fetch('https://edge.boi.gov.il/FusionEdgeServer/sdmx/v2/data/dataflow/BOI.STATISTICS/EXR/1.0/RER_USD_ILS...');
  // parse XML response
};

// Option 2: Free API (exchangerate-api.com)
const fetchExchangeRate = async () => {
  const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
  const data = await response.json();
  return data.rates.ILS;
};
```

---

### 7.6 סקשן 4: אישור להעברה

```
┌─────────────────────────────────────┐
│ ✅ אישור להעברה                     │
├─────────────────────────────────────┤
│ סיכום:                              │
│ ├─ סכום תרומה: $4,000              │
│ ├─ שער חליפין: 3.75                │
│ ├─ סכום להעברה: ₪15,000            │
│ └─ בעל חשבון: דוד כהן               │
│                                     │
│ [אשר להעברה בנקאית]                 │
│                                     │
│ ⚠️ לאחר אישור, הסטטוס ישתנה         │
│    ל"ממתין להעברה"                  │
└─────────────────────────────────────┘
```

**לחיצה על "אשר להעברה":**

1. **ולידציה:**
   - פרטי בנק מלאים? ✓
   - סכום > 0? ✓
   - כל הקבצים הועלו? ✓ (אופציונלי)

2. **Dialog אישור:**
```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>אישור העברה בנקאית</AlertDialogTitle>
      <AlertDialogDescription>
        האם אתה בטוח שברצונך לאשר העברה של ₪15,000 לחשבון דוד כהן?
        הסטטוס ישתנה ל"ממתין להעברה" והתיק יועבר לטבלת ההעברות.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <ActionButton variant="cancel">ביטול</ActionButton>
      <ActionButton variant="approve-primary" onClick={confirmApproval}>
        אשר
      </ActionButton>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

3. **פעולות:**
   - יצירת רשומה בטבלת `payments`:
     ```sql
     INSERT INTO payments (
       case_id,
       payment_type,
       amount_usd,
       amount_ils,
       exchange_rate,
       status,
       approved_by
     ) VALUES (
       '<case_id>',
       'wedding_transfer',
       4000,
       15000,
       3.75,
       'approved',
       '<user_id>'
     )
     ```
   - עדכון סטטוס התיק:
     ```sql
     UPDATE cases
     SET status = 'pending_transfer'
     WHERE id = '<case_id>'
     ```
   - רישום ב-audit log
   - [אופציונלי] שליחת מייל למזכירות

4. **הצגת הצלחה:**
```tsx
toast.success('התשלום אושר בהצלחה! התיק הועבר לטבלת ההעברות.');
```

---

### 7.7 סקשן 5: היסטוריית תשלומים

**טבלה:**
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 היסטוריית תשלומים                                       │
├─────────────────────────────────────────────────────────────┤
│ תאריך     | סכום ($) | סכום (₪) | סטטוס       | הערות   │
├──────────┼─────────┼─────────┼────────────┼────────┤
│ 05/01/25 | $4,000  | ₪15,000 | הועבר      | -      │
│ 02/12/24 | $500    | ₪1,850  | ממתין      | מקדמה  │
└─────────────────────────────────────────────────────────────┘
```

**עיצוב:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>תאריך</TableHead>
      <TableHead>סכום ($)</TableHead>
      <TableHead>סכום (₪)</TableHead>
      <TableHead>סטטוס</TableHead>
      <TableHead>הערות</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {payments.map((payment) => (
      <TableRow key={payment.id}>
        <TableCell>{formatDate(payment.created_at)}</TableCell>
        <TableCell>${payment.amount_usd?.toLocaleString()}</TableCell>
        <TableCell>₪{payment.amount_ils.toLocaleString()}</TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(payment.status)}>
            {t(`status.${payment.status}`)}
          </Badge>
        </TableCell>
        <TableCell>{payment.notes || '-'}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### 7.8 תשלומים חודשיים (ילדים חולים)

**הבדלים:**
- אין המרת מטבע (הכל בשקלים)
- תקרה חודשית: ₪720
- הזנה לפי חודש ספציפי

**UI:**
```
┌─────────────────────────────────────┐
│ 💰 הזנת תשלום חודשי                │
├─────────────────────────────────────┤
│ בחר חודש:                            │
│ [Select: ינואר 2025]                │
│                                     │
│ סכום (עד ₪720):                     │
│ ₪ [650]                             │
│                                     │
│ הערות (אופציונלי):                  │
│ [Textarea]                          │
│                                     │
│ [שמור ואשר להעברה]                  │
└─────────────────────────────────────┘
```

**ולידציה:**
- סכום בין 0 ל-720
- חודש לא יכול להיות עתידי (יותר מדי)
- לא ניתן להזין אותו חודש פעמיים

---

## 8. ניהול סטטוסים

### 8.1 זרימת סטטוסים - חתונות

```
חדש (new)
   ↓
   [אישור תשלום]
   ↓
ממתין להעברה (pending_transfer)
   ↓
   [ייצוא MASAV במודול העברות]
   ↓
הועבר (transferred)

   OR

חדש/ממתין להעברה
   ↓
   [דחייה]
   ↓
נדחה (rejected)

   OR

[תאריך החתונה עבר]
   ↓
פג תוקף (expired)
```

### 8.2 זרימת סטטוסים - ילדים חולים

```
פעיל (active)
   ↓
   [סגירת תיק]
   ↓
לא פעיל (inactive)
   ↓
   [שחזור תיק - אופציונלי]
   ↓
פעיל (active)
```

### 8.3 שינוי סטטוס ידני

**Dropdown ב-Case Header:**
```tsx
<Select value={status} onValueChange={handleStatusChange}>
  <SelectTrigger className="w-[200px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="new">חדש</SelectItem>
    <SelectItem value="pending_transfer">ממתין להעברה</SelectItem>
    <SelectItem value="transferred">הועבר</SelectItem>
    <SelectItem value="rejected">נדחה</SelectItem>
    <SelectItem value="expired">פג תוקף</SelectItem>
  </SelectContent>
</Select>
```

**עם אישור:**
```tsx
const handleStatusChange = (newStatus) => {
  if (newStatus === 'rejected' || newStatus === 'expired') {
    // הצגת dialog אישור
    setConfirmDialog({
      open: true,
      title: 'שינוי סטטוס',
      description: `האם אתה בטוח שברצונך לשנות את הסטטוס ל"${getStatusLabel(newStatus)}"?`,
      onConfirm: () => updateStatus(newStatus)
    });
  } else {
    updateStatus(newStatus);
  }
};
```

### 8.4 צבעי סטטוס (Badges)

```tsx
const getStatusVariant = (status) => {
  switch (status) {
    case 'new':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'pending_transfer':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'transferred':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'rejected':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'expired':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'active':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'inactive':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};
```

---

## 9. היסטוריית שינויים (Audit Log)

### 9.1 מטרה

רישום **כל שינוי** שנעשה בתיק - מי, מתי, מה השתנה.

### 9.2 מיקום בממשק

**אופציה A: טאב נפרד "היסטוריה"**
```
[הבקשה בעברית] [הבקשה באנגלית] [קבצים] [תשלומים] [📜 היסטוריה]
```

**אופציה B: Drawer צדדי (מומלץ)**
```tsx
<Sheet>
  <SheetTrigger asChild>
    <ActionButton variant="view" size="sm">
      <History className="h-4 w-4 me-2" />
      היסטוריה
    </ActionButton>
  </SheetTrigger>
  <SheetContent side="left" className="w-[400px]">
    <SheetHeader>
      <SheetTitle>היסטוריית שינויים</SheetTitle>
    </SheetHeader>
    <div className="mt-6 space-y-4">
      {/* timeline של שינויים */}
    </div>
  </SheetContent>
</Sheet>
```

### 9.3 תצוגת Timeline

```tsx
{history.map((entry, index) => (
  <div key={entry.id} className="flex gap-3">
    <div className="flex flex-col items-center">
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center",
        getChangeTypeColor(entry.field_changed)
      )}>
        {getChangeTypeIcon(entry.field_changed)}
      </div>
      {index < history.length - 1 && (
        <div className="w-0.5 flex-1 bg-slate-200 my-1" />
      )}
    </div>

    <div className="flex-1 pb-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">{entry.changed_by_name}</span>
        <span className="text-muted-foreground">
          {getChangeDescription(entry)}
        </span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {formatDistanceToNow(entry.changed_at, { addSuffix: true, locale: he })}
      </div>
      {entry.note && (
        <div className="text-sm text-muted-foreground mt-2 bg-slate-50 p-2 rounded">
          {entry.note}
        </div>
      )}
    </div>
  </div>
))}
```

### 9.4 דוגמת רשומות

```
┌─────────────────────────────────────┐
│ 📜 היסטוריית שינויים                │
├─────────────────────────────────────┤
│                                     │
│ 🔵 דני כהן שינה את הסטטוס          │
│    מ"חדש" ל"ממתין להעברה"          │
│    לפני 5 דקות                      │
│                                     │
│ 📎 דני כהן העלה קובץ                │
│    wedding_menu.pdf                 │
│    לפני שעה                         │
│                                     │
│ ✏️ דני כהן ערך את שדה "טלפון"      │
│    מ"050-1234567" ל"050-7654321"    │
│    לפני 3 שעות                      │
│                                     │
│ ✅ המערכת יצרה את התיק              │
│    מבקשה #4578                      │
│    לפני יום                         │
└─────────────────────────────────────┘
```

---

## 10. נגישות וחוויית משתמש

### 10.1 RTL (Right-to-Left)

**כל המסך חייב לתמוך ב-RTL:**

```tsx
import { useLocale } from 'next-intl';

export default function CasePage({ params }: { params: { id: string } }) {
  const locale = useLocale();
  const dir = locale === 'he' ? 'rtl' : 'ltr';

  return (
    <div dir={dir} className="container py-6">
      {/* תוכן */}
    </div>
  );
}
```

**תמיכה ב-Tailwind:**
```tsx
// במקום:
<div className="ml-4">  // ❌

// להשתמש ב:
<div className="ms-4">  // ✅ margin-start (ימין ב-RTL, שמאל ב-LTR)
```

### 10.2 Responsive Design

**Breakpoints:**
```
Mobile:  < 768px   - טאבים אנכיים, כפתורים מלאים
Tablet:  768-1024px - grid cols-2
Desktop: > 1024px  - grid cols-3/4, sidebar
```

**Grid responsive:**
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
```

### 10.3 Loading States

**טעינה ראשונית:**
```tsx
{isLoading ? (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
    <p className="ms-3 text-muted-foreground">טוען תיק...</p>
  </div>
) : (
  <CaseContent />
)}
```

**Skeleton לכרטיסים:**
```tsx
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-[200px]" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-3/4" />
  </CardContent>
</Card>
```

### 10.4 Error Handling

**שגיאה בטעינת תיק:**
```tsx
{error && (
  <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
    <AlertCircle className="h-12 w-12 text-rose-600" />
    <h2 className="text-xl font-semibold">שגיאה בטעינת התיק</h2>
    <p className="text-muted-foreground">{error.message}</p>
    <ActionButton variant="primary" onClick={() => router.back()}>
      <ArrowRight className="h-4 w-4 me-2" />
      חזור
    </ActionButton>
  </div>
)}
```

**404 - תיק לא נמצא:**
```tsx
if (!caseData) {
  return (
    <div className="text-center py-12">
      <FileX className="h-16 w-16 text-slate-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">תיק לא נמצא</h2>
      <p className="text-muted-foreground mb-6">
        התיק שחיפשת אינו קיים או שאין לך הרשאות לצפות בו
      </p>
      <ActionButton variant="primary" asChild>
        <Link href="/cases">
          <List className="h-4 w-4 me-2" />
          לרשימת התיקים
        </Link>
      </ActionButton>
    </div>
  );
}
```

### 10.5 Toast Notifications

**שמירה מוצלחת:**
```tsx
toast.success('השינויים נשמרו בהצלחה', {
  description: 'כל הנתונים עודכנו במערכת',
});
```

**שגיאה:**
```tsx
toast.error('שגיאה בשמירה', {
  description: error.message,
  action: {
    label: 'נסה שוב',
    onClick: () => handleSave(),
  },
});
```

**מידע:**
```tsx
toast.info('תהליך התרגום החל', {
  description: 'צפוי להימשך 5-10 שניות',
});
```

---

## 11. שיקולים טכניים

### 11.1 Data Fetching

**Server Component (ראשוני):**
```typescript
// app/[locale]/cases/[id]/page.tsx
export default async function CasePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: caseData, error } = await supabase
    .from('cases')
    .select('*, files(*), payments(*), bank_details(*)')
    .eq('id', params.id)
    .single();

  if (error) return <ErrorDisplay error={error} />;

  return <CaseView initialData={caseData} />;
}
```

**Client Component (updates):**
```typescript
// components/features/cases/CaseView.tsx
'use client';

export function CaseView({ initialData }: { initialData: Case }) {
  const { data: caseData, mutate } = useSWR(`/api/cases/${initialData.id}`, {
    fallbackData: initialData,
    revalidateOnFocus: true,
  });

  // ...
}
```

### 11.2 Optimistic Updates

**שמירה עם optimistic UI:**
```typescript
const updateField = async (field: string, value: any) => {
  // עדכון UI מיידי
  mutate(
    { ...caseData, [field]: value },
    false  // לא revalidate עדיין
  );

  try {
    // API call
    await fetch(`/api/cases/${caseData.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ [field]: value }),
    });

    // revalidate מהשרת
    mutate();

    toast.success('נשמר');
  } catch (error) {
    // rollback
    mutate();
    toast.error('שגיאה בשמירה');
  }
};
```

### 11.3 Caching Strategy

**ISR (Incremental Static Regeneration):**
```typescript
export const revalidate = 60;  // 1 minute
```

**או Client-side SWR:**
```typescript
const { data } = useSWR(key, fetcher, {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
});
```

### 11.4 Performance

**Code splitting per tab:**
```tsx
const HebrewTab = dynamic(() => import('./tabs/HebrewTab'));
const EnglishTab = dynamic(() => import('./tabs/EnglishTab'));
const FilesTab = dynamic(() => import('./tabs/FilesTab'));
const PaymentsTab = dynamic(() => import('./tabs/PaymentsTab'));
```

**Image optimization:**
```tsx
<Image
  src={fileUrl}
  alt={filename}
  width={400}
  height={300}
  className="object-cover"
  loading="lazy"
/>
```

---

## 12. תרחישי שימוש (Use Cases)

### 12.1 תרחיש 1: עריכת פרטי תיק חתונה

```
1. מזכירה נכנסת לתיק #2458
2. רואה בטאב "הבקשה בעברית" שהטלפון של החתן שגוי
3. לוחצת על "עבור למצב עריכה"
4. מתקנת: 050-1234567 → 050-7654321
5. המערכת שומרת אוטומטית (debounced)
6. הצגת ✓ "נשמר"
7. רישום ב-audit log
```

### 12.2 תרחיש 2: תרגום תיק לאנגלית

```
1. מזכירה עוברת לטאב "הבקשה באנגלית"
2. רואה: "טרם תורגם"
3. לוחצת "תרגם עכשיו"
4. המערכת שולחת את כל הנתונים ל-Claude API
5. [Loading...] "מתרגם... 5-10 שניות"
6. קבלת JSON מתורגם
7. שמירה ב-DB (טבלת translations)
8. הצגת התוצאה
9. [אופציונלי] עריכה ידנית של שדה
```

### 12.3 תרחיש 3: אישור תשלום והעברה

```
1. מזכירה בטאב "תשלומים"
2. ממלאת פרטי בנק
3. מזינה: $4,000
4. לוחצת "עדכן שער" → שער: 3.75
5. רואה: ₪15,000
6. לוחצת "אשר סכום זה"
7. לוחצת "אשר להעברה בנקאית"
8. Dialog אישור
9. אישור →
   - יצירת payment ב-DB
   - עדכון סטטוס: pending_transfer
   - הוספה לטבלת העברות
10. Toast: "התשלום אושר!"
11. הסטטוס ב-header משתנה
```

### 12.4 תרחיש 4: העלאת קבצים

```
1. מזכירה בטאב "קבצים"
2. גוררת PDF של תפריט
3. [Upload progress: 45%...]
4. העלאה ל-Vercel Blob
5. קבלת URL
6. שמירה ב-DB (טבלת files)
7. הצגת הקובץ ברשימה
8. אינדיקטור בטאב: "3/4 קבצים הועלו"
```

### 12.5 תרחיש 5: סגירת תיק ילד חולה

```
1. מזכירה נכנסת לתיק #3012 (ילד חולה)
2. לוחצת "סגור תיק" ב-CaseHeader
3. Dialog: "בחר סיבה:"
   - הילד החלים ✓
   - הילד נפטר
   - סיום תמיכה
4. בוחרת "הילד החלים"
5. אישור
6. עדכון:
   - status → 'inactive'
   - end_date → היום
   - end_reason → 'healed'
7. הסטטוס משתנה ל-"לא פעיל"
8. Toast: "התיק נסגר בהצלחה"
```

---

## ✅ Checklist אישור

לפני פיתוח:

- [ ] אושר מבנה ה-Case Header
- [ ] אושרה חלוקת הטאבים (4 לחתונות, 2 לילדים חולים)
- [ ] הוחלט על אסטרטגיית שמירה (autosave / ידני)
- [ ] הוחלט על ספק תרגום (Claude / GPT)
- [ ] הוחלט על ספק שער חליפין (BOI / API חיצוני)
- [ ] הוחלט על אחסון קבצים (Vercel Blob / S3)
- [ ] אושרה זרימת הסטטוסים
- [ ] אושר עיצוב ה-ActionButton (Version B)
- [ ] אושרה אסטרטגיית הטעינה (SSR + SWR)
- [ ] אושרה מיקום היסטוריית שינויים (טאב / drawer)

---

**תאריך אישור:** _______________________
**מאשר:** _______________________
**הערות:** _______________________

---

**סוף מסמך אפיון**
