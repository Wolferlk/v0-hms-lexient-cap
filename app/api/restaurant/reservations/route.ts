import { connectDB } from '@/lib/mongodb';
import { Reservation, Table } from '@/lib/models/Restaurant';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const date = searchParams.get('date');

    const query: any = {};
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.reservationDate = { $gte: startDate, $lt: endDate };
    }

    const reservations = await Reservation.find(query)
      .populate('customerId', 'name email phone')
      .populate('tableId', 'tableNumber capacity')
      .sort({ reservationDate: -1 });

    return NextResponse.json({ success: true, data: reservations });
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
    const { customerId, tableId, reservationDate, guestCount, specialRequests, contactPhone } = body;

    if (!customerId || !tableId || !reservationDate || !guestCount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify table exists and has capacity
    const table = await Table.findById(tableId);
    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Table not found' },
        { status: 404 }
      );
    }

    if (table.capacity < guestCount) {
      return NextResponse.json(
        { success: false, error: 'Table capacity exceeded' },
        { status: 400 }
      );
    }

    // Check for conflicts
    const conflictingReservation = await Reservation.findOne({
      tableId,
      reservationDate: new Date(reservationDate),
      status: { $in: ['pending', 'confirmed'] },
    });

    if (conflictingReservation) {
      return NextResponse.json(
        { success: false, error: 'Table already reserved for this time' },
        { status: 400 }
      );
    }

    const reservation = new Reservation({
      customerId,
      tableId,
      reservationDate: new Date(reservationDate),
      guestCount,
      specialRequests,
      contactPhone,
    });

    await reservation.save();

    // Update table status
    await Table.findByIdAndUpdate(tableId, { status: 'reserved' });

    const populated = await reservation.populate('customerId').populate('tableId');
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
    const { id, status, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Reservation ID required' },
        { status: 400 }
      );
    }

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Update status
    if (status === 'cancelled') {
      await Table.findByIdAndUpdate(reservation.tableId, { status: 'available' });
    }

    const updated = await Reservation.findByIdAndUpdate(
      id,
      { status, ...updateData, updatedAt: new Date() },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
