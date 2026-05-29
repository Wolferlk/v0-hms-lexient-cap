import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/lib/models/Booking';
import { Order } from '@/lib/models/Restaurant';
import { Room } from '@/lib/models/Room';
import { ObjectId } from 'mongodb';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!ObjectId.isValid(id))
      return NextResponse.json({ success: false, error: 'Invalid booking ID' }, { status: 400 });

    const booking = await Booking.findById(id).lean() as any;
    if (!booking)
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

    // Room details
    const rooms = await Room.find({ _id: { $in: booking.roomIds } }).lean() as any[];

    // Room service orders
    const roomServiceOrders = await Order.find({
      bookingId: id,
      orderType: 'room-service',
      status: { $ne: 'cancelled' },
    }).lean() as any[];

    // Build room charge line items using current room data for display.
    // roomSubtotal is authoritative from booking.totalAmount (locked in at booking time)
    // so the invoice always matches the checkout grand total.
    const roomCharges = rooms.map((room: any) => ({
      description: `Room ${room.roomNumber} (${room.category}) × ${booking.numberOfNights} night(s)`,
      unitPrice: room.pricePerNight,
      quantity: booking.numberOfNights,
      total: room.pricePerNight * booking.numberOfNights,
    }));

    const roomSubtotal = booking.totalAmount || 0;
    const discount = booking.discountAmount || 0;
    const roomTotal = roomSubtotal - discount;

    // Build food line items
    const foodLineItems: any[] = [];
    let foodSubtotal = 0;
    let foodTax = 0;

    for (const order of roomServiceOrders) {
      for (const item of order.items) {
        foodLineItems.push({
          description: `${item.itemName || 'Item'} (${order.mealType} · ${new Date(order.orderTime || order.createdAt).toLocaleString()})`,
          unitPrice: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
          orderId: order._id,
          orderStatus: order.status,
        });
      }
      foodSubtotal += order.subtotal || 0;
      foodTax += order.tax || 0;
    }
    const foodTotal = foodSubtotal + foodTax;

    // Additional charges (manually added)
    const additionalCharges = (booking.additionalCharges || []).map((c: any) => ({
      description: c.description,
      qty: c.qty,
      unitAmount: c.unitAmount,
      total: c.total,
      id: c._id?.toString(),
    }));
    const additionalTotal = additionalCharges.reduce((s: number, c: any) => s + c.total, 0);

    const grandTotal = roomTotal + foodTotal + additionalTotal;
    const amountPaid = booking.amountPaid || 0;
    const balanceDue = Math.max(0, grandTotal - amountPaid);

    const invoice = {
      invoiceNumber: `INV-${booking.bookingId}`,
      generatedAt: new Date().toISOString(),
      booking: {
        bookingId: booking.bookingId,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        checkInTime: booking.checkInTime,
        checkOutTime: booking.checkOutTime,
        numberOfNights: booking.numberOfNights,
        numberOfGuests: booking.numberOfGuests,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        guestDocument: booking.guestDocument,
        roomIds: booking.roomIds,
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
      additionalCharges: {
        items: additionalCharges,
        total: additionalTotal,
      },
      summary: {
        roomTotal,
        foodTotal,
        additionalTotal,
        grandTotal,
        amountPaid,
        balanceDue,
      },
      payments: booking.payments || [],
    };

    return NextResponse.json({ success: true, data: invoice }, { status: 200 });
  } catch (error) {
    console.error('[v0] Invoice error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate invoice' }, { status: 500 });
  }
}
