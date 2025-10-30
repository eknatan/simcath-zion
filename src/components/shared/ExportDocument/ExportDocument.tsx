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

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ActionButton } from '@/components/shared/ActionButton';
import { FileDown, Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { toast } from 'sonner';

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
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  /**
   * ייצוא ל-PDF
   * מטפל בשגיאות בצורה בטוחה ולא משפיע על הדיאלוג ההורה
   */
  const handleExportPDF = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // מניעת התפשטות האירוע כדי לא להשפיע על הדיאלוג ההורה
    e.stopPropagation();
    e.preventDefault();

    // Validation: בדיקת תקינות contentRef
    if (!contentRef.current) {
      console.error('Export failed: contentRef is null');
      toast.error(t('error'));
      return;
    }

    // Validation: בדיקת תקינות filename
    if (!filename || filename.trim() === '') {
      console.error('Export failed: filename is empty');
      toast.error(t('error'));
      return;
    }

    setIsExporting(true);

    try {
      // הגדרות ה-PDF
      const opt = {
        margin: [10, 10, 10, 10], // mm [top, right, bottom, left]
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          scrollX: 0,
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const,
          compress: true,
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          after: '.page-break-after',
        },
      };

      // יצירת ה-PDF - עם timeout למניעת תקיעה
      const exportPromise = html2pdf().set(opt).from(contentRef.current).save();

      // Timeout של 30 שניות למניעת תקיעה
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Export timeout')), 30000)
      );

      await Promise.race([exportPromise, timeoutPromise]);

      // הודעת הצלחה
      toast.success(t('success'));

      // Callback
      onExportComplete?.();
    } catch (error) {
      // לוג השגיאה
      console.error('Error exporting PDF:', error);

      // הצגת הודעת שגיאה ידידותית למשתמש
      toast.error(t('error'));

      // Callback שגיאה (אם קיים)
      try {
        onExportError?.(error as Error);
      } catch (callbackError) {
        // אם גם ה-callback נכשל, לא נזרוק שגיאה
        console.error('Error in onExportError callback:', callbackError);
      }
    } finally {
      // תמיד נוודא שהכפתור חוזר למצב רגיל
      setIsExporting(false);
    }
  };

  // טקסט הכפתור
  const displayText = buttonText || t('exportPDF');

  return (
    <div className="export-document-wrapper">
      {/* כפתור ייצוא */}
      <ActionButton
        variant={variant as any}
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
            minHeight: '297mm', // A4 height
            padding: '20mm',
            backgroundColor: 'white',
            fontFamily: 'Arial, sans-serif',
            fontSize: '12pt',
            lineHeight: '1.6',
            color: '#000',
          }}
        >
          {/* כותרת אם קיימת */}
          {title && (
            <div
              style={{
                textAlign: 'center',
                fontSize: '20pt',
                fontWeight: 'bold',
                marginBottom: '20mm',
                borderBottom: '2px solid #000',
                paddingBottom: '10mm',
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
        marginBottom: '8mm',
        display: fullWidth ? 'block' : 'inline-block',
        width: fullWidth ? '100%' : '48%',
        verticalAlign: 'top',
        paddingRight: fullWidth ? '0' : '2mm',
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          fontSize: '10pt',
          color: '#333',
          marginBottom: '2mm',
        }}
      >
        {label}:
      </div>
      <div
        style={{
          fontSize: '11pt',
          color: '#000',
          borderBottom: '1px solid #ddd',
          paddingBottom: '2mm',
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
        marginBottom: '15mm',
        pageBreakInside: 'avoid',
      }}
    >
      <div
        style={{
          fontSize: '14pt',
          fontWeight: 'bold',
          color: '#1e40af',
          marginBottom: '5mm',
          borderBottom: '2px solid #3b82f6',
          paddingBottom: '3mm',
        }}
      >
        {icon && <span style={{ marginRight: '5mm' }}>{icon}</span>}
        {title}
      </div>
      <div style={{ paddingTop: '3mm' }}>
        {children}
      </div>
    </div>
  );
}
