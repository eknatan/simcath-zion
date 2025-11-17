/**
 * MasavSettingsCard Component
 * כרטיס ניהול הגדרות MASAV - פרטי מוסד להעברות בנקאיות
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק UI של הגדרות MASAV
 * - Open/Closed: ניתן להרחיב עם הגדרות נוספות
 *
 * עיצוב: לפי DESIGN_SYSTEM.md
 * - כרטיס עם גרדיאנט
 * - צללים מעובים
 * - אייקונים עם רקע גרדיאנט
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MasavOrganizationSettings, HebrewEncodingType } from '@/lib/services/settings.service';

export function MasavSettingsCard() {

  // State
  const [settings, setSettings] = useState<MasavOrganizationSettings>({
    institution_id: '',
    institution_name: '',
    bank_code: '',
    branch_code: '',
    account_number: '',
    sequence_number: '001',
    hebrew_encoding: 'code-a',
  });
  const [originalSettings, setOriginalSettings] = useState<MasavOrganizationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Track changes
  useEffect(() => {
    if (originalSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasChanges(changed);
    }
  }, [settings, originalSettings]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings/masav-organization');

      if (!response.ok) {
        throw new Error('Failed to fetch MASAV settings');
      }

      const data = await response.json();
      setSettings(data.settings);
      setOriginalSettings(data.settings);
    } catch (error) {
      console.error('Error fetching MASAV settings:', error);
      toast.error('שגיאה בטעינת הגדרות MASAV', {
        description: 'לא ניתן לטעון את ההגדרות. אנא נסה שוב.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'institution_id':
        if (!value) return 'מספר מוסד הוא שדה חובה';
        if (!/^\d{8}$/.test(value)) return 'מספר מוסד חייב להכיל 8 ספרות';
        return null;

      case 'institution_name':
        if (!value || value.trim().length === 0) return 'שם המוסד הוא שדה חובה';
        if (value.trim().length > 50) return 'שם המוסד ארוך מדי (מקסימום 50 תווים)';
        return null;

      case 'bank_code':
        if (!value) return 'קוד בנק הוא שדה חובה';
        if (!/^\d{1,3}$/.test(value)) return 'קוד בנק חייב להכיל 1-3 ספרות';
        return null;

      case 'branch_code':
        if (!value) return 'קוד סניף הוא שדה חובה';
        if (!/^\d{1,3}$/.test(value)) return 'קוד סניף חייב להכיל 1-3 ספרות';
        return null;

      case 'account_number':
        if (!value) return 'מספר חשבון הוא שדה חובה';
        if (!/^\d+$/.test(value)) return 'מספר חשבון חייב להכיל רק ספרות';
        if (value.length > 20) return 'מספר חשבון ארוך מדי (מקסימום 20 ספרות)';
        return null;

      case 'sequence_number':
        if (!value) return 'מספר רצף הוא שדה חובה';
        if (!/^\d{3}$/.test(value)) return 'מספר רצף חייב להכיל 3 ספרות';
        return null;

      default:
        return null;
    }
  };

  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    Object.entries(settings).forEach(([field, value]) => {
      const error = validateField(field, value);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleFieldChange = (field: keyof MasavOrganizationSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));

    // Clear validation error for this field
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleSave = async () => {
    // Validate all fields
    if (!validateAllFields()) {
      toast.error('שגיאת ולידציה', {
        description: 'אנא תקן את השדות המסומנים באדום',
      });
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/settings/masav-organization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save MASAV settings');
      }

      // Success
      setSettings(data.settings);
      setOriginalSettings(data.settings);
      setHasChanges(false);

      toast.success('הגדרות נשמרו בהצלחה', {
        description: 'הגדרות MASAV עודכנו במערכת',
        icon: <CheckCircle2 className="h-5 w-5" />,
      });
    } catch (error) {
      console.error('Error saving MASAV settings:', error);
      toast.error('שגיאה בשמירת ההגדרות', {
        description: error instanceof Error ? error.message : 'אירעה שגיאה לא צפויה',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setValidationErrors({});
      setHasChanges(false);
    }
  };

  const isConfigured = settings.institution_id && settings.institution_id !== '00000000';

  return (
    <Card className="relative overflow-hidden border-2 border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-transparent opacity-60" />

      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-emerald-900">
              הגדרות MASAV
            </CardTitle>
            <CardDescription className="text-emerald-600">
              פרטי מוסד להעברות בנקאיות
            </CardDescription>
          </div>
        </div>
        <Badge
          className={`px-3 py-1 ${
            isConfigured
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
          }`}
        >
          {isConfigured ? (
            <><CheckCircle2 className="h-3 w-3 me-1 inline" /> מוגדר</>
          ) : (
            <><AlertCircle className="h-3 w-3 me-1 inline" /> דורש הגדרה</>
          )}
        </Badge>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <>
            {/* Info alert */}
            <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-900">
                    מידע חשוב
                  </p>
                  <p className="text-xs text-amber-800">
                    פרטים אלה נדרשים להנפקת קבצי MASAV. יש לקבל את המידע מהבנק:<br />
                    • מספר מוסד (8 ספרות)<br />
                    • פרטי חשבון המוסד (בנק 1-3 ספרות, סניף 1-3 ספרות, חשבון)<br />
                    • קידוד עברית - רוב הבנקים משתמשים בקוד עברי א (Code A)
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Institution ID */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="institution_id" className="text-sm font-semibold text-emerald-900">
                  מספר מוסד *
                </Label>
                <Input
                  id="institution_id"
                  type="text"
                  value={settings.institution_id}
                  onChange={(e) => handleFieldChange('institution_id', e.target.value)}
                  disabled={isSaving}
                  placeholder="12345678"
                  maxLength={8}
                  className={`border-2 ${
                    validationErrors.institution_id
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-emerald-200 focus:border-emerald-500'
                  } focus:ring-2 focus:ring-emerald-200`}
                />
                {validationErrors.institution_id && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.institution_id}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  מספר ייחודי בן 8 ספרות שהתקבל מהבנק
                </p>
              </div>

              {/* Institution Name */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="institution_name" className="text-sm font-semibold text-emerald-900">
                  שם המוסד *
                </Label>
                <Input
                  id="institution_name"
                  type="text"
                  value={settings.institution_name}
                  onChange={(e) => handleFieldChange('institution_name', e.target.value)}
                  disabled={isSaving}
                  placeholder="Shimchat Zion"
                  className={`border-2 ${
                    validationErrors.institution_name
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-emerald-200 focus:border-emerald-500'
                  } focus:ring-2 focus:ring-emerald-200`}
                />
                {validationErrors.institution_name && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.institution_name}
                  </p>
                )}
              </div>

              {/* Bank Code */}
              <div className="space-y-2">
                <Label htmlFor="bank_code" className="text-sm font-semibold text-emerald-900">
                  קוד בנק *
                </Label>
                <Input
                  id="bank_code"
                  type="text"
                  value={settings.bank_code}
                  onChange={(e) => handleFieldChange('bank_code', e.target.value)}
                  disabled={isSaving}
                  placeholder="12 או 9 (בנק הדואר)"
                  maxLength={3}
                  className={`border-2 ${
                    validationErrors.bank_code
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-emerald-200 focus:border-emerald-500'
                  } focus:ring-2 focus:ring-emerald-200`}
                />
                {validationErrors.bank_code && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.bank_code}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">1-3 ספרות</p>
              </div>

              {/* Branch Code */}
              <div className="space-y-2">
                <Label htmlFor="branch_code" className="text-sm font-semibold text-emerald-900">
                  קוד סניף *
                </Label>
                <Input
                  id="branch_code"
                  type="text"
                  value={settings.branch_code}
                  onChange={(e) => handleFieldChange('branch_code', e.target.value)}
                  disabled={isSaving}
                  placeholder="345"
                  maxLength={3}
                  className={`border-2 ${
                    validationErrors.branch_code
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-emerald-200 focus:border-emerald-500'
                  } focus:ring-2 focus:ring-emerald-200`}
                />
                {validationErrors.branch_code && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.branch_code}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">1-3 ספרות</p>
              </div>

              {/* Account Number */}
              <div className="space-y-2">
                <Label htmlFor="account_number" className="text-sm font-semibold text-emerald-900">
                  מספר חשבון *
                </Label>
                <Input
                  id="account_number"
                  type="text"
                  value={settings.account_number}
                  onChange={(e) => handleFieldChange('account_number', e.target.value)}
                  disabled={isSaving}
                  placeholder="1234567"
                  maxLength={20}
                  className={`border-2 ${
                    validationErrors.account_number
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-emerald-200 focus:border-emerald-500'
                  } focus:ring-2 focus:ring-emerald-200`}
                />
                {validationErrors.account_number && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.account_number}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">עד 20 ספרות</p>
              </div>

              {/* Sequence Number */}
              <div className="space-y-2">
                <Label htmlFor="sequence_number" className="text-sm font-semibold text-emerald-900">
                  מספר רצף *
                </Label>
                <Input
                  id="sequence_number"
                  type="text"
                  value={settings.sequence_number}
                  onChange={(e) => handleFieldChange('sequence_number', e.target.value)}
                  disabled={isSaving}
                  placeholder="001"
                  maxLength={3}
                  className={`border-2 ${
                    validationErrors.sequence_number
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-emerald-200 focus:border-emerald-500'
                  } focus:ring-2 focus:ring-emerald-200`}
                />
                {validationErrors.sequence_number && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.sequence_number}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">3 ספרות (בדרך כלל 001)</p>
              </div>

              {/* Hebrew Encoding */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="hebrew_encoding" className="text-sm font-semibold text-emerald-900">
                  קידוד עברית (Hebrew Encoding)
                </Label>
                <Select
                  value={settings.hebrew_encoding || 'code-a'}
                  onValueChange={(value) => handleFieldChange('hebrew_encoding', value as HebrewEncodingType)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200">
                    <SelectValue placeholder="בחר קידוד עברית" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code-a">
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">קוד עברי א (Code A)</span>
                        <span className="text-xs text-muted-foreground">מיפוי ASCII - הנפוץ ביותר</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="code-b">
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">קוד עברי ב (Code B)</span>
                        <span className="text-xs text-muted-foreground">בייטים 128-154</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  קוד עברי א (Code A) הוא הנפוץ ביותר. יש לבדוק עם הבנק איזה קידוד הם דורשים.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-emerald-100">
              <div className="text-xs text-muted-foreground">
                {hasChanges && '* יש שינויים שלא נשמרו'}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasChanges || isSaving}
                  className="border-2 border-emerald-200"
                >
                  ביטול
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-md hover:shadow-lg transition-all"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      שומר...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 me-2" />
                      שמור הגדרות
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
