'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CaseWithRelations } from '@/types/case.types';
import { CaseHeader } from '@/components/shared/CaseHeader/CaseHeader';
import { CaseTabs } from './CaseTabs';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface CaseViewProps {
  initialData: CaseWithRelations;
  locale: string;
}

/**
 * CaseView - Main client component for case management
 *
 * This component orchestrates all tabs and manages the overall case UI.
 * It receives initial data from the server component and uses SWR for updates.
 *
 * RTL support: Proper text direction is set at the container level
 */
export function CaseView({ initialData, locale }: CaseViewProps) {
  const dir = locale === 'he' ? 'rtl' : 'ltr';
  const t = useTranslations('calendar');
  const searchParams = useSearchParams();

  // Get calendar return params if coming from calendar
  const returnMonth = searchParams.get('returnMonth');
  const returnYear = searchParams.get('returnYear');
  const hasCalendarReturn = returnMonth && returnYear;

  return (
    <div dir={dir} lang={locale} className="space-y-6">
      {/* Back to Calendar button - only show if coming from calendar */}
      {hasCalendarReturn && (
        <Link href={`/${locale}/calendar?month=${returnMonth}&year=${returnYear}`}>
          <Button variant="outline" size="sm" className="gap-2">
            {dir === 'rtl' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {t('backToCalendar')}
          </Button>
        </Link>
      )}

      {/* Case Header - Shows case summary and actions */}
      <CaseHeader caseData={initialData} locale={locale} />

      {/* Case Tabs - Main content area */}
      <CaseTabs caseData={initialData} />
    </div>
  );
}
