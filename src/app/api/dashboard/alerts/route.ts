import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Parallel queries for different alert types
    const [
      weddingsNeedingTransferResult,
      pendingApplicantsResult,
    ] = await Promise.all([
      // Weddings within 7 days that are not yet transferred
      supabase
        .from('cases')
        .select(`
          id,
          case_number,
          wedding_date_gregorian,
          groom_first_name,
          bride_first_name,
          status
        `)
        .eq('case_type', 'wedding')
        .eq('status', 'new')
        .gte('wedding_date_gregorian', today.toISOString().split('T')[0])
        .lte('wedding_date_gregorian', sevenDaysFromNow.toISOString().split('T')[0])
        .order('wedding_date_gregorian', { ascending: true })
        .limit(5),

      // Pending applicants waiting for approval
      supabase
        .from('applicants')
        .select(`
          id,
          case_type,
          created_at,
          form_data
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(5),
    ]);

    const alerts = [];

    // Add wedding alerts
    if (weddingsNeedingTransferResult.data) {
      for (const wedding of weddingsNeedingTransferResult.data) {
        if (!wedding.wedding_date_gregorian) continue;
        const weddingDate = new Date(wedding.wedding_date_gregorian);
        const daysUntil = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        alerts.push({
          id: `wedding-${wedding.id}`,
          type: 'wedding_needs_transfer',
          priority: daysUntil <= 3 ? 'high' : 'medium',
          title: `חתונה בעוד ${daysUntil} ימים ללא העברה`,
          description: `${wedding.groom_first_name || ''} & ${wedding.bride_first_name || ''} - תיק #${wedding.case_number}`,
          caseId: wedding.id,
          caseNumber: wedding.case_number,
        });
      }
    }

    // Add pending applicants alerts
    if (pendingApplicantsResult.data) {
      for (const applicant of pendingApplicantsResult.data) {
        if (!applicant.created_at) continue;
        const createdAt = new Date(applicant.created_at);
        const daysPending = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

        alerts.push({
          id: `applicant-${applicant.id}`,
          type: 'pending_applicant',
          priority: daysPending > 3 ? 'high' : 'low',
          title: `בקשה ממתינה ${daysPending} ימים`,
          description: `${applicant.case_type === 'wedding' ? 'חתונה' : 'ילד חולה'}`,
          applicantId: applicant.id,
        });
      }
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    alerts.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);

    return NextResponse.json(alerts.slice(0, 10));
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
