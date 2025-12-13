/**
 * WelcomeCardSettingsCard Component
 * כרטיס ניהול הגדרות כרטיס ברוכים הבאים
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק UI של הגדרות כרטיס ברוכים הבאים
 *
 * עיצוב: לפי DESIGN_SYSTEM.md
 * - כרטיס עם גרדיאנט
 * - צללים מעובים
 * - אייקונים עם רקע גרדיאנט
 */

'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, LayoutDashboard } from 'lucide-react';
import { useUserPreferences, WelcomeCardPreferences } from '@/lib/hooks/useUserPreferences';
import { cn } from '@/lib/utils';

interface SettingsOptionProps {
  id: keyof WelcomeCardPreferences;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

function SettingsOption({ id, checked, onCheckedChange, label, description, disabled }: SettingsOptionProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50/50 transition-colors">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(checked) => onCheckedChange(checked === true)}
        disabled={disabled}
        className="mt-0.5"
      />
      <div className="space-y-1 flex-1">
        <Label
          htmlFor={id}
          className={cn(
            'text-sm font-medium cursor-pointer',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

export function WelcomeCardSettingsCard() {
  const t = useTranslations('settings.welcomeCard');
  const { preferences, updateWelcomeCardPreference, isLoading, isUpdating } = useUserPreferences();
  const { welcomeCard } = preferences;

  const isCardHidden = !welcomeCard.show;

  return (
    <Card className="relative overflow-hidden border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-50/50 to-transparent opacity-60" />

      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-blue-900">
              {t('title')}
            </CardTitle>
            <CardDescription className="text-blue-600">
              {t('description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Main toggle */}
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50/50 overflow-hidden">
              <SettingsOption
                id="show"
                checked={welcomeCard.show}
                onCheckedChange={(checked) => updateWelcomeCardPreference('show', checked)}
                label={t('options.show')}
                description={t('options.showDescription')}
                disabled={isUpdating}
              />
            </div>

            {/* Sub-options */}
            <div className={cn(
              'space-y-1 rounded-lg border-2 border-blue-100 overflow-hidden transition-opacity',
              isCardHidden && 'opacity-50'
            )}>
              <SettingsOption
                id="showHebrewDate"
                checked={welcomeCard.showHebrewDate}
                onCheckedChange={(checked) => updateWelcomeCardPreference('showHebrewDate', checked)}
                label={t('options.showHebrewDate')}
                description={t('options.showHebrewDateDescription')}
                disabled={isUpdating || isCardHidden}
              />

              <SettingsOption
                id="showWeddingsToday"
                checked={welcomeCard.showWeddingsToday}
                onCheckedChange={(checked) => updateWelcomeCardPreference('showWeddingsToday', checked)}
                label={t('options.showWeddingsToday')}
                description={t('options.showWeddingsTodayDescription')}
                disabled={isUpdating || isCardHidden}
              />

              <SettingsOption
                id="showPendingTransfers"
                checked={welcomeCard.showPendingTransfers}
                onCheckedChange={(checked) => updateWelcomeCardPreference('showPendingTransfers', checked)}
                label={t('options.showPendingTransfers')}
                description={t('options.showPendingTransfersDescription')}
                disabled={isUpdating || isCardHidden}
              />

              <SettingsOption
                id="showPendingApplicants"
                checked={welcomeCard.showPendingApplicants}
                onCheckedChange={(checked) => updateWelcomeCardPreference('showPendingApplicants', checked)}
                label={t('options.showPendingApplicants')}
                description={t('options.showPendingApplicantsDescription')}
                disabled={isUpdating || isCardHidden}
              />

              <SettingsOption
                id="showUrgentAlerts"
                checked={welcomeCard.showUrgentAlerts}
                onCheckedChange={(checked) => updateWelcomeCardPreference('showUrgentAlerts', checked)}
                label={t('options.showUrgentAlerts')}
                description={t('options.showUrgentAlertsDescription')}
                disabled={isUpdating || isCardHidden}
              />
            </div>

            {/* Info note */}
            <p className="text-xs text-muted-foreground text-center pt-2">
              {t('note')}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
