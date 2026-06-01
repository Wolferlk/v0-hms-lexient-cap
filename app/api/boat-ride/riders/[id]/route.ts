import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BoatRider } from '@/lib/models/BoatRider';
import { syncBoatRiderToStaff } from '@/lib/boatRiderStaffSync';
import { Employee } from '@/lib/models/Staff';
import { ObjectId } from 'mongodb';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    const body = await req.json();
    const rider = await BoatRider.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!rider) return NextResponse.json({ success: false, error: 'Rider not found' }, { status: 404 });
    await syncBoatRiderToStaff(rider);
    return NextResponse.json({ success: true, data: rider });
  } catch (err) {
    console.error('[boat-ride/riders/[id] PUT]', err);
    return NextResponse.json({ success: false, error: 'Failed to update rider' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    const rider = await BoatRider.findById(id);
    if (rider?.staffEmployeeId) {
      await Employee.findByIdAndUpdate(rider.staffEmployeeId, {
        status: 'terminated',
        updatedAt: new Date(),
      });
    }
    await BoatRider.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[boat-ride/riders/[id] DELETE]', err);
    return NextResponse.json({ success: false, error: 'Failed to delete rider' }, { status: 500 });
  }
}
