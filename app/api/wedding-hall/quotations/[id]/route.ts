import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { WeddingQuotation, WeddingMenuPackage, WeddingSupplierPackage } from '@/lib/models/WeddingHall';
import '@/lib/models/Inventory';
import { ObjectId } from 'mongodb';

type Params = { params: Promise<{ id: string }> };

function populateQuotationRelations(query: any) {
  query
    .populate('hallId', 'name capacity basePrice hallType features area amenities')
    .populate('menuPackageId', 'name pricePerHead items description');

  if (WeddingQuotation.schema.path('supplierId')) {
    query.populate('supplierId', 'name contactPerson email phone');
  }

  if (WeddingQuotation.schema.path('supplierPackageId')) {
    query.populate('supplierPackageId', 'packageType packageName price description supplierId');
  }

  return query;
}

function recalculateQuotationTotals(quotation: any) {
  quotation.additionalAmount = quotation.additionalItems.reduce((sum: number, item: any) => sum + item.total, 0);
  quotation.totalAmount =
    (quotation.baseAmount || 0) +
    (quotation.menuAmount || 0) +
    (quotation.supplierPackageAmount || 0) +
    (quotation.addOnsAmount || 0) +
    (quotation.additionalAmount || 0);
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!ObjectId.isValid(id))
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const q = await populateQuotationRelations(WeddingQuotation.findById(id));

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

    // ── ACTIVATE with advance payment (3-month active window) ────────────────
    if (action === 'activate') {
      // Allow reactivation of expired quotations if within reasonable grace period
      if (quotation.status === 'cancelled')
        return NextResponse.json({ success: false, error: 'Cancelled quotations cannot be reactivated' }, { status: 400 });

      const { amount, method, notes } = body;
      if (!amount || amount <= 0)
        return NextResponse.json({ success: false, error: 'Advance payment amount required' }, { status: 400 });

      // Set 3-month active window
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setMonth(expiryDate.getMonth() + 3);

      quotation.payments.push({ amount, method: method || 'cash', date: new Date(), notes: notes || '' });
      quotation.advancePaid = (quotation.advancePaid || 0) + amount;
      quotation.status = 'active';
      quotation.activatedDate = now;
      quotation.expiryDate = expiryDate;
      quotation.validUntil = expiryDate;
      
      // Generate QR code for bill scanning
      quotation.qrCode = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/wedding-bill/${quotation._id}`;
      
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

    // ── ADD ITEMS (before closing) ───────────────────────────────────────────
    if (action === 'add_items') {
      if (quotation.status === 'closed')
        return NextResponse.json({ success: false, error: 'Cannot add items to closed quotation' }, { status: 400 });
        
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

      recalculateQuotationTotals(quotation);
      await quotation.save();
      return NextResponse.json({ success: true, data: quotation });
    }

    // ── EDIT ITEMS ───────────────────────────────────────────────────────────
    if (action === 'edit_items') {
      if (quotation.status === 'closed')
        return NextResponse.json({ success: false, error: 'Cannot edit items in closed quotation' }, { status: 400 });

      const { itemIndex, name, quantity, unitPrice } = body;
      if (itemIndex === undefined || itemIndex < 0 || itemIndex >= quotation.additionalItems.length)
        return NextResponse.json({ success: false, error: 'Invalid item index' }, { status: 400 });

      quotation.additionalItems[itemIndex] = {
        name: name || quotation.additionalItems[itemIndex].name,
        quantity: quantity || quotation.additionalItems[itemIndex].quantity,
        unitPrice: unitPrice !== undefined ? unitPrice : quotation.additionalItems[itemIndex].unitPrice,
        total: (unitPrice !== undefined ? unitPrice : quotation.additionalItems[itemIndex].unitPrice) * (quantity || quotation.additionalItems[itemIndex].quantity),
      };

      recalculateQuotationTotals(quotation);
      await quotation.save();
      return NextResponse.json({ success: true, data: quotation });
    }

    // ── DELETE ITEM ──────────────────────────────────────────────────────────
    if (action === 'delete_item') {
      if (quotation.status === 'closed')
        return NextResponse.json({ success: false, error: 'Cannot delete items from closed quotation' }, { status: 400 });

      const { itemIndex } = body;
      if (itemIndex === undefined || itemIndex < 0 || itemIndex >= quotation.additionalItems.length)
        return NextResponse.json({ success: false, error: 'Invalid item index' }, { status: 400 });

      quotation.additionalItems.splice(itemIndex, 1);
      recalculateQuotationTotals(quotation);
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

    // ── REACTIVATE expired quotation (if within grace period) ─────────────────
    if (action === 'reactivate') {
      if (quotation.status !== 'expired')
        return NextResponse.json({ success: false, error: 'Only expired quotations can be reactivated' }, { status: 400 });

      const { amount, method, notes } = body;
      if (!amount || amount <= 0)
        return NextResponse.json({ success: false, error: 'Advance payment required to reactivate' }, { status: 400 });

      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setMonth(expiryDate.getMonth() + 3);

      quotation.payments.push({ amount, method: method || 'cash', date: new Date(), notes: notes || '' });
      quotation.advancePaid = (quotation.advancePaid || 0) + amount;
      quotation.status = 'active';
      quotation.activatedDate = now;
      quotation.expiryDate = expiryDate;
      quotation.validUntil = expiryDate;
      
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
    const { menuPackageId, supplierPackageId } = body;
    let menuAmount = quotation.menuAmount;
    let supplierPackageAmount = quotation.supplierPackageAmount || 0;
    if (menuPackageId) {
      const pkg = await WeddingMenuPackage.findById(menuPackageId).lean() as any;
      if (pkg) menuAmount = pkg.pricePerHead * (body.pax || quotation.pax);
    }
    if (supplierPackageId) {
      const supplierPkg = await WeddingSupplierPackage.findById(supplierPackageId).lean() as any;
      supplierPackageAmount = supplierPkg?.price || 0;
    }

    const updated = await populateQuotationRelations(WeddingQuotation.findByIdAndUpdate(
      id,
      { ...body, menuAmount, supplierPackageAmount, totalAmount: quotation.baseAmount + menuAmount + supplierPackageAmount + quotation.addOnsAmount + quotation.additionalAmount },
      { new: true, runValidators: true }
    ));

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
