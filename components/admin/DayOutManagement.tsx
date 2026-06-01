'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  CheckCircle,
  DollarSign,
  Edit,
  Eye,
  Package,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrency } from '@/hooks/useCurrency';

interface DayOutPackage {
  _id: string;
  name: string;
  description?: string;
  price: number;
  capacity: number;
  duration: number;
  maxGroupSize: number;
  minGroupSize: number;
  pricePerPerson: number;
  discountPercentage: number;
  activities: string[];
  inclusions: string[];
  amenities: string[];
}

interface Payment {
  amount: number;
  method: string;
  date: string;
  notes?: string;
}

interface AdditionalItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface GroupBooking {
  _id: string;
  packageId: { _id: string; name: string; price: number; pricePerPerson: number } | null;
  groupName: string;
  bookingDate: string;
  numberOfPeople: number;
  totalAmount: number;
  totalPrice: number;
  depositAmount: number;
  balanceAmount: number;
  advancePaid: number;
  paymentStatus: string;
  status: string;
  specialRequests?: string;
  notes?: string;
  payments: Payment[];
  additionalItems: AdditionalItem[];
  contactPerson?: { name?: string; phone?: string; email?: string };
}

const blankPackage = {
  name: '',
  description: '',
  price: 0,
  capacity: 100,
  duration: 8,
  maxGroupSize: 50,
  minGroupSize: 10,
  pricePerPerson: 0,
  discountPercentage: 0,
  activities: [] as string[],
  inclusions: [] as string[],
  amenities: [] as string[],
};

const blankGroupForm = {
  packageId: '',
  groupName: '',
  bookingDate: '',
  numberOfPeople: 10,
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  specialRequests: '',
  advanceAmount: 0,
  paymentMethod: 'cash',
};

const badge = (status: string) => ({
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-500',
  partial: 'bg-orange-100 text-orange-700',
  paid: 'bg-emerald-100 text-emerald-700',
}[status] ?? 'bg-gray-100 text-gray-600');

function listToInput(items: string[] = []) {
  return items.join(', ');
}

function inputToList(value: string) {
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

function printBill(booking: GroupBooking, hotel = 'Lexient Hotel') {
  const qrUrl = `${window.location.origin}/day-out-bill/${booking._id}`;
  const totalAmount = booking.totalAmount ?? 0;
  const advancePaid = booking.advancePaid ?? 0;
  const balance = totalAmount - advancePaid;
  const html = `<!DOCTYPE html><html><head><title>Day-out Bill</title>
  <style>
    body{font-family:'Courier New',monospace;font-size:11px;width:300px;margin:0 auto;padding:8px}
    h2{text-align:center;font-size:15px;margin:0}.c{text-align:center}
    hr{border:none;border-top:1px dashed #000;margin:6px 0}
    table{width:100%;border-collapse:collapse}td{padding:2px 0}.r{text-align:right}
    .tb td{font-weight:bold;font-size:13px}img.qr{display:block;margin:8px auto;width:110px}
    @media print{body{margin:0}}
  </style></head><body>
  <h2>${hotel}</h2><p class="c">Day-out Bill</p><hr/>
  <p><b>${booking.groupName}</b></p>
  <p>Date: <b>${format(new Date(booking.bookingDate), 'dd MMM yyyy')}</b></p>
  <p>People: ${booking.numberOfPeople} · Status: <b>${booking.status.toUpperCase()}</b></p>
  <hr/>
  <table>
    <tr><td>Package</td><td class="r">Rs.${(booking.totalPrice ?? 0).toFixed(2)}</td></tr>
    ${(booking.additionalItems ?? []).map(i => `<tr><td>${i.name} x${i.quantity}</td><td class="r">Rs.${(i.total ?? 0).toFixed(2)}</td></tr>`).join('')}
  </table><hr/>
  <table>
    <tr class="tb"><td>TOTAL</td><td class="r">Rs.${totalAmount.toFixed(2)}</td></tr>
    <tr><td>Paid</td><td class="r">Rs.${advancePaid.toFixed(2)}</td></tr>
    <tr class="tb"><td>BALANCE DUE</td><td class="r">Rs.${balance.toFixed(2)}</td></tr>
  </table><hr/>
  ${(booking.payments ?? []).length > 0 ? `<p><b>Payments:</b></p>${booking.payments.map(p => `<p>${p.method} - Rs.${p.amount} (${format(new Date(p.date), 'MMM dd')})</p>`).join('')}<hr/>` : ''}
  <p class="c" style="font-size:10px">Scan QR to view bill online</p>
  <img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(qrUrl)}" />
  <p class="c" style="font-size:9px">Thank you for choosing ${hotel}!</p>
  </body></html>`;
  const printWindow = window.open('', '_blank', 'width=420,height=640');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
}

export default function DayOutManagement() {
  const { toUSD } = useCurrency();
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<DayOutPackage[]>([]);
  const [bookings, setBookings] = useState<GroupBooking[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [pkgDialog, setPkgDialog] = useState(false);
  const [editingPkg, setEditingPkg] = useState<DayOutPackage | null>(null);
  const [pkgForm, setPkgForm] = useState(blankPackage);

  const [createDialog, setCreateDialog] = useState(false);
  const [groupForm, setGroupForm] = useState(blankGroupForm);

  const [selectedBooking, setSelectedBooking] = useState<GroupBooking | null>(null);
  const [detailPanel, setDetailPanel] = useState(false);
  const [editBookingDialog, setEditBookingDialog] = useState(false);
  const [editBookingForm, setEditBookingForm] = useState({
    groupName: '',
    bookingDate: '',
    specialRequests: '',
    notes: '',
  });

  const [payDialog, setPayDialog] = useState(false);
  const [payAction, setPayAction] = useState<'pay' | 'close'>('pay');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNotes, setPayNotes] = useState('');

  const [itemDialog, setItemDialog] = useState(false);
  const [itemForm, setItemForm] = useState({ name: '', quantity: 1, unitPrice: 0 });
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [packageRes, bookingRes] = await Promise.all([
        fetch('/api/day-out/packages'),
        fetch('/api/day-out/group-bookings'),
      ]);
      const [packageData, bookingData] = await Promise.all([packageRes.json(), bookingRes.json()]);
      if (packageData.success) setPackages(packageData.data ?? []);
      if (bookingData.success) setBookings(bookingData.data ?? []);
    } catch {
      toast.error('Failed to load day-out data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const putBooking = async (id: string, body: object) => {
    const res = await fetch('/api/day-out/group-bookings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...body }),
    });
    return res.json();
  };

  const saveDayOutPackage = async () => {
    try {
      const method = editingPkg ? 'PUT' : 'POST';
      const body = editingPkg ? { id: editingPkg._id, ...pkgForm } : pkgForm;
      const res = await fetch('/api/day-out/packages', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error);
        return;
      }
      toast.success(editingPkg ? 'Package updated' : 'Package created');
      setPkgDialog(false);
      fetchAll();
    } catch {
      toast.error('Failed to save package');
    }
  };

  const deleteDayOutPackage = async (id: string) => {
    if (!confirm('Delete this package?')) return;
    const res = await fetch(`/api/day-out/packages?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      toast.success('Package deleted');
      fetchAll();
    } else {
      toast.error(data.error);
    }
  };

  const createGroupBooking = async () => {
    if (!groupForm.packageId || !groupForm.groupName || !groupForm.bookingDate) {
      toast.error('Package, group name and date are required');
      return;
    }
    try {
      const res = await fetch('/api/day-out/group-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: groupForm.packageId,
          groupName: groupForm.groupName,
          bookingDate: groupForm.bookingDate,
          numberOfPeople: groupForm.numberOfPeople,
          contactPerson: {
            name: groupForm.contactName,
            phone: groupForm.contactPhone,
            email: groupForm.contactEmail,
          },
          specialRequests: groupForm.specialRequests,
          advanceAmount: groupForm.advanceAmount,
          paymentMethod: groupForm.paymentMethod,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error);
        return;
      }
      toast.success('Group booking created');
      setCreateDialog(false);
      fetchAll();
    } catch {
      toast.error('Failed to create booking');
    }
  };

  const openPay = (booking: GroupBooking, action: 'pay' | 'close') => {
    setSelectedBooking(booking);
    setPayAction(action);
    setPayAmount(action === 'close' ? String(Math.max(0, booking.balanceAmount ?? (booking.totalAmount ?? 0) - (booking.advancePaid ?? 0))) : '');
    setPayMethod('cash');
    setPayNotes('');
    setPayDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedBooking) return;
    const balanceDue = Math.max(0, selectedBooking.balanceAmount ?? (selectedBooking.totalAmount ?? 0) - (selectedBooking.advancePaid ?? 0));
    const amount = payAction === 'close' ? balanceDue : parseFloat(payAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error('Enter valid amount');
      return;
    }
    if (payAction === 'pay' && amount <= 0) {
      toast.error('Enter valid amount');
      return;
    }
    if (payAction === 'close' && amount < 0) {
      toast.error('Enter valid amount');
      return;
    }
    const data = await putBooking(selectedBooking._id, {
      action: payAction,
      amount,
      method: payMethod,
      notes: payNotes,
    });
    if (data.success) {
      toast.success(payAction === 'close' ? 'Booking closed' : 'Payment recorded');
      setPayDialog(false);
      setSelectedBooking(data.data);
      fetchAll();
    } else {
      toast.error(data.error);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    const data = await putBooking(id, { action: 'cancel' });
    if (data.success) {
      toast.success('Booking cancelled');
      fetchAll();
      if (selectedBooking?._id === id) setSelectedBooking(data.data);
    } else {
      toast.error(data.error);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm('Permanently delete this booking?')) return;
    const res = await fetch(`/api/day-out/group-bookings?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      toast.success('Booking deleted');
      fetchAll();
      if (selectedBooking?._id === id) setDetailPanel(false);
    } else {
      toast.error(data.error);
    }
  };

  const handleSaveItem = async () => {
    if (!selectedBooking) return;
    const isEdit = editingItemIdx !== null;
    const data = await putBooking(
      selectedBooking._id,
      isEdit
        ? { action: 'edit_item', itemIndex: editingItemIdx, itemUpdate: itemForm }
        : { action: 'add_items', additionalItems: [itemForm] }
    );
    if (data.success) {
      toast.success(isEdit ? 'Item updated' : 'Item added');
      setItemDialog(false);
      setSelectedBooking(data.data);
      fetchAll();
    } else {
      toast.error(data.error);
    }
  };

  const handleDeleteItem = async (idx: number) => {
    if (!selectedBooking) return;
    const data = await putBooking(selectedBooking._id, { action: 'delete_item', itemIndex: idx });
    if (data.success) {
      toast.success('Item removed');
      setSelectedBooking(data.data);
      fetchAll();
    } else {
      toast.error(data.error);
    }
  };

  const handleSaveBookingEdit = async () => {
    if (!selectedBooking) return;
    const data = await putBooking(selectedBooking._id, editBookingForm);
    if (data.success) {
      toast.success('Booking updated');
      setEditBookingDialog(false);
      setSelectedBooking(data.data);
      fetchAll();
    } else {
      toast.error(data.error);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const q = search.toLowerCase();
    const matchStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchStatus && (
      booking.groupName.toLowerCase().includes(q) ||
      booking.contactPerson?.name?.toLowerCase().includes(q) ||
      booking.packageId?.name?.toLowerCase().includes(q)
    );
  });

  const stats = [
    { label: 'Group Bookings', value: bookings.length, sub: `${bookings.filter(b => b.status === 'confirmed').length} confirmed`, color: 'text-blue-600' },
    { label: 'Packages', value: packages.length, sub: 'active day-out offers', color: 'text-violet-600' },
    { label: 'Collected', value: `Rs.${bookings.reduce((sum, b) => sum + (b.advancePaid ?? 0), 0).toLocaleString()}`, sub: 'payments received', color: 'text-green-600' },
    { label: 'Balance Due', value: `Rs.${bookings.reduce((sum, b) => sum + (b.balanceAmount ?? 0), 0).toLocaleString()}`, sub: 'open balance', color: 'text-red-600' },
  ];

  const openDetail = (booking: GroupBooking) => {
    setSelectedBooking(booking);
    setDetailPanel(true);
  };

  const openPackageDialog = (pkg?: DayOutPackage) => {
    if (pkg) {
      setEditingPkg(pkg);
      setPkgForm({
        name: pkg.name,
        description: pkg.description || '',
        price: pkg.price || pkg.pricePerPerson || 0,
        capacity: pkg.capacity || 1,
        duration: pkg.duration || 1,
        maxGroupSize: pkg.maxGroupSize || 1,
        minGroupSize: pkg.minGroupSize || 1,
        pricePerPerson: pkg.pricePerPerson || 0,
        discountPercentage: pkg.discountPercentage || 0,
        activities: pkg.activities || [],
        inclusions: pkg.inclusions || [],
        amenities: pkg.amenities || [],
      });
    } else {
      setEditingPkg(null);
      setPkgForm(blankPackage);
    }
    setPkgDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={value => { setActiveTab(value); setSearch(''); setStatusFilter('all'); }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bookings"><Users className="mr-1.5 h-3.5 w-3.5" />Group Bookings</TabsTrigger>
          <TabsTrigger value="packages"><Package className="mr-1.5 h-3.5 w-3.5" />Day-out Packages</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input className="pl-8 w-48 h-8 text-sm" placeholder="Search group..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                    <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="h-3.5 w-3.5" /></Button>
              <Button size="sm" onClick={() => { setGroupForm(blankGroupForm); setCreateDialog(true); }}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />New Booking
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-3">
              {filteredBookings.length === 0 && <p className="text-center py-8 text-muted-foreground">No group bookings found</p>}
              {filteredBookings.map(booking => (
                <div key={booking._id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{booking.groupName}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge(booking.status)}`}>{booking.status}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge(booking.paymentStatus)}`}>{booking.paymentStatus}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(booking.bookingDate), 'MMM dd, yyyy')}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{booking.numberOfPeople} people</span>
                        {booking.packageId && <span>{booking.packageId.name}</span>}
                        {booking.contactPerson?.name && <span>{booking.contactPerson.name}</span>}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-bold">Rs.{(booking.totalAmount ?? 0).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">/ {toUSD(booking.totalAmount ?? 0)}</span></p>
                      <p className="text-xs text-green-600">Paid: Rs.{(booking.advancePaid ?? 0).toLocaleString()}</p>
                      {(booking.balanceAmount ?? 0) > 0 && <p className="text-xs text-red-500">Due: Rs.{(booking.balanceAmount ?? 0).toLocaleString()}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openDetail(booking)}>
                      <Eye className="h-3 w-3 mr-1" />View
                    </Button>
                    {!['cancelled', 'completed'].includes(booking.status) && (
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openPay(booking, 'pay')}>
                        <DollarSign className="h-3 w-3 mr-1" />Payment
                      </Button>
                    )}
                    {!['cancelled', 'completed'].includes(booking.status) && (
                      <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => openPay(booking, 'close')}>
                        <CheckCircle className="h-3 w-3 mr-1" />Close
                      </Button>
                    )}
                    {booking.status === 'completed' && (
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => printBill(booking)}>
                        <Printer className="h-3 w-3 mr-1" /><QrCode className="h-3 w-3 mr-1" />Print
                      </Button>
                    )}
                    {!['completed', 'cancelled'].includes(booking.status) && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-orange-500" onClick={() => handleCancelBooking(booking._id)}>
                        <XCircle className="h-3 w-3 mr-1" />Cancel
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600" onClick={() => handleDeleteBooking(booking._id)}>
                      <Trash2 className="h-3 w-3 mr-1" />Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="h-3.5 w-3.5" /></Button>
            <Button size="sm" onClick={() => openPackageDialog()}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />Add Package
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {packages.length === 0 && <p className="text-center py-8 text-muted-foreground sm:col-span-2">No day-out packages found</p>}
            {packages.map(pkg => (
              <div key={pkg._id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{pkg.name}</h3>
                    {pkg.description && <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openPackageDialog(pkg)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteDayOutPackage(pkg._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><p className="text-xs text-muted-foreground">Rs./Person</p><p className="font-medium">Rs.{pkg.pricePerPerson} / {toUSD(pkg.pricePerPerson)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Max Group</p><p className="font-medium">{pkg.maxGroupSize} pax</p></div>
                  <div><p className="text-xs text-muted-foreground">Duration</p><p className="font-medium">{pkg.duration}h</p></div>
                </div>
                {pkg.discountPercentage > 0 && <span className="text-xs rounded-full bg-orange-50 text-orange-700 px-2 py-0.5">{pkg.discountPercentage}% discount</span>}
                {pkg.activities?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {pkg.activities.slice(0, 4).map(activity => <span key={activity} className="rounded-full bg-blue-50 text-blue-700 text-xs px-2 py-0.5">{activity}</span>)}
                    {pkg.activities.length > 4 && <span className="text-xs text-muted-foreground">+{pkg.activities.length - 4} more</span>}
                  </div>
                )}
                {pkg.inclusions?.length > 0 && <div className="text-xs text-muted-foreground">Includes: {pkg.inclusions.join(' · ')}</div>}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Group Day-out Booking</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label>Package *</Label>
              <Select value={groupForm.packageId} onValueChange={value => setGroupForm(form => ({ ...form, packageId: value }))}>
                <SelectTrigger><SelectValue placeholder="Select package..." /></SelectTrigger>
                <SelectContent>
                  {packages.map(pkg => (
                    <SelectItem key={pkg._id} value={pkg._id}>{pkg.name} - Rs.{pkg.pricePerPerson}/person</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2"><Label>Group Name *</Label><Input value={groupForm.groupName} onChange={e => setGroupForm(form => ({ ...form, groupName: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Event Date *</Label><Input type="date" value={groupForm.bookingDate} onChange={e => setGroupForm(form => ({ ...form, bookingDate: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Number of People</Label><Input type="number" min={1} value={groupForm.numberOfPeople} onChange={e => setGroupForm(form => ({ ...form, numberOfPeople: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Contact Name</Label><Input value={groupForm.contactName} onChange={e => setGroupForm(form => ({ ...form, contactName: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Contact Phone</Label><Input value={groupForm.contactPhone} onChange={e => setGroupForm(form => ({ ...form, contactPhone: e.target.value }))} /></div>
              <div className="col-span-2 space-y-2"><Label>Contact Email</Label><Input type="email" value={groupForm.contactEmail} onChange={e => setGroupForm(form => ({ ...form, contactEmail: e.target.value }))} /></div>
            </div>
            {groupForm.packageId && groupForm.numberOfPeople > 0 && (() => {
              const pkg = packages.find(item => item._id === groupForm.packageId);
              if (!pkg) return null;
              const total = pkg.pricePerPerson * groupForm.numberOfPeople * (1 - (pkg.discountPercentage || 0) / 100);
              return (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm">
                  <p className="font-semibold text-blue-700">Estimated Total: Rs.{Math.round(total).toLocaleString()} / {toUSD(Math.round(total))}</p>
                  {pkg.discountPercentage ? <p className="text-xs text-blue-600">{pkg.discountPercentage}% group discount applied</p> : null}
                </div>
              );
            })()}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Advance Amount</Label><Input type="number" min={0} value={groupForm.advanceAmount} onChange={e => setGroupForm(form => ({ ...form, advanceAmount: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={groupForm.paymentMethod} onValueChange={value => setGroupForm(form => ({ ...form, paymentMethod: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Special Requests</Label><Input value={groupForm.specialRequests} onChange={e => setGroupForm(form => ({ ...form, specialRequests: e.target.value }))} /></div>
            <Button className="w-full" onClick={createGroupBooking} disabled={!groupForm.packageId || !groupForm.groupName || !groupForm.bookingDate}>
              Create Group Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pkgDialog} onOpenChange={setPkgDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPkg ? 'Edit Day-out Package' : 'New Day-out Package'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2"><Label>Package Name *</Label><Input value={pkgForm.name} onChange={e => setPkgForm(form => ({ ...form, name: e.target.value }))} /></div>
              <div className="col-span-2 space-y-2"><Label>Description</Label><Input value={pkgForm.description} onChange={e => setPkgForm(form => ({ ...form, description: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Base Price (Rs.)</Label><Input type="number" min={0} value={pkgForm.price} onChange={e => setPkgForm(form => ({ ...form, price: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-2"><Label>Price per Person *</Label><Input type="number" min={0} value={pkgForm.pricePerPerson} onChange={e => setPkgForm(form => ({ ...form, pricePerPerson: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-2"><Label>Min Group Size</Label><Input type="number" min={1} value={pkgForm.minGroupSize} onChange={e => setPkgForm(form => ({ ...form, minGroupSize: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Max Group Size</Label><Input type="number" min={1} value={pkgForm.maxGroupSize} onChange={e => setPkgForm(form => ({ ...form, maxGroupSize: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Capacity</Label><Input type="number" min={1} value={pkgForm.capacity} onChange={e => setPkgForm(form => ({ ...form, capacity: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Duration (hours)</Label><Input type="number" min={1} value={pkgForm.duration} onChange={e => setPkgForm(form => ({ ...form, duration: parseInt(e.target.value) || 1 }))} /></div>
              <div className="col-span-2 space-y-2"><Label>Discount %</Label><Input type="number" min={0} max={100} value={pkgForm.discountPercentage} onChange={e => setPkgForm(form => ({ ...form, discountPercentage: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div className="space-y-2">
              <Label>Activities (comma-separated)</Label>
              <Input value={listToInput(pkgForm.activities)} onChange={e => setPkgForm(form => ({ ...form, activities: inputToList(e.target.value) }))} placeholder="swimming, bbq, games" />
            </div>
            <div className="space-y-2">
              <Label>Inclusions (comma-separated)</Label>
              <Input value={listToInput(pkgForm.inclusions)} onChange={e => setPkgForm(form => ({ ...form, inclusions: inputToList(e.target.value) }))} placeholder="lunch, transport, guide" />
            </div>
            <div className="space-y-2">
              <Label>Amenities (comma-separated)</Label>
              <Input value={listToInput(pkgForm.amenities)} onChange={e => setPkgForm(form => ({ ...form, amenities: inputToList(e.target.value) }))} placeholder="restrooms, changing rooms" />
            </div>
            <Button className="w-full" onClick={saveDayOutPackage} disabled={!pkgForm.name || !pkgForm.pricePerPerson}>
              {editingPkg ? 'Save Changes' : 'Create Package'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{payAction === 'close' ? 'Close Booking' : 'Record Payment'}</DialogTitle></DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Total</span><span className="font-bold">Rs.{(selectedBooking.totalAmount ?? 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-green-600"><span>Paid So Far</span><span>Rs.{(selectedBooking.advancePaid ?? 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-red-500 font-medium"><span>Balance Due</span><span>Rs.{((selectedBooking.totalAmount ?? 0) - (selectedBooking.advancePaid ?? 0)).toLocaleString()}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    readOnly={payAction === 'close'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
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
              <Button className="w-full" onClick={handlePayment} disabled={payAction === 'pay' && (payAmount === '' || parseFloat(payAmount) <= 0)}>
                {payAction === 'close' ? 'Close & Settle' : 'Record Payment'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItemIdx !== null ? 'Edit Item' : 'Add Item to Bill'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2"><Label>Item Name *</Label><Input value={itemForm.name} onChange={e => setItemForm(form => ({ ...form, name: e.target.value }))} placeholder="e.g. Extra refreshments" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Quantity</Label><Input type="number" min={1} value={itemForm.quantity} onChange={e => setItemForm(form => ({ ...form, quantity: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Unit Price (Rs.)</Label><Input type="number" min={0} value={itemForm.unitPrice} onChange={e => setItemForm(form => ({ ...form, unitPrice: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            {itemForm.unitPrice > 0 && <p className="text-sm font-medium text-muted-foreground">Total: Rs.{(itemForm.quantity * itemForm.unitPrice).toLocaleString()}</p>}
            <Button className="w-full" onClick={handleSaveItem} disabled={!itemForm.name.trim() || itemForm.unitPrice <= 0}>
              {editingItemIdx !== null ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editBookingDialog} onOpenChange={setEditBookingDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Booking</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2"><Label>Group Name</Label><Input value={editBookingForm.groupName} onChange={e => setEditBookingForm(form => ({ ...form, groupName: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={editBookingForm.bookingDate} onChange={e => setEditBookingForm(form => ({ ...form, bookingDate: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Special Requests</Label><Input value={editBookingForm.specialRequests} onChange={e => setEditBookingForm(form => ({ ...form, specialRequests: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Internal Notes</Label><Input value={editBookingForm.notes} onChange={e => setEditBookingForm(form => ({ ...form, notes: e.target.value }))} /></div>
            <Button className="w-full" onClick={handleSaveBookingEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {detailPanel && selectedBooking && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailPanel(false)} />
          <div className="relative bg-background w-full sm:w-[500px] h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-lg">{selectedBooking.groupName}</h2>
                <div className="flex gap-2 mt-0.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge(selectedBooking.status)}`}>{selectedBooking.status}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge(selectedBooking.paymentStatus)}`}>{selectedBooking.paymentStatus}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => {
                  setEditBookingForm({
                    groupName: selectedBooking.groupName || '',
                    bookingDate: selectedBooking.bookingDate?.slice(0, 10) || '',
                    specialRequests: selectedBooking.specialRequests || '',
                    notes: selectedBooking.notes || '',
                  });
                  setEditBookingDialog(true);
                }}><Edit className="h-4 w-4" /></Button>
                {selectedBooking.status === 'completed' && (
                  <Button variant="ghost" size="sm" onClick={() => printBill(selectedBooking)}>
                    <Printer className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setDetailPanel(false)}><XCircle className="h-5 w-5" /></Button>
              </div>
            </div>

            <div className="p-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{format(new Date(selectedBooking.bookingDate), 'dd MMM yyyy')}</p></div>
                <div><p className="text-xs text-muted-foreground">People</p><p className="font-medium">{selectedBooking.numberOfPeople}</p></div>
                {selectedBooking.packageId && <div><p className="text-xs text-muted-foreground">Package</p><p className="font-medium">{selectedBooking.packageId.name}</p></div>}
              </div>

              {selectedBooking.contactPerson?.name && (
                <div className="rounded-lg bg-muted/30 p-3 space-y-1">
                  <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Contact</p>
                  {[['Name', selectedBooking.contactPerson.name], ['Phone', selectedBooking.contactPerson.phone], ['Email', selectedBooking.contactPerson.email]].map(([label, value]) => value ? (
                    <div key={label} className="flex gap-2"><span className="text-muted-foreground w-12">{label}</span><span className="font-medium">{value}</span></div>
                  ) : null)}
                </div>
              )}

              {selectedBooking.specialRequests && <div><p className="text-xs text-muted-foreground mb-1">Special Requests</p><p>{selectedBooking.specialRequests}</p></div>}

              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Package Base</span><span>Rs.{(selectedBooking.totalPrice ?? 0).toLocaleString()}</span></div>
                {(selectedBooking.additionalItems ?? []).length > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Extras</span><span>Rs.{((selectedBooking.totalAmount ?? 0) - (selectedBooking.totalPrice ?? 0)).toLocaleString()}</span></div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>Rs.{(selectedBooking.totalAmount ?? 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-green-600"><span>Paid</span><span>Rs.{(selectedBooking.advancePaid ?? 0).toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-red-600"><span>Balance Due</span><span>Rs.{(selectedBooking.balanceAmount ?? 0).toLocaleString()}</span></div>
              </div>

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
                ) : selectedBooking.additionalItems.map((item, idx) => (
                  <div key={`${item.name}-${idx}`} className="flex items-center justify-between border-b py-2">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground text-xs ml-2">x{item.quantity} @ Rs.{item.unitPrice}</span>
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

              {(selectedBooking.payments ?? []).length > 0 && (
                <div>
                  <p className="font-semibold mb-2">Payment History</p>
                  {selectedBooking.payments.map((payment, index) => (
                    <div key={`${payment.date}-${index}`} className="flex justify-between rounded bg-muted/30 px-2 py-1.5 mb-1">
                      <span className="capitalize">{payment.method} - Rs.{payment.amount.toLocaleString()}{payment.notes ? ` · ${payment.notes}` : ''}</span>
                      <span className="text-muted-foreground text-xs">{format(new Date(payment.date), 'MMM dd, yyyy')}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {!['cancelled', 'completed'].includes(selectedBooking.status) && (
                  <Button variant="outline" size="sm" onClick={() => openPay(selectedBooking, 'pay')}>
                    <DollarSign className="h-3.5 w-3.5 mr-1" />Record Payment
                  </Button>
                )}
                {!['cancelled', 'completed'].includes(selectedBooking.status) && (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => openPay(selectedBooking, 'close')}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />Close Booking
                  </Button>
                )}
                {selectedBooking.status === 'completed' && (
                  <Button variant="outline" size="sm" onClick={() => printBill(selectedBooking)}>
                    <Printer className="h-3.5 w-3.5 mr-1" /><QrCode className="h-3.5 w-3.5 mr-1" />Print Bill
                  </Button>
                )}
                {!['completed', 'cancelled'].includes(selectedBooking.status) && (
                  <Button variant="ghost" size="sm" className="text-orange-500" onClick={() => handleCancelBooking(selectedBooking._id)}>
                    <XCircle className="h-3.5 w-3.5 mr-1" />Cancel
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteBooking(selectedBooking._id)}>
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
