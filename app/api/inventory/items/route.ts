import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { InventoryItem, Supplier } from '@/lib/models/Inventory';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: any = {};
    if (category) query.category = category;

    const items = await InventoryItem.find(query)
      .populate('supplier', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await InventoryItem.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[v0] Inventory GET error:', error);
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
      !body.name ||
      !body.category ||
      !body.unit ||
      !body.supplier ||
      body.minimumLevel === undefined ||
      body.unitCost === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Verify supplier exists
    const supplier = await Supplier.findById(body.supplier);
    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      );
    }

    const item = new InventoryItem({
      name: body.name,
      category: body.category,
      quantity: body.quantity || 0,
      unit: body.unit,
      minimumLevel: body.minimumLevel,
      maximumLevel: body.maximumLevel || body.minimumLevel * 2,
      unitCost: body.unitCost,
      supplier: body.supplier,
      location: body.location || 'Storage',
      expiryDate: body.expiryDate,
    });

    await item.save();
    await item.populate('supplier', 'name');

    return NextResponse.json(
      { success: true, data: item },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[v0] Inventory POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
