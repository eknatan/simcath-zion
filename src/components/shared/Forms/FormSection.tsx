import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * קומפוננטת FormSection - עוטפת סקשן בטופס
 *
 * עקרונות SOLID:
 * - Single Responsibility: אחראית רק על UI של סקשן (כותרת + תוכן)
 * - Open/Closed: פתוחה להרחבה דרך children, סגורה לשינוי
 * - Interface Segregation: ממשק פשוט וממוקד
 *
 * תמיכה ב-RTL/i18n מובנית
 */

export interface FormSectionProps {
  /** כותרת הסקשן */
  title: string;
  /** תיאור אופציונלי */
  description?: string;
  /** תוכן הסקשן */
  children: React.ReactNode;
  /** מספר הסקשן (לצורך progress) */
  stepNumber?: number;
  /** האם הסקשן פעיל כרגע */
  isActive?: boolean;
  /** className נוסף */
  className?: string;
  /** האם להציג עם gradient (לפי מערכת העיצוב) */
  withGradient?: boolean;
}

export function FormSection({
  title,
  description,
  children,
  stepNumber,
  isActive = true,
  className,
  withGradient = true,
}: FormSectionProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        withGradient && 'border-2 border-blue-100 shadow-lg',
        isActive && 'hover:shadow-xl hover:-translate-y-0.5',
        !isActive && 'opacity-60',
        className
      )}
    >
      {/* Gradient background - לפי מערכת העיצוב */}
      {withGradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-50/50 to-transparent opacity-60" />
      )}

      <CardHeader className="relative">
        <div className="flex items-center gap-3">
          {/* Step number badge */}
          {stepNumber && (
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-lg font-bold text-white">{stepNumber}</span>
            </div>
          )}

          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-blue-900">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-sm text-blue-600 mt-1">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}
