# מסמך אפיון מאוחד - מערכת תמיכה למשפחות יתומים וילדים חולים

**תאריך:** אוקטובר 2025
**גרסה:** 1.0 - מאוחד
**סוג הפרויקט:** Web Application (Next.js + PostgreSQL)
**מטרה:** מערכת ניהול תמיכות לעמותה המעניקה הערכות כספיות לשתי קבוצות יעד

---

## תוכן עניינים

1. [סקירה כללית](#1-סקירה-כללית)
2. [מודול א': תמיכה לחתונות יתומים](#2-מודול-א-תמיכה-לחתונות-יתומים)
3. [מודול ב': תמיכה לילדים חולים](#3-מודול-ב-תמיכה-לילדים-חולים)
4. [מודול משותף: העברות בנקאיות](#4-מודול-משותף-העברות-בנקאיות)
5. [ארכיטקטורה טכנית](#5-ארכיטקטורה-טכנית)
6. [אבטחה ורגולציה](#6-אבטחה-ורגולציה)
7. [לוח זמנים ושלבי פיתוח](#7-לוח-זמנים-ושלבי-פיתוח)

---

## 1. סקירה כללית

### 1.1 מטרת המערכת

מערכת ניהול תמיכות לעמותה המעניקה הערכות כספיות לשתי קבוצות יעד:
1. **מודול תמיכה לחתונות יתומים** — ניהול בקשות, תיקים, ותעבור כסף לחתונות
2. **מודול תמיכה לילדים חולים** — ניהול תשלומים חודשיים לניקיון משפחות עם ילד חולה

### 1.2 משתמשי המערכת

- **מזכירות / מנהלים** — משתמש עיקרי: רואה בקשות, מאשר/דוחה, מעלה קבצים, מנהל העברות

> **הערה:** אין הבחנה בהרשאות בין מזכירות למנהלים - כולם בעלי הרשאות זהות לגמרי. אימות בסיסי עם שם משתמש וסיסמה (NextAuth או דומה)

### 1.3 תזרים עבודה כללי (High-level flow)

```
1. משפחה ממלאת טופס חיצוני (חתונה או ילד חולה)
   ↓
2. המערכת שומרת בטבלת applicants ושולחת מייל למזכירות
   ↓
3. מזכירות רואה את הבקשה ברשימת "בקשות ממתינות" ויכולה להחליט:
   - להכניס למערכת (לפתוח תיק) ← בקשה רלוונטית
   - לדחות ← בקשה לא טובה/לא רלוונטית
   ↓
4. אישור פותח תיק (case) במערכת עם מספר רץ וסטטוס "חדש"
   ↓
5. בתוך תיק: ניהול פרטים, קבצים, תרגומים, תשלומים
   ↓
6. אישור תשלום → העברה לטבלת העברות → ייצוא MASAV
   ↓
7. סטטוס מתעדכן ל"הועבר" + אסמכתא ותאריך
```

---

## 2. מודול א': תמיכה לחתונות יתומים

### 2.1 טופס חיצוני (Public Form)

**זמינות:** טופס נפרד נגיש לציבור (לא חלק מהמערכת הפנימית)
**ממלא:** חתן/כלה או בא כוחם

#### שדות הטופס

**קטע א: מידע החתונה**
- תאריך עברי (חובה)
- תאריך לועזי (חובה)
- עיר (חובה)
- כמות מוזמנים (חובה)
- סה"כ עלות חתונה - קטרינג + אולם (חובה)

**קטע ב: פרטי החתן**
- שם פרטי + משפחה (חובה)
- ת.ז. (חובה)
- ישיבה (בחירה/טקסט)
- שם האב + עיסוק (בחירה)
- שם האם + עיסוק (בחירה)
- כתובת מלאה (חובה)
- עיר (חובה)
- טלפון (חובה)
- מייל (חובה)
- יום זיכרון (טקסט חופשי)
- תיעוד רקע (textarea)

**קטע ג: פרטי הכלה**
- אותם שדות כמו החתן

#### פעולה בשליחת הטופס
1. שמירה בטבלת `applicants` עם `form_data` (JSON)
2. שליחה אוטומטית של מייל למזכירות עם כל הפרטים + קישור למערכת
3. הצגת הודעת תודה למשתמש

---

### 2.2 ניהול תיק במערכת

#### 2.2.1 פתיחת תיק

**תהליך:**
1. מזכירה מקבלת מייל על בקשה חדשה
2. לחיצה על כפתור "אשר בקשה" במייל או במערכת
3. תיק נפתח אוטומטית עם:
   - מספר תיק רץ (auto-increment)
   - סטטוס: **"חדש"**
   - העתקת נתונים מטבלת applicants

#### 2.2.2 סטטוסים (Status Flow)

הסטטוסים הפשוטים עבור תיק חתונה:

| סטטוס | תיאור | פעולה הבאה |
|-------|--------|------------|
| **חדש** | תיק נפתח, טרם טופל | בדיקה ראשונית |
| **ממתין להעברה** | אושר והוכנס סכום | ייצוא MASAV |
| **הועבר** | הכסף הועבר בפועל | סיום |
| **נדחה** | הבקשה נדחתה | סיום |
| **פג תוקף** | עבר תאריך החתונה | סיום |

> **שימו לב:** אין סטטוסים ביניים כמו "waiting_for_donor" כדי לשמור על פשטות

#### 2.2.3 מסך התיק - 4 טאבים

**רצועת מידע כללית (מעל כל הטאבים):**
- מס' תיק
- סטטוס (dropdown לשינוי)
- שם החתן/כלה
- תאריך החתונה (עברי + לועזי)
- **כפתורים:**
  - "עבור לסטטוס ממתין להעברה"
  - "דחה בקשה"

---

**טאב 1: הבקשה בעברית**

- הצגה של כל פרטי הטופס בעברית
- **מצב:** ניתן לעריכה (שדות בודדים עם שמירה אוטומטית)
- שדות מרכזיים:
  - פרטי החתונה
  - פרטי חתן וכלה מלאים
  - כתובות וטלפונים
  - תיעוד רקע

---

**טאב 2: הבקשה באנגלית**

- **כפתור "תרגם"** — קורא לשירות AI (Claude/ChatGPT) ומתרגם את כל השדות לאנגלית
- **שמירה ב-DB:** התרגום נשמר בטבלה `translations` (לא מתרגם מחדש בכל ביקור)
- **עריכה ידנית:** ניתן לערוך כל שדה מתורגם ולשמור שינויים
- **כפתור "תרגם מחדש"** — מחליף תרגום קיים

**הערה טכנית:**
```javascript
// API Call example
POST /api/cases/:id/translate
{
  "source_lang": "he",
  "target_lang": "en",
  "force_refresh": false
}
```

---

**טאב 3: מידע נוסף - קבצים**

**הגבלות:**
- גודל מקסימלי: 5MB לקובץ
- סוגי קבצים: PDF, JPG, PNG
- אחסון: Vercel Blob / AWS S3

**סוגי קבצים נדרשים:**
1. תפריט החתונה
2. הזמנת החתונה
3. תמונה של החתן/כלה
4. מכתב תודה (אופציונלי)

**פעולות:**
- העלאת קובץ (drag & drop או browse)
- הורדת קובץ
- מחיקת קובץ
- תצוגה מקדימה (תמונות)

---

**טאב 4: תשלומים**

**שדות:**
- **פרטי חשבון בנק:**
  - בנק (בחירה מרשימה)
  - סניף
  - מספר חשבון
  - שם בעל החשבון
- **עלות החתונה המדווחת:** (מתמולא מהטופס, ניתן לעדכון)
- **סכום תרומה בדולרים:** (הכנסה ידנית)
- **כפתור "המרה":** USD → ILS (שער עדכני מ-API)
- **סכום מאושר להעברה (₪):**
- **כפתור "אשר להעברה"** → מעדכן סטטוס ל"ממתין להעברה" ומעביר לטבלת העברות

**אחרי העברה בפועל (מתעדכן אוטומטית):**
- תאריך העברה
- אסמכתא (reference)
- סכום שהועבר בפועל
- סטטוס: "הועבר"

**טבלת היסטוריית תשלומים:**
| תאריך | סכום (₪) | סכום ($) | סטטוס | הערות |
|--------|---------|---------|--------|-------|
| ... | ... | ... | ... | ... |

---

### 2.3 דשבורד ראשי (Dashboard)

#### חלוקת מסך

**חצי מסך שמאלי: לוח שנה עברי**

- תצוגה חודשית עברית (תשרי, חשוון, כסלו...)
- כל תא (יום) מציג:
  - תאריך עברי + לועזי
  - רשימת חתונות באותו יום (שם הזוג)
  - סכום צפוי / כמות מוזמנים
- **ניווט:** חצים לחודש הבא/קודם
- **פילטר:** אפשרות לחפש לפי תאריך לועזי

**חצי מסך ימני: סטטיסטיקות חודשיות**

- כמות בקשות חדשות החודש
- סכום כולל חתונות החודש
- כמות בקשות ממתינות להעברה
- סכום מאושר להעברה
- כמה כבר הועברו (סכום בפועל)

**כפתורי פעולה:**
- "רשימת כל התיקים" → מסך טבלת תיקים
- "סטטיסטיקות מתקדמות" → דוחות
- "ניהול העברות" → מעבר למודול העברות

---

### 2.4 רשימת תיקים (Cases List)

**טבלה עם עמודות:**
- מס' תיק
- תאריך החתונה (עברי + לועזי)
- שם החתן/כלה
- עיר
- סטטוס
- סכום מאושר
- פעולות (צפייה/עריכה)

**סינונים:**
- לפי סטטוס
- לפי חודש עברי
- לפי עיר
- לפי טווח תאריכים
- חיפוש טקסט חופשי (שם/מס' תיק)

**ייצוא:**
- Excel של כל הטבלה (כפי שמוצגת עם הסינונים)

---

## 3. מודול ב': תמיכה לילדים חולים

### 3.1 טופס חיצוני

**זמינות:** טופס נפרד נגיש לציבור + ממשק פנימי למזכירה
**ממלא:** הורה מהמשפחה או מזכירה (ישירות במערכת)

#### שדות הטופס

- **ת.ז. הורה ראשי** (חובה)
- **ת.ז. הורה שני** (אופציונלי)
- **שם משפחה** (חובה)
- **שם הורה 1** (חובה)
- **שם הורה 2** (אופציונלי)
- **שם הילד החולה** (חובה)
- **כתובת מלאה** (חובה)
- **עיר** (חובה)
- **טלפון 1** (חובה)
- **טלפון 2** (אופציונלי)
- **טלפון 3** (אופציונלי)
- **מייל** (חובה)
- **פרטי בנק:**
  - מספר בנק (חובה)
  - סניף (חובה)
  - מספר חשבון (חובה)
  - שם בעל החשבון (חובה)

#### פעולה בשליחה

1. שמירה בטבלת `applicants` עם `case_type = 'cleaning'`
2. **תיק נפתח אוטומטית** בסטטוס **"פעיל"** (ללא אישור מזכירה)
3. שליחת מייל למזכירות עם כל הפרטים

---

### 3.2 ניהול תיק

#### סטטוסים

| סטטוס | תיאור |
|-------|--------|
| **פעיל** | משפחה מקבלת תמיכה |
| **לא פעיל** | תיק נסגר |

#### מסך התיק - 2 טאבים

**רצועת מידע כללית:**
- מס' תיק
- סטטוס: פעיל / לא פעיל
- שם המשפחה + ילד
- תאריך התחלת תמיכה
- סכום כולל שהועבר עד כה
- **כפתור "סגור תיק"** (עם סיבה)

---

**טאב 1: פרטי המשפחה**

- הצגת כל הפרטים מהטופס
- ניתן לעריכה
- **תקציר תיק:**
  - תאריך התחלה (חודש/שנה)
  - תאריך סיום (ריק אם פעיל)
  - סכום כולל שהועבר
  - מספר חודשים פעילים

---

**טאב 2: תשלומים חודשיים**

**בחירת חודש להזנה:**
- Dropdown של חודשים (מתחיל מחודש ההתחלה)
- שדה סכום: עד 720 ₪ (תקרה חודשית)
- כפתור "שמור" + "העבר לתשלום"

**טבלת היסטוריה:**

| חודש | שנה | סכום (₪) | תאריך הזנה | סטטוס | פעולות |
|------|-----|---------|------------|--------|---------|
| ינואר | 2025 | 720 | 05/01/2025 | הועבר | צפייה |
| דצמבר | 2024 | 650 | 02/12/2024 | ממתין | עריכה |

**הזנה מהירה למספר משפחות:**

מזכירה יכולה לבחור:
1. חודש מתוך dropdown
2. סימון משפחות מרשימה (checkboxes)
3. הזנת סכום לכל משפחה בטבלה אחת
4. כפתור "העבר הכל" → כל המסומנות עוברות לטבלת העברות

---

**סגירת תיק:**

כפתור "סגור תיק" פותח דיאלוג עם בחירת סיבה:
- ✅ הילד החלים (ברוך השם)
- ❌ לצערנו הילד נפטר
- ⏸ סיום תמיכה (סיבה אחרת)

**תוצאה:**
- סטטוס → "לא פעיל"
- תאריך סגירה נשמר
- סיבת סגירה נשמרת

---

### 3.3 דשבורד משפחות

**מסך ראשי:**

טבלה של משפחות פעילות:

| שם משפחה | שם ילד | תאריך התחלה | סכום חודש נוכחי | פעולות |
|----------|--------|-------------|-----------------|---------|
| משפחת כהן | יוסי | 01/2024 | 720 ₪ | פתח תיק |
| משפחת לוי | שרה | 03/2024 | 650 ₪ | פתח תיק |

**סטטיסטיקות:**
- כמות משפחות פעילות
- סכום ממוצע לחודש
- סכום כולל החודש

---

### 3.4 שליחת מייל חודשי (ידנית)

**טריגר:** כפתור במערכת שהמזכירה לוחצת עליו

**מיקום הכפתור:** בדשבורד של מודול ילדים חולים

**תהליך:**
1. מזכירה לוחצת על כפתור "שלח מיילים חודשיים"
2. Query: `SELECT * FROM cases WHERE case_type = 'cleaning' AND status = 'active'`
3. עבור כל משפחה פעילה:
   - שליחת מייל עם התבנית הבאה:

**תבנית המייל:**

```
נושא: דיווח ניקיון לחודש [חודש] - משפחת [שם משפחה]

שלום [שם הורה],

בתחילת כל חודש אנו מבקשים ממך לדווח כמה עלה לך ניקיון ביתך.

כמות מאושרת: עד 720 ₪
בעזרתך אנחנו יכולים להמשיך לתמוך במשפחתך.

אנא השב למייל זה עם הסכום המדויק.

בברכה,
[חתימה + לוגו עמותה]
```

4. רישום המייל בטבלה `email_logs`
5. הצגת הודעה למזכירה: "נשלחו X מיילים להורים"

> **הערה:** זו שליחה ידנית בלבד - אין cron job אוטומטי

---

## 4. מודול משותף: העברות בנקאיות

### 4.1 מסך העברות

**2 טאבים:**
- **טאב "חתונות יתומים"** — רק העברות של חתונות
- **טאב "ילדים חולים"** — רק העברות של ניקיון

### 4.2 טבלת העברות ממתינות

**עמודות:**
- ☑️ Checkbox (בחירה)
- תאריך יצירה
- משפחה (שם)
- טלפון
- מספר תיק
- סכום בשקלים
- סכום בדולרים (חתונות בלבד)
- שם בעל החשבון
- בנק / סניף / חשבון
- הערות

**סינונים:**
- לפי תאריך
- לפי סטטוס
- לפי שם משפחה
- לפי סכום (טווח)

### 4.3 ייצוא והעברה

**כפתורי ייצוא:**

1. **ייצוא ל-Excel רגיל:**
   - כל השורות המסומנות
   - פורמט טבלת Excel פשוטה

2. **ייצוא ל-Excel Masav:**
   - שימוש בספרייה `npm install masav`
   - פורמט מיוחד למרכז סליקה בנקאי
   - הורדת קובץ

3. **שליחה ישירה ל-Masav:**
   - אינטגרציה ישירה עם מרכז הסליקה (אם קיימת)
   - דורש API key והגדרות

**תהליך אחרי ייצוא:**
1. סטטוס כל התיקים המסומנים משתנה ל-"הועבר"
2. נשמר:
   - תאריך העברה
   - אסמכתא (reference number)
   - קובץ הייצוא
3. שליחת מייל למזכירות:
   - סיכום: כמות העברות
   - סכום כולל
   - קובץ מצורף (Excel/Masav)

### 4.4 טבלת היסטוריית העברות

**עמודות נוספות:**
- סטטוס העברה (הועבר / נכשל / בטיפול)
- תאריך העברה בפועל
- אסמכתא
- קובץ ייצוא (קישור להורדה)

**סינונים:**
- כל הסינונים הקודמים
- + לפי קטגוריה (יתומים / חולים)

---

## 5. ארכיטקטורה טכנית

### 5.1 סטאק טכנולוגי מומלץ

| רובד | טכנולוגיה | הסבר |
|------|-----------|------|
| **Frontend** | Next.js 14+ (App Router) | React framework מודרני |
| **Backend** | Next.js API Routes | Serverless functions |
| **Database** | PostgreSQL | עם תמיכה ב-jsonb |
| **ORM** | Prisma / TypeORM | לניהול סכמה ושאילתות |
| **Hosting** | Vercel | CI/CD אוטומטי |
| **File Storage** | AWS S3 / Vercel Blob | אחסון קבצים מאובטח |
| **AI Translation** | OpenAI API / Claude API | תרגום אוטומטי |
| **Email** | Nodemailer + SMTP | Gmail / SendGrid |
| **MASAV Export** | `npm install masav` | ספריית Node.js |
| **Authentication** | NextAuth.js | משתמש/סיסמה פשוט |

### 5.2 מודל נתונים - טבלאות PostgreSQL

#### טבלה: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'secretary' | 'manager'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### טבלה: `applicants` (טפסים גולמיים)
```sql
CREATE TABLE applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_type VARCHAR(50) NOT NULL, -- 'wedding' | 'cleaning'
  form_data JSONB NOT NULL, -- כל הנתונים מהטופס
  email_sent_to_secretary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### טבלה: `cases` (תיקים)
```sql
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number BIGSERIAL UNIQUE, -- מספר רץ
  case_type VARCHAR(50) NOT NULL, -- 'wedding' | 'cleaning'
  applicant_id UUID REFERENCES applicants(id),
  created_by UUID REFERENCES users(id),
  status VARCHAR(50) NOT NULL, -- 'new' | 'pending_transfer' | 'transferred' | 'rejected' | 'expired' (חתונות) | 'active' | 'inactive' (ניקיון)

  -- שדות חתונה
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

  -- שדות ניקיון
  family_name VARCHAR(100),
  child_name VARCHAR(100),
  parent1_id VARCHAR(20),
  parent1_name VARCHAR(100),
  parent2_id VARCHAR(20),
  parent2_name VARCHAR(100),
  start_date DATE, -- תאריך התחלת תמיכה
  end_date DATE, -- תאריך סיום (NULL אם פעיל)
  end_reason VARCHAR(100), -- 'healed' | 'deceased' | 'other'

  -- שדות משותפים
  address TEXT,
  city VARCHAR(100),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  raw_form_json JSONB, -- עותק מלא של הטופס

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### טבלה: `translations` (תרגומים)
```sql
CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  lang_from VARCHAR(5) DEFAULT 'he',
  lang_to VARCHAR(5) NOT NULL,
  content_json JSONB NOT NULL, -- שדות מתורגמים
  edited_by_user BOOLEAN DEFAULT FALSE,
  translated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### טבלה: `files`
```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  file_type VARCHAR(50) NOT NULL, -- 'menu' | 'invitation' | 'photo' | 'thank_you'
  filename VARCHAR(255) NOT NULL,
  path_or_url TEXT NOT NULL, -- S3 URL או Vercel Blob URL
  size_bytes INTEGER,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

#### טבלה: `bank_details`
```sql
CREATE TABLE bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  bank_number VARCHAR(10) NOT NULL,
  branch VARCHAR(10) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### טבלה: `payments`
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  payment_type VARCHAR(50) NOT NULL, -- 'wedding_transfer' | 'cleaning_monthly'
  payment_month DATE, -- רלוונטי לניקיון (חודש התשלום)

  amount_usd NUMERIC(10, 2), -- רק לחתונות
  amount_ils NUMERIC(10, 2) NOT NULL,
  exchange_rate NUMERIC(10, 4), -- שער המרה

  status VARCHAR(50) NOT NULL, -- 'pending' | 'approved' | 'transferred'
  approved_amount NUMERIC(10, 2),
  approved_by UUID REFERENCES users(id),

  transferred_at TIMESTAMP,
  receipt_reference VARCHAR(255), -- אסמכתא

  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### טבלה: `transfers_export` (יצוא MASAV)
```sql
CREATE TABLE transfers_export (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type VARCHAR(50) NOT NULL, -- 'wedding' | 'cleaning'
  exported_by UUID REFERENCES users(id),
  exported_at TIMESTAMP DEFAULT NOW(),
  filename VARCHAR(255),
  file_url TEXT, -- קישור לקובץ המיוצא
  cases_included JSONB, -- מערך של case_ids
  total_amount NUMERIC(10, 2),
  total_count INTEGER
);
```

#### טבלה: `case_history` (audit log)
```sql
CREATE TABLE case_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id),
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);
```

#### טבלה: `email_logs` (לוג מיילים)
```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  email_type VARCHAR(50) NOT NULL, -- 'monthly_request' | 'approval' | 'transfer_summary'
  recipient_email VARCHAR(255) NOT NULL,
  subject TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'sent' -- 'sent' | 'failed' | 'bounced'
);
```

### 5.3 API Endpoints (REST)

#### Applicants (טפסים גולמיים)
```
POST   /api/applicants          - קבלת טופס חיצוני חדש
GET    /api/applicants          - רשימת טפסים ממתינים (למזכירות)
GET    /api/applicants/:id      - פרטי טופס ספציפי
POST   /api/applicants/:id/approve - אישור טופס ← יוצר תיק
```

#### Cases (תיקים)
```
GET    /api/cases               - רשימת תיקים (עם סינונים)
POST   /api/cases               - יצירת תיק ידני
GET    /api/cases/:id           - פרטי תיק מלאים
PUT    /api/cases/:id           - עדכון פרטי תיק
DELETE /api/cases/:id           - מחיקת תיק (soft delete)
PUT    /api/cases/:id/status    - שינוי סטטוס
```

#### Translations (תרגומים)
```
POST   /api/cases/:id/translate - תרגום אוטומטי (AI)
GET    /api/cases/:id/translations - קבלת תרגומים קיימים
PUT    /api/translations/:id    - עדכון תרגום ידני
```

#### Files (קבצים)
```
POST   /api/cases/:id/files     - העלאת קובץ
GET    /api/cases/:id/files     - רשימת קבצים לתיק
DELETE /api/files/:id           - מחיקת קובץ
```

#### Payments (תשלומים)
```
POST   /api/cases/:id/payments  - יצירת תשלום חדש
GET    /api/cases/:id/payments  - היסטוריית תשלומים
PUT    /api/payments/:id        - עדכון תשלום
POST   /api/payments/convert-currency - המרת USD ← ILS
```

#### Transfers (העברות)
```
GET    /api/transfers           - רשימת העברות ממתינות
GET    /api/transfers/history   - היסטוריית העברות
POST   /api/transfers/export    - ייצוא MASAV (Excel/CSV)
POST   /api/transfers/send      - שליחה ישירה למסב
```

#### Cleaning-specific (ניקיון)
```
POST   /api/cleaning/cases      - יצירת תיק ניקיון (גם פנימי - למזכירה)
POST   /api/cleaning/monthly-report - הזנת דיווח חודשי
GET    /api/cleaning/active     - רשימת משפחות פעילות
POST   /api/cleaning/send-emails - שליחת מיילים חודשיים (ידני - כפתור)
```

#### Dashboard (דשבורד)
```
GET    /api/dashboard/stats     - סטטיסטיקות כלליות
GET    /api/dashboard/calendar  - נתוני לוח שנה עברי
```

### 5.4 תרגום AI - שירות

**שימוש ב-OpenAI / Claude:**

```javascript
// services/translation.service.js
import Anthropic from '@anthropic-ai/sdk';

export async function translateCaseToEnglish(caseData) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `תרגם את הטופס הבא לאנגלית. שמור על מבנה ה-JSON.
החזר JSON עם כל השדות מתורגמים:

${JSON.stringify(caseData, null, 2)}`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }]
  });

  return JSON.parse(message.content[0].text);
}
```

### 5.5 MASAV Export - דוגמת קוד

```javascript
// services/masav.service.js
import { createPaymentFile } from 'masav';

export async function exportToMasav(payments) {
  const paymentData = payments.map(p => ({
    beneficiary_name: p.account_holder_name,
    bank_code: p.bank_number,
    branch_code: p.branch,
    account_number: p.account_number,
    amount: p.approved_amount,
    reference: p.case_number
  }));

  const masavFile = createPaymentFile(paymentData);
  return masavFile; // Buffer או string
}
```

### 5.6 לוח שנה עברי - ספרייה מומלצת

```bash
npm install @hebcal/core
```

```javascript
// utils/hebrewCalendar.js
import { HebrewCalendar, HDate } from '@hebcal/core';

export function getHebrewMonth(year, month) {
  const startDate = new HDate(1, month, year);
  const monthEvents = HebrewCalendar.calendar({
    year: year,
    month: month,
    isHebrewYear: true
  });

  return monthEvents;
}
```

---

## 6. אבטחה ורגולציה

### 6.1 אבטחת מידע

**נתונים רגישים:**
- תעודות זהות (חתן, כלה, הורים)
- פרטי חשבון בנק
- כתובות ומיילים

**אמצעי הגנה:**
1. **HTTPS:** כל התקשורת מוצפנת (Vercel מספק באופן אוטומטי)
2. **Encryption at Rest:** תעודות זהות בהצפנה (PostgreSQL pgcrypto)
3. **Rate Limiting:** הגבלת בקשות מאותו IP (100 בקשות/דקה)
4. **CORS:** הגבלה לדומיין העמותה בלבד
5. **Input Validation:** בדיקת כל קלט מהמשתמש (Zod / Joi)
6. **SQL Injection Prevention:** שימוש ב-Parameterized Queries (Prisma/TypeORM)

### 6.2 אימות (Authentication)

**NextAuth.js עם Credentials Provider:**

```javascript
// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/auth";

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const user = await findUserByEmail(credentials.email);
        if (!user) return null;

        const isValid = await verifyPassword(
          credentials.password,
          user.password_hash
        );

        if (!isValid) return null;
        return { id: user.id, email: user.email, role: user.role };
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" }
});
```

### 6.3 הרשאות (Authorization)

**Middleware לבדיקת תפקידים:**

```javascript
// middleware/auth.js
export function requireRole(roles) {
  return async (req, res, next) => {
    const session = await getSession({ req });
    if (!session || !roles.includes(session.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

// שימוש:
app.post('/api/cases', requireRole(['secretary', 'manager']), createCase);
```

### 6.4 GDPR / פרטיות

**עקרונות:**
1. **Right to Access:** משתמש יכול לבקש את כל הנתונים שלו
2. **Right to Deletion:** אפשרות למחיקת נתונים (anonymization)
3. **Data Retention:** מדיניות שמירת נתונים (כמה שנים?)
4. **Consent:** טופס חיצוני כולל הסכמה לשמירת נתונים

**Anonymization בעת מחיקה:**
```sql
UPDATE cases
SET
  groom_id = 'DELETED',
  bride_id = 'DELETED',
  contact_phone = 'DELETED',
  contact_email = 'DELETED'
WHERE id = :case_id;
```

---

## 7. לוח זמנים ושלבי פיתוח

### 7.1 MVP - שלבי פיתוח מומלצים

#### **Phase 1: תשתית בסיסית (שבוע 1-2)**
- [x] הקמת פרויקט Next.js + PostgreSQL
- [x] הגדרת Prisma / TypeORM
- [x] יצירת טבלאות בסיסיות (users, applicants, cases)
- [x] אימות משתמשים (NextAuth)
- [x] ממשק התחברות

#### **Phase 2: מודול חתונות - טופס וקבלה (שבוע 3-4)**
- [x] טופס חיצוני (public page)
- [x] API: שמירת applicant
- [x] שליחת מייל למזכירות (Nodemailer)
- [x] רשימת בקשות למזכירות
- [x] אישור/דחיה → יצירת תיק

#### **Phase 3: מודול חתונות - ניהול תיק (שבוע 5-7)**
- [x] מסך תיק עם 4 טאבים
- [x] טאב 1: עריכת פרטים בעברית
- [x] טאב 2: תרגום AI + עריכה
- [x] טאב 3: העלאת קבצים (S3/Vercel Blob)
- [x] טאב 4: ניהול תשלומים + המרת מט"ח

#### **Phase 4: מודול חתונות - דשבורד (שבוע 8-9)**
- [x] לוח שנה עברי (hebcal)
- [x] סטטיסטיקות חודשיות
- [x] רשימת תיקים עם סינונים

#### **Phase 5: מודול ילדים חולים (שבוע 10-12)**
- [x] טופס חיצוני + ממשק פנימי למזכירה
- [x] פתיחת תיק אוטומטית
- [x] ניהול תיק: פרטים + תשלומים חודשיים
- [x] הזנה מהירה למספר משפחות
- [x] כפתור שליחת מיילים חודשיים (ידני)

#### **Phase 6: מודול העברות (שבוע 13-14)**
- [x] טבלת העברות ממתינות (2 טאבים)
- [x] ייצוא Excel רגיל
- [x] ייצוא MASAV (ספרייה)
- [x] שליחת מייל סיכום עם קובץ
- [x] עדכון סטטוסים אוטומטי

#### **Phase 7: בדיקות ועיצוב (שבוע 15-16)**
- [x] בדיקות E2E (Playwright/Cypress)
- [x] בדיקות API (Jest)
- [x] UI/UX polish (Tailwind CSS / Shadcn UI)
- [x] Responsive design
- [x] בדיקות אבטחה (penetration testing)

### 7.2 אומדן זמנים

**סה"כ משוער:** 8 שבועות (~2 חודשים)

> **הערה:**
> - תלוי במורכבות בפועל ובשינויים שיתבקשו בדרך
> - תינתן תמיכה ותיקונים בפועל לתקופת זמן הרצה במשך **6 חודשים ממסירת המערכת**

---

## 8. נספחים

### 8.1 JSON Schema - טופס חתונה

```json
{
  "wedding_info": {
    "date_hebrew": "כ' בתשרי תשפ\"ה",
    "date_gregorian": "2024-10-23",
    "city": "ירושלים",
    "guest_count": 300,
    "total_cost": 50000
  },
  "groom_info": {
    "first_name": "דוד",
    "last_name": "כהן",
    "id": "123456789",
    "school": "תיכון תורת חיים",
    "father_name": "משה כהן",
    "father_occupation": "engineer",
    "mother_name": "רחל כהן",
    "mother_occupation": "teacher",
    "marital_status": "single",
    "address": "רחוב הרצל 10",
    "city": "תל אביב",
    "phone": "0501234567",
    "email": "david@example.com",
    "memorial_day": "ט' באב",
    "background": "משפחה מכובדת..."
  },
  "bride_info": {
    "first_name": "שרה",
    "last_name": "לוי",
    "id": "987654321",
    "school": "תיכון בית יעקב",
    "father_name": "יוסף לוי",
    "father_occupation": "doctor",
    "mother_name": "מרים לוי",
    "mother_occupation": "nurse",
    "marital_status": "single",
    "address": "רחוב הנביאים 5",
    "city": "ירושלים",
    "phone": "0509876543",
    "email": "sarah@example.com",
    "memorial_day": "כ' בשבט",
    "background": "..."
  }
}
```

### 8.2 JSON Schema - טופס ניקיון

```json
{
  "family_info": {
    "family_name": "דוד",
    "child_name": "יוסי",
    "parent1_id": "111222333",
    "parent1_name": "אברהם דוד",
    "parent2_id": "444555666",
    "parent2_name": "שרה דוד",
    "address": "רחוב המלאכים 7",
    "city": "פתח תקווה"
  },
  "contact_info": {
    "phone1": "0521111111",
    "phone2": "0522222222",
    "phone3": "0523333333",
    "email": "david.family@example.com"
  },
  "bank_info": {
    "bank_number": "10",
    "branch": "123",
    "account_number": "1234567",
    "account_holder": "אברהם דוד"
  }
}
```

### 8.3 דוגמת MASAV Record

```csv
beneficiary_name,bank_code,branch_code,account_number,amount,reference
דוד כהן,10,123,1234567,5000.00,C2024001
שרה לוי,20,456,7654321,3500.00,C2024002
```

---

## 9. קריטריוני קבלה (Acceptance Criteria)

### מודול חתונות
- [x] משתמש יכול למלא טופס חיצוני ולקבל אישור
- [x] מזכירה מקבלת מייל עם קישור לאישור
- [x] מזכירה יכולה לאשר/לדחות ולפתוח תיק
- [x] תיק כולל 4 טאבים פונקציונליים
- [x] תרגום AI עובד ושומר ב-DB
- [x] העלאת קבצים עובדת (עד 5MB)
- [x] המרת מט"ח USD→ILS עובדת
- [x] ניתן לאשר תשלום ולהעביר לטבלת העברות
- [x] לוח שנה עברי מציג חתונות נכון
- [x] סטטיסטיקות חודשיות מדויקות

### מודול ילדים חולים
- [x] הורה או מזכירה יכולים למלא טופס ותיק נפתח אוטומטית
- [x] מזכירה יכולה לנהל תיק (פרטים + תשלומים)
- [x] הזנה מהירה למספר משפחות עובדת
- [x] כפתור ידני שולח מיילים לכל המשפחות הפעילות
- [x] סגירת תיק עם סיבה עובדת

### מודול העברות
- [x] טבלת העברות מציגה 2 טאבים נפרדים
- [x] ניתן לסמן שורות ולייצא
- [x] ייצוא Excel רגיל עובד
- [x] ייצוא MASAV עובד
- [x] מייל סיכום נשלח עם קובץ מצורף
- [x] סטטוסים מתעדכנים אוטומטית

### כללי
- [x] אימות משתמשים עובד
- [x] כל הטבלאות שומרות audit log (case_history)
- [x] המערכת responsive למובייל
- [x] זמן טעינה < 2 שניות

---

## 10. שאלות פתוחות

1. **Backup:** האם צריך backup יומי אוטומטי של ה-DB?
2. **דיווח חודשי:** האם צריך דוח PDF אוטומטי בסוף כל חודש?
3. **אינטגרציה חשבונאית:** האם צריך ייצוא לתוכנת חשבונאות?
4. **Multi-step form:** האם הטופס החיצוני צריך להיות בשלבים או דף אחד?
5. **SMS notifications:** האם צריך הודעות SMS (בנוסף למייל)?

---

## 11. מסמכים נוספים (להפקה בעתיד)

- [ ] ERD (Entity Relationship Diagram)
- [ ] UI Wireframes (Figma)
- [ ] API Documentation (Swagger/OpenAPI)
- [ ] User Manual (מדריך למזכירות)
- [ ] Deployment Guide (הוראות העלאה לפרודקשן)

---

**סיום מסמך אפיון**

---

**חתימות:**

| תפקיד | שם | חתימה | תאריך |
|-------|-----|--------|-------|
| **מפתח** | _______ | ______ | ______ |
| **מנהל פרויקט** | _______ | ______ | ______ |
| **נציג עמותה** | _______ | ______ | ______ |

---

**גרסה:** 1.0 - מאוחד
**תאריך יצירה:** אוקטובר 2025
**מצב:** ממתין לאישור
