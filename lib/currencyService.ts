const EXCHANGE_API_KEY = '0c956348665b011c2114033f';
const EXCHANGE_BASE_URL = `https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}`;

export const SUPPORTED_CURRENCIES = ['USD', 'LKR', 'GBP', 'AED', 'AUD', 'EUR'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  LKR: 'Rs.',
  GBP: '£',
  AED: 'د.إ',
  AUD: 'A$',
  EUR: '€',
};

export const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  LKR: 'Sri Lankan Rupee',
  GBP: 'British Pound',
  AED: 'UAE Dirham',
  AUD: 'Australian Dollar',
  EUR: 'Euro',
};

export const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  LKR: '🇱🇰',
  GBP: '🇬🇧',
  AED: '🇦🇪',
  AUD: '🇦🇺',
  EUR: '🇪🇺',
};

export async function fetchLatestRates(base: string = 'USD'): Promise<Record<string, number>> {
  const res = await fetch(`${EXCHANGE_BASE_URL}/latest/${base}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`ExchangeRate API HTTP ${res.status}`);
  const data = await res.json();
  if (data.result !== 'success') throw new Error(`ExchangeRate API: ${data['error-type']}`);
  return data.conversion_rates as Record<string, number>;
}

// Convert amount from one currency to another using USD-base rates
export function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): number {
  if (from === to || !amount) return amount;
  const inUSD = from === 'USD' ? amount : amount / (rates[from] ?? 1);
  return to === 'USD' ? inUSD : inUSD * (rates[to] ?? 1);
}

export function formatAmount(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  if (currency === 'LKR') {
    return `${sym}${Math.round(amount).toLocaleString('en-US')}`;
  }
  return `${sym}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Returns e.g. "$100 / Rs.31,750" — used for dual-currency display
export function formatDual(
  amount: number,
  base: 'USD' | 'LKR',
  rates: Record<string, number>
): string {
  const other = base === 'USD' ? 'LKR' : 'USD';
  const converted = convertAmount(amount, base, other, rates);
  return `${formatAmount(amount, base)} / ${formatAmount(converted, other)}`;
}

// Trend analysis for the exchange advisor
export type TrendDirection = 'strong_up' | 'up' | 'flat' | 'down' | 'strong_down';

export interface ExchangeAdvice {
  trend: TrendDirection;
  trendPct: number;
  positionVsHigh: number; // 0–1, 1 = at 7-day high
  positionVsLow: number;  // 0–1, 1 = at 7-day low
  recommendation: 'excellent' | 'good' | 'neutral' | 'wait' | 'hold';
  headline: string;
  detail: string;
}

export function analyzeRateTrend(
  history: { rate: number; ts: Date }[], // sorted oldest → newest
  current: number
): ExchangeAdvice {
  if (history.length < 2) {
    return {
      trend: 'flat', trendPct: 0, positionVsHigh: 0.5, positionVsLow: 0.5,
      recommendation: 'neutral',
      headline: 'Insufficient data',
      detail: 'Not enough history to predict trends. Check back after a few rate fetches.',
    };
  }

  const rates = [...history.map(h => h.rate), current];
  const oldest = history[0].rate;
  const trendPct = ((current - oldest) / oldest) * 100;

  const high7 = Math.max(...rates);
  const low7 = Math.min(...rates);
  const range = high7 - low7 || 1;

  const positionVsHigh = (current - low7) / range; // 1 = at high
  const positionVsLow = 1 - positionVsHigh;         // 1 = at low

  let trend: TrendDirection;
  if (trendPct > 1.5) trend = 'strong_up';
  else if (trendPct > 0.3) trend = 'up';
  else if (trendPct < -1.5) trend = 'strong_down';
  else if (trendPct < -0.3) trend = 'down';
  else trend = 'flat';

  // Advice from hotel perspective: receiving foreign currency → converting to LKR
  // Higher rate = more LKR per foreign unit = good to convert NOW
  let recommendation: ExchangeAdvice['recommendation'];
  let headline: string;
  let detail: string;

  if (positionVsHigh >= 0.85) {
    recommendation = 'excellent';
    headline = 'Excellent time to convert to LKR';
    detail = `Rate is at ${(positionVsHigh * 100).toFixed(0)}% of its recent range — very near the high. Converting foreign currency to LKR now gives maximum value.`;
  } else if (positionVsHigh >= 0.6 && trend !== 'down' && trend !== 'strong_down') {
    recommendation = 'good';
    headline = 'Good time to convert';
    detail = `Rate is above average and ${trend === 'up' || trend === 'strong_up' ? 'still rising' : 'holding steady'}. A reasonable moment to exchange.`;
  } else if (trend === 'strong_up') {
    recommendation = 'good';
    headline = 'Rate rising fast — act soon';
    detail = `Rate has risen ${trendPct.toFixed(2)}% recently. If you need LKR, convert now before the trend reverses.`;
  } else if (positionVsLow >= 0.85) {
    recommendation = 'wait';
    headline = 'Rate is near recent low — wait';
    detail = `Rate is near its 7-day low. Consider waiting for recovery before converting to LKR for better value.`;
  } else if (trend === 'strong_down') {
    recommendation = 'hold';
    headline = 'Rate falling — hold foreign currency';
    detail = `Rate has dropped ${Math.abs(trendPct).toFixed(2)}% recently. Hold your foreign currency and wait for the rate to recover.`;
  } else {
    recommendation = 'neutral';
    headline = 'Rate is stable';
    detail = `No significant trend detected. Exchange at your convenience — rate is within its normal range.`;
  }

  return { trend, trendPct, positionVsHigh, positionVsLow, recommendation, headline, detail };
}
