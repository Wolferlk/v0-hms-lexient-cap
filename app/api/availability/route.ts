import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/lib/models/Booking';
import { Room } from '@/lib/models/Room';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const checkInDate = searchParams.get('checkIn');
    const checkOutDate = searchParams.get('checkOut');
    const capacity = searchParams.get('capacity');
    const category = searchParams.get('category');

    if (!checkInDate || !checkOutDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Check-in and check-out dates are required',
        },
        { status: 400 }
      );
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      return NextResponse.json(
        {
          success: false,
          error: 'Check-out date must be after check-in date',
        },
        { status: 400 }
      );
    }

    // Find all bookings that overlap with the requested dates
    const overlappingBookings = await Booking.find({
      $and: [
        { checkInDate: { $lt: checkOut } },
        { checkOutDate: { $gt: checkIn } },
        { status: { $in: ['confirmed', 'checked-in'] } },
      ],
    }).lean();

    // Get booked room IDs
    const bookedRoomIds = overlappingBookings.flatMap((b) => b.roomIds);

    // Build query for available rooms
    let roomQuery: any = {
      isAvailable: true,
      _id: { $nin: bookedRoomIds },
    };

    if (capacity) {
      roomQuery.capacity = { $gte: parseInt(capacity) };
    }

    if (category) {
      roomQuery.category = category;
    }

    const availableRooms = await Room.find(roomQuery).lean();

    return NextResponse.json(
      {
        success: true,
        data: {
          availableRooms,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfNights: Math.ceil(
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
          ),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Error checking availability:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check availability',
      },
      { status: 500 }
    );
  }
}
