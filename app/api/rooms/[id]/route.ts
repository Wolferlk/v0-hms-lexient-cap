import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Room } from '@/lib/models/Room';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid room ID',
        },
        { status: 400 }
      );
    }

    const room = await Room.findById(id);

    if (!room) {
      return NextResponse.json(
        {
          success: false,
          error: 'Room not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: room,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Error fetching room:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch room',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid room ID',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const updatedRoom = await Room.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedRoom) {
      return NextResponse.json(
        {
          success: false,
          error: 'Room not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedRoom,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Error updating room:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update room',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid room ID',
        },
        { status: 400 }
      );
    }

    const deletedRoom = await Room.findByIdAndDelete(id);

    if (!deletedRoom) {
      return NextResponse.json(
        {
          success: false,
          error: 'Room not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Room deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Error deleting room:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete room',
      },
      { status: 500 }
    );
  }
}
