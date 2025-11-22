/**
 * Monthly Request Email Template
 * תבנית מייל חודשי לבקשת קבלות/אישורים ממשפחות ילדים חולים
 */

import { getBaseTemplate } from './base-template';
import type { EmailTemplate } from '@/types/email.types';

/**
 * Convert text to HTML with RTL support
 */
function textToHtmlWithDirection(text: string, locale: 'he' | 'en'): string {
  const align = locale === 'he' ? 'right' : 'left';
  const dir = locale === 'he' ? 'rtl' : 'ltr';

  return text
    .split('\n\n')
    .map((paragraph) => `<p style="margin-bottom: 16px; text-align: ${align}; direction: ${dir};">${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export interface MonthlyRequestTemplateProps {
  familyName: string;
  childName: string;
  month: string;
  year: number;
  locale: 'he' | 'en';
  customBody?: string;
}

/**
 * Generate monthly request email template
 */
export function getMonthlyRequestTemplate(
  props: MonthlyRequestTemplateProps
): EmailTemplate {
  const { familyName, childName, month, year, locale, customBody } = props;

  // Default content based on language
  const content = customBody || getDefaultContent(locale, familyName, childName, month, year);

  // Subject line
  const subject =
    locale === 'en'
      ? `Monthly Request - ${month} ${year}`
      : `בקשה חודשית - ${month} ${year}`;

  // Generate HTML using base template
  const html = getBaseTemplate({
    title:
      locale === 'en'
        ? `Monthly Request - ${month} ${year}`
        : `בקשה חודשית לחודש ${month} ${year}`,
    content: textToHtmlWithDirection(content, locale),
    locale,
    preheader:
      locale === 'en'
        ? `Monthly cleaning assistance request for ${month} ${year}`
        : `בקשת סיוע חודשית לחודש ${month} ${year}`,
    footer:
      locale === 'en'
        ? 'Simchat Zion - Sick Children Support Program'
        : 'שמחת ציון - תוכנית סיוע לילדים חולים',
  });

  // Plain text version
  const text = content;

  return {
    subject,
    html,
    text,
  };
}

/**
 * Get default email content based on language
 */
function getDefaultContent(
  locale: 'he' | 'en',
  familyName: string,
  childName: string,
  month: string,
  year: number
): string {
  if (locale === 'en') {
    return `Dear ${familyName} Family,

We hope this message finds you well.

As part of our monthly support for your child ${childName}'s care, we kindly request that you send us the receipts for cleaning services for the month of ${month} ${year}.

Please submit the following:
- Receipt(s) for cleaning services
- Any relevant documentation

Upon receiving the documents, we will process the payment as soon as possible.

If you have any questions or need assistance, please don't hesitate to contact us.

Wishing you and your family good health,

Simchat Zion Team`;
  }

  return `משפחת ${familyName} היקרים,

אנו מקווים שהודעה זו מוצאת אתכם בבריאות טובה.

במסגרת הסיוע החודשי שלנו עבור הטיפול בילדכם ${childName}, אנו מבקשים בזאת לשלוח אלינו את הקבלות עבור שירותי הניקיון לחודש ${month} ${year}.

אנא העבירו אלינו:
- קבלה/ות עבור שירותי ניקיון
- כל מסמך רלוונטי נוסף

עם קבלת המסמכים, נעבד את התשלום בהקדם האפשרי.

אם יש לכם שאלות או זקוקים לסיוע, אל תהססו לפנות אלינו.

מאחלים לכם ולמשפחתכם בריאות טובה,

צוות שמחת ציון`;
}
