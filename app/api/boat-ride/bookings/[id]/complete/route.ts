import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BoatBooking } from '@/lib/models/BoatBooking';
import { Boat } from '@/lib/models/BoatFleet';
import { BoatRider } from '@/lib/models/BoatRider';
import { ObjectId } from 'mongodb';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  await connectDB();
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

  const booking = await BoatBooking.findById(id);
  if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

  if (booking.status !== 'riding') {
    return NextResponse.json(
      { success: false, error: `Ride must be in 'riding' status to complete` },
      { status: 400 }
    );
  }

  const body = await req.json();
  const {
    amountPaidLKR,
    paymentCurrency,
    paymentAmountInCurrency,
    exchangeRateToLKR,
    paymentMethod,
    markRiderPaid,   // boolean — mark contract rider as paid
  } = body;

  if (!amountPaidLKR || Number(amountPaidLKR) <= 0) {
    return NextResponse.json({ success: false, error: 'amountPaidLKR is required' }, { status: 400 });
  }

  booking.amountPaidLKR = Number(amountPaidLKR);
  booking.paymentCurrency = paymentCurrency || booking.paymentCurrency;
  booking.paymentAmountInCurrency = Number(paymentAmountInCurrency) || Number(amountPaidLKR);
  if (exchangeRateToLKR) booking.exchangeRateToLKR = Number(exchangeRateToLKR);
  booking.paymentMethod = paymentMethod || 'cash';
  booking.paymentStatus = booking.amountPaidLKR >= booking.basePriceLKR ? 'paid' : 'partial';
  booking.status = 'completed';
  booking.endTime = new Date();

  // Company riders: never mark paid (they have monthly salary)
  // Contract riders: optionally mark paid
  if (booking.riderTypeSnapshot === 'contract' && markRiderPaid) {
    booking.riderPaymentDone = true;
  }

  await booking.save();

  // Free the boat
  if (booking.boatId) {
    await Boat.findByIdAndUpdate(booking.boatId, { status: 'available' });
  }

  // Free the rider
  if (booking.riderId) {
    await BoatRider.findByIdAndUpdate(booking.riderId, { status: 'active' });
  }

  const populated = await BoatBooking.findById(id)
    .populate('packageId', 'name duration')
    .populate('boatId', 'name type')
    .populate('riderId', 'name riderType')
    .lean();

  return NextResponse.json({
    success: true,
    data: populated,
    amountPaidLKR: booking.amountPaidLKR,
    paymentStatus: booking.paymentStatus,
  });
}
