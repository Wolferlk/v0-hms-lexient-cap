import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/lib/models/Booking';
import { Room } from '@/lib/models/Room';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid booking ID' }, { status: 400 });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'confirmed' && booking.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Cannot check in a booking with status: ${booking.status}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { docType, docNumber, expiryDate, scanUrl } = body;

    if (!docType || !docNumber) {
      return NextResponse.json(
        { success: false, error: 'Document type and number are required for check-in' },
        { status: 400 }
      );
    }

    booking.status = 'checked-in';
    booking.checkInTime = new Date();
    booking.guestDocument = {
      docType,
      docNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      scanUrl: scanUrl || '',
      isReturned: false,
    };

    await booking.save();

    // Mark rooms as occupied
    if (booking.roomIds && booking.roomIds.length > 0) {
      await Room.updateMany(
        { _id: { $in: booking.roomIds } },
        { $set: { isAvailable: false } }
      );
    }

    return NextResponse.json({ success: true, data: booking }, { status: 200 });
  } catch (error) {
    console.error('[v0] Error checking in booking:', error);
    return NextResponse.json({ success: false, error: 'Failed to check in' }, { status: 500 });
  }
}
