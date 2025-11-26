'use client';

/**
 * CopyLinkButton
 *
 * כפתור העתקת קישור ללוח
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק מעתיק קישור
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CopyLinkButtonProps {
  url: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function CopyLinkButton({
  url,
  variant = 'outline',
  size = 'default',
  className,
  showLabel = true,
}: CopyLinkButtonProps) {
  const t = useTranslations('formLinks');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t('copySuccess'));

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('copyError'));
    }
  };

  const button = (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(
        'transition-all duration-200',
        copied && 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100',
        className
      )}
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {showLabel && (
        <span className="ms-2">
          {copied ? t('copied') : t('copyLink')}
        </span>
      )}
    </Button>
  );

  // Show tooltip only when label is hidden (icon-only mode)
  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? t('copied') : t('copyLink')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
