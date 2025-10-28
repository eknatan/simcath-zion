'use client';

/**
 * ApplicantStats
 *
 * כרטיסי סטטיסטיקות עם עיצוב לפי גרסה B (Elegant & Soft)
 *
 * עקרונות:
 * - עיצוב מינימלי ומקצועי
 * - גרדיאנטים עדינים
 * - צללים רכים
 * - responsive
 */

import { useTranslations } from 'next-intl';
import { FileText, CheckCircle2, XCircle } from 'lucide-react';
import { ActiveDesignTokens } from '@/lib/design-tokens';

interface ApplicantStatsProps {
  stats: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export function ApplicantStats({ stats }: ApplicantStatsProps) {
  const t = useTranslations('applicants');
  const { components } = ActiveDesignTokens;

  return (
    <div className={`mb-6 rounded-lg ${components.card.border} bg-white ${components.card.shadow} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-600">
          {t('stats.title')}
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {stats.pending}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {t('stats.pending')}
          </div>
        </div>

        {/* Approved */}
        <div className={`text-center border-x ${components.card.border.includes('border-slate-200') ? 'border-slate-200' : ''}`}>
          <div className="text-2xl font-bold text-green-600">
            {stats.approved}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {t('stats.approved_this_week')}
          </div>
        </div>

        {/* Rejected */}
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {stats.rejected}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {t('stats.rejected')}
          </div>
        </div>
      </div>
    </div>
  );
}
