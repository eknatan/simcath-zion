'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormProgressBar, type FormStep } from '@/components/shared/Forms/FormProgressBar';
import { WeddingInfoSection } from './WeddingInfoSection';
import { PersonInfoSection } from './PersonInfoSection';
import { weddingFormSchema, type WeddingFormData } from '@/lib/validations/wedding-form.schema';
import { ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * קומפוננטת WeddingForm - טופס רב-שלבי לבקשת תמיכה בחתונה
 *
 * עקרונות SOLID:
 * - Single Responsibility: מנהלת רק את ה-flow הכללי של הטופס
 * - Open/Closed: ניתן להוסיף סקשנים נוספים בקלות
 * - Dependency Inversion: משתמשת ב-abstractions (schema, sections)
 * - Interface Segregation: כל סקשן מקבל רק את מה שהוא צריך
 *
 * תכונות:
 * - Multi-step form עם progress bar
 * - Validation מלאה עם Zod
 * - תמיכה ב-i18n ו-RTL
 * - Loading states ו-error handling
 * - Responsive design
 */

interface WeddingFormProps {
  /** האם זה טופס פנימי (בתוך המערכת) או ציבורי */
  isInternal?: boolean;
  /** callback אחרי שליחה מוצלחת */
  onSuccess?: (data: WeddingFormData) => void;
}

export function WeddingForm({ isInternal = false, onSuccess }: WeddingFormProps) {
  const t = useTranslations('wedding_form');
  const locale = useLocale();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current locale to determine RTL/LTR
  const isRTL = locale === 'he';

  // Form setup עם react-hook-form + zod
  const form = useForm<WeddingFormData>({
    resolver: zodResolver(weddingFormSchema),
    mode: 'onBlur',
    defaultValues: {
      wedding_info: {
        date_hebrew: '',
        date_gregorian: '',
        city: '',
        guests_count: undefined,
        total_cost: undefined,
      },
      groom_info: {
        first_name: '',
        last_name: '',
        id: '',
        school: '',
        father_name: '',
        father_occupation: '',
        mother_name: '',
        mother_occupation: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        memorial_day: '',
        background: '',
      },
      bride_info: {
        first_name: '',
        last_name: '',
        id: '',
        school: '',
        father_name: '',
        father_occupation: '',
        mother_name: '',
        mother_occupation: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        memorial_day: '',
        background: '',
      },
    },
  });

  // Steps configuration
  const steps: FormStep[] = [
    {
      id: 'wedding_info',
      label: 'section_wedding_info.title',
      completed: false,
    },
    {
      id: 'groom_info',
      label: 'section_groom_info.title',
      completed: false,
    },
    {
      id: 'bride_info',
      label: 'section_bride_info.title',
      completed: false,
    },
  ];

  // Validation for current step
  const validateCurrentStep = async (): Promise<boolean> => {
    let fieldsToValidate: (keyof WeddingFormData)[] = [];

    switch (currentStep) {
      case 0:
        fieldsToValidate = ['wedding_info'];
        break;
      case 1:
        fieldsToValidate = ['groom_info'];
        break;
      case 2:
        fieldsToValidate = ['bride_info'];
        break;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  // Navigation handlers
  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Submit handler
  const onSubmit = async (data: WeddingFormData) => {
    setIsSubmitting(true);

    console.log('🎯 [WEDDING FORM] Submitting form...', { locale });

    try {
      const requestBody = {
        case_type: 'wedding',
        form_data: {
          ...data,
          locale, // Add locale to form data
        },
      };

      console.log('🎯 [WEDDING FORM] Request body:', requestBody);

      const response = await fetch('/api/applicants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('🎯 [WEDDING FORM] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [WEDDING FORM] Error response:', errorText);
        throw new Error('Submission failed');
      }

      const result = await response.json();
      console.log('✅ [WEDDING FORM] Success response:', result);

      // Success toast
      toast.success(t('success.title'), {
        description: t('success.message'),
      });

      // Callback or redirect
      if (onSuccess) {
        onSuccess(data);
      } else if (isInternal) {
        router.push('/dashboard/applicants');
      } else {
        // Show success message or redirect to thank you page
        router.push('/public-forms/wedding/success');
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

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WeddingInfoSection form={form} stepNumber={1} />;
      case 1:
        return <PersonInfoSection form={form} personType="groom" stepNumber={2} />;
      case 2:
        return <PersonInfoSection form={form} personType="bride" stepNumber={3} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          {t('title')}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* Progress Bar */}
      <FormProgressBar currentStep={currentStep} steps={steps} />

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Current Step Content */}
        {renderStep()}

        {/* Navigation Buttons */}
        <Card className="p-6 border-2 shadow-lg">
          <div className="flex justify-between items-center">
            {/* Previous Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0 || isSubmitting}
              className="border-2 border-slate-300 hover:bg-slate-50 font-semibold"
            >
              {isRTL ? (
                <ArrowRight className="h-4 w-4 me-2" />
              ) : (
                <ArrowLeft className="h-4 w-4 me-2" />
              )}
              {t('buttons.previous')}
            </Button>

            {/* Next/Submit Button */}
            {currentStep < steps.length - 1 ? (
              <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all font-semibold"
              >
                {t('buttons.next')}
                {isRTL ? (
                  <ArrowLeft className="h-4 w-4 ms-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 ms-2" />
                )}
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    {t('buttons.submitting')}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 me-2" />
                    {t('buttons.submit')}
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </form>
    </div>
  );
}
