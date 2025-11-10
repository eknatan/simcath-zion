# הגדרת MASAV לייצוא העברות בנקאיות

## מה זה MASAV?

MASAV (מערכת סליקה אוטומטית בינבנקאית) הוא פורמט תקני בנקאי של בנק ישראל המאפשר ביצוע העברות בנקאיות מרובות במסגרת קובץ אחד.

---

## דרישות מקדימות

לפני שניתן להשתמש בייצוא MASAV, יש להשיג מהבנק את הפרטים הבאים:

### 1. מספר מוסד (Institution ID)
- מספר ייחודי בן **8 ספרות** שהבנק מקצה לארגון
- נדרש לזיהוי המוסד במערכת הבנקאית
- **איפה מקבלים?** פנה למנהל החשבון בבנק וביקש "מספר מוסד להעברות MASAV"

### 2. פרטי חשבון המוסד
החשבון **ממנו יוצאים התשלומים**:
- **קוד בנק** (2 ספרות) - לדוגמה: 12 (הפועלים), 10 (לאומי)
- **קוד סניף** (3 ספרות) - לדוגמה: 345
- **מספר חשבון** - לדוגמה: 1234567

### 3. שם המוסד
- השם המופיע בקובץ MASAV
- בדרך כלל: "Shimchat Zion" או השם הרשמי של העמותה

---

## הגדרת המערכת

לאחר קבלת הפרטים מהבנק, יש לעדכן את ההגדרות במערכת:

### אופן 1: דרך SQL (מומלץ למפתחים)

התחבר ל-Supabase ורוץ:

```sql
UPDATE system_settings
SET setting_value = '{
  "institution_id": "12345678",        -- החלף במספר המוסד שקיבלת
  "institution_name": "Shimchat Zion", -- שם המוסד
  "bank_code": "12",                   -- קוד הבנק של החשבון
  "branch_code": "345",                -- קוד הסניף
  "account_number": "1234567",         -- מספר החשבון
  "sequence_number": "001"             -- השאר 001 (ישתנה אוטומטית)
}'::jsonb
WHERE setting_key = 'masav_organization';
```

### אופן 2: דרך Supabase Dashboard

1. היכנס ל-Supabase Dashboard
2. עבור ל-**Table Editor** → `system_settings`
3. מצא את השורה עם `setting_key = 'masav_organization'`
4. ערוך את `setting_value` עם הפרטים שלך:

```json
{
  "institution_id": "12345678",
  "institution_name": "Shimchat Zion",
  "bank_code": "12",
  "branch_code": "345",
  "account_number": "1234567",
  "sequence_number": "001"
}
```

---

## בדיקת התצורה

לאחר עדכון ההגדרות, בצע את הבדיקות הבאות:

### 1. בדוק שההגדרות נשמרו
```sql
SELECT setting_value
FROM system_settings
WHERE setting_key = 'masav_organization';
```

### 2. בדוק שכל השדות מלאים
וודא שכל השדות הבאים קיימים:
- ✅ `institution_id` (8 ספרות)
- ✅ `institution_name` (מלא)
- ✅ `bank_code` (2 ספרות)
- ✅ `branch_code` (3 ספרות)
- ✅ `account_number` (מלא)

---

## שגיאות נפוצות

### "MASAV organization settings not configured"
**פתרון:** ההגדרות לא קיימות במערכת. הרץ את migration:
```bash
npx supabase migration up
```

### "Missing required MASAV setting: institution_id"
**פתרון:** אחד מהשדות הנדרשים ריק. בדוק את ההגדרות ב-`system_settings`.

### "Failed to record export"
**פתרון:** בעיה ב-JSONB casting - תוקנה בגרסה האחרונה של המערכת.

---

## מידע נוסף

### מספרי בנקים נפוצים בישראל
- **10** - בנק לאומי
- **11** - בנק דיסקונט
- **12** - בנק הפועלים
- **13** - בנק אגוד
- **14** - בנק אוצר החייל
- **17** - בנק מרכנתיל
- **20** - בנק מזרחי טפחות
- **31** - הבנק הבינלאומי
- **54** - בנק ירושלים

### קישורים שימושיים
- [תקן MASAV - בנק ישראל](https://www.boi.org.il/he/PaymentAndSettlementSystems/Masav/)
- [מדריך למילוי קובץ MASAV](https://www.boi.org.il/he/PaymentAndSettlementSystems/Masav/Documents/masav_guide.pdf)

---

## תמיכה

במקרה של בעיות או שאלות:
1. בדוק את הלוגים ב-`src/lib/services/masav-server.service.ts:74`
2. ודא שיש לך את כל הפרטים מהבנק
3. פנה למנהל המערכת או למפתח

---

**תאריך עדכון אחרון:** נובמבר 2025
