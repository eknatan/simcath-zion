/**
 * MonthlyCapSettingsCard Component
 * כרטיס ניהול תקרת תשלום חודשי לילדים חולים
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק UI של הגדרת תקרה
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
import { Heart, Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function MonthlyCapSettingsCard() {
  // State
  const [monthlyCap, setMonthlyCap] = useState<number>(720);
  const [originalCap, setOriginalCap] = useState<number>(720);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Track changes
  useEffect(() => {
    setHasChanges(monthlyCap !== originalCap);
  }, [monthlyCap, originalCap]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings?category=cleaning');

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      const capSetting = data.settings?.find(
        (s: { setting_key: string }) => s.setting_key === 'cleaning_monthly_cap'
      );

      if (capSetting) {
        const value = typeof capSetting.setting_value === 'number'
          ? capSetting.setting_value
          : Number(capSetting.setting_value) || 720;
        setMonthlyCap(value);
        setOriginalCap(value);
      }
    } catch (error) {
      console.error('Error fetching monthly cap:', error);
      toast.error('שגיאה בטעינת הגדרות', {
        description: 'לא ניתן לטעון את תקרת התשלום. אנא נסה שוב.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateCap = (value: number): string | null => {
    if (!value || value <= 0) {
      return 'תקרת התשלום חייבת להיות מספר חיובי';
    }
    if (value > 10000) {
      return 'תקרת התשלום לא יכולה לעלות על 10,000 ₪';
    }
    return null;
  };

  const handleCapChange = (value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setMonthlyCap(numValue);
    setValidationError(null);
  };

  const handleSave = async () => {
    // Validate
    const error = validateCap(monthlyCap);
    if (error) {
      setValidationError(error);
      toast.error('שגיאת ולידציה', {
        description: error,
      });
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'cleaning_monthly_cap',
          value: monthlyCap,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save setting');
      }

      // Success
      setOriginalCap(monthlyCap);
      setHasChanges(false);

      toast.success('הגדרות נשמרו בהצלחה', {
        description: `תקרת התשלום החדשה: ${monthlyCap.toLocaleString('he-IL')} ₪`,
        icon: <CheckCircle2 className="h-5 w-5" />,
      });
    } catch (error) {
      console.error('Error saving monthly cap:', error);
      toast.error('שגיאה בשמירת ההגדרות', {
        description: error instanceof Error ? error.message : 'אירעה שגיאה לא צפויה',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setMonthlyCap(originalCap);
    setValidationError(null);
    setHasChanges(false);
  };

  return (
    <Card className="relative overflow-hidden border-2 border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-purple-50/50 to-transparent opacity-60" />

      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-purple-900">
              תקרת תשלום חודשי
            </CardTitle>
            <CardDescription className="text-purple-600">
              הגדרות ילדים חולים
            </CardDescription>
          </div>
        </div>
        <Badge className="px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CheckCircle2 className="h-3 w-3 me-1 inline" /> פעיל
        </Badge>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <>
            {/* Warning alert */}
            <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-900">
                    שים לב
                  </p>
                  <p className="text-xs text-amber-800">
                    שינוי התקרה ישפיע רק על תשלומים חדשים.<br />
                    תשלומים קיימים לא יושפעו מהשינוי.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monthly_cap" className="text-sm font-semibold text-purple-900">
                  תקרת תשלום חודשי (₪) *
                </Label>
                <Input
                  id="monthly_cap"
                  type="number"
                  value={monthlyCap || ''}
                  onChange={(e) => handleCapChange(e.target.value)}
                  disabled={isSaving}
                  placeholder=""
                  min={1}
                  max={10000}
                  className={`border-2 ${
                    validationError
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-purple-200 focus:border-purple-500'
                  } focus:ring-2 focus:ring-purple-200`}
                />
                {validationError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  סכום מקסימלי לתשלום חודשי לכל משפחה. אזהרה תוצג אם הסכום שהוזן עולה על התקרה.
                </p>
              </div>

              {/* Current value display */}
              <div className="flex items-center justify-between rounded-lg bg-purple-50 p-3 border border-purple-200">
                <span className="text-sm text-purple-700">ערך נוכחי:</span>
                <span className="text-lg font-bold text-purple-900">
                  {originalCap.toLocaleString('he-IL')} ₪
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-purple-100">
              <div className="text-xs text-muted-foreground">
                {hasChanges && '* יש שינויים שלא נשמרו'}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasChanges || isSaving}
                  className="border-2 border-purple-200"
                >
                  ביטול
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:text-gray-500"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      שומר...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 me-2" />
                      שמור
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
