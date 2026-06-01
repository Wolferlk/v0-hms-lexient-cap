import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BoatBooking } from '@/lib/models/BoatBooking';

function genRef() {
  return `BR-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '0');

    const query: Record<string, any> = {};
    if (status && status !== 'all') query.status = status;
    if (date) {
      const d = new Date(date); d.setHours(0, 0, 0, 0);
      const d2 = new Date(d); d2.setDate(d2.getDate() + 1);
      query.scheduledDate = { $gte: d, $lt: d2 };
    }

    let q = BoatBooking.find(query)
      .populate('packageId', 'name duration pricePerPerson boatType')
      .populate('boatId', 'name type registrationNumber')
      .populate('riderId', 'name riderType phone')
      .sort({ scheduledDate: -1, createdAt: -1 });

    if (limit > 0) q = q.limit(limit);

    const bookings = await q.lean();
    return NextResponse.json({ success: true, data: bookings });
  } catch (err) {
    console.error('[boat-ride/bookings GET]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      customerName, customerPhone, customerEmail, customerType, nationality,
      packageId, numberOfPassengers, scheduledDate, scheduledTime,
      basePriceLKR, paymentCurrency, paymentAmountInCurrency, exchangeRateToLKR,
      notes,
    } = body;

    if (!customerName || !customerPhone || !packageId || !numberOfPassengers || !scheduledDate || !scheduledTime || !basePriceLKR) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const booking = await BoatBooking.create({
      bookingRef: genRef(),
      customerName, customerPhone,
      customerEmail: customerEmail || '',
      customerType: customerType || 'tourist',
      nationality: nationality || '',
      packageId,
      numberOfPassengers: Number(numberOfPassengers),
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      basePriceLKR: Number(basePriceLKR),
      paymentCurrency: paymentCurrency || 'LKR',
      paymentAmountInCurrency: Number(paymentAmountInCurrency) || Number(basePriceLKR),
      exchangeRateToLKR: exchangeRateToLKR ? Number(exchangeRateToLKR) : undefined,
      notes: notes || '',
    });

    const populated = await BoatBooking.findById(booking._id)
      .populate('packageId', 'name duration pricePerPerson boatType')
      .lean();

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (err) {
    console.error('[boat-ride/bookings POST]', err);
    return NextResponse.json({ success: false, error: 'Failed to create booking' }, { status: 500 });
  }
}
