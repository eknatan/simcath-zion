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

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import { ApplicantsList } from './ApplicantsList';
import { ApplicantStats } from './ApplicantStats';
import { useApplicants } from '@/lib/hooks/useApplicants';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { ActionButton } from '@/components/shared/ActionButton';
import Link from 'next/link';

interface ApplicantsContentProps {
  locale: string;
}

export function ApplicantsContent({ locale }: ApplicantsContentProps) {
  const t = useTranslations('applicants');
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected'>('pending');

  // Fetch data
  const {
    data: applicants,
    isLoading,
    error,
    refetch,
  } = useApplicants({ status: activeTab });

  // Calculate stats
  const stats = {
    pending: applicants?.filter((a) => !a.status || a.status === 'pending_approval')?.length || 0,
    approved: 0, // נחשב בנפרד אם צריך
    rejected: applicants?.filter((a) => a.status === 'rejected')?.length || 0,
  };

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
        {/* כפתור לטופס הציבורי */}
        <Link href={`/${locale}/public-forms/wedding`} target="_blank">
          <ActionButton variant="primary" size="default">
            <FileText className="h-4 w-4 me-2" />
            טופס חתונה ציבורי
            <ExternalLink className="h-3 w-3 ms-2" />
          </ActionButton>
        </Link>
      </div>

      {/* Stats */}
      <ApplicantStats stats={stats} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-8">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6">
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

        {/* Pending Tab */}
        <TabsContent value="pending">
          <ApplicantsList
            applicants={applicants || []}
            status="pending"
            onRefresh={refetch}
            locale={locale}
          />
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected">
          <ApplicantsList
            applicants={applicants || []}
            status="rejected"
            onRefresh={refetch}
            locale={locale}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
