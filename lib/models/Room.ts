import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  roomNumber: string;
  category: string;
  capacity: number;
  pricePerNight: number;
  description: string;
  amenities: string[];
  images: string[];
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Standard', 'Deluxe', 'Suite', 'Presidential'],
      default: 'Standard',
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: '',
    },
    amenities: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Room = mongoose.models.Room || mongoose.model<IRoom>('Room', roomSchema);
