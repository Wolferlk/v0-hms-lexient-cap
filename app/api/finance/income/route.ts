import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Income, Expense } from '@/lib/models/Finance';
import { sampleEmployees, sampleIncome, withPopulatedRelations } from '@/lib/sampleData';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: any = {};
    if (source) query.source = source;

    if (startDate || endDate) {
      query.recordedDate = {};
      if (startDate) query.recordedDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.recordedDate.$lte = end;
      }
    }

    const income = await Income.find(query)
      .populate('recordedBy', 'name')
      .sort({ recordedDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Income.countDocuments(query);
    const totalAmount = await Income.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const fallbackIncome = withPopulatedRelations(sampleIncome, {
      recordedBy: sampleEmployees,
    }).filter((entry) => {
      if (query.source && entry.source !== query.source) return false;
      return true;
    });
    const fallbackTotalAmount = fallbackIncome.reduce((sum, entry) => sum + entry.amount, 0);

    return NextResponse.json({
      success: true,
      data: income.length ? income : fallbackIncome,
      totalAmount: income.length ? totalAmount[0]?.total || 0 : fallbackTotalAmount,
      pagination: {
        total: income.length ? total : fallbackIncome.length,
        page,
        limit,
        pages: Math.ceil((income.length ? total : fallbackIncome.length) / limit),
      },
    });
  } catch (error: any) {
    console.error('[v0] Income GET error:', error);
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

    if (!body.source || !body.amount || !body.recordedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const income = new Income({
      source: body.source,
      reference: body.reference,
      amount: body.amount,
      paymentMethod: body.paymentMethod || 'cash',
      description: body.description || '',
      notes: body.notes,
      recordedBy: body.recordedBy,
      recordedDate: body.recordedDate || new Date(),
    });

    await income.save();
    await income.populate('recordedBy', 'name');

    return NextResponse.json(
      { success: true, data: income },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[v0] Income POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Get financial dashboard summary
export async function GET_SUMMARY(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';

    const now = new Date();
    let startDate;

    if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const query = {
      recordedDate: { $gte: startDate, $lte: now },
    };

    const totalIncome = await Income.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const expenseQuery = {
      createdAt: { $gte: startDate, $lte: now },
    };

    const totalExpenses = await Expense.aggregate([
      { $match: expenseQuery },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return NextResponse.json({
      success: true,
      summary: {
        totalIncome: totalIncome[0]?.total || 0,
        totalExpenses: totalExpenses[0]?.total || 0,
        netProfit:
          (totalIncome[0]?.total || 0) - (totalExpenses[0]?.total || 0),
      },
    });
  } catch (error: any) {
    console.error('[v0] Summary GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
