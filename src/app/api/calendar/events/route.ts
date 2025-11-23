import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { HDate } from '@hebcal/core';
import type { CalendarEvent } from '@/components/calendar/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Missing month or year parameter' },
        { status: 400 }
      );
    }

    const hebrewMonth = parseInt(month, 10);
    const hebrewYear = parseInt(year, 10);

    if (isNaN(hebrewMonth) || isNaN(hebrewYear)) {
      return NextResponse.json(
        { error: 'Invalid month or year parameter' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch wedding cases with structured Hebrew date fields
    const { data: cases, error } = await supabase
      .from('cases')
      .select(`
        id,
        case_number,
        hebrew_day,
        hebrew_month,
        hebrew_year,
        wedding_date_hebrew,
        wedding_date_gregorian,
        groom_first_name,
        bride_first_name,
        status
      `)
      .eq('case_type', 'wedding')
      .neq('status', 'rejected')
      // Filter by Hebrew month/year directly in the query (much more efficient!)
      .eq('hebrew_month', hebrewMonth)
      .eq('hebrew_year', hebrewYear);

    if (error) {
      console.error('Error fetching calendar events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch calendar events' },
        { status: 500 }
      );
    }

    // Transform cases to calendar events
    const events: CalendarEvent[] = [];

    for (const caseData of cases || []) {
      // Skip if no structured date
      if (!caseData.hebrew_day || !caseData.hebrew_month || !caseData.hebrew_year) {
        continue;
      }

      // Get Gregorian date for display
      let gregorianDate: Date;
      if (caseData.wedding_date_gregorian) {
        gregorianDate = new Date(caseData.wedding_date_gregorian);
      } else {
        try {
          const hdate = new HDate(caseData.hebrew_day, caseData.hebrew_month, caseData.hebrew_year);
          gregorianDate = hdate.greg();
        } catch {
          continue;
        }
      }

      // Format Hebrew date for display
      let hebrewDateStr: string;
      try {
        const hdate = new HDate(caseData.hebrew_day, caseData.hebrew_month, caseData.hebrew_year);
        hebrewDateStr = hdate.render('he');
      } catch {
        hebrewDateStr = caseData.wedding_date_hebrew || '';
      }

      const groomName = caseData.groom_first_name || '';
      const brideName = caseData.bride_first_name || '';
      const title = `${groomName} & ${brideName}`.trim() || 'חתונה';

      events.push({
        id: caseData.id,
        type: 'wedding',
        title,
        titleEn: title,
        hebrewDate: hebrewDateStr,
        hebrewDay: caseData.hebrew_day,
        gregorianDate,
        status: caseData.status,
        caseNumber: caseData.case_number,
      });
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Calendar events API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
