import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BoatBooking } from '@/lib/models/BoatBooking';
import { BoatRider } from '@/lib/models/BoatRider';
import { ObjectId } from 'mongodb';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const booking = await BoatBooking.findById(id)
      .populate('packageId', 'name duration pricePerPerson boatType')
      .populate('boatId', 'name type registrationNumber capacity')
      .populate('riderId', 'name riderType phone contractPricePerRideLKR monthlySalaryLKR')
      .lean();

    if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: booking });
  } catch (err) {
    console.error('[boat-ride/bookings/[id] GET]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const body = await req.json();

    // Snapshot rider type + contract amount at assignment time
    if (body.riderId) {
      const rider = await BoatRider.findById(body.riderId).lean() as any;
      if (rider) {
        body.riderTypeSnapshot = rider.riderType;
        body.riderContractAmountLKR = rider.riderType === 'contract'
          ? (rider.contractPricePerRideLKR ?? 0)
          : 0;
      }
    }

    const booking = await BoatBooking.findByIdAndUpdate(id, body, { new: true, runValidators: true })
      .populate('packageId', 'name duration')
      .populate('boatId', 'name type')
      .populate('riderId', 'name riderType');

    if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: booking });
  } catch (err) {
    console.error('[boat-ride/bookings/[id] PUT]', err);
    return NextResponse.json({ success: false, error: 'Failed to update booking' }, { status: 500 });
  }
}
