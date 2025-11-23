# תוכנית שיפוץ לוח שנה עברי עם אירועי מערכת

**תאריך:** נובמבר 2025
**מטרה:** שיפוץ מלא של לוח השנה העברי כך שיציג אירועים מהמערכת (חתונות) בתוך הקוביות

---

## סקירת מצב קיים

### קבצים קיימים
```
src/
├── app/[locale]/(app)/calendar/page.tsx
├── components/calendar/
│   ├── HebrewCalendar.tsx      # קומפוננטה ראשית
│   ├── HebrewMonthGrid.tsx     # גריד החודש
│   ├── HebrewDayCell.tsx       # קוביית יום
│   ├── MonthNavigation.tsx     # ניווט בין חודשים
│   ├── CalendarLegend.tsx      # מקרא צבעים
│   └── types.ts                # טיפוסים
└── lib/hebcal-utils.ts         # פונקציות עזר
```

### בעיות במצב הנוכחי
1. **לא מחובר לנתוני המערכת** - מציג רק חגים/שבתות מ-@hebcal/core
2. **עיצוב לא תואם** - לא משתמש ב-shadcn/ui כמו שאר המערכת
3. **אין שליפת חתונות** - לא קורא מטבלת cases
4. **אין התאמה לתאריך עברי** - החתונות נשמרות עם `wedding_date_hebrew` כטקסט

---

## ארכיטקטורה חדשה

### מבנה טיפוסים מורחב

```typescript
// types.ts - הרחבה
export interface CalendarEvent {
  id: string;
  type: 'wedding' | 'holiday' | 'rosh_chodesh';
  title: string;
  titleEn?: string;
  hebrewDate: string;     // "ו כסלו"
  gregorianDate: Date;
  status?: string;
  caseNumber?: number;
  color: string;          // לסימון בלוח
}

export interface HebrewDayData {
  hdate: HDate;
  gregDate: Date;
  events: Event[];         // אירועי @hebcal/core
  calendarEvents: CalendarEvent[];  // אירועי המערכת (חתונות)
  isShabbat: boolean;
  isHoliday: boolean;
  isRoshChodesh: boolean;
  hebrewDateStr: string;
  gregDateStr: string;
}
```

### זרימת נתונים

```
1. CalendarPage (Server Component)
   └─> שליפת חתונות לחודש הנבחר מ-Supabase

2. HebrewCalendar (Client Component)
   ├─> מקבל events כ-prop
   ├─> מנהל state של חודש נוכחי
   └─> מייצר monthData עם אירועים

3. HebrewDayCell (Client Component)
   ├─> מציג תאריך עברי + לועזי
   ├─> מציג חגים (@hebcal/core)
   └─> מציג אירועי חתונות (מהמערכת)
```

---

## שלבי יישום מפורטים

### שלב 1: הכנת תשתית נתונים

#### 1.1 יצירת hook לשליפת חתונות
**קובץ:** `src/lib/hooks/useCalendarEvents.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { CalendarEvent } from '@/components/calendar/types';

export function useCalendarEvents(
  hebrewMonth: number,
  hebrewYear: number
) {
  return useQuery({
    queryKey: ['calendar-events', hebrewMonth, hebrewYear],
    queryFn: async () => {
      // שליפת חתונות לחודש
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_number, wedding_date_hebrew, wedding_date_gregorian, groom_first_name, bride_first_name, status')
        .eq('case_type', 'wedding')
        .not('status', 'eq', 'rejected')
        // סינון לפי חודש עברי - ראה 1.2

      if (error) throw error;
      return transformToCalendarEvents(data);
    },
  });
}
```

#### 1.2 פונקציות המרה תאריך עברי
**קובץ:** `src/lib/utils/hebrew-date-parser.ts`

```typescript
/**
 * ממיר מחרוזת תאריך עברי ("ו כסלו תשפ״ה") לאובייקט
 */
export function parseHebrewDateString(hebrewDate: string): {
  day: number;
  month: string;
  year: number;
} | null {
  // פירסור של מחרוזות כמו "ו כסלו תשפ״ה"
  // או "כ״ג אדר תשפ״ה"
}

/**
 * בודק אם תאריך עברי שייך לחודש מסוים
 */
export function isInHebrewMonth(
  hebrewDateStr: string,
  month: number,
  year: number
): boolean {
  // השוואה
}

/**
 * ממיר יום בחודש לתאריך גרגוריאני
 */
export function hebrewDayToGregorian(
  day: number,
  month: number,
  year: number
): Date {
  const hdate = new HDate(day, month, year);
  return hdate.greg();
}
```

### שלב 2: עדכון קומפוננטות

#### 2.1 עדכון HebrewCalendar.tsx
- הוספת prop ל-events מהמערכת
- שילוב עם monthData
- שימוש ב-shadcn/ui Card

#### 2.2 עדכון HebrewDayCell.tsx
- הצגת אירועי חתונות
- עיצוב עם Badge מ-shadcn
- tooltip עם פרטים
- קליק לפתיחת התיק

#### 2.3 עדכון HebrewMonthGrid.tsx
- שיפור responsive
- הוספת מקרא לחתונות

#### 2.4 עדכון CalendarLegend.tsx
- הוספת צבע לחתונות
- שימוש ב-shadcn Badge

### שלב 3: API Route לשליפת אירועים

**קובץ:** `src/app/api/calendar/events/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  const supabase = createClient();

  // שליפת כל החתונות שהתאריך העברי שלהן בחודש הנבחר
  const { data, error } = await supabase
    .from('cases')
    .select(`
      id,
      case_number,
      wedding_date_hebrew,
      wedding_date_gregorian,
      groom_first_name,
      bride_first_name,
      status
    `)
    .eq('case_type', 'wedding')
    .neq('status', 'rejected');

  // סינון צד לקוח לפי חודש עברי
  // (כי ה-wedding_date_hebrew הוא טקסט)

  return NextResponse.json(filteredData);
}
```

### שלב 4: עדכון דף הלוח שנה

**קובץ:** `src/app/[locale]/(app)/calendar/page.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import HebrewCalendar from '@/components/calendar/HebrewCalendar';
import { getTranslations } from 'next-intl/server';

export default async function CalendarPage() {
  const t = await getTranslations('calendar');

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HebrewCalendar />
        </CardContent>
      </Card>
    </div>
  );
}
```

### שלב 5: עיצוב קוביית יום עם אירועים

**עיצוב חדש ל-HebrewDayCell:**

```tsx
// סכמת צבעים לאירועים
const EVENT_COLORS = {
  wedding: 'bg-pink-100 dark:bg-pink-900/30 border-pink-300',
  holiday: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300',
  rosh_chodesh: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300',
};

// בתוך הקוביה
{calendarEvents.map((event) => (
  <TooltipProvider key={event.id}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          "text-xs px-1 py-0.5 rounded cursor-pointer truncate",
          EVENT_COLORS[event.type]
        )}>
          {event.type === 'wedding'
            ? `${event.title}` // "שם חתן & שם כלה"
            : event.title
          }
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <p className="font-bold">{event.title}</p>
          {event.caseNumber && (
            <p>תיק #{event.caseNumber}</p>
          )}
          <p>{event.hebrewDate}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
))}
```

---

## מפרט UI/UX

### עיצוב קוביית יום

```
┌─────────────────────────┐
│ ו        6              │  ← תאריך עברי (גדול) + לועזי (קטן)
│                         │
│ ┌─────────────────────┐ │
│ │ דני & רינה        │ │  ← אירוע חתונה (ורוד)
│ └─────────────────────┘ │
│                         │
│ פרשת וישלח              │  ← פרשת שבוע (כחול)
└─────────────────────────┘
```

### צבעים

| סוג | רקע | גבול |
|-----|-----|------|
| חתונה | pink-100 | pink-300 |
| חג | purple-100 | purple-300 |
| ראש חודש | amber-100 | amber-300 |
| שבת | blue-50 | blue-200 |

### Responsive

- **Desktop (lg+):** גריד 7 עמודות מלא
- **Tablet (md):** גריד 7 עמודות קטן יותר
- **Mobile (sm):** תצוגת רשימה או גלילה אופקית

---

## תרגומים נדרשים

**messages/he.json:**
```json
{
  "calendar": {
    "title": "לוח שנה עברי",
    "subtitle": "תאריכים עבריים ואירועים",
    "legend": {
      "wedding": "חתונה",
      "shabbat": "שבת",
      "holiday": "חג",
      "roshChodesh": "ראש חודש"
    },
    "noEvents": "אין אירועים",
    "caseNumber": "תיק מספר",
    "viewCase": "צפה בתיק"
  }
}
```

---

## רשימת משימות ליישום

### Phase 1: תשתית (1-2)
- [ ] 1. יצירת `hebrew-date-parser.ts` עם פונקציות פירסור
- [ ] 2. יצירת hook `useCalendarEvents.ts`

### Phase 2: API (3)
- [ ] 3. יצירת API route `calendar/events`

### Phase 3: עדכון Types (4)
- [ ] 4. עדכון `types.ts` עם CalendarEvent

### Phase 4: קומפוננטות (5-9)
- [ ] 5. שיפוץ `HebrewCalendar.tsx` עם shadcn Card
- [ ] 6. שיפוץ `HebrewDayCell.tsx` עם אירועי מערכת
- [ ] 7. עדכון `HebrewMonthGrid.tsx`
- [ ] 8. עדכון `CalendarLegend.tsx`
- [ ] 9. עדכון `calendar/page.tsx`

### Phase 5: עיצוב ו-UX (10-11)
- [ ] 10. הוספת Tooltips לאירועים
- [ ] 11. הוספת קליק לניווט לתיק

### Phase 6: תרגומים (12)
- [ ] 12. עדכון קבצי תרגום

### Phase 7: בדיקות (13)
- [ ] 13. בדיקה שהכל עובד עם נתונים אמיתיים

---

## אתגרים טכניים

### 1. פירסור תאריך עברי מטקסט
התאריך העברי נשמר כ-string ("ו כסלו תשפ״ה").
**פתרון:** פונקציית פירסור שתומכת בפורמטים שונים.

### 2. סינון לפי חודש עברי ב-Supabase
לא ניתן לסנן ישירות לפי חודש עברי בשאילתה.
**פתרון:** שליפת כל החתונות וסינון צד לקוח.

### 3. שנים מעוברות
אדר א' ואדר ב'.
**פתרון:** שימוש ב-@hebcal/core לבדיקת שנה מעוברת.

### 4. ביצועים
טעינת הרבה נתונים.
**פתרון:** React Query עם caching + pagination אם צריך.

---

## קבצים שייווצרו/יעודכנו

### חדשים:
- `src/lib/utils/hebrew-date-parser.ts`
- `src/lib/hooks/useCalendarEvents.ts`
- `src/app/api/calendar/events/route.ts`

### עדכון:
- `src/components/calendar/types.ts`
- `src/components/calendar/HebrewCalendar.tsx`
- `src/components/calendar/HebrewDayCell.tsx`
- `src/components/calendar/HebrewMonthGrid.tsx`
- `src/components/calendar/CalendarLegend.tsx`
- `src/app/[locale]/(app)/calendar/page.tsx`
- `messages/he.json`
- `messages/en.json`

---

## סיכום

התוכנית מתמקדת ב:
1. **חיבור לנתונים אמיתיים** - חתונות מ-Supabase
2. **עיצוב מותאם** - shadcn/ui כמו שאר המערכת
3. **UX טוב** - tooltips, קליק לניווט
4. **i18n מלא** - עברית ואנגלית
5. **קוד נקי** - לפי AI_DEVELOPMENT_GUIDE.md

---

**מוכן ליישום!**
