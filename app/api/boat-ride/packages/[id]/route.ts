import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BoatRidePackage } from '@/lib/models/DayOut';
import { ObjectId } from 'mongodb';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  await connectDB();
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
  const body = await req.json();
  const pkg = await BoatRidePackage.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!pkg) return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: pkg });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await connectDB();
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
  await BoatRidePackage.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
