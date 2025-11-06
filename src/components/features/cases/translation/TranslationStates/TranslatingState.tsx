'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function TranslatingState() {
  const t = useTranslations('case.english');

  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">
        {t('translating.title')}
      </h3>
      <p className="text-slate-600">
        {t('translating.description')}
      </p>
      <p className="text-sm text-slate-500 mt-2">
        {t('translating.estimatedTime')}
      </p>
    </div>
  );
}