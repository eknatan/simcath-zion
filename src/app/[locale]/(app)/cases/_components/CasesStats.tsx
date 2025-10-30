'use client';

import { StatCard } from '@/components/shared/StatCard';
import { FileText, Heart, Users, CheckCircle2, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CasesStatsProps {
  stats: {
    total: number;
    wedding: number;
    cleaning: number;
    active: number;
    pendingTransfer: number;
  };
}

/**
 * CasesStats - Display statistics cards for cases overview
 */
export function CasesStats({ stats }: CasesStatsProps) {
  const t = useTranslations('cases.stats');

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title={t('total')}
        value={stats.total}
        description={t('totalDescription')}
        icon={FileText}
        colorScheme="blue"
      />

      <StatCard
        title={t('wedding')}
        value={stats.wedding}
        description={t('weddingDescription')}
        icon={Heart}
        colorScheme="red"
      />

      <StatCard
        title={t('cleaning')}
        value={stats.cleaning}
        description={t('cleaningDescription')}
        icon={Users}
        colorScheme="purple"
      />

      <StatCard
        title={t('active')}
        value={stats.active}
        description={t('activeDescription')}
        icon={CheckCircle2}
        colorScheme="emerald"
      />

      <StatCard
        title={t('pendingTransfer')}
        value={stats.pendingTransfer}
        description={t('pendingTransferDescription')}
        icon={Clock}
        colorScheme="orange"
      />
    </div>
  );
}
