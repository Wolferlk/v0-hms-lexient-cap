import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  email: string;
  name: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  profileImage?: string;
  totalBookings: number;
  totalSpent: number;
  isVIP: boolean;
  preferences?: {
    roomCategory?: string;
    specialRequests?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: '',
    },
    profileImage: {
      type: String,
      default: '',
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    isVIP: {
      type: Boolean,
      default: false,
    },
    preferences: {
      roomCategory: String,
      specialRequests: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', customerSchema);
