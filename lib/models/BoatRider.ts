import mongoose, { Schema, Document } from 'mongoose';

export interface IBoatRider extends Document {
  riderId: string;
  name: string;
  phone: string;
  email?: string;
  riderType: 'company' | 'contract';
  licenseNumber?: string;
  licenseExpiry?: Date;
  // Company riders: fixed monthly salary, assigned to a boat — no per-ride payment
  monthlySalaryLKR?: number;
  assignedBoatId?: string;
  staffEmployeeId?: mongoose.Types.ObjectId;
  // Contract riders: paid per ride
  contractPricePerRideLKR?: number;
  status: 'active' | 'on_ride' | 'inactive' | 'on_leave';
  profileNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BoatRiderSchema = new Schema<IBoatRider>(
  {
    riderId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    riderType: { type: String, enum: ['company', 'contract'], required: true },
    licenseNumber: { type: String, default: '' },
    licenseExpiry: { type: Date },
    monthlySalaryLKR: { type: Number, min: 0, default: 0 },
    assignedBoatId: { type: String, default: '' },
    staffEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    contractPricePerRideLKR: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['active', 'on_ride', 'inactive', 'on_leave'],
      default: 'active',
    },
    profileNote: { type: String, default: '' },
  },
  { timestamps: true }
);

export const BoatRider =
  mongoose.models.BoatRider || mongoose.model<IBoatRider>('BoatRider', BoatRiderSchema);
