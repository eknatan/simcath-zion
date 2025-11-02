import { NextResponse } from 'next/server';

/**
 * GET /api/exchange-rates/boi
 *
 * Fetch current USD/ILS exchange rates from Bank of Israel
 * Returns representative rate, buy rate, and sell rate
 *
 * Data source: Bank of Israel daily currency rates XML
 * Updates: Daily (once per business day)
 *
 * @returns {
 *   representative: number; // שער יציג
 *   buy: number;           // שער קנייה (הבנק קונה דולר, אתה מוכר דולר)
 *   sell: number;          // שער מכירה (הבנק מוכר דולר, אתה קונה דולר)
 *   timestamp: string;
 * }
 */
export async function GET() {
  try {
    // Fetch JSON from Bank of Israel (new API)
    const response = await fetch('https://boi.org.il/PublicApi/GetExchangeRates', {
      next: {
        revalidate: 3600, // Cache for 1 hour (rates update once daily)
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch from Bank of Israel:', response.statusText);
      return NextResponse.json(
        { message: 'Failed to fetch rates from Bank of Israel', error: response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Find USD in the exchange rates array
    const usdRate = data.exchangeRates?.find((rate: any) => rate.key === 'USD');

    if (!usdRate || !usdRate.currentExchangeRate) {
      console.error('USD rate not found in BOI response');
      return NextResponse.json(
        { message: 'USD rates not found in Bank of Israel response' },
        { status: 404 }
      );
    }

    const representative = parseFloat(usdRate.currentExchangeRate);

    if (isNaN(representative) || representative <= 0) {
      console.error('Invalid rate value:', usdRate.currentExchangeRate);
      return NextResponse.json(
        { message: 'Invalid rate value from Bank of Israel' },
        { status: 500 }
      );
    }

    // Calculate buy and sell rates
    // Bank of Israel doesn't provide these directly in the daily XML
    // Typical commercial bank spread is around 1.5-2% from the representative rate
    // Buy rate: Lower (bank buys foreign currency from you at lower rate)
    // Sell rate: Higher (bank sells foreign currency to you at higher rate)
    const spread = 0.015; // 1.5% typical spread
    const buy = representative * (1 - spread);
    const sell = representative * (1 + spread);

    return NextResponse.json({
      representative: parseFloat(representative.toFixed(4)),
      buy: parseFloat(buy.toFixed(4)),
      sell: parseFloat(sell.toFixed(4)),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /api/exchange-rates/boi:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
