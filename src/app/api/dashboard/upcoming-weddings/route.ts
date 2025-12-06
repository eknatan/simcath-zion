import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get today and 7 days from now
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Fetch upcoming weddings in the next 7 days
    const { data: weddings, error } = await supabase
      .from('cases')
      .select(`
        id,
        case_number,
        wedding_date_gregorian,
        wedding_date_hebrew,
        groom_first_name,
        groom_last_name,
        bride_first_name,
        bride_last_name,
        city,
        status
      `)
      .eq('case_type', 'wedding')
      .neq('status', 'rejected')
      .neq('status', 'expired')
      .gte('wedding_date_gregorian', today.toISOString().split('T')[0])
      .lte('wedding_date_gregorian', nextWeek.toISOString().split('T')[0])
      .order('wedding_date_gregorian', { ascending: true })
      .limit(10);

    if (error) {
      throw error;
    }

    // Calculate days until wedding
    const weddingsWithCountdown = weddings?.filter(w => w.wedding_date_gregorian).map(wedding => {
      const weddingDate = new Date(wedding.wedding_date_gregorian!);
      const diffTime = weddingDate.getTime() - today.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...wedding,
        daysUntil,
        coupleName: `${wedding.groom_first_name || ''} ${wedding.groom_last_name || ''} & ${wedding.bride_first_name || ''} ${wedding.bride_last_name || ''}`.replace(/\s+/g, ' ').trim() || `תיק #${wedding.case_number}`,
      };
    }) || [];

    return NextResponse.json(weddingsWithCountdown);
  } catch (error) {
    console.error('Error fetching upcoming weddings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming weddings' },
      { status: 500 }
    );
  }
}
