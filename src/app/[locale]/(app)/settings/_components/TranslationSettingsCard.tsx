/**
 * TranslationSettingsCard Component
 * כרטיס ניהול הגדרות תרגום - בחירת ספק והגדרת API Keys
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Languages, Loader2, Save, CheckCircle2, Zap } from 'lucide-react';
import { useTranslationSettings, TranslationProvider, PROVIDER_INFO } from '@/lib/hooks/useTranslationSettings';

export function TranslationSettingsCard() {
  const t = useTranslations();

  const {
    settings,
    isLoading,
    updateSettings,
    isUpdating,
    testProvider,
    isTesting,
    testingProvider,
  } = useTranslationSettings();

  // Local state for form
  const [provider, setProvider] = useState<TranslationProvider>('microsoft');
  const [googleKey, setGoogleKey] = useState('');
  const [microsoftKey, setMicrosoftKey] = useState('');
  const [microsoftRegion, setMicrosoftRegion] = useState('eastus');
  const [groqKey, setGroqKey] = useState('');

  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false);

  // Track initial provider to detect changes
  const [initialProvider, setInitialProvider] = useState<TranslationProvider>('microsoft');

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [keysToReplace, setKeysToReplace] = useState<string[]>([]);

  // Initialize form from settings
  useEffect(() => {
    if (settings) {
      setProvider(settings.provider);
      setInitialProvider(settings.provider);
      setMicrosoftRegion(settings.microsoft_translator_region || 'eastus');
    }
  }, [settings]);

  // Check if there are actual changes
  useEffect(() => {
    const providerChanged = provider !== initialProvider;
    const hasNewKeys = googleKey.length > 0 || microsoftKey.length > 0 || groqKey.length > 0;
    setHasChanges(providerChanged || hasNewKeys);
  }, [provider, initialProvider, googleKey, microsoftKey, groqKey]);

  const handleSaveClick = () => {
    // Check which keys will be replaced
    const replacingKeys: string[] = [];

    if (googleKey && settings?.hasGoogleKey) {
      replacingKeys.push('Google API Key');
    }
    if (microsoftKey && settings?.hasMicrosoftKey) {
      replacingKeys.push('Microsoft Translator Key');
    }
    if (groqKey && settings?.hasGroqKey) {
      replacingKeys.push('Groq API Key');
    }

    // If replacing any existing keys, show confirmation
    if (replacingKeys.length > 0) {
      setKeysToReplace(replacingKeys);
      setShowConfirmDialog(true);
    } else {
      // No keys being replaced, save directly
      performSave();
    }
  };

  const performSave = () => {
    const updates: Record<string, string | undefined> = {
      provider,
    };

    // Only include keys if they were entered
    if (googleKey) {
      updates.google_api_key = googleKey;
    }
    if (microsoftKey) {
      updates.microsoft_translator_key = microsoftKey;
    }
    if (microsoftRegion) {
      updates.microsoft_translator_region = microsoftRegion;
    }
    if (groqKey) {
      updates.groq_api_key = groqKey;
    }

    updateSettings(updates as any);
    // Clear the key inputs after save and update initial provider
    setGoogleKey('');
    setMicrosoftKey('');
    setGroqKey('');
    setInitialProvider(provider);
    setShowConfirmDialog(false);
  };

  const handleTest = (providerToTest: TranslationProvider) => {
    testProvider(providerToTest);
  };

  const providers: TranslationProvider[] = ['google', 'microsoft', 'groq'];

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-2 border-purple-100 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-purple-50/50 to-transparent opacity-60" />
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="relative overflow-hidden border-2 border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-purple-50/50 to-transparent opacity-60" />

        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
              <Languages className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-purple-900">
                {t('settings.translation.title')}
              </CardTitle>
              <CardDescription className="text-purple-600">
                {t('settings.translation.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-6">
          {/* Provider Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-purple-900">
              {t('settings.translation.provider')}
            </Label>
            <RadioGroup
              value={provider}
              onValueChange={(value) => {
                setProvider(value as TranslationProvider);
              }}
              className="space-y-2"
            >
              {providers.map((p) => (
                <div
                  key={p}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    provider === p
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-purple-100 bg-white hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={p} id={p} className="border-purple-400" />
                    <div>
                      <Label htmlFor={p} className="text-sm font-medium text-purple-900 cursor-pointer">
                        {PROVIDER_INFO[p].nameHe}
                      </Label>
                      <p className="text-xs text-purple-600">{PROVIDER_INFO[p].descriptionHe}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-purple-500 bg-purple-100 px-2 py-1 rounded">
                      {PROVIDER_INFO[p].freeLimit}
                    </span>
                    {settings && (
                      <>
                        {p === 'google' && settings.hasGoogleKey && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {p === 'microsoft' && settings.hasMicrosoftKey && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {p === 'groq' && settings.hasGroqKey && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* API Keys Section */}
          <div className="space-y-4 pt-4 border-t border-purple-200">
            <Label className="text-sm font-semibold text-purple-900">
              {t('settings.translation.apiKeys')}
            </Label>

            {/* Google API Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="googleKey" className="text-sm text-purple-700">
                  {t('settings.translation.googleKey')}
                </Label>
                {settings?.hasGoogleKey && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('settings.translation.configured')}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  id="googleKey"
                  type="text"
                  placeholder={settings?.hasGoogleKey ? '••••••••••••••••' : t('settings.translation.enterApiKey')}
                  value={googleKey}
                  onChange={(e) => setGoogleKey(e.target.value)}
                  className="flex-1 border-2 border-purple-200 focus:border-purple-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest('google')}
                  disabled={isTesting || (!settings?.hasGoogleKey && !googleKey)}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  {isTesting && testingProvider === 'google' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="h-4 w-4 me-1" />
                      {t('settings.translation.test')}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Microsoft API Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="microsoftKey" className="text-sm text-purple-700">
                  {t('settings.translation.microsoftKey')}
                </Label>
                {settings?.hasMicrosoftKey && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('settings.translation.configured')}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  id="microsoftKey"
                  type="text"
                  placeholder={settings?.hasMicrosoftKey ? '••••••••••••••••' : t('settings.translation.enterApiKey')}
                  value={microsoftKey}
                  onChange={(e) => setMicrosoftKey(e.target.value)}
                  className="flex-1 border-2 border-purple-200 focus:border-purple-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest('microsoft')}
                  disabled={isTesting || (!settings?.hasMicrosoftKey && !microsoftKey)}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  {isTesting && testingProvider === 'microsoft' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="h-4 w-4 me-1" />
                      {t('settings.translation.test')}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Microsoft Region */}
            <div className="space-y-2">
              <Label htmlFor="microsoftRegion" className="text-sm text-purple-700">
                {t('settings.translation.microsoftRegion')}
              </Label>
              <Input
                id="microsoftRegion"
                type="text"
                placeholder="eastus"
                value={microsoftRegion}
                onChange={(e) => setMicrosoftRegion(e.target.value)}
                className="border-2 border-purple-200 focus:border-purple-500"
              />
            </div>

            {/* Groq API Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="groqKey" className="text-sm text-purple-700">
                  {t('settings.translation.groqKey')}
                </Label>
                {settings?.hasGroqKey && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('settings.translation.configured')}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  id="groqKey"
                  type="text"
                  placeholder={settings?.hasGroqKey ? '••••••••••••••••' : t('settings.translation.enterApiKey')}
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  className="flex-1 border-2 border-purple-200 focus:border-purple-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest('groq')}
                  disabled={isTesting || (!settings?.hasGroqKey && !groqKey)}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  {isTesting && testingProvider === 'groq' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="h-4 w-4 me-1" />
                      {t('settings.translation.test')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-purple-200">
            <Button
              onClick={handleSaveClick}
              disabled={isUpdating || !hasChanges}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 me-2" />
                  {t('settings.translation.save')}
                </>
              )}
            </Button>
          </div>

          {/* Info message */}
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 space-y-2">
            <p className="text-sm font-medium text-purple-900">
              {t('settings.translation.infoTitle')}
            </p>
            <p className="text-xs text-purple-700">
              {t('settings.translation.infoDescription')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.translation.confirmReplaceTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.translation.confirmReplaceDescription')}
              <ul className="mt-2 list-disc list-inside">
                {keysToReplace.map((key) => (
                  <li key={key} className="font-medium">{key}</li>
                ))}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={performSave}>
              {t('settings.translation.confirmReplace')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
