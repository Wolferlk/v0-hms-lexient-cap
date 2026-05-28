import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { WeddingEvent, WeddingHall } from '@/lib/models/WeddingHall';
import { sampleWeddingEvents, sampleWeddingHalls, withPopulatedRelations } from '@/lib/sampleData';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const hallId = searchParams.get('hallId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status) query.status = status;
    if (hallId) query.hallId = hallId;

    const events = await WeddingEvent.find(query)
      .populate('hallId', 'name capacity')
      .sort({ eventDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await WeddingEvent.countDocuments(query);
    const fallbackEvents = withPopulatedRelations(sampleWeddingEvents, {
      hallId: sampleWeddingHalls,
    }).filter((event) => {
      if (query.status && event.status !== query.status) return false;
      if (query.hallId) {
        const resolvedHallId = typeof event.hallId === 'object' ? event.hallId?._id : event.hallId;
        if (resolvedHallId !== query.hallId) return false;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      data: events.length ? events : fallbackEvents,
      pagination: {
        total: events.length ? total : fallbackEvents.length,
        page,
        limit,
        pages: Math.ceil((events.length ? total : fallbackEvents.length) / limit),
      },
    });
  } catch (error: any) {
    console.error('[v0] Wedding events GET error:', error);
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

    // Validate required fields
    if (
      !body.hallId ||
      !body.clientName ||
      !body.clientPhone ||
      !body.eventDate ||
      !body.totalPrice
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify hall exists
    const hall = await WeddingHall.findById(body.hallId);
    if (!hall) {
      return NextResponse.json(
        { success: false, error: 'Wedding hall not found' },
        { status: 404 }
      );
    }

    const event = new WeddingEvent({
      hallId: body.hallId,
      clientName: body.clientName,
      clientEmail: body.clientEmail || '',
      clientPhone: body.clientPhone,
      eventDate: new Date(body.eventDate),
      eventType: body.eventType || 'wedding',
      expectedGuests: body.expectedGuests || 0,
      totalPrice: body.totalPrice,
      advancePayment: body.advancePayment || 0,
      remainingPayment: body.totalPrice - (body.advancePayment || 0),
      status: body.status || 'inquiry',
      notes: body.notes,
      requirements: body.requirements || [],
      contactPerson: body.contactPerson || body.clientName,
    });

    await event.save();
    await event.populate('hallId', 'name capacity');

    return NextResponse.json(
      { success: true, data: event },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[v0] Wedding events POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
