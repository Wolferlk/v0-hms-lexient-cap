import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/mongodb';
import { InventoryItem, Supplier } from '@/lib/models/Inventory';

function normalizeItemInput(body: any) {
  return {
    name: body.name,
    category: body.category,
    quantity: body.quantity ?? 0,
    unit: body.unit,
    minimumLevel: body.minimumLevel,
    maximumLevel: body.maximumLevel || body.minimumLevel * 2,
    unitCost: body.unitCost,
    supplier: body.supplier,
    location: body.location || 'Storage',
    expiryDate: body.expiryDate || undefined,
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Valid inventory item ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (
      !body.name ||
      !body.category ||
      !body.unit ||
      !body.supplier ||
      body.minimumLevel === undefined ||
      body.unitCost === undefined
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supplier = await Supplier.findById(body.supplier);
    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      );
    }

    const updated = await InventoryItem.findByIdAndUpdate(
      id,
      normalizeItemInput(body),
      { new: true, runValidators: true }
    ).populate('supplier', 'name');

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[v0] Inventory PUT error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
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
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Valid inventory item ID required' },
        { status: 400 }
      );
    }

    const deleted = await InventoryItem.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Inventory item deleted' });
  } catch (error: any) {
    console.error('[v0] Inventory DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
