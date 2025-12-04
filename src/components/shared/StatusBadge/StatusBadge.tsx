'use client';

import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

const STATUS_VARIANTS = {
  new: 'default',
  pending: 'secondary',
  pending_transfer: 'secondary',
  approved: 'success',
  transferred: 'success',
  rejected: 'destructive',
  expired: 'outline',
  active: 'success',
  inactive: 'secondary',
} as const;

interface StatusBadgeProps {
  status: keyof typeof STATUS_VARIANTS;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('status');
  const variant = STATUS_VARIANTS[status];

  return (
    <Badge variant={variant as 'default' | 'secondary' | 'destructive' | 'outline' | 'success'}>
      {t(status)}
    </Badge>
  );
}
