import { connectDB } from '@/lib/mongodb';
import { Payroll, Employee } from '@/lib/models/Staff';
import { NextRequest, NextResponse } from 'next/server';
import { sampleEmployees, samplePayrolls, withPopulatedRelations } from '@/lib/sampleData';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');
    const status = searchParams.get('status');

    const query: any = {};
    if (employeeId) query.employeeId = employeeId;
    if (month) query.month = month;
    if (status) query.status = status;

    const payrolls = await Payroll.find(query)
      .populate('employeeId', 'name email salary')
      .sort({ month: -1 });

    const fallbackPayrolls = withPopulatedRelations(samplePayrolls, {
      employeeId: sampleEmployees,
    }).filter((payroll) => {
      if (query.employeeId) {
        const resolvedEmployeeId =
          typeof payroll.employeeId === 'object' ? payroll.employeeId?._id : payroll.employeeId;
        if (resolvedEmployeeId !== query.employeeId) return false;
      }
      if (query.month && payroll.month !== query.month) return false;
      if (query.status && payroll.status !== query.status) return false;
      return true;
    });

    return NextResponse.json({ success: true, data: payrolls.length ? payrolls : fallbackPayrolls });
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
    const { employeeId, month, allowances, deductions } = body;

    if (!employeeId || !month) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get employee salary
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    const basicSalary = employee.salary;
    const totalAllowances = allowances || 0;
    const totalDeductions = deductions || 0;
    const netSalary = basicSalary + totalAllowances - totalDeductions;

    const payroll = new Payroll({
      employeeId,
      month,
      basicSalary,
      allowances: totalAllowances,
      deductions: totalDeductions,
      netSalary,
    });

    await payroll.save();
    const populated = await payroll.populate('employeeId', 'name email salary');
    return NextResponse.json({ success: true, data: populated }, { status: 201 });
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
    const { id, status, paymentDate, paymentMethod, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Payroll ID required' },
        { status: 400 }
      );
    }

    const updatePayload: any = { ...updateData };

    if (status) {
      updatePayload.status = status;
      if (status === 'paid') {
        updatePayload.paymentDate = paymentDate || new Date();
        updatePayload.paymentMethod = paymentMethod;
      }
    }

    const updated = await Payroll.findByIdAndUpdate(id, updatePayload, { new: true });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Payroll record not found' },
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
