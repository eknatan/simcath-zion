import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email/email-service';
import { getMonthlyRequestTemplate } from '@/lib/email/templates/monthly-request-template';

/**
 * API Route: POST /api/cleaning-cases/send-monthly-emails
 *
 * Send monthly request emails to selected families
 *
 * Body:
 * {
 *   recipients: [
 *     { case_id: string, email: string, family_name: string, child_name: string }
 *   ],
 *   language: 'he' | 'en',
 *   custom_body?: string
 * }
 *
 * Response:
 * {
 *   sent: number,
 *   failed: number,
 *   errors: Array<{ case_id: string, email: string, error: string }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { recipients, language = 'he', custom_body } = body;

    // Validate input
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients array is required' },
        { status: 400 }
      );
    }

    // Validate each recipient
    for (const recipient of recipients) {
      if (!recipient.case_id || !recipient.email || !recipient.family_name) {
        return NextResponse.json(
          { error: 'Each recipient must have case_id, email, and family_name' },
          { status: 400 }
        );
      }
    }

    // Get current month name for the email
    const currentDate = new Date();
    const monthNames = {
      he: [
        'ינואר',
        'פברואר',
        'מרץ',
        'אפריל',
        'מאי',
        'יוני',
        'יולי',
        'אוגוסט',
        'ספטמבר',
        'אוקטובר',
        'נובמבר',
        'דצמבר',
      ],
      en: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
    };

    const monthName =
      monthNames[language as 'he' | 'en'][currentDate.getMonth()];
    const year = currentDate.getFullYear();

    // Track results
    let sent = 0;
    let failed = 0;
    const errors: Array<{ case_id: string; email: string; error: string }> = [];

    // Send emails to each recipient
    for (const recipient of recipients) {
      try {
        // Generate email template
        const template = getMonthlyRequestTemplate({
          familyName: recipient.family_name,
          childName: recipient.child_name || '',
          month: monthName,
          year: year,
          locale: language as 'he' | 'en',
          customBody: custom_body,
        });

        // Send the email
        const result = await emailService.sendEmail(
          {
            to: recipient.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
          },
          {
            emailType: 'monthly_request',
            caseId: recipient.case_id,
            additionalData: {
              month: monthName,
              year: year,
              language: language,
            },
          }
        );

        if (result.success) {
          sent++;
        } else {
          failed++;
          errors.push({
            case_id: recipient.case_id,
            email: recipient.email,
            error: result.error || 'Unknown error',
          });
        }
      } catch (error) {
        failed++;
        errors.push({
          case_id: recipient.case_id,
          email: recipient.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      sent,
      failed,
      errors,
      total: recipients.length,
    });
  } catch (error) {
    console.error(
      'Unexpected error in POST /api/cleaning-cases/send-monthly-emails:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
