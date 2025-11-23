import type { HDate, Event } from '@hebcal/core';

export type Language = 'he' | 'en';

/**
 * Event type for calendar display
 */
export type CalendarEventType = 'wedding' | 'holiday' | 'rosh_chodesh' | 'parsha';

/**
 * Calendar event from the system (weddings, etc.)
 */
export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  titleEn?: string;
  hebrewDate: string;
  hebrewDay: number;
  gregorianDate: Date;
  status?: string;
  caseNumber?: number;
}

export interface HebrewDayData {
  hdate: HDate;
  gregDate: Date;
  events: Event[];
  calendarEvents: CalendarEvent[];
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
