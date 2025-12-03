'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MonthNavigation from './MonthNavigation';
import HebrewMonthGrid from './HebrewMonthGrid';
import CalendarLegend from './CalendarLegend';
import type { CalendarProps, HebrewMonthData, Language, CalendarEvent } from './types';
import {
  getCurrentHebrewDate,
  getNextHebrewMonth,
  getPrevHebrewMonth,
  generateMonthData,
} from '@/lib/hebcal-utils';
import { useCalendarEvents } from '@/lib/hooks/useCalendarEvents';
import { Loader2 } from 'lucide-react';

export default function HebrewCalendar({
  showBothLanguages = true,
}: CalendarProps) {
  const t = useTranslations('calendar');
  const locale = useLocale();
  const searchParams = useSearchParams();

  // Use the app's locale as the language
  const currentLanguage: Language = locale === 'he' ? 'he' : 'en';

  // Get initial date from URL params or use current date
  const getInitialDate = () => {
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');
    if (monthParam && yearParam) {
      const month = parseInt(monthParam, 10);
      const year = parseInt(yearParam, 10);
      if (!isNaN(month) && !isNaN(year)) {
        return { month, year };
      }
    }
    return getCurrentHebrewDate();
  };

  // State for current month/year
  const [currentDate, setCurrentDate] = useState(getInitialDate);
  const [monthData, setMonthData] = useState<HebrewMonthData | null>(null);

  // Fetch calendar events (weddings) for the current month
  const {
    data: calendarEvents = [],
    isLoading: eventsLoading,
  } = useCalendarEvents(currentDate.month, currentDate.year);

  // Generate month data when date changes
  useEffect(() => {
    const data = generateMonthData(
      currentDate.month,
      currentDate.year,
      true,
      currentLanguage
    );
    setMonthData(data);
  }, [currentDate, currentLanguage]);

  // Merge calendar events with month data
  const monthDataWithEvents = useMemo(() => {
    if (!monthData) return null;

    // Create a map of events by day
    const eventsByDay = new Map<number, CalendarEvent[]>();
    for (const event of calendarEvents) {
      const day = event.hebrewDay;
      if (!eventsByDay.has(day)) {
        eventsByDay.set(day, []);
      }
      eventsByDay.get(day)!.push(event);
    }

    // Add events to each day
    const daysWithEvents = monthData.days.map((dayData) => {
      const hebrewDay = dayData.hdate.getDate();
      const dayEvents = eventsByDay.get(hebrewDay) || [];
      return {
        ...dayData,
        calendarEvents: dayEvents,
      };
    });

    return {
      ...monthData,
      days: daysWithEvents,
    };
  }, [monthData, calendarEvents]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(getPrevHebrewMonth(currentDate.month, currentDate.year));
  };

  const handleNextMonth = () => {
    setCurrentDate(getNextHebrewMonth(currentDate.month, currentDate.year));
  };

  const handleToday = () => {
    setCurrentDate(getCurrentHebrewDate());
  };

  if (!monthDataWithEvents) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t('loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">
            {t('title')}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
          >
            {t('today')}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Month Navigation */}
        <MonthNavigation
          currentMonth={currentDate.month}
          currentYear={currentDate.year}
          isHebrewYear={true}
          language={currentLanguage}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />

        {/* Calendar Legend */}
        <CalendarLegend language={currentLanguage} />

        {/* Loading indicator for events */}
        {eventsLoading && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Month Grid */}
        <HebrewMonthGrid
          monthData={monthDataWithEvents}
          language={currentLanguage}
          showBothLanguages={showBothLanguages}
        />

        {/* Footer note */}
        <p
          className="text-center text-sm text-muted-foreground pt-4"
          dir={currentLanguage === 'he' ? 'rtl' : 'ltr'}
        >
          {t('clickForInfo')}
        </p>
      </CardContent>
    </Card>
  );
}
