import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BoatBooking } from '@/lib/models/BoatBooking';
import { Boat } from '@/lib/models/BoatFleet';
import { BoatRider } from '@/lib/models/BoatRider';

export async function GET() {
  try {
    await connectDB();

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [activeRides, todayBookings, availableBoats, activeRiders, revenueToday] =
      await Promise.all([
        BoatBooking.find({ status: 'riding' })
          .populate('packageId', 'name duration')
          .populate('boatId', 'name type')
          .populate('riderId', 'name riderType')
          .lean(),
        BoatBooking.countDocuments({
          scheduledDate: { $gte: today, $lt: tomorrow },
          status: { $nin: ['cancelled', 'no_show'] },
        }),
        Boat.countDocuments({ status: 'available' }),
        BoatRider.countDocuments({ status: { $in: ['active', 'on_ride'] } }),
        BoatBooking.aggregate([
          { $match: { createdAt: { $gte: today }, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amountPaidLKR' } } },
        ]),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        activeRideCount: activeRides.length,
        activeRides,
        todayBookings,
        availableBoats,
        activeRiders,
        todayRevenueLKR: revenueToday[0]?.total ?? 0,
      },
    });
  } catch (err) {
    console.error('[boat-ride/stats]', err);
    return NextResponse.json({ success: false, error: 'Failed to load stats' }, { status: 500 });
  }
}
