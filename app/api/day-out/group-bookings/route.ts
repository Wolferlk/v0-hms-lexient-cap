import { connectDB } from '@/lib/mongodb';
import { GroupBooking, DayOutPackage } from '@/lib/models/DayOut';
import { NextRequest, NextResponse } from 'next/server';
import {
  sampleCustomers,
  sampleDayOutPackages,
  sampleGroupBookings,
  withPopulatedRelations,
} from '@/lib/sampleData';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: any = {};
    if (status) query.status = status;

    const bookings = await GroupBooking.find(query)
      .populate('packageId', 'name price pricePerPerson')
      .populate('customerId', 'name email phone')
      .sort({ bookingDate: -1 });

    const fallbackBookings = withPopulatedRelations(sampleGroupBookings, {
      packageId: sampleDayOutPackages,
      customerId: sampleCustomers,
    }).filter((booking) => {
      if (query.status && booking.status !== query.status) return false;
      return true;
    });

    return NextResponse.json({ success: true, data: bookings.length ? bookings : fallbackBookings });
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
    const {
      packageId,
      customerId,
      groupName,
      bookingDate,
      numberOfPeople,
      contactPerson,
      specialRequests,
      advanceAmount,
      paymentMethod,
    } = body;

    if (!packageId || !groupName || !bookingDate || !numberOfPeople) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify package exists and check capacity
    const dayOutPackage = await DayOutPackage.findById(packageId);
    if (!dayOutPackage) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    if (numberOfPeople > dayOutPackage.maxGroupSize) {
      return NextResponse.json(
        { success: false, error: 'Group size exceeds package capacity' },
        { status: 400 }
      );
    }

    // Calculate pricing
    let totalPrice = numberOfPeople * dayOutPackage.pricePerPerson;
    if (dayOutPackage.discountPercentage) {
      totalPrice = totalPrice * (1 - dayOutPackage.discountPercentage / 100);
    }

    const depositAmount = Math.round(totalPrice * 0.3); // 30% deposit
    const balanceAmount = totalPrice - depositAmount;

    const booking = new GroupBooking({
      packageId,
      customerId,
      groupName,
      bookingDate: new Date(bookingDate),
      numberOfPeople,
      totalPrice,
      totalAmount: totalPrice,
      depositAmount,
      balanceAmount,
      advancePaid: advanceAmount > 0 ? advanceAmount : 0,
      payments: advanceAmount > 0 ? [{ amount: advanceAmount, method: paymentMethod || 'cash', date: new Date(), notes: 'Advance payment' }] : [],
      additionalItems: [],
      contactPerson,
      specialRequests,
      paymentStatus: advanceAmount > 0 ? 'partial' : 'pending',
      status: advanceAmount > 0 ? 'confirmed' : 'pending',
    });

    await booking.save();
    const populated = await booking.populate('packageId').populate('customerId');

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
    const { id, action, amount, method, notes, additionalItems, itemIndex, itemUpdate, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Booking ID required' },
        { status: 400 }
      );
    }

    const booking = await GroupBooking.findById(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (action === 'pay') {
      if (!amount || amount <= 0) {
        return NextResponse.json({ success: false, error: 'Payment amount required' }, { status: 400 });
      }
      booking.payments.push({ amount, method: method || 'cash', date: new Date(), notes: notes || '' });
      booking.advancePaid = (booking.advancePaid || 0) + amount;
      booking.balanceAmount = Math.max(0, booking.totalAmount - booking.advancePaid);
      if (booking.advancePaid >= booking.depositAmount && booking.status === 'pending') {
        booking.status = 'confirmed';
      }
      if (booking.advancePaid >= booking.totalAmount) {
        booking.paymentStatus = 'paid';
      } else if (booking.advancePaid > 0) {
        booking.paymentStatus = 'partial';
      }
      booking.updatedAt = new Date();
      await booking.save();
      await booking.populate('packageId').populate('customerId');
      return NextResponse.json({ success: true, data: booking });
    }

    if (action === 'add_items') {
      if (!additionalItems || !Array.isArray(additionalItems) || additionalItems.length === 0) {
        return NextResponse.json({ success: false, error: 'No additional items provided' }, { status: 400 });
      }
      for (const item of additionalItems) {
        booking.additionalItems.push({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity,
        });
      }
      const addedTotal = booking.additionalItems.reduce((sum: number, item: any) => sum + item.total, 0);
      booking.totalAmount = booking.totalPrice + addedTotal;
      booking.balanceAmount = Math.max(0, booking.totalAmount - booking.advancePaid);
      booking.updatedAt = new Date();
      await booking.save();
      await booking.populate('packageId').populate('customerId');
      return NextResponse.json({ success: true, data: booking });
    }

    if (action === 'edit_item') {
      if (itemIndex === undefined || itemIndex < 0 || itemIndex >= booking.additionalItems.length) {
        return NextResponse.json({ success: false, error: 'Invalid item index' }, { status: 400 });
      }
      const existing = booking.additionalItems[itemIndex];
      booking.additionalItems[itemIndex] = {
        name: itemUpdate?.name || existing.name,
        quantity: itemUpdate?.quantity ?? existing.quantity,
        unitPrice: itemUpdate?.unitPrice ?? existing.unitPrice,
        total: (itemUpdate?.unitPrice ?? existing.unitPrice) * (itemUpdate?.quantity ?? existing.quantity),
      };
      const addedTotal = booking.additionalItems.reduce((sum: number, item: any) => sum + item.total, 0);
      booking.totalAmount = booking.totalPrice + addedTotal;
      booking.balanceAmount = Math.max(0, booking.totalAmount - booking.advancePaid);
      booking.updatedAt = new Date();
      await booking.save();
      await booking.populate('packageId').populate('customerId');
      return NextResponse.json({ success: true, data: booking });
    }

    if (action === 'delete_item') {
      if (itemIndex === undefined || itemIndex < 0 || itemIndex >= booking.additionalItems.length) {
        return NextResponse.json({ success: false, error: 'Invalid item index' }, { status: 400 });
      }
      booking.additionalItems.splice(itemIndex, 1);
      const addedTotal = booking.additionalItems.reduce((sum: number, item: any) => sum + item.total, 0);
      booking.totalAmount = booking.totalPrice + addedTotal;
      booking.balanceAmount = Math.max(0, booking.totalAmount - booking.advancePaid);
      booking.updatedAt = new Date();
      await booking.save();
      await booking.populate('packageId').populate('customerId');
      return NextResponse.json({ success: true, data: booking });
    }

    if (action === 'close') {
      if (booking.status !== 'confirmed') {
        return NextResponse.json({ success: false, error: 'Only confirmed bookings can be closed' }, { status: 400 });
      }
      const due = Math.max(0, booking.totalAmount - booking.advancePaid);
      if (due > 0 && (!amount || amount < due)) {
        return NextResponse.json({ success: false, error: 'Closing requires full settlement of the remaining balance' }, { status: 400 });
      }
      if (amount && amount > 0) {
        booking.payments.push({ amount, method: method || 'cash', date: new Date(), notes: notes || '' });
        booking.advancePaid = (booking.advancePaid || 0) + amount;
      }
      booking.balanceAmount = Math.max(0, booking.totalAmount - booking.advancePaid);
      booking.paymentStatus = booking.balanceAmount === 0 ? 'paid' : booking.paymentStatus;
      booking.status = 'completed';
      booking.updatedAt = new Date();
      await booking.save();
      await booking.populate('packageId').populate('customerId');
      return NextResponse.json({ success: true, data: booking });
    }

    if (action === 'cancel') {
      booking.status = 'cancelled';
      booking.updatedAt = new Date();
      await booking.save();
      await booking.populate('packageId').populate('customerId');
      return NextResponse.json({ success: true, data: booking });
    }

    const updated = await GroupBooking.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    await updated.populate('packageId').populate('customerId');

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Booking ID required' }, { status: 400 });
    }

    await GroupBooking.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Group booking deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
