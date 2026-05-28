import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    title: String,
    message: String,
    type: {
      type: String,
      enum: ['booking', 'payment', 'event', 'promotion', 'system', 'reminder'],
      index: true,
    },
    channel: {
      type: String,
      enum: ['email', 'sms', 'whatsapp', 'push', 'in-app'],
    },
    relatedId: mongoose.Schema.Types.ObjectId,
    relatedType: {
      type: String,
      enum: ['booking', 'payment', 'event', 'order'],
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
    sentAt: Date,
    deliveredAt: Date,
    failureReason: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

const AutomationRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    trigger: {
      event: {
        type: String,
        enum: [
          'booking_created',
          'booking_confirmed',
          'booking_cancelled',
          'check_in',
          'check_out',
          'payment_received',
          'payment_failed',
          'low_inventory',
          'birthday',
          'anniversary',
        ],
      },
      conditions: [
        {
          field: String,
          operator: {
            type: String,
            enum: ['equals', 'greater_than', 'less_than', 'contains', 'in'],
          },
          value: mongoose.Schema.Types.Mixed,
        },
      ],
    },
    actions: [
      {
        type: {
          type: String,
          enum: ['send_notification', 'send_email', 'send_sms', 'send_whatsapp', 'create_invoice', 'update_inventory'],
        },
        template: String,
        delay: Number, // in minutes
        recipient: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    executionHistory: [
      {
        executedAt: Date,
        status: String,
        details: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const InvoiceSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    invoiceNumber: {
      type: String,
      unique: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    dueDate: Date,
    items: [
      {
        description: String,
        quantity: Number,
        unitPrice: Number,
        tax: Number,
        total: Number,
      },
    ],
    subtotal: Number,
    tax: Number,
    discount: Number,
    total: Number,
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
      index: true,
    },
    paymentMethod: String,
    notes: String,
    filePath: String,
  },
  {
    timestamps: true,
  }
);

export const Notification =
  mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export const AutomationRule =
  mongoose.models.AutomationRule || mongoose.model('AutomationRule', AutomationRuleSchema);

export const Invoice =
  mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);

export default Notification;
