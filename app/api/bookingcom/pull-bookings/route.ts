import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Booking } from '@/lib/models/Booking';
import { Customer } from '@/lib/models/Customer';
import { bookingComService } from '@/lib/bookingComService';

/**
 * POST /api/bookingcom/pull-bookings
 * Pulls bookings from Booking.com and syncs them locally
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Pull bookings from Booking.com
    const result = await bookingComService.pullBookings(50);

    if (!result.success || !result.bookings) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 400 }
      );
    }

    let syncedCount = 0;
    const errors = [];

    // Sync each booking to local database
    for (const bcomBooking of result.bookings) {
      try {
        // Check if booking already exists
        const existingBooking = await Booking.findOne({
          externalBookingId: bcomBooking.id,
        });

        if (existingBooking) {
          console.log(`[v0] Booking ${bcomBooking.id} already synced`);
          continue;
        }

        // Create customer if doesn't exist
        let customerId = '';
        const existingCustomer = await Customer.findOne({
          email: bcomBooking.email,
        });

        if (existingCustomer) {
          customerId = existingCustomer._id.toString();
        } else {
          const newCustomer = new Customer({
            email: bcomBooking.email,
            name: bcomBooking.guest_name,
            phone: bcomBooking.phone,
          });
          await newCustomer.save();
          customerId = newCustomer._id.toString();
        }

        // Create booking
        const bookingId = `BK-BCOM-${bcomBooking.id}`;
        const newBooking = new Booking({
          bookingId,
          customerId,
          customerName: bcomBooking.guest_name,
          customerEmail: bcomBooking.email,
          customerPhone: bcomBooking.phone,
          roomIds: [], // Booking.com doesn't provide room mapping, would need manual matching
          checkInDate: new Date(bcomBooking.check_in_date),
          checkOutDate: new Date(bcomBooking.check_out_date),
          numberOfNights: Math.ceil(
            (new Date(bcomBooking.check_out_date).getTime() -
              new Date(bcomBooking.check_in_date).getTime()) /
              (1000 * 60 * 60 * 24)
          ),
          numberOfGuests:
            bcomBooking.num_adults + (bcomBooking.num_children || 0),
          totalAmount: bcomBooking.total_price,
          status: bcomBooking.status === 'confirmed' ? 'confirmed' : 'pending',
          paymentStatus: 'paid', // Booking.com bookings are usually pre-paid
          bookingFromSource: 'booking.com',
          externalBookingId: bcomBooking.id,
        });

        await newBooking.save();
        syncedCount++;
      } catch (err) {
        console.error(`[v0] Error syncing Booking.com booking ${bcomBooking.id}:`, err);
        errors.push({
          bookingId: bcomBooking.id,
          error: 'Failed to sync booking',
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        syncedCount,
        totalBookings: result.bookings.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully synced ${syncedCount} bookings from Booking.com`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Error pulling bookings from Booking.com:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to pull bookings from Booking.com',
      },
      { status: 500 }
    );
  }
}
