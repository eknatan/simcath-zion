'use client';

/**
 * ExportWord - קומפוננטה משותפת לייצוא מסמכים ל-Word
 *
 * תומך ב:
 * - ייצוא DOCX עם תמיכה מלאה ב-RTL ועברית
 * - עיצוב מותאם אישית
 * - פורמט קומפקטי - כל המידע בעמוד אחד
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק ייצוא מסמכים ל-Word
 * - Open/Closed: ניתן להרחבה לפורמטים נוספים
 * - Dependency Inversion: מקבל את הנתונים כ-props
 *
 * לפי: DESIGN_SYSTEM.md, AI_DEVELOPMENT_GUIDE.md
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ActionButton } from '@/components/shared/ActionButton';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Packer,
} from 'docx';
import { saveAs } from 'file-saver';
import type { WeddingFormData } from '@/components/shared/FormRenderer';

interface ExportWordProps {
  /**
   * נתוני הטופס לייצוא
   */
  formData: WeddingFormData;

  /**
   * שם הקובץ (ללא סיומת)
   */
  filename: string;

  /**
   * כותרת המסמך
   */
  title?: string;

  /**
   * שפה/Locale ('he' או 'en')
   */
  locale?: string;

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

export function ExportWord({
  formData,
  filename,
  title,
  locale = 'he',
  variant = 'outline',
  size = 'default',
  buttonText,
  showIcon = true,
  onExportComplete,
  onExportError,
}: ExportWordProps) {
  const t = useTranslations('common.export');
  const [isExporting, setIsExporting] = useState(false);

  // זיהוי אם זה עברית (RTL)
  const isRTL = locale === 'he';

  /**
   * יצירת שורת טבלה עם label ו-value
   * תמיכה ב-RTL וריווח אוטומטי
   */
  const createTableRow = (label: string, value: string | number | null | undefined) => {
    // בעברית (RTL): label מימין, value משמאל
    // באנגלית (LTR): label משמאל, value מימין
    const labelCell = new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: label,
              bold: true,
              size: 22, // 11pt
              font: 'Arial',
              rightToLeft: isRTL,
            }),
          ],
          alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
          bidirectional: isRTL,
        }),
      ],
      width: { size: 30, type: WidthType.PERCENTAGE }, // 30% לעמודת ה-key
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      },
    });

    const valueCell = new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: value?.toString() || '-',
              size: 22, // 11pt
              font: 'Arial',
              rightToLeft: isRTL,
            }),
          ],
          alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
          bidirectional: isRTL,
        }),
      ],
      width: { size: 70, type: WidthType.PERCENTAGE }, // 70% לעמודת ה-value
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      },
    });

    return new TableRow({
      // בעברית: value משמאל, label מימין (סדר הפוך בטבלה)
      children: isRTL ? [valueCell, labelCell] : [labelCell, valueCell],
    });
  };

  /**
   * יצירת כותרת סקשן
   */
  const createSectionHeader = (text: string) => {
    return new Paragraph({
      children: [
        new TextRun({
          text,
          bold: true,
          size: 28, // 14pt
          font: 'Arial',
          color: '1E40AF',
          rightToLeft: isRTL,
        }),
      ],
      heading: HeadingLevel.HEADING_2,
      alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
      bidirectional: isRTL,
      spacing: { before: 240, after: 120 },
    });
  };

  /**
   * ייצוא ל-Word
   */
  const handleExportWord = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // מניעת התפשטות האירוע
    e.stopPropagation();
    e.preventDefault();

    // Validation
    if (!formData) {
      console.error('Export failed: formData is null');
      toast.error(t('error'));
      return;
    }

    if (!filename || filename.trim() === '') {
      console.error('Export failed: filename is empty');
      toast.error(t('error'));
      return;
    }

    setIsExporting(true);

    try {
      // יצירת כותרת ראשית
      const titleParagraph = title
        ? new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 32, // 16pt
                font: 'Arial',
                rightToLeft: isRTL,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.CENTER,
            bidirectional: isRTL,
            spacing: { after: 240 },
            border: {
              bottom: {
                color: '000000',
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
          })
        : null;

      // סקשן א': מידע החתונה
      const weddingInfoSection = [
        createSectionHeader('מידע החתונה'),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
          rows: [
            createTableRow('תאריך עברי', formData.wedding_info?.date_hebrew),
            createTableRow('תאריך לועזי', formData.wedding_info?.date_gregorian),
            createTableRow('עיר', formData.wedding_info?.city),
            createTableRow('מספר מוזמנים', formData.wedding_info?.guests_count),
            createTableRow('עלות כוללת', formData.wedding_info?.total_cost ? `₪${formData.wedding_info.total_cost.toLocaleString()}` : undefined),
          ],
        }),
      ];

      // סקשן ב': פרטי החתן
      const groomInfoSection = [
        createSectionHeader('פרטי החתן'),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
          rows: [
            createTableRow('שם פרטי', formData.groom_info?.first_name),
            createTableRow('שם משפחה', formData.groom_info?.last_name),
            createTableRow('תעודת זהות', formData.groom_info?.id),
            createTableRow('ישיבה', formData.groom_info?.school),
            createTableRow('עיר', formData.groom_info?.city),
            createTableRow('כתובת', formData.groom_info?.address),
            createTableRow('טלפון', formData.groom_info?.phone),
            createTableRow('אימייל', formData.groom_info?.email),
            createTableRow('שם האב', formData.groom_info?.father_name),
            createTableRow('עיסוק האב', formData.groom_info?.father_occupation),
            createTableRow('שם האם', formData.groom_info?.mother_name),
            createTableRow('עיסוק האם', formData.groom_info?.mother_occupation),
            createTableRow('יום הזיכרון', formData.groom_info?.memorial_day),
            createTableRow('תיעוד רקע', formData.groom_info?.background),
          ],
        }),
      ];

      // סקשן ג': פרטי הכלה
      const brideInfoSection = [
        createSectionHeader('פרטי הכלה'),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
          rows: [
            createTableRow('שם פרטי', formData.bride_info?.first_name),
            createTableRow('שם משפחה', formData.bride_info?.last_name),
            createTableRow('תעודת זהות', formData.bride_info?.id),
            createTableRow('בית ספר', formData.bride_info?.school),
            createTableRow('עיר', formData.bride_info?.city),
            createTableRow('כתובת', formData.bride_info?.address),
            createTableRow('טלפון', formData.bride_info?.phone),
            createTableRow('אימייל', formData.bride_info?.email),
            createTableRow('שם האב', formData.bride_info?.father_name),
            createTableRow('עיסוק האב', formData.bride_info?.father_occupation),
            createTableRow('שם האם', formData.bride_info?.mother_name),
            createTableRow('עיסוק האם', formData.bride_info?.mother_occupation),
            createTableRow('יום הזיכרון', formData.bride_info?.memorial_day),
            createTableRow('תיעוד רקע', formData.bride_info?.background),
          ],
        }),
      ];

      // יצירת המסמך
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 720, // 0.5 inch
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            children: [
              ...(titleParagraph ? [titleParagraph] : []),
              ...weddingInfoSection,
              ...groomInfoSection,
              ...brideInfoSection,
            ],
          },
        ],
      });

      // המרה ל-Blob ושמירה
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${filename}.docx`);

      // הודעת הצלחה
      toast.success(t('success'));

      // Callback
      onExportComplete?.();
    } catch (error) {
      // לוג השגיאה
      console.error('Error exporting Word:', error);

      // הצגת הודעת שגיאה
      toast.error(t('error'));

      // Callback שגיאה
      try {
        onExportError?.(error as Error);
      } catch (callbackError) {
        console.error('Error in onExportError callback:', callbackError);
      }
    } finally {
      setIsExporting(false);
    }
  };

  // טקסט הכפתור
  const displayText = buttonText || t('exportWord') || 'ייצא Word';

  return (
    <ActionButton
      variant={variant as any}
      size={size}
      onClick={handleExportWord}
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
  );
}
