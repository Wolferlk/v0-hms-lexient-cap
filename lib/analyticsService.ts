import { connectDB } from './mongodb';
import { AnalyticsMetrics, Report } from './models/Analytics';
import { Booking } from './models/Booking';
import { Room } from './models/Room';
import { Expense, Income } from './models/Finance';

export class AnalyticsService {
  async calculateMetrics(date: Date = new Date()) {
    try {
      await connectDB();

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Total Bookings
      const totalBookings = await Booking.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      // Total Revenue
      const bookings = await Booking.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        paymentStatus: 'paid',
      });
      const totalRevenue = bookings.reduce((sum, b) => sum + ((b as any).totalAmount || 0), 0);

      // Occupancy Rate
      const totalRooms = await Room.countDocuments();
      const occupiedRooms = await Booking.countDocuments({
        checkInDate: { $lte: endOfDay },
        checkOutDate: { $gte: startOfDay },
      });
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

      // Average Booking Value
      const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Store metrics
      const metrics = [
        { metric: 'total_bookings', value: totalBookings },
        { metric: 'total_revenue', value: totalRevenue },
        { metric: 'occupancy_rate', value: occupancyRate },
        { metric: 'avg_booking_value', value: avgBookingValue },
      ];

      for (const metric of metrics) {
        const existing = await AnalyticsMetrics.findOne({
          date: startOfDay,
          metric: metric.metric,
        });

        if (existing) {
          existing.value = metric.value;
          await existing.save();
        } else {
          const analyticsMetric = new AnalyticsMetrics({
            date: startOfDay,
            metric: metric.metric,
            value: metric.value,
          });
          await analyticsMetric.save();
        }
      }

      return { totalBookings, totalRevenue, occupancyRate, avgBookingValue };
    } catch (error) {
      console.error('[v0] Metrics calculation error:', error);
    }
  }

  async generateReport(
    type: string,
    period: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      await connectDB();

      let data: any = {};
      let summary: any = {};

      if (type === 'revenue') {
        data = await this.generateRevenueData(startDate, endDate);
        summary = await this.calculateRevenueSummary(startDate, endDate);
      } else if (type === 'occupancy') {
        data = await this.generateOccupancyData(startDate, endDate);
        summary = await this.calculateOccupancySummary(startDate, endDate);
      } else if (type === 'customer') {
        data = await this.generateCustomerData(startDate, endDate);
      } else if (type === 'financial') {
        data = await this.generateFinancialData(startDate, endDate);
      }

      const report = new Report({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${period}`,
        type,
        period,
        startDate,
        endDate,
        data,
        summary,
        charts: this.generateChartData(data, type),
      });

      await report.save();
      return report;
    } catch (error) {
      console.error('[v0] Report generation error:', error);
    }
  }

  private async generateRevenueData(startDate: Date, endDate: Date) {
    const bookings = await Booking.find({
      createdAt: { $gte: startDate, $lte: endDate },
      paymentStatus: 'paid',
    });

    return {
      totalRevenue: bookings.reduce((sum, b) => sum + ((b as any).totalAmount || 0), 0),
      bookingCount: bookings.length,
      averageBookingValue:
        bookings.length > 0
          ? bookings.reduce((sum, b) => sum + ((b as any).totalAmount || 0), 0) / bookings.length
          : 0,
      byRoom: this.groupByRoom(bookings),
      byPaymentMethod: this.groupByPaymentMethod(bookings),
    };
  }

  private async generateOccupancyData(startDate: Date, endDate: Date) {
    const rooms = await Room.find();
    const bookings = await Booking.find({
      checkInDate: { $lte: endDate },
      checkOutDate: { $gte: startDate },
    });

    const totalRoomNights = rooms.length * Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const occupiedRoomNights = bookings.reduce((sum: number, b) => {
      const nights = Math.ceil((b.checkOutDate.getTime() - b.checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + nights;
    }, 0);

    return {
      occupancyRate: totalRoomNights > 0 ? (occupiedRoomNights / totalRoomNights) * 100 : 0,
      totalRoomNights,
      occupiedRoomNights,
      byRoom: this.groupOccupancyByRoom(bookings, rooms),
    };
  }

  private async generateCustomerData(startDate: Date, endDate: Date) {
    const bookings = await Booking.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).populate('customerId');

    return {
      totalCustomers: bookings.length,
      newCustomers: bookings.filter((b) => !(b as any).customerId?.previousBookings).length,
      repeatCustomers: bookings.filter((b) => (b as any).customerId?.previousBookings).length,
      averageCustomerValue:
        bookings.length > 0
          ? bookings.reduce((sum, b) => sum + ((b as any).totalAmount || 0), 0) / bookings.length
          : 0,
    };
  }

  private async generateFinancialData(startDate: Date, endDate: Date) {
    const income = await Income.find({
      date: { $gte: startDate, $lte: endDate },
    });
    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate },
    });

    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      expensesByCategory: this.groupExpensesByCategory(expenses),
      incomeBySource: this.groupIncomeBySource(income),
    };
  }

  private generateChartData(data: any, type: string): any[] {
    // Generate chart data based on report type
    return [
      {
        type: 'bar',
        title: `${type} Overview`,
        data: data,
      },
    ];
  }

  private groupByRoom(bookings: any[]) {
    const grouped: any = {};
    bookings.forEach(b => {
      const roomId = b.roomId.toString();
      if (!grouped[roomId]) grouped[roomId] = 0;
      grouped[roomId] += b.totalPrice || 0;
    });
    return grouped;
  }

  private groupByPaymentMethod(bookings: any[]) {
    const grouped: any = {};
    bookings.forEach(b => {
      const method = b.paymentMethod || 'unknown';
      if (!grouped[method]) grouped[method] = 0;
      grouped[method]++;
    });
    return grouped;
  }

  private groupOccupancyByRoom(bookings: any[], rooms: any[]) {
    const grouped: any = {};
    rooms.forEach(r => {
      grouped[r._id.toString()] = bookings.filter(b => b.roomId === r._id).length;
    });
    return grouped;
  }

  private groupExpensesByCategory(expenses: any[]) {
    const grouped: any = {};
    expenses.forEach(e => {
      const category = e.category || 'other';
      if (!grouped[category]) grouped[category] = 0;
      grouped[category] += e.amount;
    });
    return grouped;
  }

  private groupIncomeBySource(income: any[]) {
    const grouped: any = {};
    income.forEach(i => {
      const source = i.source || 'other';
      if (!grouped[source]) grouped[source] = 0;
      grouped[source] += i.amount;
    });
    return grouped;
  }

  async calculateRevenueSummary(startDate: Date, endDate: Date) {
    const bookings = await Booking.find({
      createdAt: { $gte: startDate, $lte: endDate },
      paymentStatus: 'paid',
    });

    return {
      totalRevenue: bookings.reduce((sum: number, b) => sum + ((b as any).totalAmount || 0), 0),
      totalBookings: bookings.length,
      averageBookingValue:
        bookings.length > 0
          ? bookings.reduce((sum: number, b) => sum + ((b as any).totalAmount || 0), 0) / bookings.length
          : 0,
    };
  }

  async calculateOccupancySummary(startDate: Date, endDate: Date) {
    const rooms = await Room.find();
    const bookings = await Booking.find({
      checkInDate: { $lte: endDate },
      checkOutDate: { $gte: startDate },
    });

    const totalRoomNights = rooms.length * Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const occupiedRoomNights = bookings.reduce((sum: number, b) => {
      const nights = Math.ceil((b.checkOutDate.getTime() - b.checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + nights;
    }, 0);

    return {
      averageOccupancy: totalRoomNights > 0 ? (occupiedRoomNights / totalRoomNights) * 100 : 0,
    };
  }
}
