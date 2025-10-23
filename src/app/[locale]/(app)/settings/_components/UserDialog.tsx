/**
 * UserDialog Component
 * Dialog להזמנה/עריכת משתמש
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק UI של dialog למשתמש
 * - Open/Closed: ניתן להרחיב עם שדות נוספים
 *
 * עיצוב: לפי DESIGN_SYSTEM.md
 */

'use client';

import { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, Save } from 'lucide-react';
import { createUserSchema, updateUserSchema } from '@/lib/validation/user.schema';
import { useInviteUser, useUpdateUser } from '@/lib/hooks/useUsers';
import type { Profile, CreateUserInput, UpdateUserInput } from '@/types/user.types';
import type { z } from 'zod';

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  user?: Profile;
}

export function UserDialog({ open, onOpenChange, mode, user }: UserDialogProps) {
  const t = useTranslations();
  const inviteMutation = useInviteUser();
  const updateMutation = useUpdateUser();

  const isLoading = inviteMutation.isPending || updateMutation.isPending;

  // בחירת schema לפי mode
  const schema = mode === 'create' ? createUserSchema : updateUserSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === 'edit' && user
        ? {
            name: user.name,
            role: user.role,
            status: user.status,
            phone: user.phone || '',
            notes: user.notes || '',
          }
        : {
            email: '',
            name: '',
            role: 'secretary' as const,
            phone: '',
            notes: '',
          },
  });

  // איפוס form כאשר user משתנה
  useEffect(() => {
    if (mode === 'edit' && user) {
      form.reset({
        name: user.name,
        role: user.role,
        status: user.status,
        phone: user.phone || '',
        notes: user.notes || '',
      });
    } else if (mode === 'create') {
      form.reset({
        email: '',
        name: '',
        role: 'secretary' as const,
        phone: '',
        notes: '',
      });
    }
  }, [user, mode, form]);

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      if (mode === 'create') {
        await inviteMutation.mutateAsync(data as CreateUserInput);
      } else if (mode === 'edit' && user) {
        await updateMutation.mutateAsync({
          id: user.id,
          data: data as UpdateUserInput,
        });
      }

      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Toast message יטופל ב-hook
      console.error('Error saving user:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <UserPlus className="h-6 w-6 text-blue-600" />
                {t('users.dialog.invite.title')}
              </>
            ) : (
              <>
                <Save className="h-6 w-6 text-blue-600" />
                {t('users.dialog.edit.title')}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t('users.dialog.invite.description')
              : t('users.dialog.edit.description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email - רק ב-create mode */}
            {mode === 'create' && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      {t('users.fields.email')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t('users.placeholders.email')}
                        className="border-2 focus:border-blue-500"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {t('users.helpers.email')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    {t('users.fields.name')} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('users.placeholders.name')}
                      className="border-2 focus:border-blue-500"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    {t('users.fields.role')} <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="border-2 focus:border-blue-500">
                        <SelectValue placeholder={t('users.filterByRole')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="secretary">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{t('users.roles.secretary')}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {t('users.roleDescriptions.secretary')}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="manager">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gradient-to-r from-blue-500 to-blue-600">
                            {t('users.roles.manager')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {t('users.roleDescriptions.manager')}
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    {t('users.helpers.role')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status - רק ב-edit mode */}
            {mode === 'edit' && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">{t('users.fields.status')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="border-2 focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">
                          <Badge className="bg-gradient-to-r from-green-500 to-green-600">
                            {t('users.statuses.active')}
                          </Badge>
                        </SelectItem>
                        <SelectItem value="suspended">
                          <Badge variant="destructive">{t('users.statuses.suspended')}</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">{t('users.fields.phone')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      type="tel"
                      placeholder={t('users.placeholders.phone')}
                      className="border-2 focus:border-blue-500"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {t('users.helpers.phone')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">{t('users.fields.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder={t('users.placeholders.notes')}
                      className="border-2 focus:border-blue-500 min-h-[100px]"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {t('users.helpers.notes')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="border-2"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : mode === 'create' ? (
                  <>
                    <UserPlus className="me-2 h-4 w-4" />
                    {t('users.inviteUser')}
                  </>
                ) : (
                  <>
                    <Save className="me-2 h-4 w-4" />
                    {t('common.save')}
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
