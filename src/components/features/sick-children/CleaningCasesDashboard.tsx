'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { DataTable } from '@/components/shared/DataTable';
import { CasesFilterBar, FilterConfig, ActionButton } from '@/components/shared/CasesFilterBar';
import { Plus, Archive, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BulkPaymentEntry } from './BulkPaymentEntry';
import { SendEmailsFlow } from './SendEmailsFlow';
import {
  createActiveCleaningColumns,
  createInactiveCleaningColumns,
  CleaningCaseWithPayment,
  CleaningColumnsTranslations,
  shouldHighlightRow,
} from '@/components/features/cases/columns';
import { useCleaningCases, useInvalidateCleaningCases } from '@/lib/hooks/useCleaningCases';

// ========================================
// Types
// ========================================

interface CleaningCasesDashboardProps {
  cases: CleaningCaseWithPayment[];
}

// ========================================
// Component
// ========================================

/**
 * CleaningCasesDashboard - Specialized dashboard for sick children cases
 *
 * Features:
 * - Current month payment display
 * - Visual indicator for missing payments after 15th of month
 * - Search by family name, child name, city
 * - End reason filtering (for inactive)
 */
export function CleaningCasesDashboard({ cases: initialCases }: CleaningCasesDashboardProps) {
  const t = useTranslations('cases');
  const tCleaning = useTranslations('sickChildren');
  const router = useRouter();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkEntry, setShowBulkEntry] = useState(false);
  const [showSendEmails, setShowSendEmails] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [endReasonFilter, setEndReasonFilter] = useState<string>('all');

  // Fetch cases with React Query (caching enabled)
  const { data: cases = [], isLoading } = useCleaningCases({
    status: showInactive ? 'inactive' : 'active',
    initialData: initialCases,
  });

  // For invalidating cache after mutations
  const { invalidateAll } = useInvalidateCleaningCases();

  // Filter cases by search term and end reason
  const filteredCases = useMemo(() => {
    if (!cases) return [];

    let filtered = cases;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((caseItem) => {
        return (
          caseItem.family_name?.toLowerCase().includes(term) ||
          caseItem.child_name?.toLowerCase().includes(term) ||
          caseItem.city?.toLowerCase().includes(term) ||
          caseItem.case_number.toString().includes(term)
        );
      });
    }

    // Filter by end reason (only for inactive)
    if (showInactive && endReasonFilter !== 'all') {
      filtered = filtered.filter((caseItem) => caseItem.end_reason === endReasonFilter);
    }

    return filtered;
  }, [cases, searchTerm, showInactive, endReasonFilter]);

  // Navigation handler
  const handleRowClick = useCallback(
    (caseItem: CleaningCaseWithPayment) => {
      router.push(`/cases/${caseItem.id}`);
    },
    [router]
  );

  // Refresh cases handler - invalidates React Query cache
  const refreshCases = useCallback(() => {
    invalidateAll();
  }, [invalidateAll]);

  // Toggle inactive handler
  const handleToggleInactive = useCallback(() => {
    setShowInactive((prev) => !prev);
    setEndReasonFilter('all');
    setSearchTerm('');
  }, []);

  // Column translations
  const columnTranslations: CleaningColumnsTranslations = useMemo(
    () => ({
      caseNumber: t('table.caseNumber'),
      familyName: tCleaning('dashboard.familyName'),
      city: t('table.city'),
      startDate: tCleaning('dashboard.startDate'),
      currentMonthPayment: tCleaning('dashboard.currentMonthPayment'),
      paymentStatus: tCleaning('dashboard.paymentStatus'),
      status: t('table.status'),
      missingPayment: tCleaning('dashboard.missingPayment'),
      noPayment: tCleaning('dashboard.noPayment'),
      // Inactive-specific
      endDate: tCleaning('dashboard.endDate'),
      endReason: tCleaning('dashboard.endReason'),
      reasons: {
        healed: tCleaning('inactiveFamilies.reasons.healed'),
        deceased: tCleaning('inactiveFamilies.reasons.deceased'),
        other: tCleaning('inactiveFamilies.reasons.other'),
      },
    }),
    [t, tCleaning]
  );

  // Create columns based on active/inactive mode
  const columns = useMemo(
    () =>
      showInactive
        ? createInactiveCleaningColumns(columnTranslations)
        : createActiveCleaningColumns(columnTranslations),
    [showInactive, columnTranslations]
  );

  // Filter configurations (only for inactive mode)
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        id: 'end_reason',
        placeholder: tCleaning('dashboard.filterByReason'),
        value: endReasonFilter,
        onChange: setEndReasonFilter,
        showWhen: showInactive,
        options: [
          { value: 'all', label: tCleaning('dashboard.allReasons') },
          { value: 'healed', label: tCleaning('inactiveFamilies.reasons.healed') },
          { value: 'deceased', label: tCleaning('inactiveFamilies.reasons.deceased') },
          { value: 'other', label: tCleaning('inactiveFamilies.reasons.other') },
        ],
      },
    ],
    [tCleaning, endReasonFilter, showInactive]
  );

  // Action buttons (only for active mode)
  const actionButtons: ActionButton[] = useMemo(
    () => [
      {
        id: 'bulk-entry',
        label: tCleaning('dashboard.bulkEntry'),
        icon: <Plus className="h-4 w-4 me-2" />,
        onClick: () => setShowBulkEntry(true),
        variant: 'default',
        className: 'bg-emerald-600 hover:bg-emerald-700',
        showWhen: !showInactive,
      },
      {
        id: 'send-emails',
        label: tCleaning('dashboard.sendEmails'),
        icon: <Mail className="h-4 w-4 me-2" />,
        onClick: () => setShowSendEmails(true),
        variant: 'outline',
        showWhen: !showInactive,
      },
      {
        id: 'inactive-toggle',
        label: tCleaning('dashboard.inactiveFamilies'),
        icon: <Archive className="h-4 w-4 me-2" />,
        onClick: handleToggleInactive,
        variant: showInactive ? 'default' : 'outline',
        className: showInactive ? 'bg-slate-700 hover:bg-slate-800' : '',
      },
    ],
    [tCleaning, showInactive, handleToggleInactive]
  );

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <CasesFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={tCleaning('dashboard.searchPlaceholder')}
        filters={filterConfigs}
        actions={actionButtons}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredCases}
        onRowClick={handleRowClick}
        isLoading={isLoading}
        rowClassName={(row) =>
          !showInactive && shouldHighlightRow(row)
            ? 'bg-red-50 hover:bg-red-100 cursor-pointer'
            : 'cursor-pointer hover:bg-muted'
        }
      />

      {/* Results count */}
      {filteredCases && (
        <div className="text-sm text-slate-600">
          {t('resultsCount', { count: filteredCases.length })}
        </div>
      )}

      {/* Bulk Payment Entry Modal */}
      <BulkPaymentEntry
        open={showBulkEntry}
        onOpenChange={setShowBulkEntry}
        onSuccess={refreshCases}
      />

      {/* Send Emails Flow Modal */}
      <SendEmailsFlow open={showSendEmails} onOpenChange={setShowSendEmails} onSuccess={() => {}} />
    </div>
  );
}
