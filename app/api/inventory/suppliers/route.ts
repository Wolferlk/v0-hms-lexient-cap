import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Supplier } from '@/lib/models/Inventory';
import { sampleSuppliers } from '@/lib/sampleData';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: any = {};
    if (activeOnly) query.isActive = true;

    const suppliers = await Supplier.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Supplier.countDocuments(query);
    const fallbackSuppliers = sampleSuppliers.filter((supplier) => {
      if (query.isActive !== undefined && supplier.isActive !== query.isActive) return false;
      return true;
    });

    return NextResponse.json({
      success: true,
      data: suppliers.length ? suppliers : fallbackSuppliers,
      pagination: {
        total: suppliers.length ? total : fallbackSuppliers.length,
        page,
        limit,
        pages: Math.ceil((suppliers.length ? total : fallbackSuppliers.length) / limit),
      },
    });
  } catch (error: any) {
    console.error('[v0] Suppliers GET error:', error);
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

    // Validate required fields
    if (
      !body.name ||
      !body.contactPerson ||
      !body.email ||
      !body.phone ||
      !body.address
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    const supplier = new Supplier({
      name: body.name,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city || '',
      state: body.state || '',
      zipCode: body.zipCode || '',
      paymentTerms: body.paymentTerms || 'COD',
      taxId: body.taxId,
      rating: body.rating || 5,
      isActive: true,
    });

    await supplier.save();

    return NextResponse.json(
      { success: true, data: supplier },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[v0] Suppliers POST error:', error);
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
    const { id, ...update } = body;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Valid supplier ID required' }, { status: 400 });
    }

    const supplier = await Supplier.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!supplier) return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: supplier });
  } catch (error: any) {
    console.error('[v0] Suppliers PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Valid supplier ID required' }, { status: 400 });
    }

    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Supplier deleted' });
  } catch (error: any) {
    console.error('[v0] Suppliers DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
