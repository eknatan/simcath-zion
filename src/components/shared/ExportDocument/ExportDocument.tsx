'use client';

/**
 * ExportDocument - קומפוננטה משותפת לייצוא מסמכים
 *
 * תומך ב:
 * - ייצוא PDF עם תמיכה מלאה ב-RTL ועברית באמצעות @react-pdf/renderer
 * - בחירת שפה (עברית/אנגלית)
 * - עיצוב מותאם אישית עם 2 טורים
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק ייצוא מסמכים
 * - Open/Closed: ניתן להרחבה לפורמטים נוספים
 * - Dependency Inversion: מקבל את התוכן כ-data
 *
 * לפי: DESIGN_SYSTEM.md, AI_DEVELOPMENT_GUIDE.md
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ActionButton } from '@/components/shared/ActionButton';
import { FileDown, Loader2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { CasePDFDocument, ApplicationPDFDocument, PDFLocale } from '@/lib/pdf';

export type PDFExportLocale = PDFLocale;

type DocumentType = 'case' | 'application';

interface ExportPDFButtonProps {
  /**
   * סוג המסמך - תיק או טופס מבקש
   */
  documentType: DocumentType;

  /**
   * נתוני המסמך
   */
  data: any;

  /**
   * שם הקובץ (ללא סיומת)
   */
  filename: string;

  /**
   * כותרת המסמך (אופציונלי)
   */
  title?: string;

  /**
   * Variant של הכפתור
   */
  variant?: 'default' | 'primary' | 'outline';

  /**
   * גודל הכפתור
   */
  size?: 'default' | 'sm' | 'lg';

  /**
   * טקסט הכפתור (אופציונלי - ברירת מחדל מתורגם)
   */
  buttonText?: string;

  /**
   * האם להציג אייקון בכפתור
   */
  showIcon?: boolean;

  /**
   * Callback אחרי ייצוא מוצלח
   */
  onExportComplete?: () => void;

  /**
   * Callback במקרה של שגיאה
   */
  onExportError?: (error: Error) => void;
}

/**
 * כפתור ייצוא PDF עם בחירת שפה - משתמש ב-@react-pdf/renderer
 */
export function ExportPDFButton({
  documentType,
  data,
  filename,
  title,
  variant = 'outline',
  size = 'default',
  buttonText,
  showIcon = true,
  onExportComplete,
  onExportError,
}: ExportPDFButtonProps) {
  const t = useTranslations('common.export');
  const [exporting, setExporting] = useState(false);

  const handleExport = async (locale: PDFLocale) => {
    try {
      setExporting(true);

      // Dynamic import of @react-pdf/renderer to reduce initial bundle size (~250KB)
      const { pdf } = await import('@react-pdf/renderer');

      // Generate PDF blob based on document type
      // Logo URL - use origin for full path that @react-pdf/renderer can fetch
      const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo-gold.png` : undefined;

      let blob: Blob;
      if (documentType === 'case') {
        blob = await pdf(
          <CasePDFDocument caseData={data} locale={locale} title={title} logoUrl={logoUrl} />
        ).toBlob();
      } else {
        blob = await pdf(
          <ApplicationPDFDocument formData={data} locale={locale} title={title} />
        ).toBlob();
      }

      // Download the file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(locale === 'he' ? 'PDF יוצא בהצלחה' : 'PDF exported successfully');
      onExportComplete?.();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error(locale === 'he' ? 'שגיאה ביצוא PDF' : 'Error exporting PDF');
      onExportError?.(error as Error);
    } finally {
      setExporting(false);
    }
  };

  const displayText = buttonText || t('exportPDF');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ActionButton
          variant={variant === 'outline' ? 'view' : (variant as any)}
          size={size}
          disabled={exporting}
          className="gap-2"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            showIcon && <FileDown className="h-4 w-4" />
          )}
          {exporting ? t('exporting') : displayText}
          {!exporting && <ChevronDown className="h-3 w-3" />}
        </ActionButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('he')}>
          עברית
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('en')}>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * רכיב עזר לעיצוב שדות במסמך PDF (לתאימות לאחור)
 */
export function ExportField({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string | number | null | undefined;
  fullWidth?: boolean;
}) {
  return (
    <div
      style={{
        marginBottom: '4mm',
        display: fullWidth ? 'block' : 'inline-block',
        width: fullWidth ? '100%' : '48%',
        verticalAlign: 'top',
        paddingRight: fullWidth ? '0' : '2mm',
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          fontSize: '9pt',
          color: '#333',
          marginBottom: '1mm',
        }}
      >
        {label}:
      </div>
      <div
        style={{
          fontSize: '9pt',
          color: '#000',
          borderBottom: '1px solid #ddd',
          paddingBottom: '1mm',
        }}
      >
        {value || '-'}
      </div>
    </div>
  );
}

/**
 * רכיב עזר לקטגוריה/סקשן במסמך PDF (לתאימות לאחור)
 */
export function ExportSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: '8mm',
        pageBreakInside: 'avoid',
      }}
    >
      <div
        style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          color: '#1e40af',
          marginBottom: '3mm',
          borderBottom: '2px solid #3b82f6',
          paddingBottom: '2mm',
        }}
      >
        {icon && <span style={{ marginRight: '5mm' }}>{icon}</span>}
        {title}
      </div>
      <div style={{ paddingTop: '2mm' }}>{children}</div>
    </div>
  );
}

/**
 * @deprecated Use ExportPDFButton instead
 * Legacy wrapper for backwards compatibility
 */
export function ExportDocument({
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  filename: _filename,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  title: _title,
  variant = 'outline',
  size = 'default',
  buttonText,
  showIcon = true,
}: {
  children: React.ReactNode;
  filename: string;
  title?: string;
  variant?: 'default' | 'primary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  buttonText?: string;
  showIcon?: boolean;
  direction?: 'rtl' | 'ltr';
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
}) {
  const t = useTranslations('common.export');

  console.warn('ExportDocument is deprecated. Please use ExportPDFButton with documentType instead.');

  return (
    <div className="export-document-wrapper">
      <ActionButton
        variant={variant === 'outline' ? 'view' : (variant as any)}
        size={size}
        disabled
        className="gap-2"
      >
        {showIcon && <FileDown className="h-4 w-4" />}
        {buttonText || t('exportPDF')}
      </ActionButton>
      <div className="hidden">{children}</div>
    </div>
  );
}
