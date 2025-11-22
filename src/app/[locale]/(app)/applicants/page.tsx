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

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ApplicantStatus, CaseType, Applicant } from '@/types/case.types';
import { useApplicants } from '@/lib/hooks/useApplicants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ClipboardList, XCircle, CheckCircle2, RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils/format';
import { useRouter } from '@/i18n/routing';

export default function ApplicantsPage() {
  const t = useTranslations('applicants');
  const tCommon = useTranslations('common');
  const router = useRouter();
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

  // Define table columns
  const columns: ColumnDef<Applicant>[] = useMemo(
    () => [
      {
        accessorKey: 'request_number',
        header: t('table.requestNumber'),
        cell: ({ row }) => (
          <div className="font-semibold">#{row.original.request_number}</div>
        ),
      },
      {
        accessorKey: 'groom_name',
        header: t('table.groomName'),
        cell: ({ row }) => {
          const formData = row.original.form_data as any;
          return (
            <div className="font-medium">
              {formData?.groom_info?.first_name || ''} {formData?.groom_info?.last_name || ''}
            </div>
          );
        },
      },
      {
        accessorKey: 'bride_name',
        header: t('table.brideName'),
        cell: ({ row }) => {
          const formData = row.original.form_data as any;
          return (
            <div>
              {formData?.bride_info?.first_name || ''} {formData?.bride_info?.last_name || ''}
            </div>
          );
        },
      },
      {
        accessorKey: 'city',
        header: t('table.city'),
        cell: ({ row }) => {
          const formData = row.original.form_data as any;
          return <div>{formData?.groom_info?.city || '-'}</div>;
        },
      },
      {
        accessorKey: 'created_at',
        header: t('table.createdAt'),
        cell: ({ row }) =>
          row.original.created_at ? (
            <div className="text-sm text-muted-foreground">
              {formatDate(row.original.created_at)}
            </div>
          ) : (
            '-'
          ),
      },
      {
        id: 'actions',
        header: tCommon('actions'),
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/applicants/pending/${row.original.id}`);
            }}
          >
            <Eye className="h-4 w-4 me-1" />
            {tCommon('view')}
          </Button>
        ),
      },
    ],
    [t, tCommon, router]
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
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
      <Card className="p-6 shadow-sm border-2 border-border bg-card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {t('stats.title')}
          </h3>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-6">
          {/* Pending */}
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {stats.pending}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('stats.pending')}
            </div>
          </div>

          {/* Approved this week */}
          <div className="text-center border-x-2 border-border">
            <div className="text-3xl font-bold text-success">12</div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('stats.approved_week')}
            </div>
          </div>

          {/* Rejected */}
          <div className="text-center">
            <div className="text-3xl font-bold text-destructive">
              {stats.rejected}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('stats.rejected')}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted">
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <ClipboardList className="h-4 w-4 me-2" />
            {t('tabs.pending')}
            {stats.pending > 0 && (
              <Badge className="ms-2 bg-primary/20 text-primary-foreground hover:bg-primary/20">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
          >
            <XCircle className="h-4 w-4 me-2" />
            {t('tabs.rejected')}
            {stats.rejected > 0 && (
              <Badge className="ms-2 bg-destructive/20 text-destructive-foreground hover:bg-destructive/20">
                {stats.rejected}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ms-3 text-muted-foreground">{t('loading')}</span>
            </div>
          ) : error ? (
            <Card className="p-8 text-center border-2 border-destructive/30 bg-destructive/5">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-destructive mb-2">
                {t('error.title')}
              </h3>
              <p className="text-sm text-destructive/80">{t('error.description')}</p>
            </Card>
          ) : applicants.length === 0 ? (
            <Card className="p-12 text-center bg-card">
              <div className="rounded-full bg-muted p-6 w-fit mx-auto mb-4">
                <CheckCircle2 className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {t('empty.pending.title')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('empty.pending.description')}
              </p>
            </Card>
          ) : (
            <DataTable
              columns={columns}
              data={applicants}
              onRowClick={(applicant) => router.push(`/applicants/pending/${applicant.id}`)}
            />
          )}
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-destructive" />
              <span className="ms-3 text-muted-foreground">{t('loading')}</span>
            </div>
          ) : applicants.length === 0 ? (
            <Card className="p-12 text-center bg-card">
              <div className="rounded-full bg-muted p-6 w-fit mx-auto mb-4">
                <CheckCircle2 className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {t('empty.rejected.title')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('empty.rejected.description')}
              </p>
            </Card>
          ) : (
            <DataTable
              columns={columns}
              data={applicants}
              onRowClick={(applicant) => router.push(`/applicants/pending/${applicant.id}`)}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
