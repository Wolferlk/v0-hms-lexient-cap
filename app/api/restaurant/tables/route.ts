import { connectDB } from '@/lib/mongodb';
import { Table } from '@/lib/models/Restaurant';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const capacity = searchParams.get('capacity');

    const query: any = {};
    if (status) query.status = status;
    if (capacity) query.capacity = { $gte: parseInt(capacity) };

    const tables = await Table.find(query).sort({ tableNumber: 1 });
    return NextResponse.json({ success: true, data: tables });
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
    const { tableNumber, capacity, location, amenities } = body;

    if (!tableNumber || !capacity || !location) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if table already exists
    const existing = await Table.findOne({ tableNumber });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Table number already exists' },
        { status: 400 }
      );
    }

    const table = new Table({
      tableNumber,
      capacity,
      location,
      amenities,
    });

    await table.save();
    return NextResponse.json({ success: true, data: table }, { status: 201 });
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
        { success: false, error: 'Table ID required' },
        { status: 400 }
      );
    }

    const updated = await Table.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Table not found' },
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
