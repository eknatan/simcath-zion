import { HDate, HebrewCalendar, Event, months, flags } from '@hebcal/core';
import type { HebrewDayData, HebrewMonthData, Language } from '@/components/calendar/types';

/**
 * Hebrew month names in Hebrew and English
 */
export const HEBREW_MONTHS_HE = [
  'ניסן', 'אייר', 'סיוון', 'תמוז', 'אב', 'אלול',
  'תשרי', 'חשוון', 'כסלו', 'טבת', 'שבט', 'אדר',
  'אדר א׳', 'אדר ב׳'
];

export const HEBREW_MONTHS_EN = [
  'Nisan', 'Iyar', 'Sivan', 'Tamuz', 'Av', 'Elul',
  'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar',
  'Adar I', 'Adar II'
];

/**
 * Day names in Hebrew and English (Sunday - Saturday)
 */
export const DAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
export const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Shabbat'];

/**
 * Get Hebrew month name
 */
export function getHebrewMonthName(month: number, isLeapYear: boolean, language: Language): string {
  const names = language === 'he' ? HEBREW_MONTHS_HE : HEBREW_MONTHS_EN;

  // Handle Adar in leap years
  if (month === months.ADAR_I && isLeapYear) {
    return names[12]; // Adar I
  } else if (month === months.ADAR_II || (month === months.ADAR_I && !isLeapYear)) {
    return names[13]; // Adar II or just Adar
  }

  // Regular months (1-based to 0-based index)
  return names[month - 1] || names[0];
}

/**
 * Format Hebrew date string
 */
export function formatHebrewDate(hdate: HDate, language: Language): string {
  return hdate.render(language, false);
}

/**
 * Format Gregorian date string
 */
export function formatGregDate(date: Date, language: Language): string {
  if (language === 'he') {
    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Check if a date is Shabbat
 */
export function isShabbat(date: Date): boolean {
  return date.getDay() === 6;
}

/**
 * Check if events include a holiday
 */
export function hasHoliday(events: Event[]): boolean {
  return events.some(ev =>
    (ev.getFlags() & flags.CHAG) !== 0 ||
    (ev.getFlags() & flags.YOM_TOV_ENDS) !== 0
  );
}

/**
 * Check if events include Rosh Chodesh
 */
export function hasRoshChodesh(events: Event[]): boolean {
  return events.some(ev => (ev.getFlags() & flags.ROSH_CHODESH) !== 0);
}

/**
 * Get events for a specific Hebrew date
 */
export function getEventsForDate(hdate: HDate): Event[] {
  const options = {
    start: hdate.greg(),
    end: hdate.greg(),
    sedrot: true,
    candlelighting: false,
  };

  return HebrewCalendar.calendar(options);
}

/**
 * Generate data for a specific Hebrew day
 */
export function generateDayData(hdate: HDate, language: Language): HebrewDayData {
  const gregDate = hdate.greg();
  const events = getEventsForDate(hdate);

  return {
    hdate,
    gregDate,
    events,
    isShabbat: isShabbat(gregDate),
    isHoliday: hasHoliday(events),
    isRoshChodesh: hasRoshChodesh(events),
    hebrewDateStr: formatHebrewDate(hdate, language),
    gregDateStr: formatGregDate(gregDate, language),
  };
}

/**
 * Generate complete month data for Hebrew calendar
 */
export function generateMonthData(
  month: number,
  year: number,
  isHebrewYear: boolean,
  language: Language
): HebrewMonthData {
  const days: HebrewDayData[] = [];

  // Determine the actual Hebrew year and month
  let hebrewYear: number;
  let hebrewMonth: number;

  if (isHebrewYear) {
    hebrewYear = year;
    hebrewMonth = month;
  } else {
    // Convert from Gregorian to Hebrew
    const gregDate = new Date(year, month - 1, 1);
    const hdate = new HDate(gregDate);
    hebrewYear = hdate.getFullYear();
    hebrewMonth = hdate.getMonth();
  }

  // Check if it's a leap year
  const isLeap = HDate.isLeapYear(hebrewYear);

  // Get the number of days in this Hebrew month
  const daysInMonth = HDate.daysInMonth(hebrewMonth, hebrewYear);

  // Generate day data for each day in the month
  for (let day = 1; day <= daysInMonth; day++) {
    const hdate = new HDate(day, hebrewMonth, hebrewYear);
    days.push(generateDayData(hdate, language));
  }

  return {
    year: hebrewYear,
    month: hebrewMonth,
    isHebrewYear: true,
    days,
    monthNameHe: getHebrewMonthName(hebrewMonth, isLeap, 'he'),
    monthNameEn: getHebrewMonthName(hebrewMonth, isLeap, 'en'),
  };
}

/**
 * Get current Hebrew month and year
 */
export function getCurrentHebrewDate(): { month: number; year: number } {
  const hdate = new HDate();
  return {
    month: hdate.getMonth(),
    year: hdate.getFullYear(),
  };
}

/**
 * Navigate to next Hebrew month
 */
export function getNextHebrewMonth(currentMonth: number, currentYear: number): { month: number; year: number } {
  const isLeap = HDate.isLeapYear(currentYear);
  const monthsInYear = isLeap ? 13 : 12;

  if (currentMonth === monthsInYear) {
    return { month: 1, year: currentYear + 1 };
  }

  return { month: currentMonth + 1, year: currentYear };
}

/**
 * Navigate to previous Hebrew month
 */
export function getPrevHebrewMonth(currentMonth: number, currentYear: number): { month: number; year: number } {
  if (currentMonth === 1) {
    const prevYear = currentYear - 1;
    const isLeap = HDate.isLeapYear(prevYear);
    return { month: isLeap ? 13 : 12, year: prevYear };
  }

  return { month: currentMonth - 1, year: currentYear };
}

/**
 * Get the day of week (0-6, Sunday-Saturday) for the first day of a Hebrew month
 */
export function getFirstDayOfWeek(month: number, year: number): number {
  const firstDay = new HDate(1, month, year);
  return firstDay.greg().getDay();
}
