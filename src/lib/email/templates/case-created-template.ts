/**
 * Case Created Email Template
 * תבנית מייל עבור יצירת תיק חדש (למזכירות)
 */

import { getBaseTemplate } from './base-template';

export interface CaseCreatedTemplateData {
  caseNumber: number | string;
  caseType: 'wedding' | 'cleaning';
  applicantName: string;
  applicantEmail?: string;
  applicantPhone?: string;
  caseUrl?: string;
  additionalInfo?: Record<string, any>;
  locale?: 'he' | 'en';
}

export function getCaseCreatedTemplate(data: CaseCreatedTemplateData): {
  subject: string;
  html: string;
  text: string;
} {
  const locale = data.locale || 'he';
  const caseTypeLabel = {
    wedding: locale === 'en' ? 'Wedding' : 'חתונה',
    cleaning: locale === 'en' ? 'Sick Child Support' : 'ילד חולה',
  };

  if (locale === 'en') {
    const content = `
      <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 24px;">
        <h3 style="color: #667eea; margin: 0 0 8px 0;">New Case Created</h3>
        <p style="margin: 0; font-size: 18px; font-weight: 600;">
          Case #${data.caseNumber} - ${caseTypeLabel[data.caseType]}
        </p>
      </div>

      <h3 style="color: #333; margin-bottom: 16px;">Applicant Details:</h3>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; width: 40%;">
            Name
          </td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">
            ${data.applicantName}
          </td>
        </tr>
        ${data.applicantEmail ? `
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">
            Email
          </td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">
            <a href="mailto:${data.applicantEmail}" style="color: #667eea;">${data.applicantEmail}</a>
          </td>
        </tr>
        ` : ''}
        ${data.applicantPhone ? `
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">
            Phone
          </td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">
            <a href="tel:${data.applicantPhone}" style="color: #667eea;">${data.applicantPhone}</a>
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">
            Case Type
          </td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">
            ${caseTypeLabel[data.caseType]}
          </td>
        </tr>
      </table>

      <p style="color: #666; margin-top: 24px;">
        Please review the case and take the necessary action.
      </p>
    `;

    const text = `
New Case Created

Case #${data.caseNumber} - ${caseTypeLabel[data.caseType]}

Applicant Details:
- Name: ${data.applicantName}
${data.applicantEmail ? `- Email: ${data.applicantEmail}` : ''}
${data.applicantPhone ? `- Phone: ${data.applicantPhone}` : ''}
- Case Type: ${caseTypeLabel[data.caseType]}

${data.caseUrl ? `View case: ${data.caseUrl}` : ''}

Please review the case and take the necessary action.
    `.trim();

    return {
      subject: `New Case #${data.caseNumber} - ${caseTypeLabel[data.caseType]}`,
      html: getBaseTemplate({
        title: 'New Case Created',
        content,
        locale: 'en',
        preheader: `Case #${data.caseNumber} awaiting review`,
        ctaButton: data.caseUrl
          ? {
              text: 'View Case',
              url: data.caseUrl,
            }
          : undefined,
      }),
      text,
    };
  }

  // עברית (ברירת מחדל)
  const content = `
    <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; border-right: 4px solid #667eea; margin-bottom: 24px;">
      <h3 style="color: #667eea; margin: 0 0 8px 0;">תיק חדש נוצר במערכת</h3>
      <p style="margin: 0; font-size: 18px; font-weight: 600;">
        תיק מספר ${data.caseNumber} - ${caseTypeLabel[data.caseType]}
      </p>
    </div>

    <h3 style="color: #333; margin-bottom: 16px;">פרטי המבקש:</h3>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; width: 40%;">
          שם מלא
        </td>
        <td style="padding: 12px; border: 1px solid #e0e0e0;">
          ${data.applicantName}
        </td>
      </tr>
      ${data.applicantEmail ? `
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">
          אימייל
        </td>
        <td style="padding: 12px; border: 1px solid #e0e0e0;">
          <a href="mailto:${data.applicantEmail}" style="color: #667eea;">${data.applicantEmail}</a>
        </td>
      </tr>
      ` : ''}
      ${data.applicantPhone ? `
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">
          טלפון
        </td>
        <td style="padding: 12px; border: 1px solid #e0e0e0;">
          <a href="tel:${data.applicantPhone}" style="color: #667eea;">${data.applicantPhone}</a>
        </td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">
          סוג תיק
        </td>
        <td style="padding: 12px; border: 1px solid #e0e0e0;">
          ${caseTypeLabel[data.caseType]}
        </td>
      </tr>
    </table>

    <p style="color: #666; margin-top: 24px;">
      נא לבדוק את התיק ולבצע את הפעולות הנדרשות.
    </p>
  `;

  const text = `
תיק חדש נוצר במערכת

תיק מספר ${data.caseNumber} - ${caseTypeLabel[data.caseType]}

פרטי המבקש:
- שם מלא: ${data.applicantName}
${data.applicantEmail ? `- אימייל: ${data.applicantEmail}` : ''}
${data.applicantPhone ? `- טלפון: ${data.applicantPhone}` : ''}
- סוג תיק: ${caseTypeLabel[data.caseType]}

${data.caseUrl ? `צפייה בתיק: ${data.caseUrl}` : ''}

נא לבדוק את התיק ולבצע את הפעולות הנדרשות.
  `.trim();

  return {
    subject: `תיק חדש #${data.caseNumber} - ${caseTypeLabel[data.caseType]}`,
    html: getBaseTemplate({
      title: 'תיק חדש נוצר',
      content,
      locale: 'he',
      preheader: `תיק #${data.caseNumber} ממתין לבדיקה`,
      ctaButton: data.caseUrl
        ? {
            text: 'צפה בתיק',
            url: data.caseUrl,
          }
        : undefined,
    }),
    text,
  };
}
