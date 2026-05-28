import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/lib/models/Booking';
import { Customer } from '@/lib/models/Customer';
import { bookingComService } from '@/lib/bookingComService';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json().catch(() => ({}));
    const { status = 'new', dateFrom, dateTo, limit = 50 } = body;

    const result = await bookingComService.pullReservations({ status, dateFrom, dateTo, limit });

    if (!result.success || !result.reservations) {
      return NextResponse.json({ success: false, error: result.error || result.message }, { status: 400 });
    }

    let created = 0;
    let skipped = 0;
    let updated = 0;
    const errors: { id: string; error: string }[] = [];

    for (const r of result.reservations) {
      try {
        const existing = await Booking.findOne({ externalBookingId: r.id });

        if (existing) {
          // Update status if changed
          const newStatus = r.status === 'cancelled' ? 'cancelled' : existing.status;
          if (newStatus !== existing.status) {
            existing.status = newStatus;
            await existing.save();
            updated++;
          } else {
            skipped++;
          }
          continue;
        }

        // Upsert customer
        let customer = await Customer.findOne({ email: r.email });
        if (!customer) {
          customer = new Customer({ name: r.guest_name, email: r.email, phone: r.phone });
          await customer.save();
        }

        const nights = Math.ceil(
          (new Date(r.check_out_date).getTime() - new Date(r.check_in_date).getTime()) /
          (1000 * 60 * 60 * 24)
        );

        const booking = new Booking({
          bookingId: `BK-BCOM-${r.id}`,
          customerId: customer._id,
          customerName: r.guest_name,
          customerEmail: r.email,
          customerPhone: r.phone || '',
          roomIds: [],
          checkInDate: new Date(r.check_in_date),
          checkOutDate: new Date(r.check_out_date),
          numberOfNights: nights,
          numberOfGuests: r.num_adults + (r.num_children || 0),
          totalAmount: r.total_price,
          status: r.status === 'confirmed' ? 'confirmed' : 'pending',
          paymentStatus: 'paid',
          bookingFromSource: 'booking.com',
          externalBookingId: r.id,
          notes: r.special_requests || '',
        });

        await booking.save();
        created++;
      } catch (err: any) {
        errors.push({ id: r.id, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync complete: ${created} created, ${updated} updated, ${skipped} skipped`,
      total: result.reservations.length,
      created,
      updated,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
