'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FormSection } from '@/components/shared/Forms/FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WeddingFormData } from '@/lib/validations/wedding-form.schema';
import { translateValidationMessage } from '@/lib/validations/translate';

/**
 * קומפוננטת WeddingInfoSection - סקשן א' בטופס החתונה
 *
 * עקרונות SOLID:
 * - Single Responsibility: אחראית רק על שדות מידע החתונה
 * - Dependency Inversion: מקבלת form instance דרך props (abstraction)
 * - Interface Segregation: מקבלת רק את ה-form, לא כל ה-context
 *
 * תמיכה מלאה ב-i18n ו-RTL
 */

interface WeddingInfoSectionProps {
  form: UseFormReturn<WeddingFormData>;
  stepNumber?: number;
}

export function WeddingInfoSection({ form, stepNumber = 1 }: WeddingInfoSectionProps) {
  const t = useTranslations('wedding_form');
  const tValidation = useTranslations('validation');

  const {
    register,
    formState: { errors },
  } = form;

  const weddingErrors = errors.wedding_info;

  return (
    <FormSection
      title={t('section_wedding_info.title')}
      description={t('section_wedding_info.description')}
      stepNumber={stepNumber}
      withGradient
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* תאריך עברי */}
        <div className="space-y-2">
          <Label htmlFor="date_hebrew">
            {t('section_wedding_info.date_hebrew')}
            <span className="text-destructive ms-1">*</span>
          </Label>
          <Input
            id="date_hebrew"
            {...register('wedding_info.date_hebrew')}
            className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            aria-invalid={!!weddingErrors?.date_hebrew}
          />
          {weddingErrors?.date_hebrew && (
            <p className="text-sm text-destructive">
              {translateValidationMessage(tValidation, weddingErrors.date_hebrew.message)}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t('section_wedding_info.date_hebrew_helper')}
          </p>
        </div>

        {/* תאריך לועזי */}
        <div className="space-y-2">
          <Label htmlFor="date_gregorian">
            {t('section_wedding_info.date_gregorian')}
            <span className="text-destructive ms-1">*</span>
          </Label>
          <Input
            id="date_gregorian"
            type="date"
            {...register('wedding_info.date_gregorian')}
            className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            aria-invalid={!!weddingErrors?.date_gregorian}
          />
          {weddingErrors?.date_gregorian && (
            <p className="text-sm text-destructive">
              {translateValidationMessage(tValidation, weddingErrors.date_gregorian.message)}
            </p>
          )}
        </div>

        {/* עיר */}
        <div className="space-y-2">
          <Label htmlFor="city">
            {t('section_wedding_info.city')}
            <span className="text-destructive ms-1">*</span>
          </Label>
          <Input
            id="city"
            {...register('wedding_info.city')}
            className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            aria-invalid={!!weddingErrors?.city}
          />
          {weddingErrors?.city && (
            <p className="text-sm text-destructive">
              {translateValidationMessage(tValidation, weddingErrors.city.message)}
            </p>
          )}
        </div>

        {/* אולם */}
        <div className="space-y-2">
          <Label htmlFor="venue">
            {t('section_wedding_info.venue')}
            <span className="text-destructive ms-1">*</span>
          </Label>
          <Input
            id="venue"
            {...register('wedding_info.venue')}
            className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            aria-invalid={!!weddingErrors?.venue}
          />
          {weddingErrors?.venue && (
            <p className="text-sm text-destructive">
              {translateValidationMessage(tValidation, weddingErrors.venue.message)}
            </p>
          )}
        </div>

        {/* כמות מוזמנים */}
        <div className="space-y-2">
          <Label htmlFor="guests_count">
            {t('section_wedding_info.guests_count')}
            <span className="text-destructive ms-1">*</span>
          </Label>
          <Input
            id="guests_count"
            type="number"
            {...register('wedding_info.guests_count', {
              valueAsNumber: true,
            })}
            className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            aria-invalid={!!weddingErrors?.guests_count}
            min={1}
            max={5000}
          />
          {weddingErrors?.guests_count && (
            <p className="text-sm text-destructive">
              {translateValidationMessage(tValidation, weddingErrors.guests_count.message)}
            </p>
          )}
        </div>

        {/* עלות כוללת */}
        <div className="space-y-2">
          <Label htmlFor="total_cost">
            {t('section_wedding_info.total_cost')}
            <span className="text-destructive ms-1">*</span>
          </Label>
          <div className="relative">
            <Input
              id="total_cost"
              type="number"
              {...register('wedding_info.total_cost', {
                valueAsNumber: true,
              })}
              className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              aria-invalid={!!weddingErrors?.total_cost}
              min={0}
              step={100}
            />
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              ₪
            </span>
          </div>
          {weddingErrors?.total_cost && (
            <p className="text-sm text-destructive">
              {translateValidationMessage(tValidation, weddingErrors.total_cost.message)}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t('section_wedding_info.total_cost_helper')}
          </p>
        </div>

        {/* רקע על הבקשה */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="request_background">
            {t('section_wedding_info.request_background')}
          </Label>
          <Textarea
            id="request_background"
            {...register('wedding_info.request_background')}
            className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[120px]"
            rows={5}
          />
          <p className="text-xs text-muted-foreground">
            {t('section_wedding_info.request_background_helper')}
          </p>
        </div>
      </div>
    </FormSection>
  );
}
