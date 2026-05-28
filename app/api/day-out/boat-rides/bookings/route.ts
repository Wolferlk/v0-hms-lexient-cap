import { connectDB } from '@/lib/mongodb';
import { BoatRideBooking, BoatRidePackage } from '@/lib/models/DayOut';
import { NextRequest, NextResponse } from 'next/server';
import {
  sampleBoatRideBookings,
  sampleBoatRidePackages,
  sampleCustomers,
  withPopulatedRelations,
} from '@/lib/sampleData';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: any = {};
    if (status) query.status = status;

    const bookings = await BoatRideBooking.find(query)
      .populate('packageId', 'name boatType capacity pricePerPerson')
      .populate('customerId', 'name email phone')
      .sort({ bookingDate: -1 });

    const fallbackBookings = withPopulatedRelations(sampleBoatRideBookings, {
      packageId: sampleBoatRidePackages,
      customerId: sampleCustomers,
    }).filter((booking) => {
      if (query.status && booking.status !== query.status) return false;
      return true;
    });

    return NextResponse.json({ success: true, data: bookings.length ? bookings : fallbackBookings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      packageId,
      customerId,
      bookingDate,
      departureTime,
      numberOfPassengers,
      specialRequests,
    } = body;

    if (!packageId || !customerId || !bookingDate || !departureTime || !numberOfPassengers) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify package exists
    const boatPackage = await BoatRidePackage.findById(packageId);
    if (!boatPackage) {
      return NextResponse.json(
        { success: false, error: 'Boat package not found' },
        { status: 404 }
      );
    }

    if (numberOfPassengers > boatPackage.capacity) {
      return NextResponse.json(
        { success: false, error: 'Number of passengers exceeds boat capacity' },
        { status: 400 }
      );
    }

    const totalPrice = numberOfPassengers * boatPackage.pricePerPerson;

    const booking = new BoatRideBooking({
      packageId,
      customerId,
      bookingDate: new Date(bookingDate),
      departureTime,
      numberOfPassengers,
      totalPrice,
      specialRequests,
    });

    await booking.save();
    const populated = await booking.populate('packageId').populate('customerId');

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Booking ID required' },
        { status: 400 }
      );
    }

    const updated = await BoatRideBooking.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
