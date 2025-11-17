'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BankDetailsFormData } from '@/types/case.types';

interface BankDetailsFormProps {
  value: BankDetailsFormData;
  onChange: (data: BankDetailsFormData) => void;
  errors?: Partial<Record<keyof BankDetailsFormData, string>>;
  readonly?: boolean;
  className?: string;
  /**
   * Whether to wrap the fields in a Card component
   * @default true
   */
  showCard?: boolean;
  /**
   * Custom title for the card header (only used when showCard is true)
   */
  cardTitle?: string;
}

/**
 * BankDetailsForm Component
 *
 * Reusable form for managing Israeli bank account details with validation.
 * Supports both edit and read-only modes, and can be rendered with or without a Card wrapper.
 *
 * Features:
 * - Manual input for bank number, branch, and account number
 * - Account number validation (2-20 digits)
 * - Account holder name
 * - i18n support (Hebrew/English)
 * - RTL support
 * - Read-only mode for display
 * - Optional Card wrapper (can be disabled for inline use in forms)
 *
 * @example
 * ```tsx
 * // With Card wrapper (default)
 * <BankDetailsForm
 *   value={bankDetails}
 *   onChange={setBankDetails}
 *   errors={validationErrors}
 * />
 *
 * // Without Card wrapper (for use in forms)
 * <BankDetailsForm
 *   value={bankDetails}
 *   onChange={setBankDetails}
 *   errors={validationErrors}
 *   showCard={false}
 * />
 * ```
 */
export function BankDetailsForm({
  value,
  onChange,
  errors = {},
  readonly = false,
  className,
  showCard = true,
  cardTitle,
}: BankDetailsFormProps) {
  const t = useTranslations('payments.bankDetails');

  const handleChange = (field: keyof BankDetailsFormData, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  const fieldsContent = (
    <div className="space-y-4">
      {/* Bank Number */}
      <div className="space-y-2">
        <Label htmlFor="bank_number">
          {t('bank')}
          <span className="text-destructive ms-1">*</span>
        </Label>
        <Input
          id="bank_number"
          type="text"
          inputMode="numeric"
          maxLength={3}
          value={value.bank_number}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            handleChange('bank_number', val);
          }}
          placeholder={t('bankPlaceholder')}
          readOnly={readonly}
          className={cn(
            readonly && 'bg-muted',
            errors.bank_number && 'border-destructive'
          )}
        />
        {!readonly && !errors.bank_number && (
          <p className="text-sm text-muted-foreground">
            {t('bankHelp')}
          </p>
        )}
        {errors.bank_number && (
          <p className="text-sm text-destructive">{errors.bank_number}</p>
        )}
      </div>

      {/* Branch Number */}
      <div className="space-y-2">
        <Label htmlFor="branch">
          {t('branch')}
          <span className="text-destructive ms-1">*</span>
        </Label>
        <Input
          id="branch"
          type="text"
          inputMode="numeric"
          maxLength={3}
          value={value.branch}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            handleChange('branch', val);
          }}
          placeholder={t('branchPlaceholder')}
          readOnly={readonly}
          className={cn(
            readonly && 'bg-muted',
            errors.branch && 'border-destructive'
          )}
        />
        {!readonly && !errors.branch && (
          <p className="text-sm text-muted-foreground">
            {t('branchHelp')}
          </p>
        )}
        {errors.branch && (
          <p className="text-sm text-destructive">{errors.branch}</p>
        )}
      </div>

      {/* Account Number */}
      <div className="space-y-2">
        <Label htmlFor="account_number">
          {t('accountNumber')}
          <span className="text-destructive ms-1">*</span>
        </Label>
        <Input
          id="account_number"
          type="text"
          inputMode="numeric"
          maxLength={20}
          value={value.account_number}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            handleChange('account_number', val);
          }}
          placeholder="1234567"
          readOnly={readonly}
          className={cn(
            readonly && 'bg-muted',
            errors.account_number && 'border-destructive'
          )}
        />
        {!readonly && !errors.account_number && (
          <p className="text-sm text-muted-foreground">
            {t('accountNumberHelp')}
          </p>
        )}
        {errors.account_number && (
          <p className="text-sm text-destructive">{errors.account_number}</p>
        )}
      </div>

      {/* Account Holder Name */}
      <div className="space-y-2">
        <Label htmlFor="account_holder_name">
          {t('accountHolderName')}
          <span className="text-destructive ms-1">*</span>
        </Label>
        <Input
          id="account_holder_name"
          type="text"
          value={value.account_holder_name}
          onChange={(e) => handleChange('account_holder_name', e.target.value)}
          placeholder={t('accountHolderPlaceholder')}
          readOnly={readonly}
          className={cn(
            readonly && 'bg-muted',
            errors.account_holder_name && 'border-destructive'
          )}
        />
        {errors.account_holder_name && (
          <p className="text-sm text-destructive">
            {errors.account_holder_name}
          </p>
        )}
      </div>
    </div>
  );

  if (!showCard) {
    return <div className={className}>{fieldsContent}</div>;
  }

  return (
    <Card className={cn('border border-slate-200 shadow-md', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Landmark className="h-5 w-5 text-sky-600" />
          {cardTitle || t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>{fieldsContent}</CardContent>
    </Card>
  );
}
