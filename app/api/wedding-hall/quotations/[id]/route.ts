import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { WeddingQuotation, WeddingMenuPackage } from '@/lib/models/WeddingHall';
import { ObjectId } from 'mongodb';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!ObjectId.isValid(id))
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const q = await WeddingQuotation.findById(id)
      .populate('hallId', 'name capacity basePrice area amenities')
      .populate('menuPackageId', 'name pricePerHead items description');

    if (!q) return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: q });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!ObjectId.isValid(id))
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const body = await req.json();
    const { action } = body;

    const quotation = await WeddingQuotation.findById(id);
    if (!quotation) return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 });

    // ── ACTIVATE with advance payment ────────────────────────────────────────
    if (action === 'activate') {
      if (quotation.status === 'expired')
        return NextResponse.json({ success: false, error: 'Quotation has expired' }, { status: 400 });

      const { amount, method, notes } = body;
      if (!amount || amount <= 0)
        return NextResponse.json({ success: false, error: 'Advance payment amount required' }, { status: 400 });

      quotation.payments.push({ amount, method: method || 'cash', date: new Date(), notes: notes || '' });
      quotation.advancePaid = (quotation.advancePaid || 0) + amount;
      quotation.status = 'active';
      await quotation.save();
      return NextResponse.json({ success: true, data: quotation });
    }

    // ── ADD PAYMENT ──────────────────────────────────────────────────────────
    if (action === 'add_payment') {
      const { amount, method, notes } = body;
      if (!amount || amount <= 0)
        return NextResponse.json({ success: false, error: 'Payment amount required' }, { status: 400 });

      quotation.payments.push({ amount, method: method || 'cash', date: new Date(), notes: notes || '' });
      quotation.advancePaid = (quotation.advancePaid || 0) + amount;
      await quotation.save();
      return NextResponse.json({ success: true, data: quotation });
    }

    // ── ADD ITEMS ────────────────────────────────────────────────────────────
    if (action === 'add_items') {
      const { additionalItems } = body;
      if (!additionalItems || additionalItems.length === 0)
        return NextResponse.json({ success: false, error: 'No items provided' }, { status: 400 });

      for (const item of additionalItems) {
        quotation.additionalItems.push({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity,
        });
      }

      quotation.additionalAmount = quotation.additionalItems.reduce((s: number, i: any) => s + i.total, 0);
      quotation.totalAmount =
        quotation.baseAmount + quotation.menuAmount + quotation.addOnsAmount + quotation.additionalAmount;
      await quotation.save();
      return NextResponse.json({ success: true, data: quotation });
    }

    // ── CLOSE QUOTATION (final payment) ──────────────────────────────────────
    if (action === 'close') {
      if (quotation.status !== 'active')
        return NextResponse.json({ success: false, error: 'Only active quotations can be closed' }, { status: 400 });

      const { amount, method, notes } = body;
      if (amount && amount > 0) {
        quotation.payments.push({ amount, method: method || 'cash', date: new Date(), notes: notes || '' });
        quotation.advancePaid = (quotation.advancePaid || 0) + amount;
      }

      quotation.status = 'closed';
      await quotation.save();
      return NextResponse.json({ success: true, data: quotation });
    }

    // ── CANCEL ───────────────────────────────────────────────────────────────
    if (action === 'cancel') {
      quotation.status = 'cancelled';
      await quotation.save();
      return NextResponse.json({ success: true, data: quotation });
    }

    // ── GENERAL UPDATE ───────────────────────────────────────────────────────
    const { menuPackageId } = body;
    let menuAmount = quotation.menuAmount;
    if (menuPackageId) {
      const pkg = await WeddingMenuPackage.findById(menuPackageId).lean() as any;
      if (pkg) menuAmount = pkg.pricePerHead * (body.pax || quotation.pax);
    }

    const updated = await WeddingQuotation.findByIdAndUpdate(
      id,
      { ...body, menuAmount, totalAmount: quotation.baseAmount + menuAmount + quotation.addOnsAmount + quotation.additionalAmount },
      { new: true, runValidators: true }
    )
      .populate('hallId', 'name capacity basePrice')
      .populate('menuPackageId', 'name pricePerHead');

    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!ObjectId.isValid(id))
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    await WeddingQuotation.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Quotation deleted' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
