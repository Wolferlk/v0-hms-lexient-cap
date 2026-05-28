import { connectDB } from '@/lib/mongodb';
import { Attendance } from '@/lib/models/Staff';
import { NextRequest, NextResponse } from 'next/server';
import { sampleAttendance, sampleEmployees, withPopulatedRelations } from '@/lib/sampleData';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month'); // YYYY-MM

    const query: any = {};
    if (employeeId) query.employeeId = employeeId;

    if (month) {
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      query.attendanceDate = { $gte: startDate, $lt: endDate };
    }

    const attendance = await Attendance.find(query)
      .populate('employeeId', 'name email')
      .sort({ attendanceDate: -1 });

    const fallbackAttendance = withPopulatedRelations(sampleAttendance, {
      employeeId: sampleEmployees,
    }).filter((record) => {
      if (query.employeeId) {
        const resolvedEmployeeId =
          typeof record.employeeId === 'object'
            ? (record.employeeId as any)?._id
            : record.employeeId;
        if (resolvedEmployeeId !== query.employeeId) return false;
      }
      if (query.attendanceDate) {
        const attendanceDate = new Date(record.attendanceDate);
        if (attendanceDate < query.attendanceDate.$gte || attendanceDate >= query.attendanceDate.$lt) {
          return false;
        }
      }
      return true;
    });

    return NextResponse.json({ success: true, data: attendance.length ? attendance : fallbackAttendance });
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
    const { employeeId, attendanceDate, status, checkInTime, checkOutTime, remarks } = body;

    if (!employeeId || !attendanceDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const attendance = new Attendance({
      employeeId,
      attendanceDate: new Date(attendanceDate),
      status,
      checkInTime: checkInTime ? new Date(checkInTime) : undefined,
      checkOutTime: checkOutTime ? new Date(checkOutTime) : undefined,
      remarks,
    });

    await attendance.save();
    const populated = await attendance.populate('employeeId', 'name email');
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Attendance ID required' },
        { status: 400 }
      );
    }

    const updated = await Attendance.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Attendance record not found' },
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
