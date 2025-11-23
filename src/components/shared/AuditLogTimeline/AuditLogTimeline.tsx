'use client';

import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { CaseHistoryWithUser } from '@/types/case.types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ActionButton } from '@/components/shared/ActionButton';
import { cn } from '@/lib/utils';
import {
  History,
  Edit3,
  FileText,
  Upload,
  DollarSign,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Trash2,
  Plus,
  Calendar,
  MapPin,
  Phone,
  Mail,
  } from 'lucide-react';

interface AuditLogTimelineProps {
  history: CaseHistoryWithUser[];
  className?: string;
}

/**
 * Parse note string with format "key|param1:value1|param2:value2"
 * Returns { key, params } object
 */
function parseNoteKey(note: string): { key: string; params: Record<string, string> } {
  const parts = note.split('|');
  const key = parts[0];
  const params: Record<string, string> = {};

  for (let i = 1; i < parts.length; i++) {
    const [paramKey, ...valueParts] = parts[i].split(':');
    if (paramKey) {
      params[paramKey] = valueParts.join(':'); // rejoin in case value contains ':'
    }
  }

  return { key, params };
}

/**
 * AuditLogTimeline - Displays case history in a timeline format
 *
 * Features:
 * - Sheet sidebar from the left (as per specification)
 * - Timeline with icons for different change types
 * - Relative time formatting (e.g., "לפני 5 דקות")
 * - Color-coded icons based on change type
 * - User attribution for changes
 * - Support for notes and detailed information
 *
 * Design follows Version B: Elegant & Soft
 */
export function AuditLogTimeline({ history, className }: AuditLogTimelineProps) {
  const t = useTranslations('audit');

  /**
   * Get appropriate icon for the field changed
   */
  const getChangeIcon = (field: string) => {
    const fieldLower = field.toLowerCase();

    // Status changes
    if (fieldLower === 'status' || fieldLower.includes('status')) {
      switch (history.find(h => h.field_changed === field)?.new_value) {
        case 'new':
        case 'active':
          return <Plus className="h-4 w-4" />;
        case 'approved':
        case 'transferred':
          return <CheckCircle2 className="h-4 w-4" />;
        case 'rejected':
        case 'deleted':
        case 'inactive':
          return <XCircle className="h-4 w-4" />;
        default:
          return <AlertCircle className="h-4 w-4" />;
      }
    }

    // Personal information
    if (fieldLower.includes('name') || fieldLower.includes('father') || fieldLower.includes('mother')) {
      return <User className="h-4 w-4" />;
    }

    // Contact information
    if (fieldLower.includes('phone') || fieldLower.includes('tel')) {
      return <Phone className="h-4 w-4" />;
    }
    if (fieldLower.includes('email') || fieldLower.includes('mail')) {
      return <Mail className="h-4 w-4" />;
    }
    if (fieldLower.includes('address') || fieldLower.includes('city')) {
      return <MapPin className="h-4 w-4" />;
    }

    // Dates and events
    if (fieldLower.includes('date') || fieldLower.includes('wedding')) {
      return <Calendar className="h-4 w-4" />;
    }

    // Financial information
    if (fieldLower.includes('bank') || fieldLower.includes('account')) {
      return <CreditCard className="h-4 w-4" />;
    }
    if (fieldLower.includes('payment') || fieldLower.includes('amount') || fieldLower.includes('cost')) {
      return <DollarSign className="h-4 w-4" />;
    }

    // Files and documents
    if (fieldLower.includes('file') || fieldLower.includes('upload')) {
      return <Upload className="h-4 w-4" />;
    }
    if (fieldLower.includes('deleted')) {
      return <Trash2 className="h-4 w-4" />;
    }

    // Default
    return <Edit3 className="h-4 w-4" />;
  };

  /**
   * Get color scheme based on change type
   */
  const getChangeColor = (entry: CaseHistoryWithUser) => {
    const field = entry.field_changed?.toLowerCase() || '';
    const value = entry.new_value?.toLowerCase() || '';

    // Positive changes
    if (value.includes('approved') || value.includes('transferred') || value.includes('created')) {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }

    // Negative changes
    if (value.includes('rejected') || value.includes('deleted') || value.includes('inactive')) {
      return 'bg-rose-100 text-rose-700 border-rose-200';
    }

    // Warning/neutral changes
    if (field.includes('status') || field.includes('payment')) {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }

    // Informational changes
    if (field.includes('file') || field.includes('upload')) {
      return 'bg-sky-100 text-sky-700 border-sky-200';
    }

    // Default
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  /**
   * Get human-readable description for the change
   */
  const getChangeDescription = (entry: CaseHistoryWithUser) => {
    const field = entry.field_changed;
    const oldValue = entry.old_value;
    const newValue = entry.new_value;

    // Special cases
    if (field === 'status') {
      return `שינה את הסטטוס מ"${t(`status.${oldValue}`)}" ל"${t(`status.${newValue}`)}"`;
    }

    if (field === 'file_uploaded') {
      return `העלה קובץ: ${newValue}`;
    }

    if (field === 'file_deleted') {
      return `מחק קובץ: ${oldValue}`;
    }

    if (field === 'payment_approved') {
      return 'אישר תשלום ושינה סטטוס ל"ממתין להעברה"';
    }

    if (field === 'bank_details') {
      return 'עדכן פרטי חשבון בנק';
    }

    // General field changes
    if (oldValue && newValue) {
      return `ערך את ${t(`field.${field}`)} מ"${oldValue}" ל"${newValue}"`;
    }

    if (newValue && !oldValue) {
      return `הוסיף ${t(`field.${field}`)}: ${newValue}`;
    }

    if (oldValue && !newValue) {
      return `הסיר ${t(`field.${field}`)}: ${oldValue}`;
    }

    return entry.note || `ביצע פעולה: ${field}`;
  };

  /**
   * Translate note using i18n keys
   * Supports format: "key|param1:value1|param2:value2"
   */
  const translateNote = (note: string): string | null => {
    if (!note) return null;

    // Check if it's a translatable key (contains | or matches known keys)
    const isTranslatableKey = note.includes('|') ||
      ['payment_approved', 'bank_details_added', 'bank_details_updated', 'case_deleted',
       'file_uploaded', 'file_deleted', 'case_details_updated', 'case_closed',
       'case_closed_with_notes', 'case_reopened', 'case_created_from_applicant'].some(
        key => note.startsWith(key)
      );

    if (!isTranslatableKey) {
      // Return original note if it's not a translatable key (legacy data)
      return note;
    }

    const { key, params } = parseNoteKey(note);

    // Translate close reason if present
    if (params.reason) {
      const reasonKey = `notes.close_reasons.${params.reason}`;
      try {
        params.reason = t(reasonKey);
      } catch {
        // Keep original reason if translation not found
      }
    }

    // Translate previousReason if present
    if (params.previousReason) {
      const reasonKey = `notes.close_reasons.${params.previousReason}`;
      try {
        params.previousReason = t(reasonKey);
      } catch {
        // Keep original reason if translation not found
      }
    }

    try {
      return t(`notes.${key}`, params);
    } catch {
      // Return original note if translation fails
      return note;
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <ActionButton variant="view" size="sm" className={className}>
          <History className="h-4 w-4 me-2" />
          {t('history')}
        </ActionButton>
      </SheetTrigger>

      <SheetContent side="left" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('title')}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)] pe-2">
          {history.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">{t('noHistory')}</p>
            </div>
          ) : (
            history.map((entry, index) => (
              <div key={entry.id} className="flex gap-3">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center border",
                    getChangeColor(entry)
                  )}>
                    {getChangeIcon(entry.field_changed || '')}
                  </div>
                  {index < history.length - 1 && (
                    <div className="w-0.5 flex-1 bg-slate-200 my-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">
                          {entry.changed_by_name || 'משתמש לא ידוע'}
                        </span>
                        <span className="text-muted-foreground">
                          {getChangeDescription(entry)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(
                          new Date(entry.changed_at || Date.now()),
                          {
                            addSuffix: true,
                            locale: he
                          }
                        )}
                      </div>
                      {entry.note && (
                        <div className="text-sm text-muted-foreground mt-2 bg-slate-50 p-2 rounded border">
                          {translateNote(entry.note)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}