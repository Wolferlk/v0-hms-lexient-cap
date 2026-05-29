import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ExchangeRateSnapshot } from '@/lib/models/ExchangeRate';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') || '7'), 30);
  const currencies = (searchParams.get('currencies') || 'LKR,GBP,AED,AUD').split(',');

  try {
    await connectDB();

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const snapshots = await ExchangeRateSnapshot.find(
      { fetchedAt: { $gte: since } },
      { fetchedAt: 1, rates: 1, _id: 0 }
    )
      .sort({ fetchedAt: 1 })
      .lean() as any[];

    const history = snapshots.map((s) => {
      const entry: Record<string, any> = {
        fetchedAt: s.fetchedAt,
        label: new Date(s.fetchedAt).toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        }),
      };
      const ratesMap = s.rates instanceof Map ? s.rates : new Map(Object.entries(s.rates ?? {}));
      for (const currency of currencies) {
        entry[currency] = ratesMap.get(currency) ?? null;
      }
      return entry;
    });

    return NextResponse.json({ success: true, data: history, count: history.length });
  } catch (err) {
    console.error('[currency/history]', err);
    return NextResponse.json({ success: false, error: 'Failed to load rate history' }, { status: 500 });
  }
}
