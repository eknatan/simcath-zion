/**
 * Applicants Management Page
 *
 * This page manages applicants with the following statuses:
 * - Pending approval (pending_approval)
 * - Rejected (rejected)
 *
 * SOLID Principles:
 * - Single Responsibility: Each component has a single purpose
 * - Open/Closed: Open for extension, closed for modification
 * - Dependency Inversion: Depends on useApplicants hook
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ApplicantStatus, CaseType } from '@/types/case.types';
import { useApplicants } from '@/lib/hooks/useApplicants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ClipboardList, XCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ApplicantsPage() {
  const t = useTranslations('applicants');
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected'>('pending');

  // Fetch data based on active tab
  const {
    applicants,
    isLoading,
    error,
    updateFilters,
    refresh,
  } = useApplicants({
    status:
      activeTab === 'pending'
        ? ApplicantStatus.PENDING_APPROVAL
        : ApplicantStatus.REJECTED,
    case_type: CaseType.WEDDING,
  });

  // Handle tab change
  const handleTabChange = (value: string) => {
    const newTab = value as 'pending' | 'rejected';
    setActiveTab(newTab);
    updateFilters({
      status:
        newTab === 'pending'
          ? ApplicantStatus.PENDING_APPROVAL
          : ApplicantStatus.REJECTED,
    });
  };

  // Calculate statistics
  const pendingCount = applicants.length; // This is approximate - ideally fetch from API
  const stats = {
    pending: activeTab === 'pending' ? pendingCount : 0,
    rejected: activeTab === 'rejected' ? pendingCount : 0,
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {t('title')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t('description')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {t('refresh')}
        </Button>
      </div>

      {/* Statistics */}
      <Card className="p-6 shadow-sm border-2 border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-600">
            {t('stats.title')}
          </h3>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-6">
          {/* Pending */}
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {stats.pending}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {t('stats.pending')}
            </div>
          </div>

          {/* Approved this week */}
          <div className="text-center border-x-2 border-slate-200">
            <div className="text-3xl font-bold text-green-600">12</div>
            <div className="text-xs text-slate-500 mt-1">
              {t('stats.approved_week')}
            </div>
          </div>

          {/* Rejected */}
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {stats.rejected}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {t('stats.rejected')}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white"
          >
            <ClipboardList className="h-4 w-4 me-2" />
            {t('tabs.pending')}
            {stats.pending > 0 && (
              <Badge className="ms-2 bg-blue-100 text-blue-700 hover:bg-blue-100">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white"
          >
            <XCircle className="h-4 w-4 me-2" />
            {t('tabs.rejected')}
            {stats.rejected > 0 && (
              <Badge className="ms-2 bg-red-100 text-red-700 hover:bg-red-100">
                {stats.rejected}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ms-3 text-slate-600">{t('loading')}</span>
            </div>
          ) : error ? (
            <Card className="p-8 text-center border-2 border-red-200 bg-red-50">
              <XCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                {t('error.title')}
              </h3>
              <p className="text-sm text-red-700">{t('error.description')}</p>
            </Card>
          ) : applicants.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="rounded-full bg-slate-100 p-6 w-fit mx-auto mb-4">
                <CheckCircle2 className="h-16 w-16 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {t('empty.pending.title')}
              </h3>
              <p className="text-sm text-slate-500">
                {t('empty.pending.description')}
              </p>
            </Card>
          ) : (
            <>
              {/* Filters & Search - TODO */}
              <Card className="p-4">
                <p className="text-sm text-slate-600">
                  {t('filters_coming_soon')}
                </p>
              </Card>

              {/* Table - TODO */}
              <Card className="p-4">
                <p className="text-sm text-slate-600">
                  Found {applicants.length} applicants
                </p>
                {/* Temporary list view */}
                <div className="mt-4 space-y-2">
                  {applicants.map((applicant: any) => (
                    <div
                      key={applicant.id}
                      className="p-4 border rounded-lg hover:bg-slate-50"
                    >
                      <p className="font-medium">
                        {applicant.form_data?.groom_info?.first_name || 'N/A'}{' '}
                        {applicant.form_data?.groom_info?.last_name || ''}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(applicant.created_at).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
              <span className="ms-3 text-slate-600">{t('loading')}</span>
            </div>
          ) : applicants.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="rounded-full bg-slate-100 p-6 w-fit mx-auto mb-4">
                <CheckCircle2 className="h-16 w-16 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {t('empty.rejected.title')}
              </h3>
              <p className="text-sm text-slate-500">
                {t('empty.rejected.description')}
              </p>
            </Card>
          ) : (
            <Card className="p-4">
              <p className="text-sm text-slate-600">
                Found {applicants.length} rejected applicants
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
