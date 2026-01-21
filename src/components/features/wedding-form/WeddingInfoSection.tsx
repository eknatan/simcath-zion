'use client';

import React, { useEffect, useMemo } from 'react';
import { UseFormReturn, Controller, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FormSection } from '@/components/shared/Forms/FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HebrewDatePicker } from '@/components/shared/HebrewDatePicker';
import { WeddingFormData } from '@/lib/validations/wedding-form.schema';
import { translateValidationMessage } from '@/lib/validations/translate';
import { cn } from '@/lib/utils';

/**
 * Helper function to count words in a string
 */
function countWords(text: string): number {
  if (!text || text.trim() === '') return 0;
  return text.trim().split(/\s+/).length;
}

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
  /** Whether to show validation errors (only after user attempts to proceed) */
  showErrors?: boolean;
  /** Word limit for request background field */
  backgroundWordLimit?: number;
}

export function WeddingInfoSection({ form, stepNumber = 1, showErrors = false, backgroundWordLimit }: WeddingInfoSectionProps) {
  const t = useTranslations('wedding_form');
  const tValidation = useTranslations('validation');

  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = form;

  // Watch request_background for word count
  const requestBackground = useWatch({ control, name: 'wedding_info.request_background' });
  const wordCount = useMemo(() => countWords(requestBackground || ''), [requestBackground]);
  const isOverLimit = backgroundWordLimit ? wordCount > backgroundWordLimit : false;

  // Watch cost fields for auto-calculation
  const guestsCount = useWatch({ control, name: 'wedding_info.guests_count' });
  const costPerPlate = useWatch({ control, name: 'wedding_info.cost_per_plate' });
  const venueCost = useWatch({ control, name: 'wedding_info.venue_cost' });

  // Auto-calculate total cost when cost breakdown fields change
  useEffect(() => {
    if (costPerPlate != null && guestsCount != null) {
      const calculatedTotal = (costPerPlate * guestsCount) + (venueCost || 0);
      setValue('wedding_info.total_cost', calculatedTotal, { shouldValidate: true });
    }
  }, [costPerPlate, venueCost, guestsCount, setValue]);

  // Only show errors if showErrors is true (user attempted to proceed)
  const weddingErrors = showErrors ? errors.wedding_info : undefined;
  const submitterErrors = showErrors ? errors.submitter_info : undefined;

  return (
    <FormSection
      title={t('section_wedding_info.title')}
      description={t('section_wedding_info.description')}
      stepNumber={stepNumber}
      withGradient
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* תאריך עברי - קומפוננטה חדשה */}
        <div className="md:col-span-2">
          <Controller
            name="wedding_info.hebrew_date"
            control={control}
            render={({ field }) => (
              <HebrewDatePicker
                value={field.value}
                onChange={field.onChange}
                error={
                  weddingErrors?.hebrew_date
                    ? translateValidationMessage(tValidation, weddingErrors.hebrew_date.message)
                    : undefined
                }
                required
              />
            )}
          />
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

        {/* עלות למנה */}
        <div className="space-y-2">
          <Label htmlFor="cost_per_plate">
            {t('section_wedding_info.cost_per_plate')}
          </Label>
          <div className="relative">
            <Input
              id="cost_per_plate"
              type="number"
              {...register('wedding_info.cost_per_plate', {
                valueAsNumber: true,
              })}
              className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              aria-invalid={!!weddingErrors?.cost_per_plate}
              min={0}
              step={10}
            />
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              ₪
            </span>
          </div>
          {weddingErrors?.cost_per_plate && (
            <p className="text-sm text-destructive">
              {translateValidationMessage(tValidation, weddingErrors.cost_per_plate.message)}
            </p>
          )}
        </div>

        {/* עלות אולם */}
        <div className="space-y-2">
          <Label htmlFor="venue_cost">
            {t('section_wedding_info.venue_cost')}
          </Label>
          <div className="relative">
            <Input
              id="venue_cost"
              type="number"
              {...register('wedding_info.venue_cost', {
                valueAsNumber: true,
              })}
              className="border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              aria-invalid={!!weddingErrors?.venue_cost}
              min={0}
              step={100}
            />
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              ₪
            </span>
          </div>
          {weddingErrors?.venue_cost && (
            <p className="text-sm text-destructive">
              {translateValidationMessage(tValidation, weddingErrors.venue_cost.message)}
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
            className={cn(
              'border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[120px]',
              isOverLimit && 'border-destructive focus:border-destructive'
            )}
            rows={5}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {t('section_wedding_info.request_background_helper')}
            </p>
            {backgroundWordLimit && (
              <p className={cn(
                'text-xs font-medium',
                isOverLimit ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {wordCount}/{backgroundWordLimit} {t('section_wedding_info.words')}
              </p>
            )}
          </div>
          {isOverLimit && backgroundWordLimit && (
            <p className="text-sm text-destructive">
              {t('section_wedding_info.request_background_over_limit', { limit: backgroundWordLimit, current: wordCount })}
            </p>
          )}
        </div>

        {/* פרטי מגיש הבקשה */}
        <div className="md:col-span-2 bg-amber-50/50 border-2 border-amber-200 rounded-lg p-4">
          <h3 className="text-base font-semibold text-amber-900 mb-4">
            {t('section_wedding_info.submitter_title')}
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {/* שם מגיש הבקשה */}
            <div className="space-y-2">
              <Label htmlFor="submitter_name">
                {t('section_wedding_info.submitter_name')}
                <span className="text-destructive ms-1">*</span>
              </Label>
              <Input
                id="submitter_name"
                {...register('submitter_info.submitter_name')}
                className="border-2 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                aria-invalid={!!submitterErrors?.submitter_name}
              />
              {submitterErrors?.submitter_name && (
                <p className="text-sm text-destructive">
                  {translateValidationMessage(tValidation, submitterErrors.submitter_name.message)}
                </p>
              )}
            </div>

            {/* קשור ל */}
            <div className="space-y-2">
              <Label htmlFor="submitter_relation">
                {t('section_wedding_info.submitter_relation')}
              </Label>
              <Input
                id="submitter_relation"
                {...register('submitter_info.submitter_relation')}
                className="border-2 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                placeholder={t('section_wedding_info.submitter_relation_placeholder')}
              />
            </div>

            {/* טלפון מגיש הבקשה */}
            <div className="space-y-2">
              <Label htmlFor="submitter_phone">
                {t('section_wedding_info.submitter_phone')}
                <span className="text-destructive ms-1">*</span>
              </Label>
              <Input
                id="submitter_phone"
                type="tel"
                dir="ltr"
                {...register('submitter_info.submitter_phone')}
                className="border-2 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                aria-invalid={!!submitterErrors?.submitter_phone}
              />
              {submitterErrors?.submitter_phone && (
                <p className="text-sm text-destructive">
                  {translateValidationMessage(tValidation, submitterErrors.submitter_phone.message)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </FormSection>
  );
}
