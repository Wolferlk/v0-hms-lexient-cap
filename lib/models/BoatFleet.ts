import mongoose, { Schema, Document } from 'mongoose';

// ── Service Record ────────────────────────────────────────────────────────────

export interface IServiceRecord {
  _id?: string;
  date: Date;
  type: 'routine' | 'repair' | 'inspection' | 'fuel' | 'cleaning';
  description: string;
  costLKR: number;
  performedBy?: string;
  nextDueDateNote?: string;
}

const ServiceRecordSchema = new Schema<IServiceRecord>(
  {
    date: { type: Date, required: true, default: Date.now },
    type: { type: String, enum: ['routine', 'repair', 'inspection', 'fuel', 'cleaning'], required: true },
    description: { type: String, required: true },
    costLKR: { type: Number, required: true, min: 0, default: 0 },
    performedBy: { type: String, default: '' },
    nextDueDateNote: { type: String, default: '' },
  },
  { _id: true }
);

// ── Boat ─────────────────────────────────────────────────────────────────────

export interface IBoat extends Document {
  boatId: string;
  name: string;
  type: 'speed_boat' | 'catamaran' | 'dinghy' | 'yacht' | 'canoe' | 'pontoon' | 'houseboat' | 'ferry';
  registrationNumber: string;
  capacity: number;
  color?: string;
  engineType?: string;
  yearBuilt?: number;
  status: 'available' | 'on_ride' | 'maintenance' | 'out_of_service';
  serviceRecords: IServiceRecord[];
  nextServiceDueNote?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BoatSchema = new Schema<IBoat>(
  {
    boatId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['speed_boat', 'catamaran', 'dinghy', 'yacht', 'canoe', 'pontoon', 'houseboat', 'ferry'],
      required: true,
    },
    registrationNumber: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    color: { type: String, default: '' },
    engineType: { type: String, default: '' },
    yearBuilt: { type: Number },
    status: {
      type: String,
      enum: ['available', 'on_ride', 'maintenance', 'out_of_service'],
      default: 'available',
    },
    serviceRecords: { type: [ServiceRecordSchema], default: [] },
    nextServiceDueNote: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Boat = mongoose.models.Boat || mongoose.model<IBoat>('Boat', BoatSchema);
