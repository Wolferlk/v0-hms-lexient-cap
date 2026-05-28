import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import {
  InventoryItem,
  InventoryTransaction,
} from '@/lib/models/Inventory';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const query: any = {};
    if (itemId) query.inventoryItem = itemId;
    if (type) query.type = type;

    const transactions = await InventoryTransaction.find(query)
      .populate('inventoryItem', 'name unit')
      .populate('createdBy', 'name')
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await InventoryTransaction.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[v0] Transactions GET error:', error);
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
      !body.inventoryItem ||
      !body.type ||
      !body.quantity ||
      !body.createdBy
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Get inventory item to verify it exists and get unit
    const item = await InventoryItem.findById(body.inventoryItem);
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    // Update inventory quantity based on transaction type
    let quantityChange = body.quantity;
    if (body.type === 'outbound' || body.type === 'damage') {
      quantityChange = -body.quantity;
    }

    item.quantity += quantityChange;
    if (item.quantity < 0) item.quantity = 0;
    await item.save();

    // Create transaction record
    const transaction = new InventoryTransaction({
      inventoryItem: body.inventoryItem,
      type: body.type,
      quantity: body.quantity,
      unit: item.unit,
      reference: body.reference,
      reason: body.reason,
      notes: body.notes,
      createdBy: body.createdBy,
      transactionDate: body.transactionDate || new Date(),
    });

    await transaction.save();
    await transaction.populate('inventoryItem', 'name unit');
    await transaction.populate('createdBy', 'name');

    return NextResponse.json(
      { success: true, data: transaction, updatedQuantity: item.quantity },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[v0] Transactions POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
