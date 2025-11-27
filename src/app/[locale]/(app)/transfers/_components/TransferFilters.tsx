'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { TransferFilters as TransferFiltersType } from '@/types/transfers.types';
import { Search, X } from 'lucide-react';
import { useState } from 'react';

interface TransferFiltersProps {
  filters: TransferFiltersType;
  onChange: (filters: TransferFiltersType) => void;
  onReset: () => void;
}

export function TransferFilters({
  filters,
  onChange,
  onReset,
}: TransferFiltersProps) {
  const t = useTranslations('transfers.filters');
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (key: keyof TransferFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  const handleReset = () => {
    setLocalFilters({});
    onReset();
  };

  return (
    <Card className="border border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50/20">
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="search" className="text-sm font-medium text-slate-700">
              {t('search')}
            </Label>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="search"
                type="text"
                placeholder={t('searchPlaceholder')}
                value={localFilters.search || ''}
                onChange={(e) => handleChange('search', e.target.value)}
                className="ps-10 border-slate-200"
              />
            </div>
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <Label htmlFor="dateFrom" className="text-sm font-medium text-slate-700">
              {t('dateFrom')}
            </Label>
            <Input
              id="dateFrom"
              type="date"
              value={localFilters.date_from || ''}
              onChange={(e) => handleChange('date_from', e.target.value)}
              className="border-slate-200"
            />
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <Label htmlFor="dateTo" className="text-sm font-medium text-slate-700">
              {t('dateTo')}
            </Label>
            <Input
              id="dateTo"
              type="date"
              value={localFilters.date_to || ''}
              onChange={(e) => handleChange('date_to', e.target.value)}
              className="border-slate-200"
            />
          </div>

          {/* Amount Min */}
          <div className="space-y-2">
            <Label htmlFor="amountMin" className="text-sm font-medium text-slate-700">
              {t('amountMin')}
            </Label>
            <Input
              id="amountMin"
              type="number"
              placeholder="0"
              value={localFilters.amount_min || ''}
              onChange={(e) => handleChange('amount_min', parseFloat(e.target.value) || undefined)}
              className="border-slate-200"
            />
          </div>

          {/* Amount Max */}
          <div className="space-y-2">
            <Label htmlFor="amountMax" className="text-sm font-medium text-slate-700">
              {t('amountMax')}
            </Label>
            <Input
              id="amountMax"
              type="number"
              value={localFilters.amount_max || ''}
              onChange={(e) => handleChange('amount_max', parseFloat(e.target.value) || undefined)}
              className="border-slate-200"
            />
          </div>

          {/* Payment Month */}
          {false && (
            <div className="space-y-2">
              <Label htmlFor="paymentMonth" className="text-sm font-medium text-slate-700">
                {t('paymentMonth')}
              </Label>
              <Input
                id="paymentMonth"
                type="month"
                value={localFilters.payment_month || ''}
                onChange={(e) => handleChange('payment_month', e.target.value)}
                className="border-slate-200"
              />
            </div>
          )}

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
            >
              <X className="w-4 h-4 me-2" />
              {t('title')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
