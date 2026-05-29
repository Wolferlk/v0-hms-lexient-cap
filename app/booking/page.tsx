'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Calendar, Users } from 'lucide-react';

interface Room {
  _id: string;
  roomNumber: string;
  category: string;
  capacity: number;
  pricePerNight: number;
  description: string;
  amenities: string[];
}

export default function BookingPage() {
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState('1');
  const [capacity, setCapacity] = useState('');
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [promoCode, setPromoCode] = useState('');

  const checkAvailability = async () => {
    if (!checkInDate || !checkOutDate) {
      toast.error('Please select both check-in and check-out dates');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        checkIn: checkInDate,
        checkOut: checkOutDate,
        ...(capacity && { capacity }),
      });

      const response = await fetch(`/api/availability?${params}`);
      const data = await response.json();

      if (data.success) {
        setAvailableRooms(data.data.availableRooms);
        setStep(2);
        toast.success(`Found ${data.data.availableRooms.length} available rooms`);
      } else {
        toast.error(data.error || 'Failed to check availability');
      }
    } catch (error) {
      console.error('[v0] Error checking availability:', error);
      toast.error('Failed to check availability');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSelection = (roomId: string) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  const calculateTotalPrice = () => {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.round(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    return availableRooms
      .filter((room) => selectedRooms.includes(room._id))
      .reduce((total, room) => total + room.pricePerNight * nights, 0);
  };

  const handleBooking = async () => {
    if (!customerName || !customerEmail || !customerPhone) {
      toast.error('Please fill in all customer details');
      return;
    }

    if (selectedRooms.length === 0) {
      toast.error('Please select at least one room');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: `CUST-${Date.now()}`,
          customerName,
          customerEmail,
          customerPhone,
          roomIds: selectedRooms,
          checkInDate,
          checkOutDate,
          numberOfGuests: parseInt(guests),
          promoCode: promoCode || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Booking created successfully!');
        // Reset form
        setCheckInDate('');
        setCheckOutDate('');
        setSelectedRooms([]);
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
        setPromoCode('');
        setStep(1);
      } else {
        toast.error(data.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('[v0] Error creating booking:', error);
      toast.error('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold">Book Your Room</h1>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Search Available Rooms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="checkIn" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Check-in Date
                  </Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkOut" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Check-out Date
                  </Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guests" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Number of Guests
                  </Label>
                  <Input
                    id="guests"
                    type="number"
                    min="1"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">
                    Minimum Room Capacity
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="Leave empty for any"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={checkAvailability}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Searching...' : 'Check Availability'}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
            >
              Back to Search
            </Button>

            <h2 className="text-2xl font-semibold">
              Available Rooms ({availableRooms.length})
            </h2>

            {availableRooms.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No rooms available for the selected dates
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {availableRooms.map((room) => (
                    <Card
                      key={room._id}
                      className={`cursor-pointer transition-all ${
                        selectedRooms.includes(room._id)
                          ? 'border-primary bg-primary/5'
                          : ''
                      }`}
                      onClick={() => handleRoomSelection(room._id)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">
                              Room {room.roomNumber}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {room.category} • Capacity: {room.capacity} guests
                            </p>
                            {room.amenities.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {room.amenities.map((amenity) => (
                                  <span
                                    key={amenity}
                                    className="rounded-full bg-secondary px-2 py-1 text-xs"
                                  >
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">
                              ${room.pricePerNight}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              per night
                            </p>
                            <input
                              type="checkbox"
                              checked={selectedRooms.includes(room._id)}
                              onChange={() => {}}
                              className="mt-4"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="sticky bottom-0 bg-background py-4">
                  <Card className="p-6">
                    <div className="mb-4 flex justify-between text-lg">
                      <span>Total Price:</span>
                      <span className="font-bold">${calculateTotalPrice()}</span>
                    </div>
                    <Button
                      onClick={() => setStep(3)}
                      disabled={selectedRooms.length === 0}
                      className="w-full"
                    >
                      Continue to Details
                    </Button>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Guest Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promo">Promo Code (Optional)</Label>
                  <Input
                    id="promo"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="e.g. WELCOME10"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm">
                  <span className="font-semibold">Selected Rooms:</span>{' '}
                  {selectedRooms.length}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Total Price:</span> $
                  {calculateTotalPrice()}
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleBooking}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Booking...' : 'Complete Booking'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
