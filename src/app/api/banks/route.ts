import { NextRequest, NextResponse } from 'next/server';
import { BANK_NAMES_HE } from '@/lib/data/israeli-banks-he';

/**
 * GET /api/banks
 *
 * Fetch all banks from data.gov.il
 * Returns unique list of banks with their codes and names
 * Supports locale parameter for Hebrew translations
 *
 * @param request - Next.js request object (supports ?locale=he|en)
 * @returns Array of banks with Bank_Code and Bank_Name
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'he';

    // Fetch all branches from data.gov.il CKAN API
    const response = await fetch(
      'https://data.gov.il/api/3/action/datastore_search?' +
        new URLSearchParams({
          resource_id: '1c5bc716-8210-4ec7-85be-92e6271955c2',
          limit: '2000', // Fetch all records
        }),
      {
        next: {
          revalidate: 86400, // Cache for 24 hours (data updates daily)
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch data from data.gov.il:', response.statusText);
      return NextResponse.json(
        { message: 'Failed to fetch banks data', error: response.statusText },
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

    // Extract unique banks and sort by name
    const banksMap = new Map<string, { Bank_Code: string; Bank_Name: string }>();

    data.result.records.forEach((record: any) => {
      if (record.Bank_Code && record.Bank_Name) {
        const bankCode = String(record.Bank_Code);
        const bankName = locale === 'he' && BANK_NAMES_HE[bankCode]
          ? BANK_NAMES_HE[bankCode]
          : record.Bank_Name;

        banksMap.set(bankCode, {
          Bank_Code: bankCode,
          Bank_Name: bankName,
        });
      }
    });

    const banks = Array.from(banksMap.values()).sort((a, b) =>
      a.Bank_Name.localeCompare(b.Bank_Name, locale === 'he' ? 'he' : 'en')
    );

    return NextResponse.json(banks);
  } catch (error) {
    console.error('Error in GET /api/banks:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
