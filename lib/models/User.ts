import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['customer', 'staff', 'admin'],
      default: 'customer',
      index: true,
    },
    department: {
      type: String,
      enum: [
        'front-desk',
        'housekeeping',
        'kitchen',
        'restaurant',
        'maintenance',
        'management',
        'none',
      ],
      default: 'none',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpiry: Date,
    resetToken: String,
    resetTokenExpiry: Date,
    otpCode: String,
    otpExpiry: Date,
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: String,
    googleId: String,
    profileImage: String,
    address: String,
    city: String,
    country: String,
    zipCode: String,
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      whatsappNotifications: { type: Boolean, default: false },
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    metadata: {
      lastIp: String,
      userAgent: String,
      loginDevice: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
