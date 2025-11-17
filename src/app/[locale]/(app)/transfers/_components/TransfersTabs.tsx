'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { TransferTab } from '@/types/transfers.types';
import { Clock, CheckCircle2 } from 'lucide-react';

interface TransfersTabsProps {
  activeTab: TransferTab;
  onTabChange: (tab: TransferTab) => void;
  pendingContent: React.ReactNode;
  transferredContent: React.ReactNode;
}

export function TransfersTabs({
  activeTab,
  onTabChange,
  pendingContent,
  transferredContent,
}: TransfersTabsProps) {
  const t = useTranslations('transfers');

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as TransferTab)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2 bg-gradient-to-br from-white to-slate-50/30 border border-slate-200 shadow-sm">
        <TabsTrigger
          value={TransferTab.PENDING}
          className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-50 data-[state=active]:to-amber-100/50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm"
        >
          <Clock className="w-4 h-4 me-2" />
          {t('tabs.pending')}
        </TabsTrigger>
        <TabsTrigger
          value={TransferTab.TRANSFERRED}
          className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-50 data-[state=active]:to-emerald-100/50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4 me-2" />
          {t('tabs.transferred')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value={TransferTab.PENDING} className="mt-6">
        {pendingContent}
      </TabsContent>

      <TabsContent value={TransferTab.TRANSFERRED} className="mt-6">
        {transferredContent}
      </TabsContent>
    </Tabs>
  );
}
