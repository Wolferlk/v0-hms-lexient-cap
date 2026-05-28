import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentRecord {
  amount: number;
  method: 'cash' | 'card' | 'upi' | 'wallet' | 'bank_transfer';
  date: Date;
  notes?: string;
  recordedBy?: string;
}

export interface IAdditionalCharge {
  description: string;
  qty: number;
  unitAmount: number;
  total: number;
}

export interface IGuestDocument {
  docType: 'id_card' | 'passport' | 'driving_license' | 'other';
  docNumber: string;
  expiryDate?: Date;
  scanUrl?: string;
  isReturned: boolean;
}

export interface IBooking extends Document {
  bookingId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  roomIds: string[];
  checkInDate: Date;
  checkOutDate: Date;
  numberOfNights: number;
  numberOfGuests: number;
  totalAmount: number;
  promoCode?: string;
  discountAmount?: number;
  amountPaid: number;
  payments: IPaymentRecord[];
  additionalCharges: IAdditionalCharge[];
  guestDocument?: IGuestDocument;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
  paymentMethod?: string;
  notes?: string;
  bookingFromSource: 'direct' | 'booking.com' | 'other';
  externalBookingId?: string;
  checkInTime?: Date;
  checkOutTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentRecordSchema = new Schema<IPaymentRecord>(
  {
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet', 'bank_transfer'],
      required: true,
    },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    recordedBy: { type: String, default: '' },
  },
  { _id: true }
);

const AdditionalChargeSchema = new Schema<IAdditionalCharge>(
  {
    description: { type: String, required: true },
    qty: { type: Number, default: 1, min: 1 },
    unitAmount: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const GuestDocumentSchema = new Schema<IGuestDocument>(
  {
    docType: {
      type: String,
      enum: ['id_card', 'passport', 'driving_license', 'other'],
      required: true,
    },
    docNumber: { type: String, required: true },
    expiryDate: { type: Date },
    scanUrl: { type: String, default: '' },
    isReturned: { type: Boolean, default: false },
  },
  { _id: false }
);

const bookingSchema = new Schema<IBooking>(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, lowercase: true },
    customerPhone: { type: String, required: true },
    roomIds: { type: [String], required: true },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    numberOfNights: { type: Number, required: true, min: 1 },
    numberOfGuests: { type: Number, required: true, min: 1 },
    totalAmount: { type: Number, required: true, min: 0 },
    promoCode: { type: String, default: '' },
    discountAmount: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    payments: { type: [PaymentRecordSchema], default: [] },
    additionalCharges: { type: [AdditionalChargeSchema], default: [] },
    guestDocument: { type: GuestDocumentSchema },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid', 'refunded'],
      default: 'unpaid',
    },
    paymentMethod: { type: String, default: '' },
    notes: { type: String, default: '' },
    bookingFromSource: {
      type: String,
      enum: ['direct', 'booking.com', 'other'],
      default: 'direct',
    },
    externalBookingId: { type: String, default: '' },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
  },
  { timestamps: true }
);

export const Booking =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);
