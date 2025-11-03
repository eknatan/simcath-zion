import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface UseExportPDFOptions {
  filename: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * ממיר oklch ל-RGB באמצעות המרה ידנית פשוטה
 * html2canvas לא תומך ב-oklch
 */
function oklchToRgb(l: number, c: number, h: number): string {
  // המרה פשוטה מ-OKLCH ל-RGB (קירוב)
  // l = lightness (0-1), c = chroma (0-0.4), h = hue (0-360)

  // המרה ל-Lab
  const L = l * 100;
  const a = c * Math.cos((h * Math.PI) / 180) * 125;
  const b = c * Math.sin((h * Math.PI) / 180) * 125;

  // המרה מ-Lab ל-XYZ
  let y = (L + 16) / 116;
  let x = a / 500 + y;
  let z = y - b / 200;

  x = 0.95047 * (x ** 3 > 0.008856 ? x ** 3 : (x - 16 / 116) / 7.787);
  y = 1.0 * (y ** 3 > 0.008856 ? y ** 3 : (y - 16 / 116) / 7.787);
  z = 1.08883 * (z ** 3 > 0.008856 ? z ** 3 : (z - 16 / 116) / 7.787);

  // המרה מ-XYZ ל-RGB
  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let bVal = x * 0.0557 + y * -0.204 + z * 1.057;

  // gamma correction
  r = r > 0.0031308 ? 1.055 * r ** (1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * g ** (1 / 2.4) - 0.055 : 12.92 * g;
  bVal = bVal > 0.0031308 ? 1.055 * bVal ** (1 / 2.4) - 0.055 : 12.92 * bVal;

  // המרה לערכים 0-255
  const red = Math.max(0, Math.min(255, Math.round(r * 255)));
  const green = Math.max(0, Math.min(255, Math.round(g * 255)));
  const blue = Math.max(0, Math.min(255, Math.round(bVal * 255)));

  return `rgb(${red}, ${green}, ${blue})`;
}

/**
 * ממיר צבעי oklch ל-RGB עבור html2canvas
 * html2canvas לא תומך ב-oklch, אז אנחנו ממירים לצבעים נתמכים
 */
function convertOklchToRgb(element: HTMLElement) {
  const styles = window.getComputedStyle(element);

  // רשימת properties שיכולים להכיל צבעים
  const colorProperties = [
    'color',
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'outlineColor',
    'textDecorationColor',
  ];

  colorProperties.forEach((prop) => {
    try {
      const value = styles.getPropertyValue(prop);

      // בדיקה אם זה oklch או var שמכיל oklch
      if (value && (value.includes('oklch') || value.includes('var('))) {
        // ניסיון לקבל את הערך המחושב
        const computedValue = styles[prop as keyof CSSStyleDeclaration] as string;

        // אם יש ערך מחושב ב-RGB, נשתמש בו
        if (computedValue && (computedValue.startsWith('rgb') || computedValue.startsWith('#'))) {
          element.style.setProperty(prop, computedValue, 'important');
        }
        // אם יש oklch, ננסה להמיר
        else if (value.includes('oklch')) {
          const match = value.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
          if (match) {
            const [, l, c, h] = match.map(Number);
            const rgb = oklchToRgb(l, c, h);
            element.style.setProperty(prop, rgb, 'important');
          }
        }
      }
    } catch (err) {
      console.warn(`Failed to convert color for property ${prop}:`, err);
    }
  });

  // טיפול ב-CSS variables
  try {
    const rootStyles = getComputedStyle(document.documentElement);
    const cssVarPattern = /var\((--[\w-]+)\)/g;

    colorProperties.forEach((prop) => {
      const value = element.style.getPropertyValue(prop);
      if (value && value.includes('var(')) {
        const match = value.match(cssVarPattern);
        if (match) {
          match.forEach((varMatch) => {
            const varName = varMatch.match(/var\((--[\w-]+)\)/)?.[1];
            if (varName) {
              const varValue = rootStyles.getPropertyValue(varName);
              if (varValue && varValue.includes('oklch')) {
                const oklchMatch = varValue.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
                if (oklchMatch) {
                  const [, l, c, h] = oklchMatch.map(Number);
                  const rgb = oklchToRgb(l, c, h);
                  element.style.setProperty(prop, rgb, 'important');
                }
              }
            }
          });
        }
      }
    });
  } catch (err) {
    console.warn('Failed to convert CSS variables:', err);
  }
}

/**
 * Hook משותף לייצוא PDF
 * מאפשר שימוש חוזר בלוגיקת הייצוא
 */
export function useExportPDF({ filename, onSuccess, onError }: UseExportPDFOptions) {
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const exportToPDF = async () => {
    try {
      // Validation: בדיקת תקינות contentRef
      if (!contentRef.current) {
        console.error('Export failed: contentRef is null');
        toast.error('שגיאה ביצוא PDF');
        onError?.(new Error('contentRef is null'));
        return;
      }

      // Validation: בדיקת תקינות filename
      if (!filename || filename.trim() === '') {
        console.error('Export failed: filename is empty');
        toast.error('שגיאה ביצוא PDF');
        onError?.(new Error('filename is empty'));
        return;
      }

      setIsExporting(true);

      // Dynamically import html2pdf.js only on client side
      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${filename}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          scrollX: 0,
          // המרת oklch לפני הייצוא
          onclone: (clonedDoc: Document) => {
            // שלב 1: הוספת stylesheet עם המרת CSS variables
            const style = clonedDoc.createElement('style');

            // מיפוי ידני של oklch ל-RGB עבור הצבעים הנפוצים
            // הערכים מבוססים על המרה של oklch מ-globals.css
            const colorMap: Record<string, string> = {
              '--background': '#fafafc',
              '--foreground': '#33333b',
              '--card': '#ffffff',
              '--card-foreground': '#33333b',
              '--popover': '#ffffff',
              '--popover-foreground': '#33333b',
              '--primary': '#3b82f6',
              '--primary-foreground': '#fafafc',
              '--secondary': '#f1f5f9',
              '--secondary-foreground': '#475569',
              '--muted': '#f1f5f9',
              '--muted-foreground': '#64748b',
              '--accent': '#f0f4f8',
              '--accent-foreground': '#475569',
              '--destructive': '#ef4444',
              '--destructive-foreground': '#fafafc',
              '--border': '#e2e8f0',
              '--input': '#e2e8f0',
              '--ring': '#3b82f6',
              '--chart-1': '#3b82f6',
              '--chart-2': '#10b981',
              '--chart-3': '#f59e0b',
              '--chart-4': '#6366f1',
              '--chart-5': '#ef4444',
              '--sidebar': '#fcfcfd',
              '--sidebar-foreground': '#33333b',
              '--sidebar-primary': '#3b82f6',
              '--sidebar-primary-foreground': '#fafafc',
              '--sidebar-accent': '#f1f5f9',
              '--sidebar-accent-foreground': '#475569',
              '--sidebar-border': '#e2e8f0',
              '--sidebar-ring': '#3b82f6',
            };

            let cssContent = ':root {\n';
            Object.entries(colorMap).forEach(([varName, rgb]) => {
              cssContent += `  ${varName}: ${rgb} !important;\n`;
            });
            cssContent += '}\n';

            // הוספת סגנונות נוספים לאלמנטים ספציפיים
            cssContent += `
              * {
                color-scheme: light !important;
              }
              .export-document-content * {
                background-color: transparent !important;
              }
            `;

            style.textContent = cssContent;
            clonedDoc.head.appendChild(style);

            // שלב 2: המרת צבעים אלמנט אחר אלמנט
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el) => {
              if (el instanceof HTMLElement) {
                convertOklchToRgb(el);
              }
            });
          },
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

      const exportPromise = html2pdf().set(opt).from(contentRef.current).save();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Export timeout')), 30000)
      );

      await Promise.race([exportPromise, timeoutPromise]);

      toast.success('PDF יוצא בהצלחה');
      onSuccess?.();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('שגיאה ביצוא PDF');
      onError?.(error as Error);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportToPDF,
    contentRef,
  };
}
