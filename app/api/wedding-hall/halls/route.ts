import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { WeddingHall } from '@/lib/models/WeddingHall';
import { sampleWeddingHalls } from '@/lib/sampleData';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const existingHallCount = await WeddingHall.countDocuments({});
    if (existingHallCount === 0) {
      await WeddingHall.insertMany(
        sampleWeddingHalls.map((hall) => ({
          ...hall,
          hallType: 'standard',
          features: {
            airConditioned: true,
            parking: true,
            kitchenAccess: true,
            danceFloor: true,
            stage: true,
            soundSystem: true,
          },
        })),
        { ordered: false }
      );
    }

    const { searchParams } = new URL(request.url);
    const minCapacity = parseInt(searchParams.get('minCapacity') || '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') || '999999');
    const availability = searchParams.get('availability');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: any = {
      capacity: { $gte: minCapacity },
      basePrice: { $lte: maxPrice },
    };

    if (availability) query.availability = availability;

    const halls = await WeddingHall.find(query)
      .sort({ basePrice: 1 })
      .skip(skip)
      .limit(limit);

    const total = await WeddingHall.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: halls,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[v0] Wedding halls GET error:', error);
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

    if (!body.name || !body.capacity || body.basePrice === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const hall = new WeddingHall({
      name: body.name,
      hallType: body.hallType || 'standard',
      capacity: body.capacity,
      area: body.area || 0,
      basePrice: body.basePrice,
      amenities: body.amenities || [],
      images: body.images || [],
      description: body.description || '',
      features: body.features || {
        airConditioned: false,
        parking: false,
        kitchenAccess: false,
        danceFloor: false,
        stage: false,
        soundSystem: false,
      },
    });

    await hall.save();

    return NextResponse.json(
      { success: true, data: hall },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[v0] Wedding halls POST error:', error);
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
    const { id, ...update } = body;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Valid hall ID required' },
        { status: 400 }
      );
    }

    const hall = await WeddingHall.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!hall) {
      return NextResponse.json(
        { success: false, error: 'Wedding hall not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: hall });
  } catch (error: any) {
    console.error('[v0] Wedding halls PUT error:', error);
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

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Valid hall ID required' },
        { status: 400 }
      );
    }

    const hall = await WeddingHall.findByIdAndDelete(id);
    if (!hall) {
      return NextResponse.json(
        { success: false, error: 'Wedding hall not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Wedding hall deleted' });
  } catch (error: any) {
    console.error('[v0] Wedding halls DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
