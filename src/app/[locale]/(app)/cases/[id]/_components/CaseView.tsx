'use client';

import { CaseWithRelations } from '@/types/case.types';
import { CaseHeader } from '@/components/shared/CaseHeader/CaseHeader';
import { CaseTabs } from './CaseTabs';

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

  return (
    <div dir={dir} lang={locale} className="space-y-6">
      {/* Case Header - Shows case summary and actions */}
      <CaseHeader caseData={initialData} locale={locale} />

      {/* Case Tabs - Main content area */}
      <CaseTabs caseData={initialData} />
    </div>
  );
}
