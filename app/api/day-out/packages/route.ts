import { connectDB } from '@/lib/mongodb';
import { DayOutPackage } from '@/lib/models/DayOut';
import { NextRequest, NextResponse } from 'next/server';
import { sampleDayOutPackages } from '@/lib/sampleData';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const packages = await DayOutPackage.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: packages.length ? packages : sampleDayOutPackages });
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

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Package ID required' }, { status: 400 });
    }

    await DayOutPackage.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Package deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
