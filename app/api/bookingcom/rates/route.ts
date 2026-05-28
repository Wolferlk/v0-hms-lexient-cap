import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models/Room';
import { bookingComService, RateUpdate } from '@/lib/bookingComService';

/**
 * POST /api/bookingcom/rates
 * Push room rates to Booking.com for a date range
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { dateFrom, dateTo, customRates } = body;

    if (!dateFrom || !dateTo) {
      return NextResponse.json({ success: false, error: 'dateFrom and dateTo are required' }, { status: 400 });
    }

    const rooms = await Room.find({}).lean();
    if (rooms.length === 0) {
      return NextResponse.json({ success: false, error: 'No rooms found' }, { status: 400 });
    }

    // Build date range
    const dates: string[] = [];
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().slice(0, 10));
    }

    const updates: RateUpdate[] = rooms.map((room: any) => ({
      roomId: room._id.toString(),
      ratePlanId: 'standard',
      dates: dates.map(date => ({
        date,
        rate: customRates?.[room._id.toString()] ?? room.pricePerNight,
      })),
    }));

    const result = await bookingComService.updateRates(updates);
    return NextResponse.json({
      success: result.success,
      message: result.message,
      roomsUpdated: rooms.length,
      datesUpdated: dates.length,
      error: result.error,
    }, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
