/**
 * LoadingSpinner Component
 * spinner טעינה עם טקסט אופציונלי
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק הצגת loading state
 *
 * עיצוב: לפי DESIGN_SYSTEM.md
 */

'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({
  message,
  fullScreen = true,
  size = 'lg'
}: LoadingSpinnerProps) {
  const t = useTranslations('common');

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
          <Loader2 className={`${sizeClasses[size]} text-white animate-spin`} />
        </div>
      </div>
      <p className={`${textSizeClasses[size]} font-semibold text-blue-900`}>
        {message || t('loading')}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        {content}
      </div>
    );
  }

  return content;
}
