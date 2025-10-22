'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CurrencyConverterProps {
  onConvert: (ilsAmount: number, rate: number) => void;
}

export function CurrencyConverter({ onConvert }: CurrencyConverterProps) {
  const t = useTranslations('payments');
  const [usdAmount, setUsdAmount] = useState('');
  const [rate, setRate] = useState('');
  const [ilsAmount, setIlsAmount] = useState('');

  const handleFetchRate = async () => {
    // TODO: API call to get exchange rate
    const currentRate = 3.7;
    setRate(currentRate.toString());
    if (usdAmount) {
      const calculated = parseFloat(usdAmount) * currentRate;
      setIlsAmount(calculated.toFixed(2));
    }
  };

  const handleConvert = () => {
    if (usdAmount && rate) {
      const calculated = parseFloat(usdAmount) * parseFloat(rate);
      setIlsAmount(calculated.toFixed(2));
      onConvert(calculated, parseFloat(rate));
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div>
        <Label>{t('usdAmount')}</Label>
        <Input
          type="number"
          value={usdAmount}
          onChange={(e) => setUsdAmount(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label>{t('exchangeRate')}</Label>
          <Input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        <Button onClick={handleFetchRate} variant="outline" className="mt-8">
          {t('updateRate')}
        </Button>
      </div>
      <ArrowDown className="mx-auto h-6 w-6" />
      <div>
        <Label>{t('ilsAmount')}</Label>
        <Input type="number" value={ilsAmount} readOnly className="bg-muted" />
      </div>
      <Button onClick={handleConvert} className="w-full">
        {t('convert')}
      </Button>
    </div>
  );
}
