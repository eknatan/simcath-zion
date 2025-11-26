'use client';

import { CaseWithRelations } from '@/types/case.types';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { InfoCard } from './InfoCard';
import { useCleaningFinancials } from './hooks/useCaseFinancials';
import {
  FileText,
  Calendar,
  MapPin,
  Banknote,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils/format';

interface CleaningCaseHeaderProps {
  caseData: CaseWithRelations;
}

export function CleaningCaseHeader({ caseData }: CleaningCaseHeaderProps) {
  const t = useTranslations('case');
  const { totalTransferred, activeMonths } = useCleaningFinancials(caseData);

  return (
    <>
      {/* Top Row: Badges + Family Name */}
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
          className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 border-violet-200/60"
        >
          <Users className="h-3 w-3 me-1" />
          <span className="hidden sm:inline">{t('type.cleaning')}</span>
          <span className="sm:hidden">{t('type.cleaningShort')}</span>
        </Badge>

        {/* Status Badge */}
        <StatusBadge status={caseData.status as any} />

        {/* Separator */}
        <span className="text-slate-300 hidden sm:inline">|</span>

        {/* Family Name */}
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          {caseData.family_name}
        </h1>

        {/* Child Name */}
        {caseData.child_name && (
          <span className="text-slate-500">
            ({t('childName')}: <span className="font-medium text-slate-700">{caseData.child_name}</span>)
          </span>
        )}
      </div>

      {/* Info Grid */}
      <div
        data-testid="cleaning-details-grid"
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
      >
        {/* Start Date */}
        {caseData.start_date && (
          <InfoCard
            icon={Calendar}
            iconColor="text-sky-600"
            iconBg="bg-sky-100"
            label={t('startDate')}
          >
            <div className="font-semibold text-slate-900">
              {new Date(caseData.start_date).toLocaleDateString('he-IL', {
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </InfoCard>
        )}

        {/* City */}
        {caseData.city && (
          <InfoCard
            icon={MapPin}
            iconColor="text-rose-600"
            iconBg="bg-rose-100"
          >
            <div className="font-semibold text-slate-900">{caseData.city}</div>
          </InfoCard>
        )}

        {/* Total Transferred */}
        <InfoCard
          icon={Banknote}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100"
          label={t('totalTransferred')}
        >
          <div className="font-bold text-emerald-700 font-mono">
            {formatCurrency(totalTransferred)}
          </div>
        </InfoCard>

        {/* Active Months */}
        <InfoCard
          icon={Calendar}
          iconColor="text-violet-600"
          iconBg="bg-violet-100"
          label={t('activeMonths')}
        >
          <div className="font-bold text-violet-700">
            {activeMonths} {t('months')}
          </div>
        </InfoCard>
      </div>
    </>
  );
}
