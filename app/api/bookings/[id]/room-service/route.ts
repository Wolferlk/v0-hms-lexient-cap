import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/lib/models/Booking';
import { Order, MenuItem } from '@/lib/models/Restaurant';
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
      return NextResponse.json({ success: false, error: 'Invalid booking ID' }, { status: 400 });
    }

    const orders = await Order.find({ bookingId: id, orderType: 'room-service' })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: orders }, { status: 200 });
  } catch (error) {
    console.error('[v0] Error fetching room service orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch room service orders' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid booking ID' }, { status: 400 });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'checked-in') {
      return NextResponse.json(
        { success: false, error: 'Room service is only available for checked-in guests' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { mealType, items, notes } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Validate items and compute prices
    const menuItemIds = items.map((i: { menuItemId: string }) => i.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } }).lean() as Array<{ _id: string; name: string; price: number }>;

    const room = booking.roomIds?.[0]
      ? await Room.findById(booking.roomIds[0]).lean() as { roomNumber?: string } | null
      : null;

    const safeCustomerId = ObjectId.isValid(booking.customerId)
      ? new ObjectId(booking.customerId)
      : undefined;

    const menuItemMap = new Map(menuItems.map((m) => [m._id.toString(), m]));

    const resolvedItems = items.map((item: { menuItemId: string; quantity: number; specialInstructions?: string }) => {
      const menu = menuItemMap.get(item.menuItemId.toString());
      if (!menu) throw new Error(`Menu item ${item.menuItemId} not found`);
      return {
        menuItemId: item.menuItemId,
        itemName: menu.name,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || '',
        price: menu.price,
      };
    });

    const subtotal = resolvedItems.reduce(
      (sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity,
      0
    );
    const tax = parseFloat((subtotal * 0.05).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    const order = new Order({
      bookingId: id,
      ...(safeCustomerId ? { customerId: safeCustomerId } : {}),
      orderType: 'room-service',
      mealType: mealType || 'lunch',
      roomNumber: room?.roomNumber || '',
      items: resolvedItems,
      subtotal,
      tax,
      discount: 0,
      total,
      paymentStatus: 'charged_to_room',
      paymentMethod: 'room_charge',
      status: 'pending',
    });

    await order.save();

    const savedOrder = await Order.findById(order._id).lean();

    return NextResponse.json({ success: true, data: savedOrder }, { status: 201 });
  } catch (error: unknown) {
    console.error('[v0] Error placing room service order:', error);
    const message = error instanceof Error ? error.message : 'Failed to place room service order';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, error: 'Valid orderId is required' }, { status: 400 });
    }

    const body = await request.json();
    const updated = await Order.findByIdAndUpdate(orderId, body, { new: true, runValidators: true });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error('[v0] Error updating room service order:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
