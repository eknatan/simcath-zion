'use client';

import { useTranslations } from 'next-intl';
import { Settings } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUserPreferences, WelcomeCardPreferences } from '@/lib/hooks/useUserPreferences';
import { cn } from '@/lib/utils';

interface SettingsOptionProps {
  id: keyof WelcomeCardPreferences;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

function SettingsOption({ id, checked, onCheckedChange, label, disabled }: SettingsOptionProps) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(checked) => onCheckedChange(checked === true)}
        disabled={disabled}
      />
      <Label
        htmlFor={id}
        className={cn(
          'text-sm cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {label}
      </Label>
    </div>
  );
}

interface WelcomeCardSettingsContentProps {
  showMainToggle?: boolean;
}

export function WelcomeCardSettingsContent({ showMainToggle = true }: WelcomeCardSettingsContentProps) {
  const t = useTranslations('dashboard.welcomeCard.settings');
  const { preferences, updateWelcomeCardPreference, isUpdating } = useUserPreferences();
  const { welcomeCard } = preferences;

  const isCardHidden = !welcomeCard.show;

  return (
    <div className="space-y-4">
      {showMainToggle && (
        <>
          <SettingsOption
            id="show"
            checked={welcomeCard.show}
            onCheckedChange={(checked) => updateWelcomeCardPreference('show', checked)}
            label={t('showCard')}
            disabled={isUpdating}
          />
          <div className="border-t border-border" />
        </>
      )}

      <div className={cn('space-y-3', isCardHidden && showMainToggle && 'opacity-50')}>
        <SettingsOption
          id="showHebrewDate"
          checked={welcomeCard.showHebrewDate}
          onCheckedChange={(checked) => updateWelcomeCardPreference('showHebrewDate', checked)}
          label={t('showHebrewDate')}
          disabled={isUpdating || (isCardHidden && showMainToggle)}
        />

        <SettingsOption
          id="showWeddingsToday"
          checked={welcomeCard.showWeddingsToday}
          onCheckedChange={(checked) => updateWelcomeCardPreference('showWeddingsToday', checked)}
          label={t('showWeddingsToday')}
          disabled={isUpdating || (isCardHidden && showMainToggle)}
        />

        <SettingsOption
          id="showPendingTransfers"
          checked={welcomeCard.showPendingTransfers}
          onCheckedChange={(checked) => updateWelcomeCardPreference('showPendingTransfers', checked)}
          label={t('showPendingTransfers')}
          disabled={isUpdating || (isCardHidden && showMainToggle)}
        />

        <SettingsOption
          id="showPendingApplicants"
          checked={welcomeCard.showPendingApplicants}
          onCheckedChange={(checked) => updateWelcomeCardPreference('showPendingApplicants', checked)}
          label={t('showPendingApplicants')}
          disabled={isUpdating || (isCardHidden && showMainToggle)}
        />

        <SettingsOption
          id="showUrgentAlerts"
          checked={welcomeCard.showUrgentAlerts}
          onCheckedChange={(checked) => updateWelcomeCardPreference('showUrgentAlerts', checked)}
          label={t('showUrgentAlerts')}
          disabled={isUpdating || (isCardHidden && showMainToggle)}
        />
      </div>
    </div>
  );
}

export function WelcomeCardSettingsPopover() {
  const t = useTranslations('dashboard.welcomeCard.settings');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="absolute top-4 end-4 p-2 rounded-full hover:bg-black/5 transition-colors z-20"
          aria-label={t('title')}
        >
          <Settings className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">{t('title')}</h4>
          <WelcomeCardSettingsContent showMainToggle={false} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
