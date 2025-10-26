/**
 * ResetPasswordHandler Component
 * טיפול בתהליך איפוס הסיסמה
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק טיפול ב-reset password flow
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { supabase } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { ResetPasswordForm } from './ResetPasswordForm';

import type { Session } from '@supabase/supabase-js';

export function ResetPasswordHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations();

  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const type = searchParams.get('type');

    // וידוא שזה recovery type
    if (type !== 'recovery') {
      router.push('/login');
      return;
    }

    handlePasswordReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  const handlePasswordReset = async () => {
    try {
      const { data: { session: currentSession }, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!currentSession) {
        throw new Error(t('auth.errors.noSession'));
      }

      setSession(currentSession);
    } catch (err: any) {
      console.error('Error handling password reset:', err);
      setError(err.message || t('auth.errors.invalidToken'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    handlePasswordReset();
  };

  if (isLoading) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        title={t('auth.errors.somethingWentWrong')}
        onRetry={handleRetry}
      />
    );
  }

  if (!session) {
    return (
      <ErrorDisplay
        error={t('auth.errors.noSession')}
        title={t('auth.errors.somethingWentWrong')}
      />
    );
  }

  return <ResetPasswordForm session={session} />;
}
