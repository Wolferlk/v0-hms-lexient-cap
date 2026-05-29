import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BoatRider } from '@/lib/models/BoatRider';
import { syncCompanyRiderToStaff } from '@/lib/boatRiderStaffSync';

function genId() {
  return `RD-${Date.now().toString(36).toUpperCase()}`;
}

export async function GET() {
  await connectDB();
  const riders = await BoatRider.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, data: riders });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const { name, phone, email, riderType, licenseNumber, licenseExpiry,
          monthlySalaryLKR, contractPricePerRideLKR, assignedBoatId, profileNote } = body;

  if (!name || !phone || !riderType) {
    return NextResponse.json({ success: false, error: 'name, phone, riderType required' }, { status: 400 });
  }

  const rider = await BoatRider.create({
    riderId: genId(),
    name, phone,
    email: email || '',
    riderType,
    licenseNumber: licenseNumber || '',
    licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : undefined,
    monthlySalaryLKR: riderType === 'company' ? Number(monthlySalaryLKR) || 0 : 0,
    contractPricePerRideLKR: riderType === 'contract' ? Number(contractPricePerRideLKR) || 0 : 0,
    assignedBoatId: riderType === 'company' ? (assignedBoatId || '') : '',
    profileNote: profileNote || '',
  });
  await syncCompanyRiderToStaff(rider);

  return NextResponse.json({ success: true, data: rider }, { status: 201 });
}
