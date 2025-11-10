'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { Inbox } from 'lucide-react';
import {
  TransferWithDetails,
  WeddingTransfer,
  CleaningTransfer,
  TransferTab,
} from '@/types/transfers.types';
import { formatDate } from '@/lib/services/export.service';

interface TransfersTableProps {
  transfers: TransferWithDetails[];
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  activeTab: TransferTab;
  isLoading?: boolean;
}

export function TransfersTable({
  transfers,
  selectedIds,
  onToggleSelection,
  activeTab,
  isLoading = false,
}: TransfersTableProps) {
  const t = useTranslations('transfers');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-2" />
          <p className="text-sm text-slate-600">{t('messages.loading')}</p>
        </div>
      </div>
    );
  }

  if (!transfers || transfers.length === 0) {
    return (
      <div className="border border-slate-200 rounded-lg shadow-sm bg-gradient-to-br from-white to-slate-50/30 p-12">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
            <Inbox className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {t('messages.noTransfersTitle')}
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            {t('messages.noTransfers')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg shadow-sm bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50">
              <TableHead className="w-12">
                <span className="sr-only">Select</span>
              </TableHead>
              <TableHead>{t('columns.created_at')}</TableHead>
              <TableHead>{t('columns.case_number')}</TableHead>
              {activeTab === TransferTab.WEDDING ? (
                <>
                  <TableHead>{t('columns.names')}</TableHead>
                  <TableHead>{t('columns.wedding_date')}</TableHead>
                  <TableHead>{t('columns.city')}</TableHead>
                </>
              ) : (
                <>
                  <TableHead>{t('columns.family_name')}</TableHead>
                  <TableHead>{t('columns.child_name')}</TableHead>
                  <TableHead>{t('columns.payment_month')}</TableHead>
                </>
              )}
              <TableHead className="text-end">{t('columns.amount_ils')}</TableHead>
              {activeTab === TransferTab.WEDDING && (
                <TableHead className="text-end">{t('columns.amount_usd')}</TableHead>
              )}
              <TableHead>{t('columns.account_holder')}</TableHead>
              <TableHead>{t('columns.bank')}</TableHead>
              <TableHead>{t('columns.branch')}</TableHead>
              <TableHead>{t('columns.account')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.map((transfer) => {
              const isSelected = selectedIds.includes(transfer.id);

              return (
                <TableRow
                  key={transfer.id}
                  className={`
                    hover:bg-slate-50/50 transition-colors
                    ${isSelected ? 'bg-sky-50/30' : ''}
                  `}
                >
                  {/* Checkbox */}
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelection(transfer.id)}
                      className="border-slate-300"
                    />
                  </TableCell>

                  {/* Created Date */}
                  <TableCell className="text-sm text-slate-600">
                    {transfer.created_at
                      ? formatDate(transfer.created_at, 'he')
                      : '-'}
                  </TableCell>

                  {/* Case Number */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-sky-200 text-sky-700 bg-sky-50"
                    >
                      {transfer.case.case_number}
                    </Badge>
                  </TableCell>

                  {/* Tab-specific columns */}
                  {activeTab === TransferTab.WEDDING ? (
                    <WeddingTableColumns transfer={transfer as WeddingTransfer} />
                  ) : (
                    <CleaningTableColumns transfer={transfer as CleaningTransfer} />
                  )}

                  {/* Amount ILS */}
                  <TableCell className="text-end font-medium text-slate-900">
                    {transfer.amount_ils.toLocaleString('he-IL')} ₪
                  </TableCell>

                  {/* Amount USD (Wedding only) */}
                  {activeTab === TransferTab.WEDDING && (
                    <TableCell className="text-end text-slate-600">
                      ${transfer.amount_usd?.toLocaleString('en-US') || '0'}
                    </TableCell>
                  )}

                  {/* Bank Details */}
                  <TableCell className="text-sm text-slate-700">
                    {transfer.bank_details.account_holder_name}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {transfer.bank_details.bank_number}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {transfer.bank_details.branch}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 font-mono">
                    {transfer.bank_details.account_number}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ========================================
// Tab-specific Column Components
// ========================================

function WeddingTableColumns({ transfer }: { transfer: WeddingTransfer }) {
  const groomName = transfer.case.groom_first_name || '';
  const brideName = transfer.case.bride_first_name || '';
  const brideLastName = transfer.case.bride_last_name || '';
  const names = `${groomName} & ${brideName} ${brideLastName}`.trim();

  return (
    <>
      <TableCell className="text-sm text-slate-700">{names || '-'}</TableCell>
      <TableCell className="text-sm text-slate-600">
        {transfer.case.wedding_date_gregorian
          ? formatDate(transfer.case.wedding_date_gregorian, 'he')
          : '-'}
      </TableCell>
      <TableCell className="text-sm text-slate-600">
        {transfer.case.city || '-'}
      </TableCell>
    </>
  );
}

function CleaningTableColumns({ transfer }: { transfer: CleaningTransfer }) {
  return (
    <>
      <TableCell className="text-sm text-slate-700">
        {transfer.case.family_name || '-'}
      </TableCell>
      <TableCell className="text-sm text-slate-700">
        {transfer.case.child_name || '-'}
      </TableCell>
      <TableCell className="text-sm text-slate-600">
        {transfer.payment_month || '-'}
      </TableCell>
    </>
  );
}
