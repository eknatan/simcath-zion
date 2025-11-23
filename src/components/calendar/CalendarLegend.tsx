'use client';

import { useTranslations } from 'next-intl';
import type { Language } from './types';

interface CalendarLegendProps {
  language: Language;
}

export default function CalendarLegend({ language }: CalendarLegendProps) {
  const t = useTranslations('calendar.legend');

  const legends = [
    {
      color: 'bg-pink-100 dark:bg-pink-900/30',
      labelKey: 'wedding',
      border: 'border-pink-300 dark:border-pink-700',
    },
    {
      color: 'bg-blue-50 dark:bg-blue-900/20',
      labelKey: 'shabbat',
      border: 'border-blue-200 dark:border-blue-700',
    },
    {
      color: 'bg-purple-50 dark:bg-purple-900/20',
      labelKey: 'holiday',
      border: 'border-purple-200 dark:border-purple-700',
    },
    {
      color: 'bg-amber-50 dark:bg-amber-900/20',
      labelKey: 'roshChodesh',
      border: 'border-amber-200 dark:border-amber-700',
    },
  ];

  return (
    <div
      className="flex flex-wrap gap-3 justify-center py-3"
      dir={language === 'he' ? 'rtl' : 'ltr'}
    >
      {legends.map((legend, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          <div
            className={`w-4 h-4 rounded border ${legend.color} ${legend.border}`}
          />
          <span className="text-xs text-muted-foreground">
            {t(legend.labelKey)}
          </span>
        </div>
      ))}
    </div>
  );
}
