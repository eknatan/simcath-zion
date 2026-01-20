'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Users, Calendar, Edit3, Check, X, Loader2, FileText, Building2, DollarSign, UserCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { HDate } from '@hebcal/core';
import { formatHebrewDateForDisplay } from '@/lib/utils/hebrew-date-parser';
import { CaseWithRelations, CaseType } from '@/types/case.types';
import { useCase } from '@/components/features/cases/hooks/useCase';
import {
  weddingFormSchema,
  cleaningFormSchema,
  WeddingFormData,
  CleaningFormData,
} from '@/lib/validation/case-form.schema';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/shared/ActionButton';
import { formatCurrency } from '@/lib/utils/format';
import { formatMonthYear } from '@/lib/utils/date';

interface OriginalRequestTabProps {
  caseData: CaseWithRelations;
}

// ========================================
// Field Component with Per-Field Editing
// ========================================

interface FieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea';
  required?: boolean;
  value: any;
  onSave: (fieldName: string, value: any) => Promise<boolean>;
  notSpecifiedText: string;
  error?: string;
  isGlobalEditMode: boolean;
}

const Field = ({ name, label, type = 'text', required = false, value, onSave, notSpecifiedText, error, isGlobalEditMode }: FieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [validationError, setValidationError] = useState<string | undefined>(error);

  
  // Enable editing when global edit mode is on and field is not already editing
  useEffect(() => {
    if (isGlobalEditMode && !isEditing) {
      setEditValue(value);
      setValidationError(undefined);
      setIsEditing(true);
    } else if (!isGlobalEditMode && isEditing) {
      setEditValue(value);
      setValidationError(undefined);
      setIsEditing(false);
    }
  }, [isGlobalEditMode, value, isEditing]);

  const handleCancel = () => {
    setEditValue(value);
    setValidationError(undefined);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSave(name, editValue);
    setIsSaving(false);

    if (success) {
      setIsEditing(false);
      setValidationError(undefined);
    } else {
      // Error will be shown from parent
      setValidationError('שגיאה בשמירה');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setEditValue(newValue);
  };

  if (!isEditing) {
    // View mode - no individual edit button
    return (
      <div className="space-y-1">
        <Label className="text-xs text-slate-600">{label}</Label>
        <div className="text-sm text-slate-900">
          {value || <span className="text-slate-400">{notSpecifiedText}</span>}
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ms-1">*</span>}
      </Label>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          {type === 'textarea' ? (
            <Textarea
              id={name}
              value={editValue || ''}
              onChange={handleChange}
              className={cn(validationError && 'border-destructive')}
              rows={4}
              disabled={isSaving}
            />
          ) : (
            <Input
              id={name}
              type={type}
              value={editValue || ''}
              onChange={handleChange}
              className={cn(validationError && 'border-destructive')}
              disabled={isSaving}
            />
          )}
          {validationError && (
            <p className="text-sm text-destructive mt-1">{validationError}</p>
          )}
        </div>
        <div className="flex gap-1 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600"
            title="שמירה"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
            title="ביטול"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * OriginalRequestTab - Original request form with Per-Field Editing
 *
 * Features:
 * - Each field has its own edit mode
 * - Save/Cancel icons (V and X) next to each field
 * - Immediate save on field basis
 * - No global edit mode
 */
export function OriginalRequestTab({ caseData: initialCaseData }: OriginalRequestTabProps) {
  const t = useTranslations('case.originalRequest');
  const { caseData: liveCaseData, updateCase } = useCase(initialCaseData.id, initialCaseData);

  // Use live data from SWR, fallback to initial data
  const caseData = liveCaseData || initialCaseData;

  const isWedding = caseData.case_type === CaseType.WEDDING;
  const [isGlobalEditMode, setIsGlobalEditMode] = useState(false);

  // ========================================
  // Form Setup (for validation only)
  // ========================================

  const form = useForm<WeddingFormData | CleaningFormData>({
    resolver: zodResolver(isWedding ? weddingFormSchema : cleaningFormSchema) as any,
    defaultValues: isWedding
      ? {
          // Wedding info - Structured Hebrew date
          hebrew_day: caseData.hebrew_day || null,
          hebrew_month: caseData.hebrew_month || null,
          hebrew_year: caseData.hebrew_year || null,
          // Legacy fields
          wedding_date_hebrew: caseData.wedding_date_hebrew || '',
          wedding_date_gregorian: caseData.wedding_date_gregorian || '',
          city: caseData.city || '',
          venue: caseData.venue || '',
          guests_count: caseData.guests_count || undefined,
          cost_per_plate: caseData.cost_per_plate || undefined,
          venue_cost: caseData.venue_cost || undefined,
          total_cost: caseData.total_cost || undefined,
          request_background: caseData.request_background || '',
          // Groom
          groom_first_name: caseData.groom_first_name || '',
          groom_last_name: caseData.groom_last_name || '',
          groom_id: caseData.groom_id || '',
          groom_school: caseData.groom_school || '',
          groom_father_name: caseData.groom_father_name || '',
          groom_mother_name: caseData.groom_mother_name || '',
          groom_memorial_day: caseData.groom_memorial_day || '',
          groom_father_occupation: caseData.groom_father_occupation || '',
          groom_mother_occupation: caseData.groom_mother_occupation || '',
          // Bride
          bride_first_name: caseData.bride_first_name || '',
          bride_last_name: caseData.bride_last_name || '',
          bride_id: caseData.bride_id || '',
          bride_school: caseData.bride_school || '',
          bride_father_name: caseData.bride_father_name || '',
          bride_mother_name: caseData.bride_mother_name || '',
          bride_memorial_day: caseData.bride_memorial_day || '',
          bride_father_occupation: caseData.bride_father_occupation || '',
          bride_mother_occupation: caseData.bride_mother_occupation || '',
          // Contact
          address: caseData.address || '',
          contact_phone: caseData.contact_phone || '',
          contact_email: caseData.contact_email || '',
        }
      : {
          // Cleaning/Family info
          family_name: caseData.family_name || '',
          child_name: caseData.child_name || '',
          parent1_name: caseData.parent1_name || '',
          parent1_id: caseData.parent1_id || '',
          parent2_name: caseData.parent2_name || '',
          parent2_id: caseData.parent2_id || '',
          address: caseData.address || '',
          city: caseData.city || '',
          contact_phone: caseData.contact_phone || '',
          contact_phone2: caseData.contact_phone2 || '',
          contact_phone3: caseData.contact_phone3 || '',
          contact_email: caseData.contact_email || '',
          start_date: caseData.start_date || '',
        },
  });

  // ========================================
  // Field Save Handler
  // ========================================

  const handleFieldSave = async (fieldName: string, value: any): Promise<boolean> => {
    // Update the form value for validation
    form.setValue(fieldName as any, value);

    // Trigger validation for this field
    const isValid = await form.trigger(fieldName as any);

    if (!isValid) {
      return false;
    }

    // Build update payload
    let updatePayload: Record<string, any> = { [fieldName]: value };

    // If updating Gregorian date, also update Hebrew date fields
    if (fieldName === 'wedding_date_gregorian' && value) {
      try {
        const date = new Date(value);
        const hdate = new HDate(date);
        updatePayload = {
          ...updatePayload,
          hebrew_day: hdate.getDate(),
          hebrew_month: hdate.getMonth(),
          hebrew_year: hdate.getFullYear(),
        };
      } catch {
        // If conversion fails, just save the Gregorian date
      }
    }

    // Save to API
    const result = await updateCase(updatePayload);

    if (result) {
      // Update form default values
      form.reset({ ...form.getValues(), ...updatePayload });
      return true;
    }

    return false;
  };

  // ========================================
  // Render
  // ========================================

  const formValues = form.watch() as WeddingFormData & CleaningFormData;
  const formErrors = form.formState.errors as any;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-sky-600" />
          <h2 className="text-xl font-bold text-slate-900">
            {t('title')}
          </h2>
        </div>
        <ActionButton
          variant={isGlobalEditMode ? "approve" : "view"}
          onClick={() => setIsGlobalEditMode(!isGlobalEditMode)}
        >
          {isGlobalEditMode ? (
            <>
              <Check className="h-4 w-4 me-2" />
              סיום עריכה
            </>
          ) : (
            <>
              <Edit3 className="h-4 w-4 me-2" />
              עריכה
            </>
          )}
        </ActionButton>
      </div>

      {/* Wedding Case Sections */}
      {isWedding && (
        <>
          {/* Section 1: Wedding Info */}
          <Card className="shadow-md border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-sky-600" />
                {t('weddingInfo.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {/* Hebrew Date - Display from structured fields */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">{t('weddingInfo.dateHebrew')}</Label>
                <div className="text-sm text-slate-900">
                  {caseData.hebrew_day && caseData.hebrew_month && caseData.hebrew_year ? (
                    formatHebrewDateForDisplay(caseData.hebrew_day, caseData.hebrew_month, caseData.hebrew_year, 'he')
                  ) : (
                    caseData.wedding_date_hebrew || <span className="text-slate-400">{t('notSpecified')}</span>
                  )}
                </div>
              </div>
              <Field
                name="wedding_date_gregorian"
                label={t('weddingInfo.dateGregorian')}
                type="date"
                value={formValues.wedding_date_gregorian}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.wedding_date_gregorian?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="city"
                label={t('weddingInfo.city')}
                value={formValues.city}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.city?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="venue"
                label={t('weddingInfo.venue')}
                value={formValues.venue}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.venue?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="guests_count"
                label={t('weddingInfo.guestsCount')}
                type="number"
                value={formValues.guests_count}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.guests_count?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="cost_per_plate"
                label={t('weddingInfo.costPerPlate')}
                type="number"
                value={formValues.cost_per_plate}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.cost_per_plate?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="venue_cost"
                label={t('weddingInfo.venueCost')}
                type="number"
                value={formValues.venue_cost}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.venue_cost?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="total_cost"
                label={t('weddingInfo.totalCost')}
                type="number"
                value={formValues.total_cost}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.total_cost?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <div className="md:col-span-2">
                <Field
                  name="request_background"
                  label={t('weddingInfo.requestBackground')}
                  type="textarea"
                  value={formValues.request_background}
                  onSave={handleFieldSave}
                  notSpecifiedText={t('notSpecified')}
                  error={formErrors.request_background?.message as string}
                  isGlobalEditMode={isGlobalEditMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Groom Info */}
          <Card className="shadow-md border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-600" />
                {t('groomInfo.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field
                name="groom_first_name"
                label={t('groomInfo.firstName')}
                required
                value={formValues.groom_first_name}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.groom_first_name?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="groom_last_name"
                label={t('groomInfo.lastName')}
                required
                value={formValues.groom_last_name}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.groom_last_name?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="groom_id"
                label={t('groomInfo.id')}
                value={formValues.groom_id}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.groom_id?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="groom_school"
                label={t('groomInfo.school')}
                value={formValues.groom_school}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.groom_school?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="groom_father_name"
                label={t('groomInfo.fatherName')}
                value={formValues.groom_father_name}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.groom_father_name?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="groom_mother_name"
                label={t('groomInfo.motherName')}
                value={formValues.groom_mother_name}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.groom_mother_name?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
                <Field
                  name="groom_father_occupation"
                  label={t('groomInfo.fatherOccupation')}
                  value={formValues.groom_father_occupation}
                  onSave={handleFieldSave}
                  notSpecifiedText={t('notSpecified')}
                  error={formErrors.groom_father_occupation?.message as string}
                isGlobalEditMode={isGlobalEditMode}
                />
                <Field
                  name="groom_mother_occupation"
                  label={t('groomInfo.motherOccupation')}
                  value={formValues.groom_mother_occupation}
                  onSave={handleFieldSave}
                  notSpecifiedText={t('notSpecified')}
                  error={formErrors.groom_mother_occupation?.message as string}
                isGlobalEditMode={isGlobalEditMode}
                />
              <Field
                name="groom_memorial_day"
                label={t('groomInfo.memorialDay')}
                value={formValues.groom_memorial_day}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.groom_memorial_day?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
            </CardContent>
          </Card>

          {/* Section 3: Bride Info */}
          <Card className="shadow-md border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-600" />
                {t('brideInfo.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field
                name="bride_first_name"
                label={t('brideInfo.firstName')}
                required
                value={formValues.bride_first_name}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.bride_first_name?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="bride_last_name"
                label={t('brideInfo.lastName')}
                required
                value={formValues.bride_last_name}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.bride_last_name?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="bride_id"
                label={t('brideInfo.id')}
                value={formValues.bride_id}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.bride_id?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="bride_school"
                label={t('brideInfo.school')}
                value={formValues.bride_school}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.bride_school?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="bride_father_name"
                label={t('brideInfo.fatherName')}
                value={formValues.bride_father_name}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.bride_father_name?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="bride_mother_name"
                label={t('brideInfo.motherName')}
                value={formValues.bride_mother_name}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.bride_mother_name?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="bride_father_occupation"
                label={t('brideInfo.fatherOccupation')}
                value={formValues.bride_father_occupation}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.bride_father_occupation?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="bride_mother_occupation"
                label={t('brideInfo.motherOccupation')}
                value={formValues.bride_mother_occupation}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.bride_mother_occupation?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="bride_memorial_day"
                label={t('brideInfo.memorialDay')}
                value={formValues.bride_memorial_day}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.bride_memorial_day?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
            </CardContent>
          </Card>

          {/* Section 4: Contact Info */}
          <Card className="shadow-md border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                {t('contactInfo.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field
                  name="address"
                  label={t('contactInfo.address')}
                  value={formValues.address}
                  onSave={handleFieldSave}
                  notSpecifiedText={t('notSpecified')}
                  error={formErrors.address?.message as string}
                isGlobalEditMode={isGlobalEditMode}
                />
              </div>
              <Field
                name="contact_phone"
                label={t('contactInfo.phone')}
                type="tel"
                value={formValues.contact_phone}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.contact_phone?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
              <Field
                name="contact_email"
                label={t('contactInfo.email')}
                type="email"
                value={formValues.contact_email}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.contact_email?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
            </CardContent>
          </Card>

          {/* Section 5: Submitter Info (from raw_form_json) */}
          {(() => {
            const rawFormJson = caseData.raw_form_json as any;
            const submitterInfo = rawFormJson?.submitter_info;
            if (!submitterInfo?.submitter_name) return null;
            return (
              <Card className="shadow-md border border-amber-200 bg-amber-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-amber-600" />
                    {t('submitterInfo.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">{t('submitterInfo.name')}</Label>
                    <div className="text-sm text-slate-900">
                      {submitterInfo?.submitter_name || <span className="text-slate-400">{t('notSpecified')}</span>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">{t('submitterInfo.relation')}</Label>
                    <div className="text-sm text-slate-900">
                      {submitterInfo?.submitter_relation || <span className="text-slate-400">{t('notSpecified')}</span>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">{t('submitterInfo.phone')}</Label>
                    <div className="text-sm text-slate-900" dir="ltr">
                      {submitterInfo?.submitter_phone || <span className="text-slate-400">{t('notSpecified')}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </>
      )}

      {/* Cleaning Case Section */}
      {!isWedding && (
        <>
        <Card className="shadow-md border border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              {t('familyInfo.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field
              name="family_name"
              label={t('familyInfo.familyName')}
              required
              value={formValues.family_name}
              onSave={handleFieldSave}
              notSpecifiedText={t('notSpecified')}
              error={formErrors.family_name?.message as string}
                isGlobalEditMode={isGlobalEditMode}
            />
            <Field
              name="child_name"
              label={t('familyInfo.childName')}
              required
              value={formValues.child_name}
              onSave={handleFieldSave}
              notSpecifiedText={t('notSpecified')}
              error={formErrors.child_name?.message as string}
                isGlobalEditMode={isGlobalEditMode}
            />
            <Field
              name="parent1_name"
              label={t('familyInfo.parent1Name')}
              required
              value={formValues.parent1_name}
              onSave={handleFieldSave}
              notSpecifiedText={t('notSpecified')}
              error={formErrors.parent1_name?.message as string}
                isGlobalEditMode={isGlobalEditMode}
            />
            <Field
              name="parent1_id"
              label={t('familyInfo.parent1Id')}
              value={formValues.parent1_id}
              onSave={handleFieldSave}
              notSpecifiedText={t('notSpecified')}
              error={formErrors.parent1_id?.message as string}
                isGlobalEditMode={isGlobalEditMode}
            />
            <Field
              name="parent2_name"
              label={t('familyInfo.parent2Name')}
              value={formValues.parent2_name}
              onSave={handleFieldSave}
              notSpecifiedText={t('notSpecified')}
              error={formErrors.parent2_name?.message as string}
                isGlobalEditMode={isGlobalEditMode}
            />
            <Field
              name="parent2_id"
              label={t('familyInfo.parent2Id')}
              value={formValues.parent2_id}
              onSave={handleFieldSave}
              notSpecifiedText={t('notSpecified')}
              error={formErrors.parent2_id?.message as string}
                isGlobalEditMode={isGlobalEditMode}
            />
            <div className="md:col-span-2">
              <Field
                name="address"
                label={t('familyInfo.address')}
                value={formValues.address}
                onSave={handleFieldSave}
                notSpecifiedText={t('notSpecified')}
                error={formErrors.address?.message as string}
                isGlobalEditMode={isGlobalEditMode}
              />
            </div>
            <Field
              name="city"
              label={t('familyInfo.city')}
              required
              value={formValues.city}
              onSave={handleFieldSave}
              notSpecifiedText={t('notSpecified')}
              error={formErrors.city?.message as string}
                isGlobalEditMode={isGlobalEditMode}
            />
            <Field
              name="contact_phone"
              label={t('familyInfo.phone1')}
              type="tel"
              value={formValues.contact_phone}
              onSave={handleFieldSave}
              notSpecifiedText={t('notSpecified')}
              error={formErrors.contact_phone?.message as string}
                isGlobalEditMode={isGlobalEditMode}
            />
            <Field
              name="contact_phone2"
              label={t('familyInfo.phone2')}
              type="tel"
              value={formValues.contact_phone2}
              onSave={handleFieldSave}
              notSpecifiedText={t('notSpecified')}
              error={formErrors.contact_phone2?.message as string}
                isGlobalEditMode={isGlobalEditMode}
            />
            <Field
              name="contact_phone3"
              label={t('familyInfo.phone3')}
              type="tel"
              value={formValues.contact_phone3}
              onSave={handleFieldSave}
              notSpecifiedText={t('notSpecified')}
              error={formErrors.contact_phone3?.message as string}
                isGlobalEditMode={isGlobalEditMode}
            />
            <Field
              name="contact_email"
              label={t('familyInfo.email')}
              type="email"
              value={formValues.contact_email}
              onSave={handleFieldSave}
              notSpecifiedText={t('notSpecified')}
              error={formErrors.contact_email?.message as string}
                isGlobalEditMode={isGlobalEditMode}
            />
            <Field
              name="start_date"
              label={t('familyInfo.startDate')}
              type="date"
              value={formValues.start_date}
              onSave={handleFieldSave}
              notSpecifiedText={t('notSpecified')}
              error={formErrors.start_date?.message as string}
                isGlobalEditMode={isGlobalEditMode}
            />
          </CardContent>
        </Card>

          {/* Bank Details Section */}
          <Card className="shadow-md border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                {t('bankDetails.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">{t('bankDetails.bankNumber')}</Label>
                <div className="text-sm text-slate-900">
                  {caseData.bank_details?.bank_number || <span className="text-slate-400">{t('notSpecified')}</span>}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">{t('bankDetails.branch')}</Label>
                <div className="text-sm text-slate-900">
                  {caseData.bank_details?.branch || <span className="text-slate-400">{t('notSpecified')}</span>}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">{t('bankDetails.accountNumber')}</Label>
                <div className="text-sm text-slate-900">
                  {caseData.bank_details?.account_number || <span className="text-slate-400">{t('notSpecified')}</span>}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">{t('bankDetails.accountHolderName')}</Label>
                <div className="text-sm text-slate-900">
                  {caseData.bank_details?.account_holder_name || <span className="text-slate-400">{t('notSpecified')}</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Case Summary Section */}
          <Card className="shadow-md border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-sky-600" />
                {t('caseSummary.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">{t('caseSummary.totalTransferred')}</Label>
                  <div className="text-lg font-bold text-emerald-700">
                    {formatCurrency(
                      caseData.payments
                        ?.filter(p => p.status === 'transferred')
                        .reduce((sum, p) => sum + (p.amount_ils || 0), 0) || 0
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">{t('caseSummary.activeMonths')}</Label>
                  <div className="text-lg font-bold text-slate-900">
                    {caseData.payments?.filter(p => p.status === 'transferred').length || 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">{t('caseSummary.lastPayment')}</Label>
                  <div className="text-sm text-slate-900">
                    {(() => {
                      const lastPayment = caseData.payments
                        ?.filter(p => p.status === 'transferred' && p.payment_month)
                        .sort((a, b) => new Date(b.payment_month!).getTime() - new Date(a.payment_month!).getTime())[0];
                      return lastPayment?.payment_month
                        ? formatMonthYear(lastPayment.payment_month)
                        : <span className="text-slate-400">{t('notSpecified')}</span>;
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
