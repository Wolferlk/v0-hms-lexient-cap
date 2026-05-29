import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { WeddingMenuPackage } from '@/lib/models/WeddingHall';
import { ObjectId } from 'mongodb';

const DEFAULT_PACKAGES = [
  { packageNumber: 1, name: 'Silver Package', description: 'Basic wedding menu with essential dishes', pricePerHead: 2500, items: ['Welcome Drink', 'Soup', '2 Veg Curries', '1 Non-Veg Curry', 'Rice & Bread', 'Dessert', 'Tea/Coffee'] },
  { packageNumber: 2, name: 'Gold Package', description: 'Popular choice with extended menu options', pricePerHead: 4000, items: ['Welcome Cocktail', 'Soup', '3 Veg Curries', '2 Non-Veg Curries', 'BBQ Station', 'Rice, Bread & Roti', '2 Desserts', 'Live Juice Counter'] },
  { packageNumber: 3, name: 'Platinum Package', description: 'Premium menu with diverse cuisine options', pricePerHead: 6000, items: ['Welcome Drinks Bar', 'International Soup', '4 Veg Curries', '3 Non-Veg Curries', 'Seafood Counter', 'Rice, Breads & Pasta', '3 Desserts', 'Fruit Counter', 'Ice Cream Station'] },
  { packageNumber: 4, name: 'Diamond Package', description: 'Luxury all-inclusive dining experience', pricePerHead: 8500, items: ['Open Bar (3 Hours)', 'Canapés', 'International Buffet (6 Sections)', 'Live Cooking Station', 'Seafood & Meat Carving', 'Pasta Bar', '4 Desserts', 'Cheese Station', 'Fruit Fountain', 'Midnight Snack'] },
  { packageNumber: 5, name: 'Royal Package', description: 'The ultimate wedding feast - all inclusive', pricePerHead: 12000, items: ['Unlimited Open Bar', 'Personalized Welcome Cocktail', 'Full International Buffet (8 Sections)', '2 Live Cooking Stations', 'Seafood Extravaganza', 'Spit Roast', 'Dedicated Dessert Hall', 'Chocolate Fountain', 'Wedding Cake', 'Late Night Grill', 'Personalized Menu Cards'] },
];

export async function GET() {
  try {
    await connectDB();
    let packages = await WeddingMenuPackage.find({ isActive: true }).sort({ packageNumber: 1 }).lean();

    // Seed defaults if none exist
    if (packages.length === 0) {
      await WeddingMenuPackage.insertMany(DEFAULT_PACKAGES.map(p => ({ ...p, isActive: true })));
      packages = await WeddingMenuPackage.find({ isActive: true }).sort({ packageNumber: 1 }).lean();
    }

    return NextResponse.json({ success: true, data: packages });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { packageNumber, name, description, pricePerHead, items } = body;

    if (!packageNumber || !name || pricePerHead === undefined) {
      return NextResponse.json(
        { success: false, error: 'Package number, name and price per head are required' },
        { status: 400 }
      );
    }

    const created = await WeddingMenuPackage.create({
      packageNumber,
      name,
      description: description || '',
      pricePerHead,
      items: Array.isArray(items) ? items.filter((item: string) => item.trim()) : [],
      isActive: true,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, ...update } = body;

    if (!id || !ObjectId.isValid(id))
      return NextResponse.json({ success: false, error: 'Valid package ID required' }, { status: 400 });

    const updated = await WeddingMenuPackage.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Valid package ID required' }, { status: 400 });
    }

    const deleted = await WeddingMenuPackage.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deleted) return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Package deleted' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
