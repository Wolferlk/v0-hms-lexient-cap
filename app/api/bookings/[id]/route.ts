import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/lib/models/Booking';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid booking ID',
        },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: booking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Error fetching booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch booking',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid booking ID',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const updatedBooking = await Booking.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedBooking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Error updating booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update booking',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid booking ID',
        },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
        },
        { status: 404 }
      );
    }

    // Only allow deletion of cancelled or pending bookings
    if (booking.status !== 'pending' && booking.status !== 'cancelled') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete confirmed or checked-in bookings',
        },
        { status: 400 }
      );
    }

    await Booking.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: 'Booking deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Error deleting booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete booking',
      },
      { status: 500 }
    );
  }
}
