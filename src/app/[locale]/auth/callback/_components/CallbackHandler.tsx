/**
 * CallbackHandler Component
 * טיפול בכל סוגי ה-callbacks מ-Supabase Auth
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק routing של callback types
 * - Open/Closed: ניתן להרחבה עם callback types נוספים
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { supabase } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { SetPasswordForm } from './SetPasswordForm';

import type { Session, EmailOtpType } from '@supabase/supabase-js';

export function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations();

  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    // קריאת type מ-query params או hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = searchParams.get('type') || hashParams.get('type');

    // טיפול ב-invitation
    if (type === 'invite') {
      handleInvitation();
    }
    // טיפול ב-recovery (reset password) - מפנה לדף המתאים עם כל הפרמטרים
    else if (type === 'recovery') {
      // מעבירים את ה-hash כמו שהוא לדף reset-password
      const currentHash = window.location.hash;
      const currentSearch = window.location.search;
      router.push(`/auth/reset-password${currentSearch}${currentHash}`);
    }
    // אם אין type או type לא מזוהה - מפנה ל-login
    else {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInvitation = async () => {
    try {
      // קודם בודקים אם יש session קיים
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        setSession(existingSession);
        setIsLoading(false);
        return;
      }

      // מנסים לקרוא tokens מה-URL (query params או hash)
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
          if (currentSession) {
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
      console.error('Error handling invitation:', err);
      setError(err.message || t('auth.errors.invalidToken'));
      setIsLoading(false);
    }
  };

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

  return <SetPasswordForm session={session} />;
}
