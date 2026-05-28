import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  description: String,
  category: {
    type: String,
    enum: ['appetizer', 'main', 'dessert', 'beverage', 'special'],
    required: true,
  },
  price: { type: Number, required: true },
  vegetarian: { type: Boolean, default: false },
  spiceLevel: { type: Number, min: 0, max: 5, default: 0 },
  available: { type: Boolean, default: true },
  image: String,
  preparationTime: { type: Number, default: 30 }, // in minutes
  createdAt: { type: Date, default: Date.now },
});

const TableSchema = new mongoose.Schema({
  tableNumber: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true, min: 1, max: 50 },
  location: {
    type: String,
    enum: ['indoor', 'outdoor', 'private'],
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'occupied', 'maintenance'],
    default: 'available',
  },
  amenities: [String],
  // Session fields (set when table is opened for service)
  partyName: { type: String, default: '' },
  partySize: { type: Number, default: 0 },
  openedAt: { type: Date },
  currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  currentBillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill' },
  createdAt: { type: Date, default: Date.now },
});

const ReservationSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  reservationDate: { type: Date, required: true, index: true },
  guestCount: { type: Number, required: true, min: 1 },
  duration: { type: Number, default: 120 }, // in minutes
  specialRequests: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  contactPhone: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const OrderSchema = new mongoose.Schema({
  reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', index: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  partyName: { type: String, default: '' },
  orderType: {
    type: String,
    enum: ['dine-in', 'room-service'],
    default: 'dine-in',
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'beverages'],
    default: 'lunch',
  },
  roomNumber: { type: String, default: '' },
  items: [
    {
      menuItemId: { type: mongoose.Schema.Types.ObjectId, required: true },
      itemName: { type: String, default: '' },
      quantity: { type: Number, required: true },
      specialInstructions: String,
      price: Number,
    },
  ],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'charged_to_room'],
    default: 'unpaid',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'wallet', 'room_charge'],
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'preparing', 'ready', 'served', 'delivered', 'completed', 'cancelled'],
    default: 'pending',
  },
  orderTime: { type: Date, default: Date.now },
  completionTime: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const BillSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', index: true },
  tableNumber: { type: String, index: true },
  partyName: { type: String, default: '' },
  items: [
    {
      itemName: String,
      quantity: Number,
      unitPrice: Number,
      total: Number,
    },
  ],
  subtotal: Number,
  tax: Number,
  serviceCharge: { type: Number, default: 0 },
  discount: Number,
  totalAmount: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid',
  },
  paymentMethods: [
    {
      method: String,
      amount: Number,
    },
  ],
  billNumber: { type: String, unique: true, index: true },
  qrCodeValue: { type: String, index: true },
  billDate: { type: Date, default: Date.now },
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

export const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);
export const Table = mongoose.models.Table || mongoose.model('Table', TableSchema);
export const Reservation = mongoose.models.Reservation || mongoose.model('Reservation', ReservationSchema);
export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export const Bill = mongoose.models.Bill || mongoose.model('Bill', BillSchema);

export type IMenuItem = typeof MenuItem;
export type ITable = typeof Table;
export type IReservation = typeof Reservation;
export type IOrder = typeof Order;
export type IBill = typeof Bill;
