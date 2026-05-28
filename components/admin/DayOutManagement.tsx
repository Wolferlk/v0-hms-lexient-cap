'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Plus, Trash2, Edit, Search, RefreshCw, Printer, QrCode,
  DollarSign, CheckCircle, XCircle, Eye, Anchor, Package,
  Users, Calendar, Clock, Star,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DayOutPackage {
  _id: string; name: string; description: string; price: number;
  capacity: number; duration: number; maxGroupSize: number; minGroupSize: number;
  pricePerPerson: number; discountPercentage: number;
  activities: string[]; inclusions: string[]; amenities: string[];
}

interface BoatPackage {
  _id: string; name: string; description: string; boatType: string;
  capacity: number; price: number; pricePerPerson: number; duration: number;
  departureTime: string; routeDescription: string; safetyRating: number;
  mealIncluded: boolean; lifeJacketsProvided: boolean;
}

interface Payment { amount: number; method: string; date: string; notes: string; }
interface AdditionalItem { name: string; quantity: number; unitPrice: number; total: number; }

interface GroupBooking {
  _id: string;
  packageId: { _id: string; name: string; price: number; pricePerPerson: number } | null;
  groupName: string; bookingDate: string; numberOfPeople: number;
  totalAmount: number; totalPrice: number; depositAmount: number;
  balanceAmount: number; advancePaid: number; paymentStatus: string; status: string;
  specialRequests: string; notes: string;
  payments: Payment[]; additionalItems: AdditionalItem[];
  contactPerson: { name: string; phone: string; email: string };
}

interface BoatBooking {
  _id: string;
  packageId: { _id: string; name: string; boatType: string; capacity: number; pricePerPerson: number } | null;
  bookingDate: string; departureTime: string; numberOfPassengers: number;
  totalAmount: number; totalPrice: number; depositAmount: number;
  balanceAmount: number; advancePaid: number; paymentStatus: string; status: string;
  specialRequests: string; notes: string;
  payments: Payment[]; additionalItems: AdditionalItem[];
  contactPerson: { name: string; phone: string; email: string };
}

type AnyBooking = GroupBooking | BoatBooking;

// ── Print ─────────────────────────────────────────────────────────────────────

function printBill(b: AnyBooking, type: 'group' | 'boat', hotel = 'Lexient Hotel') {
  const qrUrl = `${window.location.origin}/day-out-bill/${b._id}`;
  const title = type === 'group' ? (b as GroupBooking).groupName : (b as BoatBooking).packageId?.name || 'Boat Ride';
  const people = type === 'group' ? (b as GroupBooking).numberOfPeople : (b as BoatBooking).numberOfPassengers;
  const totalAmount = b.totalAmount ?? 0;
  const advancePaid = b.advancePaid ?? 0;
  const balance = totalAmount - advancePaid;
  const html = `<!DOCTYPE html><html><head><title>Day-out Bill</title>
  <style>
    body{font-family:'Courier New',monospace;font-size:11px;width:300px;margin:0 auto;padding:8px}
    h2{text-align:center;font-size:15px;margin:0} .c{text-align:center}
    hr{border:none;border-top:1px dashed #000;margin:6px 0}
    table{width:100%;border-collapse:collapse} td{padding:2px 0} .r{text-align:right}
    .tb td{font-weight:bold;font-size:13px} img.qr{display:block;margin:8px auto;width:110px}
    @media print{body{margin:0}}
  </style></head><body>
  <h2>${hotel}</h2><p class="c">Day-out Bill</p><hr/>
  <p><b>${title}</b></p>
  <p>Date: <b>${format(new Date(b.bookingDate), 'dd MMM yyyy')}</b></p>
  ${type === 'boat' ? `<p>Departure: ${(b as BoatBooking).departureTime}</p>` : ''}
  <p>People: ${people} · Status: <b>${b.status.toUpperCase()}</b></p>
  <hr/>
  <table>
    <tr><td>Package</td><td class="r">Rs.${(b.totalPrice ?? 0).toFixed(2)}</td></tr>
    ${(b.additionalItems ?? []).map(i => `<tr><td>${i.name} ×${i.quantity}</td><td class="r">Rs.${(i.total ?? 0).toFixed(2)}</td></tr>`).join('')}
  </table><hr/>
  <table>
    <tr class="tb"><td>TOTAL</td><td class="r">Rs.${totalAmount.toFixed(2)}</td></tr>
    <tr><td>Paid</td><td class="r">Rs.${advancePaid.toFixed(2)}</td></tr>
    <tr class="tb"><td>BALANCE DUE</td><td class="r">Rs.${balance.toFixed(2)}</td></tr>
  </table><hr/>
  ${(b.payments ?? []).length > 0 ? `<p><b>Payments:</b></p>${b.payments.map(p => `<p>${p.method} — Rs.${p.amount} (${format(new Date(p.date), 'MMM dd')})</p>`).join('')}<hr/>` : ''}
  <p class="c" style="font-size:10px">Scan QR to view bill online</p>
  <img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(qrUrl)}" />
  <p class="c" style="font-size:9px">Thank you for choosing ${hotel}!</p>
  </body></html>`;
  const w = window.open('', '_blank', 'width=420,height=640');
  if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
}

// ── Badge ─────────────────────────────────────────────────────────────────────

const badge = (s: string) => ({
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-500',
  partial: 'bg-orange-100 text-orange-700',
  paid: 'bg-emerald-100 text-emerald-700',
}[s] ?? 'bg-gray-100 text-gray-600');

// ── Component ─────────────────────────────────────────────────────────────────

export default function DayOutManagement() {
  const [activeTab, setActiveTab] = useState('groupBookings');
  const [loading, setLoading] = useState(true);

  const [dayOutPackages, setDayOutPackages] = useState<DayOutPackage[]>([]);
  const [boatPackages, setBoatPackages] = useState<BoatPackage[]>([]);
  const [groupBookings, setGroupBookings] = useState<GroupBooking[]>([]);
  const [boatBookings, setBoatBookings] = useState<BoatBooking[]>([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ── Package dialogs ──────────────────────────────────────────────────────────
  const [pkgDialog, setPkgDialog] = useState(false);
  const [editingPkg, setEditingPkg] = useState<DayOutPackage | null>(null);
  const [pkgForm, setPkgForm] = useState({
    name: '', description: '', price: 0, capacity: 100, duration: 8,
    maxGroupSize: 50, minGroupSize: 10, pricePerPerson: 0, discountPercentage: 0,
    activities: [] as string[], inclusions: [] as string[], amenities: [] as string[],
  });

  const [boatPkgDialog, setBoatPkgDialog] = useState(false);
  const [editingBoatPkg, setEditingBoatPkg] = useState<BoatPackage | null>(null);
  const [boatPkgForm, setBoatPkgForm] = useState({
    name: '', description: '', boatType: 'speed_boat', capacity: 10,
    price: 0, pricePerPerson: 0, duration: 60, departureTime: '',
    routeDescription: '', safetyRating: 5, mealIncluded: false, lifeJacketsProvided: true,
  });

  // ── Booking create dialogs ───────────────────────────────────────────────────
  const [createGroupDialog, setCreateGroupDialog] = useState(false);
  const [createBoatDialog, setCreateBoatDialog] = useState(false);
  const [groupForm, setGroupForm] = useState({
    packageId: '', groupName: '', bookingDate: '', numberOfPeople: 10,
    contactName: '', contactPhone: '', contactEmail: '',
    specialRequests: '', advanceAmount: 0, paymentMethod: 'cash',
  });
  const [boatForm, setBoatForm] = useState({
    packageId: '', bookingDate: '', departureTime: '', numberOfPassengers: 1,
    contactName: '', contactPhone: '', contactEmail: '',
    specialRequests: '', advanceAmount: 0, paymentMethod: 'cash',
  });

  // ── Detail panel ─────────────────────────────────────────────────────────────
  const [selectedBooking, setSelectedBooking] = useState<AnyBooking | null>(null);
  const [selectedType, setSelectedType] = useState<'group' | 'boat'>('group');
  const [detailPanel, setDetailPanel] = useState(false);

  // ── Payment dialog ───────────────────────────────────────────────────────────
  const [payDialog, setPayDialog] = useState(false);
  const [payAction, setPayAction] = useState<'pay' | 'close'>('pay');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNotes, setPayNotes] = useState('');

  // ── Item dialog ──────────────────────────────────────────────────────────────
  const [itemDialog, setItemDialog] = useState(false);
  const [itemForm, setItemForm] = useState({ name: '', quantity: 1, unitPrice: 0 });
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);

  // ── Edit booking ─────────────────────────────────────────────────────────────
  const [editBookingDialog, setEditBookingDialog] = useState(false);
  const [editBookingForm, setEditBookingForm] = useState({
    groupName: '', bookingDate: '', specialRequests: '', notes: '',
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, gr, bpr, bbr] = await Promise.all([
        fetch('/api/day-out/packages'),
        fetch('/api/day-out/group-bookings'),
        fetch('/api/day-out/boat-rides/packages'),
        fetch('/api/day-out/boat-rides/bookings'),
      ]);
      const [p, g, bp, bb] = await Promise.all([pr.json(), gr.json(), bpr.json(), bbr.json()]);
      if (p.success) setDayOutPackages(p.data);
      if (g.success) setGroupBookings(g.data);
      if (bp.success) setBoatPackages(bp.data);
      if (bb.success) setBoatBookings(bb.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── API helpers ───────────────────────────────────────────────────────────────
  const endpoint = (type: 'group' | 'boat') =>
    type === 'group' ? '/api/day-out/group-bookings' : '/api/day-out/boat-rides/bookings';

  const putBooking = async (id: string, type: 'group' | 'boat', body: object) => {
    const res = await fetch(endpoint(type), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...body }),
    });
    return res.json();
  };

  // ── Package CRUD ──────────────────────────────────────────────────────────────
  const saveDayOutPackage = async () => {
    try {
      const method = editingPkg ? 'PUT' : 'POST';
      const body = editingPkg ? { id: editingPkg._id, ...pkgForm } : pkgForm;
      const res = await fetch('/api/day-out/packages', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { toast.success(editingPkg ? 'Package updated' : 'Package created'); setPkgDialog(false); fetchAll(); }
      else toast.error(data.error);
    } catch { toast.error('Failed to save package'); }
  };

  const deleteDayOutPackage = async (id: string) => {
    if (!confirm('Delete this package?')) return;
    const res = await fetch(`/api/day-out/packages?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('Package deleted'); fetchAll(); }
    else toast.error(data.error);
  };

  const saveBoatPackage = async () => {
    try {
      const method = editingBoatPkg ? 'PUT' : 'POST';
      const body = editingBoatPkg ? { id: editingBoatPkg._id, ...boatPkgForm } : boatPkgForm;
      const res = await fetch('/api/day-out/boat-rides/packages', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { toast.success(editingBoatPkg ? 'Boat package updated' : 'Boat package created'); setBoatPkgDialog(false); fetchAll(); }
      else toast.error(data.error);
    } catch { toast.error('Failed to save boat package'); }
  };

  const deleteBoatPackage = async (id: string) => {
    if (!confirm('Delete this boat package?')) return;
    const res = await fetch(`/api/day-out/boat-rides/packages?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('Boat package deleted'); fetchAll(); }
    else toast.error(data.error);
  };

  // ── Create bookings ───────────────────────────────────────────────────────────
  const createGroupBooking = async () => {
    if (!groupForm.packageId || !groupForm.groupName || !groupForm.bookingDate) {
      toast.error('Package, group name and date are required'); return;
    }
    try {
      const res = await fetch('/api/day-out/group-bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: groupForm.packageId, groupName: groupForm.groupName,
          bookingDate: groupForm.bookingDate, numberOfPeople: groupForm.numberOfPeople,
          contactPerson: { name: groupForm.contactName, phone: groupForm.contactPhone, email: groupForm.contactEmail },
          specialRequests: groupForm.specialRequests,
          advanceAmount: groupForm.advanceAmount, paymentMethod: groupForm.paymentMethod,
        }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Group booking created'); setCreateGroupDialog(false); fetchAll(); }
      else toast.error(data.error);
    } catch { toast.error('Failed to create booking'); }
  };

  const createBoatBooking = async () => {
    if (!boatForm.packageId || !boatForm.bookingDate || !boatForm.departureTime) {
      toast.error('Package, date and departure time are required'); return;
    }
    try {
      const res = await fetch('/api/day-out/boat-rides/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: boatForm.packageId, bookingDate: boatForm.bookingDate,
          departureTime: boatForm.departureTime, numberOfPassengers: boatForm.numberOfPassengers,
          contactPerson: { name: boatForm.contactName, phone: boatForm.contactPhone, email: boatForm.contactEmail },
          specialRequests: boatForm.specialRequests,
          advanceAmount: boatForm.advanceAmount, paymentMethod: boatForm.paymentMethod,
        }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Boat booking created'); setCreateBoatDialog(false); fetchAll(); }
      else toast.error(data.error);
    } catch { toast.error('Failed to create boat booking'); }
  };

  // ── Booking actions ───────────────────────────────────────────────────────────
  const handlePayment = async () => {
    if (!selectedBooking) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { toast.error('Enter valid amount'); return; }
    const data = await putBooking(selectedBooking._id, selectedType, {
      action: payAction, amount, method: payMethod, notes: payNotes,
    });
    if (data.success) {
      toast.success(payAction === 'close' ? 'Booking closed!' : 'Payment recorded');
      setPayDialog(false); setSelectedBooking(data.data); fetchAll();
    } else toast.error(data.error);
  };

  const handleCancelBooking = async (id: string, type: 'group' | 'boat') => {
    if (!confirm('Cancel this booking?')) return;
    const data = await putBooking(id, type, { action: 'cancel' });
    if (data.success) {
      toast.success('Booking cancelled'); fetchAll();
      if (selectedBooking?._id === id) setSelectedBooking(data.data);
    } else toast.error(data.error);
  };

  const handleDeleteBooking = async (id: string, type: 'group' | 'boat') => {
    if (!confirm('Permanently delete this booking?')) return;
    const res = await fetch(`${endpoint(type)}?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      toast.success('Booking deleted'); fetchAll();
      if (selectedBooking?._id === id) setDetailPanel(false);
    } else toast.error(data.error);
  };

  const handleSaveItem = async () => {
    if (!selectedBooking) return;
    const isEdit = editingItemIdx !== null;
    const data = await putBooking(selectedBooking._id, selectedType,
      isEdit
        ? { action: 'edit_item', itemIndex: editingItemIdx, itemUpdate: itemForm }
        : { action: 'add_items', additionalItems: [itemForm] }
    );
    if (data.success) {
      toast.success(isEdit ? 'Item updated' : 'Item added');
      setItemDialog(false); setSelectedBooking(data.data); fetchAll();
    } else toast.error(data.error);
  };

  const handleDeleteItem = async (idx: number) => {
    if (!selectedBooking) return;
    const data = await putBooking(selectedBooking._id, selectedType, { action: 'delete_item', itemIndex: idx });
    if (data.success) { toast.success('Item removed'); setSelectedBooking(data.data); fetchAll(); }
    else toast.error(data.error);
  };

  const handleSaveBookingEdit = async () => {
    if (!selectedBooking) return;
    const data = await putBooking(selectedBooking._id, selectedType, editBookingForm);
    if (data.success) { toast.success('Booking updated'); setEditBookingDialog(false); setSelectedBooking(data.data); fetchAll(); }
    else toast.error(data.error);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Group Bookings', value: groupBookings.length, sub: `${groupBookings.filter(b => b.status === 'confirmed').length} confirmed`, color: 'text-blue-600' },
    { label: 'Boat Bookings', value: boatBookings.length, sub: `${boatBookings.filter(b => b.status === 'confirmed').length} confirmed`, color: 'text-cyan-600' },
    { label: 'Day-out Revenue', value: `Rs.${groupBookings.reduce((s, b) => s + (b.advancePaid ?? 0), 0).toLocaleString()}`, sub: 'collected', color: 'text-green-600' },
    { label: 'Boat Revenue', value: `Rs.${boatBookings.reduce((s, b) => s + (b.advancePaid ?? 0), 0).toLocaleString()}`, sub: 'collected', color: 'text-emerald-600' },
  ];

  // ── Filters ───────────────────────────────────────────────────────────────────
  const filteredGroup = groupBookings.filter(b => {
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const q = search.toLowerCase();
    return matchStatus && (b.groupName.toLowerCase().includes(q) || b.contactPerson?.name?.toLowerCase().includes(q) || b.packageId?.name?.toLowerCase().includes(q));
  });

  const filteredBoat = boatBookings.filter(b => {
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const q = search.toLowerCase();
    return matchStatus && (b.packageId?.name?.toLowerCase().includes(q) || b.contactPerson?.name?.toLowerCase().includes(q));
  });

  // ── Open helpers ──────────────────────────────────────────────────────────────
  const openDetail = (b: AnyBooking, type: 'group' | 'boat') => {
    setSelectedBooking(b); setSelectedType(type); setDetailPanel(true);
  };

  const openPay = (b: AnyBooking, type: 'group' | 'boat', action: 'pay' | 'close') => {
    setSelectedBooking(b); setSelectedType(type); setPayAction(action);
    setPayAmount(action === 'close' ? String(Math.max(0, (b.totalAmount ?? 0) - (b.advancePaid ?? 0))) : '');
    setPayMethod('cash'); setPayNotes(''); setPayDialog(true);
  };

  // ── Booking list row ──────────────────────────────────────────────────────────
  const BookingRow = ({ b, type }: { b: AnyBooking; type: 'group' | 'boat' }) => {
    const isGroup = type === 'group';
    const gb = b as GroupBooking;
    const bb = b as BoatBooking;
    return (
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{isGroup ? gb.groupName : (bb.packageId?.name || 'Boat Ride')}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge(b.status)}`}>{b.status}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge(b.paymentStatus)}`}>{b.paymentStatus}</span>
            </div>
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(b.bookingDate), 'MMM dd, yyyy')}</span>
              {!isGroup && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{bb.departureTime}</span>}
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{isGroup ? gb.numberOfPeople : bb.numberOfPassengers} {isGroup ? 'people' : 'passengers'}</span>
              {isGroup && gb.packageId && <span>{gb.packageId.name}</span>}
              {b.contactPerson?.name && <span>{b.contactPerson.name}</span>}
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">Rs.{(b.totalAmount ?? 0).toLocaleString()}</p>
            <p className="text-xs text-green-600">Paid: Rs.{(b.advancePaid ?? 0).toLocaleString()}</p>
            {(b.balanceAmount ?? 0) > 0 && <p className="text-xs text-red-500">Due: Rs.{(b.balanceAmount ?? 0).toLocaleString()}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openDetail(b, type)}>
            <Eye className="h-3 w-3 mr-1" />View
          </Button>
          {!['cancelled', 'completed'].includes(b.status) && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openPay(b, type, 'pay')}>
              <DollarSign className="h-3 w-3 mr-1" />Payment
            </Button>
          )}
          {b.status === 'confirmed' && (
            <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => openPay(b, type, 'close')}>
              <CheckCircle className="h-3 w-3 mr-1" />Close
            </Button>
          )}
          {b.status === 'completed' && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => printBill(b, type)}>
              <Printer className="h-3 w-3 mr-1" /><QrCode className="h-3 w-3 mr-1" />Print
            </Button>
          )}
          {!['completed', 'cancelled'].includes(b.status) && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-orange-500" onClick={() => handleCancelBooking(b._id, type)}>
              <XCircle className="h-3 w-3 mr-1" />Cancel
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600" onClick={() => handleDeleteBooking(b._id, type)}>
            <Trash2 className="h-3 w-3 mr-1" />Delete
          </Button>
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setSearch(''); setStatusFilter('all'); }}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="groupBookings"><Users className="mr-1.5 h-3.5 w-3.5" />Group</TabsTrigger>
          <TabsTrigger value="boatBookings"><Anchor className="mr-1.5 h-3.5 w-3.5" />Boat</TabsTrigger>
          <TabsTrigger value="packages"><Package className="mr-1.5 h-3.5 w-3.5" />Day-out Pkgs</TabsTrigger>
          <TabsTrigger value="boatPackages"><Anchor className="mr-1.5 h-3.5 w-3.5" />Boat Pkgs</TabsTrigger>
        </TabsList>

        {/* ══ GROUP BOOKINGS ════════════════════════════════════════════ */}
        <TabsContent value="groupBookings" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input className="pl-8 w-44 h-8 text-sm" placeholder="Search group..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['all','pending','confirmed','completed','cancelled'].map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="h-3.5 w-3.5" /></Button>
              <Button size="sm" onClick={() => { setGroupForm({ packageId: '', groupName: '', bookingDate: '', numberOfPeople: 10, contactName: '', contactPhone: '', contactEmail: '', specialRequests: '', advanceAmount: 0, paymentMethod: 'cash' }); setCreateGroupDialog(true); }}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />New Booking
              </Button>
            </div>
          </div>
          {loading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : (
            <div className="space-y-3">
              {filteredGroup.length === 0 && <p className="text-center py-8 text-muted-foreground">No group bookings found</p>}
              {filteredGroup.map(b => <BookingRow key={b._id} b={b} type="group" />)}
            </div>
          )}
        </TabsContent>

        {/* ══ BOAT BOOKINGS ═════════════════════════════════════════════ */}
        <TabsContent value="boatBookings" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input className="pl-8 w-44 h-8 text-sm" placeholder="Search boat..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['all','pending','confirmed','completed','cancelled'].map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="h-3.5 w-3.5" /></Button>
              <Button size="sm" onClick={() => { setBoatForm({ packageId: '', bookingDate: '', departureTime: '', numberOfPassengers: 1, contactName: '', contactPhone: '', contactEmail: '', specialRequests: '', advanceAmount: 0, paymentMethod: 'cash' }); setCreateBoatDialog(true); }}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />New Booking
              </Button>
            </div>
          </div>
          {loading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : (
            <div className="space-y-3">
              {filteredBoat.length === 0 && <p className="text-center py-8 text-muted-foreground">No boat bookings found</p>}
              {filteredBoat.map(b => <BookingRow key={b._id} b={b} type="boat" />)}
            </div>
          )}
        </TabsContent>

        {/* ══ DAY-OUT PACKAGES ══════════════════════════════════════════ */}
        <TabsContent value="packages" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="h-3.5 w-3.5" /></Button>
            <Button size="sm" onClick={() => { setEditingPkg(null); setPkgForm({ name: '', description: '', price: 0, capacity: 100, duration: 8, maxGroupSize: 50, minGroupSize: 10, pricePerPerson: 0, discountPercentage: 0, activities: [], inclusions: [], amenities: [] }); setPkgDialog(true); }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />Add Package
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {dayOutPackages.map(pkg => (
              <div key={pkg._id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{pkg.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                      setEditingPkg(pkg);
                      setPkgForm({ name: pkg.name, description: pkg.description, price: pkg.price, capacity: pkg.capacity, duration: pkg.duration, maxGroupSize: pkg.maxGroupSize, minGroupSize: pkg.minGroupSize || 10, pricePerPerson: pkg.pricePerPerson, discountPercentage: pkg.discountPercentage || 0, activities: pkg.activities || [], inclusions: pkg.inclusions || [], amenities: pkg.amenities || [] });
                      setPkgDialog(true);
                    }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteDayOutPackage(pkg._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><p className="text-xs text-muted-foreground">Rs./Person</p><p className="font-medium">Rs.{pkg.pricePerPerson}</p></div>
                  <div><p className="text-xs text-muted-foreground">Max Group</p><p className="font-medium">{pkg.maxGroupSize} pax</p></div>
                  <div><p className="text-xs text-muted-foreground">Duration</p><p className="font-medium">{pkg.duration}h</p></div>
                </div>
                {pkg.discountPercentage > 0 && <span className="text-xs rounded-full bg-orange-50 text-orange-700 px-2 py-0.5">{pkg.discountPercentage}% discount</span>}
                {pkg.activities?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {pkg.activities.slice(0, 4).map(a => <span key={a} className="rounded-full bg-blue-50 text-blue-700 text-xs px-2 py-0.5">{a}</span>)}
                    {pkg.activities.length > 4 && <span className="text-xs text-muted-foreground">+{pkg.activities.length - 4} more</span>}
                  </div>
                )}
                {pkg.inclusions?.length > 0 && (
                  <div className="text-xs text-muted-foreground">Includes: {pkg.inclusions.join(' · ')}</div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ══ BOAT PACKAGES ═════════════════════════════════════════════ */}
        <TabsContent value="boatPackages" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="h-3.5 w-3.5" /></Button>
            <Button size="sm" onClick={() => { setEditingBoatPkg(null); setBoatPkgForm({ name: '', description: '', boatType: 'speed_boat', capacity: 10, price: 0, pricePerPerson: 0, duration: 60, departureTime: '', routeDescription: '', safetyRating: 5, mealIncluded: false, lifeJacketsProvided: true }); setBoatPkgDialog(true); }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />Add Boat Package
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {boatPackages.map(pkg => (
              <div key={pkg._id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{pkg.name}</h3>
                    <span className="text-xs rounded-full bg-cyan-50 text-cyan-700 px-2 py-0.5 capitalize">{pkg.boatType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                      setEditingBoatPkg(pkg);
                      setBoatPkgForm({ name: pkg.name, description: pkg.description, boatType: pkg.boatType, capacity: pkg.capacity, price: pkg.price, pricePerPerson: pkg.pricePerPerson, duration: pkg.duration, departureTime: pkg.departureTime || '', routeDescription: pkg.routeDescription || '', safetyRating: pkg.safetyRating || 5, mealIncluded: pkg.mealIncluded || false, lifeJacketsProvided: pkg.lifeJacketsProvided !== false });
                      setBoatPkgDialog(true);
                    }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteBoatPackage(pkg._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><p className="text-xs text-muted-foreground">Rs./Person</p><p className="font-medium">Rs.{pkg.pricePerPerson}</p></div>
                  <div><p className="text-xs text-muted-foreground">Capacity</p><p className="font-medium">{pkg.capacity} pax</p></div>
                  <div><p className="text-xs text-muted-foreground">Duration</p><p className="font-medium">{pkg.duration}min</p></div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500" />{pkg.safetyRating}/5</span>
                  {pkg.mealIncluded && <span className="rounded-full bg-green-50 text-green-700 px-2 py-0.5">Meal included</span>}
                  {pkg.lifeJacketsProvided && <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5">Life jackets</span>}
                  {pkg.departureTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{pkg.departureTime}</span>}
                </div>
                {pkg.routeDescription && <p className="text-xs text-muted-foreground">{pkg.routeDescription}</p>}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ══ CREATE GROUP BOOKING DIALOG ══════════════════════════════════ */}
      <Dialog open={createGroupDialog} onOpenChange={setCreateGroupDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Group Day-out Booking</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2"><Label>Package *</Label>
              <Select value={groupForm.packageId} onValueChange={v => setGroupForm(f => ({ ...f, packageId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select package..." /></SelectTrigger>
                <SelectContent>
                  {dayOutPackages.map(p => <SelectItem key={p._id} value={p._id}>{p.name} — Rs.{p.pricePerPerson}/person</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2"><Label>Group Name *</Label><Input value={groupForm.groupName} onChange={e => setGroupForm(f => ({ ...f, groupName: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Event Date *</Label><Input type="date" value={groupForm.bookingDate} onChange={e => setGroupForm(f => ({ ...f, bookingDate: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Number of People</Label><Input type="number" min={1} value={groupForm.numberOfPeople} onChange={e => setGroupForm(f => ({ ...f, numberOfPeople: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Contact Name</Label><Input value={groupForm.contactName} onChange={e => setGroupForm(f => ({ ...f, contactName: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Contact Phone</Label><Input value={groupForm.contactPhone} onChange={e => setGroupForm(f => ({ ...f, contactPhone: e.target.value }))} /></div>
              <div className="col-span-2 space-y-2"><Label>Contact Email</Label><Input type="email" value={groupForm.contactEmail} onChange={e => setGroupForm(f => ({ ...f, contactEmail: e.target.value }))} /></div>
            </div>
            {groupForm.packageId && groupForm.numberOfPeople > 0 && (() => {
              const pkg = dayOutPackages.find(p => p._id === groupForm.packageId);
              if (!pkg) return null;
              const total = pkg.pricePerPerson * groupForm.numberOfPeople * (1 - (pkg.discountPercentage || 0) / 100);
              return (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm">
                  <p className="font-semibold text-blue-700">Estimated Total: Rs.{Math.round(total).toLocaleString()}</p>
                  {pkg.discountPercentage ? <p className="text-xs text-blue-600">{pkg.discountPercentage}% group discount applied</p> : null}
                </div>
              );
            })()}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Advance Amount</Label><Input type="number" min={0} value={groupForm.advanceAmount} onChange={e => setGroupForm(f => ({ ...f, advanceAmount: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-2"><Label>Payment Method</Label>
                <Select value={groupForm.paymentMethod} onValueChange={v => setGroupForm(f => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Special Requests</Label><Input value={groupForm.specialRequests} onChange={e => setGroupForm(f => ({ ...f, specialRequests: e.target.value }))} /></div>
            <Button className="w-full" onClick={createGroupBooking} disabled={!groupForm.packageId || !groupForm.groupName || !groupForm.bookingDate}>
              Create Group Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ CREATE BOAT BOOKING DIALOG ════════════════════════════════════ */}
      <Dialog open={createBoatDialog} onOpenChange={setCreateBoatDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Boat Ride Booking</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2"><Label>Boat Package *</Label>
              <Select value={boatForm.packageId} onValueChange={v => setBoatForm(f => ({ ...f, packageId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select boat package..." /></SelectTrigger>
                <SelectContent>
                  {boatPackages.map(p => <SelectItem key={p._id} value={p._id}>{p.name} — {p.boatType.replace('_', ' ')} · Rs.{p.pricePerPerson}/person</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Date *</Label><Input type="date" value={boatForm.bookingDate} onChange={e => setBoatForm(f => ({ ...f, bookingDate: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Departure Time *</Label><Input type="time" value={boatForm.departureTime} onChange={e => setBoatForm(f => ({ ...f, departureTime: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Passengers</Label><Input type="number" min={1} value={boatForm.numberOfPassengers} onChange={e => setBoatForm(f => ({ ...f, numberOfPassengers: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Contact Name</Label><Input value={boatForm.contactName} onChange={e => setBoatForm(f => ({ ...f, contactName: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Contact Phone</Label><Input value={boatForm.contactPhone} onChange={e => setBoatForm(f => ({ ...f, contactPhone: e.target.value }))} /></div>
              <div className="col-span-2 space-y-2"><Label>Contact Email</Label><Input type="email" value={boatForm.contactEmail} onChange={e => setBoatForm(f => ({ ...f, contactEmail: e.target.value }))} /></div>
            </div>
            {boatForm.packageId && boatForm.numberOfPassengers > 0 && (() => {
              const pkg = boatPackages.find(p => p._id === boatForm.packageId);
              if (!pkg) return null;
              const total = pkg.pricePerPerson * boatForm.numberOfPassengers;
              return (
                <div className="rounded-lg bg-cyan-50 border border-cyan-200 p-3 text-sm">
                  <p className="font-semibold text-cyan-700">Estimated Total: Rs.{total.toLocaleString()}</p>
                </div>
              );
            })()}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Advance Amount</Label><Input type="number" min={0} value={boatForm.advanceAmount} onChange={e => setBoatForm(f => ({ ...f, advanceAmount: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-2"><Label>Payment Method</Label>
                <Select value={boatForm.paymentMethod} onValueChange={v => setBoatForm(f => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Special Requests</Label><Input value={boatForm.specialRequests} onChange={e => setBoatForm(f => ({ ...f, specialRequests: e.target.value }))} /></div>
            <Button className="w-full" onClick={createBoatBooking} disabled={!boatForm.packageId || !boatForm.bookingDate || !boatForm.departureTime}>
              Create Boat Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ DAY-OUT PACKAGE DIALOG ════════════════════════════════════════ */}
      <Dialog open={pkgDialog} onOpenChange={setPkgDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPkg ? 'Edit Day-out Package' : 'New Day-out Package'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2"><Label>Package Name *</Label><Input value={pkgForm.name} onChange={e => setPkgForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="col-span-2 space-y-2"><Label>Description</Label><Input value={pkgForm.description} onChange={e => setPkgForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Base Price (Rs.)</Label><Input type="number" min={0} value={pkgForm.price} onChange={e => setPkgForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-2"><Label>Price per Person *</Label><Input type="number" min={0} value={pkgForm.pricePerPerson} onChange={e => setPkgForm(f => ({ ...f, pricePerPerson: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-2"><Label>Min Group Size</Label><Input type="number" min={1} value={pkgForm.minGroupSize} onChange={e => setPkgForm(f => ({ ...f, minGroupSize: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Max Group Size</Label><Input type="number" min={1} value={pkgForm.maxGroupSize} onChange={e => setPkgForm(f => ({ ...f, maxGroupSize: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Capacity</Label><Input type="number" min={1} value={pkgForm.capacity} onChange={e => setPkgForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Duration (hours)</Label><Input type="number" min={1} value={pkgForm.duration} onChange={e => setPkgForm(f => ({ ...f, duration: parseInt(e.target.value) || 1 }))} /></div>
              <div className="col-span-2 space-y-2"><Label>Discount %</Label><Input type="number" min={0} max={100} value={pkgForm.discountPercentage} onChange={e => setPkgForm(f => ({ ...f, discountPercentage: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div className="space-y-2">
              <Label>Activities (comma-separated)</Label>
              <Input value={pkgForm.activities.join(', ')} onChange={e => setPkgForm(f => ({ ...f, activities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} placeholder="swimming, bbq, water sports" />
            </div>
            <div className="space-y-2">
              <Label>Inclusions (comma-separated)</Label>
              <Input value={pkgForm.inclusions.join(', ')} onChange={e => setPkgForm(f => ({ ...f, inclusions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} placeholder="lunch, transport, guide" />
            </div>
            <div className="space-y-2">
              <Label>Amenities (comma-separated)</Label>
              <Input value={pkgForm.amenities.join(', ')} onChange={e => setPkgForm(f => ({ ...f, amenities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} placeholder="restrooms, changing rooms" />
            </div>
            <Button className="w-full" onClick={saveDayOutPackage} disabled={!pkgForm.name || !pkgForm.pricePerPerson}>
              {editingPkg ? 'Save Changes' : 'Create Package'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ BOAT PACKAGE DIALOG ═══════════════════════════════════════════ */}
      <Dialog open={boatPkgDialog} onOpenChange={setBoatPkgDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingBoatPkg ? 'Edit Boat Package' : 'New Boat Package'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2"><Label>Name *</Label><Input value={boatPkgForm.name} onChange={e => setBoatPkgForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="col-span-2 space-y-2"><Label>Description</Label><Input value={boatPkgForm.description} onChange={e => setBoatPkgForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="col-span-2 space-y-2"><Label>Boat Type *</Label>
                <Select value={boatPkgForm.boatType} onValueChange={v => setBoatPkgForm(f => ({ ...f, boatType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['speed_boat','houseboat','yacht','catamaran','ferry'].map(t => (
                      <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Capacity *</Label><Input type="number" min={1} value={boatPkgForm.capacity} onChange={e => setBoatPkgForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Duration (min)</Label><Input type="number" min={1} value={boatPkgForm.duration} onChange={e => setBoatPkgForm(f => ({ ...f, duration: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Base Price (Rs.)</Label><Input type="number" min={0} value={boatPkgForm.price} onChange={e => setBoatPkgForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-2"><Label>Price per Person *</Label><Input type="number" min={0} value={boatPkgForm.pricePerPerson} onChange={e => setBoatPkgForm(f => ({ ...f, pricePerPerson: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-2"><Label>Departure Time</Label><Input type="time" value={boatPkgForm.departureTime} onChange={e => setBoatPkgForm(f => ({ ...f, departureTime: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Safety Rating (1–5)</Label><Input type="number" min={1} max={5} value={boatPkgForm.safetyRating} onChange={e => setBoatPkgForm(f => ({ ...f, safetyRating: parseInt(e.target.value) || 5 }))} /></div>
              <div className="col-span-2 space-y-2"><Label>Route Description</Label><Input value={boatPkgForm.routeDescription} onChange={e => setBoatPkgForm(f => ({ ...f, routeDescription: e.target.value }))} /></div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={boatPkgForm.mealIncluded} onChange={e => setBoatPkgForm(f => ({ ...f, mealIncluded: e.target.checked }))} />
                Meal Included
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={boatPkgForm.lifeJacketsProvided} onChange={e => setBoatPkgForm(f => ({ ...f, lifeJacketsProvided: e.target.checked }))} />
                Life Jackets Provided
              </label>
            </div>
            <Button className="w-full" onClick={saveBoatPackage} disabled={!boatPkgForm.name || !boatPkgForm.pricePerPerson}>
              {editingBoatPkg ? 'Save Changes' : 'Create Boat Package'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ PAYMENT DIALOG ════════════════════════════════════════════════ */}
      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{payAction === 'close' ? 'Close Booking' : 'Record Payment'}</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Total</span><span className="font-bold">Rs.{(selectedBooking.totalAmount ?? 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-green-600"><span>Paid So Far</span><span>Rs.{(selectedBooking.advancePaid ?? 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-red-500 font-medium"><span>Balance Due</span><span>Rs.{((selectedBooking.totalAmount ?? 0) - (selectedBooking.advancePaid ?? 0)).toLocaleString()}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Amount *</Label><Input type="number" min={0} step={0.01} value={payAmount} onChange={e => setPayAmount(e.target.value)} /></div>
                <div className="space-y-2"><Label>Method</Label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Input value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="e.g. advance payment" /></div>
              <Button className="w-full" onClick={handlePayment} disabled={!payAmount || parseFloat(payAmount) <= 0}>
                {payAction === 'close' ? 'Close & Settle' : 'Record Payment'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══ ADD / EDIT ITEM DIALOG ════════════════════════════════════════ */}
      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItemIdx !== null ? 'Edit Item' : 'Add Item to Bill'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2"><Label>Item Name *</Label><Input value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Extra refreshments" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Quantity</Label><Input type="number" min={1} value={itemForm.quantity} onChange={e => setItemForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Unit Price (Rs.)</Label><Input type="number" min={0} value={itemForm.unitPrice} onChange={e => setItemForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            {itemForm.unitPrice > 0 && (
              <p className="text-sm font-medium text-muted-foreground">Total: Rs.{(itemForm.quantity * itemForm.unitPrice).toLocaleString()}</p>
            )}
            <Button className="w-full" onClick={handleSaveItem} disabled={!itemForm.name.trim() || itemForm.unitPrice <= 0}>
              {editingItemIdx !== null ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ EDIT BOOKING DIALOG ═══════════════════════════════════════════ */}
      <Dialog open={editBookingDialog} onOpenChange={setEditBookingDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Booking</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            {selectedType === 'group' && (
              <div className="space-y-2"><Label>Group Name</Label><Input value={editBookingForm.groupName} onChange={e => setEditBookingForm(f => ({ ...f, groupName: e.target.value }))} /></div>
            )}
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={editBookingForm.bookingDate} onChange={e => setEditBookingForm(f => ({ ...f, bookingDate: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Special Requests</Label><Input value={editBookingForm.specialRequests} onChange={e => setEditBookingForm(f => ({ ...f, specialRequests: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Internal Notes</Label><Input value={editBookingForm.notes} onChange={e => setEditBookingForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <Button className="w-full" onClick={handleSaveBookingEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ BOOKING DETAIL PANEL ══════════════════════════════════════════ */}
      {detailPanel && selectedBooking && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailPanel(false)} />
          <div className="relative bg-background w-full sm:w-[500px] h-full overflow-y-auto shadow-2xl flex flex-col">

            {/* Header */}
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-lg">
                  {selectedType === 'group'
                    ? (selectedBooking as GroupBooking).groupName
                    : (selectedBooking as BoatBooking).packageId?.name || 'Boat Ride'
                  }
                </h2>
                <div className="flex gap-2 mt-0.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge(selectedBooking.status)}`}>{selectedBooking.status}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge(selectedBooking.paymentStatus)}`}>{selectedBooking.paymentStatus}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => {
                  const b = selectedBooking as any;
                  setEditBookingForm({ groupName: b.groupName || '', bookingDate: b.bookingDate?.slice(0, 10) || '', specialRequests: b.specialRequests || '', notes: b.notes || '' });
                  setEditBookingDialog(true);
                }}><Edit className="h-4 w-4" /></Button>
                {selectedBooking.status === 'completed' && (
                  <Button variant="ghost" size="sm" onClick={() => printBill(selectedBooking, selectedType)}>
                    <Printer className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setDetailPanel(false)}><XCircle className="h-5 w-5" /></Button>
              </div>
            </div>

            <div className="p-4 space-y-4 text-sm">
              {/* Event Info */}
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{format(new Date(selectedBooking.bookingDate), 'dd MMM yyyy')}</p></div>
                {selectedType === 'boat' && <div><p className="text-xs text-muted-foreground">Departure</p><p className="font-medium">{(selectedBooking as BoatBooking).departureTime}</p></div>}
                <div>
                  <p className="text-xs text-muted-foreground">{selectedType === 'group' ? 'People' : 'Passengers'}</p>
                  <p className="font-medium">{selectedType === 'group' ? (selectedBooking as GroupBooking).numberOfPeople : (selectedBooking as BoatBooking).numberOfPassengers}</p>
                </div>
                {selectedType === 'group' && (selectedBooking as GroupBooking).packageId && (
                  <div><p className="text-xs text-muted-foreground">Package</p><p className="font-medium">{(selectedBooking as GroupBooking).packageId!.name}</p></div>
                )}
              </div>

              {/* Contact */}
              {selectedBooking.contactPerson?.name && (
                <div className="rounded-lg bg-muted/30 p-3 space-y-1">
                  <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Contact</p>
                  {[['Name', selectedBooking.contactPerson.name], ['Phone', selectedBooking.contactPerson.phone], ['Email', selectedBooking.contactPerson.email]].map(([l, v]) => v ? (
                    <div key={l} className="flex gap-2"><span className="text-muted-foreground w-12">{l}</span><span className="font-medium">{v}</span></div>
                  ) : null)}
                </div>
              )}

              {selectedBooking.specialRequests && (
                <div><p className="text-xs text-muted-foreground mb-1">Special Requests</p><p>{selectedBooking.specialRequests}</p></div>
              )}

              {/* Financial */}
              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Package Base</span><span>Rs.{(selectedBooking.totalPrice ?? 0).toLocaleString()}</span></div>
                {(selectedBooking.additionalItems ?? []).length > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Extras</span><span>Rs.{((selectedBooking.totalAmount ?? 0) - (selectedBooking.totalPrice ?? 0)).toLocaleString()}</span></div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>Rs.{(selectedBooking.totalAmount ?? 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-green-600"><span>Paid</span><span>Rs.{(selectedBooking.advancePaid ?? 0).toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-red-600"><span>Balance Due</span><span>Rs.{(selectedBooking.balanceAmount ?? 0).toLocaleString()}</span></div>
              </div>

              {/* Additional Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">Additional Items</p>
                  {!['cancelled', 'completed'].includes(selectedBooking.status) && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setEditingItemIdx(null); setItemForm({ name: '', quantity: 1, unitPrice: 0 }); setItemDialog(true); }}>
                      <Plus className="h-3 w-3 mr-1" />Add
                    </Button>
                  )}
                </div>
                {(selectedBooking.additionalItems ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No additional items</p>
                ) : (selectedBooking.additionalItems ?? []).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b py-2">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground text-xs ml-2">×{item.quantity} @ Rs.{item.unitPrice}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Rs.{item.total.toLocaleString()}</span>
                      {!['cancelled', 'completed'].includes(selectedBooking.status) && (
                        <>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingItemIdx(idx); setItemForm({ name: item.name, quantity: item.quantity, unitPrice: item.unitPrice }); setItemDialog(true); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => handleDeleteItem(idx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment History */}
              {(selectedBooking.payments ?? []).length > 0 && (
                <div>
                  <p className="font-semibold mb-2">Payment History</p>
                  {(selectedBooking.payments ?? []).map((p, i) => (
                    <div key={i} className="flex justify-between rounded bg-muted/30 px-2 py-1.5 mb-1">
                      <span className="capitalize">{p.method} — Rs.{p.amount.toLocaleString()}{p.notes ? ` · ${p.notes}` : ''}</span>
                      <span className="text-muted-foreground text-xs">{format(new Date(p.date), 'MMM dd, yyyy')}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {!['cancelled', 'completed'].includes(selectedBooking.status) && (
                  <Button variant="outline" size="sm" onClick={() => { setPayAction('pay'); setPayAmount(''); setPayMethod('cash'); setPayNotes(''); setPayDialog(true); }}>
                    <DollarSign className="h-3.5 w-3.5 mr-1" />Record Payment
                  </Button>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => { setPayAction('close'); setPayAmount(String(Math.max(0, (selectedBooking.totalAmount ?? 0) - (selectedBooking.advancePaid ?? 0)))); setPayMethod('cash'); setPayNotes(''); setPayDialog(true); }}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />Close Booking
                  </Button>
                )}
                {selectedBooking.status === 'completed' && (
                  <Button variant="outline" size="sm" onClick={() => printBill(selectedBooking, selectedType)}>
                    <Printer className="h-3.5 w-3.5 mr-1" /><QrCode className="h-3.5 w-3.5 mr-1" />Print Bill
                  </Button>
                )}
                {!['completed', 'cancelled'].includes(selectedBooking.status) && (
                  <Button variant="ghost" size="sm" className="text-orange-500" onClick={() => handleCancelBooking(selectedBooking._id, selectedType)}>
                    <XCircle className="h-3.5 w-3.5 mr-1" />Cancel
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteBooking(selectedBooking._id, selectedType)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
