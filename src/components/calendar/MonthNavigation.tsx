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
  const isLeap = HDate.isLeapYear(currentYear);
  const monthNameHe = getHebrewMonthName(currentMonth, isLeap, 'he');
  const monthNameEn = getHebrewMonthName(currentMonth, isLeap, 'en');

  return (
    <div className="flex items-center justify-between mb-6 px-4">
      {/* Previous Month Button */}
      <button
        onClick={onPrevMonth}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label={language === 'he' ? 'חודש קודם' : 'Previous month'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-6 h-6 ${language === 'he' ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* Month and Year Display */}
      <div className="text-center" dir={language === 'he' ? 'rtl' : 'ltr'}>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {language === 'he' ? monthNameHe : monthNameEn}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {language === 'he' ? `תשפ״${String.fromCharCode(1488 + (currentYear % 10))}` : currentYear}
        </p>
        {language === 'en' && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {monthNameHe} {currentYear}
          </p>
        )}
        {language === 'he' && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {monthNameEn} {currentYear}
          </p>
        )}
      </div>

      {/* Next Month Button */}
      <button
        onClick={onNextMonth}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label={language === 'he' ? 'חודש הבא' : 'Next month'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-6 h-6 ${language === 'he' ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}
