import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ExchangeRateSnapshot } from '@/lib/models/ExchangeRate';
import { fetchLatestRates } from '@/lib/currencyService';

// In-process cache: avoids hammering the API on every SSR request
let memCache: { rates: Record<string, number>; ts: number } | null = null;
const MEM_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  if (memCache && Date.now() - memCache.ts < MEM_TTL_MS) {
    return NextResponse.json({
      success: true,
      rates: memCache.rates,
      cached: true,
      fetchedAt: new Date(memCache.ts),
    });
  }

  try {
    const rates = await fetchLatestRates('USD');
    const fetchedAt = new Date();

    memCache = { rates, ts: fetchedAt.getTime() };

    // Persist a snapshot for history (fire-and-forget; errors don't fail the response)
    connectDB()
      .then(() => ExchangeRateSnapshot.create({ fetchedAt, base: 'USD', rates }))
      .catch(e => console.error('[currency/rates] snapshot save failed:', e));

    return NextResponse.json({ success: true, rates, cached: false, fetchedAt });
  } catch (err) {
    console.error('[currency/rates] fetch failed, trying last DB snapshot:', err);

    // Fallback: return the most recent stored rates
    try {
      await connectDB();
      const last = await ExchangeRateSnapshot.findOne().sort({ fetchedAt: -1 }).lean() as any;
      if (last) {
        const rates = last.rates instanceof Map
          ? Object.fromEntries(last.rates)
          : Object.fromEntries(Object.entries(last.rates ?? {}));
        return NextResponse.json({
          success: true,
          rates,
          cached: true,
          fetchedAt: last.fetchedAt,
          fallback: true,
        });
      }
    } catch (dbErr) {
      console.error('[currency/rates] DB fallback failed:', dbErr);
    }

    return NextResponse.json(
      { success: false, error: 'Unable to fetch exchange rates' },
      { status: 502 }
    );
  }
}
