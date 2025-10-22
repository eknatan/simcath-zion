'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

/**
 * קומפוננטת FormProgressBar - מציגה התקדמות בטופס רב-שלבי
 *
 * עקרונות SOLID:
 * - Single Responsibility: אחראית רק על תצוגת progress
 * - Open/Closed: מקבלת steps כ-prop, פתוחה להרחבה
 * - Interface Segregation: ממשק פשוט וממוקד
 *
 * תמיכה מלאה ב-RTL
 */

export interface FormStep {
  /** מזהה השלב */
  id: string;
  /** תווית השלב (translation key) */
  label: string;
  /** האם השלב הושלם */
  completed: boolean;
}

interface FormProgressBarProps {
  /** השלב הנוכחי (0-based index) */
  currentStep: number;
  /** רשימת כל השלבים */
  steps: FormStep[];
  /** className נוסף */
  className?: string;
}

export function FormProgressBar({ currentStep, steps, className }: FormProgressBarProps) {
  const t = useTranslations('wedding_form');

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar */}
      <div className="relative">
        {/* Background line */}
        <div className="absolute top-5 start-0 end-0 h-1 bg-gray-200 -z-10" />

        {/* Progress line */}
        <div
          className="absolute top-5 start-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 -z-10 transition-all duration-500"
          style={{
            width: `${(currentStep / (steps.length - 1)) * 100}%`,
          }}
        />

        {/* Steps */}
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep || step.completed;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center gap-2"
              >
                {/* Step circle */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 shadow-md',
                    isCompleted &&
                      'bg-gradient-to-br from-blue-500 to-blue-600 text-white scale-110',
                    isCurrent &&
                      'bg-gradient-to-br from-blue-600 to-blue-700 text-white scale-125 shadow-lg ring-4 ring-blue-200',
                    isPending && 'bg-gray-200 text-gray-500'
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Step label */}
                <p
                  className={cn(
                    'text-sm font-medium text-center max-w-[100px] transition-colors duration-300',
                    isCurrent && 'text-blue-900 font-semibold',
                    isCompleted && !isCurrent && 'text-blue-600',
                    isPending && 'text-gray-500'
                  )}
                >
                  {t(step.label)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optional: Current step indicator */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          {t('progress_indicator', {
            current: currentStep + 1,
            total: steps.length,
          })}
        </p>
      </div>
    </div>
  );
}
