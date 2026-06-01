import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Boat } from '@/lib/models/BoatFleet';
import { ObjectId } from 'mongodb';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    const boat = await Boat.findById(id).lean();
    if (!boat) return NextResponse.json({ success: false, error: 'Boat not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: boat });
  } catch (err) {
    console.error('[boat-ride/boats/[id] GET]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch boat' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    const body = await req.json();
    const boat = await Boat.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!boat) return NextResponse.json({ success: false, error: 'Boat not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: boat });
  } catch (err) {
    console.error('[boat-ride/boats/[id] PUT]', err);
    return NextResponse.json({ success: false, error: 'Failed to update boat' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    await Boat.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[boat-ride/boats/[id] DELETE]', err);
    return NextResponse.json({ success: false, error: 'Failed to delete boat' }, { status: 500 });
  }
}
