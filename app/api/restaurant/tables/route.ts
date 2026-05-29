import { connectDB } from '@/lib/mongodb';
import { Table } from '@/lib/models/Restaurant';
import { NextRequest, NextResponse } from 'next/server';
import { sampleRestaurantTables } from '@/lib/sampleData';

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
    const fallbackTables = sampleRestaurantTables.filter((table) => {
      if (query.status && table.status !== query.status) return false;
      if (query.capacity?.$gte && table.capacity < query.capacity.$gte) return false;
      return true;
    });
    return NextResponse.json({ success: true, data: tables.length ? tables : fallbackTables });
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

    const tableCount = await Table.countDocuments();
    if (tableCount >= 50) {
      return NextResponse.json(
        { success: false, error: 'Restaurant table limit reached (50)' },
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

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Table ID required' }, { status: 400 });
    }

    const deleted = await Table.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Table not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
