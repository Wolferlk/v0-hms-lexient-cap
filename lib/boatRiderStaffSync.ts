import { Employee } from '@/lib/models/Staff';

type BoatRiderLike = {
  _id: unknown;
  riderId: string;
  name: string;
  phone: string;
  email?: string;
  riderType: 'company' | 'contract';
  licenseNumber?: string;
  monthlySalaryLKR?: number;
  status?: 'active' | 'on_ride' | 'inactive' | 'on_leave';
  profileNote?: string;
  staffEmployeeId?: unknown;
  save: () => Promise<unknown>;
};

function employeeStatus(status?: BoatRiderLike['status']) {
  if (status === 'inactive') return 'inactive';
  if (status === 'on_leave') return 'on_leave';
  return 'active';
}

function staffEmail(rider: BoatRiderLike) {
  return rider.email?.trim() || `${rider.riderId.toLowerCase()}@boat-rides.local`;
}

export async function syncCompanyRiderToStaff(rider: BoatRiderLike) {
  if (rider.riderType !== 'company') {
    if (rider.staffEmployeeId) {
      await Employee.findByIdAndUpdate(rider.staffEmployeeId, {
        status: 'terminated',
        updatedAt: new Date(),
      });
      rider.staffEmployeeId = undefined;
      await rider.save();
    }
    return;
  }

  const email = staffEmail(rider);
  const payload = {
    name: rider.name,
    email,
    phone: rider.phone,
    department: 'boat_rides',
    position: 'Boat Rider',
    joiningDate: new Date(),
    salary: Number(rider.monthlySalaryLKR) || 0,
    employmentType: 'full-time',
    status: employeeStatus(rider.status),
    documents: {
      drivingLicense: rider.licenseNumber || '',
    },
    updatedAt: new Date(),
  };

  const existing = rider.staffEmployeeId
    ? await Employee.findById(rider.staffEmployeeId)
    : await Employee.findOne({ email });

  const employee = existing
    ? await Employee.findByIdAndUpdate(existing._id, payload, { new: true })
    : await Employee.create(payload);

  if (employee && String(rider.staffEmployeeId || '') !== String(employee._id)) {
    rider.staffEmployeeId = employee._id;
    await rider.save();
  }
}
