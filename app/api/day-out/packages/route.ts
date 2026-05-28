import { connectDB } from '@/lib/mongodb';
import { DayOutPackage } from '@/lib/models/DayOut';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const packages = await DayOutPackage.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: packages });
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
    const {
      name,
      description,
      price,
      capacity,
      duration,
      activities,
      inclusions,
      minGroupSize,
      maxGroupSize,
      pricePerPerson,
      discountPercentage,
      amenities,
    } = body;

    if (!name || !price || !capacity || !duration || !maxGroupSize || !pricePerPerson) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const dayOutPackage = new DayOutPackage({
      name,
      description,
      price,
      capacity,
      duration,
      activities,
      inclusions,
      minGroupSize,
      maxGroupSize,
      pricePerPerson,
      discountPercentage,
      amenities,
    });

    await dayOutPackage.save();
    return NextResponse.json({ success: true, data: dayOutPackage }, { status: 201 });
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
        { success: false, error: 'Package ID required' },
        { status: 400 }
      );
    }

    const updated = await DayOutPackage.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
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
