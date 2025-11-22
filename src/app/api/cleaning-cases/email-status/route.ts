import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API Route: GET /api/cleaning-cases/email-status
 *
 * Fetch active cleaning cases with their last monthly email sent date
 *
 * Returns array of cases with:
 * - case_id
 * - family_name
 * - child_name
 * - contact_email
 * - contact_phone
 * - last_email_sent (date or null)
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get current month start for checking if email was sent this month
    const currentDate = new Date();
    const monthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    // Fetch active cleaning cases
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select(
        `
        id,
        family_name,
        child_name,
        contact_email,
        contact_phone
      `
      )
      .eq('case_type', 'cleaning')
      .eq('status', 'active')
      .order('family_name', { ascending: true });

    if (casesError) {
      console.error('Error fetching cleaning cases:', casesError);
      return NextResponse.json(
        { error: 'Failed to fetch cleaning cases' },
        { status: 500 }
      );
    }

    if (!cases || cases.length === 0) {
      return NextResponse.json([]);
    }

    // Get the last email sent for each case (monthly_request type)
    const caseIds = cases.map((c) => c.id);

    const { data: emailLogs, error: emailError } = await supabase
      .from('email_logs')
      .select('case_id, sent_at')
      .in('case_id', caseIds)
      .eq('email_type', 'monthly_request')
      .eq('status', 'sent')
      .order('sent_at', { ascending: false });

    if (emailError) {
      console.error('Error fetching email logs:', emailError);
      // Continue without email data rather than failing
    }

    // Create a map of case_id -> last email sent
    const lastEmailMap = new Map<string, Date>();
    emailLogs?.forEach((log) => {
      // Only keep the most recent email for each case
      if (log.case_id && log.sent_at && !lastEmailMap.has(log.case_id)) {
        lastEmailMap.set(log.case_id, new Date(log.sent_at));
      }
    });

    // Combine cases with email status
    const casesWithEmailStatus = cases.map((caseItem) => {
      const lastEmailSent = lastEmailMap.get(caseItem.id);
      const sentThisMonth =
        lastEmailSent && lastEmailSent >= monthStart ? true : false;

      return {
        case_id: caseItem.id,
        family_name: caseItem.family_name,
        child_name: caseItem.child_name,
        contact_email: caseItem.contact_email,
        contact_phone: caseItem.contact_phone,
        last_email_sent: lastEmailSent?.toISOString() || null,
        sent_this_month: sentThisMonth,
      };
    });

    return NextResponse.json(casesWithEmailStatus);
  } catch (error) {
    console.error(
      'Unexpected error in GET /api/cleaning-cases/email-status:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
