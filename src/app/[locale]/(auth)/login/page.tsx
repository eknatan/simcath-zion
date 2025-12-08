'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, KeyRound } from 'lucide-react';
import { RetroGrid } from '@/components/ui/retro-grid';
import Image from 'next/image';

type LoginMode = 'password' | 'magiclink';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { signIn, signInWithMagicLink } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic validation
    if (!email) {
      setError(t('validation.required'));
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError(t('validation.invalidEmail'));
      setIsLoading(false);
      return;
    }

    // Magic Link mode
    if (loginMode === 'magiclink') {
      try {
        const { error: magicLinkError } = await signInWithMagicLink(email);

        if (magicLinkError) {
          // Handle "user not found" error gracefully
          if (magicLinkError.message?.includes('user') || magicLinkError.message?.includes('User')) {
            setError(t('errors.userNotFound'));
          } else {
            setError(magicLinkError.message || t('errors.somethingWentWrong'));
          }
          setIsLoading(false);
          return;
        }

        setMagicLinkSent(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Magic link error:', err);
        setError(t('errors.somethingWentWrong'));
        setIsLoading(false);
      }
      return;
    }

    // Password mode
    if (!password) {
      setError(t('validation.required'));
      setIsLoading(false);
      return;
    }

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message || t('errors.invalidCredentials'));
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard on success (locale is automatically added)
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(t('errors.somethingWentWrong'));
      setIsLoading(false);
    }
  };

  const toggleLoginMode = () => {
    setLoginMode(prev => prev === 'password' ? 'magiclink' : 'password');
    setError(null);
    setMagicLinkSent(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Retro Grid Background */}
      <RetroGrid className="opacity-20" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Title Section */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-20 items-center justify-center relative w-40">
              <Image
                src="/logo.png"
                alt={t('login.systemName')}
                width={250}
                height={130}
                className="h-20 w-auto object-contain"
                style={{
                  filter: 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(200deg) brightness(97%) contrast(91%)'
                }}
                priority
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('login.systemName')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('login.systemDescription')}
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-2 shadow-2xl backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">
              {t('login.title')}
            </CardTitle>
            <CardDescription className="text-center">
              {loginMode === 'magiclink'
                ? t('login.magicLinkDescription')
                : t('login.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Magic Link Success Message */}
            {magicLinkSent ? (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <Mail className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <div className="font-semibold mb-1">{t('login.magicLinkSent')}</div>
                    <div className="text-sm">{t('login.magicLinkSentDescription')}</div>
                  </AlertDescription>
                </Alert>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMagicLinkSent(false);
                    setEmail('');
                  }}
                >
                  {t('login.tryAnotherEmail')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="animate-in fade-in-50">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">{t('login.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('login.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="email"
                    autoFocus
                    className="h-11"
                  />
                </div>

                {loginMode === 'password' && (
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('login.password')}</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder={t('login.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      autoComplete="current-password"
                      className="h-11"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="me-2 h-5 w-5 animate-spin" />
                      {loginMode === 'magiclink' ? t('login.sendingLink') : t('login.loggingIn')}
                    </>
                  ) : (
                    <>
                      {loginMode === 'magiclink' ? (
                        <>
                          <Mail className="me-2 h-5 w-5" />
                          {t('login.sendMagicLink')}
                        </>
                      ) : (
                        t('login.submit')
                      )}
                    </>
                  )}
                </Button>

                {/* Toggle Login Mode */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      {t('login.or')}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={toggleLoginMode}
                >
                  {loginMode === 'magiclink' ? (
                    <>
                      <KeyRound className="me-2 h-4 w-4" />
                      {t('login.usePassword')}
                    </>
                  ) : (
                    <>
                      <Mail className="me-2 h-4 w-4" />
                      {t('login.useMagicLink')}
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>{t('login.footer')}</p>
        </div>
      </div>
    </div>
  );
}
