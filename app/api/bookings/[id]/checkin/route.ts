import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/lib/models/Booking';
import { Room } from '@/lib/models/Room';
import { ObjectId } from 'mongodb';

const MAX_ACTIVE_ROOMS = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!ObjectId.isValid(id))
      return NextResponse.json({ success: false, error: 'Invalid booking ID' }, { status: 400 });

    const booking = await Booking.findById(id);
    if (!booking)
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

    if (booking.status !== 'confirmed' && booking.status !== 'pending')
      return NextResponse.json(
        { success: false, error: `Cannot check in — booking status is "${booking.status}"` },
        { status: 400 }
      );

    // ── Enforce 30-active-rooms limit ────────────────────────────────────────
    const checkedInBookings = await Booking.find({ status: 'checked-in' }).lean();
    const activeRoomCount = checkedInBookings.reduce(
      (total, b) => total + (b.roomIds?.length || 0),
      0
    );
    const roomsToAdd = booking.roomIds?.length || 1;
    if (activeRoomCount + roomsToAdd > MAX_ACTIVE_ROOMS) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot check in — hotel has reached the ${MAX_ACTIVE_ROOMS}-room active limit (${activeRoomCount} rooms currently active)`,
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { docType, docNumber, expiryDate, scanUrl, checkInPayment } = body;

    if (!docType || !docNumber)
      return NextResponse.json(
        { success: false, error: 'Document type and number are required for check-in' },
        { status: 400 }
      );

    // ── Update booking ───────────────────────────────────────────────────────
    booking.status = 'checked-in';
    booking.checkInTime = new Date();
    booking.guestDocument = {
      docType,
      docNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      scanUrl: scanUrl || '',
      isReturned: false,
    };

    // Record check-in payment if provided
    if (checkInPayment && checkInPayment.amount > 0) {
      booking.payments.push({
        amount: checkInPayment.amount,
        method: checkInPayment.method || 'cash',
        date: new Date(),
        notes: 'Check-in payment',
      });
      booking.amountPaid = (booking.amountPaid || 0) + checkInPayment.amount;

      const totalDue = (booking.totalAmount || 0) - (booking.discountAmount || 0);
      if (booking.amountPaid >= totalDue) {
        booking.paymentStatus = 'paid';
      } else if (booking.amountPaid > 0) {
        booking.paymentStatus = 'partial';
      }
    }

    await booking.save();

    // Mark rooms as occupied
    if (booking.roomIds?.length > 0) {
      await Room.updateMany(
        { _id: { $in: booking.roomIds } },
        { $set: { isAvailable: false } }
      );
    }

    return NextResponse.json({ success: true, data: booking, activeRoomCount: activeRoomCount + roomsToAdd }, { status: 200 });
  } catch (error) {
    console.error('[v0] Check-in error:', error);
    return NextResponse.json({ success: false, error: 'Failed to check in' }, { status: 500 });
  }
}
