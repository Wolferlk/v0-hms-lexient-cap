import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/lib/models/Booking';
import { ObjectId } from 'mongodb';

type Params = { params: Promise<{ id: string }> };

// POST — add a charge
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!ObjectId.isValid(id))
      return NextResponse.json({ success: false, error: 'Invalid booking ID' }, { status: 400 });

    const booking = await Booking.findById(id);
    if (!booking)
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

    const { description, qty = 1, unitAmount } = await req.json();
    if (!description || !unitAmount || unitAmount <= 0)
      return NextResponse.json({ success: false, error: 'description and unitAmount are required' }, { status: 400 });

    booking.additionalCharges.push({
      description,
      qty,
      unitAmount,
      total: parseFloat((qty * unitAmount).toFixed(2)),
    });
    await booking.save();

    return NextResponse.json({ success: true, data: booking.additionalCharges }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// PUT — edit a charge
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const { chargeId, description, qty, unitAmount } = await req.json();

    if (!ObjectId.isValid(id) || !ObjectId.isValid(chargeId))
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const booking = await Booking.findById(id);
    if (!booking)
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

    const charge = booking.additionalCharges.id(chargeId);
    if (!charge)
      return NextResponse.json({ success: false, error: 'Charge not found' }, { status: 404 });

    if (description !== undefined) charge.description = description;
    if (qty !== undefined) charge.qty = qty;
    if (unitAmount !== undefined) charge.unitAmount = unitAmount;
    charge.total = parseFloat(((charge.qty) * (charge.unitAmount)).toFixed(2));

    await booking.save();
    return NextResponse.json({ success: true, data: booking.additionalCharges });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// DELETE — remove a charge
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const chargeId = searchParams.get('chargeId');

    if (!ObjectId.isValid(id) || !chargeId || !ObjectId.isValid(chargeId))
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const booking = await Booking.findById(id);
    if (!booking)
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

    (booking.additionalCharges as any).pull({ _id: chargeId });
    await booking.save();

    return NextResponse.json({ success: true, data: booking.additionalCharges });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
