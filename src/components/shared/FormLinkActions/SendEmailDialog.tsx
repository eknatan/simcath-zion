'use client';

/**
 * SendEmailDialog
 *
 * דיאלוג לשליחת קישור לטופס במייל
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק UI של שליחת מייל
 * - Open/Closed: ניתן להרחבה עם templates שונים
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Send, Loader2, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Form type for customization
export type FormType = 'wedding' | 'sick-children';

interface SendEmailDialogProps {
  formType: FormType;
  formUrl: string;
  trigger?: React.ReactNode;
  className?: string;
}

// Validation schema
const emailFormSchema = z.object({
  recipientEmail: z.string().email(),
  recipientName: z.string().min(2).optional(),
  customMessage: z.string().optional(),
  emailLanguage: z.enum(['he', 'en']),
});

type EmailFormData = z.infer<typeof emailFormSchema>;

export function SendEmailDialog({
  formType,
  formUrl,
  trigger,
  className,
}: SendEmailDialogProps) {
  const t = useTranslations('formLinks');
  const tValidation = useTranslations('validation');
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      emailLanguage: 'he',
    },
  });

  const selectedLanguage = watch('emailLanguage');

  const onSubmit = async (data: EmailFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/forms/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: data.recipientEmail,
          recipientName: data.recipientName,
          customMessage: data.customMessage,
          formType,
          formUrl,
          language: data.emailLanguage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      toast.success(t('emailSentSuccess'));
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('emailSentError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formTypeLabel = formType === 'wedding'
    ? t('formTypes.wedding')
    : t('formTypes.sickChildren');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className={className}>
            <Mail className="h-4 w-4 me-2" />
            {t('sendEmail')}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className={cn(
              'p-2 rounded-lg',
              formType === 'wedding'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-emerald-100 text-emerald-600'
            )}>
              <Mail className="h-5 w-5" />
            </div>
            {t('sendFormLink')}
          </DialogTitle>
          <DialogDescription className="text-base">
            {t('sendFormDescription', { formType: formTypeLabel })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
          {/* Recipient Email */}
          <div className="space-y-2">
            <Label htmlFor="recipientEmail" className="text-sm font-medium">
              {t('recipientEmail')}
              <span className="text-destructive ms-1">*</span>
            </Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="example@email.com"
              {...register('recipientEmail')}
              className={cn(
                'h-11',
                errors.recipientEmail && 'border-destructive'
              )}
              dir="ltr"
            />
            {errors.recipientEmail && (
              <p className="text-sm text-destructive">
                {tValidation('invalidEmail')}
              </p>
            )}
          </div>

          {/* Recipient Name (optional) */}
          <div className="space-y-2">
            <Label htmlFor="recipientName" className="text-sm font-medium">
              {t('recipientName')}
              <span className="text-muted-foreground text-xs ms-2">
                ({t('optional')})
              </span>
            </Label>
            <Input
              id="recipientName"
              type="text"
              placeholder={t('recipientNamePlaceholder')}
              {...register('recipientName')}
              className="h-11"
            />
          </div>

          {/* Custom Message (optional) */}
          <div className="space-y-2">
            <Label htmlFor="customMessage" className="text-sm font-medium">
              {t('customMessage')}
              <span className="text-muted-foreground text-xs ms-2">
                ({t('optional')})
              </span>
            </Label>
            <Textarea
              id="customMessage"
              placeholder={t('customMessagePlaceholder')}
              {...register('customMessage')}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Email Language Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('emailLanguage')}
            </Label>
            <Select
              value={selectedLanguage}
              onValueChange={(value: 'he' | 'en') => setValue('emailLanguage', value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="he">{t('hebrew')}</SelectItem>
                <SelectItem value="en">{t('english')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Form URL Preview */}
          <div className="bg-muted/50 rounded-lg p-3 border">
            <p className="text-xs text-muted-foreground mb-1">
              {t('linkToSend')}
            </p>
            <p className="text-sm font-mono break-all text-muted-foreground" dir="ltr">
              {formUrl}
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                formType === 'wedding'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t('sending')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 me-2" />
                  {t('send')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
