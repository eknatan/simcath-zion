'use client';

/**
 * FormLinkActions
 *
 * קומפוננטה ראשית לפעולות על קישורי טפסים
 * מרכיבה את כפתור ההעתקה ודיאלוג המייל
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק מרכיבה קומפוננטות
 * - Open/Closed: ניתן להרחבה עם פעולות נוספות
 * - Dependency Inversion: תלוי ב-props ולא במימוש ספציפי
 */

import { useTranslations } from 'next-intl';
import { FileText, Heart, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CopyLinkButton } from './CopyLinkButton';
import { SendEmailDialog, FormType } from './SendEmailDialog';
import { cn } from '@/lib/utils';

interface FormLinkActionsProps {
  formType: FormType;
  formUrl: string;
  locale: string;
  variant?: 'buttons' | 'dropdown';
  className?: string;
}

export function FormLinkActions({
  formType,
  formUrl,
  locale,
  variant = 'buttons',
  className,
}: FormLinkActionsProps) {
  const t = useTranslations('formLinks');

  // Build full URL
  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${locale}/public-forms/${formType}`
    : formUrl;

  const FormIcon = formType === 'wedding' ? FileText : Heart;
  const colorClass = formType === 'wedding'
    ? 'text-blue-600'
    : 'text-emerald-600';
  const bgClass = formType === 'wedding'
    ? 'bg-blue-50 hover:bg-blue-100'
    : 'bg-emerald-50 hover:bg-emerald-100';

  // Buttons variant - horizontal layout
  if (variant === 'buttons') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <CopyLinkButton url={fullUrl} variant="outline" size="sm" />
        <SendEmailDialog
          formType={formType}
          formUrl={fullUrl}
        />
      </div>
    );
  }

  // Dropdown variant - compact
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'gap-2',
            bgClass,
            colorClass,
            className
          )}
        >
          <FormIcon className="h-4 w-4" />
          {formType === 'wedding'
            ? t('formTypes.wedding')
            : t('formTypes.sickChildren')}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <FormIcon className={cn('h-4 w-4', colorClass)} />
          {formType === 'wedding'
            ? t('formTypes.wedding')
            : t('formTypes.sickChildren')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={async () => {
              await navigator.clipboard.writeText(fullUrl);
            }}
            className="cursor-pointer"
          >
            {t('copyLink')}
          </DropdownMenuItem>
          <SendEmailDialog
            formType={formType}
            formUrl={fullUrl}
            trigger={
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer"
              >
                {t('sendEmail')}
              </DropdownMenuItem>
            }
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
