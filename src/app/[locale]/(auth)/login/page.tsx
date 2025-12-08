'use client';

import { useState, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, KeyRound, ArrowRight, Link } from 'lucide-react';
import { RetroGrid } from '@/components/ui/retro-grid';
import Image from 'next/image';

type LoginMode = 'password' | 'otp' | 'magiclink';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { signIn, sendOtpCode, verifyOtpCode, signInWithMagicLink } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

    // OTP mode - send code
    if (loginMode === 'otp' && !otpSent) {
      try {
        const { error: otpError } = await sendOtpCode(email);

        if (otpError) {
          if (otpError.message?.includes('user') || otpError.message?.includes('User')) {
            setError(t('errors.userNotFound'));
          } else {
            setError(otpError.message || t('errors.somethingWentWrong'));
          }
          setIsLoading(false);
          return;
        }

        setOtpSent(true);
        setIsLoading(false);
        // Focus first OTP input
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      } catch (err) {
        console.error('OTP send error:', err);
        setError(t('errors.somethingWentWrong'));
        setIsLoading(false);
      }
      return;
    }

    // Magic Link mode
    if (loginMode === 'magiclink') {
      try {
        const { error: magicLinkError } = await signInWithMagicLink(email);

        if (magicLinkError) {
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
    if (loginMode === 'password') {
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

        router.push('/dashboard');
      } catch (err) {
        console.error('Login error:', err);
        setError(t('errors.somethingWentWrong'));
        setIsLoading(false);
      }
    }
  };

  const handleOtpSubmit = async () => {
    setError(null);
    setIsLoading(true);

    const code = otpCode.join('');
    if (code.length !== 6) {
      setError(t('login.otp.invalidCode'));
      setIsLoading(false);
      return;
    }

    try {
      const { error: verifyError } = await verifyOtpCode(email, code);

      if (verifyError) {
        if (verifyError.message?.includes('expired') || verifyError.message?.includes('invalid')) {
          setError(t('login.otp.expiredCode'));
        } else {
          setError(verifyError.message || t('errors.somethingWentWrong'));
        }
        setIsLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('OTP verify error:', err);
      setError(t('errors.somethingWentWrong'));
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5 && newOtp.every(digit => digit !== '')) {
      setTimeout(() => handleOtpSubmit(), 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = [...otpCode];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtpCode(newOtp);

      // Focus the next empty input or the last one
      const nextEmpty = newOtp.findIndex(d => d === '');
      otpInputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();

      // Auto-submit if complete
      if (pastedData.length === 6) {
        setTimeout(() => handleOtpSubmit(), 100);
      }
    }
  };

  const setMode = (mode: LoginMode) => {
    setLoginMode(mode);
    setError(null);
    setOtpSent(false);
    setMagicLinkSent(false);
    setOtpCode(['', '', '', '', '', '']);
  };

  const handleBackToEmail = () => {
    setOtpSent(false);
    setMagicLinkSent(false);
    setOtpCode(['', '', '', '', '', '']);
    setError(null);
  };

  const handleResendCode = async () => {
    setError(null);
    setIsLoading(true);
    setOtpCode(['', '', '', '', '', '']);

    try {
      const { error: otpError } = await sendOtpCode(email);

      if (otpError) {
        setError(otpError.message || t('errors.somethingWentWrong'));
      }
    } catch (err) {
      console.error('OTP resend error:', err);
      setError(t('errors.somethingWentWrong'));
    } finally {
      setIsLoading(false);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
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
              {otpSent ? t('login.otp.title') : t('login.title')}
            </CardTitle>
            <CardDescription className="text-center">
              {otpSent
                ? t('login.otp.description', { email })
                : magicLinkSent
                  ? t('login.magicLinkSentDescription')
                  : loginMode === 'otp'
                    ? t('login.otp.enterEmail')
                    : loginMode === 'magiclink'
                      ? t('login.magicLinkDescription')
                      : t('login.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Magic Link Sent */}
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
                  onClick={handleBackToEmail}
                >
                  {t('login.tryAnotherEmail')}
                </Button>
              </div>
            ) : otpSent ? (
              <div className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="animate-in fade-in-50">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* OTP Input Boxes */}
                <div className="flex justify-center gap-2 direction-ltr" dir="ltr">
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      disabled={isLoading}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:opacity-50 bg-background"
                    />
                  ))}
                </div>

                {/* Verify Button */}
                <Button
                  type="button"
                  className="w-full h-11 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                  disabled={isLoading || otpCode.some(d => d === '')}
                  onClick={handleOtpSubmit}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="me-2 h-5 w-5 animate-spin" />
                      {t('login.otp.verifying')}
                    </>
                  ) : (
                    <>
                      <ArrowRight className="me-2 h-5 w-5" />
                      {t('login.otp.verify')}
                    </>
                  )}
                </Button>

                {/* Resend & Back buttons */}
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={handleResendCode}
                    disabled={isLoading}
                  >
                    {t('login.otp.resend')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleBackToEmail}
                    disabled={isLoading}
                  >
                    {t('login.otp.changeEmail')}
                  </Button>
                </div>
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
                      {loginMode === 'otp'
                        ? t('login.otp.sending')
                        : loginMode === 'magiclink'
                          ? t('login.sendingLink')
                          : t('login.loggingIn')}
                    </>
                  ) : (
                    <>
                      {loginMode === 'otp' ? (
                        <>
                          <Mail className="me-2 h-5 w-5" />
                          {t('login.otp.sendCode')}
                        </>
                      ) : loginMode === 'magiclink' ? (
                        <>
                          <Link className="me-2 h-5 w-5" />
                          {t('login.sendMagicLink')}
                        </>
                      ) : (
                        t('login.submit')
                      )}
                    </>
                  )}
                </Button>

                {/* Alternative Login Methods */}
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

                <div className="flex flex-col gap-2">
                  {loginMode !== 'password' && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10"
                      onClick={() => setMode('password')}
                    >
                      <KeyRound className="me-2 h-4 w-4" />
                      {t('login.usePassword')}
                    </Button>
                  )}
                  {loginMode !== 'otp' && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10"
                      onClick={() => setMode('otp')}
                    >
                      <Mail className="me-2 h-4 w-4" />
                      {t('login.useOtp')}
                    </Button>
                  )}
                  {loginMode !== 'magiclink' && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10"
                      onClick={() => setMode('magiclink')}
                    >
                      <Link className="me-2 h-4 w-4" />
                      {t('login.useMagicLink')}
                    </Button>
                  )}
                </div>
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
