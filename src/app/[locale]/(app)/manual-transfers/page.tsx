'use client';

import { useState, useEffect } from 'react';
import { Upload, FileDown, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/shared/ActionButton';
import { ExcelImportDialog } from '@/components/features/manual-transfers/ExcelImportDialog';
import { ManualTransfersTable } from '@/components/features/manual-transfers/ManualTransfersTable';
import { manualTransfersService } from '@/lib/services/manual-transfers.service';
import type { ManualTransfer } from '@/types/manual-transfers.types';
import { toast } from 'sonner';

export default function ManualTransfersPage() {
  const [transfers, setTransfers] = useState<ManualTransfer[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const { data, error } = await manualTransfersService.getAll();

      if (error) {
        toast.error('שגיאה', {
          description: error.message,
        });
        return;
      }

      setTransfers(data || []);
    } catch {
      toast.error('שגיאה', {
        description: 'שגיאה בטעינת ההעברות',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק העברה זו?')) return;

    const { error } = await manualTransfersService.delete(id);

    if (error) {
      toast.error('שגיאה', {
        description: error.message,
      });
      return;
    }

    toast.success('הצלחה', {
      description: 'ההעברה נמחקה בהצלחה',
    });

    loadTransfers();
    setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    if (!confirm(`האם אתה בטוח שברצונך למחוק ${selectedIds.length} העברות?`)) return;

    const { error } = await manualTransfersService.bulkDelete(selectedIds);

    if (error) {
      toast.error('שגיאה', {
        description: error.message,
      });
      return;
    }

    toast.success('הצלחה', {
      description: `${selectedIds.length} העברות נמחקו בהצלחה`,
    });

    loadTransfers();
    setSelectedIds([]);
  };

  const handleExport = async () => {
    if (selectedIds.length === 0) {
      toast.error('שגיאה', {
        description: 'יש לבחור לפחות העברה אחת',
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
      a.download = `manual_transfers_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('הצלחה', {
        description: `קובץ מס"ב עבור ${selectedIds.length} העברות הורד בהצלחה`,
      });

      // Refresh to update statuses
      loadTransfers();
      setSelectedIds([]);
    } catch (error) {
      toast.error('שגיאה', {
        description: error instanceof Error ? error.message : 'שגיאה ביצירת קובץ מס"ב',
      });
    }
  };

  const summary = {
    total: transfers.length,
    totalAmount: transfers.reduce((sum, t) => sum + t.amount, 0),
    selected: selectedIds.length,
    selectedAmount: transfers
      .filter((t) => selectedIds.includes(t.id))
      .reduce((sum, t) => sum + t.amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">העברות ידניות</h1>
        <p className="text-muted-foreground mt-1">
          ניהול העברות שאינן קשורות לתיקים
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              סה&quot;כ העברות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              סכום כולל
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
              נבחרו
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.selected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              סכום נבחר
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
              <CardTitle>רשימת העברות</CardTitle>
              <CardDescription>
                ייבא קובץ אקסל או נהל העברות קיימות
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(true)}
              >
                <Upload className="h-4 w-4 me-2" />
                העלה אקסל
              </Button>
              {selectedIds.length > 0 && (
                <>
                  <ActionButton
                    variant="reject"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4 me-2" />
                    מחק נבחרים ({selectedIds.length})
                  </ActionButton>
                  <ActionButton
                    variant="approve-primary"
                    onClick={handleExport}
                  >
                    <FileDown className="h-4 w-4 me-2" />
                    ייצא למס&quot;ב ({selectedIds.length})
                  </ActionButton>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              טוען...
            </div>
          ) : (
            <ManualTransfersTable
              transfers={transfers}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onDelete={handleDelete}
              onRefresh={loadTransfers}
            />
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <ExcelImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={loadTransfers}
      />
    </div>
  );
}
