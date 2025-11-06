'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Edit3, Check, X, Loader2 } from 'lucide-react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
  helperText?: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea';
  value?: any;
  onSave?: (value: any) => Promise<boolean>;
  notSpecifiedText?: string;
  icon?: React.ReactNode;
  placeholder?: string;
}

export function FormField({
  label,
  error,
  required = false,
  helperText,
  type = 'text',
  value,
  onSave,
  notSpecifiedText = 'Not specified',
  icon,
  placeholder,
  className,
  disabled,
  ...props
}: FormFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();

  const handleEdit = () => {
    setEditValue(value || '');
    setSaveError(undefined);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!onSave) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setSaveError(undefined);

    try {
      console.log('FormField saving value:', editValue, 'type:', typeof editValue);
      const success = await onSave(editValue);
      if (success) {
        setIsEditing(false);
      } else {
        setSaveError('Failed to save. Please try again.');
      }
    } catch (err) {
      console.error('FormField save error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Save failed';
      // Handle specific Zod errors
      if (errorMessage.includes('_zod') || errorMessage.includes('zod')) {
        setSaveError('Validation error. Please check your input and try again.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setSaveError('Network error. Please check your connection and try again.');
      } else {
        setSaveError(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setSaveError(undefined);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const displayValue = value || notSpecifiedText;
  const isEmpty = !value;

  // If no onSave provided, just display the field (read-only mode)
  if (!onSave) {
    return (
      <div className={cn('space-y-2', className)}>
        <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {icon}
          {label}
          {required && <span className="text-rose-500">*</span>}
        </Label>
        <div className={cn(
          'px-3 py-2 rounded-md border min-h-[40px] flex items-center',
          isEmpty ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
        )}>
          {displayValue}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {icon}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </Label>

      {isEditing ? (
        <div className="space-y-2">
          {type === 'textarea' ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isSaving}
              className={cn(saveError && 'border-rose-500')}
              rows={3}
            />
          ) : (
            <Input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(type === 'number' ? Number(e.target.value) : e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isSaving}
              className={cn(saveError && 'border-rose-500')}
            />
          )}

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8 px-3"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {saveError && (
            <p className="text-sm text-rose-600">{saveError}</p>
          )}
        </div>
      ) : (
        <div
          onClick={handleEdit}
          className={cn(
            'px-3 py-2 rounded-md border min-h-[40px] flex items-center justify-between cursor-text transition-colors',
            isEmpty
              ? 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              : 'bg-white border-slate-300 hover:bg-slate-50'
          )}
        >
          <span>{displayValue}</span>
          <Edit3 className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      {helperText && !error && !saveError && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}
