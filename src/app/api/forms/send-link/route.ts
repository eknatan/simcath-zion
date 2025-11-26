/**
 * API Route: /api/forms/send-link
 *
 * שולח קישור לטופס במייל
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק שליחת מייל עם קישור
 * - Dependency Inversion: משתמש ב-emailService
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { emailService } from '@/lib/email/email-service';
import { createClient } from '@/lib/supabase/server';

// Request validation schema
const sendLinkSchema = z.object({
  recipientEmail: z.string().email('Invalid email address'),
  recipientName: z.string().min(2).optional(),
  customMessage: z.string().optional(),
  formType: z.enum(['wedding', 'sick-children']),
  formUrl: z.string().url('Invalid URL'),
});

// Form type labels for email
const formTypeLabels = {
  he: {
    wedding: 'טופס בקשת תמיכה לחתונה',
    'sick-children': 'טופס בקשת תמיכה לילדים חולים',
  },
  en: {
    wedding: 'Wedding Support Request Form',
    'sick-children': 'Sick Children Support Request Form',
  },
};

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validationResult = sendLinkSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { recipientEmail, recipientName, customMessage, formType, formUrl } =
      validationResult.data;

    // Build email content (RTL Hebrew)
    const formLabel = formTypeLabels.he[formType];
    const greeting = recipientName ? `שלום ${recipientName},` : 'שלום,';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.8;
            color: #1a1a1a;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
            direction: rtl;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 32px 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 32px 24px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 16px;
          }
          .message {
            margin-bottom: 24px;
            color: #4a4a4a;
          }
          .custom-message {
            background: #f8fafc;
            border-right: 4px solid #2563eb;
            padding: 16px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .button-container {
            text-align: center;
            margin: 32px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white !important;
            text-decoration: none;
            padding: 16px 48px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .footer {
            background: #f8fafc;
            padding: 24px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .footer p {
            margin: 4px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>שמחת ציון - ${formLabel}</h1>
          </div>
          <div class="content">
            <p class="greeting">${greeting}</p>
            <p class="message">
              הנכם מוזמנים למלא את ${formLabel}.
            </p>
            ${
              customMessage
                ? `<div class="custom-message"><strong>הערה:</strong><br>${customMessage}</div>`
                : ''
            }
            <p class="message">
              לחצו על הכפתור למטה כדי לעבור לטופס:
            </p>
            <div class="button-container">
              <a href="${formUrl}" class="button">מעבר לטופס</a>
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              אם הכפתור לא עובד, העתיקו את הקישור הבא לדפדפן:
              <br>
              <a href="${formUrl}" style="color: #2563eb; word-break: break-all;">${formUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p><strong>שמחת ציון</strong></p>
            <p>מערכת תמיכה למשפחות</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
${greeting}

הנכם מוזמנים למלא את ${formLabel}.

${customMessage ? `הערה: ${customMessage}\n` : ''}
לחצו על הקישור הבא כדי לעבור לטופס:
${formUrl}

בברכה,
שמחת ציון - מערכת תמיכה למשפחות
    `.trim();

    // Send email
    const result = await emailService.sendEmail(
      {
        to: {
          email: recipientEmail,
          name: recipientName,
        },
        subject: `שמחת ציון - ${formLabel}`,
        html: htmlContent,
        text: textContent,
      },
      {
        emailType: 'form_link',
        additionalData: {
          formType,
          sentBy: user.id,
        },
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Error in send-link API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
