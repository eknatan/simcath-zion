/**
 * API Route: Send Email
 * נתיב API מאובטח לשליחת אימיילים
 * כולל: אימות, ולידציה, logging, ותמיכה ב-attachments/cc/bcc
 */

import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email/email-service';
import { getWelcomeTemplate } from '@/lib/email/templates/welcome-template';
import { getCaseCreatedTemplate } from '@/lib/email/templates/case-created-template';
import { getApplicantNotificationTemplate } from '@/lib/email/templates/applicant-notification-template';
import { sendEmailRequestSchema } from '@/lib/email/validation';
import { checkEmailApiAuth, canSendEmail } from '@/lib/email/auth-middleware';
import { getSecretaryEmails } from '@/lib/email/config';
import { isAllowedAttachmentType } from '@/lib/email/utils';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  console.log('📧 [EMAIL API] POST request received');

  try {
    // 1. בדיקת הרשאות
    console.log('📧 [EMAIL API] Checking authentication...');
    const authResult = await checkEmailApiAuth(request);
    console.log('📧 [EMAIL API] Auth result:', {
      authorized: authResult.authorized,
      userId: authResult.userId,
      userRole: authResult.userRole,
      error: authResult.error
    });

    if (!authResult.authorized) {
      console.error('❌ [EMAIL API] Authentication failed:', authResult.error);
      return NextResponse.json(
        {
          success: false,
          error: authResult.error || 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // 2. בדיקה אם למשתמש יש הרשאה לשלוח מיילים
    console.log('📧 [EMAIL API] Checking send permission for role:', authResult.userRole);
    if (!canSendEmail(authResult.userRole)) {
      console.error('❌ [EMAIL API] Insufficient permissions for role:', authResult.userRole);
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions to send emails',
        },
        { status: 403 }
      );
    }

    // 3. קריאת גוף הבקשה
    const body = await request.json();
    console.log('📧 [EMAIL API] Request body type:', body.type, 'locale:', body.locale);

    // 4. ולידציה עם Zod
    let validatedData;
    try {
      validatedData = sendEmailRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: error.issues,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // 4.5 ולידציה נוספת: בדיקת קבצים מצורפים
    if (validatedData.attachments && validatedData.attachments.length > 0) {
      // בדיקת מספר קבצים מקסימלי
      const MAX_ATTACHMENTS = 10;
      if (validatedData.attachments.length > MAX_ATTACHMENTS) {
        return NextResponse.json(
          {
            success: false,
            error: `Too many attachments. Maximum ${MAX_ATTACHMENTS} files allowed.`,
          },
          { status: 400 }
        );
      }

      // בדיקת סוג קבצים
      for (const attachment of validatedData.attachments) {
        if (!isAllowedAttachmentType(attachment.filename)) {
          return NextResponse.json(
            {
              success: false,
              error: `File type not allowed: ${attachment.filename}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // 5. הכנת תוכן המייל לפי סוג
    let emailContent: { subject: string; html: string; text: string };
    let emailType: string;
    let caseId: string | undefined;

    switch (validatedData.type) {
      case 'welcome':
        emailContent = getWelcomeTemplate({
          userName: validatedData.data.userName,
          userEmail: validatedData.data.userEmail,
          loginUrl: validatedData.data.loginUrl,
          locale: validatedData.locale || validatedData.data.locale,
        });
        emailType = 'welcome';
        break;

      case 'case-created': {
        console.log('📧 [EMAIL API] Processing case-created email');
        console.log('📧 [EMAIL API] Case data:', {
          caseNumber: validatedData.data.caseNumber,
          caseType: validatedData.data.caseType,
          applicantEmail: validatedData.data.applicantEmail,
          applicantPhone: validatedData.data.applicantPhone
        });

        // ברירת מחדל: שליחה למזכירות אם לא צוין יעד
        let recipients = validatedData.to;

        if (!recipients) {
          console.log('📧 [EMAIL API] No recipients specified, fetching secretary emails...');
          // אם לא צוינו נמענים, נשתמש במזכירות מ-DB
          const secretaryEmailsList = await getSecretaryEmails();
          console.log('📧 [EMAIL API] Secretary emails found:', secretaryEmailsList);

          if (secretaryEmailsList.length === 0) {
            console.error('❌ [EMAIL API] No secretary emails configured!');
            return NextResponse.json(
              {
                success: false,
                error:
                  'No recipients specified and no secretary emails configured',
              },
              { status: 400 }
            );
          }
          recipients = secretaryEmailsList;
        }

        console.log('📧 [EMAIL API] Final recipients:', recipients);

        emailContent = getCaseCreatedTemplate({
          caseNumber: validatedData.data.caseNumber,
          caseType: validatedData.data.caseType,
          applicantName: validatedData.data.applicantName,
          applicantEmail: validatedData.data.applicantEmail,
          applicantPhone: validatedData.data.applicantPhone,
          caseUrl: validatedData.data.caseUrl,
          fullFormData: validatedData.data.fullFormData, // Pass full form data for detailed email
          locale: validatedData.locale || validatedData.data.locale,
        });

        // הגדרת הנמענים הסופיים
        validatedData.to = recipients;

        emailType = 'case-created';

        // חילוץ caseId - אם יש caseUrl, ננסה לחלץ, אחרת null
        if (validatedData.data.caseUrl) {
          // ננסה לחלץ UUID מה-URL (פורמט: /cases/{uuid})
          const urlParts = validatedData.data.caseUrl.split('/');
          const lastPart = urlParts[urlParts.length - 1];
          // בדיקה אם זה UUID (פורמט בסיסי)
          caseId = lastPart.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
            ? lastPart
            : undefined;
        }

        break;
      }

      case 'applicant-notification':
        emailContent = getApplicantNotificationTemplate({
          applicantName: validatedData.data.applicantName,
          caseType: validatedData.data.caseType,
          referenceNumber: validatedData.data.referenceNumber,
          locale: validatedData.locale || validatedData.data.locale,
        });
        emailType = 'applicant-notification';
        break;

      case 'custom':
        emailContent = {
          subject: validatedData.subject,
          html: validatedData.html,
          text: validatedData.text || '',
        };
        emailType = 'custom';
        break;
    }

    // 6. שליחת המייל
    // Ensure 'to' is defined (it should be set for all email types by now)
    if (!validatedData.to) {
      console.error('❌ [EMAIL API] No recipients specified after validation');
      return NextResponse.json(
        {
          success: false,
          error: 'No recipients specified',
        },
        { status: 400 }
      );
    }

    console.log('📧 [EMAIL API] Sending email via emailService...');
    console.log('📧 [EMAIL API] Email details:', {
      to: validatedData.to,
      subject: emailContent.subject,
      emailType,
      locale: validatedData.locale
    });

    const result = await emailService.sendEmail(
      {
        to: validatedData.to,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        cc: validatedData.cc,
        bcc: validatedData.bcc,
        replyTo: validatedData.replyTo,
        attachments: validatedData.attachments,
        locale: validatedData.locale,
      },
      {
        emailType,
        caseId,
        additionalData: {
          sentBy: authResult.userId,
          sentByRole: authResult.userRole,
          requestedAt: new Date().toISOString(),
        },
      }
    );

    // 7. החזרת תוצאה
    console.log('📧 [EMAIL API] Email send result:', result);

    if (result.success) {
      console.log('✅ [EMAIL API] Email sent successfully, messageId:', result.messageId);
      return NextResponse.json(
        {
          success: true,
          messageId: result.messageId,
          message: 'Email sent successfully',
        },
        { status: 200 }
      );
    } else {
      console.error('❌ [EMAIL API] Failed to send email:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in /api/email/send:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 * תמיכה בשני מצבים:
 * 1. Basic check (ללא אימות) - מחזיר סטטוס בסיסי
 * 2. Detailed check (עם אימות) - מחזיר מידע מפורט
 */
export async function GET(request: NextRequest) {
  try {
    // בדיקה אם זו בקשת health check פשוטה (לניטור)
    const detailedCheck = request.nextUrl.searchParams.get('detailed') === 'true';

    if (detailedCheck) {
      // בדיקת הרשאות למידע מפורט
      const authResult = await checkEmailApiAuth(request);

      if (!authResult.authorized) {
        return NextResponse.json(
          {
            status: 'unauthorized',
            error: authResult.error,
          },
          { status: 401 }
        );
      }

      // בדיקת תקינות מפורטת
      const isHealthy = await emailService.healthCheck();

      return NextResponse.json(
        {
          status: isHealthy ? 'healthy' : 'unhealthy',
          service: 'email',
          timestamp: new Date().toISOString(),
          config: {
            host: process.env.MAIL_HOST || 'not configured',
            port: process.env.MAIL_PORT || 'not configured',
            user: process.env.MAIL_USER ? 'configured' : 'not configured',
          },
        },
        { status: isHealthy ? 200 : 503 }
      );
    }

    // בדיקת health check בסיסית (ללא אימות)
    // רק בודק שהשירות עובד, ללא חשיפת מידע רגיש
    const isHealthy = await emailService.healthCheck();

    return NextResponse.json(
      {
        status: isHealthy ? 'ok' : 'error',
        service: 'email',
        timestamp: new Date().toISOString(),
      },
      { status: isHealthy ? 200 : 503 }
    );
  } catch (error) {
    console.error('❌ Error in email health check:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
