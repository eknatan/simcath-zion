'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { CasesList } from './CasesList';
import { CleaningCasesDashboard } from '@/components/features/sick-children/CleaningCasesDashboard';
import { Case } from '@/types/case.types';

interface CasesContentProps {
  cases: Case[];
}

/**
 * CasesContent - Main content with tabs for different case types
 */
export function CasesContent({ cases }: CasesContentProps) {
  const t = useTranslations('cases');
  const [activeTab, setActiveTab] = useState('all');

  return (
    <Card className="border border-slate-200 shadow-md">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-xl font-bold text-slate-900">
          {t('tabs.title')}
        </CardTitle>
        <CardDescription>{t('tabs.description')}</CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted p-1 mb-6">
            <TabsTrigger value="all" className="data-[state=active]:bg-card">
              {t('tabs.all')}
            </TabsTrigger>
            <TabsTrigger value="wedding" className="data-[state=active]:bg-card">
              {t('tabs.wedding')}
            </TabsTrigger>
            <TabsTrigger value="cleaning" className="data-[state=active]:bg-card">
              {t('tabs.cleaning')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <CasesList cases={cases} />
          </TabsContent>

          <TabsContent value="wedding">
            <CasesList cases={cases.filter((c) => c.case_type === 'wedding')} />
          </TabsContent>

          <TabsContent value="cleaning">
            <CleaningCasesDashboard cases={cases.filter((c) => c.case_type === 'cleaning')} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
