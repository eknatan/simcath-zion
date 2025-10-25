/**
 * Applicant Notification Email Template
 * תבנית מייל להודעה למבקש (לאחר שליחת טופס)
 */

import { getBaseTemplate } from './base-template';

export interface ApplicantNotificationTemplateData {
  applicantName: string;
  caseType: 'wedding' | 'cleaning';
  referenceNumber?: string;
  locale?: 'he' | 'en';
}

export function getApplicantNotificationTemplate(
  data: ApplicantNotificationTemplateData
): {
  subject: string;
  html: string;
  text: string;
} {
  const locale = data.locale || 'he';
  const caseTypeLabel = {
    wedding: locale === 'en' ? 'wedding support' : 'תמיכה לחתונה',
    cleaning: locale === 'en' ? 'sick child support' : 'תמיכה לילד חולה',
  };

  if (locale === 'en') {
    const content = `
      <h2 style="color: #333; margin-bottom: 16px;">Hello ${data.applicantName},</h2>

      <p style="margin-bottom: 16px;">
        Thank you for submitting your request for ${caseTypeLabel[data.caseType]}.
      </p>

      <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; color: #555;">
          <strong>Your request has been received successfully</strong><br>
          ${data.referenceNumber ? `Reference number: <strong>${data.referenceNumber}</strong>` : ''}
        </p>
      </div>

      <h3 style="color: #333; margin: 24px 0 16px 0;">What happens next?</h3>

      <ol style="color: #555; line-height: 1.8; padding-right: 20px;">
        <li style="margin-bottom: 12px;">
          Our secretariat team will review your request
        </li>
        <li style="margin-bottom: 12px;">
          We will contact you if we need additional information
        </li>
        <li style="margin-bottom: 12px;">
          You will receive a response regarding the status of your request
        </li>
      </ol>

      <div style="background-color: #fff9e6; padding: 20px; border-radius: 8px; border-right: 4px solid #ffc107; margin: 24px 0;">
        <p style="margin: 0; color: #856404;">
          <strong>⏱ Processing Time:</strong><br>
          We aim to process requests within 5-7 business days.
        </p>
      </div>

      <p style="color: #666; margin-top: 24px;">
        If you have any questions, please don't hesitate to contact us.
      </p>

      <p style="margin-top: 32px; color: #555;">
        With blessings,<br>
        <strong>Simchat Zion Team</strong>
      </p>
    `;

    const text = `
Hello ${data.applicantName},

Thank you for submitting your request for ${caseTypeLabel[data.caseType]}.

Your request has been received successfully.
${data.referenceNumber ? `Reference number: ${data.referenceNumber}` : ''}

What happens next?

1. Our secretariat team will review your request
2. We will contact you if we need additional information
3. You will receive a response regarding the status of your request

Processing Time:
We aim to process requests within 5-7 business days.

If you have any questions, please don't hesitate to contact us.

With blessings,
Simchat Zion Team
    `.trim();

    return {
      subject: 'Your Request Has Been Received - Simchat Zion',
      html: getBaseTemplate({
        title: 'Request Received',
        content,
        locale: 'en',
        preheader: 'Thank you for submitting your request',
      }),
      text,
    };
  }

  // עברית (ברירת מחדל)
  const content = `
    <h2 style="color: #333; margin-bottom: 16px;">שלום ${data.applicantName},</h2>

    <p style="margin-bottom: 16px;">
      תודה על פנייתך לקבלת ${caseTypeLabel[data.caseType]}.
    </p>

    <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0; color: #555;">
        <strong>בקשתך התקבלה בהצלחה במערכת</strong><br>
        ${data.referenceNumber ? `מספר אסמכתא: <strong>${data.referenceNumber}</strong>` : ''}
      </p>
    </div>

    <h3 style="color: #333; margin: 24px 0 16px 0;">מה קורה עכשיו?</h3>

    <ol style="color: #555; line-height: 1.8; padding-right: 20px;">
      <li style="margin-bottom: 12px;">
        צוות המזכירות שלנו יבדוק את הבקשה
      </li>
      <li style="margin-bottom: 12px;">
        ניצור קשר במידה ונצטרך מידע נוסף
      </li>
      <li style="margin-bottom: 12px;">
        תקבל תשובה לגבי סטטוס הבקשה
      </li>
    </ol>

    <div style="background-color: #fff9e6; padding: 20px; border-radius: 8px; border-right: 4px solid #ffc107; margin: 24px 0;">
      <p style="margin: 0; color: #856404;">
        <strong>⏱ זמן טיפול:</strong><br>
        אנו שואפים לטפל בבקשות תוך 5-7 ימי עסקים.
      </p>
    </div>

    <p style="color: #666; margin-top: 24px;">
      אם יש לך שאלות, אנא אל תהסס לפנות אלינו.
    </p>

    <p style="margin-top: 32px; color: #555;">
      בברכה,<br>
      <strong>צוות שמחת ציון</strong>
    </p>
  `;

  const text = `
שלום ${data.applicantName},

תודה על פנייתך לקבלת ${caseTypeLabel[data.caseType]}.

בקשתך התקבלה בהצלחה במערכת.
${data.referenceNumber ? `מספר אסמכתא: ${data.referenceNumber}` : ''}

מה קורה עכשיו?

1. צוות המזכירות שלנו יבדוק את הבקשה
2. ניצור קשר במידה ונצטרך מידע נוסף
3. תקבל תשובה לגבי סטטוס הבקשה

זמן טיפול:
אנו שואפים לטפל בבקשות תוך 5-7 ימי עסקים.

אם יש לך שאלות, אנא אל תהסס לפנות אלינו.

בברכה,
צוות שמחת ציון
  `.trim();

  return {
    subject: 'בקשתך התקבלה - שמחת ציון',
    html: getBaseTemplate({
      title: 'בקשתך התקבלה',
      content,
      locale: 'he',
      preheader: 'תודה על פנייתך',
    }),
    text,
  };
}
