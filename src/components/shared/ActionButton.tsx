/**
 * ActionButton
 *
 * כפתורי פעולה משותפים למערכת
 * משתמש ב-ActiveDesignTokens כדי להתאים את העיצוב לגרסה הפעילה
 *
 * Variants:
 * - primary: כפתור ראשי (כחול)
 * - view: כפתור צפייה (כחול outline)
 * - approve: כפתור אישור (ירוק outline)
 * - reject: כפתור דחייה (אדום outline)
 * - restore: כפתור שחזור (כחול outline)
 * - cancel: כפתור ביטול (אפור outline)
 *
 * @example
 * ```tsx
 * <ActionButton variant="approve" onClick={handleApprove}>
 *   <CheckCircle2 className="h-4 w-4 me-2" />
 *   אשר
 * </ActionButton>
 * ```
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ActiveDesignTokens } from '@/lib/design-tokens';

export type ActionButtonVariant =
  | 'primary'
  | 'view'
  | 'approve'
  | 'reject'
  | 'restore'
  | 'cancel'
  // Filled variants for dialogs
  | 'approve-primary'
  | 'reject-primary'
  | 'restore-primary';

export interface ActionButtonProps
  extends Omit<React.ComponentProps<typeof Button>, 'variant'> {
  variant?: ActionButtonVariant;
}

/**
 * מחזיר את ה-className המתאים לכל variant לפי הגרסה הפעילה
 */
function getVariantClasses(variant: ActionButtonVariant): string {
  const { components } = ActiveDesignTokens;

  switch (variant) {
    case 'primary':
      // כפתור ראשי - רקע כחול
      return components.button.primary;

    // === Outline variants (for lists/tables) - Version B: Soft & Matte ===
    case 'view':
      // כפתור צפייה - עדין וממוט
      return cn(
        components.button.outline,
        'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
      );

    case 'approve':
      // כפתור אישור - ירוק עדין
      return cn(
        components.button.outline,
        'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300'
      );

    case 'reject':
      // כפתור דחייה - אדום עדין
      return cn(
        components.button.outline,
        'border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300'
      );

    case 'restore':
      // כפתור שחזור - כחול עדין
      return cn(
        components.button.outline,
        'border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300'
      );

    case 'cancel':
      // כפתור ביטול - אפור עדין
      return cn(
        components.button.outline,
        'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
      );

    // === Filled variants (for dialogs) - Version B: Soft & Matte ===
    case 'approve-primary':
      // כפתור אישור מלא - ירוק רך
      return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all';

    case 'reject-primary':
      // כפתור דחייה מלא - אדום רך
      return 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all';

    case 'restore-primary':
      // כפתור שחזור מלא - כחול רך
      return 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-all';

    default:
      return '';
  }
}

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ variant = 'primary', className, ...props }, ref) => {
    const variantClasses = getVariantClasses(variant);

    // Determine if this is a filled variant
    const isFilled = variant === 'primary' || variant.endsWith('-primary');

    return (
      <Button
        ref={ref}
        variant={isFilled ? 'default' : 'outline'}
        className={cn(variantClasses, className)}
        {...props}
      />
    );
  }
);

ActionButton.displayName = 'ActionButton';
