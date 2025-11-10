'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { TransferTab } from '@/types/transfers.types';
import { Home, Heart, Layers } from 'lucide-react';

interface TransfersTabsProps {
  activeTab: TransferTab;
  onTabChange: (tab: TransferTab) => void;
  allContent: React.ReactNode;
  weddingContent: React.ReactNode;
  cleaningContent: React.ReactNode;
}

export function TransfersTabs({
  activeTab,
  onTabChange,
  allContent,
  weddingContent,
  cleaningContent,
}: TransfersTabsProps) {
  const t = useTranslations('transfers');

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as TransferTab)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3 bg-gradient-to-br from-white to-slate-50/30 border border-slate-200 shadow-sm">
        <TabsTrigger
          value={TransferTab.ALL}
          className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-50 data-[state=active]:to-slate-100/50 data-[state=active]:text-slate-700 data-[state=active]:shadow-sm"
        >
          <Layers className="w-4 h-4 me-2" />
          {t('tabs.all')}
        </TabsTrigger>
        <TabsTrigger
          value={TransferTab.WEDDING}
          className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-sky-50 data-[state=active]:to-sky-100/50 data-[state=active]:text-sky-700 data-[state=active]:shadow-sm"
        >
          <Home className="w-4 h-4 me-2" />
          {t('tabs.wedding')}
        </TabsTrigger>
        <TabsTrigger
          value={TransferTab.CLEANING}
          className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-50 data-[state=active]:to-emerald-100/50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
        >
          <Heart className="w-4 h-4 me-2" />
          {t('tabs.cleaning')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value={TransferTab.ALL} className="mt-6">
        {allContent}
      </TabsContent>

      <TabsContent value={TransferTab.WEDDING} className="mt-6">
        {weddingContent}
      </TabsContent>

      <TabsContent value={TransferTab.CLEANING} className="mt-6">
        {cleaningContent}
      </TabsContent>
    </Tabs>
  );
}
