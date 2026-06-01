import { Customer } from '@/lib/models/Customer';
import { DayOutPackage, GroupBooking } from '@/lib/models/DayOut';
import {
  sampleCustomers,
  sampleDayOutPackages,
  sampleGroupBookings,
} from '@/lib/sampleData';

async function seedCustomersIfEmpty() {
  const count = await Customer.countDocuments();
  if (count > 0) return;

  await Customer.insertMany(sampleCustomers, { ordered: false });
}

export async function ensureDayOutPackagesSeeded() {
  const count = await DayOutPackage.countDocuments();
  if (count > 0) return;

  await DayOutPackage.insertMany(sampleDayOutPackages, { ordered: false });
}

export async function ensureDayOutGroupBookingsSeeded() {
  await seedCustomersIfEmpty();
  await ensureDayOutPackagesSeeded();

  const count = await GroupBooking.countDocuments();
  if (count > 0) return;

  const seededBookings = sampleGroupBookings.map((booking) => {
    const advancePaid =
      booking.paymentStatus === 'paid'
        ? booking.totalPrice
        : booking.paymentStatus === 'partial'
          ? booking.depositAmount
          : 0;

    return {
      ...booking,
      totalAmount: booking.totalPrice,
      advancePaid,
      balanceAmount: Math.max(0, booking.totalPrice - advancePaid),
      payments: advancePaid
        ? [
            {
              amount: advancePaid,
              method: 'cash',
              date: booking.createdAt || new Date(),
              notes: 'Seeded advance payment',
            },
          ]
        : [],
    };
  });

  await GroupBooking.insertMany(seededBookings, { ordered: false });
}
