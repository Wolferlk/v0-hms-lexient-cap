import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models/Room';
import { sampleRooms } from '@/lib/sampleData';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isAvailable = searchParams.get('available');

    let query: any = {};

    if (category) {
      query.category = category;
    }

    if (isAvailable === 'true') {
      query.isAvailable = true;
    } else if (isAvailable === 'false') {
      query.isAvailable = false;
    }

    const rooms = await Room.find(query).lean();
    const fallbackRooms = sampleRooms.filter((room) => {
      if (query.category && room.category !== query.category) return false;
      if (query.isAvailable !== undefined && room.isAvailable !== query.isAvailable) return false;
      return true;
    });

    return NextResponse.json(
      {
        success: true,
        data: rooms.length ? rooms : fallbackRooms,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Error fetching rooms:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch rooms',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      roomNumber,
      category,
      capacity,
      pricePerNight,
      description,
      amenities,
      images,
    } = body;

    // Validation
    if (!roomNumber || !capacity || !pricePerNight) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Check if room already exists
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return NextResponse.json(
        {
          success: false,
          error: 'Room number already exists',
        },
        { status: 409 }
      );
    }

    const newRoom = new Room({
      roomNumber,
      category: category || 'Standard',
      capacity,
      pricePerNight,
      description: description || '',
      amenities: amenities || [],
      images: images || [],
    });

    await newRoom.save();

    return NextResponse.json(
      {
        success: true,
        data: newRoom,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Error creating room:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create room',
      },
      { status: 500 }
    );
  }
}
