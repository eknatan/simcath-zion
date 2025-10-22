'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
  helperText?: string;
}

export function FormField({
  label,
  error,
  required,
  helperText,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={props.id}>
        {label}
        {required && <span className="text-destructive ms-1">*</span>}
      </Label>
      <Input
        {...props}
        className={cn(error && 'border-destructive')}
        aria-invalid={!!error}
      />
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
