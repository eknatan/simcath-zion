'use client';

import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TransferTypeFilter as TransferTypeFilterEnum } from '@/types/transfers.types';
import { Filter } from 'lucide-react';

interface TransferTypeFilterProps {
  value: TransferTypeFilterEnum;
  onChange: (value: TransferTypeFilterEnum) => void;
}

export function TransferTypeFilter({ value, onChange }: TransferTypeFilterProps) {
  const t = useTranslations('transfers');

  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-slate-500" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TransferTypeFilterEnum.ALL}>
            {t('typeFilter.all')}
          </SelectItem>
          <SelectItem value={TransferTypeFilterEnum.WEDDING}>
            {t('typeFilter.wedding')}
          </SelectItem>
          <SelectItem value={TransferTypeFilterEnum.CLEANING}>
            {t('typeFilter.cleaning')}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
