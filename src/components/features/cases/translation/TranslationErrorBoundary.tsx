'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ActionButton } from '@/components/shared/ActionButton';
import { RefreshCw, Edit3 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TranslationErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface TranslationErrorBoundaryProps {
  children: React.ReactNode;
  fallback: (error: Error) => React.ReactNode;
}

export class TranslationErrorBoundary extends React.Component<
  TranslationErrorBoundaryProps,
  TranslationErrorBoundaryState
> {
  constructor(props: TranslationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): TranslationErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TranslationErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error);
    }

    return this.props.children;
  }
}

interface TranslationErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  onEditExisting?: () => void;
  showEditButton?: boolean;
}

export function TranslationErrorDisplay({
  error,
  onRetry,
  onEditExisting,
  showEditButton = false
}: TranslationErrorDisplayProps) {
  const t = useTranslations('case.english');

  return (
    <Card className="border-rose-200 bg-rose-50">
      <CardContent className="pt-6">
        <div className="text-center">
          <p className="text-rose-800">{t('error.translationFailed')}</p>
          <p className="text-rose-600 text-sm mt-1">{error}</p>
          <div className="flex gap-2 mt-4 justify-center">
            {onRetry && (
              <ActionButton variant="primary" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 me-2" />
                {t('error.retry')}
              </ActionButton>
            )}
            {showEditButton && onEditExisting && (
              <ActionButton variant="view" onClick={onEditExisting}>
                <Edit3 className="h-4 w-4 me-2" />
                Edit Existing Translation
              </ActionButton>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}