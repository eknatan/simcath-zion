'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, FileDown, Trash2, Plus, Clock, CheckCircle2, HandCoins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActionButton } from '@/components/shared/ActionButton';
import { ExcelImportDialog } from '@/components/features/manual-transfers/ExcelImportDialog';
import { ManualTransfersTable } from '@/components/features/manual-transfers/ManualTransfersTable';
import { ManualTransferFilters, ManualTransferFiltersType } from '@/components/features/manual-transfers/ManualTransferFilters';
import { SimpleManualTransferDialog } from '@/components/features/manual-transfers/SimpleManualTransferDialog';
import { EditManualTransferDialog } from '@/components/features/manual-transfers/EditManualTransferDialog';
import { manualTransfersService } from '@/lib/services/manual-transfers.service';
import type { ManualTransfer } from '@/types/manual-transfers.types';
import { toast } from 'sonner';

type ManualTransferTab = 'active' | 'history';

export default function ManualTransfersPage() {
  const t = useTranslations('manualTransfers');
  const [activeTab, setActiveTab] = useState<ManualTransferTab>('active');
  const [transfers, setTransfers] = useState<ManualTransfer[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [manualTransferDialogOpen, setManualTransferDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<ManualTransfer | null>(null);
  const [filters, setFilters] = useState<ManualTransferFiltersType>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTransferId, setDeletingTransferId] = useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await manualTransfersService.getAll();

      if (error) {
        toast.error(t('common.error'), {
          description: error.message,
        });
        return;
      }

      // Filter by tab
      const filteredData = (data || []).filter((transfer) => {
        if (activeTab === 'history') {
          // Show in history if exported_at is set OR status is 'exported'
          return transfer.exported_at !== null || transfer.status === 'exported';
        } else {
          // Show in active if not exported
          return transfer.exported_at === null && transfer.status !== 'exported';
        }
      });

      setTransfers(filteredData);
    } catch {
      toast.error(t('common.error'), {
        description: t('messages.loadError'),
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  const handleDeleteClick = (id: string) => {
    setDeletingTransferId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTransferId) return;

    const { error } = await manualTransfersService.delete(deletingTransferId);

    if (error) {
      toast.error(t('common.error'), {
        description: error.message,
      });
    } else {
      toast.success(t('common.success'), {
        description: t('messages.deleteTransferSuccess'),
      });
      loadTransfers();
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== deletingTransferId));
    }

    setDeleteDialogOpen(false);
    setDeletingTransferId(null);
  };

  const handleEdit = (transfer: ManualTransfer) => {
    setEditingTransfer(transfer);
    setEditDialogOpen(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.length === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    const { error } = await manualTransfersService.bulkDelete(selectedIds);

    if (error) {
      toast.error(t('common.error'), {
        description: error.message,
      });
    } else {
      toast.success(t('common.success'), {
        description: t('messages.deleteSuccess', { count: selectedIds.length }),
      });
      loadTransfers();
      setSelectedIds([]);
    }

    setBulkDeleteDialogOpen(false);
  };

  const handleExport = async () => {
    if (selectedIds.length === 0) {
      toast.error(t('common.error'), {
        description: t('messages.selectAtLeastOne'),
      });
      return;
    }

    try {
      // Call API to generate MASAV file
      const response = await fetch('/api/manual-transfers/export/masav', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transfer_ids: selectedIds,
          payment_date: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate MASAV file');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Short filename: MT_YYMMDD.txt (13 chars)
      const now = new Date();
      const yy = now.getFullYear().toString().substring(2);
      const mm = (now.getMonth() + 1).toString().padStart(2, '0');
      const dd = now.getDate().toString().padStart(2, '0');
      a.download = `MT_${yy}${mm}${dd}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t('common.success'), {
        description: t('messages.exportSuccess', { count: selectedIds.length }),
      });

      // Refresh to update statuses
      loadTransfers();
      setSelectedIds([]);
    } catch (error) {
      toast.error(t('common.error'), {
        description: error instanceof Error ? error.message : t('messages.exportError'),
      });
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as ManualTransferTab);
    setSelectedIds([]);
    setFilters({});
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  // Filter and search transfers
  const filteredTransfers = useMemo(() => {
    let result = transfers;

    // Search by name or ID number
    if (filters.search) {
      const searchLower = filters.search.toLowerCase().trim();
      result = result.filter((transfer) => {
        const nameMatch = transfer.recipient_name?.toLowerCase().includes(searchLower);
        const idMatch = transfer.id_number?.includes(searchLower);
        return nameMatch || idMatch;
      });
    }

    // Filter by date range (based on created_at or exported_at depending on tab)
    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      result = result.filter((transfer) => {
        const dateToCompare = activeTab === 'history'
          ? (transfer.exported_at || transfer.created_at)
          : transfer.created_at;
        return dateToCompare && new Date(dateToCompare) >= fromDate;
      });
    }

    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      toDate.setHours(23, 59, 59, 999); // End of day
      result = result.filter((transfer) => {
        const dateToCompare = activeTab === 'history'
          ? (transfer.exported_at || transfer.created_at)
          : transfer.created_at;
        return dateToCompare && new Date(dateToCompare) <= toDate;
      });
    }

    return result;
  }, [transfers, filters, activeTab]);

  const summary = {
    total: filteredTransfers.length,
    totalAmount: filteredTransfers.reduce((sum, t) => sum + t.amount, 0),
    selected: selectedIds.length,
    selectedAmount: filteredTransfers
      .filter((t) => selectedIds.includes(t.id))
      .reduce((sum, t) => sum + t.amount, 0),
  };

  const renderTabContent = () => (
    <div className="space-y-6">
      {/* Filters - Only show in history tab */}
      {activeTab === 'history' && (
        <ManualTransferFilters
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
        />
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('stats.total')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('stats.totalAmount')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('he-IL', {
                style: 'currency',
                currency: 'ILS',
              }).format(summary.totalAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('stats.selected')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.selected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('stats.selectedAmount')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('he-IL', {
                style: 'currency',
                currency: 'ILS',
              }).format(summary.selectedAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('table.title')}</CardTitle>
              <CardDescription>
                {activeTab === 'active'
                  ? t('table.activeDescription')
                  : t('table.historyDescription')}
              </CardDescription>
            </div>
            <div className="flex gap-3">
              {activeTab === 'active' && (
                <>
                  <ActionButton
                    variant="primary"
                    onClick={() => setManualTransferDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 me-2" />
                    {t('actions.addManual')}
                  </ActionButton>
                  <ActionButton
                    variant="view"
                    onClick={() => setImportDialogOpen(true)}
                  >
                    <Upload className="h-4 w-4 me-2" />
                    {t('actions.uploadExcel')}
                  </ActionButton>
                </>
              )}
              {selectedIds.length > 0 && (
                <>
                  <ActionButton
                    variant="reject"
                    onClick={handleBulkDeleteClick}
                  >
                    <Trash2 className="h-4 w-4 me-2" />
                    {t('actions.deleteSelected', { count: selectedIds.length })}
                  </ActionButton>
                  {activeTab === 'active' && (
                    <ActionButton
                      variant="approve-primary"
                      onClick={handleExport}
                    >
                      <FileDown className="h-4 w-4 me-2" />
                      {t('actions.exportMasav', { count: selectedIds.length })}
                    </ActionButton>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : (
            <ManualTransfersTable
              transfers={filteredTransfers}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onDelete={handleDeleteClick}
              onEdit={activeTab === 'active' ? handleEdit : undefined}
              onRefresh={loadTransfers}
              showExportedDate={activeTab === 'history'}
              enablePagination={activeTab === 'history'}
              pageSize={50}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700">
              <HandCoins className="h-5 w-5" />
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
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gradient-to-br from-white to-slate-50/30 border border-slate-200 shadow-sm">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-50 data-[state=active]:to-amber-100/50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm"
          >
            <Clock className="w-4 h-4 me-2" />
            {t('tabs.active')}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-50 data-[state=active]:to-emerald-100/50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 me-2" />
            {t('tabs.history')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {renderTabContent()}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {renderTabContent()}
        </TabsContent>
      </Tabs>

      {/* Import Dialog */}
      <ExcelImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={loadTransfers}
      />

      {/* Manual Transfer Dialog */}
      <SimpleManualTransferDialog
        open={manualTransferDialogOpen}
        onOpenChange={setManualTransferDialogOpen}
        onSuccess={() => {
          loadTransfers();
          setManualTransferDialogOpen(false);
        }}
      />

      {/* Edit Transfer Dialog */}
      <EditManualTransferDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        transfer={editingTransfer}
        onSuccess={() => {
          loadTransfers();
          setEditDialogOpen(false);
          setEditingTransfer(null);
        }}
      />

      {/* Delete Single Transfer Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <ActionButton variant="cancel">{t('common.cancel')}</ActionButton>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <ActionButton variant="reject-primary" onClick={handleDeleteConfirm}>
                <Trash2 className="h-4 w-4 me-2" />
                {t('common.delete')}
              </ActionButton>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Multiple Transfers Confirmation */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.bulkTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('messages.deleteConfirm', { count: selectedIds.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <ActionButton variant="cancel">{t('common.cancel')}</ActionButton>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <ActionButton variant="reject-primary" onClick={handleBulkDeleteConfirm}>
                <Trash2 className="h-4 w-4 me-2" />
                {t('deleteDialog.bulkButton', { count: selectedIds.length })}
              </ActionButton>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
