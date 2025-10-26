/**
 * ErrorDisplay Component
 * הצגת שגיאות בצורה ויזואלית ברורה
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק הצגת שגיאות
 * - Open/Closed: ניתן להרחבה עם סוגי שגיאות נוספים
 *
 * עיצוב: לפי DESIGN_SYSTEM.md
 */

'use client';

import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface ErrorDisplayProps {
  error: string;
  title?: string;
  onRetry?: () => void;
  variant?: 'card' | 'alert';
}

export function ErrorDisplay({
  error,
  title,
  onRetry,
  variant = 'card'
}: ErrorDisplayProps) {
  const t = useTranslations('auth.errors');

  if (variant === 'alert') {
    return (
      <Alert variant="destructive" className="border-2">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title || t('somethingWentWrong')}</AlertTitle>
        <AlertDescription className="mt-2">{error}</AlertDescription>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-4 border-2"
          >
            {t('retry')}
          </Button>
        )}
      </Alert>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-red-100">
        <CardHeader className="text-center space-y-2 pb-6">
          {/* Error Icon */}
          <div className="mx-auto h-16 w-16 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>

          <CardTitle className="text-3xl font-bold text-red-900">
            {title || t('somethingWentWrong')}
          </CardTitle>

          <CardDescription className="text-base text-red-700">
            {error}
          </CardDescription>
        </CardHeader>

        {onRetry && (
          <CardContent className="text-center">
            <Button
              onClick={onRetry}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transition-all"
            >
              {t('retry')}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
