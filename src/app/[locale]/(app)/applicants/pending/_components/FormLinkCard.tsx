'use client';

/**
 * FormLinkCard
 *
 * כרטיס לשיתוף קישור לטופס - העתקה ושליחה במייל
 *
 * עקרונות SOLID:
 * - Single Responsibility: מציג UI לשיתוף טופס אחד
 * - Dependency Inversion: משתמש בקומפוננטות משותפות
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Heart, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CopyLinkButton, SendEmailDialog } from '@/components/shared/FormLinkActions';
import type { FormType } from '@/components/shared/FormLinkActions';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FormLinkCardProps {
  formType: FormType;
  locale: string;
}

export function FormLinkCard({ formType, locale }: FormLinkCardProps) {
  const t = useTranslations('formLinks');

  const isWedding = formType === 'wedding';
  const Icon = isWedding ? FileText : Heart;
  const formPath = isWedding ? 'wedding' : 'sick-children';

  // Wedding form settings state - use string to allow empty input while typing
  const [wordLimitInput, setWordLimitInput] = useState<string>('150');
  const [originalWordLimit, setOriginalWordLimit] = useState<number>(150);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch wedding form settings on mount (only for wedding)
  useEffect(() => {
    if (!isWedding) return;

    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/wedding-form');
        if (response.ok) {
          const data = await response.json();
          const limit = data.settings?.background_word_limit || 150;
          setWordLimitInput(String(limit));
          setOriginalWordLimit(limit);
        }
      } catch (error) {
        console.error('Error fetching wedding form settings:', error);
      }
    };

    fetchSettings();
  }, [isWedding]);

  // Parse current input value
  const currentValue = parseInt(wordLimitInput) || 0;
  const isValidValue = currentValue >= 1 && currentValue <= 10000;
  const hasChanges = isValidValue && currentValue !== originalWordLimit;

  // Save wedding form settings
  const handleSaveWordLimit = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/wedding-form', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { background_word_limit: currentValue } }),
      });

      if (response.ok) {
        setOriginalWordLimit(currentValue);
        toast.success(t('settings.saveSuccess'));
      } else {
        toast.error(t('settings.saveError'));
      }
    } catch {
      toast.error(t('settings.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  // Build full URL
  const formUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${locale}/public-forms/${formPath}`
    : `/${locale}/public-forms/${formPath}`;

  return (
    <Card className={cn(
      'overflow-hidden transition-all duration-200 hover:shadow-md',
      isWedding
        ? 'border-blue-200 bg-gradient-to-br from-blue-50/50 to-white'
        : 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white'
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Icon & Title */}
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2.5 rounded-xl',
              isWedding
                ? 'bg-blue-100 text-blue-600'
                : 'bg-emerald-100 text-emerald-600'
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className={cn(
                'font-semibold text-lg',
                isWedding ? 'text-blue-700' : 'text-emerald-700'
              )}>
                {isWedding ? t('formTypes.wedding') : t('formTypes.sickChildren')}
              </h3>
              <Link
                href={formUrl}
                target="_blank"
                className={cn(
                  'text-sm flex items-center gap-1 hover:underline',
                  isWedding ? 'text-blue-500' : 'text-emerald-500'
                )}
              >
                {t('openLink')}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            <CopyLinkButton
              url={formUrl}
              variant="outline"
              size="sm"
              showLabel={false}
              className={cn(
                'h-9 w-9 p-0',
                isWedding
                  ? 'border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                  : 'border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300'
              )}
            />
            <SendEmailDialog
              formType={formType}
              formUrl={formUrl}
              trigger={
                <Button
                  size="sm"
                  className={cn(
                    'shadow-sm',
                    isWedding
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  )}
                >
                  {t('sendEmail')}
                </Button>
              }
            />
          </div>
        </div>

        {/* Wedding form settings - word limit (inline) */}
        {isWedding && (
          <div className="mt-3 pt-3 border-t border-blue-100 flex items-center gap-2 text-sm">
            <span className="text-slate-600">{t('settings.backgroundWordLimit')}:</span>
            <Input
              type="number"
              min={1}
              max={10000}
              value={wordLimitInput}
              onChange={(e) => setWordLimitInput(e.target.value)}
              className="w-20 h-7 text-sm border-slate-200"
            />
            {hasChanges && (
              <Button
                size="sm"
                onClick={handleSaveWordLimit}
                disabled={isSaving}
                className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : t('settings.save')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
