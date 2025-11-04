/**
 * Request Created Email Template
 * תבנית מייל עבור יצירת בקשה חדשה (למזכירות)
 */

import { getBaseTemplate } from './base-template';

/**
 * Helper function to format wedding details table
 */
function getWeddingDetailsHTML(formData: any, locale: 'he' | 'en'): string {
  if (!formData || !formData.wedding_info) return '';

  const { wedding_info, groom_info, bride_info } = formData;

  if (locale === 'en') {
    return `
      <h3 style="color: #333; margin: 24px 0 16px 0;">Wedding Details:</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; width: 40%;">Hebrew Date</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${wedding_info.date_hebrew || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">Gregorian Date</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${wedding_info.date_gregorian || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">City</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${wedding_info.city || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">Venue</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${wedding_info.venue || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">Number of Guests</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${wedding_info.guests_count || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">Total Cost</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${wedding_info.total_cost ? '₪' + wedding_info.total_cost.toLocaleString() : 'N/A'}</td>
        </tr>
      </table>

      <h3 style="color: #333; margin: 24px 0 16px 0;">Groom Details:</h3>
      ${getPersonDetailsHTML(groom_info, 'en')}

      <h3 style="color: #333; margin: 24px 0 16px 0;">Bride Details:</h3>
      ${getPersonDetailsHTML(bride_info, 'en')}
    `;
  }

  // Hebrew
  return `
    <h3 style="color: #333; margin: 24px 0 16px 0; direction: rtl; text-align: right;">פרטי החתונה:</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; direction: rtl;">
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; width: 40%; text-align: right;">תאריך עברי</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${wedding_info.date_hebrew || 'לא צוין'}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">תאריך לועזי</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${wedding_info.date_gregorian || 'לא צוין'}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">עיר</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${wedding_info.city || 'לא צוין'}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">אולם</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${wedding_info.venue || 'לא צוין'}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">מספר מוזמנים</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${wedding_info.guests_count || 'לא צוין'}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">עלות כוללת</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${wedding_info.total_cost ? '₪' + wedding_info.total_cost.toLocaleString('he-IL') : 'לא צוין'}</td>
      </tr>
    </table>

    <h3 style="color: #333; margin: 24px 0 16px 0; direction: rtl; text-align: right;">פרטי החתן:</h3>
    ${getPersonDetailsHTML(groom_info, 'he')}

    <h3 style="color: #333; margin: 24px 0 16px 0; direction: rtl; text-align: right;">פרטי הכלה:</h3>
    ${getPersonDetailsHTML(bride_info, 'he')}
  `;
}

/**
 * Helper function to format person details table
 */
function getPersonDetailsHTML(person: any, locale: 'he' | 'en'): string {
  if (!person) return locale === 'en' ? '<p>No data provided</p>' : '<p>לא צוין</p>';

  if (locale === 'en') {
    return `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; width: 40%;">First Name</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${person.first_name || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">Last Name</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${person.last_name || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">ID Number</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${person.id || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">Email</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${person.email || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">Phone</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${person.phone || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">Address</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${person.address || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">City</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${person.city || 'N/A'}</td>
        </tr>
        ${person.school ? `
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">School</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${person.school}</td>
        </tr>
        ` : ''}
        ${person.father_name ? `
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">Father's Name</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${person.father_name}</td>
        </tr>
        ` : ''}
        ${person.father_occupation ? `
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">Father's Occupation</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${person.father_occupation}</td>
        </tr>
        ` : ''}
        ${person.mother_name ? `
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">Mother's Name</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${person.mother_name}</td>
        </tr>
        ` : ''}
        ${person.mother_occupation ? `
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">Mother's Occupation</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${person.mother_occupation}</td>
        </tr>
        ` : ''}
        ${person.memorial_day ? `
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">Memorial Day</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${person.memorial_day}</td>
        </tr>
        ` : ''}
        ${person.background ? `
        <tr>
          <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600;">Background</td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">${person.background}</td>
        </tr>
        ` : ''}
      </table>
    `;
  }

  // Hebrew
  return `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; direction: rtl;">
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; width: 40%; text-align: right;">שם פרטי</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${person.first_name || 'לא צוין'}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">שם משפחה</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${person.last_name || 'לא צוין'}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">תעודת זהות</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${person.id || 'לא צוין'}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">אימייל</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${person.email || 'לא צוין'}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">טלפון</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${person.phone || 'לא צוין'}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">כתובת</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${person.address || 'לא צוין'}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">עיר</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${person.city || 'לא צוין'}</td>
      </tr>
      ${person.school ? `
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">מוסד לימודים</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${person.school}</td>
      </tr>
      ` : ''}
      ${person.father_name ? `
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">שם האב</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${person.father_name}</td>
      </tr>
      ` : ''}
      ${person.father_occupation ? `
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">מקצוע האב</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${person.father_occupation}</td>
      </tr>
      ` : ''}
      ${person.mother_name ? `
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">שם האם</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${person.mother_name}</td>
      </tr>
      ` : ''}
      ${person.mother_occupation ? `
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">מקצוע האם</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${person.mother_occupation}</td>
      </tr>
      ` : ''}
      ${person.memorial_day ? `
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">יום הזיכרון</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${person.memorial_day}</td>
      </tr>
      ` : ''}
      ${person.background ? `
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">רקע</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">${person.background}</td>
      </tr>
      ` : ''}
    </table>
  `;
}

export interface CaseCreatedTemplateData {
  caseNumber: number | string;
  caseType: 'wedding' | 'cleaning';
  applicantName: string;
  applicantEmail?: string;
  applicantPhone?: string;
  caseUrl?: string;
  additionalInfo?: Record<string, any>;
  locale?: 'he' | 'en';
  fullFormData?: any; // Contains the complete form data (wedding_info, groom_info, bride_info)
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
        <h3 style="color: #667eea; margin: 0 0 8px 0;">New Request Created</h3>
        <p style="margin: 0; font-size: 18px; font-weight: 600;">
          Request #${data.caseNumber} - ${caseTypeLabel[data.caseType]}
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
            Request Type
          </td>
          <td style="padding: 12px; border: 1px solid #e0e0e0;">
            ${caseTypeLabel[data.caseType]}
          </td>
        </tr>
      </table>

      ${data.caseType === 'wedding' && data.fullFormData ? getWeddingDetailsHTML(data.fullFormData, 'en') : ''}

      <p style="color: #666; margin-top: 24px;">
        Please review the request and take the necessary action.
      </p>
    `;

    const text = `
New Request Created

Request #${data.caseNumber} - ${caseTypeLabel[data.caseType]}

Applicant Details:
- Name: ${data.applicantName}
${data.applicantEmail ? `- Email: ${data.applicantEmail}` : ''}
${data.applicantPhone ? `- Phone: ${data.applicantPhone}` : ''}
- Request Type: ${caseTypeLabel[data.caseType]}

${data.caseUrl ? `View request: ${data.caseUrl}` : ''}

Please review the request and take the necessary action.
    `.trim();

    return {
      subject: `New Request #${data.caseNumber} - ${caseTypeLabel[data.caseType]}`,
      html: getBaseTemplate({
        title: 'New Request Created',
        content,
        locale: 'en',
        preheader: `Request #${data.caseNumber} awaiting review`,
        ctaButton: data.caseUrl
          ? {
              text: 'View Request',
              url: data.caseUrl,
            }
          : undefined,
      }),
      text,
    };
  }

  // עברית (ברירת מחדל)
  const content = `
    <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; border-right: 4px solid #667eea; margin-bottom: 24px; direction: rtl;">
      <h3 style="color: #667eea; margin: 0 0 8px 0; text-align: right;">בקשה חדשה נוצרה במערכת</h3>
      <p style="margin: 0; font-size: 18px; font-weight: 600; text-align: right;">
        בקשה מספר ${data.caseNumber} - ${caseTypeLabel[data.caseType]}
      </p>
    </div>

    <h3 style="color: #333; margin-bottom: 16px; direction: rtl; text-align: right;">סיכום מהיר:</h3>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; direction: rtl;">
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; width: 40%; text-align: right;">
          שם מלא
        </td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">
          ${data.applicantName}
        </td>
      </tr>
      ${data.applicantEmail ? `
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">
          אימייל
        </td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">
          <a href="mailto:${data.applicantEmail}" style="color: #667eea;">${data.applicantEmail}</a>
        </td>
      </tr>
      ` : ''}
      ${data.applicantPhone ? `
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">
          טלפון
        </td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">
          <a href="tel:${data.applicantPhone}" style="color: #667eea;">${data.applicantPhone}</a>
        </td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e0e0e0; font-weight: 600; text-align: right;">
          סוג בקשה
        </td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;">
          ${caseTypeLabel[data.caseType]}
        </td>
      </tr>
    </table>

    ${data.caseType === 'wedding' && data.fullFormData ? getWeddingDetailsHTML(data.fullFormData, 'he') : ''}

    <p style="color: #666; margin-top: 24px; direction: rtl; text-align: right;">
      עכשיו צריך לאשר את הבקשה כדי שזה ייכנס למערכת
    </p>
  `;

  const text = `
בקשה חדשה נוצרה במערכת

בקשה מספר ${data.caseNumber} - ${caseTypeLabel[data.caseType]}

פרטי המבקש:
- שם מלא: ${data.applicantName}
${data.applicantEmail ? `- אימייל: ${data.applicantEmail}` : ''}
${data.applicantPhone ? `- טלפון: ${data.applicantPhone}` : ''}
- סוג בקשה: ${caseTypeLabel[data.caseType]}

${data.caseUrl ? `צפייה בבקשה: ${data.caseUrl}` : ''}

עכשיו צריך לאשר את הבקשה כדי שזה ייכנס למערכת
  `.trim();

  return {
    subject: `בקשה חדשה #${data.caseNumber} - ${caseTypeLabel[data.caseType]}`,
    html: getBaseTemplate({
      title: 'בקשה חדשה נוצרה',
      content,
      locale: 'he',
      preheader: `בקשה #${data.caseNumber} ממתינה לבדיקה`,
      ctaButton: data.caseUrl
        ? {
            text: 'צפה בבקשה',
            url: data.caseUrl,
          }
        : undefined,
    }),
    text,
  };
}
