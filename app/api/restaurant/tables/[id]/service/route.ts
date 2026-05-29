import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Table, Order, MenuItem, Bill } from '@/lib/models/Restaurant';
import { ObjectId } from 'mongodb';

type Params = { params: Promise<{ id: string }> };

function generateBillNumber() {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate()
  ).padStart(2, '0')}`;
  const serial = Math.floor(1000 + Math.random() * 9000);
  return `RB-${ymd}-${serial}`;
}

// GET — return table details + current active order
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!ObjectId.isValid(id))
      return NextResponse.json({ success: false, error: 'Invalid table ID' }, { status: 400 });

    const table = await Table.findById(id).lean() as any;
    if (!table) return NextResponse.json({ success: false, error: 'Table not found' }, { status: 404 });

    let order = null;
    if (table.currentOrderId) {
      order = await Order.findById(table.currentOrderId).lean();
    }

    return NextResponse.json({ success: true, data: { table, order } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// body: { action: 'open' | 'add_items' | 'remove_item' | 'update_qty' | 'update_session' | 'close' }
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    if (!ObjectId.isValid(id))
      return NextResponse.json({ success: false, error: 'Invalid table ID' }, { status: 400 });

    const body = await req.json();
    const { action } = body;

    const table = await Table.findById(id);
    if (!table) return NextResponse.json({ success: false, error: 'Table not found' }, { status: 404 });

    // ── OPEN TABLE ───────────────────────────────────────────────────────────
    if (action === 'open') {
      if (table.status === 'occupied')
        return NextResponse.json({ success: false, error: 'Table is already occupied' }, { status: 400 });

      // Enforce 50-table active limit (already enforced at creation; just a safety check)
      const activeCount = await Table.countDocuments({ status: 'occupied' });
      if (activeCount >= 50)
        return NextResponse.json({ success: false, error: 'Maximum 50 active tables reached' }, { status: 400 });

      const { partyName = 'Guest', partySize = 1 } = body;
      if (partySize > table.capacity) {
        return NextResponse.json(
          { success: false, error: 'Party size exceeds table capacity' },
          { status: 400 }
        );
      }

      // Create an empty order for this table session
      const order = new Order({
        tableId: id,
        orderType: 'dine-in',
        partyName,
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        paymentStatus: 'unpaid',
        status: 'pending',
      });
      await order.save();

      table.status = 'occupied';
      table.partyName = partyName;
      table.partySize = partySize;
      table.openedAt = new Date();
      table.currentOrderId = order._id as any;
      table.currentBillId = undefined;
      await table.save();

      return NextResponse.json({ success: true, data: { table, order } }, { status: 201 });
    }

    if (action === 'update_session') {
      if (table.status !== 'occupied') {
        return NextResponse.json(
          { success: false, error: 'Only occupied tables can be edited' },
          { status: 400 }
        );
      }

      const { partyName = table.partyName, partySize = table.partySize || 1 } = body;
      if (partySize > table.capacity) {
        return NextResponse.json(
          { success: false, error: 'Party size exceeds table capacity' },
          { status: 400 }
        );
      }
      table.partyName = partyName;
      table.partySize = partySize;
      await table.save();


    // ── MERGE TABLES ─────────────────────────────────────────────────────────
    if (action === 'merge') {
      const { sourceTableId } = body;
      if (!sourceTableId || !ObjectId.isValid(sourceTableId)) {
        return NextResponse.json({ success: false, error: 'Valid sourceTableId required' }, { status: 400 });
      }
      if (!table.currentOrderId) {
        return NextResponse.json({ success: false, error: 'Target table has no active order' }, { status: 400 });
      }
      if (sourceTableId === id) {
        return NextResponse.json({ success: false, error: 'Cannot merge table into itself' }, { status: 400 });
      }

      const sourceTable = await Table.findById(sourceTableId);
      if (!sourceTable) return NextResponse.json({ success: false, error: 'Source table not found' }, { status: 404 });
      if (sourceTable.status !== 'occupied' || !sourceTable.currentOrderId) {
        return NextResponse.json({ success: false, error: 'Source table must be occupied with an active order' }, { status: 400 });
      }

      const targetOrder = await Order.findById(table.currentOrderId);
      const sourceOrder = await Order.findById(sourceTable.currentOrderId);
      if (!targetOrder || !sourceOrder) return NextResponse.json({ success: false, error: 'Order not found for one of the tables' }, { status: 404 });

      // Combine party names and sizes
      const mergedPartyName = [table.partyName, sourceTable.partyName].filter(Boolean).join(' + ') || targetOrder.partyName;
      const mergedPartySize = (table.partySize || 0) + (sourceTable.partySize || 0);
      table.partyName = mergedPartyName;
      table.partySize = mergedPartySize;
      targetOrder.partyName = mergedPartyName;

      for (const item of sourceOrder.items) {
        const existing = targetOrder.items.find(
          (i: any) => i.menuItemId.toString() === item.menuItemId.toString()
        );
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          targetOrder.items.push({
            menuItemId: item.menuItemId,
            itemName: item.itemName,
            quantity: item.quantity,
            specialInstructions: item.specialInstructions || '',
            price: item.price,
          });
        }
      }

      const subtotal = targetOrder.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
      const tax = parseFloat((subtotal * 0.05).toFixed(2));
      targetOrder.subtotal = subtotal;
      targetOrder.tax = tax;
      targetOrder.total = parseFloat((subtotal + tax - (targetOrder.discount || 0)).toFixed(2));
      targetOrder.updatedAt = new Date();
      await targetOrder.save();

      sourceTable.status = 'available';
      sourceTable.partyName = '';
      sourceTable.partySize = 0;
      sourceTable.openedAt = undefined;
      sourceTable.currentOrderId = undefined;
      sourceTable.currentBillId = undefined;
      await sourceTable.save();

      // Mark source order cancelled so it doesn't remain active
      sourceOrder.status = 'cancelled';
      sourceOrder.paymentStatus = 'unpaid';
      await sourceOrder.save();

      await table.save();

      return NextResponse.json({ success: true, data: { table, order: targetOrder } });
    }
      if (table.currentOrderId) {
        await Order.findByIdAndUpdate(table.currentOrderId, { partyName, updatedAt: new Date() });
      }

      return NextResponse.json({ success: true, data: { table } });
    }

    // ── ADD ITEMS ────────────────────────────────────────────────────────────
    if (action === 'add_items') {
      if (!table.currentOrderId)
        return NextResponse.json({ success: false, error: 'Table has no active order. Open the table first.' }, { status: 400 });

      const { items } = body; // [{ menuItemId, quantity, specialInstructions? }]
      if (!items || items.length === 0)
        return NextResponse.json({ success: false, error: 'No items provided' }, { status: 400 });

      const order = await Order.findById(table.currentOrderId);
      if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

      for (const item of items) {
        const menu = await MenuItem.findById(item.menuItemId);
        if (!menu) continue;

        // Check if item already in order — just increase qty
        const existing = order.items.find(
          (i: any) => i.menuItemId.toString() === item.menuItemId.toString()
        );
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          order.items.push({
            menuItemId: item.menuItemId,
            itemName: menu.name,
            quantity: item.quantity,
            specialInstructions: item.specialInstructions || '',
            price: menu.price,
          });
        }
      }

      // Recalculate totals
      const subtotal = order.items.reduce(
        (s: number, i: any) => s + i.price * i.quantity, 0
      );
      const tax = parseFloat((subtotal * 0.05).toFixed(2));
      order.subtotal = subtotal;
      order.tax = tax;
      order.total = parseFloat((subtotal + tax - (order.discount || 0)).toFixed(2));
      order.updatedAt = new Date();
      await order.save();

      return NextResponse.json({ success: true, data: order });
    }

    // ── REMOVE ITEM ──────────────────────────────────────────────────────────
    if (action === 'remove_item') {
      const { menuItemId } = body;
      if (!table.currentOrderId)
        return NextResponse.json({ success: false, error: 'No active order' }, { status: 400 });

      const order = await Order.findById(table.currentOrderId);
      if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

      order.items = order.items.filter(
        (i: any) => i.menuItemId.toString() !== menuItemId.toString()
      );
      const subtotal = order.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
      const tax = parseFloat((subtotal * 0.05).toFixed(2));
      order.subtotal = subtotal;
      order.tax = tax;
      order.total = parseFloat((subtotal + tax - (order.discount || 0)).toFixed(2));
      await order.save();

      return NextResponse.json({ success: true, data: order });
    }

    // ── UPDATE ITEM QTY ──────────────────────────────────────────────────────
    if (action === 'update_qty') {
      const { menuItemId, quantity } = body;
      if (!table.currentOrderId)
        return NextResponse.json({ success: false, error: 'No active order' }, { status: 400 });

      const order = await Order.findById(table.currentOrderId);
      if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

      const item = order.items.find((i: any) => i.menuItemId.toString() === menuItemId.toString());
      if (item) item.quantity = Math.max(1, quantity);

      const subtotal = order.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
      const tax = parseFloat((subtotal * 0.05).toFixed(2));
      order.subtotal = subtotal;
      order.tax = tax;
      order.total = parseFloat((subtotal + tax - (order.discount || 0)).toFixed(2));
      await order.save();

      return NextResponse.json({ success: true, data: order });
    }

    // ── CLOSE TABLE ──────────────────────────────────────────────────────────
    if (action === 'close') {
      if (!table.currentOrderId)
        return NextResponse.json({ success: false, error: 'No active order to close' }, { status: 400 });

      const { paymentMethod = 'cash', discount = 0, serviceCharge = 0, notes = '' } = body;

      const order = await Order.findById(table.currentOrderId);
      if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

      order.discount = discount;
      const subtotal = order.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
      const tax = parseFloat((subtotal * 0.05).toFixed(2));
      order.subtotal = subtotal;
      order.tax = tax;
      order.total = parseFloat((subtotal + tax + serviceCharge - discount).toFixed(2));
      order.paymentMethod = paymentMethod;
      order.paymentStatus = 'paid';
      order.status = 'completed';
      order.completionTime = new Date();
      await order.save();

      const billNumber = generateBillNumber();
      const qrCodeValue = `/bills/${billNumber}`;

      const bill = await Bill.create({
        orderId: order._id,
        customerId: order.customerId,
        tableId: table._id,
        tableNumber: table.tableNumber,
        partyName: table.partyName || order.partyName || 'Guest',
        items: order.items.map((item: any) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity,
        })),
        subtotal,
        tax,
        serviceCharge,
        discount,
        totalAmount: order.total,
        paymentStatus: 'paid',
        paymentMethods: [{ method: paymentMethod, amount: order.total }],
        billNumber,
        qrCodeValue,
        notes,
      });

      // Reset table
      table.status = 'available';
      table.partyName = '';
      table.partySize = 0;
      table.openedAt = undefined;
      table.currentOrderId = undefined;
      table.currentBillId = bill._id as any;
      await table.save();

      return NextResponse.json({ success: true, data: { table, order, bill } });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
