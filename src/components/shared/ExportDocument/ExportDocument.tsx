'use client';

/**
 * ExportDocument - קומפוננטה משותפת לייצוא מסמכים
 *
 * תומך ב:
 * - ייצוא PDF עם תמיכה מלאה ב-RTL ועברית
 * - עיצוב מותאם אישית
 * - דינאמי ומותאם לכל סוג מסמך
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק ייצוא מסמכים
 * - Open/Closed: ניתן להרחבה לפורמטים נוספים
 * - Dependency Inversion: מקבל את התוכן כ-ReactNode
 *
 * לפי: DESIGN_SYSTEM.md, AI_DEVELOPMENT_GUIDE.md
 */

import { useTranslations } from 'next-intl';
import { ActionButton } from '@/components/shared/ActionButton';
import { FileDown, Loader2 } from 'lucide-react';
import { useExportPDF } from '@/lib/hooks/useExportPDF';

interface ExportDocumentProps {
  /**
   * התוכן לייצוא - יכול להיות כל רכיב React
   */
  children: React.ReactNode;

  /**
   * שם הקובץ (ללא סיומת)
   */
  filename: string;

  /**
   * כותרת המסמך (מופיעה ב-PDF)
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
   * כיוון המסמך - RTL או LTR
   */
  direction?: 'rtl' | 'ltr';

  /**
   * Callback אחרי ייצוא מוצלח
   */
  onExportComplete?: () => void;

  /**
   * Callback במקרה של שגיאה
   */
  onExportError?: (error: Error) => void;
}

export function ExportDocument({
  children,
  filename,
  title,
  variant = 'outline',
  size = 'default',
  buttonText,
  showIcon = true,
  direction = 'rtl',
  onExportComplete,
  onExportError,
}: ExportDocumentProps) {
  const t = useTranslations('common.export');

  // שימוש ב-hook המשותף
  const { isExporting, exportToPDF, contentRef } = useExportPDF({
    filename,
    onSuccess: onExportComplete,
    onError: onExportError,
  });

  const handleExportPDF = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    await exportToPDF();
  };

  // טקסט הכפתור
  const displayText = buttonText || t('exportPDF');

  return (
    <div className="export-document-wrapper">
      {/* כפתור ייצוא */}
      <ActionButton
        variant={variant === 'outline' ? 'view' : (variant as any)}
        size={size}
        onClick={handleExportPDF}
        disabled={isExporting}
        className="gap-2"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          showIcon && <FileDown className="h-4 w-4" />
        )}
        {isExporting ? t('exporting') : displayText}
      </ActionButton>

      {/* התוכן לייצוא - מוסתר מהמסך */}
      <div className="hidden">
        <div
          ref={contentRef}
          dir={direction}
          className="export-document-content"
          style={{
            width: '210mm', // A4 width
            padding: '10mm 12mm',
            backgroundColor: 'white',
            fontFamily: 'Arial, sans-serif',
            fontSize: '11pt',
            lineHeight: '1.4',
            color: '#000',
          }}
        >
          {/* כותרת אם קיימת */}
          {title && (
            <div
              style={{
                textAlign: 'center',
                fontSize: '14pt',
                fontWeight: 'bold',
                marginBottom: '4mm',
                borderBottom: '1.5px solid #000',
                paddingBottom: '2mm',
              }}
            >
              {title}
            </div>
          )}

          {/* התוכן */}
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * רכיב עזר לעיצוב שדות במסמך PDF
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
 * רכיב עזר לקטגוריה/סקשן במסמך PDF
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
      <div style={{ paddingTop: '2mm' }}>
        {children}
      </div>
    </div>
  );
}
