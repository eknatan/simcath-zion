'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FormSection } from '@/components/shared/Forms/FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WeddingFormData } from '@/lib/validations/wedding-form.schema';
import { translateValidationMessage } from '@/lib/validations/translate';
import { User, Phone, Mail, MapPin } from 'lucide-react';

/**
 * קומפוננטת PersonInfoSection - סקשן גנרי לפרטי אדם (חתן/כלה)
 *
 * עקרונות SOLID:
 * - Single Responsibility: אחראית רק על שדות פרטי אדם
 * - Open/Closed: גנרית - פתוחה להרחבה (עובדת עבור חתן או כלה)
 * - Liskov Substitution: ניתן להשתמש בה עבור כל סוג person
 * - Dependency Inversion: מקבלת form instance (abstraction)
 *
 * תמיכה מלאה ב-i18n ו-RTL
 */

interface PersonInfoSectionProps {
  form: UseFormReturn<WeddingFormData>;
  personType: 'groom' | 'bride';
  stepNumber?: number;
  /** Whether to show validation errors (only after user attempts to proceed) */
  showErrors?: boolean;
}

export function PersonInfoSection({ form, personType, stepNumber, showErrors = false }: PersonInfoSectionProps) {
  const t = useTranslations('wedding_form');
  const tValidation = useTranslations('validation');

  const {
    register,
    formState: { errors },
  } = form;

  // Dynamic field prefix based on person type
  const fieldPrefix = `${personType}_info` as const;
  // Only show errors if showErrors is true (user attempted to proceed)
  const personErrors = showErrors ? errors[fieldPrefix] : undefined;

  // Translation key prefix
  const tKey = `section_${personType}_info`;

  return (
    <FormSection
      title={t(`${tKey}.title`)}
      description={t(`${tKey}.description`)}
      stepNumber={stepNumber}
      withGradient
    >
      <div className="space-y-6">
        {/* שם מלא */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${fieldPrefix}.first_name`}>
              {t(`${tKey}.first_name`)}
              <span className="text-destructive ms-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id={`${fieldPrefix}.first_name`}
                {...register(`${fieldPrefix}.first_name`)}
                className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ps-10"
                aria-invalid={!!personErrors?.first_name}
              />
              <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {personErrors?.first_name && (
              <p className="text-sm text-destructive">
                {translateValidationMessage(tValidation, personErrors.first_name.message)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${fieldPrefix}.last_name`}>
              {t(`${tKey}.last_name`)}
              <span className="text-destructive ms-1">*</span>
            </Label>
            <Input
              id={`${fieldPrefix}.last_name`}
              {...register(`${fieldPrefix}.last_name`)}
              className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              aria-invalid={!!personErrors?.last_name}
            />
            {personErrors?.last_name && (
              <p className="text-sm text-destructive">
                {translateValidationMessage(tValidation, personErrors.last_name.message)}
              </p>
            )}
          </div>
        </div>

        {/* ת.ז. וישיבה */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${fieldPrefix}.id`}>
              {t(`${tKey}.id`)}
              <span className="text-destructive ms-1">*</span>
            </Label>
            <Input
              id={`${fieldPrefix}.id`}
              {...register(`${fieldPrefix}.id`)}
              className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              aria-invalid={!!personErrors?.id}
              maxLength={9}
            />
            {personErrors?.id && (
              <p className="text-sm text-destructive">
                {translateValidationMessage(tValidation, personErrors.id.message)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${fieldPrefix}.school`}>
              {t(`${tKey}.school`)}
            </Label>
            <Input
              id={`${fieldPrefix}.school`}
              {...register(`${fieldPrefix}.school`)}
              className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              aria-invalid={!!personErrors?.school}
            />
          </div>
        </div>

        {/* פרטי הורים */}
        <div className="space-y-4 p-4 rounded-lg bg-blue-50/50 border border-blue-100">
          <h4 className="font-semibold text-blue-900">{t(`${tKey}.parents_title`)}</h4>

          <div className="grid gap-4 md:grid-cols-2">
            {/* אב */}
            <div className="space-y-2">
              <Label htmlFor={`${fieldPrefix}.father_name`}>
                {t(`${tKey}.father_name`)}
              </Label>
              <Input
                id={`${fieldPrefix}.father_name`}
                {...register(`${fieldPrefix}.father_name`)}
                className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${fieldPrefix}.father_occupation`}>
                {t(`${tKey}.father_occupation`)}
              </Label>
              <Input
                id={`${fieldPrefix}.father_occupation`}
                {...register(`${fieldPrefix}.father_occupation`)}
                className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
              />
            </div>

            {/* אם */}
            <div className="space-y-2">
              <Label htmlFor={`${fieldPrefix}.mother_name`}>
                {t(`${tKey}.mother_name`)}
              </Label>
              <Input
                id={`${fieldPrefix}.mother_name`}
                {...register(`${fieldPrefix}.mother_name`)}
                className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${fieldPrefix}.mother_occupation`}>
                {t(`${tKey}.mother_occupation`)}
              </Label>
              <Input
                id={`${fieldPrefix}.mother_occupation`}
                {...register(`${fieldPrefix}.mother_occupation`)}
                className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
              />
            </div>
          </div>
        </div>

        {/* כתובת ועיר */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${fieldPrefix}.address`}>
              {t(`${tKey}.address`)}
              <span className="text-destructive ms-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id={`${fieldPrefix}.address`}
                {...register(`${fieldPrefix}.address`)}
                className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ps-10"
                aria-invalid={!!personErrors?.address}
              />
              <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {personErrors?.address && (
              <p className="text-sm text-destructive">
                {translateValidationMessage(tValidation, personErrors.address.message)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${fieldPrefix}.city`}>
              {t(`${tKey}.city`)}
              <span className="text-destructive ms-1">*</span>
            </Label>
            <Input
              id={`${fieldPrefix}.city`}
              {...register(`${fieldPrefix}.city`)}
              className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              aria-invalid={!!personErrors?.city}
            />
            {personErrors?.city && (
              <p className="text-sm text-destructive">
                {translateValidationMessage(tValidation, personErrors.city.message)}
              </p>
            )}
          </div>
        </div>

        {/* טלפון ומייל */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${fieldPrefix}.phone`}>
              {t(`${tKey}.phone`)}
              <span className="text-destructive ms-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id={`${fieldPrefix}.phone`}
                {...register(`${fieldPrefix}.phone`)}
                className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ps-10"
                aria-invalid={!!personErrors?.phone}
              />
              <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {personErrors?.phone && (
              <p className="text-sm text-destructive">
                {translateValidationMessage(tValidation, personErrors.phone.message)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${fieldPrefix}.email`}>
              {t(`${tKey}.email`)}
              <span className="text-destructive ms-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id={`${fieldPrefix}.email`}
                type="email"
                {...register(`${fieldPrefix}.email`)}
                className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ps-10"
                aria-invalid={!!personErrors?.email}
              />
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {personErrors?.email && (
              <p className="text-sm text-destructive">
                {translateValidationMessage(tValidation, personErrors.email.message)}
              </p>
            )}
          </div>
        </div>

        {/* יום זיכרון */}
        <div className="space-y-2">
          <Label htmlFor={`${fieldPrefix}.memorial_day`}>
            {t(`${tKey}.memorial_day`)}
          </Label>
          <Input
            id={`${fieldPrefix}.memorial_day`}
            {...register(`${fieldPrefix}.memorial_day`)}
            className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <p className="text-xs text-muted-foreground">
            {t(`${tKey}.memorial_day_helper`)}
          </p>
        </div>
      </div>
    </FormSection>
  );
}
