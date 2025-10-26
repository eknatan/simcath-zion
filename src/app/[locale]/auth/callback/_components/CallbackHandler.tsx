/**
 * CallbackHandler Component
 * טיפול בכל סוגי ה-callbacks מ-Supabase Auth
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק routing של callback types
 * - Open/Closed: ניתן להרחבה עם callback types נוספים
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { supabase } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { SetPasswordForm } from './SetPasswordForm';

import type { Session } from '@supabase/supabase-js';

export function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations();

  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const type = searchParams.get('type');

    // טיפול ב-invitation
    if (type === 'invite') {
      handleInvitation();
    }
    // טיפול ב-recovery (reset password) - מפנה לדף המתאים
    else if (type === 'recovery') {
      router.push('/auth/reset-password');
    }
    // אם אין type או type לא מזוהה - מפנה ל-login
    else {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  const handleInvitation = async () => {
    try {
      const { data: { session: currentSession }, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!currentSession) {
        throw new Error(t('auth.errors.noSession'));
      }

      setSession(currentSession);
    } catch (err: any) {
      console.error('Error handling invitation:', err);
      setError(err.message || t('auth.errors.invalidToken'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    handleInvitation();
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

  return <SetPasswordForm session={session} />;
}
