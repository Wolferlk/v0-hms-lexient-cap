'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Eye, CheckCircle, XCircle } from 'lucide-react';

interface Booking {
  _id: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalAmount: number;
  discountAmount: number;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
  roomIds: string[];
}

export default function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error('[v0] Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (
    bookingId: string,
    newStatus: string,
    newPaymentStatus?: string
  ) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          ...(newPaymentStatus && { paymentStatus: newPaymentStatus }),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Booking updated successfully');
        fetchBookings();
        setSelectedBooking(null);
      } else {
        toast.error(data.error || 'Failed to update booking');
      }
    } catch (error) {
      console.error('[v0] Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filterStatus === 'all') return true;
    return booking.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'checked-in':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'checked-out':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <h4 className="font-semibold">{booking.bookingId}</h4>
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getPaymentColor(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {booking.customerName} • {booking.customerPhone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(booking.checkInDate), 'MMM dd, yyyy')} -{' '}
                      {format(new Date(booking.checkOutDate), 'MMM dd, yyyy')}
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      ${(booking.totalAmount - booking.discountAmount).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {booking.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateBookingStatus(
                            booking._id,
                            'confirmed',
                            'paid'
                          )
                        }
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedBooking && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Booking ID</p>
                <p className="font-semibold">{selectedBooking.bookingId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Guest Name</p>
                <p className="font-semibold">{selectedBooking.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{selectedBooking.customerEmail}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm">{selectedBooking.customerPhone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Check-in</p>
                <p className="font-semibold">
                  {format(new Date(selectedBooking.checkInDate), 'PPP')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Check-out</p>
                <p className="font-semibold">
                  {format(new Date(selectedBooking.checkOutDate), 'PPP')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Guests</p>
                <p className="font-semibold">{selectedBooking.numberOfGuests}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rooms</p>
                <p className="text-sm">{selectedBooking.roomIds.length} room(s)</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold">
                  ${selectedBooking.totalAmount.toFixed(2)}
                </span>
              </div>
              {selectedBooking.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Discount:</span>
                  <span className="text-green-600">
                    -${selectedBooking.discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold">
                <span>Final Amount:</span>
                <span>
                  ${(selectedBooking.totalAmount - selectedBooking.discountAmount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Select
                value={selectedBooking.status}
                onValueChange={(value) =>
                  updateBookingStatus(selectedBooking._id, value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="checked-in">Checked In</SelectItem>
                  <SelectItem value="checked-out">Checked Out</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedBooking.paymentStatus}
                onValueChange={(value) =>
                  updateBookingStatus(
                    selectedBooking._id,
                    selectedBooking.status,
                    value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={() => setSelectedBooking(null)}
              className="w-full"
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
