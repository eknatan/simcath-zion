'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MonthNavigationProps } from './types';
import { HDate } from '@hebcal/core';
import { getHebrewMonthName } from '@/lib/hebcal-utils';

export default function MonthNavigation({
  currentMonth,
  currentYear,
  language,
  onPrevMonth,
  onNextMonth,
}: MonthNavigationProps) {
  const t = useTranslations('calendar.navigation');
  const isLeap = HDate.isLeapYear(currentYear);
  const monthNameHe = getHebrewMonthName(currentMonth, isLeap, 'he');
  const monthNameEn = getHebrewMonthName(currentMonth, isLeap, 'en');

  // Format Hebrew year in Gematria
  const formatHebrewYear = (year: number): string => {
    // Simple format for years in 5700s
    const hundreds = Math.floor((year % 1000) / 100);
    const tens = Math.floor((year % 100) / 10);
    const ones = year % 10;

    const letters: Record<number, string> = {
      1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט',
    };
    const tensLetters: Record<number, string> = {
      1: 'י', 2: 'כ', 3: 'ל', 4: 'מ', 5: 'נ', 6: 'ס', 7: 'ע', 8: 'פ', 9: 'צ',
    };
    const hundredsLetters: Record<number, string> = {
      1: 'ק', 2: 'ר', 3: 'ש', 4: 'ת', 5: 'תק', 6: 'תר', 7: 'תש',
    };

    let result = hundredsLetters[hundreds] || '';
    if (tens === 1 && ones === 5) {
      result += 'ט״ו';
    } else if (tens === 1 && ones === 6) {
      result += 'ט״ז';
    } else {
      if (tens) result += tensLetters[tens];
      if (ones) result += (tens ? '״' : '') + letters[ones];
    }

    return result;
  };

  return (
    <div className="flex items-center justify-between" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {/* Previous Month Button - on the start side (right in RTL, left in LTR) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevMonth}
        aria-label={t('previousMonth')}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Month and Year Display */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">
          {language === 'he' ? monthNameHe : monthNameEn}
        </h2>
        <p className="text-sm text-muted-foreground">
          {language === 'he' ? formatHebrewYear(currentYear) : currentYear}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {language === 'he' ? `${monthNameEn} ${currentYear}` : `${monthNameHe}`}
        </p>
      </div>

      {/* Next Month Button - on the end side (left in RTL, right in LTR) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onNextMonth}
        aria-label={t('nextMonth')}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
    </div>
  );
}
