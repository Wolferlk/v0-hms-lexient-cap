import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BoatRider } from '@/lib/models/BoatRider';
import { syncCompanyRiderToStaff } from '@/lib/boatRiderStaffSync';
import { ObjectId } from 'mongodb';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  await connectDB();
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
  const body = await req.json();
  const rider = await BoatRider.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!rider) return NextResponse.json({ success: false, error: 'Rider not found' }, { status: 404 });
  await syncCompanyRiderToStaff(rider);
  return NextResponse.json({ success: true, data: rider });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await connectDB();
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
  await BoatRider.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
