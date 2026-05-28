import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryItem extends Document {
  name: string;
  category: 'food' | 'beverage' | 'supplies' | 'equipment';
  quantity: number;
  unit: string;
  minimumLevel: number;
  maximumLevel: number;
  unitCost: number;
  supplier: mongoose.Types.ObjectId;
  location: string;
  expiryDate?: Date;
  lastRestocked: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISupplier extends Document {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  paymentTerms: string;
  taxId?: string;
  rating: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryTransaction extends Document {
  inventoryItem: mongoose.Types.ObjectId;
  type: 'inbound' | 'outbound' | 'adjustment' | 'damage';
  quantity: number;
  unit: string;
  reference?: string;
  reason?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRestockRequest extends Document {
  inventoryItem: mongoose.Types.ObjectId;
  supplier: mongoose.Types.ObjectId;
  quantity: number;
  unit: string;
  estimatedCost: number;
  requestedBy: mongoose.Types.ObjectId;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  orderDate?: Date;
  expectedDelivery?: Date;
  actualDelivery?: Date;
  invoiceNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['food', 'beverage', 'supplies', 'equipment'],
      required: true,
    },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true }, // kg, liters, pieces, boxes, etc.
    minimumLevel: { type: Number, required: true },
    maximumLevel: { type: Number, required: true },
    unitCost: { type: Number, required: true },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    location: { type: String, required: true }, // Storage location
    expiryDate: { type: Date },
    lastRestocked: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const supplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    paymentTerms: { type: String, required: true }, // Net 30, COD, etc.
    taxId: { type: String },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const inventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
    },
    type: {
      type: String,
      enum: ['inbound', 'outbound', 'adjustment', 'damage'],
      required: true,
    },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    reference: { type: String }, // Purchase order, invoice, etc.
    reason: { type: String },
    notes: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
    transactionDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const restockRequestSchema = new Schema<IRestockRequest>(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    estimatedCost: { type: Number, required: true },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'ordered', 'received', 'cancelled'],
      default: 'pending',
    },
    orderDate: { type: Date },
    expectedDelivery: { type: Date },
    actualDelivery: { type: Date },
    invoiceNumber: { type: String },
  },
  { timestamps: true }
);

// Indexes for better query performance
inventoryItemSchema.index({ category: 1, quantity: 1 });
inventoryItemSchema.index({ expiryDate: 1 });
supplierSchema.index({ isActive: 1 });
inventoryTransactionSchema.index({ inventoryItem: 1, transactionDate: -1 });
restockRequestSchema.index({ status: 1 });

export const InventoryItem =
  mongoose.models.InventoryItem ||
  mongoose.model<IInventoryItem>('InventoryItem', inventoryItemSchema);

export const Supplier =
  mongoose.models.Supplier ||
  mongoose.model<ISupplier>('Supplier', supplierSchema);

export const InventoryTransaction =
  mongoose.models.InventoryTransaction ||
  mongoose.model<IInventoryTransaction>(
    'InventoryTransaction',
    inventoryTransactionSchema
  );

export const RestockRequest =
  mongoose.models.RestockRequest ||
  mongoose.model<IRestockRequest>('RestockRequest', restockRequestSchema);
