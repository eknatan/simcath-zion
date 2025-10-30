import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API Route: GET /api/cases
 *
 * Fetch all cases with optional filtering
 *
 * Query params:
 * - type: 'wedding' | 'cleaning' (optional) - filter by case type
 * - status: string (optional) - filter by status
 * - limit: number (optional) - limit results
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get query params
    const caseType = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    // Build query
    let query = supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (caseType) {
      query = query.eq('case_type', caseType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }

    // Execute query
    const { data: cases, error } = await query;

    if (error) {
      console.error('Error fetching cases:', error);
      return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
    }

    return NextResponse.json(cases);
  } catch (error) {
    console.error('Unexpected error in GET /api/cases:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
