import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  category:
    | 'utilities'
    | 'maintenance'
    | 'supplies'
    | 'payroll'
    | 'food'
    | 'marketing'
    | 'other';
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'check' | 'bank_transfer';
  vendor?: string;
  invoice?: string;
  notes?: string;
  attachments?: string[];
  approvedBy?: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  dueDate?: Date;
  paidDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IIncome extends Document {
  source: 'booking' | 'restaurant' | 'wedding_hall' | 'event' | 'other';
  reference?: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'online' | 'check';
  description: string;
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  recordedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaxReport extends Document {
  period: string; // e.g., "2024-Q1", "2024-January"
  startDate: Date;
  endDate: Date;
  totalIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  taxRate: number;
  estimatedTax: number;
  deductions: number;
  notes?: string;
  generatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProfitReport extends Document {
  period: string; // Monthly, Quarterly, Yearly
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  profitMargin: number;
  breakdown: {
    bookingRevenue: number;
    restaurantRevenue: number;
    otherRevenue: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    category: {
      type: String,
      enum: [
        'utilities',
        'maintenance',
        'supplies',
        'payroll',
        'food',
        'marketing',
        'other',
      ],
      required: true,
    },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'check', 'bank_transfer'],
      default: 'cash',
    },
    vendor: { type: String },
    invoice: { type: String },
    notes: { type: String },
    attachments: [String], // File paths
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'rejected'],
      default: 'pending',
    },
    dueDate: { type: Date },
    paidDate: { type: Date },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
  },
  { timestamps: true }
);

const incomeSchema = new Schema<IIncome>(
  {
    source: {
      type: String,
      enum: ['booking', 'restaurant', 'wedding_hall', 'event', 'other'],
      required: true,
    },
    reference: { type: String },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'online', 'check'],
      default: 'cash',
    },
    description: { type: String, required: true },
    notes: { type: String },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
    recordedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const taxReportSchema = new Schema<ITaxReport>(
  {
    period: { type: String, required: true, unique: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalIncome: { type: Number, required: true },
    totalExpenses: { type: Number, required: true },
    taxableIncome: { type: Number, required: true },
    taxRate: { type: Number, default: 18 }, // Default GST rate
    estimatedTax: { type: Number, required: true },
    deductions: { type: Number, default: 0 },
    notes: { type: String },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
  },
  { timestamps: true }
);

const profitReportSchema = new Schema<IProfitReport>(
  {
    period: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalRevenue: { type: Number, required: true },
    totalExpenses: { type: Number, required: true },
    grossProfit: { type: Number, required: true },
    profitMargin: { type: Number, required: true },
    breakdown: {
      bookingRevenue: { type: Number, default: 0 },
      restaurantRevenue: { type: Number, default: 0 },
      otherRevenue: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
expenseSchema.index({ category: 1, status: 1 });
expenseSchema.index({ createdAt: -1 });
incomeSchema.index({ source: 1, recordedDate: -1 });
taxReportSchema.index({ period: 1 });
profitReportSchema.index({ startDate: 1, endDate: 1 });

export const Expense =
  mongoose.models.Expense ||
  mongoose.model<IExpense>('Expense', expenseSchema);

export const Income =
  mongoose.models.Income ||
  mongoose.model<IIncome>('Income', incomeSchema);

export const TaxReport =
  mongoose.models.TaxReport ||
  mongoose.model<ITaxReport>('TaxReport', taxReportSchema);

export const ProfitReport =
  mongoose.models.ProfitReport ||
  mongoose.model<IProfitReport>('ProfitReport', profitReportSchema);
