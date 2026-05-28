import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/lib/models/Booking';
import { Order } from '@/lib/models/Restaurant';
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

    const booking = await Booking.findById(id).lean() as (typeof Booking extends { new(): infer T } ? T : never) | null;

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const b = booking as any;

    // Fetch room details
    const rooms = await Room.find({ _id: { $in: b.roomIds } }).lean() as any[];

    // Fetch all room service orders for this booking
    const roomServiceOrders = await Order.find({
      bookingId: id,
      orderType: 'room-service',
    }).lean() as any[];

    // Build room charges line items
    const roomCharges = rooms.map((room: any) => ({
      description: `Room ${room.roomNumber} (${room.category}) × ${b.numberOfNights} night(s)`,
      unitPrice: room.pricePerNight,
      quantity: b.numberOfNights,
      total: room.pricePerNight * b.numberOfNights,
    }));

    const roomSubtotal = roomCharges.reduce((sum: number, r: any) => sum + r.total, 0);
    const discount = b.discountAmount || 0;
    const roomTotal = roomSubtotal - discount;

    // Build food order line items
    const foodLineItems: any[] = [];
    let foodSubtotal = 0;
    let foodTax = 0;

    for (const order of roomServiceOrders) {
      for (const item of order.items) {
        foodLineItems.push({
          description: `${item.itemName || 'Item'} (${order.mealType})`,
          unitPrice: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
          orderId: order._id,
          orderStatus: order.status,
        });
      }
      foodSubtotal += order.subtotal;
      foodTax += order.tax || 0;
    }

    const foodTotal = foodSubtotal + foodTax;
    const grandTotal = roomTotal + foodTotal;
    const amountPaid = b.amountPaid || 0;
    const balanceDue = Math.max(0, grandTotal - amountPaid);

    const invoice = {
      invoiceNumber: `INV-${b.bookingId}`,
      generatedAt: new Date().toISOString(),
      booking: {
        bookingId: b.bookingId,
        customerName: b.customerName,
        customerEmail: b.customerEmail,
        customerPhone: b.customerPhone,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        checkInTime: b.checkInTime,
        checkOutTime: b.checkOutTime,
        numberOfNights: b.numberOfNights,
        numberOfGuests: b.numberOfGuests,
        status: b.status,
        paymentStatus: b.paymentStatus,
        guestDocument: b.guestDocument,
      },
      roomCharges: {
        items: roomCharges,
        subtotal: roomSubtotal,
        discount,
        total: roomTotal,
      },
      foodCharges: {
        items: foodLineItems,
        subtotal: foodSubtotal,
        tax: foodTax,
        total: foodTotal,
      },
      summary: {
        roomTotal,
        foodTotal,
        grandTotal,
        amountPaid,
        balanceDue,
      },
      payments: b.payments || [],
    };

    return NextResponse.json({ success: true, data: invoice }, { status: 200 });
  } catch (error) {
    console.error('[v0] Error generating invoice:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate invoice' }, { status: 500 });
  }
}
