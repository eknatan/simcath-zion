/**
 * ResetPasswordHandler Component
 * טיפול בתהליך איפוס הסיסמה
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק טיפול ב-reset password flow
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';

import { supabase } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { ResetPasswordForm } from './ResetPasswordForm';

import type { Session, EmailOtpType } from '@supabase/supabase-js';

export function ResetPasswordHandler() {
  const t = useTranslations();

  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const handleRecovery = async () => {
      try {
        // קודם בודקים אם יש session קיים
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession) {
          setSession(existingSession);
          setIsLoading(false);
          return;
        }

        // מנסים לקרוא token_hash מה-URL (query params או hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);

        const tokenHash = hashParams.get('token_hash') || queryParams.get('token_hash');
        const type = hashParams.get('type') || queryParams.get('type');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        // אם יש access_token ב-hash, מגדירים את ה-session ישירות
        if (accessToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) throw sessionError;
          if (data.session) {
            setSession(data.session);
            setIsLoading(false);
            return;
          }
        }

        // אם יש token_hash, מאמתים אותו
        if (tokenHash && type) {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType,
          });

          if (verifyError) throw verifyError;
          if (data.session) {
            setSession(data.session);
            setIsLoading(false);
            return;
          }
        }

        // מאזינים ל-auth state change כ-fallback
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && currentSession) {
              setSession(currentSession);
              setIsLoading(false);
              subscription.unsubscribe();
            }
          }
        );

        // Timeout
        setTimeout(() => {
          if (!session) {
            setError(t('auth.errors.invalidToken'));
            setIsLoading(false);
            subscription.unsubscribe();
          }
        }, 5000);

      } catch (err: any) {
        console.error('Error handling password reset:', err);
        setError(err.message || t('auth.errors.invalidToken'));
        setIsLoading(false);
      }
    };

    handleRecovery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    processedRef.current = false;
    window.location.reload();
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
