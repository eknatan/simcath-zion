'use client';

import { CaseWithRelations } from '@/types/case.types';
import { CaseHeader } from '@/components/shared/CaseHeader/CaseHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

interface CaseViewProps {
  initialData: CaseWithRelations;
  locale: string;
}

/**
 * CaseView - Main client component for case management
 *
 * This component orchestrates all tabs and manages the overall case UI.
 * It receives initial data from the server component and uses SWR for updates.
 */
export function CaseView({ initialData, locale }: CaseViewProps) {
  const t = useTranslations('case.view');
  const dir = locale === 'he' ? 'rtl' : 'ltr';

  return (
    <div dir={dir} className="space-y-6">
      {/* Case Header - Shows case summary and actions */}
      <CaseHeader caseData={initialData} />

      {/* Tabs will be added in Phase 2 */}
      <Card className="shadow-md border border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-slate-900 mb-2">
              {t('caseNumber')}{initialData.case_number}
            </p>
            <p className="text-sm text-slate-600">
              {t('type')}: {initialData.case_type}
            </p>
            <p className="text-sm text-slate-600">
              {t('status')}: {initialData.status}
            </p>
            <p className="text-xs text-slate-500 mt-4">
              {t('comingSoon')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
