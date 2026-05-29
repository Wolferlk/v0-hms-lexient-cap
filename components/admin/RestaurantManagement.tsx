'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Printer,
  XCircle,
  Trash2,
  ChefHat,
  Clock,
  MinusCircle,
  PlusCircle,
  CheckCircle,
  QrCode,
  RefreshCw,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MenuItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  preparationTime: number;
  vegetarian: boolean;
  spiceLevel: number;
}

interface OrderItem {
  menuItemId: string;
  itemName: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

interface TableOrder {
  _id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  partyName?: string;
  billNumber?: string;
}

interface RestaurantBill {
  _id: string;
  billNumber: string;
  tableNumber?: string;
  partyName?: string;
  subtotal: number;
  tax: number;
  serviceCharge?: number;
  discount: number;
  totalAmount: number;
  paymentStatus: string;
  billDate?: string;
  notes?: string;
  paymentMethods?: { method: string; amount: number }[];
}

interface RestaurantTable {
  _id: string;
  tableNumber: string;
  capacity: number;
  location: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  partyName?: string;
  partySize?: number;
  openedAt?: string;
  currentOrderId?: string;
}

interface EditableTableForm {
  tableNumber: string;
  capacity: number;
  location: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
}

// ── Thermal print ─────────────────────────────────────────────────────────────

function printBill(
  table: RestaurantTable,
  order: TableOrder,
  bill?: RestaurantBill,
  hotelName = 'Lexient Hotel'
) {
  const qrUrl = bill?.billNumber
    ? `${window.location.origin}/bills/${bill.billNumber}`
    : `${window.location.origin}/bills/preview-${table._id}`;
  const html = `<!DOCTYPE html><html><head><title>Bill - Table ${table.tableNumber}</title>
  <style>
    body{font-family:'Courier New',monospace;font-size:12px;width:300px;margin:0 auto;padding:8px}
    h2{text-align:center;margin:4px 0;font-size:15px}
    .c{text-align:center} hr{border:none;border-top:1px dashed #000;margin:6px 0}
    table{width:100%;border-collapse:collapse} td{padding:2px 0} .r{text-align:right}
    .tb td{font-weight:bold;font-size:13px} img.qr{display:block;margin:8px auto;width:110px}
    @media print{body{margin:0}}
  </style></head><body>
  <h2>${hotelName}</h2><p class="c">Restaurant · Table Service</p><hr/>
  ${bill?.billNumber ? `<p class="c"><b>Bill No:</b> ${bill.billNumber}</p>` : ''}
  <p>Table: <b>${table.tableNumber}</b> (${table.location})</p>
  <p>Party: ${table.partyName || 'Guest'} · ${table.partySize || 1} pax</p>
  ${table.openedAt ? `<p>Opened: ${format(new Date(table.openedAt), 'MMM dd, HH:mm')}</p>` : ''}
  <p>Printed: ${format(new Date(), 'MMM dd yyyy, HH:mm')}</p><hr/>
  <table>
    <tr><td><b>Item</b></td><td class="r"><b>Qty</b></td><td class="r"><b>Total</b></td></tr>
    ${order.items.map(i => `<tr><td>${i.itemName}</td><td class="r">${i.quantity}</td><td class="r">$${(i.price * i.quantity).toFixed(2)}</td></tr>`).join('')}
  </table><hr/>
  <table>
    <tr><td>Subtotal</td><td class="r">$${order.subtotal.toFixed(2)}</td></tr>
    <tr><td>Tax (5%)</td><td class="r">$${order.tax.toFixed(2)}</td></tr>
    ${bill?.serviceCharge ? `<tr><td>Service Charge</td><td class="r">$${bill.serviceCharge.toFixed(2)}</td></tr>` : ''}
    ${order.discount > 0 ? `<tr><td>Discount</td><td class="r">-$${order.discount.toFixed(2)}</td></tr>` : ''}
    <tr class="tb"><td>TOTAL</td><td class="r">$${(bill?.totalAmount ?? order.total).toFixed(2)}</td></tr>
  </table><hr/>
  <p class="c" style="font-size:10px">Scan to view this bill online</p>
  <img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(qrUrl)}" />
  <p class="c" style="font-size:9px">Thank you for dining with us!</p>
  </body></html>`;
  const w = window.open('', '_blank', 'width=400,height=600');
  if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RestaurantManagement() {
  const [activeTab, setActiveTab] = useState('tables');
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [tableOrder, setTableOrder] = useState<TableOrder | null>(null);
  const [servicePanel, setServicePanel] = useState(false);

  const [openTableDialog, setOpenTableDialog] = useState(false);
  const [openingTable, setOpeningTable] = useState<RestaurantTable | null>(null);
  const [partyName, setPartyName] = useState('');
  const [partySize, setPartySize] = useState(1);
  const [openLoading, setOpenLoading] = useState(false);
  const [sessionPartyName, setSessionPartyName] = useState('');
  const [sessionPartySize, setSessionPartySize] = useState(1);
  const [sessionLoading, setSessionLoading] = useState(false);

  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategory, setMenuCategory] = useState('all');
  const [addingItems, setAddingItems] = useState<{ menuItemId: string; quantity: number }[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [menuSearch2, setMenuSearch2] = useState('');

  const [closeDiscount, setCloseDiscount] = useState(0);
  const [closeServiceCharge, setCloseServiceCharge] = useState(0);
  const [closePayMethod, setClosePayMethod] = useState('cash');
  const [closeNotes, setCloseNotes] = useState('');
  const [closeLoading, setCloseLoading] = useState(false);
  const [mergeSourceTableId, setMergeSourceTableId] = useState('');
  const [mergeLoading, setMergeLoading] = useState(false);

  const [addTableDialog, setAddTableDialog] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableCap, setNewTableCap] = useState(4);
  const [newTableLoc, setNewTableLoc] = useState('indoor');
  const [editTableDialog, setEditTableDialog] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [editTableForm, setEditTableForm] = useState<EditableTableForm>({
    tableNumber: '',
    capacity: 4,
    location: 'indoor',
    status: 'available',
  });

  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [menuDialog, setMenuDialog] = useState(false);
  const [menuForm, setMenuForm] = useState({ name: '', category: 'main', price: 0, vegetarian: false, spiceLevel: 0, preparationTime: 30, available: true });

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchTables = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await fetch('/api/restaurant/tables');
      const data = await res.json();
      if (data.success) setTables(data.data);
    } catch { toast.error('Failed to load tables'); } finally { setTableLoading(false); }
  }, []);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/restaurant/menu');
      const data = await res.json();
      if (data.success) setMenuItems(data.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchTables(); fetchMenu(); }, [fetchTables, fetchMenu]);

  // ── Table actions ─────────────────────────────────────────────────────────

  const openTableService = async (table: RestaurantTable) => {
    setSelectedTable(table);
    setSessionPartyName(table.partyName || '');
    setSessionPartySize(table.partySize || 1);
    if (table.status === 'occupied') {
      try {
        const res = await fetch(`/api/restaurant/tables/${table._id}/service`);
        const data = await res.json();
      if (data.success) { setSelectedTable(data.data.table); setTableOrder(data.data.order); }
      } catch { toast.error('Failed to load table data'); }
    }
    setServicePanel(true);
  };

  const handleOpenTable = async () => {
    if (!openingTable) return;
    setOpenLoading(true);
    try {
      const res = await fetch(`/api/restaurant/tables/${openingTable._id}/service`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open', partyName, partySize }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Table ${openingTable.tableNumber} opened`);
        setOpenTableDialog(false); setPartyName(''); setPartySize(1);
        fetchTables();
        setSelectedTable(data.data.table); setTableOrder(data.data.order); setServicePanel(true);
      } else { toast.error(data.error); }
    } catch { toast.error('Failed to open table'); } finally { setOpenLoading(false); }
  };

  const handleAddItems = async () => {
    if (!selectedTable || addingItems.filter(i => i.menuItemId).length === 0) return;
    setAddLoading(true);
    try {
      const res = await fetch(`/api/restaurant/tables/${selectedTable._id}/service`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_items', items: addingItems.filter(i => i.menuItemId) }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Items added'); setTableOrder(data.data); setAddingItems([]); }
      else toast.error(data.error);
    } catch { toast.error('Failed to add items'); } finally { setAddLoading(false); }
  };

  const handleUpdateSession = async () => {
    if (!selectedTable) return;
    setSessionLoading(true);
    try {
      const res = await fetch(`/api/restaurant/tables/${selectedTable._id}/service`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_session', partyName: sessionPartyName, partySize: sessionPartySize }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTable(data.data.table);
        toast.success('Table session updated');
        fetchTables();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to update table session');
    } finally {
      setSessionLoading(false);
    }
  };

  const handleMergeTable = async () => {
    if (!selectedTable || !mergeSourceTableId) return;
    if (mergeSourceTableId === selectedTable._id) {
      toast.error('Select a different table to merge from');
      return;
    }
    setMergeLoading(true);
    try {
      const res = await fetch(`/api/restaurant/tables/${selectedTable._id}/service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'merge', sourceTableId: mergeSourceTableId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Tables merged into one bill');
        setSelectedTable(data.data.table);
        setTableOrder(data.data.order);
        setMergeSourceTableId('');
        fetchTables();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to merge tables');
    } finally {
      setMergeLoading(false);
    }
  };

  const handleRemoveItem = async (menuItemId: string) => {
    if (!selectedTable) return;
    const res = await fetch(`/api/restaurant/tables/${selectedTable._id}/service`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_item', menuItemId }),
    });
    const data = await res.json();
    if (data.success) setTableOrder(data.data);
  };

  const handleUpdateQty = async (menuItemId: string, qty: number) => {
    if (!selectedTable) return;
    const res = await fetch(`/api/restaurant/tables/${selectedTable._id}/service`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_qty', menuItemId, quantity: qty }),
    });
    const data = await res.json();
    if (data.success) setTableOrder(data.data);
  };

  const handleCloseTable = async () => {
    if (!selectedTable) return;
    setCloseLoading(true);
    try {
      const res = await fetch(`/api/restaurant/tables/${selectedTable._id}/service`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          paymentMethod: closePayMethod,
          discount: closeDiscount,
          serviceCharge: closeServiceCharge,
          notes: closeNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Table ${selectedTable.tableNumber} closed`);
        if (data.data.order) printBill(data.data.table, data.data.order, data.data.bill);
        setServicePanel(false); setSelectedTable(null); setTableOrder(null); setCloseDiscount(0); setCloseServiceCharge(0); setCloseNotes(''); fetchTables();
      } else { toast.error(data.error); }
    } catch { toast.error('Failed to close table'); } finally { setCloseLoading(false); }
  };

  // ── Menu management ───────────────────────────────────────────────────────

  const saveMenuItem = async () => {
    try {
      const method = editingMenu ? 'PUT' : 'POST';
      const body = editingMenu ? { ...menuForm, id: editingMenu._id } : menuForm;
      const res = await fetch('/api/restaurant/menu', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingMenu ? 'Updated' : 'Added');
        fetchMenu(); setMenuDialog(false); setEditingMenu(null);
        setMenuForm({ name: '', category: 'main', price: 0, vegetarian: false, spiceLevel: 0, preparationTime: 30, available: true });
      } else { toast.error(data.error); }
    } catch { toast.error('Failed to save'); }
  };

  const deleteMenuItem = async (id: string) => {
    const res = await fetch(`/api/restaurant/menu?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('Deleted'); fetchMenu(); }
  };

  const handleAddTable = async () => {
    if (tables.length >= 50) { toast.error('Maximum 50 tables reached'); return; }
    try {
      const res = await fetch('/api/restaurant/tables', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber: newTableNum, capacity: newTableCap, location: newTableLoc }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Table added'); fetchTables(); setAddTableDialog(false); setNewTableNum(''); }
      else { toast.error(data.error); }
    } catch { toast.error('Failed to add table'); }
  };

  const openEditTableDialog = (table: RestaurantTable) => {
    setEditingTable(table);
    setEditTableForm({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      location: table.location,
      status: table.status,
    });
    setEditTableDialog(true);
  };

  const handleEditTable = async () => {
    if (!editingTable) return;
    try {
      const res = await fetch('/api/restaurant/tables', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingTable._id, ...editTableForm }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Table updated');
        setEditTableDialog(false);
        setEditingTable(null);
        fetchTables();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to update table');
    }
  };

  const handleDeleteTable = async (id?: string) => {
    const tableId = id || editingTable?._id;
    if (!tableId) return;
    if (!confirm('Delete this table? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/restaurant/tables?id=${tableId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Table deleted');
        setEditTableDialog(false);
        setEditingTable(null);
        fetchTables();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to delete table');
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const categories = ['all', ...Array.from(new Set(menuItems.map(m => m.category)))];
  const filteredMenu = menuItems.filter(m => {
    const matchCat = menuCategory === 'all' || m.category === menuCategory;
    return matchCat && m.name.toLowerCase().includes(menuSearch.toLowerCase());
  });
  const filteredMenu2 = menuItems.filter(m =>
    m.available && m.name.toLowerCase().includes(menuSearch2.toLowerCase())
  );

  const tableStatusColor = (s: string) => ({
    available: 'bg-green-100 border-green-400 text-green-900',
    occupied: 'bg-red-100 border-red-400 text-red-900',
    reserved: 'bg-yellow-100 border-yellow-400 text-yellow-900',
    maintenance: 'bg-gray-100 border-gray-400 text-gray-600',
  }[s] ?? 'bg-gray-100 border-gray-400 text-gray-600');

  const mergeCandidates = selectedTable
    ? tables.filter(
        (table) =>
          table.status === 'occupied' && table._id !== selectedTable._id
      )
    : [];

  const addItemQty = (menuItemId: string) =>
    addingItems.find(i => i.menuItemId === menuItemId)?.quantity || 0;

  const updateAddItem = (menuItemId: string, delta: number) => {
    const cur = addItemQty(menuItemId);
    const newQty = Math.max(0, cur + delta);
    if (newQty === 0) {
      setAddingItems(addingItems.filter(i => i.menuItemId !== menuItemId));
    } else {
      const exists = addingItems.find(i => i.menuItemId === menuItemId);
      if (exists) setAddingItems(addingItems.map(i => i.menuItemId === menuItemId ? { ...i, quantity: newQty } : i));
      else setAddingItems([...addingItems, { menuItemId, quantity: newQty }]);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="orders">Live Orders</TabsTrigger>
          <TabsTrigger value="history">Past Bills</TabsTrigger>
        </TabsList>

        {/* ══ TABLES ══════════════════════════════════════════════════════ */}
        <TabsContent value="tables" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-400 border border-green-600" />Available ({tables.filter(t => t.status === 'available').length})</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-400 border border-red-600" />Occupied ({tables.filter(t => t.status === 'occupied').length})</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-yellow-400 border border-yellow-600" />Reserved ({tables.filter(t => t.status === 'reserved').length})</span>
              <span className="text-muted-foreground">{tables.length}/50 tables</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchTables}><RefreshCw className="h-3.5 w-3.5" /></Button>
              <Button size="sm" onClick={() => setAddTableDialog(true)} disabled={tables.length >= 50}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />Add Table
              </Button>
            </div>
          </div>

          {tableLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading tables...</p>
          ) : (
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {tables.map(table => (
                <div key={table._id} className="relative">
                  <button
                    onClick={() => {
                      if (table.status === 'available') { setOpeningTable(table); setOpenTableDialog(true); }
                      else if (table.status === 'occupied') openTableService(table);
                    }}
                    className={`relative w-full rounded-lg border-2 p-2 text-center transition-all hover:scale-105 select-none ${tableStatusColor(table.status)} ${
                      table.status === 'maintenance' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    }`}
                  >
                    <div className="text-sm font-bold leading-tight">{table.tableNumber}</div>
                    <div className="text-[10px] text-muted-foreground">{table.capacity}p</div>
                    {table.status === 'occupied' && table.partyName && (
                      <div className="text-[9px] truncate font-medium">{table.partyName}</div>
                    )}
                  </button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute right-1 top-1 h-6 px-2 text-[10px]"
                    onClick={() => openEditTableDialog(table)}
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ══ MENU ════════════════════════════════════════════════════════ */}
        <TabsContent value="menu" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input className="pl-8 w-44 h-8 text-sm" placeholder="Search..." value={menuSearch} onChange={e => setMenuSearch(e.target.value)} />
              </div>
              <Select value={menuCategory} onValueChange={setMenuCategory}>
                <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c === 'all' ? 'All' : c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={() => { setEditingMenu(null); setMenuForm({ name: '', category: 'main', price: 0, vegetarian: false, spiceLevel: 0, preparationTime: 30, available: true }); setMenuDialog(true); }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />Add Item
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMenu.map(item => (
              <div key={item._id} className={`rounded-lg border p-3 text-sm space-y-2 ${!item.available ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                  </div>
                  <p className="font-bold">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {item.vegetarian && <span className="text-green-600 font-medium">🌿 Veg</span>}
                  {item.spiceLevel > 0 && <span>{'🌶'.repeat(Math.min(item.spiceLevel, 5))}</span>}
                  <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{item.preparationTime}m</span>
                  <span className={item.available ? 'text-green-600' : 'text-red-500'}>{item.available ? '✓ Available' : '✗ Unavailable'}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-6 text-xs flex-1"
                    onClick={() => { setEditingMenu(item); setMenuForm({ name: item.name, category: item.category, price: item.price, vegetarian: item.vegetarian, spiceLevel: item.spiceLevel, preparationTime: item.preparationTime, available: item.available }); setMenuDialog(true); }}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-red-500" onClick={() => deleteMenuItem(item._id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ══ LIVE ORDERS ═══════════════════════════════════════════════ */}
        <TabsContent value="orders"><LiveOrders /></TabsContent>

        {/* ══ BILL HISTORY ══════════════════════════════════════════════ */}
        <TabsContent value="history"><BillHistory /></TabsContent>
      </Tabs>

      {/* ── Open Table Dialog ────────────────────────────────────────── */}
      <Dialog open={openTableDialog} onOpenChange={setOpenTableDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Open Table {openingTable?.tableNumber}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Party / Guest Name *</Label><Input value={partyName} onChange={e => setPartyName(e.target.value)} placeholder="e.g. Smith Family" /></div>
            <div className="space-y-2">
              <Label>Party Size (max {openingTable?.capacity})</Label>
              <Input type="number" min={1} max={openingTable?.capacity || 50} value={partySize} onChange={e => setPartySize(parseInt(e.target.value) || 1)} />
            </div>
            <Button className="w-full" onClick={handleOpenTable} disabled={openLoading || !partyName.trim()}>
              {openLoading ? 'Opening...' : 'Open Table for Service'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Table Dialog ─────────────────────────────────────────── */}
      <Dialog open={addTableDialog} onOpenChange={setAddTableDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Table ({tables.length}/50)</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2"><Label>Table Number *</Label><Input value={newTableNum} onChange={e => setNewTableNum(e.target.value)} placeholder="e.g. 01, A1, VIP-1" /></div>
            <div className="space-y-2"><Label>Capacity *</Label><Input type="number" min={1} value={newTableCap} onChange={e => setNewTableCap(parseInt(e.target.value) || 1)} /></div>
            <div className="space-y-2"><Label>Location</Label>
              <Select value={newTableLoc} onValueChange={setNewTableLoc}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="indoor">Indoor</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                  <SelectItem value="private">Private Room</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAddTable} disabled={!newTableNum.trim()}>Add Table</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editTableDialog} onOpenChange={setEditTableDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Table {editingTable?.tableNumber}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2"><Label>Table Number *</Label><Input value={editTableForm.tableNumber} onChange={e => setEditTableForm(f => ({ ...f, tableNumber: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Capacity *</Label><Input type="number" min={1} max={50} value={editTableForm.capacity} onChange={e => setEditTableForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Location</Label>
                <Select value={editTableForm.location} onValueChange={v => setEditTableForm(f => ({ ...f, location: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indoor">Indoor</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                    <SelectItem value="private">Private Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={editTableForm.status} onValueChange={(v: EditableTableForm['status']) => setEditTableForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1 text-red-600 hover:bg-red-50" onClick={() => handleDeleteTable()}>
                Delete Table
              </Button>
              <Button className="flex-1" onClick={handleEditTable} disabled={!editTableForm.tableNumber.trim()}>
                Save Table Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Menu Item Dialog ─────────────────────────────────────────── */}
      <Dialog open={menuDialog} onOpenChange={setMenuDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingMenu ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={menuForm.name} onChange={e => setMenuForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Category</Label>
                <Select value={menuForm.category} onValueChange={v => setMenuForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['appetizer', 'main', 'dessert', 'beverage', 'special'].map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Price ($)</Label><Input type="number" min={0} step={0.01} value={menuForm.price} onChange={e => setMenuForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-2"><Label>Prep Time (min)</Label><Input type="number" min={1} value={menuForm.preparationTime} onChange={e => setMenuForm(f => ({ ...f, preparationTime: parseInt(e.target.value) || 15 }))} /></div>
              <div className="space-y-2"><Label>Spice Level (0–5)</Label><Input type="number" min={0} max={5} value={menuForm.spiceLevel} onChange={e => setMenuForm(f => ({ ...f, spiceLevel: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={menuForm.vegetarian} onChange={e => setMenuForm(f => ({ ...f, vegetarian: e.target.checked }))} className="h-4 w-4" />Vegetarian</label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={menuForm.available} onChange={e => setMenuForm(f => ({ ...f, available: e.target.checked }))} className="h-4 w-4" />Available</label>
            </div>
            <Button className="w-full" onClick={saveMenuItem} disabled={!menuForm.name.trim()}>{editingMenu ? 'Save Changes' : 'Add to Menu'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Table Service Panel (slide-in) ───────────────────────────── */}
      {servicePanel && selectedTable && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setServicePanel(false)} />
          <div className="relative bg-background w-full sm:w-[500px] h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-lg">Table {selectedTable.tableNumber}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedTable.partyName || 'Guest'} · {selectedTable.partySize || 1} pax · {selectedTable.location}
                </p>
                {selectedTable.openedAt && (
                  <p className="text-xs text-muted-foreground">Opened: {format(new Date(selectedTable.openedAt), 'HH:mm')}</p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setServicePanel(false)}><XCircle className="h-5 w-5" /></Button>
            </div>

            <div className="flex-1 p-4 space-y-5">
              {/* Current Bill */}
              {tableOrder && tableOrder.items.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4 text-orange-500" />Current Order
                  </h3>
                  {tableOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
                      <span className="flex-1 font-medium">{item.itemName}</span>
                      <span className="text-muted-foreground text-xs">${item.price.toFixed(2)}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleUpdateQty(item.menuItemId, item.quantity - 1)} className="text-muted-foreground hover:text-red-500">
                          <MinusCircle className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center font-bold">{item.quantity}</span>
                        <button onClick={() => handleUpdateQty(item.menuItemId, item.quantity + 1)} className="text-muted-foreground hover:text-green-600">
                          <PlusCircle className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="font-semibold w-14 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                      <button onClick={() => handleRemoveItem(item.menuItemId)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${tableOrder.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Tax (5%)</span><span>${tableOrder.tax.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>${tableOrder.total.toFixed(2)}</span></div>
                  </div>
                </div>
              )}

              <div className="space-y-3 rounded-lg border p-3">
                <h3 className="font-semibold text-sm">Active Table Session</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Guest / Team Name</Label>
                    <Input value={sessionPartyName} onChange={e => setSessionPartyName(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Party Size</Label>
                    <Input type="number" min={1} max={selectedTable.capacity} value={sessionPartySize} onChange={e => setSessionPartySize(parseInt(e.target.value) || 1)} className="h-8 text-sm" />
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleUpdateSession} disabled={sessionLoading || !sessionPartyName.trim()}>
                  {sessionLoading ? 'Saving...' : 'Update Table Details'}
                </Button>
              </div>

              {mergeCandidates.length > 0 && (
                <div className="space-y-3 rounded-lg border p-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2"><PlusCircle className="h-4 w-4 text-blue-500" />Merge Another Table</h3>
                  <div className="space-y-2">
                    <Label className="text-xs">Source Table</Label>
                    <Select value={mergeSourceTableId} onValueChange={setMergeSourceTableId}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Choose occupied table" /></SelectTrigger>
                      <SelectContent>
                        {mergeCandidates.map((table) => (
                          <SelectItem key={table._id} value={table._id}>
                            {table.tableNumber} · {table.partyName || 'Guest'} · {table.partySize || 1} pax
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={handleMergeTable} disabled={!mergeSourceTableId || mergeLoading}>
                    {mergeLoading ? 'Merging...' : 'Merge Into This Table'}
                  </Button>
                </div>
              )}

              {/* Add items to order */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2"><Plus className="h-4 w-4 text-blue-500" />Add Items</h3>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="pl-8 text-sm" placeholder="Search menu..." value={menuSearch2} onChange={e => setMenuSearch2(e.target.value)} />
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {filteredMenu2.map(item => {
                    const qty = addItemQty(item._id);
                    return (
                      <div key={item._id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{item.name}</span>
                          <span className="ml-1.5 text-xs text-muted-foreground capitalize">({item.category})</span>
                          {item.vegetarian && <span className="ml-1 text-xs text-green-600">🌿</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold text-xs">${item.price.toFixed(2)}</span>
                          <button onClick={() => updateAddItem(item._id, -1)} disabled={qty === 0} className="text-muted-foreground hover:text-red-500 disabled:opacity-30">
                            <MinusCircle className="h-4 w-4" />
                          </button>
                          <span className="w-5 text-center text-sm font-bold">{qty || ''}</span>
                          <button onClick={() => updateAddItem(item._id, 1)} className="text-primary hover:opacity-80">
                            <PlusCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {addingItems.filter(i => i.menuItemId).length > 0 && (
                  <Button size="sm" className="w-full" onClick={handleAddItems} disabled={addLoading}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    {addLoading ? 'Adding...' : `Add ${addingItems.reduce((s, i) => s + i.quantity, 0)} item(s)`}
                  </Button>
                )}
              </div>

              {/* Close table */}
              {tableOrder && tableOrder.items.length > 0 && (
                <div className="space-y-3 rounded-lg border p-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Close Table & Settle Bill</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Discount ($)</Label><Input type="number" min={0} step={0.01} value={closeDiscount} onChange={e => setCloseDiscount(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
                    <div className="space-y-1"><Label className="text-xs">Service Charge ($)</Label><Input type="number" min={0} step={0.01} value={closeServiceCharge} onChange={e => setCloseServiceCharge(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
                    <div className="space-y-1"><Label className="text-xs">Payment Method</Label>
                      <Select value={closePayMethod} onValueChange={setClosePayMethod}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="wallet">Wallet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 col-span-2"><Label className="text-xs">Bill Notes</Label><Input value={closeNotes} onChange={e => setCloseNotes(e.target.value)} className="h-8 text-sm" placeholder="Optional note for bill / QR lookup" /></div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => selectedTable && tableOrder && printBill(
                      selectedTable,
                      {
                        ...tableOrder,
                        discount: closeDiscount,
                        total: tableOrder.subtotal + tableOrder.tax + closeServiceCharge - closeDiscount,
                      },
                      {
                        _id: 'preview',
                        billNumber: 'PREVIEW',
                        subtotal: tableOrder.subtotal,
                        tax: tableOrder.tax,
                        serviceCharge: closeServiceCharge,
                        discount: closeDiscount,
                        totalAmount: tableOrder.subtotal + tableOrder.tax + closeServiceCharge - closeDiscount,
                        paymentStatus: 'preview',
                      }
                    )}>
                      <Printer className="mr-1 h-3.5 w-3.5" /><QrCode className="mr-1 h-3.5 w-3.5" />Preview Bill
                    </Button>
                    <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleCloseTable} disabled={closeLoading}>
                      {closeLoading ? 'Closing...' : 'Close & Print Bill'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Live Orders ───────────────────────────────────────────────────────────────

function LiveOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/restaurant/orders');
      const data = await res.json();
      if (data.success) setOrders(data.data.filter((o: any) => !['completed', 'cancelled'].includes(o.status)));
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch('/api/restaurant/orders', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    if (data.success) fetchOrders();
  };

  if (loading) return <p className="text-center text-muted-foreground py-8">Loading...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">{orders.length} active orders</p>
        <Button variant="outline" size="sm" onClick={fetchOrders}><RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh</Button>
      </div>
      {orders.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">No active orders</p>
      ) : orders.map(order => (
        <div key={order._id} className="rounded-lg border p-3 text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">
              {order.orderType === 'room-service' ? '🛏 Room Service' : '🍽 Dine-in'}
              {order.partyName && ` · ${order.partyName}`}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
              order.status === 'ready' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-600'
            }`}>{order.status}</span>
          </div>
          <div className="text-muted-foreground space-y-0.5">
            {order.items?.map((i: any, idx: number) => (
              <div key={idx}>· {i.itemName || 'Item'} × {i.quantity}</div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-semibold">${order.total?.toFixed(2)}</span>
            <div className="flex gap-1">
              {order.status === 'pending' && <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => updateStatus(order._id, 'preparing')}>Start</Button>}
              {order.status === 'preparing' && <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => updateStatus(order._id, 'ready')}><ChefHat className="h-3 w-3 mr-1" />Ready</Button>}
              {order.status === 'ready' && <Button size="sm" className="h-6 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateStatus(order._id, 'served')}>Served</Button>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BillHistory() {
  const [bills, setBills] = useState<RestaurantBill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/restaurant/bills?limit=100');
      const data = await res.json();
      if (data.success) setBills(data.data);
    } catch {
      toast.error('Failed to load bill history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  if (loading) return <p className="text-center text-muted-foreground py-8">Loading bill history...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">{bills.length} settled bills</p>
        <Button variant="outline" size="sm" onClick={fetchBills}><RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh</Button>
      </div>

      {bills.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">No past bills yet</p>
      ) : (
        bills.map((bill) => (
          <div key={bill._id} className="rounded-lg border p-3 text-sm space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{bill.billNumber}</p>
                <p className="text-muted-foreground">
                  Table {bill.tableNumber || '-'} · {bill.partyName || 'Guest'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bill.billDate ? format(new Date(bill.billDate), 'MMM dd yyyy, HH:mm') : '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">${bill.totalAmount.toFixed(2)}</p>
                <p className="text-xs text-green-600 uppercase">{bill.paymentStatus}</p>
              </div>
            </div>

            <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <p>Subtotal: ${bill.subtotal.toFixed(2)}</p>
              <p>Tax: ${bill.tax.toFixed(2)}</p>
              <p>Discount: ${bill.discount.toFixed(2)}</p>
              <p>Service: ${(bill.serviceCharge || 0).toFixed(2)}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => window.open(`/bills/${bill.billNumber}`, '_blank')}
              >
                <QrCode className="h-3.5 w-3.5 mr-1" />Open Bill
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
