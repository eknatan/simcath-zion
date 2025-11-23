'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { HDate } from '@hebcal/core';
import { cn } from '@/lib/utils';
import { numberToHebrewLetters } from '@/lib/hebcal-utils';
import { useUpcomingWeddings } from '@/lib/hooks/useDashboard';

export function MiniCalendar() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const isRTL = locale === 'he';

  // Fetch upcoming weddings
  const { data: weddings } = useUpcomingWeddings();

  // Get current week (today + 6 days)
  const weekDays = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Get Hebrew date
      const hdate = new HDate(date);
      const hebrewDay = hdate.getDate();

      // Check for weddings on this day
      const dayWeddings = weddings?.filter(w => {
        const weddingDate = new Date(w.wedding_date_gregorian);
        return weddingDate.toDateString() === date.toDateString();
      }) || [];

      days.push({
        date,
        gregorianDay: date.getDate(),
        hebrewDay,
        dayName: date.toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', { weekday: 'short' }),
        isToday: i === 0,
        hasWeddings: dayWeddings.length > 0,
        weddingCount: dayWeddings.length,
      });
    }

    return days;
  }, [weddings, locale]);

  return (
    <Card className="border-slate-200 shadow-md h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            {t('miniCalendar.title', { defaultValue: '7 ימים קרובים' })}
          </CardTitle>
          <Link href="/calendar">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              {t('miniCalendar.viewFull', { defaultValue: 'לוח מלא' })}
              {isRTL ? <ChevronLeft className="h-4 w-4 ms-1" /> : <ChevronRight className="h-4 w-4 ms-1" />}
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={cn(
                'flex flex-col items-center p-2 rounded-lg transition-colors relative',
                day.isToday && 'bg-blue-50 ring-2 ring-blue-500',
                day.hasWeddings && !day.isToday && 'bg-pink-50',
                !day.isToday && !day.hasWeddings && 'hover:bg-slate-50'
              )}
            >
              {/* Day name */}
              <span className="text-xs text-slate-500 font-medium">
                {day.dayName}
              </span>

              {/* Gregorian day - with circle if has wedding */}
              <div className="relative">
                <span className={cn(
                  'text-lg font-bold inline-flex items-center justify-center',
                  day.isToday ? 'text-blue-600' : 'text-slate-900',
                  day.hasWeddings && 'w-8 h-8 rounded-full bg-pink-500 text-white'
                )}>
                  {day.gregorianDay}
                </span>
              </div>

              {/* Hebrew day in letters */}
              <span className="text-xs text-slate-600 font-hebrew">
                {numberToHebrewLetters(day.hebrewDay)}
              </span>

              {/* Wedding count indicator (if more than 1) */}
              {day.hasWeddings && day.weddingCount > 1 && (
                <span className="absolute -top-1 -end-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-pink-600 rounded-full">
                  {day.weddingCount}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
