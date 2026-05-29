import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { WeddingSupplierPackage } from '@/lib/models/WeddingHall';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const query: any = {};
    if (supplierId && ObjectId.isValid(supplierId)) query.supplierId = supplierId;
    if (activeOnly) query.isActive = true;

    const packages = await WeddingSupplierPackage.find(query)
      .sort({ packageType: 1, packageName: 1 })
      .lean();

    return NextResponse.json({ success: true, data: packages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { supplierId, packageType, packageName, description, price } = body;

    if (!supplierId || !ObjectId.isValid(supplierId) || !packageType || !packageName || price === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required supplier package fields' }, { status: 400 });
    }

    const supplierPackage = new WeddingSupplierPackage({
      supplierId,
      packageType,
      packageName,
      description: description || '',
      price,
      isActive: true,
    });

    await supplierPackage.save();
    return NextResponse.json({ success: true, data: supplierPackage }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, ...update } = body;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Valid package ID required' }, { status: 400 });
    }

    const supplierPackage = await WeddingSupplierPackage.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!supplierPackage) {
      return NextResponse.json({ success: false, error: 'Supplier package not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: supplierPackage });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Valid package ID required' }, { status: 400 });
    }

    const result = await WeddingSupplierPackage.findByIdAndDelete(id);
    if (!result) return NextResponse.json({ success: false, error: 'Supplier package not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Supplier package deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
