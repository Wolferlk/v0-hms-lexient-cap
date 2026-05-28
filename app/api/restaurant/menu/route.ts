import { connectDB } from '@/lib/mongodb';
import { MenuItem } from '@/lib/models/Restaurant';
import { NextRequest, NextResponse } from 'next/server';
import { sampleMenuItems } from '@/lib/sampleData';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const available = searchParams.get('available');

    const query: any = {};
    if (category) query.category = category;
    if (available !== null) query.available = available === 'true';

    const items = await MenuItem.find(query).sort({ category: 1, name: 1 });
    const fallbackItems = sampleMenuItems.filter((item) => {
      if (query.category && item.category !== query.category) return false;
      if (query.available !== undefined && item.available !== query.available) return false;
      return true;
    });
    return NextResponse.json({ success: true, data: items.length ? items : fallbackItems });
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
    const { name, description, category, price, vegetarian, spiceLevel, image, preparationTime } = body;

    if (!name || !category || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const menuItem = new MenuItem({
      name,
      description,
      category,
      price,
      vegetarian,
      spiceLevel,
      image,
      preparationTime,
    });

    await menuItem.save();
    return NextResponse.json({ success: true, data: menuItem }, { status: 201 });
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
        { success: false, error: 'Item ID required' },
        { status: 400 }
      );
    }

    const updated = await MenuItem.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
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

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Item ID required' },
        { status: 400 }
      );
    }

    const deleted = await MenuItem.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Item deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
