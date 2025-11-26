'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CaseWithRelations, CaseType } from '@/types/case.types';
import { ActionButton } from '@/components/shared/ActionButton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Calendar,
  MapPin,
  DollarSign,
  Edit3,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Printer,
  Trash2,
  RotateCcw,
  Heart,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils/format';
import { formatHebrewDateForDisplay } from '@/lib/utils/hebrew-date-parser';
import { ExportPDFButton } from '@/components/shared/ExportDocument';
import { AuditLogTimeline } from '@/components/shared/AuditLogTimeline';
import { CloseDialog, ReopenDialog } from '@/components/features/sick-children/CloseDialog';

interface CaseHeaderProps {
  caseData: CaseWithRelations;
  locale?: string;
}

/**
 * CaseHeader - Displays case summary information and action buttons
 *
 * Shows different content based on case type:
 * - Wedding: Groom & Bride names, wedding date, city, amount
 * - Cleaning: Family name, child name, start date, total transferred
 *
 * Version B design: Elegant & Soft with gradient background
 * RTL support: Proper text direction and icon mirroring for Hebrew
 */
export function CaseHeader({ caseData, locale = 'he' }: CaseHeaderProps) {
  const t = useTranslations('case');
  const router = useRouter();
  const dir = locale === 'he' ? 'rtl' : 'ltr';
  const isWedding = caseData.case_type === CaseType.WEDDING;
  const isCleaning = caseData.case_type === CaseType.CLEANING;

  // Dialog states for cleaning cases
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);

  // Check for pending payments
  const pendingPayments = caseData.payments?.filter(p => p.status === 'pending') || [];
  const hasPendingPayments = pendingPayments.length > 0;
  const pendingPaymentInfo = hasPendingPayments && pendingPayments[0]?.payment_month
    ? {
        month: new Date(pendingPayments[0].payment_month).toLocaleDateString('he-IL', {
          month: 'long',
          year: 'numeric',
        }),
        amount: pendingPayments[0].amount_ils || 0,
      }
    : undefined;

  // Calculate total transferred for cleaning cases
  const totalTransferred = caseData.payments?.reduce(
    (sum, payment) => sum + payment.amount_ils,
    0
  ) || 0;

  // Count active months for cleaning cases
  const activeMonths = caseData.payments?.length || 0;

  // Generate filename for export
  const getExportFilename = () => {
    if (caseData.case_type === CaseType.WEDDING) {
      const groomName = caseData.groom_first_name || 'groom';
      const brideName = caseData.bride_first_name || 'bride';
      return `case_${caseData.case_number}_${groomName}_${brideName}`;
    } else {
      const familyName = caseData.family_name || 'family';
      return `case_${caseData.case_number}_${familyName}`;
    }
  };

  return (
    <div
      data-testid="case-header"
      dir={dir}
      lang={locale}
      className="bg-gradient-to-br from-white to-sky-50/30 border border-slate-200 shadow-md rounded-lg p-4 sm:p-6"
    >
      {/* Top Row: Case Number, Type Badge, Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-600" />
            <span className="text-lg font-bold text-slate-900">
              #{caseData.case_number}
            </span>
          </div>

          <Badge
            variant="outline"
            className={
              isWedding
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : 'bg-purple-50 text-purple-700 border-purple-200'
            }
          >
            {isWedding ? (
              <>
                <Heart className="h-3 w-3 me-1" />
                <span className="hidden sm:inline">{t('type.wedding')}</span>
                <span className="sm:hidden">{t('type.weddingShort')}</span>
              </>
            ) : (
              <>
                <Users className="h-3 w-3 me-1" />
                <span className="hidden sm:inline">{t('type.cleaning')}</span>
                <span className="sm:hidden">{t('type.cleaningShort')}</span>
              </>
            )}
          </Badge>

          <StatusBadge status={caseData.status as any} />
        </div>
      </div>

      {/* Main Content: Different for each case type */}
      <div className="space-y-4">
        {/* Wedding Case */}
        {isWedding && (
          <>
            {/* Names */}
            <div className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <span>{caseData.groom_first_name} {caseData.groom_last_name}</span>
              <Heart className="h-5 w-5 text-rose-500" />
              <span>{caseData.bride_first_name} {caseData.bride_last_name}</span>
            </div>

            {/* Wedding Details Grid */}
            <div
              data-testid="wedding-details-grid"
              className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 text-sm"
            >
              {/* Date */}
              {(caseData.hebrew_day && caseData.hebrew_month && caseData.hebrew_year) || caseData.wedding_date_hebrew ? (
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="h-4 w-4 text-sky-600" />
                  <div>
                    <div className="font-medium">
                      {caseData.hebrew_day && caseData.hebrew_month && caseData.hebrew_year ? (
                        formatHebrewDateForDisplay(caseData.hebrew_day, caseData.hebrew_month, caseData.hebrew_year, 'he')
                      ) : (
                        caseData.wedding_date_hebrew
                      )}
                    </div>
                    {caseData.wedding_date_gregorian && (
                      <div className="text-xs text-slate-500">
                        ({new Date(caseData.wedding_date_gregorian).toLocaleDateString('he-IL')})
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* City */}
              {caseData.city && (
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="h-4 w-4 text-rose-600" />
                  <span className="font-medium">{caseData.city}</span>
                </div>
              )}

              {/* Guests */}
              {caseData.guests_count && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium">{caseData.guests_count} {t('guests')}</span>
                </div>
              )}

              {/* Approved Amount */}
              {caseData.total_cost && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="text-xs text-slate-600">{t('approvedAmount')}</div>
                    <div className="font-bold text-emerald-700">
                      {formatCurrency(caseData.total_cost)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Cleaning Case */}
        {isCleaning && (
          <>
            {/* Family Name */}
            <div className="text-2xl font-bold text-slate-900">
              {caseData.family_name}
            </div>

            {/* Child Name */}
            {caseData.child_name && (
              <div className="text-lg text-slate-700">
                {t('childName')}: <span className="font-semibold">{caseData.child_name}</span>
              </div>
            )}

            {/* Cleaning Details Grid */}
            <div
              data-testid="cleaning-details-grid"
              className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 text-sm"
            >
              {/* Start Date */}
              {caseData.start_date && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="h-4 w-4 text-sky-600" />
                  <div>
                    <div className="text-xs text-slate-600">{t('startDate')}</div>
                    <div className="font-medium">
                      {new Date(caseData.start_date).toLocaleDateString('he-IL', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* City */}
              {caseData.city && (
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="h-4 w-4 text-rose-600" />
                  <span className="font-medium">{caseData.city}</span>
                </div>
              )}

              {/* Total Transferred */}
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-xs text-slate-600">{t('totalTransferred')}</div>
                  <div className="font-bold text-emerald-700">
                    {formatCurrency(totalTransferred)}
                  </div>
                </div>
              </div>

              {/* Active Months */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="text-xs text-slate-600">{t('activeMonths')}</div>
                  <div className="font-bold text-purple-700">
                    {activeMonths} {t('months')}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-6 sm:flex-row">
        {/* Wedding Actions */}
        {isWedding && (
          <>
            <ActionButton variant="view" size="sm" data-testid="action-button">
              <Edit3 className="h-4 w-4 me-1" />
              {t('actions.updateStatus')}
            </ActionButton>

            {caseData.status === 'new' && (
              <ActionButton variant="approve" size="sm" data-testid="action-button">
                <CheckCircle2 className="h-4 w-4 me-1" />
                {t('actions.approveTransfer')}
              </ActionButton>
            )}

            <ActionButton variant="reject" size="sm" data-testid="action-button">
              <XCircle className="h-4 w-4 me-1" />
              {t('actions.reject')}
            </ActionButton>
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
                onClick={() => setShowCloseDialog(true)}
              >
                <XCircle className="h-4 w-4 me-1" />
                {t('actions.closeCase')}
              </ActionButton>
            )}

            {caseData.status === 'inactive' && (
              <ActionButton
                variant="restore"
                size="sm"
                onClick={() => setShowReopenDialog(true)}
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
        <AuditLogTimeline
          history={caseData.history || []}
        />

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
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="h-4 w-4 me-2" />
              {t('actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Close/Reopen Dialogs for Cleaning Cases */}
      {isCleaning && (
        <>
          <CloseDialog
            open={showCloseDialog}
            onOpenChange={setShowCloseDialog}
            caseId={caseData.id}
            hasPendingPayments={hasPendingPayments}
            pendingPaymentInfo={pendingPaymentInfo}
            onSuccess={() => {
              // Refresh the page to show updated status
              router.refresh();
            }}
          />
          <ReopenDialog
            open={showReopenDialog}
            onOpenChange={setShowReopenDialog}
            caseId={caseData.id}
            onSuccess={() => {
              // Refresh the page to show updated status
              router.refresh();
            }}
          />
        </>
      )}
  </div>
  );
}
