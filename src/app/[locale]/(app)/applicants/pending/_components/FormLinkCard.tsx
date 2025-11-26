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

import { useTranslations } from 'next-intl';
import { FileText, Heart, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CopyLinkButton, SendEmailDialog } from '@/components/shared/FormLinkActions';
import type { FormType } from '@/components/shared/FormLinkActions';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FormLinkCardProps {
  formType: FormType;
  locale: string;
}

export function FormLinkCard({ formType, locale }: FormLinkCardProps) {
  const t = useTranslations('formLinks');

  const isWedding = formType === 'wedding';
  const Icon = isWedding ? FileText : Heart;
  const formPath = isWedding ? 'wedding' : 'sick-children';

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
      </CardContent>
    </Card>
  );
}
