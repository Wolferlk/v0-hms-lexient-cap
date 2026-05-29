import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Boat } from '@/lib/models/BoatFleet';
import { ObjectId } from 'mongodb';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  await connectDB();
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

  const body = await req.json();
  const { type, description, costLKR, performedBy, nextDueDateNote } = body;

  if (!type || !description) {
    return NextResponse.json({ success: false, error: 'type and description required' }, { status: 400 });
  }

  const boat = await Boat.findByIdAndUpdate(
    id,
    {
      $push: {
        serviceRecords: {
          date: new Date(),
          type,
          description,
          costLKR: Number(costLKR) || 0,
          performedBy: performedBy || '',
          nextDueDateNote: nextDueDateNote || '',
        },
      },
    },
    { new: true }
  );

  if (!boat) return NextResponse.json({ success: false, error: 'Boat not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: boat }, { status: 201 });
}
