import type { DayCellProps } from './types';
import { flags } from '@hebcal/core';

export default function HebrewDayCell({ dayData, language, showBothLanguages }: DayCellProps) {
  const { hdate, gregDate, events, isShabbat, isHoliday, isRoshChodesh } = dayData;

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
    : 'bg-white dark:bg-gray-800';

  // Text colors
  const hebrewTextColor = 'text-gray-900 dark:text-gray-100';
  const gregTextColor = 'text-gray-600 dark:text-gray-400';
  const holidayTextColor = 'text-purple-700 dark:text-purple-300';
  const parshaTextColor = 'text-blue-700 dark:text-blue-300';

  return (
    <div
      className={`${bgColor} min-h-24 p-2 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow rounded-sm`}
      dir={language === 'he' ? 'rtl' : 'ltr'}
    >
      {/* Date numbers */}
      <div className="flex justify-between items-start mb-1">
        <div className={`text-lg font-semibold ${hebrewTextColor}`}>
          {language === 'he' ? hebrewDay : hebrewDay}
        </div>
        <div className={`text-sm ${gregTextColor}`}>
          {gregDay}
        </div>
      </div>

      {/* Hebrew month name (on 1st of month) */}
      {hebrewDay === 1 && (
        <div className={`text-xs font-medium ${hebrewTextColor} mb-1`}>
          {language === 'he' ? hdate.renderGematriya().split(' ')[1] : hdate.render('en').split(' ')[2]}
        </div>
      )}

      {/* Holidays and special days */}
      {holidays.length > 0 && (
        <div className="space-y-0.5">
          {holidays.map((holiday, idx) => (
            <div
              key={idx}
              className={`text-xs font-medium ${holidayTextColor} line-clamp-2`}
            >
              {holiday.render(language)}
            </div>
          ))}
        </div>
      )}

      {/* Parsha (Torah portion) */}
      {parsha && (
        <div className={`text-xs ${parshaTextColor} mt-1 line-clamp-1`}>
          {showBothLanguages && language === 'he'
            ? `פרשת ${parsha.render('he')}`
            : showBothLanguages && language === 'en'
            ? parsha.render('en')
            : `${parsha.render(language)}`}
        </div>
      )}

      {/* Both languages option - show translation */}
      {showBothLanguages && holidays.length > 0 && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {holidays[0].render(language === 'he' ? 'en' : 'he')}
        </div>
      )}
    </div>
  );
}
