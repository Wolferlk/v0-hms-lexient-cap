import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { WeddingQuotation, WeddingHall, WeddingMenuPackage } from '@/lib/models/WeddingHall';

function generateQuoteNumber() {
  return `WQ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming');
    const limit = parseInt(searchParams.get('limit') || '0');

    const query: any = {};
    if (status) query.status = status;
    if (upcoming === 'true') {
      query.eventDate = { $gte: new Date() };
      if (!status) query.status = { $in: ['draft', 'active'] };
    }

    // Auto-expire quotations that have exceeded validUntil date
    const now = new Date();
    await WeddingQuotation.updateMany(
      { 
        status: 'active', 
        validUntil: { $lt: now },
        expiryDate: { $exists: false }
      },
      { 
        $set: { 
          status: 'expired',
          expiryDate: now
        } 
      }
    );

    // Also expire draft quotations
    await WeddingQuotation.updateMany(
      { status: 'draft', validUntil: { $lt: now } },
      { $set: { status: 'expired' } }
    );

    let q = WeddingQuotation.find(query)
      .populate('hallId', 'name capacity basePrice hallType features')
      .populate('menuPackageId', 'name pricePerHead items description')
      .sort(upcoming === 'true' ? { eventDate: 1 } : { createdAt: -1 });

    if (limit > 0) q = q.limit(limit);

    const quotations = await q.lean();
    return NextResponse.json({ success: true, data: quotations });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      hallId,
      clientName,
      clientEmail,
      clientPhone,
      eventDate,
      eventStartTime,
      eventEndTime,
      eventType,
      pax,
      menuPackageId,
      customMenuItems,
      addOns,
      additionalItems,
      notes,
    } = body;

    if (!hallId || !clientName || !clientEmail || !clientPhone || !eventDate || !pax) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const hall = await WeddingHall.findById(hallId).lean() as any;
    if (!hall) return NextResponse.json({ success: false, error: 'Hall not found' }, { status: 404 });

    // Calculate amounts
    const baseAmount = hall.basePrice || 0;

    let menuAmount = 0;
    if (menuPackageId) {
      const menuPkg = await WeddingMenuPackage.findById(menuPackageId).lean() as any;
      if (menuPkg) menuAmount = menuPkg.pricePerHead * pax;
    }

    const addOnsAmount = (addOns || []).reduce((s: number, a: any) => s + (a.price || 0), 0);
    const additionalAmount = (additionalItems || []).reduce(
      (s: number, i: any) => s + (i.unitPrice || 0) * (i.quantity || 1),
      0
    );
    const resolvedAdditional = (additionalItems || []).map((i: any) => ({
      ...i,
      total: i.unitPrice * i.quantity,
    }));

    const totalAmount = baseAmount + menuAmount + addOnsAmount + additionalAmount;

    const quotationDate = new Date();
    const validUntil = new Date(quotationDate);
    validUntil.setMonth(validUntil.getMonth() + 3);

    const quotation = new WeddingQuotation({
      quoteNumber: generateQuoteNumber(),
      hallId,
      clientName,
      clientEmail,
      clientPhone,
      eventDate: new Date(eventDate),
      eventStartTime: eventStartTime || '18:00',
      eventEndTime: eventEndTime || '23:00',
      eventType: eventType || 'wedding',
      pax,
      menuPackageId: menuPackageId || undefined,
      customMenuItems: customMenuItems || [],
      addOns: addOns || [],
      additionalItems: resolvedAdditional,
      baseAmount,
      menuAmount,
      addOnsAmount,
      additionalAmount,
      totalAmount,
      advancePaid: 0,
      payments: [],
      quotationDate,
      validUntil,
      status: 'draft',
      notes: notes || '',
    });

    await quotation.save();
    const populated = await WeddingQuotation.findById(quotation._id)
      .populate('hallId', 'name capacity basePrice')
      .populate('menuPackageId', 'name pricePerHead');

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
