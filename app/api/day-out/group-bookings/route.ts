import { connectDB } from '@/lib/mongodb';
import { GroupBooking, DayOutPackage } from '@/lib/models/DayOut';
import { NextRequest, NextResponse } from 'next/server';
import {
  sampleCustomers,
  sampleDayOutPackages,
  sampleGroupBookings,
  withPopulatedRelations,
} from '@/lib/sampleData';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: any = {};
    if (status) query.status = status;

    const bookings = await GroupBooking.find(query)
      .populate('packageId', 'name price pricePerPerson')
      .populate('customerId', 'name email phone')
      .sort({ bookingDate: -1 });

    const fallbackBookings = withPopulatedRelations(sampleGroupBookings, {
      packageId: sampleDayOutPackages,
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
      groupName,
      bookingDate,
      numberOfPeople,
      contactPerson,
      specialRequests,
    } = body;

    if (!packageId || !customerId || !groupName || !bookingDate || !numberOfPeople) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify package exists and check capacity
    const dayOutPackage = await DayOutPackage.findById(packageId);
    if (!dayOutPackage) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    if (numberOfPeople > dayOutPackage.maxGroupSize) {
      return NextResponse.json(
        { success: false, error: 'Group size exceeds package capacity' },
        { status: 400 }
      );
    }

    // Calculate pricing
    let totalPrice = numberOfPeople * dayOutPackage.pricePerPerson;
    if (dayOutPackage.discountPercentage) {
      totalPrice = totalPrice * (1 - dayOutPackage.discountPercentage / 100);
    }

    const depositAmount = Math.round(totalPrice * 0.3); // 30% deposit
    const balanceAmount = totalPrice - depositAmount;

    const booking = new GroupBooking({
      packageId,
      customerId,
      groupName,
      bookingDate: new Date(bookingDate),
      numberOfPeople,
      totalPrice,
      depositAmount,
      balanceAmount,
      contactPerson,
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

    const updated = await GroupBooking.findByIdAndUpdate(
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
