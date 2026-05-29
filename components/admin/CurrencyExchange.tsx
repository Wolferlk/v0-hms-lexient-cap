'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus, RefreshCw,
  ArrowRightLeft, Clock, Star, AlertTriangle, CheckCircle2,
  Activity, Zap, BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format } from 'date-fns';
import {
  CURRENCY_SYMBOLS, CURRENCY_NAMES, CURRENCY_FLAGS,
  convertAmount, formatAmount, analyzeRateTrend,
} from '@/lib/currencyService';

// ── Constants ─────────────────────────────────────────────────────────────────

const FOCUS_CURRENCIES = ['USD', 'GBP', 'AED', 'AUD'] as const;
type FocusCurrency = (typeof FOCUS_CURRENCIES)[number];

const ALL_CURRENCIES = ['USD', 'LKR', 'GBP', 'AED', 'AUD', 'EUR'];

const CHART_COLORS: Record<string, string> = {
  USD: '#3b82f6',
  GBP: '#8b5cf6',
  AED: '#f59e0b',
  AUD: '#10b981',
};

const CARD_GRADIENTS: Record<string, string> = {
  USD: 'from-blue-600 to-blue-800',
  GBP: 'from-violet-600 to-violet-800',
  AED: 'from-amber-500 to-amber-700',
  AUD: 'from-emerald-600 to-emerald-800',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface RateSnapshot {
  fetchedAt: string;
  label: string;
  LKR?: number;
  GBP?: number;   // LKR per GBP (from GBP-base or computed)
  AED?: number;
  AUD?: number;
}

interface LiveRates {
  rates: Record<string, number>;
  fetchedAt: Date | null;
  loading: boolean;
  error: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function lkrPer(currency: string, rates: Record<string, number>): number {
  if (currency === 'LKR') return 1;
  if (currency === 'USD') return rates['LKR'] ?? 0;
  // Convert 1 unit of foreign currency → USD → LKR
  const inUSD = 1 / (rates[currency] ?? 1);
  return inUSD * (rates['LKR'] ?? 1);
}

function pctChange(current: number, previous: number): number {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TrendIcon({ pct }: { pct: number }) {
  if (pct > 0.1) return <TrendingUp className="h-4 w-4 text-emerald-400" />;
  if (pct < -0.1) return <TrendingDown className="h-4 w-4 text-red-400" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

function RecommendationBadge({ rec }: { rec: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    excellent: { label: 'Excellent time', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <Star className="h-3.5 w-3.5" /> },
    good:      { label: 'Good time',      cls: 'bg-blue-100 text-blue-800 border-blue-200',         icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    neutral:   { label: 'Neutral',        cls: 'bg-gray-100 text-gray-700 border-gray-200',          icon: <Minus className="h-3.5 w-3.5" /> },
    wait:      { label: 'Wait',           cls: 'bg-amber-100 text-amber-800 border-amber-200',       icon: <Clock className="h-3.5 w-3.5" /> },
    hold:      { label: 'Hold',           cls: 'bg-red-100 text-red-800 border-red-200',             icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  };
  const cfg = map[rec] ?? map.neutral;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CurrencyExchange() {
  const [live, setLive] = useState<LiveRates>({ rates: {}, fetchedAt: null, loading: true, error: null });
  const [history, setHistory] = useState<RateSnapshot[]>([]);
  const [historyDays, setHistoryDays] = useState(7);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Converter state
  const [convAmount, setConvAmount] = useState('1000');
  const [convFrom, setConvFrom] = useState('USD');
  const [convTo, setConvTo]   = useState('LKR');
  const [activeCurrency, setActiveCurrency] = useState<FocusCurrency>('USD');

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchRates = useCallback(async () => {
    setLive(l => ({ ...l, loading: true, error: null }));
    try {
      const res = await fetch('/api/currency/rates');
      const data = await res.json();
      if (data.success) {
        setLive({
          rates: data.rates,
          fetchedAt: data.fetchedAt ? new Date(data.fetchedAt) : new Date(),
          loading: false,
          error: null,
        });
      } else {
        setLive(l => ({ ...l, loading: false, error: data.error }));
      }
    } catch {
      setLive(l => ({ ...l, loading: false, error: 'Network error' }));
    }
  }, []);

  const fetchHistory = useCallback(async (days: number) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/currency/history?days=${days}&currencies=LKR,GBP,AED,AUD`);
      const data = await res.json();
      if (data.success) setHistory(data.data);
    } catch {}
    setHistoryLoading(false);
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);
  useEffect(() => { fetchHistory(historyDays); }, [fetchHistory, historyDays]);

  // ── Derived values ───────────────────────────────────────────────────────────

  const { rates } = live;

  // Build chart data: each point shows LKR value per 1 unit of each focus currency
  const chartData = history.map(snap => ({
    label: snap.label,
    USD: snap.LKR ? Number(snap.LKR.toFixed(2)) : null,
    GBP: snap.GBP && snap.LKR ? Number((snap.LKR / snap.GBP).toFixed(2)) : null,
    AED: snap.AED && snap.LKR ? Number((snap.LKR / snap.AED).toFixed(2)) : null,
    AUD: snap.AUD && snap.LKR ? Number((snap.LKR / snap.AUD).toFixed(2)) : null,
  }));

  // Trend advice for selected currency
  const trendHistory = history
    .filter(s => s.LKR)
    .map(s => ({ rate: lkrPer(activeCurrency, { LKR: s.LKR!, GBP: s.GBP, AED: s.AED, AUD: s.AUD } as Record<string, number>), ts: new Date(s.fetchedAt) }));

  const currentRate = lkrPer(activeCurrency, rates);
  const advice = analyzeRateTrend(trendHistory, currentRate);

  // Converter result
  const convResult = (() => {
    const amt = parseFloat(convAmount) || 0;
    if (!amt || !rates[convFrom === 'USD' ? 'LKR' : convFrom]) return null;
    const result = convertAmount(amt, convFrom, convTo, rates);
    return result;
  })();

  // Swap from/to
  const swapCurrencies = () => {
    setConvFrom(convTo);
    setConvTo(convFrom);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" /> Currency Exchange Center
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live rates · LKR conversion · Exchange advisor · Powered by ExchangeRate-API
          </p>
        </div>
        <div className="flex items-center gap-2">
          {live.fetchedAt && (
            <span className="text-xs text-muted-foreground">
              Updated {format(live.fetchedAt, 'HH:mm')}
            </span>
          )}
          <Button size="sm" variant="outline" onClick={fetchRates} disabled={live.loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${live.loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {live.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {live.error}
        </div>
      )}

      {/* ── Live rate cards ───────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FOCUS_CURRENCIES.map(cur => {
          const rate = lkrPer(cur, rates);
          const prevSnap = history.length >= 2 ? history[history.length - 2] : null;
          const prevRates = prevSnap
            ? { LKR: prevSnap.LKR ?? 0, GBP: prevSnap.GBP, AED: prevSnap.AED, AUD: prevSnap.AUD } as Record<string, number>
            : null;
          const prevRate = prevRates ? lkrPer(cur, prevRates) : rate;
          const pct = pctChange(rate, prevRate);
          const isActive = activeCurrency === cur;

          return (
            <button
              key={cur}
              onClick={() => setActiveCurrency(cur)}
              className={`relative overflow-hidden rounded-xl text-left transition-all border-2 ${
                isActive ? 'border-white shadow-xl scale-[1.02]' : 'border-transparent shadow hover:shadow-md'
              }`}
            >
              <div className={`bg-gradient-to-br ${CARD_GRADIENTS[cur]} p-4 text-white`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{CURRENCY_FLAGS[cur]}</span>
                    <div>
                      <div className="font-bold text-lg">{cur}</div>
                      <div className="text-xs opacity-80">{CURRENCY_NAMES[cur]}</div>
                    </div>
                  </div>
                  <TrendIcon pct={pct} />
                </div>

                {live.loading ? (
                  <div className="h-8 w-24 animate-pulse rounded bg-white/20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      Rs.{rate > 0 ? Math.round(rate).toLocaleString() : '—'}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs opacity-70">1 {cur} = ? LKR</span>
                      <span className={`text-xs font-semibold ${pct > 0 ? 'text-emerald-300' : pct < 0 ? 'text-red-300' : 'text-gray-300'}`}>
                        {pct > 0 ? '+' : ''}{pct.toFixed(3)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/60" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Exchange Advisor + Converter ─────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Exchange Advisor */}
        <Card className="border-2 border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-amber-500" />
              Exchange Advisor — {CURRENCY_FLAGS[activeCurrency]} {activeCurrency} → LKR
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trendHistory.length < 2 ? (
              <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
                Rate history will appear here after a few API fetches. Refresh periodically to build trend data.
              </div>
            ) : (
              <>
                {/* Current stats */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p className="font-bold text-sm">Rs.{Math.round(currentRate).toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-xs text-muted-foreground">7-day High</p>
                    <p className="font-bold text-sm text-emerald-700">
                      Rs.{Math.round(Math.max(currentRate, ...trendHistory.map(h => h.rate))).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-xs text-muted-foreground">7-day Low</p>
                    <p className="font-bold text-sm text-red-700">
                      Rs.{Math.round(Math.min(currentRate, ...trendHistory.map(h => h.rate))).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Trend bar */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Position in 7-day range</span>
                    <span>{(advice.positionVsHigh * 100).toFixed(0)}% of range</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gradient-to-r from-red-300 via-amber-300 to-emerald-400 relative overflow-hidden">
                    <div
                      className="absolute top-0 h-full w-1 bg-white border border-gray-400 rounded-full shadow"
                      style={{ left: `calc(${(advice.positionVsHigh * 100).toFixed(1)}% - 2px)` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-0.5 text-muted-foreground">
                    <span>Low</span><span>High</span>
                  </div>
                </div>

                {/* Trend direction */}
                <div className="flex items-center gap-2">
                  {advice.trendPct > 0 ? (
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  ) : advice.trendPct < 0 ? (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-sm">
                    Trend: <span className={`font-semibold ${advice.trendPct > 0 ? 'text-emerald-600' : advice.trendPct < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {advice.trendPct > 0 ? '+' : ''}{advice.trendPct.toFixed(3)}% over {historyDays} days
                    </span>
                  </span>
                </div>

                {/* Recommendation */}
                <div className={`rounded-xl border p-4 ${
                  advice.recommendation === 'excellent' ? 'bg-emerald-50 border-emerald-200' :
                  advice.recommendation === 'good'      ? 'bg-blue-50 border-blue-200' :
                  advice.recommendation === 'wait'      ? 'bg-amber-50 border-amber-200' :
                  advice.recommendation === 'hold'      ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <RecommendationBadge rec={advice.recommendation} />
                  </div>
                  <p className="font-semibold text-sm">{advice.headline}</p>
                  <p className="text-xs text-muted-foreground mt-1">{advice.detail}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Currency Converter */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRightLeft className="h-4 w-4 text-blue-500" />
              Currency Converter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Amount input */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Amount</label>
              <Input
                type="number"
                min="0"
                value={convAmount}
                onChange={e => setConvAmount(e.target.value)}
                className="text-lg font-semibold h-12"
                placeholder="Enter amount..."
              />
            </div>

            {/* From → To row */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">From</label>
                <Select value={convFrom} onValueChange={setConvFrom}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_CURRENCIES.map(c => (
                      <SelectItem key={c} value={c}>
                        {CURRENCY_FLAGS[c]} {c} — {CURRENCY_NAMES[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button
                onClick={swapCurrencies}
                className="mt-5 rounded-full p-2 hover:bg-muted transition-colors border"
                title="Swap currencies"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </button>

              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">To</label>
                <Select value={convTo} onValueChange={setConvTo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_CURRENCIES.map(c => (
                      <SelectItem key={c} value={c}>
                        {CURRENCY_FLAGS[c]} {c} — {CURRENCY_NAMES[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Result */}
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4">
              {live.loading ? (
                <div className="h-10 animate-pulse rounded bg-muted" />
              ) : convResult !== null ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {CURRENCY_SYMBOLS[convTo] ?? convTo}
                      {convTo === 'LKR'
                        ? Math.round(convResult).toLocaleString()
                        : convResult.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-muted-foreground text-sm">{CURRENCY_NAMES[convTo]}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    1 {convFrom} = {formatAmount(convertAmount(1, convFrom, convTo, rates), convTo)} {convTo}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">Enter an amount above to convert</p>
              )}
            </div>

            {/* Quick conversion table */}
            {convFrom && convTo && convFrom !== convTo && Object.keys(rates).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Table</p>
                {[1, 10, 100, 500, 1000, 5000].map(qty => {
                  const result = convertAmount(qty, convFrom, convTo, rates);
                  return (
                    <div key={qty} className="flex justify-between text-sm rounded bg-muted/30 px-3 py-1.5">
                      <span>{formatAmount(qty, convFrom)}</span>
                      <span className="font-medium">{formatAmount(result, convTo)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Rate History Chart ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Rate History — LKR per 1 unit of foreign currency
            </CardTitle>
            <div className="flex gap-1">
              {[1, 3, 7, 14, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setHistoryDays(d)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    historyDays === d
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading history...
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Activity className="h-8 w-8 opacity-30" />
              <p className="text-sm">No history yet — rates are stored each time they are fetched.</p>
              <p className="text-xs">Click Refresh above to record the first snapshot.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `Rs.${(v as number).toLocaleString()}`}
                  width={70}
                />
                <Tooltip
                  formatter={(val: any, name: string) => [`Rs.${Number(val).toLocaleString()}`, `${CURRENCY_FLAGS[name] ?? ''} ${name}/LKR`]}
                  labelStyle={{ fontSize: 12 }}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Legend formatter={(val) => `${CURRENCY_FLAGS[val] ?? ''} ${val}`} />
                {FOCUS_CURRENCIES.map(cur => (
                  <Line
                    key={cur}
                    type="monotone"
                    dataKey={cur}
                    stroke={CHART_COLORS[cur]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Rate history table ────────────────────────────────────────────── */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Stored Rate Snapshots (LKR per 1 unit)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date / Time</th>
                    {FOCUS_CURRENCIES.map(cur => (
                      <th key={cur} className="px-4 py-3 font-semibold text-right">
                        {CURRENCY_FLAGS[cur]} {cur}/LKR
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().slice(0, 20).map((snap, i) => {
                    const snapRates: Record<string, number> = {
                      LKR: snap.LKR ?? 0,
                      GBP: snap.GBP ?? 0,
                      AED: snap.AED ?? 0,
                      AUD: snap.AUD ?? 0,
                    };
                    return (
                      <tr key={i} className="border-t hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {format(new Date(snap.fetchedAt), 'dd MMM yyyy, HH:mm')}
                        </td>
                        {FOCUS_CURRENCIES.map(cur => {
                          const rate = lkrPer(cur, snapRates);
                          return (
                            <td key={cur} className="px-4 py-2.5 text-right font-mono font-medium">
                              {rate > 0 ? Math.round(rate).toLocaleString() : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── All currencies quick reference ───────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Rates — USD Base (1 USD = ?)</CardTitle>
        </CardHeader>
        <CardContent>
          {live.loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {['LKR', 'GBP', 'AED', 'AUD', 'EUR', 'JPY', 'CNY', 'SGD', 'INR', 'CAD', 'CHF', 'MYR'].map(cur => {
                const rate = rates[cur];
                if (!rate) return null;
                return (
                  <div key={cur} className="rounded-lg border bg-muted/20 px-3 py-2.5 text-center">
                    <p className="text-xs text-muted-foreground">{CURRENCY_FLAGS[cur] ?? '🌐'} {cur}</p>
                    <p className="font-bold text-sm mt-0.5">
                      {CURRENCY_SYMBOLS[cur] ?? ''}{rate.toLocaleString('en-US', {
                        maximumFractionDigits: cur === 'LKR' || cur === 'JPY' ? 0 : 4,
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
