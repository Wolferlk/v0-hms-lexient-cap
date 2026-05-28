import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AnalyticsMetrics } from '@/lib/models/Analytics';
import { AnalyticsService } from '@/lib/analyticsService';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const metricType = searchParams.get('type');
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query: any = { date: { $gte: startDate } };
    if (metricType) {
      query.metric = metricType;
    }

    const metrics = await AnalyticsMetrics.find(query).sort({ date: -1 });

    return NextResponse.json({
      metrics,
      period: {
        start: startDate,
        end: new Date(),
        days,
      },
    });
  } catch (error) {
    console.error('[v0] Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const analyticsService = new AnalyticsService();
    const result = await analyticsService.calculateMetrics();

    return NextResponse.json({
      message: 'Metrics calculated successfully',
      data: result,
    });
  } catch (error) {
    console.error('[v0] Analytics calculation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
