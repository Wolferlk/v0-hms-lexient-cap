import { connectDB } from '@/lib/mongodb';
import { Order, MenuItem } from '@/lib/models/Restaurant';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    const query: any = {};
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;

    const orders = await Order.find(query)
      .populate('customerId', 'name email phone')
      .sort({ orderTime: -1 });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
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
    const { customerId, reservationId, items, discount } = body;

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate total with items
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return NextResponse.json(
          { success: false, error: `Menu item ${item.menuItemId} not found` },
          { status: 404 }
        );
      }

      const itemTotal = menuItem.price * item.quantity;
      subtotal += itemTotal;

      processedItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
        price: menuItem.price,
      });
    }

    const tax = Math.round(subtotal * 0.05); // 5% tax
    const discountAmount = discount || 0;
    const total = subtotal + tax - discountAmount;

    const order = new Order({
      customerId,
      reservationId,
      items: processedItems,
      subtotal,
      tax,
      discount: discountAmount,
      total,
      status: 'pending',
    });

    await order.save();
    const populated = await order.populate('customerId');

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { id, status, paymentStatus, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Order ID required' },
        { status: 400 }
      );
    }

    const updatePayload: any = { ...updateData, updatedAt: new Date() };

    if (status) {
      updatePayload.status = status;
      if (status === 'served' || status === 'completed') {
        updatePayload.completionTime = new Date();
      }
    }

    if (paymentStatus) {
      updatePayload.paymentStatus = paymentStatus;
    }

    const updated = await Order.findByIdAndUpdate(id, updatePayload, { new: true });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
