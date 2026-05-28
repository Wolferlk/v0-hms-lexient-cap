import mongoose from 'mongoose';

const AnalyticsMetricsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      index: true,
      default: Date.now,
    },
    metric: {
      type: String,
      enum: [
        'total_bookings',
        'total_revenue',
        'occupancy_rate',
        'avg_booking_value',
        'new_customers',
        'repeat_customers',
        'cancellations',
        'no_shows',
        'average_rating',
        'checkout_conversion',
      ],
      index: true,
    },
    value: Number,
    breakdown: {
      byRoom: mongoose.Schema.Types.Mixed,
      byService: mongoose.Schema.Types.Mixed,
      byPaymentMethod: mongoose.Schema.Types.Mixed,
      byCustomerSegment: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

const ReportSchema = new mongoose.Schema(
  {
    title: String,
    type: {
      type: String,
      enum: ['revenue', 'occupancy', 'customer', 'operational', 'financial', 'custom'],
      index: true,
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
    },
    startDate: Date,
    endDate: Date,
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    data: mongoose.Schema.Types.Mixed,
    summary: {
      totalRevenue: Number,
      totalBookings: Number,
      averageOccupancy: Number,
      averageBookingValue: Number,
      customerSatisfaction: Number,
    },
    charts: [
      {
        type: String,
        title: String,
        data: mongoose.Schema.Types.Mixed,
      },
    ],
    filePath: String,
    shared: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        sharedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const DashboardWidgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    widgetType: {
      type: String,
      enum: [
        'revenue_chart',
        'occupancy_gauge',
        'booking_trend',
        'customer_satisfaction',
        'top_rooms',
        'upcoming_bookings',
        'inventory_status',
        'staff_stats',
      ],
    },
    position: Number,
    size: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium',
    },
    refreshInterval: Number, // in minutes
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AnalyticsMetrics =
  mongoose.models.AnalyticsMetrics || mongoose.model('AnalyticsMetrics', AnalyticsMetricsSchema);

export const Report =
  mongoose.models.Report || mongoose.model('Report', ReportSchema);

export const DashboardWidget =
  mongoose.models.DashboardWidget || mongoose.model('DashboardWidget', DashboardWidgetSchema);

export default AnalyticsMetrics;
