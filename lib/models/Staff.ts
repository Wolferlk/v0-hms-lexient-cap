import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  department: {
    type: String,
    enum: ['housekeeping', 'restaurant', 'front_desk', 'maintenance', 'security', 'management'],
    required: true,
  },
  position: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  salary: { type: Number, required: true },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract'],
    default: 'full-time',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'terminated'],
    default: 'active',
  },
  address: String,
  emergencyContact: {
    name: String,
    phone: String,
    relation: String,
  },
  bankDetails: {
    accountHolder: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String,
  },
  documents: {
    aadhar: String,
    pan: String,
    drivingLicense: String,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const AttendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  attendanceDate: { type: Date, required: true, index: true },
  checkInTime: Date,
  checkOutTime: Date,
  status: {
    type: String,
    enum: ['present', 'absent', 'half_day', 'leave', 'holiday'],
    default: 'absent',
  },
  remarks: String,
  createdAt: { type: Date, default: Date.now },
});

const LeaveSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  leaveType: {
    type: String,
    enum: ['casual', 'sick', 'earned', 'maternity', 'unpaid'],
    required: true,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  numberOfDays: { type: Number, required: true },
  reason: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approvedBy: mongoose.Schema.Types.ObjectId,
  comments: String,
  createdAt: { type: Date, default: Date.now },
});

const PayrollSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  month: { type: String, required: true }, // e.g., '2024-01'
  basicSalary: Number,
  allowances: Number,
  deductions: Number,
  netSalary: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processed', 'paid'],
    default: 'pending',
  },
  paymentDate: Date,
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'cheque'],
  },
  remarks: String,
  createdAt: { type: Date, default: Date.now },
});

const ShiftSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  startTime: { type: String, required: true }, // e.g., '09:00'
  endTime: { type: String, required: true }, // e.g., '17:00'
  breakDuration: { type: Number, default: 30 }, // in minutes
  description: String,
  createdAt: { type: Date, default: Date.now },
});

const RosterSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
  assignedDate: { type: Date, required: true, index: true },
  department: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

export const Employee =
  mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
export const Attendance =
  mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
export const Leave = mongoose.models.Leave || mongoose.model('Leave', LeaveSchema);
export const Payroll = mongoose.models.Payroll || mongoose.model('Payroll', PayrollSchema);
export const Shift = mongoose.models.Shift || mongoose.model('Shift', ShiftSchema);
export const Roster = mongoose.models.Roster || mongoose.model('Roster', RosterSchema);

export type IEmployee = typeof Employee;
export type IAttendance = typeof Attendance;
export type ILeave = typeof Leave;
export type IPayroll = typeof Payroll;
export type IShift = typeof Shift;
export type IRoster = typeof Roster;
