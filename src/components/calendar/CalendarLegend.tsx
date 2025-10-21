import type { Language } from './types';

interface CalendarLegendProps {
  language: Language;
}

export default function CalendarLegend({ language }: CalendarLegendProps) {
  const legends = [
    {
      color: 'bg-blue-50 dark:bg-blue-900/20',
      labelHe: 'שבת',
      labelEn: 'Shabbat',
      border: 'border-blue-200 dark:border-blue-700',
    },
    {
      color: 'bg-purple-50 dark:bg-purple-900/20',
      labelHe: 'חג',
      labelEn: 'Holiday',
      border: 'border-purple-200 dark:border-purple-700',
    },
    {
      color: 'bg-amber-50 dark:bg-amber-900/20',
      labelHe: 'ראש חודש',
      labelEn: 'Rosh Chodesh',
      border: 'border-amber-200 dark:border-amber-700',
    },
  ];

  return (
    <div
      className="flex flex-wrap gap-4 justify-center mt-6 mb-4 px-4"
      dir={language === 'he' ? 'rtl' : 'ltr'}
    >
      {legends.map((legend, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded border ${legend.color} ${legend.border}`}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {language === 'he' ? legend.labelHe : legend.labelEn}
          </span>
        </div>
      ))}
    </div>
  );
}
