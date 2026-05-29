'use client';

import { useCallback, useEffect, useState } from 'react';
import { convertAmount, formatAmount, formatDual } from '@/lib/currencyService';

const CACHE_KEY = 'hms_fx_rates_v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CurrencyState {
  rates: Record<string, number>;
  loading: boolean;
  lastUpdated: Date | null;
  error: string | null;
}

export function useCurrency() {
  const [state, setState] = useState<CurrencyState>({
    rates: {},
    loading: true,
    lastUpdated: null,
    error: null,
  });

  const fetchRates = useCallback(async (force = false) => {
    setState(s => ({ ...s, loading: true, error: null }));

    if (!force) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as { rates: Record<string, number>; ts: number };
          if (Date.now() - parsed.ts < CACHE_TTL_MS) {
            setState({ rates: parsed.rates, loading: false, lastUpdated: new Date(parsed.ts), error: null });
            return;
          }
        }
      } catch {
        // ignore localStorage errors
      }
    }

    try {
      const res = await fetch('/api/currency/rates');
      const data = await res.json();
      if (data.success && data.rates) {
        const ts = Date.now();
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ rates: data.rates, ts }));
        } catch {}
        setState({ rates: data.rates, loading: false, lastUpdated: new Date(ts), error: null });
      } else {
        setState(s => ({ ...s, loading: false, error: data.error ?? 'Unknown error' }));
      }
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: 'Network error fetching rates' }));
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const convert = useCallback(
    (amount: number, from: string, to: string) => convertAmount(amount, from, to, state.rates),
    [state.rates]
  );

  const fmt = useCallback(
    (amount: number, currency: string) => formatAmount(amount, currency),
    []
  );

  // Show both USD and LKR e.g. "$100 / Rs.31,750"
  const dual = useCallback(
    (amount: number, base: 'USD' | 'LKR' = 'USD') => formatDual(amount, base, state.rates),
    [state.rates]
  );

  // Shorthand: convert USD amount → LKR formatted string
  const toLKR = useCallback(
    (usdAmount: number) => formatAmount(convertAmount(usdAmount, 'USD', 'LKR', state.rates), 'LKR'),
    [state.rates]
  );

  // Shorthand: convert LKR amount → USD formatted string
  const toUSD = useCallback(
    (lkrAmount: number) => formatAmount(convertAmount(lkrAmount, 'LKR', 'USD', state.rates), 'USD'),
    [state.rates]
  );

  return {
    rates: state.rates,
    loading: state.loading,
    lastUpdated: state.lastUpdated,
    error: state.error,
    lkrRate: state.rates['LKR'] ?? 0,
    convert,
    fmt,
    dual,
    toLKR,
    toUSD,
    refresh: () => fetchRates(true),
  };
}
