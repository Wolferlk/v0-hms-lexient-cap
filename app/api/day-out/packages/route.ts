import { connectDB } from '@/lib/mongodb';
import { DayOutPackage } from '@/lib/models/DayOut';
import { ensureDayOutPackagesSeeded } from '@/lib/dayOutSeed';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await ensureDayOutPackagesSeeded();

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

    const normalizedPricePerPerson = Number(pricePerPerson) || 0;
    const normalizedPrice = Number(price) || normalizedPricePerPerson;

    if (!name || !capacity || !duration || !maxGroupSize || !normalizedPricePerPerson) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const dayOutPackage = new DayOutPackage({
      name,
      description,
      price: normalizedPrice,
      capacity: Number(capacity),
      duration: Number(duration),
      activities: Array.isArray(activities) ? activities : [],
      inclusions: Array.isArray(inclusions) ? inclusions : [],
      minGroupSize: Number(minGroupSize) || 1,
      maxGroupSize: Number(maxGroupSize),
      pricePerPerson: normalizedPricePerPerson,
      discountPercentage: Number(discountPercentage) || 0,
      amenities: Array.isArray(amenities) ? amenities : [],
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

    const normalizedUpdate = {
      ...updateData,
      price: Number(updateData.price) || Number(updateData.pricePerPerson) || 0,
      capacity: Number(updateData.capacity) || 1,
      duration: Number(updateData.duration) || 1,
      minGroupSize: Number(updateData.minGroupSize) || 1,
      maxGroupSize: Number(updateData.maxGroupSize) || 1,
      pricePerPerson: Number(updateData.pricePerPerson) || 0,
      discountPercentage: Number(updateData.discountPercentage) || 0,
      activities: Array.isArray(updateData.activities) ? updateData.activities : [],
      inclusions: Array.isArray(updateData.inclusions) ? updateData.inclusions : [],
      amenities: Array.isArray(updateData.amenities) ? updateData.amenities : [],
    };

    const updated = await DayOutPackage.findByIdAndUpdate(id, normalizedUpdate, {
      new: true,
      runValidators: true,
    });

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
