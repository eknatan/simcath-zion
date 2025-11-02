'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BankDetailsFormData } from '@/types/case.types';
import { BankSelector, BranchSelector } from '@/components/features/banks/BankBranchSelector';

interface BankDetailsFormProps {
  value: BankDetailsFormData;
  onChange: (data: BankDetailsFormData) => void;
  errors?: Partial<Record<keyof BankDetailsFormData, string>>;
  readonly?: boolean;
  className?: string;
}

/**
 * BankDetailsForm Component
 *
 * Form for managing Israeli bank account details with validation.
 * Supports both edit and read-only modes.
 *
 * Features:
 * - Israeli bank selection (10 major banks)
 * - Branch number validation (3 digits)
 * - Account number validation (2-20 digits)
 * - Account holder name
 * - i18n support (Hebrew/English)
 * - RTL support
 * - Read-only mode for display
 *
 * @example
 * ```tsx
 * const [bankDetails, setBankDetails] = useState<BankDetailsFormData>({
 *   bank_number: '',
 *   branch: '',
 *   account_number: '',
 *   account_holder_name: '',
 * });
 *
 * <BankDetailsForm
 *   value={bankDetails}
 *   onChange={setBankDetails}
 *   errors={validationErrors}
 * />
 * ```
 */
export function BankDetailsForm({
  value,
  onChange,
  errors = {},
  readonly = false,
  className,
}: BankDetailsFormProps) {
  const t = useTranslations('payments.bankDetails');

  const handleChange = (field: keyof BankDetailsFormData, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  return (
    <Card className={cn('border border-slate-200 shadow-md', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Landmark className="h-5 w-5 text-sky-600" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bank Selection */}
        <div className="space-y-2">
          <Label htmlFor="bank_number">
            {t('bank')}
            <span className="text-destructive ms-1">*</span>
          </Label>
          {readonly ? (
            <Input
              id="bank_number"
              value={value.bank_number}
              readOnly
              className="bg-muted"
            />
          ) : (
            <BankSelector
              value={value.bank_number}
              onValueChange={(v) => {
                handleChange('bank_number', v);
                // Clear branch when bank changes
                if (v !== value.bank_number) {
                  handleChange('branch', '');
                }
              }}
              disabled={readonly}
              className={cn(errors.bank_number && 'border-destructive')}
            />
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
          {readonly ? (
            <Input
              id="branch"
              value={value.branch}
              readOnly
              className="bg-muted"
            />
          ) : (
            <BranchSelector
              bankCode={value.bank_number}
              value={value.branch}
              onValueChange={(v) => handleChange('branch', v)}
              disabled={readonly || !value.bank_number}
              className={cn(errors.branch && 'border-destructive')}
            />
          )}
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
      </CardContent>
    </Card>
  );
}
