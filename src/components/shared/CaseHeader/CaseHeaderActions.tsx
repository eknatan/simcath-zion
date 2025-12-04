'use client';

import { CaseWithRelations, CaseType } from '@/types/case.types';
import { ActionButton } from '@/components/shared/ActionButton';
import { ExportPDFButton } from '@/components/shared/ExportDocument';
import { AuditLogTimeline } from '@/components/shared/AuditLogTimeline';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Edit3,
  XCircle,
  MoreVertical,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CaseHeaderActionsProps {
  caseData: CaseWithRelations;
  onRejectCase?: () => void;
  onRestoreCase?: () => void;
  onCloseCase?: () => void;
  onReopenCase?: () => void;
}

export function CaseHeaderActions({
  caseData,
  onRejectCase,
  onRestoreCase,
  onCloseCase,
  onReopenCase,
}: CaseHeaderActionsProps) {
  const t = useTranslations('case');
  const isWedding = caseData.case_type === CaseType.WEDDING;
  const isCleaning = caseData.case_type === CaseType.CLEANING;

  const getExportFilename = () => {
    if (isWedding) {
      const groomName = caseData.groom_first_name || 'groom';
      const brideName = caseData.bride_first_name || 'bride';
      return `case_${caseData.case_number}_${groomName}_${brideName}`;
    } else {
      const familyName = caseData.family_name || 'family';
      return `case_${caseData.case_number}_${familyName}`;
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-200/60">
      {/* Wedding Actions */}
      {isWedding && (
        <>
          {/* Reject button - shown when NOT rejected */}
          {caseData.status !== 'rejected' && (
            <ActionButton
              variant="reject"
              size="sm"
              onClick={onRejectCase}
              data-testid="action-button"
            >
              <XCircle className="h-4 w-4 me-1" />
              {t('actions.reject')}
            </ActionButton>
          )}

          {/* Restore button - shown when rejected */}
          {caseData.status === 'rejected' && (
            <ActionButton
              variant="restore"
              size="sm"
              onClick={onRestoreCase}
              data-testid="action-button"
            >
              <RotateCcw className="h-4 w-4 me-1" />
              {t('actions.restoreCase')}
            </ActionButton>
          )}
        </>
      )}

      {/* Cleaning Actions */}
      {isCleaning && (
        <>
          <ActionButton variant="view" size="sm">
            <Edit3 className="h-4 w-4 me-1" />
            {t('actions.editDetails')}
          </ActionButton>

          {caseData.status === 'active' && (
            <ActionButton
              variant="reject"
              size="sm"
              onClick={onCloseCase}
            >
              <XCircle className="h-4 w-4 me-1" />
              {t('actions.closeCase')}
            </ActionButton>
          )}

          {caseData.status === 'inactive' && (
            <ActionButton
              variant="restore"
              size="sm"
              onClick={onReopenCase}
            >
              <RotateCcw className="h-4 w-4 me-1" />
              {t('actions.restoreCase')}
            </ActionButton>
          )}
        </>
      )}

      {/* Export PDF Button */}
      <ExportPDFButton
        documentType="case"
        data={caseData}
        filename={getExportFilename()}
        variant="outline"
        size="sm"
      />

      {/* Audit History Button */}
      <AuditLogTimeline history={caseData.history || []} />

      {/* More Options Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ActionButton variant="view" size="sm">
            <MoreVertical className="h-4 w-4" />
          </ActionButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Printer className="h-4 w-4 me-2" />
            {t('actions.print')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
