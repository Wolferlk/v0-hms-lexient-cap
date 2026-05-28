import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models/Room';
import { bookingComService } from '@/lib/bookingComService';

/**
 * POST /api/bookingcom/sync-inventory
 * Syncs all rooms to Booking.com
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Fetch all rooms
    const rooms = await Room.find({}).lean();

    if (rooms.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No rooms found to sync',
        },
        { status: 400 }
      );
    }

    // Push inventory to Booking.com
    const result = await bookingComService.pushRoomInventory(rooms);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        roomsCount: rooms.length,
      },
      { status: result.success ? 200 : 500 }
    );
  } catch (error) {
    console.error('[v0] Error syncing inventory:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync inventory',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookingcom/sync-inventory
 * Gets the current sync status
 */
export async function GET(request: NextRequest) {
  try {
    const isConfigured = process.env.BOOKING_COM_API_KEY &&
      process.env.BOOKING_COM_PROPERTY_ID;

    return NextResponse.json(
      {
        success: true,
        configured: !!isConfigured,
        message: isConfigured
          ? 'Booking.com integration is configured'
          : 'Booking.com integration is not configured. Please set BOOKING_COM_API_KEY and BOOKING_COM_PROPERTY_ID.',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check sync status',
      },
      { status: 500 }
    );
  }
}
