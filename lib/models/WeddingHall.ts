import mongoose, { Schema, Document } from 'mongoose';

export interface IWeddingHall extends Document {
  name: string;
  capacity: number;
  area: number;
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

export interface IWeddingMenuPackage extends Document {
  packageNumber: number; // 1-5, 0 = custom
  name: string;
  description: string;
  pricePerHead: number;
  items: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWeddingQuotation extends Document {
  quoteNumber: string;
  hallId: mongoose.Types.ObjectId;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventDate: Date;
  eventStartTime: string;
  eventEndTime: string;
  eventType: 'wedding' | 'reception' | 'pre_wedding' | 'birthday' | 'corporate' | 'other';
  pax: number;
  menuPackageId?: mongoose.Types.ObjectId;
  customMenuItems: string[];
  addOns: {
    type: 'dj' | 'decoration' | 'traditional_dancing' | 'photography' | 'videography' | 'other';
    description: string;
    price: number;
  }[];
  additionalItems: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  baseAmount: number;
  menuAmount: number;
  addOnsAmount: number;
  additionalAmount: number;
  totalAmount: number;
  advancePaid: number;
  payments: {
    amount: number;
    method: string;
    date: Date;
    notes: string;
  }[];
  quotationDate: Date;
  validUntil: Date;
  status: 'draft' | 'active' | 'expired' | 'closed' | 'cancelled';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schemas ──────────────────────────────────────────────────────────────────

const weddingHallSchema = new Schema<IWeddingHall>(
  {
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    area: { type: Number, required: true },
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
    hallId: { type: mongoose.Schema.Types.ObjectId, ref: 'WeddingHall', required: true },
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

const weddingMenuPackageSchema = new Schema<IWeddingMenuPackage>(
  {
    packageNumber: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    pricePerHead: { type: Number, required: true, min: 0 },
    items: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const addOnSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['dj', 'decoration', 'traditional_dancing', 'photography', 'videography', 'other'],
      required: true,
    },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const additionalItemSchema = new Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const quotationPaymentSchema = new Schema(
  {
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  },
  { _id: true }
);

const weddingQuotationSchema = new Schema<IWeddingQuotation>(
  {
    quoteNumber: { type: String, required: true, unique: true },
    hallId: { type: mongoose.Schema.Types.ObjectId, ref: 'WeddingHall', required: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true, lowercase: true },
    clientPhone: { type: String, required: true },
    eventDate: { type: Date, required: true },
    eventStartTime: { type: String, default: '18:00' },
    eventEndTime: { type: String, default: '23:00' },
    eventType: {
      type: String,
      enum: ['wedding', 'reception', 'pre_wedding', 'birthday', 'corporate', 'other'],
      default: 'wedding',
    },
    pax: { type: Number, required: true, min: 1 },
    menuPackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'WeddingMenuPackage' },
    customMenuItems: [{ type: String }],
    addOns: [addOnSchema],
    additionalItems: [additionalItemSchema],
    baseAmount: { type: Number, default: 0 },
    menuAmount: { type: Number, default: 0 },
    addOnsAmount: { type: Number, default: 0 },
    additionalAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    advancePaid: { type: Number, default: 0 },
    payments: [quotationPaymentSchema],
    quotationDate: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'expired', 'closed', 'cancelled'],
      default: 'draft',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// ── Models ───────────────────────────────────────────────────────────────────

export const WeddingHall =
  mongoose.models.WeddingHall ||
  mongoose.model<IWeddingHall>('WeddingHall', weddingHallSchema);

export const WeddingEvent =
  mongoose.models.WeddingEvent ||
  mongoose.model<IWeddingEvent>('WeddingEvent', weddingEventSchema);

export const WeddingPackage =
  mongoose.models.WeddingPackage ||
  mongoose.model<IWeddingPackage>('WeddingPackage', weddingPackageSchema);

export const WeddingMenuPackage =
  mongoose.models.WeddingMenuPackage ||
  mongoose.model<IWeddingMenuPackage>('WeddingMenuPackage', weddingMenuPackageSchema);

export const WeddingQuotation =
  mongoose.models.WeddingQuotation ||
  mongoose.model<IWeddingQuotation>('WeddingQuotation', weddingQuotationSchema);
