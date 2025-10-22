'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import MonthNavigation from './MonthNavigation';
import HebrewMonthGrid from './HebrewMonthGrid';
import CalendarLegend from './CalendarLegend';
import type { CalendarProps, HebrewMonthData, Language } from './types';
import {
  getCurrentHebrewDate,
  getNextHebrewMonth,
  getPrevHebrewMonth,
  generateMonthData,
} from '@/lib/hebcal-utils';

export default function HebrewCalendar({
  language = 'he',
  showBothLanguages = true,
}: CalendarProps) {
  const t = useTranslations('calendar');

  // State for current month/year
  const [currentDate, setCurrentDate] = useState(getCurrentHebrewDate());
  const [currentLanguage, setCurrentLanguage] = useState<Language>(language);
  const [monthData, setMonthData] = useState<HebrewMonthData | null>(null);

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

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(getPrevHebrewMonth(currentDate.month, currentDate.year));
  };

  const handleNextMonth = () => {
    setCurrentDate(getNextHebrewMonth(currentDate.month, currentDate.year));
  };

  const handleLanguageToggle = () => {
    setCurrentLanguage(prev => (prev === 'he' ? 'en' : 'he'));
  };

  if (!monthData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600 dark:text-gray-400">
          {t('loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      {/* Language Toggle */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleLanguageToggle}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
        >
          {t('switchLanguage')}
        </button>
      </div>

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

      {/* Month Grid */}
      <HebrewMonthGrid
        monthData={monthData}
        language={currentLanguage}
        showBothLanguages={showBothLanguages}
      />

      {/* Footer note */}
      <div
        className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400"
        dir={currentLanguage === 'he' ? 'rtl' : 'ltr'}
      >
        {t('clickForInfo')}
      </div>
    </div>
  );
}
