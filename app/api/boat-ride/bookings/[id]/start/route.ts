import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BoatBooking } from '@/lib/models/BoatBooking';
import { Boat } from '@/lib/models/BoatFleet';
import { BoatRider } from '@/lib/models/BoatRider';
import { ObjectId } from 'mongodb';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  await connectDB();
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

  const booking = await BoatBooking.findById(id);
  if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

  if (!['pending', 'confirmed'].includes(booking.status)) {
    return NextResponse.json(
      { success: false, error: `Cannot start a ride with status: ${booking.status}` },
      { status: 400 }
    );
  }

  if (!booking.boatId) {
    return NextResponse.json({ success: false, error: 'Assign a boat before starting' }, { status: 400 });
  }

  booking.status = 'riding';
  booking.startTime = new Date();
  await booking.save();

  // Set boat to on_ride
  await Boat.findByIdAndUpdate(booking.boatId, { status: 'on_ride' });

  // Set rider to on_ride
  if (booking.riderId) {
    await BoatRider.findByIdAndUpdate(booking.riderId, { status: 'on_ride' });
  }

  const populated = await BoatBooking.findById(id)
    .populate('packageId', 'name duration')
    .populate('boatId', 'name type')
    .populate('riderId', 'name riderType')
    .lean();

  return NextResponse.json({ success: true, data: populated });
}
