/**
 * Date Utilities
 * פונקציות עזר לעבודה עם תאריכים
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק פונקציות תאריך
 */

/**
 * פורמט תאריך לתצוגה
 * @param dateString - תאריך בפורמט ISO
 * @returns תאריך מפורמט (DD/MM/YYYY)
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * פורמט תאריך עם שעה
 * @param dateString - תאריך בפורמט ISO
 * @returns תאריך ושעה מפורמטים
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * קבלת שם חודש בעברית
 * @param month - מספר חודש (1-12)
 * @returns שם החודש בעברית
 */
export function getHebrewMonth(month: number): string {
  const months = [
    'ינואר',
    'פברואר',
    'מרץ',
    'אפריל',
    'מאי',
    'יוני',
    'יולי',
    'אוגוסט',
    'ספטמבר',
    'אוקטובר',
    'נובמבר',
    'דצמבר',
  ];
  return months[month - 1] || '';
}

/**
 * פורמט חודש ושנה (MM/YYYY)
 * @param date - תאריך או מחרוזת תאריך
 * @returns פורמט MM/YYYY
 */
export function formatMonthYear(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${year}`;
  } catch {
    return '';
  }
}

/**
 * קבלת תאריך היום הראשון בחודש
 * @param year - שנה
 * @param month - חודש (1-12)
 * @returns תאריך של יום 1 בחודש
 */
export function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month - 1, 1);
}

/**
 * בדיקה האם התאריך הנוכחי אחרי ה-15 בחודש
 * @returns true אם היום >= 15
 */
export function isAfter15thOfMonth(): boolean {
  const today = new Date();
  return today.getDate() >= 15;
}
