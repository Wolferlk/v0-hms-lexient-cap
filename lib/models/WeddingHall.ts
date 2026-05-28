import mongoose, { Schema, Document } from 'mongoose';

export interface IWeddingHall extends Document {
  name: string;
  capacity: number;
  area: number; // in sq.ft
  basePrice: number;
  amenities: string[];
  images: string[];
  description: string;
  availability: 'available' | 'booked' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

export interface IWeddingEvent extends Document {
  hallId: mongoose.Types.ObjectId;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventDate: Date;
  eventType: 'wedding' | 'reception' | 'pre_wedding' | 'other';
  expectedGuests: number;
  totalPrice: number;
  advancePayment: number;
  remainingPayment: number;
  status: 'inquiry' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  requirements?: string[];
  contactPerson: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWeddingPackage extends Document {
  name: string;
  description: string;
  basePrice: number;
  maxGuests: number;
  includes: string[];
  decorationType?: string;
  cateringIncluded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const weddingHallSchema = new Schema<IWeddingHall>(
  {
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    area: { type: Number, required: true }, // sq.ft
    basePrice: { type: Number, required: true },
    amenities: [String],
    images: [String],
    description: { type: String },
    availability: {
      type: String,
      enum: ['available', 'booked', 'maintenance'],
      default: 'available',
    },
  },
  { timestamps: true }
);

const weddingEventSchema = new Schema<IWeddingEvent>(
  {
    hallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WeddingHall',
      required: true,
    },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: { type: String, required: true },
    eventDate: { type: Date, required: true },
    eventType: {
      type: String,
      enum: ['wedding', 'reception', 'pre_wedding', 'other'],
      required: true,
    },
    expectedGuests: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    advancePayment: { type: Number, default: 0 },
    remainingPayment: { type: Number, required: true },
    status: {
      type: String,
      enum: ['inquiry', 'confirmed', 'completed', 'cancelled'],
      default: 'inquiry',
    },
    notes: { type: String },
    requirements: [String],
    contactPerson: { type: String, required: true },
  },
  { timestamps: true }
);

const weddingPackageSchema = new Schema<IWeddingPackage>(
  {
    name: { type: String, required: true },
    description: { type: String },
    basePrice: { type: Number, required: true },
    maxGuests: { type: Number, required: true },
    includes: [String],
    decorationType: { type: String },
    cateringIncluded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const WeddingHall =
  mongoose.models.WeddingHall ||
  mongoose.model<IWeddingHall>('WeddingHall', weddingHallSchema);

export const WeddingEvent =
  mongoose.models.WeddingEvent ||
  mongoose.model<IWeddingEvent>('WeddingEvent', weddingEventSchema);

export const WeddingPackage =
  mongoose.models.WeddingPackage ||
  mongoose.model<IWeddingPackage>('WeddingPackage', weddingPackageSchema);
