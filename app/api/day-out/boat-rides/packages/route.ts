import { connectDB } from '@/lib/mongodb';
import { BoatRidePackage } from '@/lib/models/DayOut';
import { NextRequest, NextResponse } from 'next/server';
import { sampleBoatRidePackages } from '@/lib/sampleData';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const packages = await BoatRidePackage.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: packages.length ? packages : sampleBoatRidePackages });
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
      boatType,
      capacity,
      price,
      pricePerPerson,
      duration,
      routeDescription,
      landmarks,
      mealIncluded,
      lifeJacketsProvided,
      safetyRating,
    } = body;

    if (!name || !boatType || !capacity || !price || !pricePerPerson || !duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const boatPackage = new BoatRidePackage({
      name,
      description,
      boatType,
      capacity,
      price,
      pricePerPerson,
      duration,
      routeDescription,
      landmarks,
      mealIncluded,
      lifeJacketsProvided,
      safetyRating,
    });

    await boatPackage.save();
    return NextResponse.json({ success: true, data: boatPackage }, { status: 201 });
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

    const updated = await BoatRidePackage.findByIdAndUpdate(id, updateData, { new: true });

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
