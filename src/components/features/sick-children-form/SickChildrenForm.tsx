'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { sickChildrenFormSchema, type SickChildrenFormData } from '@/lib/validations/sick-children-form.schema';
import { Send, Loader2, User, Phone, Building2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * קומפוננטה SickChildrenForm - טופס חד-עמודי לבקשת תמיכה לילדים חולים
 *
 * עקרונות SOLID:
 * - Single Responsibility: מנהלת רק את הטופס לילדים חולים
 * - Open/Closed: ניתן להרחבה בקלות
 * - Dependency Inversion: משתמשת ב-schema validation
 *
 * תכונות:
 * - Single-page form (כל השדות בדף אחד)
 * - Validation מלאה עם Zod
 * - תמיכה ב-i18n ו-RTL
 * - Loading states ו-error handling
 * - Responsive design
 */

interface SickChildrenFormProps {
  /** האם זה טופס פנימי (בתוך המערכת) או ציבורי */
  isInternal?: boolean;
  /** callback אחרי שליחה מוצלחת */
  onSuccess?: (data: SickChildrenFormData) => void;
}

export function SickChildrenForm({ isInternal = false, onSuccess }: SickChildrenFormProps) {
  const t = useTranslations('sick_children_form');
  const locale = useLocale();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form setup עם react-hook-form + zod
  const form = useForm<SickChildrenFormData>({
    resolver: zodResolver(sickChildrenFormSchema),
    mode: 'onBlur',
    defaultValues: {
      parent1_id: '',
      parent2_id: '',
      family_name: '',
      parent1_name: '',
      parent2_name: '',
      child_name: '',
      address: '',
      city: '',
      phone1: '',
      phone2: '',
      phone3: '',
      email: '',
      bank_number: '',
      branch: '',
      account_number: '',
      account_holder_name: '',
    },
  });

  // Submit handler
  const onSubmit = async (data: SickChildrenFormData) => {
    setIsSubmitting(true);

    try {
      const requestBody = {
        case_type: 'cleaning',
        form_data: {
          ...data,
          locale, // Add locale to form data
        },
      };

      const response = await fetch('/api/applicants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      // Success toast
      toast.success(t('success.title'), {
        description: t('success.message'),
      });

      // Callback or redirect
      if (onSuccess) {
        onSuccess(data);
      } else if (isInternal) {
        router.push(`/${locale}/applicants`);
      } else {
        // Redirect to success page
        router.push(`/${locale}/public-forms/sick-children/success`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(t('errors.submission_failed'), {
        description: t('errors.network_error'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
          {t('title')}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* פרטי משפחה */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>{t('sections.family_info.title')}</CardTitle>
                  <CardDescription>{t('sections.family_info.description')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="parent1_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('fields.parent1_id.label')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parent2_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('fields.parent2_id.label')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="family_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.family_name.label')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="parent1_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('fields.parent1_name.label')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parent2_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('fields.parent2_name.label')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="child_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.child_name.label')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.address.label')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.city.label')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* פרטי קשר */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>{t('sections.contact.title')}</CardTitle>
                  <CardDescription>{t('sections.contact.description')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={form.control}
                name="phone1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.phone1.label')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('fields.phone2.label')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('fields.phone3.label')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.email.label')}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* פרטי בנק */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>{t('sections.bank_details.title')}</CardTitle>
                  <CardDescription>{t('sections.bank_details.description')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="bank_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('fields.bank_number.label')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('fields.branch.label')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('fields.account_number.label')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="account_holder_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.account_holder_name.label')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card className="p-6 border-2 shadow-lg">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-md hover:shadow-lg transition-all font-semibold text-lg py-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 me-2 animate-spin" />
                  {t('buttons.submitting')}
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 me-2" />
                  {t('buttons.submit')}
                </>
              )}
            </Button>
          </Card>
        </form>
      </Form>
    </div>
  );
}
