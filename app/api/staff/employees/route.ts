import { connectDB } from '@/lib/mongodb';
import { Employee } from '@/lib/models/Staff';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');

    const query: any = {};
    if (department) query.department = department;
    if (status) query.status = status;

    const employees = await Employee.find(query).sort({ name: 1 });
    return NextResponse.json({ success: true, data: employees });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      name,
      email,
      phone,
      department,
      position,
      joiningDate,
      salary,
      employmentType,
      address,
      emergencyContact,
      bankDetails,
    } = body;

    if (!name || !email || !phone || !department || !position || !joiningDate || !salary) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee with this email already exists' },
        { status: 400 }
      );
    }

    const employee = new Employee({
      name,
      email,
      phone,
      department,
      position,
      joiningDate: new Date(joiningDate),
      salary,
      employmentType,
      address,
      emergencyContact,
      bankDetails,
    });

    await employee.save();
    return NextResponse.json({ success: true, data: employee }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Employee ID required' },
        { status: 400 }
      );
    }

    const updated = await Employee.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
