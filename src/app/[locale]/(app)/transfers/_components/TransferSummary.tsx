'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { TransferSummary as TransferSummaryType } from '@/types/transfers.types';
import { DollarSign, TrendingUp, FileText } from 'lucide-react';

interface TransferSummaryProps {
  summary: TransferSummaryType;
  selectedCount?: number;
  selectedAmount?: number;
}

export function TransferSummary({
  summary,
  selectedCount = 0,
  selectedAmount = 0,
}: TransferSummaryProps) {
  const t = useTranslations('transfers.summary');

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Count */}
      <Card className="border border-slate-200 shadow-sm bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">
            {t('totalCount')}
          </CardTitle>
          <FileText className="h-4 w-4 text-sky-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {summary.total_count.toLocaleString('he-IL')}
          </div>
          {selectedCount > 0 && (
            <p className="text-xs text-slate-600 mt-1">
              {t('selectedCount')}: {selectedCount}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Total Amount ILS */}
      <Card className="border border-slate-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">
            {t('totalAmountILS')}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {summary.total_amount_ils.toLocaleString('he-IL')} ₪
          </div>
          {selectedAmount > 0 && (
            <p className="text-xs text-slate-600 mt-1">
              {t('selectedAmount')}: {selectedAmount.toLocaleString('he-IL')} ₪
            </p>
          )}
        </CardContent>
      </Card>

      {/* Total Amount USD */}
      <Card className="border border-slate-200 shadow-sm bg-gradient-to-br from-white to-amber-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">
            {t('totalAmountUSD')}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            ${summary.total_amount_usd.toLocaleString('en-US')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
