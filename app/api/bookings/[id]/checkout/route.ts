import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/lib/models/Booking';
import { Order } from '@/lib/models/Restaurant';
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

    if (booking.status !== 'checked-in') {
      return NextResponse.json(
        { success: false, error: 'Only checked-in bookings can be checked out' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { paymentAmount, paymentMethod, notes, returnDocument } = body;

    if (!paymentAmount || paymentAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'A valid payment amount is required' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Payment method is required' },
        { status: 400 }
      );
    }

    // Compute grand total from room service orders
    const roomServiceOrders = await Order.find({
      bookingId: id,
      orderType: 'room-service',
    }).lean() as any[];

    const foodTotal = roomServiceOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const roomTotal = (booking.totalAmount || 0) - (booking.discountAmount || 0);
    const grandTotal = roomTotal + foodTotal;

    const previouslyPaid = booking.amountPaid || 0;
    const newAmountPaid = previouslyPaid + paymentAmount;

    // Add payment record
    booking.payments.push({
      amount: paymentAmount,
      method: paymentMethod,
      date: new Date(),
      notes: notes || '',
    });

    booking.amountPaid = newAmountPaid;

    // Determine payment status
    if (newAmountPaid >= grandTotal) {
      booking.paymentStatus = 'paid';
    } else if (newAmountPaid > 0) {
      booking.paymentStatus = 'partial';
    }

    // Check if full amount paid — complete checkout
    const balanceDue = grandTotal - newAmountPaid;

    if (balanceDue <= 0) {
      booking.status = 'checked-out';
      booking.checkOutTime = new Date();

      // Return guest document if requested
      if (returnDocument && booking.guestDocument) {
        booking.guestDocument.isReturned = true;
      }

      // Mark room service orders as completed
      await Order.updateMany(
        { bookingId: id, orderType: 'room-service' },
        { $set: { paymentStatus: 'paid', status: 'completed' } }
      );

      // Free up rooms
      if (booking.roomIds && booking.roomIds.length > 0) {
        await Room.updateMany(
          { _id: { $in: booking.roomIds } },
          { $set: { isAvailable: true } }
        );
      }
    }

    await booking.save();

    return NextResponse.json(
      {
        success: true,
        data: booking,
        checkedOut: balanceDue <= 0,
        balanceDue: Math.max(0, balanceDue),
        grandTotal,
        amountPaid: newAmountPaid,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Error processing checkout:', error);
    return NextResponse.json({ success: false, error: 'Failed to process checkout' }, { status: 500 });
  }
}
