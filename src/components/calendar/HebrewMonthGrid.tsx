import HebrewDayCell from './HebrewDayCell';
import type { HebrewMonthData, Language } from './types';
import { DAY_NAMES_HE, DAY_NAMES_EN, getFirstDayOfWeek } from '@/lib/hebcal-utils';

interface HebrewMonthGridProps {
  monthData: HebrewMonthData;
  language: Language;
  showBothLanguages: boolean;
}

export default function HebrewMonthGrid({ monthData, language, showBothLanguages }: HebrewMonthGridProps) {
  const { days, month, year } = monthData;

  // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = getFirstDayOfWeek(month, year);

  // Day names based on language
  const dayNames = language === 'he' ? DAY_NAMES_HE : DAY_NAMES_EN;

  // Create grid with empty cells for alignment
  const gridCells: (typeof days[0] | null)[] = [];

  // Add empty cells before the first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    gridCells.push(null);
  }

  // Add all the days
  gridCells.push(...days);

  return (
    <div className="w-full" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((dayName, idx) => (
          <div
            key={idx}
            className={`text-center font-semibold py-2 text-sm ${
              idx === 6
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {gridCells.map((dayData, idx) => (
          <div key={idx}>
            {dayData ? (
              <HebrewDayCell
                dayData={dayData}
                language={language}
                showBothLanguages={showBothLanguages}
              />
            ) : (
              <div className="min-h-24 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-sm" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
