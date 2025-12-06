import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/applicants/stats
 *
 * מחזיר סטטיסטיקות של בקשות לפי סטטוס
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count by status
    const { data, error } = await supabase
      .from('applicants')
      .select('status');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stats', details: error.message },
        { status: 500 }
      );
    }

    // Calculate counts
    const stats = {
      pending: data?.filter((a) => a.status === 'pending_approval').length || 0,
      approved: data?.filter((a) => a.status === 'approved').length || 0,
      rejected: data?.filter((a) => a.status === 'rejected').length || 0,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
