'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { WeddingCasesList } from './WeddingCasesList';
import { CleaningCasesDashboard } from '@/components/features/sick-children/CleaningCasesDashboard';
import { CaseForTable } from '@/types/case.types';
import { Heart, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CasesContentProps {
  cases: CaseForTable[];
}

/**
 * CasesContent - Main content with tabs for different case types
 */
export function CasesContent({ cases }: CasesContentProps) {
  const t = useTranslations('cases');
  const [activeTab, setActiveTab] = useState('wedding');

  // Filter out completed/rejected wedding cases (transferred, rejected, expired)
  const weddingCases = useMemo(
    () => cases.filter((c) => c.case_type === 'wedding' && !['transferred', 'rejected', 'expired'].includes(c.status)),
    [cases]
  );
  // Only pass active cleaning cases as initial data
  // The CleaningCasesDashboard will fetch inactive cases from the API when needed
  const cleaningCases = useMemo(
    () => cases.filter((c) => c.case_type === 'cleaning' && c.status === 'active'),
    [cases]
  );

  // Count active cases
  const weddingCount = weddingCases.length;
  const cleaningCount = cleaningCases.length; // Already filtered to active only

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {/* Segmented Control Style Tabs */}
      <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100 p-1 mb-4 rounded-lg gap-1.5">
        <TabsTrigger
          value="wedding"
          className={cn(
            'relative h-full rounded-lg font-medium transition-all duration-300 ease-out',
            'flex items-center justify-center gap-2',
            'data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700',
            'data-[state=active]:border-2 data-[state=active]:border-purple-300',
            'data-[state=active]:shadow-sm',
            'data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:bg-slate-50',
            'data-[state=inactive]:hover:text-purple-600'
          )}
        >
          <Heart className="h-4 w-4" />
          <span>{t('tabs.wedding')}</span>
          <Badge
            variant="secondary"
            className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 border-purple-200"
          >
            {weddingCount}
          </Badge>
        </TabsTrigger>
        <TabsTrigger
          value="cleaning"
          className={cn(
            'relative h-full rounded-lg font-medium transition-all duration-300 ease-out',
            'flex items-center justify-center gap-2',
            'data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700',
            'data-[state=active]:border-2 data-[state=active]:border-sky-300',
            'data-[state=active]:shadow-sm',
            'data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:bg-slate-50',
            'data-[state=inactive]:hover:text-sky-600'
          )}
        >
          <Stethoscope className="h-4 w-4" />
          <span>{t('tabs.cleaning')}</span>
          <Badge
            variant="secondary"
            className="text-xs px-2 py-0.5 bg-sky-100 text-sky-700 border-sky-200"
          >
            {cleaningCount}
          </Badge>
        </TabsTrigger>
      </TabsList>

      {/* Animated Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <TabsContent value="wedding" className="mt-0">
            <WeddingCasesList cases={weddingCases} />
          </TabsContent>

          <TabsContent value="cleaning" className="mt-0">
            <CleaningCasesDashboard cases={cleaningCases} />
          </TabsContent>
        </motion.div>
      </AnimatePresence>
    </Tabs>
  );
}
