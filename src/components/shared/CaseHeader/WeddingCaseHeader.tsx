'use client';

import { CaseWithRelations } from '@/types/case.types';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { InfoCard } from './InfoCard';
import { useWeddingFinancials } from './hooks/useCaseFinancials';
import {
  FileText,
  Calendar,
  MapPin,
  Banknote,
  Heart,
  Users,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils/format';
import { formatHebrewDateForDisplay } from '@/lib/utils/hebrew-date-parser';

interface WeddingCaseHeaderProps {
  caseData: CaseWithRelations;
}

export function WeddingCaseHeader({ caseData }: WeddingCaseHeaderProps) {
  const t = useTranslations('case');
  const { requestedAmount, approvedAmount } = useWeddingFinancials(caseData);

  return (
    <>
      {/* Top Row: Badges + Names */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Case Number */}
        <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-200/50 shadow-sm">
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          <span className="font-mono text-sm font-bold tracking-tight text-slate-800">
            #{caseData.case_number}
          </span>
        </div>

        {/* Type Badge */}
        <Badge
          variant="outline"
          className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border-rose-200/60"
        >
          <Heart className="h-3 w-3 me-1 fill-current" />
          <span className="hidden sm:inline">{t('type.wedding')}</span>
          <span className="sm:hidden">{t('type.weddingShort')}</span>
        </Badge>

        {/* Status Badge */}
        <StatusBadge status={caseData.status as any} />

        {/* Separator */}
        <span className="text-slate-300 hidden sm:inline">|</span>

        {/* Names */}
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          {caseData.groom_first_name} {caseData.groom_last_name}
        </h1>
        <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          {caseData.bride_first_name} {caseData.bride_last_name}
        </h1>
      </div>

      {/* Info Grid - Details + Financial */}
      <div
        data-testid="wedding-details-grid"
        className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
      >
        {/* Date */}
        {((caseData.hebrew_day && caseData.hebrew_month && caseData.hebrew_year) || caseData.wedding_date_hebrew) && (
          <InfoCard
            icon={Calendar}
            iconColor="text-sky-600"
            iconBg="bg-sky-100"
          >
            <div className="font-semibold text-slate-900 text-xs">
              {caseData.hebrew_day && caseData.hebrew_month && caseData.hebrew_year ? (
                formatHebrewDateForDisplay(caseData.hebrew_day, caseData.hebrew_month, caseData.hebrew_year, 'he')
              ) : (
                caseData.wedding_date_hebrew
              )}
            </div>
            {caseData.wedding_date_gregorian && (
              <div className="text-[10px] text-slate-500">
                {new Date(caseData.wedding_date_gregorian).toLocaleDateString('he-IL')}
              </div>
            )}
          </InfoCard>
        )}

        {/* City */}
        {caseData.city && (
          <InfoCard
            icon={MapPin}
            iconColor="text-rose-600"
            iconBg="bg-rose-100"
          >
            <div className="font-semibold text-slate-900 text-xs">{caseData.city}</div>
          </InfoCard>
        )}

        {/* Guests */}
        {caseData.guests_count && (
          <InfoCard
            icon={Users}
            iconColor="text-violet-600"
            iconBg="bg-violet-100"
          >
            <div className="font-semibold text-slate-900 text-xs">
              {caseData.guests_count} {t('guests')}
            </div>
          </InfoCard>
        )}

        {/* Wedding Cost */}
        {requestedAmount && (
          <InfoCard
            icon={TrendingUp}
            iconColor="text-amber-600"
            iconBg="bg-amber-100"
            label={t('weddingCost')}
          >
            <div className="font-bold text-slate-800 font-mono text-xs">
              {formatCurrency(requestedAmount)}
            </div>
          </InfoCard>
        )}

        {/* Approved Amount */}
        <InfoCard
          icon={approvedAmount ? Banknote : Clock}
          iconColor={approvedAmount ? "text-emerald-600" : "text-slate-400"}
          iconBg={approvedAmount ? "bg-emerald-100" : "bg-slate-100"}
          label={t('approvedAmount')}
        >
          {approvedAmount ? (
            <div className="font-bold text-emerald-700 font-mono text-xs">
              {formatCurrency(approvedAmount)}
            </div>
          ) : (
            <div className="text-xs font-medium text-slate-400">
              {t('notYetApproved')}
            </div>
          )}
        </InfoCard>
      </div>
    </>
  );
}
