import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BoatRidePackage } from '@/lib/models/DayOut';

export async function GET() {
  try {
    await connectDB();
    const packages = await BoatRidePackage.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: packages });
  } catch (err) {
    console.error('[boat-ride/packages GET]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch packages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      name, description, boatType, capacity, price, pricePerPerson,
      duration, routeDescription, safetyRating, mealIncluded, lifeJacketsProvided,
    } = body;

    if (!name || !boatType || !capacity || !pricePerPerson || !duration) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const pkg = await BoatRidePackage.create({
      name, description: description || '',
      boatType, capacity: Number(capacity),
      price: Number(price) || 0,
      pricePerPerson: Number(pricePerPerson),
      duration: Number(duration),
      routeDescription: routeDescription || '',
      safetyRating: Number(safetyRating) || 5,
      mealIncluded: !!mealIncluded,
      lifeJacketsProvided: lifeJacketsProvided !== false,
    });

    return NextResponse.json({ success: true, data: pkg }, { status: 201 });
  } catch (err) {
    console.error('[boat-ride/packages POST]', err);
    return NextResponse.json({ success: false, error: 'Failed to create package' }, { status: 500 });
  }
}
