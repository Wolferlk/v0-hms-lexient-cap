import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Report } from '@/lib/models/Analytics';
import { AnalyticsService } from '@/lib/analyticsService';
import { verifyToken } from '@/lib/auth';
import { sampleReports } from '@/lib/sampleData';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query: any = {};
    if (reportType) {
      query.type = reportType;
    }

    const reports = await Report.find(query).sort({ createdAt: -1 }).limit(limit);
    const fallbackReports = sampleReports
      .filter((report) => {
        if (reportType && report.type !== reportType) return false;
        return true;
      })
      .slice(0, limit);

    return NextResponse.json({
      reports: reports.length ? reports : fallbackReports,
      count: reports.length ? reports.length : fallbackReports.length,
    });
  } catch (error) {
    console.error('[v0] Reports fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    const { type, period, startDate, endDate } = await req.json();

    if (!type || !period || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const analyticsService = new AnalyticsService();
    const report = await analyticsService.generateReport(
      type,
      period,
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json(
      {
        message: 'Report generated successfully',
        report,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Report generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
