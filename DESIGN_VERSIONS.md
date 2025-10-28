# 🔄 מדריך החלפת גרסאות עיצוב

## מבנה הקבצים

```
src/
├── lib/
│   └── design-tokens.ts          # הגדרות שתי הגרסאות
├── app/
│   ├── globals.css               # CSS גלובלי עם משתני צבעים
│   └── [locale]/(app)/
│       └── design-preview/       # דף להשוואה בין גרסאות
│           └── page.tsx
└── DESIGN_SYSTEM.md              # מסמך מערכת העיצוב המלא
```

---

## 🎨 שתי הגרסאות

### גרסה A - Rich & Dynamic (עשיר ודינמי)

**מאפיינים:**
- גרדיאנטים חזקים וצבעוניים
- צללים דרמטיים (shadow-lg, shadow-xl)
- אפקטים של hover (העלאה של כרטיסים)
- צבעים עזים ומודרניים
- border-2 (גבולות עבים יותר)

**מתאים ל:**
- סטארטאפים ומערכות טכנולוגיות
- קהל צעיר
- מערכות דינמיות ומשתנות
- דשבורדים עם הרבה נתונים

**קוד דוגמה:**
```tsx
<Card className="border-2 border-blue-100 shadow-lg hover:shadow-xl hover:-translate-y-1">
  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-50/50 to-transparent" />
  {/* Content */}
</Card>
```

---

### גרסה B - Elegant & Soft (אלגנטי ורך) ⭐ **פעיל כרגע** ✅

**מאפיינים:**
- צבעים פסטליים ורכים
- צללים עדינים (shadow-md)
- ללא אפקטי transform
- גישה מינימליסטית
- border רגיל (דק)

**כפתורים (ActionButton) - עדכון חדש 2025-10-28:**
- צבעים **עדינים ומאטיים**: emerald, rose, sky, slate
- גבולות **דקים**: `border` (לא `border-2`)
- shadows **מינימליים**: `shadow-sm`
- **פחות צבעוני**, יותר מקצועי
- סגנון **מט** - ללא ברק

**מתאים ל:**
- סביבות משרדיות מסורתיות
- ארגוני צדקה ועמותות
- קהל בוגר יותר
- מערכות שנועדו לעבודה ממושכת

**קוד דוגמה:**
```tsx
// Card
<Card className="border border-slate-200 shadow-md hover:shadow-xl bg-gradient-to-br from-white to-blue-50/30">
  {/* Content */}
</Card>

// Button (חדש!)
<ActionButton variant="approve">
  אשר
</ActionButton>
// במקום:
// <Button className="border-2 border-green-600 text-green-600">
```

---

## 🔄 איך להחליף בין גרסאות

### שיטה 1: החלפה גלובלית (מומלץ)

1. **פתח את הקובץ** `src/lib/design-tokens.ts`

2. **שנה את השורה:**
   ```typescript
   export const ACTIVE_DESIGN_VERSION: DesignVersion = 'B';
   ```

   ל:
   ```typescript
   export const ACTIVE_DESIGN_VERSION: DesignVersion = 'A';
   ```

3. **הפעל מחדש את השרת:**
   ```bash
   npm run dev
   ```

4. **רענן את הדפדפן** - כל המערכת תעבור לגרסה החדשה

---

### שיטה 2: עדכון ידני של קבצים ספציפיים

אם רוצה להחליף רק רכיבים מסוימים:

#### עדכון `globals.css`

**גרסה A:**
```css
:root {
  --primary: oklch(0.60 0.20 252);
  --success: oklch(0.65 0.18 145);
  /* ... */
}
```

**גרסה B:**
```css
:root {
  --primary: oklch(0.55 0.14 230);
  --success: oklch(0.62 0.14 150);
  /* ... */
}
```

#### עדכון רכיבים

**Card Component - גרסה A:**
```tsx
<Card className="border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
```

**Card Component - גרסה B:**
```tsx
<Card className="border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300">
```

---

## 🧪 בדיקה לפני החלפה

### 1. צפה בדף ההשוואה

```bash
npm run dev
```

גש ל: `http://localhost:3000/he/design-preview`

בדף זה תוכל לראות את שתי הגרסאות זו לצד זו.

### 2. בדוק רכיבים ספציפיים

**Stats Cards:**
- גרסה A: צבעוניים עם גרדיאנטים חזקים
- גרסה B: רכים עם גרדיאנטים עדינים

**Buttons:**
- גרסה A: `bg-gradient-to-r from-blue-600 to-blue-700`
- גרסה B: `bg-blue-600 hover:bg-blue-700`

**Badges:**
- גרסה A: `bg-gradient-to-r from-blue-500 to-blue-600 text-white`
- גרסה B: `bg-blue-100 text-blue-700 border border-blue-200`

---

## 📋 Checklist להחלפה

לפני שמחליפים גרסה בסביבת production:

- [ ] בדקתי את שתי הגרסאות בדף ההשוואה
- [ ] קיבלתי אישור מהלקוח
- [ ] בדקתי את הצבעים בכל הדפים הקיימים
- [ ] וידאתי שהנגישות נשמרה (ניגודיות)
- [ ] בדקתי ב-Dark Mode
- [ ] בדקתי על מכשירים ניידים
- [ ] עדכנתי את התיעוד

---

## 🎯 מה קורה כשמחליפים

### קבצים שמושפעים אוטומטית:

1. **כל הדפים במערכת** - צבעים משתנים
2. **כל הכרטיסים** - סגנון ה-border וה-shadow
3. **כל הכפתורים** - סגנון הרקע וה-hover
4. **כל ה-Badges** - סגנון וצבעים

### קבצים שצריך לעדכן ידנית:

1. **globals.css** - משתני הצבעים (אם לא משתמש ב-design-tokens)
2. **tailwind.config.ts** - צבעי Tailwind מותאמים
3. **רכיבים קיימים** - אם יש override ידני של classes

---

## 💡 טיפים

### טיפ 1: שמור גיבוי לפני שינוי

```bash
git add .
git commit -m "Before design version change"
```

### טיפ 2: בדוק בכל הדפים

רשימת דפים לבדיקה:
- `/dashboard`
- `/calendar`
- `/cases/wedding`
- `/cases/cleaning`
- `/applicants`
- `/transfers`
- `/settings`

### טיפ 3: קבל פידבק מהלקוח

שלח ללקוח את הלינק: `/design-preview`
תן לו לבחור איזו גרסה הוא מעדיף.

---

## 🆘 פתרון בעיות

### הצבעים לא משתנים

1. נקה את ה-cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. רענן עם Ctrl+Shift+R (hard refresh)

### רק חלק מהרכיבים משתנים

סימן שיש override ידני. חפש ב-code:
```bash
grep -r "bg-gradient-to-r" src/
```

### הגרסה החדשה לא נראית טוב

חזור לגרסה הקודמת:
```typescript
export const ACTIVE_DESIGN_VERSION: DesignVersion = 'B';
```

---

## 📊 טבלת השוואה מהירה

| מאפיין | גרסה A | גרסה B |
|--------|--------|--------|
| גרדיאנטים | חזקים | עדינים |
| צללים | shadow-lg | shadow-md |
| borders | border-2 | border |
| hover effects | ✅ translate | ❌ |
| צבעוניות | גבוהה | בינונית |
| מינימליזם | נמוך | גבוה |
| מודרניות | מאוד | בינונית-גבוהה |

---

## 📞 תמיכה

אם יש בעיה בהחלפה או שמשהו לא עובד:

1. בדוק את `DESIGN_SYSTEM.md` למידע מפורט
2. צפה בדף `/design-preview` להשוואה
3. בדוק את `design-tokens.ts` לקונפיגורציה

---

**עדכון אחרון:** 2025-10-28 (עודכן פעמיים)
**גרסה פעילה:** B (Elegant & Soft) ✅
**שינויים:**
1. תוקן באג בלוגיקה (design-tokens.ts:202)
2. **נוסף ActionButton** - כפתורים משותפים עם צבעים עדינים ומאטיים
3. כפתורים עודכנו: emerald, rose, sky, slate (במקום green, red, blue)
4. גבולות דקים (`border` לא `border-2`)
5. shadows מינימליים (`shadow-sm`)

**מסמך זה עודכן בכל פעם שמתבצע שינוי במערכת העיצוב**
