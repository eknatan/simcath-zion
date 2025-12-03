'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { HDate, months } from '@hebcal/core';
import { useTranslations } from 'next-intl';
import { formatHebrewDateForDisplay } from '@/lib/utils/hebrew-date-parser';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, X, Check } from 'lucide-react';

/**
 * Hebrew month data with name and number of days
 */
const HEBREW_MONTHS = [
  { value: months.TISHREI, nameHe: 'תשרי', nameEn: 'Tishrei', days: 30 },
  { value: months.CHESHVAN, nameHe: 'חשוון', nameEn: 'Cheshvan', days: 29 }, // Can be 29 or 30
  { value: months.KISLEV, nameHe: 'כסלו', nameEn: 'Kislev', days: 30 }, // Can be 29 or 30
  { value: months.TEVET, nameHe: 'טבת', nameEn: 'Tevet', days: 29 },
  { value: months.SHVAT, nameHe: 'שבט', nameEn: 'Shevat', days: 30 },
  { value: months.ADAR_I, nameHe: 'אדר', nameEn: 'Adar', days: 29 },
  { value: months.ADAR_II, nameHe: "אדר ב'", nameEn: 'Adar II', days: 29 },
  { value: months.NISAN, nameHe: 'ניסן', nameEn: 'Nisan', days: 30 },
  { value: months.IYYAR, nameHe: 'אייר', nameEn: 'Iyar', days: 29 },
  { value: months.SIVAN, nameHe: 'סיון', nameEn: 'Sivan', days: 30 },
  { value: months.TAMUZ, nameHe: 'תמוז', nameEn: 'Tamuz', days: 29 },
  { value: months.AV, nameHe: 'אב', nameEn: 'Av', days: 30 },
  { value: months.ELUL, nameHe: 'אלול', nameEn: 'Elul', days: 29 },
];

export interface HebrewDateValue {
  day: number | null;
  month: number | null;
  year: number | null;
  gregorianDate: string | null;
}

interface HebrewDatePickerProps {
  value: HebrewDateValue;
  onChange: (value: HebrewDateValue) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  showGregorianInput?: boolean;
}

/**
 * Check if a Hebrew year is a leap year (has Adar II)
 */
function isHebrewLeapYear(year: number): boolean {
  return HDate.isLeapYear(year);
}

/**
 * Get the number of days in a Hebrew month for a specific year
 */
function getDaysInHebrewMonth(month: number, year: number): number {
  if (!month || !year) return 30;
  return HDate.daysInMonth(month, year);
}

/**
 * Get months available for a specific year (handles leap year)
 */
function getMonthsForYear(year: number): typeof HEBREW_MONTHS {
  const isLeap = isHebrewLeapYear(year);

  return HEBREW_MONTHS.filter(m => {
    // In non-leap year, hide Adar II and show Adar I as "Adar"
    if (!isLeap && m.value === months.ADAR_II) return false;
    return true;
  }).map(m => {
    // In non-leap year, rename Adar I to just Adar
    if (!isLeap && m.value === months.ADAR_I) {
      return { ...m, nameHe: 'אדר', nameEn: 'Adar' };
    }
    return m;
  });
}


/**
 * HebrewDatePicker - Component for selecting Hebrew dates
 *
 * Features:
 * - Gregorian date input with automatic Hebrew conversion
 * - Manual Hebrew date editing with 3 dropdowns
 * - Handles leap years and variable month lengths
 * - Bidirectional sync between Gregorian and Hebrew
 */
export function HebrewDatePicker({
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  showGregorianInput = true,
}: HebrewDatePickerProps) {
  const t = useTranslations('hebrew_date_picker');
  const [isManualEdit, setIsManualEdit] = useState(false);
  const locale = 'he'; // Fixed locale for now

  // Get current Hebrew year for default
  const currentHebrewYear = useMemo(() => {
    return new HDate(new Date()).getFullYear();
  }, []);

  // Generate year options (current year -5 to +5)
  const yearOptions = useMemo(() => {
    const years = [];
    for (let i = currentHebrewYear - 5; i <= currentHebrewYear + 5; i++) {
      years.push(i);
    }
    return years;
  }, [currentHebrewYear]);

  // Get available months for selected year
  const availableMonths = useMemo(() => {
    return getMonthsForYear(value.year || currentHebrewYear);
  }, [value.year, currentHebrewYear]);

  // Get days for selected month/year
  const daysInMonth = useMemo(() => {
    if (!value.month || !value.year) return 30;
    return getDaysInHebrewMonth(value.month, value.year);
  }, [value.month, value.year]);

  // Handle Gregorian date change - convert to Hebrew
  const handleGregorianChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const gregDate = e.target.value;

    if (!gregDate) {
      onChange({
        day: null,
        month: null,
        year: null,
        gregorianDate: null,
      });
      return;
    }

    try {
      const date = new Date(gregDate);
      const hdate = new HDate(date);

      onChange({
        day: hdate.getDate(),
        month: hdate.getMonth(),
        year: hdate.getFullYear(),
        gregorianDate: gregDate,
      });
    } catch {
      onChange({
        ...value,
        gregorianDate: gregDate,
      });
    }
  };

  // Handle Hebrew date component changes
  const handleHebrewChange = (field: 'day' | 'month' | 'year', newValue: number | null) => {
    const updated = { ...value, [field]: newValue };

    // If all fields are set, calculate Gregorian date
    if (updated.day && updated.month && updated.year) {
      try {
        // Ensure day is valid for the month
        const maxDays = getDaysInHebrewMonth(updated.month, updated.year);
        if (updated.day > maxDays) {
          updated.day = maxDays;
        }

        const hdate = new HDate(updated.day, updated.month, updated.year);
        const gregDate = hdate.greg();
        updated.gregorianDate = gregDate.toISOString().split('T')[0];
      } catch {
        // Keep current Gregorian date if conversion fails
      }
    }

    onChange(updated);
  };

  // Adjust day if it exceeds the month's maximum
  useEffect(() => {
    if (value.day && value.day > daysInMonth) {
      // Update directly to avoid circular dependency
      onChange({
        ...value,
        day: daysInMonth,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysInMonth]);

  // Formatted Hebrew date for display
  const formattedHebrewDate = useMemo(() => {
    if (value.day && value.month && value.year) {
      return formatHebrewDateForDisplay(value.day, value.month, value.year, locale as 'he' | 'en');
    }
    return '';
  }, [value.day, value.month, value.year, locale]);

  return (
    <div className="space-y-3">
      {/* Row with Gregorian Input and Hebrew Date */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Gregorian Date Input */}
        {showGregorianInput && (
          <div className="flex-1 space-y-1">
            <Label htmlFor="gregorian-date" className="text-xs">
              {t('gregorian_date')}
              {required && <span className="text-destructive ms-1">*</span>}
            </Label>
            <Input
              id="gregorian-date"
              type="date"
              value={value.gregorianDate || ''}
              onChange={handleGregorianChange}
              disabled={disabled}
              className={`h-9 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              aria-invalid={!!error}
            />
          </div>
        )}

        {/* Hebrew Date Display / Edit */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">
              {t('hebrew_date')}
              {!showGregorianInput && required && <span className="text-destructive ms-1">*</span>}
            </Label>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsManualEdit(!isManualEdit)}
                className="h-5 px-1.5 text-xs"
              >
                {isManualEdit ? (
                  <>
                    <X className="h-3 w-3 me-1" />
                    {t('cancel')}
                  </>
                ) : (
                  <>
                    <Pencil className="h-3 w-3 me-1" />
                    {t('manual_edit')}
                  </>
                )}
              </Button>
            )}
          </div>

          {isManualEdit ? (
            /* Manual Edit Mode - 3 Dropdowns + Save Button */
            <div className="flex gap-1.5 items-center">
              {/* Day */}
              <Select
                value={value.day?.toString() || ''}
                onValueChange={(v) => handleHebrewChange('day', parseInt(v, 10))}
                disabled={disabled}
              >
                <SelectTrigger className={`h-9 w-16 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}>
                  <SelectValue placeholder={t('day')} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Month */}
              <Select
                value={value.month?.toString() || ''}
                onValueChange={(v) => handleHebrewChange('month', parseInt(v, 10))}
                disabled={disabled}
              >
                <SelectTrigger className={`h-9 flex-1 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}>
                  <SelectValue placeholder={t('month')} />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {locale === 'he' ? month.nameHe : month.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Year */}
              <Select
                value={value.year?.toString() || ''}
                onValueChange={(v) => handleHebrewChange('year', parseInt(v, 10))}
                disabled={disabled}
              >
                <SelectTrigger className={`h-9 w-20 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}>
                  <SelectValue placeholder={t('year')} />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Save Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsManualEdit(false)}
                className="h-9 w-9 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                disabled={!value.day || !value.month || !value.year}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            /* Display Mode */
            <div className={`p-2 bg-muted/50 rounded-md border h-9 flex items-center ${error ? 'border-destructive' : ''}`}>
              {formattedHebrewDate ? (
                <span className="text-sm font-medium">{formattedHebrewDate}</span>
              ) : (
                <span className="text-sm text-muted-foreground">{t('no_date_selected')}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

export default HebrewDatePicker;
