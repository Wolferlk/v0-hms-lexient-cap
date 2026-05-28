'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Eye,
  CheckCircle,
  XCircle,
  UtensilsCrossed,
  FileText,
  LogOut,
  LogIn,
  Plus,
  Trash2,
  CreditCard,
  IdCard,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

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
}

interface MenuItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  preparationTime: number;
}

interface OrderItem {
  menuItemId: string;
  quantity: number;
  specialInstructions: string;
}

interface RoomServiceOrder {
  _id: string;
  mealType: string;
  items: { itemName: string; quantity: number; price: number; specialInstructions?: string }[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  paymentStatus: string;
  orderTime: string;
}

interface InvoiceData {
  invoiceNumber: string;
  generatedAt: string;
  booking: {
    bookingId: string;
    customerName: string;
    numberOfNights: number;
    checkInDate: string;
    checkOutDate: string;
    status: string;
  };
  roomCharges: {
    items: { description: string; unitPrice: number; quantity: number; total: number }[];
    subtotal: number;
    discount: number;
    total: number;
  };
  foodCharges: {
    items: { description: string; unitPrice: number; quantity: number; total: number }[];
    subtotal: number;
    tax: number;
    total: number;
  };
  summary: {
    roomTotal: number;
    foodTotal: number;
    grandTotal: number;
    amountPaid: number;
    balanceDue: number;
  };
  payments: { amount: number; method: string; date: string; notes?: string }[];
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [activePanel, setActivePanel] = useState<
    'details' | 'checkin' | 'roomservice' | 'invoice' | 'checkout'
  >('details');

  // Check-in form
  const [docType, setDocType] = useState('passport');
  const [docNumber, setDocNumber] = useState('');
  const [docExpiry, setDocExpiry] = useState('');
  const [docScanUrl, setDocScanUrl] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);

  // Room service
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [roomOrders, setRoomOrders] = useState<RoomServiceOrder[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { menuItemId: '', quantity: 1, specialInstructions: '' },
  ]);
  const [mealType, setMealType] = useState('lunch');
  const [orderLoading, setOrderLoading] = useState(false);

  // Invoice
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Checkout
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [returnDocument, setReturnDocument] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchMenuItems();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.success) setBookings(data.data);
    } catch {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/restaurant/menu');
      const data = await res.json();
      if (data.success) setMenuItems(data.data.filter((m: MenuItem) => m.available));
    } catch {
      // silently fail
    }
  };

  const fetchRoomOrders = useCallback(async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/room-service`);
      const data = await res.json();
      if (data.success) setRoomOrders(data.data);
    } catch {
      toast.error('Failed to fetch room orders');
    }
  }, []);

  const fetchInvoice = useCallback(async (bookingId: string) => {
    setInvoiceLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/invoice`);
      const data = await res.json();
      if (data.success) setInvoice(data.data);
      else toast.error(data.error || 'Failed to load invoice');
    } catch {
      toast.error('Failed to load invoice');
    } finally {
      setInvoiceLoading(false);
    }
  }, []);

  const openBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setActivePanel('details');
    setInvoice(null);
    setRoomOrders([]);
    setOrderItems([{ menuItemId: '', quantity: 1, specialInstructions: '' }]);
    setDocType('passport');
    setDocNumber('');
    setDocExpiry('');
    setDocScanUrl('');
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentNotes('');
  };

  const handlePanelChange = (panel: typeof activePanel) => {
    setActivePanel(panel);
    if (!selectedBooking) return;
    if (panel === 'roomservice') fetchRoomOrders(selectedBooking._id);
    if (panel === 'invoice' || panel === 'checkout') fetchInvoice(selectedBooking._id);
  };

  // ── Check-in ────────────────────────────────────────────────────────────────

  const handleCheckIn = async () => {
    if (!selectedBooking) return;
    if (!docNumber.trim()) {
      toast.error('Document number is required');
      return;
    }
    setCheckInLoading(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBooking._id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType,
          docNumber,
          expiryDate: docExpiry || undefined,
          scanUrl: docScanUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Guest checked in successfully');
        fetchBookings();
        setSelectedBooking({ ...selectedBooking, status: 'checked-in', guestDocument: data.data.guestDocument });
        setActivePanel('details');
      } else {
        toast.error(data.error || 'Check-in failed');
      }
    } catch {
      toast.error('Check-in failed');
    } finally {
      setCheckInLoading(false);
    }
  };

  // ── Room Service ────────────────────────────────────────────────────────────

  const addOrderItem = () =>
    setOrderItems([...orderItems, { menuItemId: '', quantity: 1, specialInstructions: '' }]);

  const removeOrderItem = (index: number) =>
    setOrderItems(orderItems.filter((_, i) => i !== index));

  const updateOrderItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const updated = [...orderItems];
    (updated[index] as any)[field] = value;
    setOrderItems(updated);
  };

  const handlePlaceOrder = async () => {
    if (!selectedBooking) return;
    const validItems = orderItems.filter((i) => i.menuItemId && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Add at least one item to your order');
      return;
    }
    setOrderLoading(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBooking._id}/room-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealType, items: validItems }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Room service order placed');
        setOrderItems([{ menuItemId: '', quantity: 1, specialInstructions: '' }]);
        fetchRoomOrders(selectedBooking._id);
      } else {
        toast.error(data.error || 'Failed to place order');
      }
    } catch {
      toast.error('Failed to place order');
    } finally {
      setOrderLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    if (!selectedBooking) return;
    try {
      const res = await fetch(
        `/api/bookings/${selectedBooking._id}/room-service?orderId=${orderId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success('Order status updated');
        fetchRoomOrders(selectedBooking._id);
      } else {
        toast.error(data.error || 'Failed to update order');
      }
    } catch {
      toast.error('Failed to update order');
    }
  };

  // ── Checkout ────────────────────────────────────────────────────────────────

  const handleCheckout = async () => {
    if (!selectedBooking) return;
    const amount = parseFloat(paymentAmount);
    if (!paymentAmount || isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBooking._id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentAmount: amount,
          paymentMethod,
          notes: paymentNotes,
          returnDocument,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.checkedOut) {
          toast.success('Guest checked out successfully. Document returned.');
        } else {
          toast.success(`Payment of $${amount.toFixed(2)} recorded. Balance due: $${data.balanceDue.toFixed(2)}`);
        }
        fetchBookings();
        fetchInvoice(selectedBooking._id);
        setPaymentAmount('');
        setPaymentNotes('');
        if (data.checkedOut) {
          setSelectedBooking({ ...selectedBooking, status: 'checked-out' });
        }
      } else {
        toast.error(data.error || 'Checkout failed');
      }
    } catch {
      toast.error('Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ── General status update ───────────────────────────────────────────────────

  const updateBookingStatus = async (bookingId: string, newStatus: string, newPaymentStatus?: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          ...(newPaymentStatus && { paymentStatus: newPaymentStatus }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Booking updated');
        fetchBookings();
      } else {
        toast.error(data.error || 'Failed to update booking');
      }
    } catch {
      toast.error('Failed to update booking');
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const filteredBookings = bookings.filter((b) =>
    filterStatus === 'all' ? true : b.status === filterStatus
  );

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800',
      'checked-in': 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      'checked-out': 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return map[s] || 'bg-gray-100 text-gray-800';
  };

  const paymentColor = (s: string) => {
    const map: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      unpaid: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800',
    };
    return map[s] || 'bg-gray-100 text-gray-800';
  };

  const orderStatusColor = (s: string) => {
    const map: Record<string, string> = {
      pending: 'text-yellow-600',
      approved: 'text-blue-600',
      preparing: 'text-orange-600',
      ready: 'text-green-600',
      delivered: 'text-teal-600',
      completed: 'text-gray-600',
      cancelled: 'text-red-600',
    };
    return map[s] || 'text-gray-600';
  };

  const menuByCategory = menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="checked-in">Checked In</SelectItem>
              <SelectItem value="checked-out">Checked Out</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Bookings list */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : filteredBookings.length === 0 ? (
            <p className="text-center text-muted-foreground">No bookings found</p>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold">{booking.bookingId}</h4>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${paymentColor(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {booking.customerName} · {booking.customerPhone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(booking.checkInDate), 'MMM dd, yyyy')} –{' '}
                      {format(new Date(booking.checkOutDate), 'MMM dd, yyyy')}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold">
                      ${(booking.totalAmount - booking.discountAmount).toFixed(2)}
                      {booking.amountPaid > 0 && (
                        <span className="ml-2 text-xs font-normal text-green-600">
                          Paid: ${booking.amountPaid.toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openBooking(booking)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {booking.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Confirm booking"
                        onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Cancel booking"
                        onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                      >
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail panel */}
      {selectedBooking && (
        <Card className="border-primary">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {selectedBooking.bookingId} — {selectedBooking.customerName}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(null)}>
              <XCircle className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activePanel}
              onValueChange={(v) => handlePanelChange(v as typeof activePanel)}
            >
              <TabsList className="flex flex-wrap gap-1 h-auto mb-4">
                <TabsTrigger value="details">
                  <Eye className="mr-1 h-3.5 w-3.5" /> Details
                </TabsTrigger>
                {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                  <TabsTrigger value="checkin">
                    <LogIn className="mr-1 h-3.5 w-3.5" /> Check-in
                  </TabsTrigger>
                )}
                {selectedBooking.status === 'checked-in' && (
                  <TabsTrigger value="roomservice">
                    <UtensilsCrossed className="mr-1 h-3.5 w-3.5" /> Room Service
                  </TabsTrigger>
                )}
                <TabsTrigger value="invoice">
                  <FileText className="mr-1 h-3.5 w-3.5" /> Invoice
                </TabsTrigger>
                {selectedBooking.status === 'checked-in' && (
                  <TabsTrigger value="checkout">
                    <LogOut className="mr-1 h-3.5 w-3.5" /> Checkout
                  </TabsTrigger>
                )}
              </TabsList>

              {/* ── DETAILS ─────────────────────────────────────────────── */}
              <TabsContent value="details" className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['Booking ID', selectedBooking.bookingId],
                    ['Status', selectedBooking.status],
                    ['Guest Name', selectedBooking.customerName],
                    ['Email', selectedBooking.customerEmail],
                    ['Phone', selectedBooking.customerPhone],
                    ['Guests', String(selectedBooking.numberOfGuests)],
                    [
                      'Check-in',
                      format(new Date(selectedBooking.checkInDate), 'PPP') +
                        (selectedBooking.checkInTime
                          ? ' ' + format(new Date(selectedBooking.checkInTime), 'HH:mm')
                          : ''),
                    ],
                    [
                      'Check-out',
                      format(new Date(selectedBooking.checkOutDate), 'PPP') +
                        (selectedBooking.checkOutTime
                          ? ' ' + format(new Date(selectedBooking.checkOutTime), 'HH:mm')
                          : ''),
                    ],
                    ['Nights', String(selectedBooking.numberOfNights)],
                    ['Rooms', `${selectedBooking.roomIds.length} room(s)`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Document */}
                {selectedBooking.guestDocument && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="mb-2 flex items-center gap-1 text-sm font-semibold">
                      <IdCard className="h-4 w-4" /> Guest Document
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type: </span>
                        {selectedBooking.guestDocument.docType.replace('_', ' ').toUpperCase()}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Number: </span>
                        {selectedBooking.guestDocument.docNumber}
                      </div>
                      {selectedBooking.guestDocument.expiryDate && (
                        <div>
                          <span className="text-muted-foreground">Expiry: </span>
                          {format(new Date(selectedBooking.guestDocument.expiryDate), 'PPP')}
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Returned: </span>
                        {selectedBooking.guestDocument.isReturned ? (
                          <span className="text-green-600 font-medium">Yes</span>
                        ) : (
                          <span className="text-red-500 font-medium">No — held at front desk</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Amounts */}
                <div className="rounded-lg border border-border p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Room Total</span>
                    <span>${selectedBooking.totalAmount.toFixed(2)}</span>
                  </div>
                  {selectedBooking.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-${selectedBooking.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedBooking.amountPaid > 0 && (
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Amount Paid</span>
                      <span>${selectedBooking.amountPaid.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t border-border pt-1">
                    <span>Net Room Amount</span>
                    <span>${(selectedBooking.totalAmount - selectedBooking.discountAmount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment history */}
                {selectedBooking.payments && selectedBooking.payments.length > 0 && (
                  <div>
                    <p className="mb-1 text-sm font-semibold">Payment History</p>
                    <div className="space-y-1">
                      {selectedBooking.payments.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-sm rounded bg-muted/40 px-3 py-1.5">
                          <span>{p.method} — ${p.amount.toFixed(2)}</span>
                          <span className="text-muted-foreground text-xs">
                            {format(new Date(p.date), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ── CHECK-IN ─────────────────────────────────────────────── */}
              <TabsContent value="checkin" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Capture guest document at check-in. The document will be held at the front desk
                  and returned upon checkout after bills are settled.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Document Type *</Label>
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="id_card">National ID Card</SelectItem>
                        <SelectItem value="driving_license">Driving License</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Document Number *</Label>
                    <Input
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder="e.g. A12345678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={docExpiry}
                      onChange={(e) => setDocExpiry(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Document Scan URL (optional)</Label>
                    <Input
                      value={docScanUrl}
                      onChange={(e) => setDocScanUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleCheckIn}
                  disabled={checkInLoading || !docNumber.trim()}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {checkInLoading ? 'Checking in...' : 'Confirm Check-in'}
                </Button>
              </TabsContent>

              {/* ── ROOM SERVICE ─────────────────────────────────────────── */}
              <TabsContent value="roomservice" className="space-y-4">
                {/* Place order */}
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <p className="font-semibold">Place Room Service Order</p>

                  <div className="space-y-2">
                    <Label>Meal Type</Label>
                    <Select value={mealType} onValueChange={setMealType}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                        <SelectItem value="beverages">Beverages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {orderItems.map((item, index) => (
                    <div key={index} className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto] items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">Menu Item</Label>
                        <Select
                          value={item.menuItemId}
                          onValueChange={(v) => updateOrderItem(index, 'menuItemId', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item..." />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(menuByCategory).map(([cat, items]) => (
                              <div key={cat}>
                                <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                                  {cat}
                                </p>
                                {items.map((mi) => (
                                  <SelectItem key={mi._id} value={mi._id}>
                                    {mi.name} — ${mi.price.toFixed(2)}
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)
                          }
                          className="w-16"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Special Instructions</Label>
                        <Input
                          value={item.specialInstructions}
                          onChange={(e) =>
                            updateOrderItem(index, 'specialInstructions', e.target.value)
                          }
                          placeholder="e.g. no onion"
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={orderItems.length === 1}
                        onClick={() => removeOrderItem(index)}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={addOrderItem}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add Item
                    </Button>
                    <Button
                      size="sm"
                      onClick={handlePlaceOrder}
                      disabled={orderLoading || orderItems.every((i) => !i.menuItemId)}
                    >
                      <UtensilsCrossed className="mr-1 h-3.5 w-3.5" />
                      {orderLoading ? 'Placing...' : 'Place Order (charged to room)'}
                    </Button>
                  </div>
                </div>

                {/* Order history */}
                {roomOrders.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-semibold">Order History</p>
                    {roomOrders.map((order) => (
                      <div
                        key={order._id}
                        className="rounded-lg border border-border p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium capitalize">{order.mealType}</span>
                            <span className={`text-xs font-semibold ${orderStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(order.orderTime), 'MMM dd, HH:mm')}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span>
                                {item.itemName} × {item.quantity}
                                {item.specialInstructions && (
                                  <span className="text-muted-foreground text-xs ml-1">
                                    ({item.specialInstructions})
                                  </span>
                                )}
                              </span>
                              <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between border-t border-border pt-2">
                          <span className="text-sm font-semibold">Total: ${order.total.toFixed(2)}</span>
                          {order.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => updateOrderStatus(order._id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-red-500"
                                onClick={() => updateOrderStatus(order._id, 'cancelled')}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                          {order.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => updateOrderStatus(order._id, 'preparing')}
                            >
                              Start Preparing
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => updateOrderStatus(order._id, 'ready')}
                            >
                              Mark Ready
                            </Button>
                          )}
                          {order.status === 'ready' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => updateOrderStatus(order._id, 'delivered')}
                            >
                              Delivered
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {roomOrders.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">No room service orders yet</p>
                )}
              </TabsContent>

              {/* ── INVOICE ──────────────────────────────────────────────── */}
              <TabsContent value="invoice" className="space-y-4">
                {invoiceLoading ? (
                  <p className="text-center text-muted-foreground">Loading invoice...</p>
                ) : invoice ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          Generated {format(new Date(invoice.generatedAt), 'PPpp')}
                        </p>
                      </div>
                    </div>

                    {/* Room charges */}
                    <div className="rounded-lg border border-border p-3 space-y-2">
                      <p className="font-semibold text-sm">Room Charges</p>
                      {invoice.roomCharges.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{item.description}</span>
                          <span>${item.total.toFixed(2)}</span>
                        </div>
                      ))}
                      {invoice.roomCharges.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span>-${invoice.roomCharges.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-semibold border-t border-border pt-1">
                        <span>Room Total</span>
                        <span>${invoice.roomCharges.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Food charges */}
                    {invoice.foodCharges.items.length > 0 && (
                      <div className="rounded-lg border border-border p-3 space-y-2">
                        <p className="font-semibold text-sm">Room Service Charges</p>
                        {invoice.foodCharges.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>
                              {item.description} × {item.quantity}
                            </span>
                            <span>${item.total.toFixed(2)}</span>
                          </div>
                        ))}
                        {invoice.foodCharges.tax > 0 && (
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Tax (5%)</span>
                            <span>${invoice.foodCharges.tax.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold border-t border-border pt-1">
                          <span>Food Total</span>
                          <span>${invoice.foodCharges.total.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="rounded-lg border-2 border-primary p-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Room Total</span>
                        <span>${invoice.summary.roomTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Food & Beverage Total</span>
                        <span>${invoice.summary.foodTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold border-t border-border pt-1">
                        <span>Grand Total</span>
                        <span>${invoice.summary.grandTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Amount Paid</span>
                        <span>-${invoice.summary.amountPaid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold text-red-600">
                        <span>Balance Due</span>
                        <span>${invoice.summary.balanceDue.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Payment history on invoice */}
                    {invoice.payments.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">Payments Received</p>
                        {invoice.payments.map((p, i) => (
                          <div
                            key={i}
                            className="flex justify-between text-sm rounded bg-muted/40 px-3 py-1.5"
                          >
                            <span>
                              {p.method.replace('_', ' ')} — ${p.amount.toFixed(2)}
                              {p.notes && (
                                <span className="ml-1 text-xs text-muted-foreground">({p.notes})</span>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(p.date), 'MMM dd, HH:mm')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-muted-foreground">No invoice data available</p>
                )}
              </TabsContent>

              {/* ── CHECKOUT ─────────────────────────────────────────────── */}
              <TabsContent value="checkout" className="space-y-4">
                {invoice && (
                  <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-sm">
                    <div className="flex justify-between font-semibold">
                      <span>Grand Total</span>
                      <span>${invoice.summary.grandTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Already Paid</span>
                      <span>${invoice.summary.amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-red-600 border-t border-border pt-1">
                      <span>Balance Due</span>
                      <span>${invoice.summary.balanceDue.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Payment Amount *</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={
                        invoice ? `Balance: $${invoice.summary.balanceDue.toFixed(2)}` : '0.00'
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method *</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="wallet">Wallet</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g. partial — rest to be paid tomorrow"
                  />
                </div>

                {selectedBooking.guestDocument && !selectedBooking.guestDocument.isReturned && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
                    <IdCard className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-amber-800">Document held at front desk:</span>{' '}
                      <span className="text-amber-700">
                        {selectedBooking.guestDocument.docType.replace('_', ' ').toUpperCase()} —{' '}
                        {selectedBooking.guestDocument.docNumber}
                      </span>
                    </div>
                    <label className="flex items-center gap-1 text-amber-800 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={returnDocument}
                        onChange={(e) => setReturnDocument(e.target.checked)}
                        className="h-4 w-4"
                      />
                      Return on checkout
                    </label>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={checkoutLoading || !paymentAmount}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {checkoutLoading
                    ? 'Processing...'
                    : invoice && parseFloat(paymentAmount) >= invoice.summary.balanceDue
                    ? 'Pay & Complete Checkout'
                    : 'Record Partial Payment'}
                </Button>

                {invoice && invoice.summary.balanceDue > 0 && (
                  <p className="text-xs text-center text-muted-foreground">
                    Partial payments are allowed. Full checkout completes when balance is zero.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
