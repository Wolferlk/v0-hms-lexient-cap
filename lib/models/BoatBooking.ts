import mongoose, { Schema, Document } from 'mongoose';
import { BOAT_RIDE_CURRENCIES, type BoatRideCurrency } from '@/lib/boatRideConstants';

export interface IBoatBooking extends Document {
  bookingRef: string;
  // Customer
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerType: 'local' | 'tourist';
  nationality?: string;
  // Package / resource assignment
  packageId: mongoose.Types.ObjectId;
  boatId?: mongoose.Types.ObjectId;
  riderId?: mongoose.Types.ObjectId;
  riderTypeSnapshot?: 'company' | 'contract';
  riderContractAmountLKR?: number;
  riderPaymentDone: boolean;
  // Booking details
  numberOfPassengers: number;
  scheduledDate: Date;
  scheduledTime: string;
  // Pricing
  basePriceLKR: number;
  paymentCurrency: BoatRideCurrency;
  paymentAmountInCurrency: number;
  exchangeRateToLKR?: number;
  amountPaidLKR: number;
  paymentMethod?: string;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  // Status flow
  status: 'pending' | 'confirmed' | 'riding' | 'completed' | 'cancelled' | 'no_show';
  startTime?: Date;
  endTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BoatBookingSchema = new Schema<IBoatBooking>(
  {
    bookingRef: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String, default: '' },
    customerType: { type: String, enum: ['local', 'tourist'], default: 'tourist' },
    nationality: { type: String, default: '' },
    packageId: { type: Schema.Types.ObjectId, ref: 'BoatRidePackage', required: true },
    boatId: { type: Schema.Types.ObjectId, ref: 'Boat' },
    riderId: { type: Schema.Types.ObjectId, ref: 'BoatRider' },
    riderTypeSnapshot: { type: String, enum: ['company', 'contract'] },
    riderContractAmountLKR: { type: Number, default: 0 },
    riderPaymentDone: { type: Boolean, default: false },
    numberOfPassengers: { type: Number, required: true, min: 1 },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, required: true },
    basePriceLKR: { type: Number, required: true, min: 0 },
    paymentCurrency: {
      type: String,
      enum: BOAT_RIDE_CURRENCIES,
      default: 'LKR',
    },
    paymentAmountInCurrency: { type: Number, required: true, min: 0 },
    exchangeRateToLKR: { type: Number },
    amountPaidLKR: { type: Number, default: 0 },
    paymentMethod: { type: String, default: '' },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'riding', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
    },
    startTime: { type: Date },
    endTime: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const BoatBooking =
  mongoose.models.BoatBooking || mongoose.model<IBoatBooking>('BoatBooking', BoatBookingSchema);
