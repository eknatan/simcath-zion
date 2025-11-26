'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CaseWithRelations, CaseType } from '@/types/case.types';
import { WeddingCaseHeader } from './WeddingCaseHeader';
import { CleaningCaseHeader } from './CleaningCaseHeader';
import { CaseHeaderActions } from './CaseHeaderActions';
import { useCleaningFinancials } from './hooks/useCaseFinancials';
import { UpdateStatusDialog } from '@/components/features/weddings/UpdateStatusDialog';
import { CloseDialog, ReopenDialog } from '@/components/features/sick-children/CloseDialog';

interface CaseHeaderProps {
  caseData: CaseWithRelations;
  locale?: string;
}

/**
 * CaseHeader - Main component that delegates to specific headers
 * Follows Single Responsibility - only orchestrates, doesn't render details
 */
export function CaseHeader({ caseData, locale = 'he' }: CaseHeaderProps) {
  const router = useRouter();
  const dir = locale === 'he' ? 'rtl' : 'ltr';
  const isWedding = caseData.case_type === CaseType.WEDDING;
  const isCleaning = caseData.case_type === CaseType.CLEANING;

  // Dialog states
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);

  // Get cleaning financials for dialog props (always call, use conditionally)
  const cleaningFinancials = useCleaningFinancials(caseData);

  const handleSuccess = () => router.refresh();

  return (
    <div
      data-testid="case-header"
      dir={dir}
      lang={locale}
      className="relative overflow-hidden rounded-lg border border-slate-200/60 bg-gradient-to-br from-slate-50 via-white to-sky-50/40 shadow-md"
    >
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-sky-500 to-teal-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-br from-rose-400 to-amber-400 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
      </div>

      <div className="relative p-4 sm:p-5">
        {/* Content */}
        <div className="space-y-4">
          {isWedding && <WeddingCaseHeader caseData={caseData} />}
          {isCleaning && <CleaningCaseHeader caseData={caseData} />}
        </div>

        {/* Actions */}
        <CaseHeaderActions
          caseData={caseData}
          onUpdateStatus={() => setShowStatusDialog(true)}
          onCloseCase={() => setShowCloseDialog(true)}
          onReopenCase={() => setShowReopenDialog(true)}
        />
      </div>

      {/* Dialogs */}
      {isWedding && (
        <UpdateStatusDialog
          open={showStatusDialog}
          onOpenChange={setShowStatusDialog}
          caseId={caseData.id}
          currentStatus={caseData.status || 'new'}
          onSuccess={handleSuccess}
        />
      )}

      {isCleaning && (
        <>
          <CloseDialog
            open={showCloseDialog}
            onOpenChange={setShowCloseDialog}
            caseId={caseData.id}
            hasPendingPayments={cleaningFinancials.hasPendingPayments}
            pendingPaymentInfo={cleaningFinancials.pendingPaymentInfo}
            onSuccess={handleSuccess}
          />
          <ReopenDialog
            open={showReopenDialog}
            onOpenChange={setShowReopenDialog}
            caseId={caseData.id}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  );
}
