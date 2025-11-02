/**
 * Currency Service
 *
 * Handles currency conversion and exchange rate fetching.
 * Supports multiple exchange rate providers with fallback.
 *
 * Features:
 * - Fetch current USD/ILS exchange rate
 * - Multiple providers (Bank of Israel, ExchangeRate-API)
 * - Automatic fallback on failure
 * - Caching to reduce API calls
 * - Error handling
 *
 * @module currency.service
 */

interface ExchangeRate {
  rate: number;
  source: 'boi' | 'exchangerate-api' | 'manual';
  timestamp: Date;
}

export interface BankOfIsraelRates {
  representative: number; // שער יציג
  buy: number; // שער קנייה של הבנק (הבנק קונה מטבע חוץ)
  sell: number; // שער מכירה של הבנק (הבנק מוכר מטבע חוץ)
  timestamp: Date;
}

interface ExchangeRateCache {
  rate: number;
  source: string;
  expiresAt: number;
}

// Cache for 1 hour
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
let exchangeRateCache: ExchangeRateCache | null = null;

/**
 * Fetch exchange rate from Bank of Israel API
 * Uses the new Bank of Israel public API (JSON format)
 */
async function fetchFromBankOfIsrael(): Promise<number | null> {
  try {
    // Bank of Israel new public API endpoint
    const url = 'https://boi.org.il/PublicApi/GetExchangeRates';

    const response = await fetch(url);

    if (!response.ok) {
      console.warn('Bank of Israel API failed:', response.statusText);
      return null;
    }

    const data = await response.json();

    // Find USD in the exchange rates array
    const usdRate = data?.exchangeRates?.find((rate: any) => rate.key === 'USD');

    if (usdRate?.currentExchangeRate) {
      const rate = parseFloat(usdRate.currentExchangeRate);
      if (!isNaN(rate) && rate > 0) {
        return rate;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching from Bank of Israel:', error);
    return null;
  }
}

/**
 * Fetch detailed exchange rates from Bank of Israel
 * Returns representative, buy, and sell rates for USD/ILS
 *
 * Uses internal API route to handle XML parsing on the server
 *
 * @example
 * ```typescript
 * const rates = await getBankOfIsraelRates();
 * if (rates) {
 *   console.log('Representative:', rates.representative);
 *   console.log('Buy (bank buys USD):', rates.buy);
 *   console.log('Sell (bank sells USD):', rates.sell);
 * }
 * ```
 */
export async function getBankOfIsraelRates(): Promise<BankOfIsraelRates | null> {
  try {
    const response = await fetch('/api/exchange-rates/boi');

    if (!response.ok) {
      console.warn('Bank of Israel rates API failed:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.representative || !data.buy || !data.sell) {
      console.warn('Invalid response structure from BOI API');
      return null;
    }

    return {
      representative: data.representative,
      buy: data.buy,
      sell: data.sell,
      timestamp: new Date(data.timestamp),
    };
  } catch (error) {
    console.error('Error fetching Bank of Israel detailed rates:', error);
    return null;
  }
}

/**
 * Fetch exchange rate from ExchangeRate-API
 * Free tier: 1,500 requests/month
 */
async function fetchFromExchangeRateAPI(): Promise<number | null> {
  try {
    const url = 'https://api.exchangerate-api.com/v4/latest/USD';

    const response = await fetch(url);

    if (!response.ok) {
      console.warn('ExchangeRate-API failed:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (data?.rates?.ILS) {
      const rate = parseFloat(data.rates.ILS);
      if (!isNaN(rate) && rate > 0) {
        return rate;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching from ExchangeRate-API:', error);
    return null;
  }
}

/**
 * Get current USD/ILS exchange rate
 *
 * Tries multiple sources:
 * 1. Cache (if valid)
 * 2. Bank of Israel API
 * 3. ExchangeRate-API (fallback)
 * 4. Manual default (fallback)
 *
 * @returns Promise<ExchangeRate>
 *
 * @example
 * ```typescript
 * const { rate, source } = await getExchangeRate();
 * console.log(`1 USD = ${rate} ILS (source: ${source})`);
 * ```
 */
export async function getExchangeRate(): Promise<ExchangeRate> {
  // Check cache first
  if (exchangeRateCache && Date.now() < exchangeRateCache.expiresAt) {
    return {
      rate: exchangeRateCache.rate,
      source: exchangeRateCache.source as 'boi' | 'exchangerate-api' | 'manual',
      timestamp: new Date(exchangeRateCache.expiresAt - CACHE_DURATION),
    };
  }

  // Try Bank of Israel first
  let rate = await fetchFromBankOfIsrael();
  if (rate) {
    exchangeRateCache = {
      rate,
      source: 'boi',
      expiresAt: Date.now() + CACHE_DURATION,
    };
    return {
      rate,
      source: 'boi',
      timestamp: new Date(),
    };
  }

  // Fallback to ExchangeRate-API
  rate = await fetchFromExchangeRateAPI();
  if (rate) {
    exchangeRateCache = {
      rate,
      source: 'exchangerate-api',
      expiresAt: Date.now() + CACHE_DURATION,
    };
    return {
      rate,
      source: 'exchangerate-api',
      timestamp: new Date(),
    };
  }

  // Final fallback: manual rate
  // This should be updated periodically or fetched from environment
  const manualRate = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_EXCHANGE_RATE || '3.7');

  console.warn('Using manual exchange rate as fallback:', manualRate);

  return {
    rate: manualRate,
    source: 'manual',
    timestamp: new Date(),
  };
}

/**
 * Convert USD to ILS
 *
 * @param usdAmount - Amount in USD
 * @param exchangeRate - Exchange rate (optional, will fetch if not provided)
 * @returns Amount in ILS
 *
 * @example
 * ```typescript
 * const ilsAmount = await convertUsdToIls(1000);
 * console.log(`$1000 = ₪${ilsAmount}`);
 * ```
 */
export async function convertUsdToIls(
  usdAmount: number,
  exchangeRate?: number
): Promise<number> {
  const rate = exchangeRate || (await getExchangeRate()).rate;
  return usdAmount * rate;
}

/**
 * Convert ILS to USD
 *
 * @param ilsAmount - Amount in ILS
 * @param exchangeRate - Exchange rate (optional, will fetch if not provided)
 * @returns Amount in USD
 *
 * @example
 * ```typescript
 * const usdAmount = await convertIlsToUsd(3700);
 * console.log(`₪3700 = $${usdAmount}`);
 * ```
 */
export async function convertIlsToUsd(
  ilsAmount: number,
  exchangeRate?: number
): Promise<number> {
  const rate = exchangeRate || (await getExchangeRate()).rate;
  return ilsAmount / rate;
}

/**
 * Clear the exchange rate cache
 * Useful for testing or forcing a fresh fetch
 */
export function clearExchangeRateCache(): void {
  exchangeRateCache = null;
}

/**
 * Format amount as currency
 *
 * @param amount - Amount to format
 * @param currency - Currency code ('USD' or 'ILS')
 * @param locale - Locale for formatting (default: 'he-IL')
 * @returns Formatted currency string
 *
 * @example
 * ```typescript
 * formatCurrency(1000, 'USD', 'en-US'); // "$1,000.00"
 * formatCurrency(3700, 'ILS', 'he-IL'); // "₪3,700.00"
 * ```
 */
export function formatCurrency(
  amount: number,
  currency: 'USD' | 'ILS',
  locale: string = 'he-IL'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
