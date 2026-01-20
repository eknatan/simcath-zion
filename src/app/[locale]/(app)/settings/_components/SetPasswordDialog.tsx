/**
 * SetPasswordDialog Component
 * Dialog לקביעת סיסמה ישירה למשתמש
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק UI של dialog לקביעת סיסמה
 *
 * עיצוב: לפי DESIGN_SYSTEM.md
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { setPasswordSchema, type SetPasswordSchema } from '@/lib/validation/user.schema';
import { useSetPassword } from '@/lib/hooks/useUsers';
import type { Profile } from '@/types/user.types';

interface SetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile | null;
}

export function SetPasswordDialog({ open, onOpenChange, user }: SetPasswordDialogProps) {
  const t = useTranslations();
  const setPasswordMutation = useSetPassword();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SetPasswordSchema>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: '',
    },
  });

  const onSubmit = async (data: SetPasswordSchema) => {
    if (!user) return;

    try {
      await setPasswordMutation.mutateAsync({
        userId: user.id,
        password: data.password,
      });

      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Toast message יטופל ב-hook
      console.error('Error setting password:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setShowPassword(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-blue-600" />
            {t('users.setPassword.title')}
          </DialogTitle>
          <DialogDescription>
            {t('users.setPassword.description', { name: user?.name || '' })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    {t('users.setPassword.newPassword')} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('users.setPassword.placeholder')}
                        className="border-2 focus:border-blue-500 pe-10"
                        disabled={setPasswordMutation.isPending}
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute end-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showPassword ? t('users.setPassword.hidePassword') : t('users.setPassword.showPassword')}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    {t('users.setPassword.helper')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={setPasswordMutation.isPending}
                className="border-2"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={setPasswordMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
              >
                {setPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <KeyRound className="me-2 h-4 w-4" />
                    {t('users.setPassword.submit')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
