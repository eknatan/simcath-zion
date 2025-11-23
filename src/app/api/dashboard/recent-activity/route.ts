import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch recent case_history entries
    const { data: activities, error } = await supabase
      .from('case_history')
      .select(`
        id,
        case_id,
        field_changed,
        old_value,
        new_value,
        note,
        changed_at,
        changed_by,
        cases (
          case_number,
          case_type,
          groom_first_name,
          bride_first_name,
          family_name
        )
      `)
      .order('changed_at', { ascending: false })
      .limit(15);

    if (error) {
      throw error;
    }

    // Transform activities to readable format
    const formattedActivities = activities?.map(activity => {
      const caseData = activity.cases as {
        case_number: number;
        case_type: string;
        groom_first_name?: string;
        bride_first_name?: string;
        family_name?: string;
      } | null;

      // Generate activity description based on field_changed
      let action = 'עדכון';
      let description = '';

      if (activity.field_changed === 'status') {
        action = 'שינוי סטטוס';
        description = `${activity.old_value || 'חדש'} → ${activity.new_value}`;
      } else if (activity.field_changed === 'payment_created') {
        action = 'תשלום חדש';
        description = activity.note || '';
      } else if (activity.field_changed === 'file_uploaded') {
        action = 'העלאת קובץ';
        description = activity.note || '';
      } else if (activity.field_changed === 'case_created') {
        action = 'תיק נפתח';
        description = '';
      } else if (activity.note) {
        description = activity.note;
      }

      // Get case name
      let caseName = `תיק #${caseData?.case_number || 'N/A'}`;
      if (caseData?.case_type === 'wedding' && caseData.groom_first_name) {
        caseName = `${caseData.groom_first_name} & ${caseData.bride_first_name || ''}`;
      } else if (caseData?.case_type === 'cleaning' && caseData.family_name) {
        caseName = `משפחת ${caseData.family_name}`;
      }

      return {
        id: activity.id,
        action,
        description,
        caseName,
        caseId: activity.case_id,
        caseNumber: caseData?.case_number,
        caseType: caseData?.case_type,
        timestamp: activity.changed_at,
      };
    }) || [];

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}
