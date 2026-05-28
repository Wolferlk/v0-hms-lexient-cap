import mongoose from 'mongoose';

const DayOutPackageSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  description: String,
  price: { type: Number, required: true },
  capacity: { type: Number, required: true, min: 1 },
  duration: { type: Number, required: true }, // in hours
  activities: [String], // e.g., 'swimming', 'water_sports', 'bbq'
  inclusions: [String], // what's included
  image: String,
  minGroupSize: { type: Number, default: 10 },
  maxGroupSize: { type: Number, required: true },
  availability: {
    startDate: Date,
    endDate: Date,
    daysOfWeek: [Number], // 0-6
  },
  amenities: [String],
  pricePerPerson: { type: Number, required: true },
  discountPercentage: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const GroupBookingSchema = new mongoose.Schema({
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'DayOutPackage', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  groupName: { type: String, required: true },
  bookingDate: { type: Date, required: true, index: true },
  numberOfPeople: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true },
  depositAmount: { type: Number, required: true },
  balanceAmount: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending',
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  specialRequests: String,
  contactPerson: {
    name: String,
    phone: String,
    email: String,
  },
  activities: [String],
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const BoatRidePackageSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  description: String,
  boatType: {
    type: String,
    enum: ['speed_boat', 'houseboat', 'yacht', 'catamaran', 'ferry'],
    required: true,
  },
  capacity: { type: Number, required: true },
  price: { type: Number, required: true },
  pricePerPerson: { type: Number, required: true },
  duration: { type: Number, required: true }, // in minutes
  routeDescription: String,
  landmarks: [String],
  mealIncluded: { type: Boolean, default: false },
  lifeJacketsProvided: { type: Boolean, default: true },
  availability: {
    startDate: Date,
    endDate: Date,
    departureTime: [String], // multiple time slots
  },
  safetyRating: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
});

const BoatRideBookingSchema = new mongoose.Schema({
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'BoatRidePackage', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  bookingDate: { type: Date, required: true, index: true },
  departureTime: { type: String, required: true },
  numberOfPassengers: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid',
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  specialRequests: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const DayOutPackage =
  mongoose.models.DayOutPackage || mongoose.model('DayOutPackage', DayOutPackageSchema);
export const GroupBooking =
  mongoose.models.GroupBooking || mongoose.model('GroupBooking', GroupBookingSchema);
export const BoatRidePackage =
  mongoose.models.BoatRidePackage || mongoose.model('BoatRidePackage', BoatRidePackageSchema);
export const BoatRideBooking =
  mongoose.models.BoatRideBooking || mongoose.model('BoatRideBooking', BoatRideBookingSchema);

export type IDayOutPackage = typeof DayOutPackage;
export type IGroupBooking = typeof GroupBooking;
export type IBoatRidePackage = typeof BoatRidePackage;
export type IBoatRideBooking = typeof BoatRideBooking;
