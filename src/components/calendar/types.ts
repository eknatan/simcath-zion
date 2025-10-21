import type { HDate, Event } from '@hebcal/core';

export type Language = 'he' | 'en';

export interface HebrewDayData {
  hdate: HDate;
  gregDate: Date;
  events: Event[];
  isShabbat: boolean;
  isHoliday: boolean;
  isRoshChodesh: boolean;
  hebrewDateStr: string;
  gregDateStr: string;
}

export interface HebrewMonthData {
  year: number;
  month: number;
  isHebrewYear: boolean;
  days: HebrewDayData[];
  monthNameHe: string;
  monthNameEn: string;
}

export interface CalendarProps {
  language?: Language;
  showBothLanguages?: boolean;
}

export interface DayCellProps {
  dayData: HebrewDayData;
  language: Language;
  showBothLanguages: boolean;
}

export interface MonthNavigationProps {
  currentMonth: number;
  currentYear: number;
  isHebrewYear: boolean;
  language: Language;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMonthSelect?: (month: number, year: number) => void;
}
