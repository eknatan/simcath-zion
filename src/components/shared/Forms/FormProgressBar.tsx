'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { motion, Variants } from 'framer-motion';

/**
 * קומפוננטת FormProgressBar - מציגה התקדמות בטופס רב-שלבי
 *
 * עקרונות SOLID:
 * - Single Responsibility: אחראית רק על תצוגת progress
 * - Open/Closed: מקבלת steps כ-prop, פתוחה להרחבה
 * - Interface Segregation: ממשק פשוט וממוקד
 *
 * תמיכה מלאה ב-RTL
 * אנימציות מודרניות עם Framer Motion
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

  // Variants for step circles
  const stepVariants: Variants = {
    inactive: {
      scale: 1,
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      color: '#9ca3af',
    },
    active: {
      scale: 1.1,
      backgroundColor: '#2563eb',
      borderColor: '#2563eb',
      color: '#ffffff',
    },
    complete: {
      scale: 1,
      backgroundColor: '#2563eb',
      borderColor: '#2563eb',
      color: '#ffffff',
    },
  };

  // Variants for connector lines
  const lineVariants: Variants = {
    incomplete: { scaleX: 0, backgroundColor: '#e5e7eb' },
    complete: { scaleX: 1, backgroundColor: '#2563eb' },
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar */}
      <div className="relative py-4">
        {/* Circles + connectors row (line centered to circles) */}
        <div className="flex items-center justify-between relative">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep || step.completed;
            const isCurrent = index === currentStep;
            const status = isCurrent ? 'active' : isCompleted ? 'complete' : 'inactive';
            const isNotLastStep = index < steps.length - 1;

            return (
              <React.Fragment key={step.id}>
                <div className="relative z-10">
                  {/* Step circle - animated */}
                  <div className="relative">
                    <motion.div
                      variants={stepVariants}
                      animate={status}
                      initial={false}
                      transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 shadow-md"
                    >
                      {isCompleted && !isCurrent ? (
                        <CheckIcon className="h-5 w-5" />
                      ) : isCurrent ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="h-2.5 w-2.5 rounded-full bg-white"
                        />
                      ) : (
                        <span className="text-sm">{index + 1}</span>
                      )}
                    </motion.div>

                    {/* Pulse ring for current step */}
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-blue-400"
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.3, opacity: 0 }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeOut',
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Connector line - fills blue for completed prior steps */}
                {isNotLastStep && (
                  <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded bg-gray-200">
                    <motion.div
                      className="absolute left-0 top-0 h-full w-full origin-left"
                      variants={lineVariants}
                      initial={false}
                      animate={isCompleted ? 'complete' : 'incomplete'}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Labels row */}
        <div className="mt-3 flex items-start justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep || step.completed;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;
            return (
              <motion.p
                key={step.id}
                animate={{
                  scale: isCurrent ? 1.05 : 1,
                  fontWeight: isCurrent ? 700 : 500,
                }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'text-xs text-center max-w-[100px] transition-colors duration-300',
                  isCurrent && 'text-blue-700',
                  isCompleted && !isCurrent && 'text-blue-600',
                  isPending && 'text-gray-400'
                )}
              >
                {t(step.label)}
              </motion.p>
            );
          })}
        </div>
      </div>

      {/* Current step indicator */}
      <div className="mt-4 text-center">
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground font-medium"
        >
          {t('progress_indicator', {
            current: currentStep + 1,
            total: steps.length,
          })}
        </motion.p>
      </div>
    </div>
  );
}

// CheckIcon component with animated path
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      viewBox="0 0 24 24"
    >
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.1,
          type: 'tween',
          ease: 'easeOut',
          duration: 0.3,
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
