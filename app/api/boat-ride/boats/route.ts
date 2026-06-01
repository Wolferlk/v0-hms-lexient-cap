import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Boat } from '@/lib/models/BoatFleet';

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export async function GET() {
  try {
    await connectDB();
    const boats = await Boat.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: boats });
  } catch (err) {
    console.error('[boat-ride/boats GET]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch boats' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, type, registrationNumber, capacity, color, engineType, yearBuilt, notes } = body;

    if (!name || !type || !registrationNumber || !capacity) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const boat = await Boat.create({
      boatId: genId('BT'),
      name, type, registrationNumber,
      capacity: Number(capacity),
      color: color || '',
      engineType: engineType || '',
      yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
      notes: notes || '',
    });

    return NextResponse.json({ success: true, data: boat }, { status: 201 });
  } catch (err) {
    console.error('[boat-ride/boats POST]', err);
    return NextResponse.json({ success: false, error: 'Failed to add boat' }, { status: 500 });
  }
}
