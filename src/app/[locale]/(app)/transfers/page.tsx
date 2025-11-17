'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentType } from '@/types/case.types';
import { TransferTab, TransferTypeFilter as TransferTypeFilterEnum } from '@/types/transfers.types';
import { useTransfers } from '@/lib/hooks/useTransfers';
import { useTransferSelection } from '@/lib/hooks/useTransferSelection';
import { useExportTransfers } from '@/lib/hooks/useExportTransfers';
import { TransfersTabs } from './_components/TransfersTabs';
import { TransferSummary } from './_components/TransferSummary';
import { TransferFilters } from './_components/TransferFilters';
import { TransferTypeFilter } from './_components/TransferTypeFilter';
import { BulkActions } from './_components/BulkActions';
import { TransfersTable } from './_components/TransfersTable';
import { ExportDialog, ExportDialogType } from './_components/ExportDialog';
import { Building2 } from 'lucide-react';

export default function TransfersPage() {
  const t = useTranslations('transfers');

  // Tab state (Pending/Transferred)
  const [activeTab, setActiveTab] = useState<TransferTab>(TransferTab.PENDING);

  // Type filter state (All/Wedding/Cleaning)
  const [typeFilter, setTypeFilter] = useState<TransferTypeFilterEnum>(TransferTypeFilterEnum.ALL);

  // Dialog states
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportDialogType, setExportDialogType] = useState<ExportDialogType>(null);

  // Determine payment type based on type filter (null for ALL)
  const paymentType =
    typeFilter === TransferTypeFilterEnum.ALL
      ? null
      : typeFilter === TransferTypeFilterEnum.WEDDING
      ? PaymentType.WEDDING_TRANSFER
      : PaymentType.MONTHLY_CLEANING;

  // Determine if we're showing transferred or pending
  const showTransferred = activeTab === TransferTab.TRANSFERRED;

  // Hooks
  const {
    transfers,
    summary,
    isLoading,
    filters,
    setFilters,
    resetFilters,
    refresh,
  } = useTransfers({ paymentType, showTransferred });

  const {
    selectedIds,
    isAllSelected,
    selectedCount,
    selectedTransfers,
    toggleSelection,
    toggleAll,
    deselectAll,
  } = useTransferSelection(transfers);

  // For export, we need a specific payment type
  // If we're in ALL filter, we'll determine it from selected transfers
  const exportPaymentType =
    typeFilter === TransferTypeFilterEnum.ALL
      ? PaymentType.WEDDING_TRANSFER // Default, will be overridden in export handlers
      : paymentType!;

  const { exportToExcel, exportToMasav, isExporting } = useExportTransfers({
    paymentType: exportPaymentType,
    onSuccess: () => {
      deselectAll();
      refresh();
      setExportDialogOpen(false);
    },
  });

  // Calculate selected amount
  const selectedAmount = selectedTransfers.reduce(
    (sum, t) => sum + t.amount_ils,
    0
  );

  // Export handlers
  const handleExportExcel = () => {
    if (selectedCount === 0) return;

    // If in ALL filter, check that all selected transfers are of the same type
    if (typeFilter === TransferTypeFilterEnum.ALL) {
      const paymentTypes = new Set(selectedTransfers.map(t => t.payment_type));
      if (paymentTypes.size > 1) {
        toast.error(t('export.mixedTypesError') || 'Cannot export mixed transfer types. Please select only one type.');
        return;
      }
    }

    setExportDialogType('excel');
    setExportDialogOpen(true);
  };

  const handleExportMasav = () => {
    if (selectedCount === 0) return;

    // If in ALL filter, check that all selected transfers are of the same type
    if (typeFilter === TransferTypeFilterEnum.ALL) {
      const paymentTypes = new Set(selectedTransfers.map(t => t.payment_type));
      if (paymentTypes.size > 1) {
        toast.error(t('export.mixedTypesError') || 'Cannot export mixed transfer types. Please select only one type.');
        return;
      }
    }

    setExportDialogType('masav');
    setExportDialogOpen(true);
  };

  const handleExportConfirm = async (options: any) => {
    if (exportDialogType === 'excel') {
      await exportToExcel(selectedTransfers, options);
    } else if (exportDialogType === 'masav') {
      await exportToMasav(selectedTransfers, options);
    }
  };

  // Tab change handler
  const handleTabChange = (tab: TransferTab) => {
    setActiveTab(tab);
    deselectAll();
    resetFilters();
  };

  // Type filter change handler
  const handleTypeFilterChange = (filter: TransferTypeFilterEnum) => {
    setTypeFilter(filter);
    deselectAll();
    resetFilters();
  };

  // Common content for both tabs
  const renderTabContent = () => (
    <div className="space-y-6">
      {/* Type Filter */}
      <div className="flex items-center justify-start">
        <TransferTypeFilter value={typeFilter} onChange={handleTypeFilterChange} />
      </div>

      {/* Summary Cards */}
      {/* <TransferSummary
        summary={summary}
        selectedCount={selectedCount}
        selectedAmount={selectedAmount}
      /> */}

      {/* Filters */}
      <TransferFilters
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
        activeTab={activeTab}
      />

      {/* Bulk Actions */}
      {!showTransferred && (
        <BulkActions
          isAllSelected={isAllSelected}
          selectedCount={selectedCount}
          totalCount={transfers.length}
          onToggleAll={toggleAll}
          onExportExcel={handleExportExcel}
          onExportMasav={handleExportMasav}
          onRefresh={refresh}
          onDeselectAll={deselectAll}
          isExporting={isExporting}
        />
      )}

      {/* Table */}
      <TransfersTable
        transfers={transfers}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
        activeTab={activeTab}
        typeFilter={typeFilter}
        isLoading={isLoading}
      />
    </div>
  );

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <Card className="mb-6 border border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-sky-200 text-sky-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-2xl text-slate-900">
                {t('title')}
              </CardTitle>
              <CardDescription className="text-slate-600">
                {t('subtitle')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <TransfersTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingContent={renderTabContent()}
        transferredContent={renderTabContent()}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        type={exportDialogType}
        onConfirm={handleExportConfirm}
        isExporting={isExporting}
      />
    </div>
  );
}
