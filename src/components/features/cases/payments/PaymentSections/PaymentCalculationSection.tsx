'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ActionButton } from '@/components/shared/ActionButton';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { getBankOfIsraelRates, type BankOfIsraelRates } from '@/lib/services/currency.service';

interface PaymentCalculationSectionProps {
  weddingCost: string;
  donationUsd: string;
  exchangeRate: string;
  donationIls: string;
  isLoadingRate: boolean;
  onWeddingCostChange: (value: string) => void;
  onDonationUsdChange: (value: string) => void;
  onExchangeRateChange: (value: string) => void;
  onFetchExchangeRate: () => void;
}

export function PaymentCalculationSection({
  weddingCost,
  donationUsd,
  exchangeRate,
  donationIls,
  isLoadingRate,
  onWeddingCostChange,
  onDonationUsdChange,
  onExchangeRateChange,
  onFetchExchangeRate
}: PaymentCalculationSectionProps) {
  const t = useTranslations('payments');

  // Bank of Israel rates state
  const [boiRates, setBoiRates] = useState<BankOfIsraelRates | null>(null);
  const [isLoadingBoiRates, setIsLoadingBoiRates] = useState(false);

  /**
   * Fetch Bank of Israel rates (buy/sell/representative)
   */
  const handleFetchBoiRates = async () => {
    setIsLoadingBoiRates(true);
    try {
      const rates = await getBankOfIsraelRates();
      if (rates) {
        setBoiRates(rates);
        // TODO: Add success toast if needed
      } else {
        // TODO: Add error toast if needed
      }
    } catch (error) {
      console.error('Failed to fetch BOI rates:', error);
      // TODO: Add error toast if needed
    } finally {
      setIsLoadingBoiRates(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-white to-emerald-50/30">
        <CardTitle className="text-lg font-medium text-slate-800">
          {t('costAndDonation.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Bank of Israel Rates Display */}
        <div className="mb-6 p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-900">
              {t('conversion.boiRates.title')}
            </h3>
            <ActionButton
              variant="cancel"
              onClick={handleFetchBoiRates}
              disabled={isLoadingBoiRates}
              className="shrink-0 h-8 text-xs"
            >
              <RefreshCw className={cn("h-3 w-3 ml-2", isLoadingBoiRates && "animate-spin")} />
              {t('conversion.boiRates.refresh')}
            </ActionButton>
          </div>

          {isLoadingBoiRates ? (
            <div className="text-sm text-blue-600">{t('conversion.boiRates.loading')}</div>
          ) : boiRates ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Representative Rate */}
              <div className="bg-white p-3 rounded border border-blue-100">
                <div className="text-xs text-slate-600 mb-1">
                  {t('conversion.boiRates.representative')}
                </div>
                <div className="text-lg font-bold text-blue-700">
                  ₪{boiRates.representative.toFixed(4)}
                </div>
              </div>

              {/* Buy Rate */}
              <div className="bg-white p-3 rounded border border-green-100">
                <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                  {t('conversion.boiRates.buy')}
                  <span className="text-xs text-slate-400" title={t('conversion.boiRates.buyTooltip')}>ⓘ</span>
                </div>
                <div className="text-lg font-bold text-green-700">
                  ₪{boiRates.buy.toFixed(4)}
                </div>
              </div>

              {/* Sell Rate */}
              <div className="bg-white p-3 rounded border border-orange-100">
                <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                  {t('conversion.boiRates.sell')}
                  <span className="text-xs text-slate-400" title={t('conversion.boiRates.sellTooltip')}>ⓘ</span>
                </div>
                <div className="text-lg font-bold text-orange-700">
                  ₪{boiRates.sell.toFixed(4)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              לחץ על &quot;{t('conversion.boiRates.refresh')}&quot; לקבלת שערי בנק ישראל העדכניים
            </div>
          )}
        </div>

        {/* Top Row: Wedding Cost, Donation, Exchange Rate */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Wedding Cost */}
          <div className="space-y-2">
            <Label htmlFor="weddingCost" className="text-slate-700">
              {t('costAndDonation.weddingCost')}
            </Label>
            <Input
              id="weddingCost"
              type="number"
              value={weddingCost}
              onChange={(e) => onWeddingCostChange(e.target.value)}
              placeholder={t('costAndDonation.weddingCostPlaceholder')}
              className="border-slate-300"
            />
          </div>

          {/* Donation USD */}
          <div className="space-y-2">
            <Label htmlFor="donationUsd" className="text-slate-700">
              {t('costAndDonation.donationUsd')} *
            </Label>
            <Input
              id="donationUsd"
              type="number"
              value={donationUsd}
              onChange={(e) => onDonationUsdChange(e.target.value)}
              placeholder={t('costAndDonation.donationUsdPlaceholder')}
              className="border-slate-300"
            />
          </div>

          {/* Exchange Rate */}
          <div className="space-y-2">
            <Label htmlFor="exchangeRate" className="text-slate-700">
              {t('conversion.exchangeRate')} *
            </Label>
            <div className="flex gap-2">
              <Input
                id="exchangeRate"
                type="number"
                step="0.0001"
                value={exchangeRate}
                onChange={(e) => onExchangeRateChange(e.target.value)}
                placeholder={t('conversion.exchangeRatePlaceholder')}
                className="border-slate-300"
              />
              <ActionButton
                variant="cancel"
                onClick={onFetchExchangeRate}
                disabled={isLoadingRate}
                className="shrink-0 whitespace-nowrap"
                aria-label={t('conversion.updateRateFromBOI')}
                title={t('conversion.updateRateFromBOI')}
              >
                <RefreshCw className={cn("h-4 w-4 ml-1", isLoadingRate && "animate-spin")} />
                <span className="hidden lg:inline">{t('conversion.updateRate')}</span>
              </ActionButton>
            </div>
          </div>
        </div>

        {/* Bottom Row: Calculated ILS Amount - Highlighted */}
        <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg">
          <Label htmlFor="donationIls" className="text-emerald-900 text-sm mb-2 block">
            {t('conversion.amountIls')}
          </Label>
          <div className="text-2xl font-bold text-emerald-700">
            {donationIls ? `₪${parseFloat(donationIls).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : t('conversion.amountIlsPlaceholder')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}