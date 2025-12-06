'use client';

/**
 * ApplicantsContent
 *
 * קומפוננטה ראשית לניהול בקשות ממתינות
 * Client Component כדי לאפשר interactivity
 *
 * עקרונות SOLID:
 * - Single Responsibility: מנהל state ו-UI של הבקשות
 * - Open/Closed: ניתן להרחבה עם טאבים נוספים
 * - Dependency Inversion: משתמש בקומפוננטות משותפות
 */

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { XCircle, Clock } from 'lucide-react';
import { ApplicantsList } from './ApplicantsList';
import { ApplicantStats } from './ApplicantStats';
import { FormLinkCard } from './FormLinkCard';
import { useApplicants, useApplicantStats } from '@/lib/hooks/useApplicants';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { ApplicantStatus } from '@/types/case.types';

interface ApplicantsContentProps {
  locale: string;
}

export function ApplicantsContent({ locale }: ApplicantsContentProps) {
  const t = useTranslations('applicants');
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Map tab value to ApplicantStatus
  const statusFilter = activeTab === 'pending'
    ? ApplicantStatus.PENDING_APPROVAL
    : ApplicantStatus.REJECTED;

  // Memoize initialFilters to prevent infinite loop
  const initialFilters = useMemo(() => ({ status: statusFilter }), [statusFilter]);

  // Fetch data
  const {
    data: applicants,
    isLoading,
    error,
    refetch,
  } = useApplicants(initialFilters);

  // Fetch stats separately (from all applicants, not just filtered)
  const { stats } = useApplicantStats();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error.message || 'Unknown error'} onRetry={refetch} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-blue-600">
            {t('page_title')}
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            {t('page_description')}
          </p>
        </div>
      </div>

      {/* Form Link Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <FormLinkCard formType="wedding" locale={locale} />
        <FormLinkCard formType="sick-children" locale={locale} />
      </div>

      {/* Stats */}
      <ApplicantStats stats={stats} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-8">
        {/* Search + Tabs in same row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Search Bar */}
          <div className="w-full sm:w-80">
            <Input
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-2"
            />
          </div>

          <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
            <TabsTrigger
              value="pending"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Clock className="h-4 w-4 me-2" />
              {t('tabs.pending')}
            </TabsTrigger>
            <TabsTrigger
              value="rejected"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              <XCircle className="h-4 w-4 me-2" />
              {t('tabs.rejected')}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Pending Tab */}
        <TabsContent value="pending">
          <ApplicantsList
            applicants={applicants || []}
            status="pending"
            onRefresh={refetch}
            locale={locale}
            searchQuery={searchQuery}
          />
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected">
          <ApplicantsList
            applicants={applicants || []}
            status="rejected"
            onRefresh={refetch}
            locale={locale}
            searchQuery={searchQuery}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
