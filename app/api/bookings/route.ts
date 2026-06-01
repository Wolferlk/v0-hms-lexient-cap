import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/lib/models/Booking';
import { Room } from '@/lib/models/Room';
import { Customer } from '@/lib/models/Customer';
import { sampleBookings } from '@/lib/sampleData';

function generateBookingId(): string {
  return `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const upcoming = searchParams.get('upcoming');
    const limit = parseInt(searchParams.get('limit') || '0');

    let query: any = {};

    if (status) query.status = status;
    if (customerId) query.customerId = customerId;
    if (upcoming === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.checkInDate = { $gte: today };
      if (!status) query.status = { $in: ['pending', 'confirmed'] };
    }

    let bookingsQuery = Booking.find(query);
    if (upcoming === 'true') {
      bookingsQuery = bookingsQuery.sort({ checkInDate: 1 });
    } else {
      bookingsQuery = bookingsQuery.sort({ createdAt: -1 });
    }
    if (limit > 0) bookingsQuery = bookingsQuery.limit(limit);

    const bookings = await bookingsQuery.lean();

    const fallbackBookings = sampleBookings.filter((booking) => {
      if (query.status && booking.status !== query.status) return false;
      if (query.customerId && booking.customerId !== query.customerId) return false;
      return true;
    });

    return NextResponse.json(
      {
        success: true,
        data: bookings.length ? bookings : fallbackBookings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Error fetching bookings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch bookings',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      roomIds,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      promoCode,
    } = body;

    // Validation
    if (
      !customerId ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !roomIds ||
      roomIds.length === 0 ||
      !checkInDate ||
      !checkOutDate ||
      !numberOfGuests
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
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

    // Calculate number of nights (round handles DST boundary edge cases)
    const numberOfNights = Math.round(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get rooms and calculate total amount
    const rooms = await Room.find({ _id: { $in: roomIds } });

    if (rooms.length !== roomIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'One or more rooms not found',
        },
        { status: 404 }
      );
    }

    let totalAmount = 0;
    rooms.forEach((room) => {
      totalAmount += room.pricePerNight * numberOfNights;
    });

    // Apply promo code discount if provided
    let discountAmount = 0;
    if (promoCode) {
      // Simple discount logic - can be enhanced
      if (promoCode === 'WELCOME10') {
        discountAmount = totalAmount * 0.1;
      } else if (promoCode === 'WELCOME20') {
        discountAmount = totalAmount * 0.2;
      }
    }

    const finalAmount = totalAmount - discountAmount;

    // Create booking
    const bookingId = generateBookingId();
    const newBooking = new Booking({
      bookingId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      roomIds,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfNights,
      numberOfGuests,
      totalAmount,
      promoCode: promoCode || '',
      discountAmount,
      status: 'pending',
      paymentStatus: 'unpaid',
    });

    await newBooking.save();

    // Update customer booking count and total spent only for real customer records.
    if (ObjectId.isValid(customerId)) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        await Customer.findByIdAndUpdate(
          customerId,
          {
            $inc: {
              totalBookings: 1,
              totalSpent: finalAmount,
            },
          },
          { upsert: false }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: newBooking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Error creating booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create booking',
      },
      { status: 500 }
    );
  }
}
