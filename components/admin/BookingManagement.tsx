'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import {
  Eye, CheckCircle, XCircle, UtensilsCrossed, FileText, LogOut,
  LogIn, Plus, Trash2, CreditCard, IdCard, Search, RefreshCw,
  BedDouble, Edit, Printer, QrCode, MinusCircle, PlusCircle, Calendar,
  Phone, Mail, Users, DollarSign, Clock, ChevronRight,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Booking {
  _id: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  numberOfNights: number;
  numberOfGuests: number;
  totalAmount: number;
  discountAmount: number;
  amountPaid: number;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
  roomIds: string[];
  guestDocument?: {
    docType: string;
    docNumber: string;
    expiryDate?: string;
    scanUrl?: string;
    isReturned: boolean;
  };
  payments?: { amount: number; method: string; date: string; notes?: string }[];
  additionalCharges?: { _id?: string; description: string; qty: number; unitAmount: number; total: number }[];
}

interface MenuItem {
  _id: string; name: string; category: string; price: number;
  available: boolean; preparationTime: number; vegetarian?: boolean; spiceLevel?: number;
}

interface RoomServiceOrder {
  _id: string; mealType: string; status: string; paymentStatus: string; orderTime: string;
  items: { itemName: string; quantity: number; price: number; specialInstructions?: string }[];
  subtotal: number; tax: number; total: number;
}

interface RoomInfo {
  _id: string; roomNumber: string; category: string; pricePerNight: number;
  capacity: number; amenities: string[]; isAvailable: boolean;
}

interface InvoiceData {
  invoiceNumber: string;
  generatedAt: string;
  booking: {
    bookingId: string; customerName: string; customerEmail: string; customerPhone: string;
    numberOfNights: number; checkInDate: string; checkOutDate: string;
    checkInTime?: string; checkOutTime?: string; status: string;
    guestDocument?: Booking['guestDocument'];
  };
  roomCharges: {
    items: { description: string; unitPrice: number; quantity: number; total: number }[];
    subtotal: number; discount: number; total: number;
  };
  foodCharges: {
    items: { description: string; unitPrice: number; quantity: number; total: number; orderStatus?: string }[];
    subtotal: number; tax: number; total: number;
  };
  additionalCharges: {
    items: { description: string; qty: number; unitAmount: number; total: number; id?: string }[];
    total: number;
  };
  summary: {
    roomTotal: number; foodTotal: number; additionalTotal: number;
    grandTotal: number; amountPaid: number; balanceDue: number;
  };
  payments: { amount: number; method: string; date: string; notes?: string }[];
}

// ── Print helpers ─────────────────────────────────────────────────────────────

const HOTEL = 'Lexient Hotel';

function printCheckInReceipt(booking: Booking, rooms: RoomInfo[]) {
  const qrUrl = `${window.location.origin}/room-service/${booking._id}`;
  const roomList = rooms.map(r => `${r.roomNumber} (${r.category})`).join(', ');
  const lastPay = booking.payments?.at(-1);
  const html = `<!DOCTYPE html><html><head><title>Check-in Receipt</title>
  <style>body{font-family:'Courier New',monospace;font-size:11px;width:300px;margin:0 auto;padding:8px}
  h2{text-align:center;font-size:15px;margin:2px 0}.c{text-align:center}
  hr{border:none;border-top:1px dashed #000;margin:5px 0}
  table{width:100%}td{padding:1px 0}.r{text-align:right}
  .big{font-size:14px;font-weight:bold}img.qr{display:block;margin:6px auto;width:100px}
  @media print{body{margin:0}}</style></head><body>
  <h2>${HOTEL}</h2><p class="c">CHECK-IN RECEIPT</p><hr/>
  <table>
    <tr><td>Guest:</td><td class="r"><b>${booking.customerName}</b></td></tr>
    <tr><td>Phone:</td><td class="r">${booking.customerPhone}</td></tr>
    <tr><td>Room(s):</td><td class="r"><b>${roomList}</b></td></tr>
    <tr><td>Check-in:</td><td class="r">${format(new Date(booking.checkInDate), 'dd MMM yyyy')}</td></tr>
    <tr><td>Check-out:</td><td class="r">${format(new Date(booking.checkOutDate), 'dd MMM yyyy')}</td></tr>
    <tr><td>Nights:</td><td class="r">${booking.numberOfNights}</td></tr>
    <tr><td>Guests:</td><td class="r">${booking.numberOfGuests}</td></tr>
  </table><hr/>
  ${booking.guestDocument ? `<table>
    <tr><td>Doc Type:</td><td class="r">${booking.guestDocument.docType.replace('_',' ').toUpperCase()}</td></tr>
    <tr><td>Doc No:</td><td class="r">${booking.guestDocument.docNumber}</td></tr>
    ${booking.guestDocument.expiryDate ? `<tr><td>Expiry:</td><td class="r">${format(new Date(booking.guestDocument.expiryDate), 'dd/MM/yyyy')}</td></tr>` : ''}
  </table><hr/>` : ''}
  <p><b>⚠ ID held at front desk</b></p>
  ${lastPay ? `<table><tr><td>Payment Received:</td><td class="r"><b>$${lastPay.amount.toFixed(2)}</b></td></tr>
  <tr><td>Method:</td><td class="r">${lastPay.method}</td></tr></table><hr/>` : ''}
  <p class="c" style="font-size:10px">Scan QR to order room service</p>
  <img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrUrl)}" />
  <p class="c big">Welcome to ${HOTEL}!</p>
  <p class="c" style="font-size:9px">We hope you enjoy your stay.</p>
  </body></html>`;
  const w = window.open('', '_blank', 'width=380,height=580');
  if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
}

function printFullBill(invoice: InvoiceData) {
  const qrUrl = `${window.location.origin}/room-service/${invoice.invoiceNumber.replace('INV-','')}`;
  const html = `<!DOCTYPE html><html><head><title>${invoice.invoiceNumber}</title>
  <style>body{font-family:'Courier New',monospace;font-size:11px;width:300px;margin:0 auto;padding:8px}
  h2{text-align:center;font-size:15px;margin:2px 0}.c{text-align:center}
  hr{border:none;border-top:1px dashed #000;margin:5px 0}
  table{width:100%}td{padding:1px 0}.r{text-align:right}
  .tb td{font-weight:bold;font-size:13px}img.qr{display:block;margin:6px auto;width:110px}
  @media print{body{margin:0}}</style></head><body>
  <h2>${HOTEL}</h2><p class="c">GUEST INVOICE</p>
  <p class="c">${invoice.invoiceNumber}</p><hr/>
  <table>
    <tr><td>Guest:</td><td class="r"><b>${invoice.booking.customerName}</b></td></tr>
    <tr><td>Check-in:</td><td class="r">${format(new Date(invoice.booking.checkInDate),'dd MMM yyyy')}</td></tr>
    <tr><td>Check-out:</td><td class="r">${format(new Date(invoice.booking.checkOutDate),'dd MMM yyyy')}</td></tr>
    <tr><td>Nights:</td><td class="r">${invoice.booking.numberOfNights}</td></tr>
  </table><hr/>
  <b>ROOM CHARGES</b>
  ${invoice.roomCharges.items.map(i=>`<table><tr><td>${i.description}</td><td class="r">$${i.total.toFixed(2)}</td></tr></table>`).join('')}
  ${invoice.roomCharges.discount>0 ? `<table><tr><td>Discount</td><td class="r">-$${invoice.roomCharges.discount.toFixed(2)}</td></tr></table>`:''}
  ${invoice.foodCharges.items.length > 0 ? `<hr/><b>FOOD &amp; BEVERAGES</b>
  ${invoice.foodCharges.items.map(i=>`<table><tr><td>${i.description}×${i.quantity}</td><td class="r">$${i.total.toFixed(2)}</td></tr></table>`).join('')}
  <table><tr><td>Tax (5%)</td><td class="r">$${invoice.foodCharges.tax.toFixed(2)}</td></tr></table>` : ''}
  ${invoice.additionalCharges.items.length > 0 ? `<hr/><b>ADDITIONAL CHARGES</b>
  ${invoice.additionalCharges.items.map(i=>`<table><tr><td>${i.description}×${i.qty}</td><td class="r">$${i.total.toFixed(2)}</td></tr></table>`).join('')}` : ''}
  <hr/>
  <table>
    <tr><td>Room Total</td><td class="r">$${invoice.summary.roomTotal.toFixed(2)}</td></tr>
    ${invoice.summary.foodTotal > 0 ? `<tr><td>Food Total</td><td class="r">$${invoice.summary.foodTotal.toFixed(2)}</td></tr>` : ''}
    ${invoice.summary.additionalTotal > 0 ? `<tr><td>Additional</td><td class="r">$${invoice.summary.additionalTotal.toFixed(2)}</td></tr>` : ''}
    <tr class="tb"><td>GRAND TOTAL</td><td class="r">$${invoice.summary.grandTotal.toFixed(2)}</td></tr>
    <tr><td>Amount Paid</td><td class="r">$${invoice.summary.amountPaid.toFixed(2)}</td></tr>
    <tr class="tb"><td>BALANCE DUE</td><td class="r">$${invoice.summary.balanceDue.toFixed(2)}</td></tr>
  </table>
  ${invoice.payments.length > 0 ? `<hr/><b>PAYMENT HISTORY</b>
  ${invoice.payments.map(p=>`<table><tr><td>${p.method} - $${p.amount.toFixed(2)}</td><td class="r">${format(new Date(p.date),'dd MMM HH:mm')}</td></tr></table>`).join('')}` : ''}
  <hr/>
  <p class="c" style="font-size:10px">Scan to order room service</p>
  <img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(qrUrl)}" />
  <p class="c" style="font-size:9px">Thank you for staying at ${HOTEL}!</p>
  </body></html>`;
  const w = window.open('', '_blank', 'width=400,height=640');
  if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
}

// ── Status helpers ────────────────────────────────────────────────────────────

const statusColor = (s: string) => ({
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  'checked-in': 'bg-blue-100 text-blue-800 border-blue-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'checked-out': 'bg-gray-100 text-gray-700 border-gray-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}[s] ?? 'bg-gray-100 text-gray-600 border-gray-200');

const payColor = (s: string) => ({
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-amber-100 text-amber-700',
  unpaid: 'bg-red-100 text-red-700',
  refunded: 'bg-purple-100 text-purple-700',
}[s] ?? 'bg-gray-100 text-gray-600');

const orderStatusColor = (s: string) => ({
  pending: 'text-yellow-600', approved: 'text-blue-600', preparing: 'text-orange-600',
  ready: 'text-green-600', delivered: 'text-teal-600', completed: 'text-gray-500', cancelled: 'text-red-500',
}[s] ?? 'text-gray-500');

// ── Main component ────────────────────────────────────────────────────────────

export default function BookingManagement() {
  const [mainTab, setMainTab] = useState<'guests' | 'bookings' | 'new' | 'queue'>('guests');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Detail slide-in panel
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [panel, setPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'checkin' | 'roomservice' | 'bill' | 'checkout'>('details');

  // Check-in state
  const [docType, setDocType] = useState('passport');
  const [docNumber, setDocNumber] = useState('');
  const [docExpiry, setDocExpiry] = useState('');
  const [docScan, setDocScan] = useState('');
  const [ciPayAmount, setCiPayAmount] = useState('');
  const [ciPayMethod, setCiPayMethod] = useState('cash');
  const [ciLoading, setCiLoading] = useState(false);

  // Room service state
  const [roomOrders, setRoomOrders] = useState<RoomServiceOrder[]>([]);
  const [rsSearch, setRsSearch] = useState('');
  const [rsCategory, setRsCategory] = useState('all');
  const [rsMealType, setRsMealType] = useState('lunch');
  const [addingItems, setAddingItems] = useState<{ menuItemId: string; quantity: number }[]>([]);
  const [rsLoading, setRsLoading] = useState(false);

  // Invoice / bill state
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [invLoading, setInvLoading] = useState(false);
  const [newCharge, setNewCharge] = useState({ description: '', qty: 1, unitAmount: '' });
  const [editingCharge, setEditingCharge] = useState<string | null>(null);

  // Checkout state
  const [coAmount, setCoAmount] = useState('');
  const [coMethod, setCoMethod] = useState('cash');
  const [coNotes, setCoNotes] = useState('');
  const [returnDoc, setReturnDoc] = useState(true);
  const [coLoading, setCoLoading] = useState(false);

  // New booking form
  const [nb, setNb] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    checkInDate: '', checkOutDate: '', numberOfGuests: 1,
    roomId: '', promoCode: '', customerId: 'guest',
  });
  const [nbLoading, setNbLoading] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, rRes, mRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/rooms'),
        fetch('/api/restaurant/menu'),
      ]);
      const [b, r, m] = await Promise.all([bRes.json(), rRes.json(), mRes.json()]);
      if (b.success) setBookings(b.data);
      if (r.success) setRooms(r.data);
      if (m.success) setMenuItems(m.data.filter((x: MenuItem) => x.available));
    } catch { toast.error('Failed to load data'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openPanel = (booking: Booking, tab: typeof activeTab = 'details') => {
    setSelectedBooking(booking);
    setActiveTab(tab);
    setPanel(true);
    setInvoice(null);
    setRoomOrders([]);
    setAddingItems([]);
    setDocType('passport'); setDocNumber(''); setDocExpiry(''); setDocScan('');
    setCiPayAmount(''); setCiPayMethod('cash');
    setCoAmount(''); setCoMethod('cash'); setCoNotes(''); setReturnDoc(true);
    setNewCharge({ description: '', qty: 1, unitAmount: '' });
    if (tab === 'roomservice') fetchRoomOrders(booking._id);
    if (tab === 'bill' || tab === 'checkout') fetchInvoice(booking._id);
  };

  const handleTabChange = (t: typeof activeTab) => {
    setActiveTab(t);
    if (!selectedBooking) return;
    if (t === 'roomservice') fetchRoomOrders(selectedBooking._id);
    if (t === 'bill' || t === 'checkout') fetchInvoice(selectedBooking._id);
  };

  const fetchRoomOrders = async (bookingId: string) => {
    const res = await fetch(`/api/bookings/${bookingId}/room-service`);
    const d = await res.json();
    if (d.success) setRoomOrders(d.data);
  };

  const fetchInvoice = useCallback(async (bookingId: string) => {
    setInvLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/invoice`);
      const d = await res.json();
      if (d.success) setInvoice(d.data);
      else toast.error(d.error || 'Failed to load invoice');
    } finally { setInvLoading(false); }
  }, []);

  // ── Check-in ──────────────────────────────────────────────────────────────

  const handleCheckIn = async () => {
    if (!selectedBooking || !docNumber.trim()) { toast.error('Document number required'); return; }
    setCiLoading(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBooking._id}/checkin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType, docNumber, expiryDate: docExpiry || undefined, scanUrl: docScan || undefined,
          checkInPayment: ciPayAmount && parseFloat(ciPayAmount) > 0
            ? { amount: parseFloat(ciPayAmount), method: ciPayMethod } : undefined,
        }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success('Guest checked in');
        const updated = { ...selectedBooking, status: 'checked-in' as const, guestDocument: d.data.guestDocument, amountPaid: d.data.amountPaid, payments: d.data.payments };
        setSelectedBooking(updated);
        fetchAll();
        // Auto print check-in receipt
        const bookingRooms = rooms.filter(r => selectedBooking.roomIds.includes(r._id));
        printCheckInReceipt(updated, bookingRooms);
        setActiveTab('details');
      } else { toast.error(d.error); }
    } catch { toast.error('Check-in failed'); } finally { setCiLoading(false); }
  };

  // ── Room service ──────────────────────────────────────────────────────────

  const addItemQty = (id: string) => addingItems.find(i => i.menuItemId === id)?.quantity || 0;
  const updateAddItem = (menuItemId: string, delta: number) => {
    const cur = addItemQty(menuItemId);
    const q = Math.max(0, cur + delta);
    if (q === 0) setAddingItems(ai => ai.filter(i => i.menuItemId !== menuItemId));
    else {
      const exists = addingItems.find(i => i.menuItemId === menuItemId);
      if (exists) setAddingItems(ai => ai.map(i => i.menuItemId === menuItemId ? { ...i, quantity: q } : i));
      else setAddingItems(ai => [...ai, { menuItemId, quantity: q }]);
    }
  };

  const handlePlaceRSOrder = async () => {
    if (!selectedBooking) return;
    const items = addingItems.filter(i => i.menuItemId && i.quantity > 0);
    if (!items.length) { toast.error('Select at least one item'); return; }
    setRsLoading(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBooking._id}/room-service`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealType: rsMealType, items }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success('Order placed and charged to room');
        setAddingItems([]);
        setRoomOrders((current) => (d.data ? [d.data, ...current] : current));
        fetchRoomOrders(selectedBooking._id);
        fetchInvoice(selectedBooking._id);
      }
      else toast.error(d.error);
    } catch { toast.error('Failed to place order'); } finally { setRsLoading(false); }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    if (!selectedBooking) return;
    const res = await fetch(`/api/bookings/${selectedBooking._id}/room-service?orderId=${orderId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    const d = await res.json();
    if (d.success) {
      fetchRoomOrders(selectedBooking._id);
      fetchInvoice(selectedBooking._id);
    }
  };

  // ── Additional charges ────────────────────────────────────────────────────

  const addCharge = async () => {
    if (!selectedBooking || !newCharge.description.trim() || !newCharge.unitAmount) return;
    const res = await fetch(`/api/bookings/${selectedBooking._id}/charges`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: newCharge.description, qty: newCharge.qty, unitAmount: parseFloat(newCharge.unitAmount) }),
    });
    const d = await res.json();
    if (d.success) { toast.success('Charge added'); setNewCharge({ description: '', qty: 1, unitAmount: '' }); fetchInvoice(selectedBooking._id); }
    else toast.error(d.error);
  };

  const deleteCharge = async (chargeId: string) => {
    if (!selectedBooking) return;
    const res = await fetch(`/api/bookings/${selectedBooking._id}/charges?chargeId=${chargeId}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) { fetchInvoice(selectedBooking._id); fetchAll(); }
  };

  // ── Checkout ──────────────────────────────────────────────────────────────

  const handleCheckout = async () => {
    if (!selectedBooking || !coAmount || parseFloat(coAmount) <= 0) { toast.error('Enter a valid amount'); return; }
    setCoLoading(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBooking._id}/checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentAmount: parseFloat(coAmount), paymentMethod: coMethod, notes: coNotes, returnDocument: returnDoc }),
      });
      const d = await res.json();
      if (d.success) {
        if (d.checkedOut) {
          toast.success('Checkout complete — document returned to guest');
          setSelectedBooking({ ...selectedBooking, status: 'checked-out' });
          // Print final bill
          await fetchInvoice(selectedBooking._id);
        } else {
          toast.success(`$${parseFloat(coAmount).toFixed(2)} recorded. Balance: $${d.balanceDue?.toFixed(2)}`);
        }
        fetchAll(); fetchInvoice(selectedBooking._id); setCoAmount(''); setCoNotes('');
      } else toast.error(d.error);
    } catch { toast.error('Checkout failed'); } finally { setCoLoading(false); }
  };

  // ── New booking ───────────────────────────────────────────────────────────

  const handleNewBooking = async () => {
    if (!nb.customerName || !nb.customerPhone || !nb.checkInDate || !nb.checkOutDate || !nb.roomId) {
      toast.error('Fill in all required fields'); return;
    }
    setNbLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: nb.customerId || 'guest',
          customerName: nb.customerName,
          customerEmail: nb.customerEmail || `${nb.customerPhone}@guest.hotel`,
          customerPhone: nb.customerPhone,
          roomIds: [nb.roomId],
          checkInDate: nb.checkInDate,
          checkOutDate: nb.checkOutDate,
          numberOfGuests: nb.numberOfGuests,
          promoCode: nb.promoCode,
        }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success('Booking created');
        setNb({ customerName:'',customerEmail:'',customerPhone:'',checkInDate:'',checkOutDate:'',numberOfGuests:1,roomId:'',promoCode:'',customerId:'guest' });
        fetchAll();
        setMainTab('bookings');
      } else toast.error(d.error);
    } catch { toast.error('Failed to create booking'); } finally { setNbLoading(false); }
  };

  const updateStatus = async (bookingId: string, status: string, paymentStatus?: string) => {
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(paymentStatus && { paymentStatus }) }),
    });
    const d = await res.json();
    if (d.success) { toast.success('Updated'); fetchAll(); }
    else toast.error(d.error);
  };

  // ── Computed values ───────────────────────────────────────────────────────

  const checkedIn = bookings.filter(b => b.status === 'checked-in');
  const activeRoomCount = checkedIn.reduce((s, b) => s + (b.roomIds?.length || 0), 0);
  const availableRooms = rooms.filter(r => r.isAvailable);

  const filteredBookings = bookings.filter(b => {
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || b.customerName.toLowerCase().includes(q) ||
      b.bookingId.toLowerCase().includes(q) || b.customerPhone.includes(q) ||
      (b.customerEmail || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const menuCategories = ['all', ...Array.from(new Set(menuItems.map(m => m.category)))];
  const filteredMenu = menuItems.filter(m =>
    (rsCategory === 'all' || m.category === rsCategory) &&
    m.name.toLowerCase().includes(rsSearch.toLowerCase())
  );

  const pendingRoomServiceSelection = addingItems.reduce((sum, item) => {
    const menuItem = menuItems.find((menu) => menu._id === item.menuItemId);
    return sum + (menuItem ? menuItem.price * item.quantity : 0);
  }, 0);

  const nbNights = nb.checkInDate && nb.checkOutDate
    ? Math.max(0, differenceInDays(new Date(nb.checkOutDate), new Date(nb.checkInDate)))
    : 0;
  const selectedRoomInfo = rooms.find(r => r._id === nb.roomId);
  const nbTotal = selectedRoomInfo ? selectedRoomInfo.pricePerNight * nbNights : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Room occupancy bar */}
      <div className="flex items-center justify-between rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-blue-800">{activeRoomCount}/30 Rooms Active</span>
          </div>
          <div className="h-2 w-32 rounded-full bg-blue-200 overflow-hidden">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.min(100, (activeRoomCount / 30) * 100)}%` }} />
          </div>
          <span className="text-muted-foreground">{checkedIn.length} guests checked in</span>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchAll}><RefreshCw className="h-3.5 w-3.5" /></Button>
      </div>

      {/* Main tabs */}
      <Tabs value={mainTab} onValueChange={v => setMainTab(v as typeof mainTab)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="guests"><BedDouble className="mr-1.5 h-3.5 w-3.5" />Today's Guests</TabsTrigger>
          <TabsTrigger value="bookings"><Calendar className="mr-1.5 h-3.5 w-3.5" />All Bookings</TabsTrigger>
          <TabsTrigger value="new"><Plus className="mr-1.5 h-3.5 w-3.5" />New Booking</TabsTrigger>
          <TabsTrigger value="queue"><UtensilsCrossed className="mr-1.5 h-3.5 w-3.5" />Orders Queue</TabsTrigger>
        </TabsList>

        {/* ══ TODAY'S GUESTS ═══════════════════════════════════════════════ */}
        <TabsContent value="guests" className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-10">Loading...</p>
          ) : checkedIn.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BedDouble className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No guests currently checked in</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {checkedIn.map(b => {
                const checkoutDays = differenceInDays(new Date(b.checkOutDate), new Date());
                const checkoutHours = differenceInHours(new Date(b.checkOutDate), new Date());
                const checkoutSoon = checkoutHours <= 24 && checkoutHours > 0;
                const overdue = checkoutHours < 0;
                const bookingRooms = rooms.filter(r => b.roomIds.includes(r._id));
                return (
                  <div key={b._id} className={`rounded-xl border-2 p-4 space-y-3 transition-all hover:shadow-md ${
                    overdue ? 'border-red-400 bg-red-50' : checkoutSoon ? 'border-amber-400 bg-amber-50' : 'border-border bg-card'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-base">{b.customerName}</p>
                        <p className="text-xs text-muted-foreground">{b.customerPhone}</p>
                      </div>
                      <div className="flex gap-1 text-xs">
                        <span className={`rounded-full px-2 py-0.5 font-medium ${payColor(b.paymentStatus)}`}>{b.paymentStatus}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {bookingRooms.map(r => (
                        <span key={r._id} className="rounded-lg bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-bold">
                          {r.roomNumber}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                      <div><Clock className="inline h-3 w-3 mr-1" />In: {format(new Date(b.checkInDate), 'dd MMM')}</div>
                      <div className={checkoutSoon || overdue ? 'font-medium text-red-600' : ''}>
                        <Clock className="inline h-3 w-3 mr-1" />
                        Out: {format(new Date(b.checkOutDate), 'dd MMM')}
                        {checkoutSoon && ` (${checkoutHours}h left)`}
                        {overdue && ' (OVERDUE)'}
                      </div>
                      <div><Users className="inline h-3 w-3 mr-1" />{b.numberOfGuests} guests</div>
                      <div><BedDouble className="inline h-3 w-3 mr-1" />{b.numberOfNights} nights</div>
                    </div>

                    {b.guestDocument && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <IdCard className="h-3 w-3 text-amber-600 shrink-0" />
                        <span className="text-amber-700 font-medium">
                          {b.guestDocument.docType.replace('_',' ').toUpperCase()} — {b.guestDocument.docNumber}
                        </span>
                        {!b.guestDocument.isReturned && <span className="text-red-500">(held)</span>}
                      </div>
                    )}

                    <div className="flex gap-1 pt-1">
                      <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => openPanel(b, 'details')}>
                        <Eye className="h-3 w-3 mr-1" />View
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => openPanel(b, 'roomservice')}>
                        <UtensilsCrossed className="h-3 w-3 mr-1" />Order
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => openPanel(b, 'bill')}>
                        <FileText className="h-3 w-3 mr-1" />Bill
                      </Button>
                      <Button size="sm" className="h-7 text-xs flex-1 bg-red-600 hover:bg-red-700" onClick={() => openPanel(b, 'checkout')}>
                        <LogOut className="h-3 w-3 mr-1" />Out
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ══ ALL BOOKINGS ═════════════════════════════════════════════════ */}
        <TabsContent value="bookings" className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="pl-8 h-8 text-sm" placeholder="Search name, ID, phone, email…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['all','pending','confirmed','checked-in','checked-out','cancelled'].map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s === 'all' ? 'All Statuses' : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground shrink-0">{filteredBookings.length} bookings</span>
          </div>

          {loading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : (
            <div className="space-y-2">
              {filteredBookings.length === 0 && <p className="text-center text-muted-foreground py-10">No bookings found</p>}
              {filteredBookings.map(b => (
                <div key={b._id} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="font-semibold text-sm">{b.customerName}</span>
                      <span className="text-xs text-muted-foreground">{b.bookingId}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(b.status)}`}>{b.status}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${payColor(b.paymentStatus)}`}>{b.paymentStatus}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span><Phone className="inline h-3 w-3 mr-0.5" />{b.customerPhone}</span>
                      <span><Calendar className="inline h-3 w-3 mr-0.5" />{format(new Date(b.checkInDate),'MMM dd')} → {format(new Date(b.checkOutDate),'MMM dd')}</span>
                      <span><BedDouble className="inline h-3 w-3 mr-0.5" />{b.roomIds?.length || 0} room · {b.numberOfNights}n</span>
                      <span className="font-medium text-foreground"><DollarSign className="inline h-3 w-3" />{(b.totalAmount - (b.discountAmount||0)).toFixed(0)}</span>
                      {(b.amountPaid || 0) > 0 && <span className="text-green-600">Paid: ${b.amountPaid.toFixed(0)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openPanel(b)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    {b.status === 'pending' && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Confirm" onClick={() => updateStatus(b._id, 'confirmed')}>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                    {(b.status === 'pending' || b.status === 'confirmed') && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Cancel" onClick={() => updateStatus(b._id, 'cancelled')}>
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ══ NEW BOOKING ══════════════════════════════════════════════════ */}
        <TabsContent value="new" className="space-y-4">
          <div className="rounded-xl border p-5 space-y-4 max-w-2xl">
            <h3 className="font-semibold text-base">New Room Booking</h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 col-span-2 sm:col-span-1"><Label>Guest Name *</Label>
                <Input value={nb.customerName} onChange={e => setNb(n=>({...n,customerName:e.target.value}))} placeholder="Full name" />
              </div>
              <div className="space-y-1.5"><Label>Phone *</Label>
                <Input value={nb.customerPhone} onChange={e => setNb(n=>({...n,customerPhone:e.target.value}))} placeholder="+1 234 567 8900" />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1"><Label>Email</Label>
                <Input type="email" value={nb.customerEmail} onChange={e => setNb(n=>({...n,customerEmail:e.target.value}))} placeholder="guest@email.com" />
              </div>
              <div className="space-y-1.5"><Label>Number of Guests</Label>
                <Input type="number" min={1} value={nb.numberOfGuests} onChange={e => setNb(n=>({...n,numberOfGuests:parseInt(e.target.value)||1}))} />
              </div>
              <div className="space-y-1.5"><Label>Check-in Date *</Label>
                <Input type="date" value={nb.checkInDate} onChange={e => setNb(n=>({...n,checkInDate:e.target.value}))} />
              </div>
              <div className="space-y-1.5"><Label>Check-out Date *</Label>
                <Input type="date" value={nb.checkOutDate} onChange={e => setNb(n=>({...n,checkOutDate:e.target.value}))} />
              </div>
              <div className="space-y-1.5 col-span-2"><Label>Select Room * ({availableRooms.length} available)</Label>
                <Select value={nb.roomId} onValueChange={v => setNb(n=>({...n,roomId:v}))}>
                  <SelectTrigger><SelectValue placeholder="Choose an available room…" /></SelectTrigger>
                  <SelectContent>
                    {availableRooms.map(r => (
                      <SelectItem key={r._id} value={r._id}>
                        Room {r.roomNumber} — {r.category} · {r.capacity} guests · ${r.pricePerNight}/night
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Promo Code</Label>
                <Input value={nb.promoCode} onChange={e => setNb(n=>({...n,promoCode:e.target.value}))} placeholder="WELCOME10, WELCOME20" />
              </div>
            </div>

            {selectedRoomInfo && nbNights > 0 && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm space-y-1">
                <p className="font-semibold text-blue-800">Booking Summary</p>
                <div className="flex justify-between"><span>Room {selectedRoomInfo.roomNumber} ({selectedRoomInfo.category})</span><span>${selectedRoomInfo.pricePerNight}/night</span></div>
                <div className="flex justify-between"><span>Nights</span><span>× {nbNights}</span></div>
                <div className="flex justify-between font-bold text-blue-900 border-t border-blue-200 pt-1"><span>Estimated Total</span><span>${nbTotal.toFixed(2)}</span></div>
              </div>
            )}

            {activeRoomCount >= 30 && (
              <div className="rounded-lg bg-red-50 border border-red-300 p-3 text-sm text-red-700">
                ⚠ Hotel has reached the 30-room active limit. Check out a guest first before creating a new booking.
              </div>
            )}

            <Button className="w-full" onClick={handleNewBooking} disabled={nbLoading || !nb.customerName || !nb.checkInDate || !nb.checkOutDate || !nb.roomId || activeRoomCount >= 30}>
              <Calendar className="mr-2 h-4 w-4" />
              {nbLoading ? 'Creating…' : 'Create Booking'}
            </Button>
          </div>
        </TabsContent>

        {/* ══ ORDERS QUEUE ═════════════════════════════════════════════════ */}
        <TabsContent value="queue">
          <RoomServiceQueue />
        </TabsContent>
      </Tabs>

      {/* ══ DETAIL SLIDE-IN PANEL ═══════════════════════════════════════════ */}
      {panel && selectedBooking && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPanel(false)} />
          <div className="relative bg-background w-full sm:w-[540px] h-full flex flex-col shadow-2xl overflow-hidden">

            {/* Panel header */}
            <div className="border-b bg-background px-4 py-3 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-bold">{selectedBooking.customerName}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{selectedBooking.bookingId}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(selectedBooking.status)}`}>{selectedBooking.status}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${payColor(selectedBooking.paymentStatus)}`}>{selectedBooking.paymentStatus}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPanel(false)}><XCircle className="h-5 w-5" /></Button>
            </div>

            {/* Panel tabs */}
            <div className="border-b shrink-0 overflow-x-auto">
              <div className="flex px-2 pt-1 gap-0.5 min-w-max">
                {(
                  [
                    { id: 'details', label: 'Details', icon: Eye },
                    ...((selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') ? [{ id: 'checkin', label: 'Check-in', icon: LogIn }] : []),
                    ...(selectedBooking.status === 'checked-in' ? [{ id: 'roomservice', label: 'Room Service', icon: UtensilsCrossed }] : []),
                    { id: 'bill', label: 'Bill', icon: FileText },
                    ...(selectedBooking.status === 'checked-in' ? [{ id: 'checkout', label: 'Checkout', icon: LogOut }] : []),
                  ] as { id: string; label: string; icon: any }[]
                ).map(t => (
                  <button key={t.id}
                    onClick={() => handleTabChange(t.id as typeof activeTab)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === t.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}>
                    <t.icon className="h-3.5 w-3.5" />{t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto p-4">

              {/* ── DETAILS ─────────────────────────────────────────────── */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Guest', selectedBooking.customerName],
                      ['Phone', selectedBooking.customerPhone],
                      ['Email', selectedBooking.customerEmail || '—'],
                      ['Guests', String(selectedBooking.numberOfGuests)],
                      ['Check-in', format(new Date(selectedBooking.checkInDate), 'dd MMM yyyy') + (selectedBooking.checkInTime ? ' ' + format(new Date(selectedBooking.checkInTime), 'HH:mm') : '')],
                      ['Check-out', format(new Date(selectedBooking.checkOutDate), 'dd MMM yyyy') + (selectedBooking.checkOutTime ? ' ' + format(new Date(selectedBooking.checkOutTime), 'HH:mm') : '')],
                      ['Nights', String(selectedBooking.numberOfNights)],
                      ['Rooms', `${selectedBooking.roomIds?.length || 0} room(s)`],
                    ].map(([l, v]) => (
                      <div key={l}><p className="text-xs text-muted-foreground">{l}</p><p className="font-medium">{v}</p></div>
                    ))}
                  </div>

                  {/* Rooms assigned */}
                  {selectedBooking.roomIds?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned Rooms</p>
                      <div className="flex flex-wrap gap-2">
                        {rooms.filter(r => selectedBooking.roomIds.includes(r._id)).map(r => (
                          <div key={r._id} className="rounded-lg border bg-blue-50 border-blue-200 px-3 py-2 text-xs">
                            <p className="font-bold text-blue-800">Room {r.roomNumber}</p>
                            <p className="text-blue-600">{r.category} · ${r.pricePerNight}/night</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Document */}
                  {selectedBooking.guestDocument && (
                    <div className="rounded-lg border bg-amber-50 border-amber-200 p-3 space-y-1.5 text-sm">
                      <p className="font-semibold flex items-center gap-1.5 text-amber-800">
                        <IdCard className="h-4 w-4" />Guest Document {selectedBooking.guestDocument.isReturned ? '— RETURNED' : '— HELD AT FRONT DESK'}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-xs text-muted-foreground">Type: </span><span className="font-medium">{selectedBooking.guestDocument.docType.replace('_',' ').toUpperCase()}</span></div>
                        <div><span className="text-xs text-muted-foreground">Number: </span><span className="font-medium">{selectedBooking.guestDocument.docNumber}</span></div>
                        {selectedBooking.guestDocument.expiryDate && (
                          <div><span className="text-xs text-muted-foreground">Expiry: </span><span>{format(new Date(selectedBooking.guestDocument.expiryDate),'dd MMM yyyy')}</span></div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment summary */}
                  <div className="rounded-lg border p-3 space-y-1 text-sm">
                    <div className="flex justify-between"><span>Room Total</span><span>${selectedBooking.totalAmount.toFixed(2)}</span></div>
                    {(selectedBooking.discountAmount||0) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-${selectedBooking.discountAmount.toFixed(2)}</span></div>}
                    {(selectedBooking.amountPaid||0) > 0 && <div className="flex justify-between text-blue-600"><span>Amount Paid</span><span>${selectedBooking.amountPaid.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-bold border-t pt-1"><span>Net Due</span><span>${(selectedBooking.totalAmount-(selectedBooking.discountAmount||0)-(selectedBooking.amountPaid||0)).toFixed(2)}</span></div>
                  </div>

                  {/* Payment history */}
                  {(selectedBooking.payments?.length || 0) > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment History</p>
                      {selectedBooking.payments!.map((p, i) => (
                        <div key={i} className="flex justify-between text-sm rounded bg-muted/30 px-3 py-1.5">
                          <span>{p.method.replace('_',' ')} — ${p.amount.toFixed(2)}{p.notes && ` (${p.notes})`}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(p.date),'MMM dd, HH:mm')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick actions */}
                  {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                    <div className="flex gap-2">
                      {selectedBooking.status === 'pending' && (
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => { updateStatus(selectedBooking._id, 'confirmed'); setSelectedBooking({...selectedBooking, status: 'confirmed'}); }}>
                          <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" />Confirm
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="flex-1 text-red-500" onClick={() => { updateStatus(selectedBooking._id, 'cancelled'); setPanel(false); }}>
                        <XCircle className="h-3.5 w-3.5 mr-1" />Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* ── CHECK-IN ─────────────────────────────────────────────── */}
              {activeTab === 'checkin' && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                    <p className="font-semibold mb-1">🏨 Front Desk Check-in</p>
                    <p>Capture guest ID/Passport (held at front desk until checkout), collect initial payment, then print thermal check-in receipt with room service QR.</p>
                  </div>

                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Guest Document</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Document Type *</Label>
                      <Select value={docType} onValueChange={setDocType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="id_card">National ID Card</SelectItem>
                          <SelectItem value="driving_license">Driving License</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label>Document Number *</Label>
                      <Input value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="e.g. A12345678" />
                    </div>
                    <div className="space-y-1.5"><Label>Expiry Date</Label>
                      <Input type="date" value={docExpiry} onChange={e => setDocExpiry(e.target.value)} />
                    </div>
                    <div className="space-y-1.5"><Label>Scan URL (optional)</Label>
                      <Input value={docScan} onChange={e => setDocScan(e.target.value)} placeholder="https://…" />
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Check-in Payment</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Amount Collected ($)</Label>
                      <Input type="number" min={0} step={0.01} value={ciPayAmount} onChange={e => setCiPayAmount(e.target.value)} placeholder="0.00 (optional)" />
                    </div>
                    <div className="space-y-1.5"><Label>Payment Method</Label>
                      <Select value={ciPayMethod} onValueChange={setCiPayMethod}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                    <IdCard className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Guest document will be <strong>held at the front desk</strong> and returned upon checkout after all bills are settled.</span>
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleCheckIn} disabled={ciLoading || !docNumber.trim()}>
                    <LogIn className="mr-2 h-4 w-4" />
                    {ciLoading ? 'Checking in…' : 'Confirm Check-in & Print Receipt'}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">A thermal receipt will print automatically with a QR code for room service ordering.</p>
                </div>
              )}

              {/* ── ROOM SERVICE ─────────────────────────────────────────── */}
              {activeTab === 'roomservice' && (
                <div className="space-y-4">
                  {/* Place order */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select value={rsMealType} onValueChange={setRsMealType}>
                        <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['breakfast','lunch','dinner','snack','beverages'].map(t => (
                            <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="relative flex-1 min-w-[160px]">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input className="pl-8 h-8 text-sm" placeholder="Search menu…" value={rsSearch} onChange={e => setRsSearch(e.target.value)} />
                      </div>
                      <Select value={rsCategory} onValueChange={setRsCategory}>
                        <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {menuCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{c === 'all' ? 'All' : c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto">
                      {filteredMenu.map(item => {
                        const qty = addItemQty(item._id);
                        return (
                          <div key={item._id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">{item.name}</span>
                              <span className="ml-1.5 text-xs text-muted-foreground capitalize">({item.category})</span>
                              {item.vegetarian && <span className="ml-1 text-xs text-green-600">🌿</span>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-semibold">${item.price.toFixed(2)}</span>
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

                    {addingItems.length > 0 && (
                      <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Current {rsMealType} order</span>
                          <span>${pendingRoomServiceSelection.toFixed(2)}</span>
                        </div>
                        <Button size="sm" className="w-full" onClick={handlePlaceRSOrder} disabled={rsLoading}>
                          <UtensilsCrossed className="mr-1.5 h-3.5 w-3.5" />
                          {rsLoading ? 'Placing…' : `Place ${rsMealType} order — ${addingItems.reduce((s,i)=>s+i.quantity,0)} item(s) (charged to room)`}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Order history */}
                  {roomOrders.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order History</p>
                      {roomOrders.map(order => (
                        <div key={order._id} className="rounded-lg border p-3 space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">{order.mealType}</span>
                              <span className={`text-xs font-semibold ${orderStatusColor(order.status)}`}>{order.status}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{format(new Date(order.orderTime),'MMM dd, HH:mm')}</span>
                          </div>
                          <div className="space-y-0.5 text-muted-foreground text-xs">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex justify-between">
                                <span>{item.itemName} × {item.quantity}{item.specialInstructions && ` (${item.specialInstructions})`}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between border-t pt-1.5">
                            <span className="font-semibold">Total: ${order.total.toFixed(2)}</span>
                            <div className="flex gap-1">
                              {order.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => updateOrderStatus(order._id, 'approved')}>Approve</Button>
                                  <Button size="sm" variant="ghost" className="h-6 text-xs text-red-500" onClick={() => updateOrderStatus(order._id, 'cancelled')}>Cancel</Button>
                                </>
                              )}
                              {order.status === 'approved' && <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => updateOrderStatus(order._id, 'preparing')}>Start Prep</Button>}
                              {order.status === 'preparing' && <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => updateOrderStatus(order._id, 'ready')}>Ready</Button>}
                              {order.status === 'ready' && <Button size="sm" className="h-6 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateOrderStatus(order._id, 'delivered')}>Delivered</Button>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {roomOrders.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">No room service orders yet</p>}
                </div>
              )}

              {/* ── BILL (editable) ──────────────────────────────────────── */}
              {activeTab === 'bill' && (
                <div className="space-y-4">
                  {invLoading ? (
                    <p className="text-center text-muted-foreground py-8">Loading bill…</p>
                  ) : invoice ? (
                    <>
                      {/* Room charges */}
                      <div className="rounded-lg border p-3 space-y-2 text-sm">
                        <p className="font-semibold text-sm">Room Charges</p>
                        {invoice.roomCharges.items.map((item, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="text-muted-foreground">{item.description}</span>
                            <span>${item.total.toFixed(2)}</span>
                          </div>
                        ))}
                        {invoice.roomCharges.discount > 0 && (
                          <div className="flex justify-between text-green-600"><span>Discount</span><span>-${invoice.roomCharges.discount.toFixed(2)}</span></div>
                        )}
                        <div className="flex justify-between font-semibold border-t pt-1"><span>Room Total</span><span>${invoice.roomCharges.total.toFixed(2)}</span></div>
                      </div>

                      {/* Food charges */}
                      {invoice.foodCharges.items.length > 0 && (
                        <div className="rounded-lg border p-3 space-y-2 text-sm">
                          <p className="font-semibold">Room Service</p>
                          {invoice.foodCharges.items.map((item, i) => (
                            <div key={i} className="flex justify-between">
                              <span className="text-muted-foreground">{item.description} × {item.quantity}</span>
                              <span>${item.total.toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-muted-foreground"><span>Tax (5%)</span><span>${invoice.foodCharges.tax.toFixed(2)}</span></div>
                          <div className="flex justify-between font-semibold border-t pt-1"><span>Food Total</span><span>${invoice.foodCharges.total.toFixed(2)}</span></div>
                        </div>
                      )}

                      {/* Additional charges (editable) */}
                      <div className="rounded-lg border p-3 space-y-2 text-sm">
                        <p className="font-semibold flex items-center gap-2">
                          Additional Charges
                          <span className="text-xs text-muted-foreground font-normal">(minibar, phone, extra services…)</span>
                        </p>
                        {invoice.additionalCharges.items.map((c, i) => (
                          <div key={i} className="flex items-center gap-2">
                            {editingCharge === c.id ? (
                              <div className="flex flex-1 gap-1">
                                <Input className="h-7 text-xs flex-1" defaultValue={c.description}
                                  onBlur={async (e) => {
                                    if (!selectedBooking || !c.id) return;
                                    const res = await fetch(`/api/bookings/${selectedBooking._id}/charges`, {
                                      method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ chargeId: c.id, description: e.target.value }),
                                    });
                                    const d = await res.json();
                                    if (d.success) { fetchInvoice(selectedBooking._id); setEditingCharge(null); }
                                  }} />
                              </div>
                            ) : (
                              <span className="flex-1 text-muted-foreground">{c.description} × {c.qty}</span>
                            )}
                            <span className="font-medium">${c.total.toFixed(2)}</span>
                            <button onClick={() => setEditingCharge(editingCharge === c.id ? null : (c.id || null))} className="text-blue-500 hover:text-blue-700">
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => c.id && deleteCharge(c.id)} className="text-red-400 hover:text-red-600">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}

                        {/* Add charge form */}
                        <div className="grid grid-cols-[1fr_60px_80px_auto] gap-1.5 pt-2 border-t">
                          <Input className="h-7 text-xs" placeholder="Description" value={newCharge.description} onChange={e => setNewCharge(c=>({...c,description:e.target.value}))} />
                          <Input className="h-7 text-xs" type="number" min={1} placeholder="Qty" value={newCharge.qty} onChange={e => setNewCharge(c=>({...c,qty:parseInt(e.target.value)||1}))} />
                          <Input className="h-7 text-xs" type="number" min={0} step={0.01} placeholder="$/unit" value={newCharge.unitAmount} onChange={e => setNewCharge(c=>({...c,unitAmount:e.target.value}))} />
                          <Button size="sm" className="h-7 px-2" onClick={addCharge} disabled={!newCharge.description.trim() || !newCharge.unitAmount}>
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {invoice.additionalCharges.total > 0 && (
                          <div className="flex justify-between font-semibold border-t pt-1"><span>Additional Total</span><span>${invoice.additionalCharges.total.toFixed(2)}</span></div>
                        )}
                      </div>

                      {/* Grand summary */}
                      <div className="rounded-xl border-2 border-primary p-3 space-y-1.5 text-sm">
                        <div className="flex justify-between"><span>Room Total</span><span>${invoice.summary.roomTotal.toFixed(2)}</span></div>
                        {invoice.summary.foodTotal > 0 && <div className="flex justify-between"><span>Food & Beverages</span><span>${invoice.summary.foodTotal.toFixed(2)}</span></div>}
                        {invoice.summary.additionalTotal > 0 && <div className="flex justify-between"><span>Additional Charges</span><span>${invoice.summary.additionalTotal.toFixed(2)}</span></div>}
                        <div className="flex justify-between font-bold text-base border-t pt-1.5"><span>Grand Total</span><span>${invoice.summary.grandTotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-green-600"><span>Amount Paid</span><span>-${invoice.summary.amountPaid.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold text-red-600 text-base"><span>Balance Due</span><span>${invoice.summary.balanceDue.toFixed(2)}</span></div>
                      </div>

                      {/* Payment history */}
                      {invoice.payments.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payments</p>
                          {invoice.payments.map((p, i) => (
                            <div key={i} className="flex justify-between text-sm rounded bg-muted/30 px-3 py-1">
                              <span>{p.method.replace('_',' ')} — ${p.amount.toFixed(2)}{p.notes && ` (${p.notes})`}</span>
                              <span className="text-xs text-muted-foreground">{format(new Date(p.date),'MMM dd, HH:mm')}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Print */}
                      <Button className="w-full" variant="outline" onClick={() => printFullBill(invoice)}>
                        <Printer className="mr-2 h-4 w-4" /><QrCode className="mr-2 h-4 w-4" />Print Bill with QR Code
                      </Button>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-6">No invoice data</p>
                  )}
                </div>
              )}

              {/* ── CHECKOUT ─────────────────────────────────────────────── */}
              {activeTab === 'checkout' && (
                <div className="space-y-4">
                  {invoice && (
                    <div className="rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 p-4 space-y-1.5 text-sm">
                      <p className="font-bold text-base text-red-800">Final Settlement</p>
                      <div className="flex justify-between"><span>Grand Total</span><span className="font-semibold">${invoice.summary.grandTotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-green-700"><span>Paid So Far</span><span>${invoice.summary.amountPaid.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold text-red-700 border-t border-red-200 pt-1.5 text-base">
                        <span>Balance Due</span><span>${invoice.summary.balanceDue.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Payment Amount *</Label>
                      <Input type="number" min={0} step={0.01} value={coAmount} onChange={e => setCoAmount(e.target.value)}
                        placeholder={invoice ? `$${invoice.summary.balanceDue.toFixed(2)}` : '0.00'} />
                    </div>
                    <div className="space-y-1.5"><Label>Payment Method *</Label>
                      <Select value={coMethod} onValueChange={setCoMethod}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['cash','card','upi','wallet','bank_transfer'].map(m => (
                            <SelectItem key={m} value={m} className="capitalize">{m.replace('_',' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5"><Label>Notes (optional)</Label>
                    <Input value={coNotes} onChange={e => setCoNotes(e.target.value)} placeholder="e.g. partial payment, rest by card" />
                  </div>

                  {selectedBooking.guestDocument && !selectedBooking.guestDocument.isReturned && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-center gap-3">
                      <IdCard className="h-5 w-5 text-amber-600 shrink-0" />
                      <div className="flex-1 text-sm">
                        <p className="font-semibold text-amber-800">Document at front desk:</p>
                        <p className="text-amber-700">{selectedBooking.guestDocument.docType.replace('_',' ').toUpperCase()} — {selectedBooking.guestDocument.docNumber}</p>
                      </div>
                      <label className="flex items-center gap-1.5 text-sm text-amber-800 cursor-pointer">
                        <input type="checkbox" checked={returnDoc} onChange={e => setReturnDoc(e.target.checked)} className="h-4 w-4" />
                        Return to guest
                      </label>
                    </div>
                  )}

                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleCheckout} disabled={coLoading || !coAmount}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {coLoading ? 'Processing…' : invoice && parseFloat(coAmount) >= invoice.summary.balanceDue ? 'Complete Checkout & Print Receipt' : 'Record Partial Payment'}
                  </Button>

                  {invoice && invoice.summary.balanceDue > 0 && (
                    <Button className="w-full" variant="outline" onClick={() => printFullBill(invoice)}>
                      <Printer className="mr-2 h-4 w-4" />Print Current Bill
                    </Button>
                  )}

                  <p className="text-xs text-center text-muted-foreground">
                    Partial payments allowed. Checkout completes when full balance is paid.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Room Service Queue (admin view for all pending orders) ────────────────────

function RoomServiceQueue() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/restaurant/orders');
      const d = await res.json();
      if (d.success) setOrders(d.data.filter((o: any) => o.orderType === 'room-service' && !['completed', 'cancelled'].includes(o.status)));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (bookingId: string, orderId: string, status: string) => {
    if (!bookingId || !orderId) return;
    const res = await fetch(`/api/bookings/${bookingId}/room-service?orderId=${orderId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    if ((await res.json()).success) fetchOrders();
  };

  if (loading) return <p className="text-center text-muted-foreground py-8">Loading orders…</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{orders.length} active room service orders</p>
        <Button variant="outline" size="sm" onClick={fetchOrders}><RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh</Button>
      </div>
      {orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UtensilsCrossed className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>No pending room service orders</p>
        </div>
      ) : orders.map(o => (
        <div key={o._id} className={`rounded-xl border p-3 space-y-2 text-sm ${o.status === 'pending' ? 'border-amber-300 bg-amber-50' : 'border-border'}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold">Room Service</span>
              <span className="ml-2 text-xs text-muted-foreground capitalize">{o.mealType}</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              o.status === 'approved' ? 'bg-blue-100 text-blue-700' :
              o.status === 'preparing' ? 'bg-orange-100 text-orange-700' :
              o.status === 'ready' ? 'bg-green-100 text-green-700' :
              'bg-teal-100 text-teal-700'
            }`}>{o.status}</span>
          </div>
          <div className="space-y-0.5 text-muted-foreground">
            {o.items?.map((i: any, idx: number) => (
              <div key={idx}>• {i.itemName} × {i.quantity}</div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">${o.total?.toFixed(2)}</span>
            <div className="flex gap-1">
              {o.status === 'pending' && (
                <>
                  <Button size="sm" className="h-6 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => updateStatus(o.bookingId, o._id, 'approved')}>Approve</Button>
                  <Button size="sm" variant="outline" className="h-6 text-xs text-red-500" onClick={() => updateStatus(o.bookingId, o._id, 'cancelled')}>Decline</Button>
                </>
              )}
              {o.status === 'approved' && <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => updateStatus(o.bookingId, o._id, 'preparing')}>Start</Button>}
              {o.status === 'preparing' && <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => updateStatus(o.bookingId, o._id, 'ready')}>Ready</Button>}
              {o.status === 'ready' && <Button size="sm" className="h-6 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateStatus(o.bookingId, o._id, 'delivered')}>Delivered</Button>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
