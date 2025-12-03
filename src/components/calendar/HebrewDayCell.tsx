'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { flags } from '@hebcal/core';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DayCellProps } from './types';

// Convert number to Hebrew letters (Gematria) for days 1-30
function formatHebrewDayGematria(day: number): string {
  const ones: Record<number, string> = {
    1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט',
  };
  const tens: Record<number, string> = {
    1: 'י', 2: 'כ', 3: 'ל',
  };

  if (day === 15) return 'ט״ו';
  if (day === 16) return 'ט״ז';

  const tensDigit = Math.floor(day / 10);
  const onesDigit = day % 10;

  let result = '';
  if (tensDigit > 0) result += tens[tensDigit];
  if (onesDigit > 0) result += ones[onesDigit];

  // Add gershayim before last letter for multi-letter results
  if (result.length > 1) {
    result = result.slice(0, -1) + '״' + result.slice(-1);
  } else if (result.length === 1) {
    result += '׳';
  }

  return result;
}

// Event color schemes
const EVENT_COLORS = {
  wedding: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    border: 'border-pink-300 dark:border-pink-700',
    text: 'text-pink-700 dark:text-pink-300',
    hover: 'hover:bg-pink-200 dark:hover:bg-pink-800/40',
  },
  holiday: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-700 dark:text-purple-300',
  },
  rosh_chodesh: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-300',
  },
};

export default function HebrewDayCell({ dayData, language, showBothLanguages, currentMonth, currentYear }: DayCellProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('calendar');

  const { hdate, gregDate, events, calendarEvents, isShabbat, isHoliday, isRoshChodesh } = dayData;

  // Get day of month for both calendars
  const hebrewDay = hdate.getDate();
  const gregDay = gregDate.getDate();

  // Filter events to show
  const holidays = events.filter(ev => {
    const eventFlags = ev.getFlags();
    return (eventFlags & flags.CHAG) !== 0 ||
           (eventFlags & flags.ROSH_CHODESH) !== 0 ||
           (eventFlags & flags.MINOR_HOLIDAY) !== 0;
  });

  const parsha = events.find(ev => (ev.getFlags() & flags.PARSHA_HASHAVUA) !== 0);

  // Determine background color based on day type
  const bgColor = isShabbat
    ? 'bg-blue-50 dark:bg-blue-900/20'
    : isHoliday
    ? 'bg-purple-50 dark:bg-purple-900/20'
    : isRoshChodesh
    ? 'bg-amber-50 dark:bg-amber-900/20'
    : 'bg-card';

  // Handle wedding click - navigate to case with calendar return state
  const handleWeddingClick = (caseId: string, hebrewMonth: number, hebrewYear: number) => {
    const params = new URLSearchParams();
    params.set('returnMonth', hebrewMonth.toString());
    params.set('returnYear', hebrewYear.toString());
    router.push(`/${locale}/cases/${caseId}?${params.toString()}`);
  };

  // Check if today
  const today = new Date();
  const isToday = gregDate.toDateString() === today.toDateString();

  return (
    <div
      className={cn(
        bgColor,
        'min-h-28 p-2 border rounded-md transition-shadow hover:shadow-md',
        isToday && 'ring-2 ring-primary ring-offset-1'
      )}
      dir={language === 'he' ? 'rtl' : 'ltr'}
    >
      {/* Date display - Hebrew in gematria, Gregorian in numbers */}
      <div className="flex justify-between items-start mb-1">
        <div className={cn(
          'text-lg font-semibold',
          isToday ? 'text-primary' : 'text-foreground'
        )}>
          {formatHebrewDayGematria(hebrewDay)}
        </div>
        <div className="text-xs text-muted-foreground">
          {gregDay}
        </div>
      </div>

      {/* Wedding events */}
      {calendarEvents.length > 0 && (
        <div className="space-y-1 mb-1">
          {calendarEvents.map((event) => (
            <TooltipProvider key={event.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleWeddingClick(event.id, currentMonth, currentYear)}
                    className={cn(
                      'w-full text-start text-xs px-1.5 py-0.5 rounded border cursor-pointer truncate',
                      EVENT_COLORS.wedding.bg,
                      EVENT_COLORS.wedding.border,
                      EVENT_COLORS.wedding.text,
                      EVENT_COLORS.wedding.hover
                    )}
                  >
                    {event.title}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1 text-sm" dir={language === 'he' ? 'rtl' : 'ltr'}>
                    <p className="font-bold">{event.title}</p>
                    {event.caseNumber && (
                      <p className="text-muted-foreground">
                        {t('caseNumber')}: #{event.caseNumber}
                      </p>
                    )}
                    <p className="text-muted-foreground">{event.hebrewDate}</p>
                    {event.status && (
                      <Badge variant="outline" className="text-xs">
                        {event.status}
                      </Badge>
                    )}
                    <p className="text-xs text-primary mt-1">
                      {t('clickToView')}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}

      {/* Holidays and special days */}
      {holidays.length > 0 && (
        <div className="space-y-0.5 mb-1">
          {holidays.slice(0, 2).map((holiday, idx) => (
            <div
              key={idx}
              className={cn(
                'text-xs font-medium line-clamp-1',
                EVENT_COLORS.holiday.text
              )}
            >
              {holiday.render(language)}
            </div>
          ))}
          {holidays.length > 2 && (
            <div className="text-xs text-muted-foreground">
              +{holidays.length - 2}
            </div>
          )}
        </div>
      )}

      {/* Parsha (Torah portion) */}
      {parsha && (
        <div className="text-xs text-blue-600 dark:text-blue-400 line-clamp-1">
          {language === 'he'
            ? parsha.render('he')
            : parsha.render('en')
          }
        </div>
      )}

      {/* Both languages option - show translation for main holiday */}
      {showBothLanguages && holidays.length > 0 && (
        <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
          {holidays[0].render(language === 'he' ? 'en' : 'he')}
        </div>
      )}
    </div>
  );
}
