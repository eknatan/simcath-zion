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
