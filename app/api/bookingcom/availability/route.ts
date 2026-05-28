import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models/Room';
import { Booking } from '@/lib/models/Booking';
import { bookingComService, AvailabilityUpdate } from '@/lib/bookingComService';

/**
 * POST /api/bookingcom/availability
 * Push real-time room availability to Booking.com
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { dateFrom, dateTo } = body;

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

    // Get existing bookings in range to determine real availability
    const existingBookings = await Booking.find({
      status: { $in: ['confirmed', 'checked_in'] },
      checkInDate: { $lte: new Date(dateTo) },
      checkOutDate: { $gte: new Date(dateFrom) },
    }).lean();

    const bookedRoomIds = new Set(
      existingBookings.flatMap((b: any) => b.roomIds?.map((id: any) => id.toString()) || [])
    );

    const updates: AvailabilityUpdate[] = rooms.map((room: any) => {
      const isBooked = bookedRoomIds.has(room._id.toString());
      return {
        roomId: room._id.toString(),
        dates: dates.map(date => ({
          date,
          available: isBooked || room.status !== 'available' ? 0 : 1,
          closed: room.status === 'maintenance',
        })),
      };
    });

    const result = await bookingComService.updateAvailability(updates);
    return NextResponse.json({
      success: result.success,
      message: result.message,
      roomsUpdated: rooms.length,
      datesRange: `${dateFrom} to ${dateTo}`,
      error: result.error,
    }, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
