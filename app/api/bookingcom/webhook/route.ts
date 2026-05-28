import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/lib/models/Booking';
import { Customer } from '@/lib/models/Customer';

/**
 * POST /api/bookingcom/webhook
 * Receives real-time booking notifications pushed by Booking.com
 * Register this URL in Booking.com Extranet → Settings → Notifications
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    console.log('[Booking.com Webhook] Received:', JSON.stringify(body, null, 2));

    const { event, reservation } = body;

    if (!event || !reservation) {
      return NextResponse.json({ success: false, error: 'Invalid webhook payload' }, { status: 400 });
    }

    if (event === 'new_reservation' || event === 'reservation_updated') {
      const existing = await Booking.findOne({ externalBookingId: reservation.id });

      if (event === 'reservation_updated' && existing) {
        // Update status on existing booking
        const statusMap: Record<string, string> = {
          confirmed: 'confirmed',
          cancelled: 'cancelled',
          no_show: 'cancelled',
        };
        existing.status = statusMap[reservation.status] || existing.status;
        await existing.save();
        return NextResponse.json({ success: true, message: 'Booking updated', id: existing._id });
      }

      if (event === 'new_reservation' && !existing) {
        // Upsert customer
        let customer = await Customer.findOne({ email: reservation.email });
        if (!customer) {
          customer = new Customer({
            name: reservation.guest_name,
            email: reservation.email,
            phone: reservation.phone,
          });
          await customer.save();
        }

        const nights = Math.ceil(
          (new Date(reservation.check_out_date).getTime() - new Date(reservation.check_in_date).getTime()) /
          (1000 * 60 * 60 * 24)
        );

        const newBooking = new Booking({
          bookingId: `BK-BCOM-${reservation.id}`,
          customerId: customer._id,
          customerName: reservation.guest_name,
          customerEmail: reservation.email,
          customerPhone: reservation.phone || '',
          roomIds: [],
          checkInDate: new Date(reservation.check_in_date),
          checkOutDate: new Date(reservation.check_out_date),
          numberOfNights: nights,
          numberOfGuests: (reservation.num_adults || 1) + (reservation.num_children || 0),
          totalAmount: reservation.total_price || 0,
          status: 'confirmed',
          paymentStatus: 'paid',
          bookingFromSource: 'booking.com',
          externalBookingId: reservation.id,
          notes: reservation.special_requests || '',
        });

        await newBooking.save();
        return NextResponse.json({ success: true, message: 'Booking created', id: newBooking._id }, { status: 201 });
      }
    }

    if (event === 'reservation_cancelled') {
      const booking = await Booking.findOne({ externalBookingId: reservation.id });
      if (booking) {
        booking.status = 'cancelled';
        await booking.save();
        return NextResponse.json({ success: true, message: 'Booking cancelled' });
      }
    }

    return NextResponse.json({ success: true, message: `Event '${event}' acknowledged` });
  } catch (error: any) {
    console.error('[Booking.com Webhook] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/** GET — health check so Booking.com can verify the endpoint */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Booking.com webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
