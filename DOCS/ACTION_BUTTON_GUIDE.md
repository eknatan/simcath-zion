# 🎯 ActionButton - מדריך שימוש

**תאריך:** 2025-10-28 (עודכן)
**סטטוס:** ✅ פעיל במערכת
**גרסה:** B - Soft & Matte (עדין ומאטי)

---

## 📖 מהו ActionButton?

`ActionButton` הוא רכיב משותף שמחליף את השימוש הישיר ב-`Button` עם classes ידניים.

**הבעיה שהוא פותר:**
- ✅ שליטה מרכזית על עיצוב כפתורים
- ✅ עקביות בכל המערכת
- ✅ התאמה אוטומטית לגרסת העיצוב הפעילה
- ✅ קל לתחזוקה - שינוי במקום אחד משפיע על כולם

---

## 🚀 איך להשתמש?

### Import

```tsx
import { ActionButton } from '@/components/shared/ActionButton';
```

---

## 🎨 Variants זמינים

### 1. כפתורי Outline (לטבלאות ורשימות) - **גרסה B: עדין ומאטי**

#### `variant="view"` - צפייה (slate - אפור עדין)
```tsx
<ActionButton variant="view" size="sm">
  <Eye className="h-4 w-4 me-1" />
  צפה
</ActionButton>
```
**סגנון:** `border-slate-300 text-slate-700 hover:bg-slate-50`
- גבול עדין, לא בולט מדי
- טקסט אפור בינוני
- hover עדין

#### `variant="approve"` - אישור (emerald - ירוק רך)
```tsx
<ActionButton variant="approve" size="sm">
  <CheckCircle2 className="h-4 w-4 me-1" />
  אשר
</ActionButton>
```
**סגנון:** `border-emerald-200 text-emerald-700 hover:bg-emerald-50`
- ירוק רך, לא בוהק
- גבול עדין מאוד
- hover ירוק פסטל

#### `variant="reject"` - דחייה (rose - אדום רך)
```tsx
<ActionButton variant="reject" size="sm">
  <XCircle className="h-4 w-4 me-1" />
  דחה
</ActionButton>
```
**סגנון:** `border-rose-200 text-rose-700 hover:bg-rose-50`
- אדום רך, לא אגרסיבי
- גבול עדין
- hover ורוד פסטל

#### `variant="restore"` - שחזור (sky - כחול רך)
```tsx
<ActionButton variant="restore" size="sm">
  <RotateCcw className="h-4 w-4 me-1" />
  שחזר
</ActionButton>
```
**סגנון:** `border-sky-200 text-sky-700 hover:bg-sky-50`
- כחול רך, לא חזק
- גבול עדין
- hover תכלת פסטל

#### `variant="cancel"` - ביטול (slate - אפור עדין)
```tsx
<ActionButton variant="cancel">
  <X className="h-4 w-4 me-2" />
  ביטול
</ActionButton>
```
**סגנון:** `border-slate-200 text-slate-600 hover:bg-slate-50`
- אפור עדין מאוד
- גבול דק ועדין

---

### 2. כפתורי Primary (לדיאלוגים - עם רקע מלא) - **גרסה B: מאטי**

#### `variant="approve-primary"` - אישור ראשי (emerald - ירוק רך)
```tsx
<ActionButton variant="approve-primary">
  <CheckCircle2 className="h-4 w-4 me-2" />
  אשר
</ActionButton>
```
**סגנון:** `bg-emerald-600 hover:bg-emerald-700 shadow-sm`
- רקע ירוק רך (לא ירוק בוהק)
- shadow מינימלי
- מאטי, לא מבריק

#### `variant="reject-primary"` - דחייה ראשית (rose - אדום רך)
```tsx
<ActionButton variant="reject-primary">
  <XCircle className="h-4 w-4 me-2" />
  דחה
</ActionButton>
```
**סגנון:** `bg-rose-600 hover:bg-rose-700 shadow-sm`
- רקע אדום רך (לא אדום חזק)
- shadow מינימלי
- מאטי, לא מבריק

#### `variant="restore-primary"` - שחזור ראשי (sky - כחול רך)
```tsx
<ActionButton variant="restore-primary">
  <RotateCcw className="h-4 w-4 me-2" />
  שחזר
</ActionButton>
```
**סגנון:** `bg-sky-600 hover:bg-sky-700 shadow-sm`
- רקע כחול רך (לא כחול חזק)
- shadow מינימלי
- מאטי, לא מבריק

#### `variant="primary"` - כפתור ראשי רגיל (sky - כחול רך)
```tsx
<ActionButton variant="primary">
  שמור
</ActionButton>
```
**סגנון:** `bg-sky-600 hover:bg-sky-700 shadow-sm`
- כחול רך במקום כחול חזק

---

## 📚 דוגמאות שלמות

### דוגמה 1: שורה בטבלה עם פעולות

```tsx
<div className="flex gap-2">
  <ActionButton variant="view" size="sm" onClick={() => handleView(item)}>
    <Eye className="h-4 w-4 me-1" />
    {t('actions.view')}
  </ActionButton>

  <ActionButton variant="approve" size="sm" onClick={() => handleApprove(item)}>
    <CheckCircle2 className="h-4 w-4 me-1" />
    {t('actions.approve')}
  </ActionButton>

  <ActionButton variant="reject" size="sm" onClick={() => handleReject(item)}>
    <XCircle className="h-4 w-4 me-1" />
    {t('actions.reject')}
  </ActionButton>
</div>
```

### דוגמה 2: דיאלוג עם כפתורי אישור/ביטול

```tsx
<AlertDialogFooter className="gap-3">
  <AlertDialogCancel asChild>
    <ActionButton variant="cancel">
      <X className="h-4 w-4 me-2" />
      {t('cancel')}
    </ActionButton>
  </AlertDialogCancel>

  <ActionButton
    variant="approve-primary"
    onClick={handleConfirm}
    disabled={isLoading}
  >
    {isLoading ? (
      <Loader2 className="h-4 w-4 me-2 animate-spin" />
    ) : (
      <CheckCircle2 className="h-4 w-4 me-2" />
    )}
    {isLoading ? t('approving') : t('confirm')}
  </ActionButton>
</AlertDialogFooter>
```

---

## ⚙️ Props זמינים

ActionButton מקבל את כל ה-props של `Button` מ-shadcn/ui, פרט ל-`variant`:

```tsx
interface ActionButtonProps {
  variant?: ActionButtonVariant; // רשימה מלאה למעלה
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onClick?: () => void;
  disabled?: boolean;
  className?: string; // לעיצוב נוסף
  children: React.ReactNode;
  // ...כל props אחר של Button
}
```

---

## 🎨 איך זה עובד מאחורי הקלעים?

### גרסה B - Soft & Matte (עדין ומאטי):

```tsx
// ActionButton משתמש ב-ActiveDesignTokens
const { components } = ActiveDesignTokens;

// עבור outline buttons - Version B
'border-slate-300 text-slate-700 hover:bg-slate-50'      // view
'border-emerald-200 text-emerald-700 hover:bg-emerald-50' // approve
'border-rose-200 text-rose-700 hover:bg-rose-50'         // reject
'border-sky-200 text-sky-700 hover:bg-sky-50'            // restore

// עבור primary buttons - Version B
'bg-emerald-600 hover:bg-emerald-700 shadow-sm'  // approve-primary
'bg-rose-600 hover:bg-rose-700 shadow-sm'        // reject-primary
'bg-sky-600 hover:bg-sky-700 shadow-sm'          // restore-primary
```

**העקרונות:**
1. ✅ **צבעים עדינים** - emerald/rose/sky/slate במקום green/red/blue
2. ✅ **גבולות דקים** - `border` במקום `border-2`
3. ✅ **shadow מינימלי** - `shadow-sm` במקום `shadow-lg`
4. ✅ **מאטי** - לא מבריק, עדין לעין
5. ✅ **פחות צבעוני** - מקצועי יותר

**כשמחליפים גרסה (A ↔ B):**
- העיצוב משתנה אוטומטית!
- לא צריך לשנות קוד בכל מקום!

---

## ⚠️ חוקים חשובים

### ✅ עשה

```tsx
// 1. השתמש ב-ActionButton לכפתורי פעולה
<ActionButton variant="approve">אשר</ActionButton>

// 2. השתמש ב-size מתאים
<ActionButton variant="view" size="sm">צפה</ActionButton>

// 3. הוסף אייקונים רלוונטיים
<ActionButton variant="reject">
  <XCircle className="h-4 w-4 me-1" />
  דחה
</ActionButton>
```

### ❌ אל תעשה

```tsx
// 1. אל תשתמש ב-Button עם classes ידניים
<Button className="border-2 border-blue-600">לא טוב</Button>

// 2. אל תעקוף את ActionButton
<button className="bg-blue-600">ממש לא טוב</button>

// 3. אל תשכפל styles
const customButton = "border-blue-600 text-blue-600"; // לא!
```

---

## 🔄 מעבר מ-Button ישן ל-ActionButton

### לפני (ישן):

```tsx
<Button
  variant="outline"
  size="sm"
  className="border-2 border-green-600 text-green-600 hover:bg-green-50 font-semibold"
  onClick={handleApprove}
>
  <CheckCircle2 className="h-4 w-4 me-1" />
  {t('approve')}
</Button>
```

### אחרי (חדש):

```tsx
<ActionButton
  variant="approve"
  size="sm"
  onClick={handleApprove}
>
  <CheckCircle2 className="h-4 w-4 me-1" />
  {t('approve')}
</ActionButton>
```

**הרווחנו:**
- ✅ פחות קוד
- ✅ יותר קריא
- ✅ עקבי עם המערכת
- ✅ משתנה אוטומטית עם גרסת העיצוב

---

## 📍 איפה משתמשים?

### ברשימות וטבלאות:
- `variant="view"` - לצפייה
- `variant="approve"` - לאישור
- `variant="reject"` - לדחייה
- `variant="restore"` - לשחזור

### בדיאלוגים:
- `variant="approve-primary"` - כפתור אישור
- `variant="reject-primary"` - כפתור דחייה
- `variant="restore-primary"` - כפתור שחזור
- `variant="cancel"` - כפתור ביטול

---

## 🧪 כיצד לבדוק?

1. **חפש בקוד:**
   ```bash
   grep -r "ActionButton" src/
   ```

2. **בדוק שכל הכפתורים עקביים:**
   - כחול = view / restore
   - ירוק = approve
   - אדום = reject
   - אפור = cancel

3. **בדוק responsive:**
   - על מובייל
   - על טאבלט
   - על דסקטופ

---

## 🔧 תחזוקה

### להוסיף variant חדש:

1. **עדכן את הטייפ:**
   ```tsx
   export type ActionButtonVariant =
     | 'existing-variants'
     | 'new-variant'; // הוסף כאן
   ```

2. **הוסף case בפונקציה:**
   ```tsx
   case 'new-variant':
     return 'new-classes-here';
   ```

3. **עדכן תיעוד:**
   - `DESIGN_SYSTEM.md`
   - `ACTION_BUTTON_GUIDE.md` (קובץ זה)

---

**תאריך אחרון עודכן:** 2025-10-28
**מחבר:** Claude Code Assistant
**סטטוס:** ✅ **פעיל ב-production**
