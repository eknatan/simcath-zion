'use client';

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
  Download,
  Trash2,
  RotateCcw,
  Heart,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils/format';
import { ExportDocument } from '@/components/shared/ExportDocument';
import { CaseSummary } from '@/components/shared/CaseSummary';
import { AuditLogTimeline } from '@/components/shared/AuditLogTimeline';

interface CaseHeaderProps {
  caseData: CaseWithRelations;
}

/**
 * CaseHeader - Displays case summary information and action buttons
 *
 * Shows different content based on case type:
 * - Wedding: Groom & Bride names, wedding date, city, amount
 * - Cleaning: Family name, child name, start date, total transferred
 *
 * Version B design: Elegant & Soft with gradient background
 */
export function CaseHeader({ caseData }: CaseHeaderProps) {
  const t = useTranslations('case');
  const isWedding = caseData.case_type === CaseType.WEDDING;
  const isCleaning = caseData.case_type === CaseType.CLEANING;

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
    <div className="bg-gradient-to-br from-white to-sky-50/30 border border-slate-200 shadow-md rounded-lg p-6">
      {/* Top Row: Case Number, Type Badge, Status Badge */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
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
                {t('type.wedding')}
              </>
            ) : (
              <>
                <Users className="h-3 w-3 me-1" />
                {t('type.cleaning')}
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
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 text-sm">
              {/* Date */}
              {caseData.wedding_date_hebrew && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="h-4 w-4 text-sky-600" />
                  <div>
                    <div className="font-medium">{caseData.wedding_date_hebrew}</div>
                    {caseData.wedding_date_gregorian && (
                      <div className="text-xs text-slate-500">
                        ({new Date(caseData.wedding_date_gregorian).toLocaleDateString('he-IL')})
                      </div>
                    )}
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
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 text-sm">
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
      <div className="flex gap-2 mt-6 flex-wrap">
        {/* Wedding Actions */}
        {isWedding && (
          <>
            <ActionButton variant="view" size="sm">
              <Edit3 className="h-4 w-4 me-1" />
              {t('actions.updateStatus')}
            </ActionButton>

            {caseData.status === 'new' && (
              <ActionButton variant="approve" size="sm">
                <CheckCircle2 className="h-4 w-4 me-1" />
                {t('actions.approveTransfer')}
              </ActionButton>
            )}

            <ActionButton variant="reject" size="sm">
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
              <ActionButton variant="reject" size="sm">
                <XCircle className="h-4 w-4 me-1" />
                {t('actions.closeCase')}
              </ActionButton>
            )}

            {caseData.status === 'inactive' && (
              <ActionButton variant="restore" size="sm">
                <RotateCcw className="h-4 w-4 me-1" />
                {t('actions.restoreCase')}
              </ActionButton>
            )}
          </>
        )}

        {/* Export PDF Button */}
        <ExportDocument
          filename={getExportFilename()}
          title={`תיק מספר ${caseData.case_number}`}
          variant="outline"
          size="sm"
          direction="rtl"
          showIcon={true}
          onExportComplete={() => {
            // Optional: Add success notification
          }}
          onExportError={() => {
            // Optional: Add error handling
          }}
        >
          <CaseSummary caseData={caseData} />
        </ExportDocument>

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

  </div>
  );
}
