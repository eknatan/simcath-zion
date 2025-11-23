import { HDate, gematriya, months } from '@hebcal/core';

/**
 * Hebrew month names in Hebrew
 */
const HEBREW_MONTH_NAMES: Record<number, string> = {
  [months.NISAN]: 'ניסן',
  [months.IYYAR]: 'אייר',
  [months.SIVAN]: 'סיון',
  [months.TAMUZ]: 'תמוז',
  [months.AV]: 'אב',
  [months.ELUL]: 'אלול',
  [months.TISHREI]: 'תשרי',
  [months.CHESHVAN]: 'חשון',
  [months.KISLEV]: 'כסלו',
  [months.TEVET]: 'טבת',
  [months.SHVAT]: 'שבט',
  [months.ADAR_I]: 'אדר',
  [months.ADAR_II]: "אדר ב'",
};

/**
 * Get current Hebrew year from today's date
 */
export function getCurrentHebrewYear(): number {
  const today = new HDate(new Date());
  return today.getFullYear();
}

/**
 * Convert Hebrew date components to Gregorian date
 */
export function hebrewToGregorian(day: number, month: number, year: number): Date {
  const hdate = new HDate(day, month, year);
  return hdate.greg();
}

/**
 * Check if a Gregorian date falls within a Hebrew month
 */
export function gregorianDateInHebrewMonth(
  gregDate: Date,
  hebrewMonth: number,
  hebrewYear: number
): boolean {
  const hdate = new HDate(gregDate);
  return hdate.getMonth() === hebrewMonth && hdate.getFullYear() === hebrewYear;
}

/**
 * Format a Hebrew date for display
 * For Hebrew: returns "כה טבת תשפ״ו" format
 * For English: returns "25 Tevet 5786" format
 */
export function formatHebrewDateForDisplay(
  day: number,
  month: number,
  year: number,
  language: 'he' | 'en' = 'he'
): string {
  if (language === 'he') {
    // Format with gematriya: "כה טבת תשפ״ו"
    const dayGematriya = gematriya(day);
    const monthName = HEBREW_MONTH_NAMES[month] || '';
    // For year, only show last 3 digits (e.g., 5786 -> 786 -> תשפ״ו)
    const yearShort = year % 1000;
    const yearGematriya = gematriya(yearShort);
    return `${dayGematriya} ${monthName} ${yearGematriya}`;
  }

  // English format
  const hdate = new HDate(day, month, year);
  return hdate.render('en');
}

/**
 * Get number of days in a Hebrew month
 */
export function getDaysInHebrewMonth(month: number, year: number): number {
  return HDate.daysInMonth(month, year);
}

/**
 * Check if a Hebrew year is a leap year
 */
export function isHebrewLeapYear(year: number): boolean {
  return HDate.isLeapYear(year);
}
