/**
 * ResetPasswordForm Component
 * טופס לאיפוס סיסמה
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק טופס איפוס סיסמה
 * - Dependency Inversion: תלוי ב-Supabase client interface
 *
 * עיצוב: לפי DESIGN_SYSTEM.md
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Check, Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase/client';
import { resetPasswordSchema } from '@/lib/validation/password.schema';
import type { ResetPasswordInput } from '@/lib/validation/password.schema';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Session } from '@supabase/supabase-js';

interface ResetPasswordFormProps {
  session: Session;
}

export function ResetPasswordForm({ session }: ResetPasswordFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema(t)),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ResetPasswordInput) => {
    setIsLoading(true);

    try {
      // עדכון הסיסמה
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (updateError) throw updateError;

      toast.success(t('auth.resetPassword.success'));

      // המתנה קצרה ואז redirect ל-login
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Error resetting password:', err);

      const errorMessage =
        err.message === 'Password should be at least 6 characters'
          ? t('auth.errors.weakPassword')
          : t('auth.errors.serverError');

      toast.error(t('auth.errors.somethingWentWrong'), {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const userEmail = session.user.email || '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="text-center space-y-2 pb-6">
          {/* Logo */}
          <div className="mx-auto h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
            <KeyRound className="h-8 w-8 text-white" />
          </div>

          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            {t('auth.resetPassword.title')}
          </CardTitle>

          <CardDescription className="text-base">
            {t('auth.resetPassword.description')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email Display */}
          <div className="bg-blue-50 border-2 border-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-semibold">
              {t('auth.resetPassword.emailLabel')}
            </p>
            <p className="text-xs text-blue-600 mt-1">{userEmail}</p>
          </div>

          {/* Password Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* New Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      {t('auth.newPassword')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder={t('auth.newPasswordPlaceholder')}
                        className="border-2 focus:border-blue-500"
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {t('auth.passwordRequirements')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      {t('auth.confirmPassword')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder={t('auth.confirmPasswordPlaceholder')}
                        className="border-2 focus:border-blue-500"
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Check className="me-2 h-4 w-4" />
                    {t('auth.resetPassword.submit')}
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Back to Login Link */}
          <div className="text-center pt-4 border-t">
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline"
            >
              {t('auth.backToLogin')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
