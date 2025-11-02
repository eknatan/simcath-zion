import { NextRequest, NextResponse } from 'next/server';
import { translateBranchNameToHebrew, translateCityToHebrew } from '@/lib/data/israeli-banks-he';

/**
 * GET /api/banks/[bankCode]/branches
 *
 * Fetch all branches for a specific bank from data.gov.il
 * Supports locale parameter for Hebrew translations
 *
 * @param request - Next.js request object (supports ?locale=he|en)
 * @param params - Route params containing bank code
 * @returns Array of branches for the specified bank
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bankCode: string }> }
) {
  try {
    const { bankCode } = await params;
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'he';

    // Validate bank code
    if (!bankCode) {
      return NextResponse.json(
        { message: 'Bank code is required' },
        { status: 400 }
      );
    }

    // Fetch branches from data.gov.il CKAN API
    const response = await fetch(
      'https://data.gov.il/api/3/action/datastore_search?' +
        new URLSearchParams({
          resource_id: '1c5bc716-8210-4ec7-85be-92e6271955c2',
          limit: '1000',
          filters: JSON.stringify({ Bank_Code: bankCode }),
          sort: 'Branch_Code',
        }),
      {
        next: {
          revalidate: 86400, // Cache for 24 hours (data updates daily)
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch branches from data.gov.il:', response.statusText);
      return NextResponse.json(
        { message: 'Failed to fetch branches data', error: response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.success || !data.result || !data.result.records) {
      return NextResponse.json(
        { message: 'Invalid response from data.gov.il' },
        { status: 500 }
      );
    }

    // Translate branch names and cities if locale is Hebrew
    const branches = data.result.records.map((record: any) => {
      if (locale === 'he') {
        return {
          ...record,
          Branch_Name: translateBranchNameToHebrew(record.Branch_Name) || record.Branch_Name,
          City: translateCityToHebrew(record.City) || record.City,
        };
      }
      return record;
    });

    // Return the branches list
    return NextResponse.json(branches);
  } catch (error) {
    console.error('Error in GET /api/banks/[bankCode]/branches:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
