'use client';

import { ActionButton } from '@/components/shared/ActionButton';
import { Languages } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface NotTranslatedStateProps {
  onTranslate: () => void;
  isTranslating: boolean;
}

export function NotTranslatedState({ onTranslate, isTranslating }: NotTranslatedStateProps) {
  const t = useTranslations('case.english');

  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Languages className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">
        {t('notTranslated.title')}
      </h3>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">
        {t('notTranslated.description')}
      </p>
      <ActionButton
        variant="primary"
        onClick={onTranslate}
        disabled={isTranslating}
      >
        <Languages className="h-4 w-4 me-2" />
        {t('notTranslated.translateButton')}
      </ActionButton>
    </div>
  );
}