'use client';

import { StatCard } from '@/components/shared/StatCard';
import {
  FileText,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Award,
  AlertCircle,
  Target,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDashboardStats } from '@/lib/hooks/useDashboard';

export function DashboardStats() {
  const t = useTranslations('dashboard');
  const { data: stats, isLoading } = useDashboardStats();

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `₪${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₪${(amount / 1000).toFixed(0)}K`;
    }
    return `₪${amount}`;
  };

  // Calculate percentage for trend
  const calculateTrend = () => {
    if (!stats || stats.totalCases === 0) return '0%';
    const percentage = ((stats.lastMonthCases / stats.totalCases) * 100).toFixed(1);
    return `+${percentage}%`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-lg border border-slate-200 bg-slate-50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t('stats.totalCases')}
        value={stats?.totalCases || 0}
        description={t('stats.totalDescription', { defaultValue: 'תיקים רשומים במערכת' })}
        icon={FileText}
        colorScheme="blue"
        trend={{
          value: calculateTrend(),
          label: t('stats.fromLastMonth', { defaultValue: 'מהחודש שעבר' }),
          icon: TrendingUp,
        }}
      />

      <StatCard
        title={t('stats.active')}
        value={stats?.activeCases || 0}
        description={t('stats.activeDescription', { defaultValue: 'תיקים פעילים כרגע' })}
        icon={CheckCircle2}
        colorScheme="emerald"
        trend={{
          value: stats?.totalCases ? `${((stats.activeCases / stats.totalCases) * 100).toFixed(1)}%` : '0%',
          label: t('stats.ofTotal', { defaultValue: 'מהתיקים' }),
          icon: Award,
        }}
      />

      <StatCard
        title={t('stats.pending')}
        value={stats?.pendingTransfers || 0}
        description={t('stats.pendingDescription', { defaultValue: 'ממתינים להעברה' })}
        icon={Clock}
        colorScheme="orange"
        trend={{
          value: t('stats.needsAttention', { defaultValue: 'דורש' }),
          label: t('stats.attention', { defaultValue: 'תשומת לב' }),
          icon: AlertCircle,
        }}
      />

      <StatCard
        title={t('stats.transferred')}
        value={formatCurrency(stats?.totalTransferred || 0)}
        description={t('stats.transferredDescription', { defaultValue: 'סכום מועבר השנה' })}
        icon={DollarSign}
        colorScheme="indigo"
        trend={{
          value: t('stats.yearlyTarget', { defaultValue: 'יעד שנתי' }),
          label: '',
          icon: Target,
        }}
      />
    </div>
  );
}
