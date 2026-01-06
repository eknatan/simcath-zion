'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { HDate } from '@hebcal/core';
import type { CalendarEvent } from '@/components/calendar/types';

interface WeddingCaseData {
  id: string;
  case_number: number;
  hebrew_day: number | null;
  hebrew_month: number | null;
  hebrew_year: number | null;
  wedding_date_hebrew: string | null;
  wedding_date_gregorian: string | null;
  groom_first_name: string | null;
  groom_last_name: string | null;
  bride_first_name: string | null;
  bride_last_name: string | null;
  status: string;
}

/**
 * Transform wedding case data to calendar events
 * Now uses structured Hebrew date fields directly
 */
function transformToCalendarEvents(cases: WeddingCaseData[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const caseData of cases) {
    // Skip if no structured date
    if (!caseData.hebrew_day || !caseData.hebrew_month || !caseData.hebrew_year) {
      continue;
    }

    // Get Gregorian date
    let gregorianDate: Date;
    if (caseData.wedding_date_gregorian) {
      gregorianDate = new Date(caseData.wedding_date_gregorian);
    } else {
      try {
        const hdate = new HDate(caseData.hebrew_day, caseData.hebrew_month, caseData.hebrew_year);
        gregorianDate = hdate.greg();
      } catch {
        continue;
      }
    }

    // Format Hebrew date for display
    let hebrewDateStr: string;
    try {
      const hdate = new HDate(caseData.hebrew_day, caseData.hebrew_month, caseData.hebrew_year);
      hebrewDateStr = hdate.render('he');
    } catch {
      hebrewDateStr = caseData.wedding_date_hebrew || '';
    }

    // Create event title with full names (first + last)
    const groomFullName = [caseData.groom_first_name, caseData.groom_last_name].filter(Boolean).join(' ');
    const brideFullName = [caseData.bride_first_name, caseData.bride_last_name].filter(Boolean).join(' ');
    const title = groomFullName && brideFullName
      ? `${groomFullName} & ${brideFullName}`
      : groomFullName || brideFullName || `תיק #${caseData.case_number}`;

    events.push({
      id: caseData.id,
      type: 'wedding',
      title,
      titleEn: title,
      hebrewDate: hebrewDateStr,
      hebrewDay: caseData.hebrew_day,
      gregorianDate,
      status: caseData.status,
      caseNumber: caseData.case_number,
    });
  }

  return events;
}

/**
 * Hook to fetch calendar events (weddings) for a specific Hebrew month
 * Now filters directly in the database query for better performance
 */
export function useCalendarEvents(hebrewMonth: number, hebrewYear: number) {
  return useQuery({
    queryKey: ['calendar-events', hebrewMonth, hebrewYear],
    queryFn: async (): Promise<CalendarEvent[]> => {
      // Fetch wedding cases for the specific month/year
      const { data, error } = await supabase
        .from('cases')
        .select(`
          id,
          case_number,
          hebrew_day,
          hebrew_month,
          hebrew_year,
          wedding_date_hebrew,
          wedding_date_gregorian,
          groom_first_name,
          groom_last_name,
          bride_first_name,
          bride_last_name,
          status
        `)
        .eq('case_type', 'wedding')
        .neq('status', 'rejected')
        .eq('hebrew_month', hebrewMonth)
        .eq('hebrew_year', hebrewYear)
        .order('hebrew_day', { ascending: true });

      if (error) {
        console.error('Error fetching calendar events:', error);
        throw error;
      }

      return transformToCalendarEvents(data as WeddingCaseData[]);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to fetch all calendar events for a year
 * Now filters directly in the database query
 */
export function useYearlyCalendarEvents(hebrewYear: number) {
  return useQuery({
    queryKey: ['calendar-events-yearly', hebrewYear],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          id,
          case_number,
          hebrew_day,
          hebrew_month,
          hebrew_year,
          wedding_date_hebrew,
          wedding_date_gregorian,
          groom_first_name,
          groom_last_name,
          bride_first_name,
          bride_last_name,
          status
        `)
        .eq('case_type', 'wedding')
        .neq('status', 'rejected')
        .eq('hebrew_year', hebrewYear)
        .order('hebrew_month', { ascending: true })
        .order('hebrew_day', { ascending: true });

      if (error) {
        console.error('Error fetching yearly calendar events:', error);
        throw error;
      }

      return transformToCalendarEvents(data as WeddingCaseData[]);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
