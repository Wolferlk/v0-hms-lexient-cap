'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Anchor, Users } from 'lucide-react';

export default function DayOutManagement() {
  const [activeTab, setActiveTab] = useState('packages');
  const [dayOutPackages, setDayOutPackages] = useState<any[]>([]);
  const [groupBookings, setGroupBookings] = useState<any[]>([]);
  const [boatPackages, setBoatPackages] = useState<any[]>([]);
  const [boatBookings, setBoatBookings] = useState<any[]>([]);

  const [showPackageForm, setShowPackageForm] = useState(false);
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    price: '',
    capacity: '',
    duration: '',
    maxGroupSize: '',
    pricePerPerson: '',
  });

  const [showBoatForm, setShowBoatForm] = useState(false);
  const [boatForm, setBoatForm] = useState({
    name: '',
    description: '',
    boatType: 'speed_boat',
    capacity: '',
    price: '',
    pricePerPerson: '',
    duration: '',
    safetyRating: '5',
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [pkgRes, grpRes, boatPkgRes, boatBookRes] = await Promise.all([
        fetch('/api/day-out/packages'),
        fetch('/api/day-out/group-bookings'),
        fetch('/api/day-out/boat-rides/packages'),
        fetch('/api/day-out/boat-rides/bookings'),
      ]);

      if (pkgRes.ok) {
        const data = await pkgRes.json();
        if (data.success) setDayOutPackages(data.data);
      }
      if (grpRes.ok) {
        const data = await grpRes.json();
        if (data.success) setGroupBookings(data.data);
      }
      if (boatPkgRes.ok) {
        const data = await boatPkgRes.json();
        if (data.success) setBoatPackages(data.data);
      }
      if (boatBookRes.ok) {
        const data = await boatBookRes.json();
        if (data.success) setBoatBookings(data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const addDayOutPackage = async () => {
    if (!packageForm.name || !packageForm.price) {
      alert('Please fill required fields');
      return;
    }

    try {
      const response = await fetch('/api/day-out/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...packageForm,
          price: parseFloat(packageForm.price),
          capacity: parseInt(packageForm.capacity),
          duration: parseInt(packageForm.duration),
          maxGroupSize: parseInt(packageForm.maxGroupSize),
          pricePerPerson: parseFloat(packageForm.pricePerPerson),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setDayOutPackages([...dayOutPackages, data.data]);
        setPackageForm({
          name: '',
          description: '',
          price: '',
          capacity: '',
          duration: '',
          maxGroupSize: '',
          pricePerPerson: '',
        });
        setShowPackageForm(false);
      }
    } catch (error) {
      console.error('Error adding package:', error);
    }
  };

  const addBoatPackage = async () => {
    if (!boatForm.name || !boatForm.price) {
      alert('Please fill required fields');
      return;
    }

    try {
      const response = await fetch('/api/day-out/boat-rides/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...boatForm,
          capacity: parseInt(boatForm.capacity),
          price: parseFloat(boatForm.price),
          pricePerPerson: parseFloat(boatForm.pricePerPerson),
          duration: parseInt(boatForm.duration),
          safetyRating: parseInt(boatForm.safetyRating),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setBoatPackages([...boatPackages, data.data]);
        setBoatForm({
          name: '',
          description: '',
          boatType: 'speed_boat',
          capacity: '',
          price: '',
          pricePerPerson: '',
          duration: '',
          safetyRating: '5',
        });
        setShowBoatForm(false);
      }
    } catch (error) {
      console.error('Error adding boat package:', error);
    }
  };

  const deletePackage = async (id: string) => {
    try {
      const response = await fetch(`/api/day-out/packages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, deleted: true }),
      });

      const data = await response.json();
      if (data.success) {
        setDayOutPackages(dayOutPackages.filter((p) => p._id !== id));
      }
    } catch (error) {
      console.error('Error deleting package:', error);
    }
  };

  const updateBookingStatus = async (id: string, status: string, type: 'group' | 'boat') => {
    try {
      const endpoint = type === 'group' ? '/api/day-out/group-bookings' : '/api/day-out/boat-rides/bookings';
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();
      if (data.success) {
        fetchAllData();
      }
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="packages">Day-out Packages</TabsTrigger>
          <TabsTrigger value="groupBookings">Group Bookings</TabsTrigger>
          <TabsTrigger value="boatPackages" className="flex items-center gap-2">
            <Anchor className="h-4 w-4" />
            Boat Rides
          </TabsTrigger>
          <TabsTrigger value="boatBookings">Boat Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Day-out Packages</h3>
            <Button onClick={() => setShowPackageForm(!showPackageForm)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Package
            </Button>
          </div>

          {showPackageForm && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Input
                  placeholder="Package Name"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                />
                <Input
                  placeholder="Description"
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                />
                <Input
                  placeholder="Price"
                  type="number"
                  value={packageForm.price}
                  onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                />
                <Input
                  placeholder="Price per Person"
                  type="number"
                  value={packageForm.pricePerPerson}
                  onChange={(e) => setPackageForm({ ...packageForm, pricePerPerson: e.target.value })}
                />
                <Input
                  placeholder="Capacity"
                  type="number"
                  value={packageForm.capacity}
                  onChange={(e) => setPackageForm({ ...packageForm, capacity: e.target.value })}
                />
                <Input
                  placeholder="Duration (hours)"
                  type="number"
                  value={packageForm.duration}
                  onChange={(e) => setPackageForm({ ...packageForm, duration: e.target.value })}
                />
                <Input
                  placeholder="Max Group Size"
                  type="number"
                  value={packageForm.maxGroupSize}
                  onChange={(e) => setPackageForm({ ...packageForm, maxGroupSize: e.target.value })}
                />
                <div className="flex gap-4">
                  <Button onClick={addDayOutPackage}>Save Package</Button>
                  <Button variant="outline" onClick={() => setShowPackageForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {dayOutPackages.map((pkg) => (
              <Card key={pkg._id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{pkg.name}</h4>
                      <p className="text-sm text-muted-foreground">{pkg.description}</p>
                      <p className="text-sm mt-2">
                        <span className="font-semibold">₹{pkg.price}</span>
                        <span className="ml-2 text-muted-foreground">
                          {pkg.duration}h | {pkg.maxGroupSize} max
                        </span>
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePackage(pkg._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="groupBookings" className="space-y-4">
          <h3 className="text-lg font-semibold">Group Bookings</h3>
          <div className="grid gap-4">
            {groupBookings.length === 0 ? (
              <p className="text-muted-foreground">No group bookings yet</p>
            ) : (
              groupBookings.map((booking) => (
                <Card key={booking._id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{booking.groupName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {booking.numberOfPeople} people | ₹{booking.totalPrice}
                        </p>
                        <p className="text-sm mt-2">
                          {new Date(booking.bookingDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Select
                        value={booking.status}
                        onValueChange={(value) => updateBookingStatus(booking._id, value, 'group')}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="boatPackages" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Boat Ride Packages</h3>
            <Button onClick={() => setShowBoatForm(!showBoatForm)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Boat Package
            </Button>
          </div>

          {showBoatForm && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Input
                  placeholder="Boat Name"
                  value={boatForm.name}
                  onChange={(e) => setBoatForm({ ...boatForm, name: e.target.value })}
                />
                <Input
                  placeholder="Description"
                  value={boatForm.description}
                  onChange={(e) => setBoatForm({ ...boatForm, description: e.target.value })}
                />
                <Select value={boatForm.boatType} onValueChange={(value) => setBoatForm({ ...boatForm, boatType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Boat Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="speed_boat">Speed Boat</SelectItem>
                    <SelectItem value="houseboat">Houseboat</SelectItem>
                    <SelectItem value="yacht">Yacht</SelectItem>
                    <SelectItem value="catamaran">Catamaran</SelectItem>
                    <SelectItem value="ferry">Ferry</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Capacity"
                  type="number"
                  value={boatForm.capacity}
                  onChange={(e) => setBoatForm({ ...boatForm, capacity: e.target.value })}
                />
                <Input
                  placeholder="Price"
                  type="number"
                  value={boatForm.price}
                  onChange={(e) => setBoatForm({ ...boatForm, price: e.target.value })}
                />
                <Input
                  placeholder="Price per Person"
                  type="number"
                  value={boatForm.pricePerPerson}
                  onChange={(e) => setBoatForm({ ...boatForm, pricePerPerson: e.target.value })}
                />
                <Input
                  placeholder="Duration (minutes)"
                  type="number"
                  value={boatForm.duration}
                  onChange={(e) => setBoatForm({ ...boatForm, duration: e.target.value })}
                />
                <div className="flex gap-4">
                  <Button onClick={addBoatPackage}>Save Boat Package</Button>
                  <Button variant="outline" onClick={() => setShowBoatForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {boatPackages.map((pkg) => (
              <Card key={pkg._id}>
                <CardContent className="pt-6">
                  <h4 className="font-semibold">{pkg.name}</h4>
                  <p className="text-sm text-muted-foreground">{pkg.boatType}</p>
                  <p className="text-sm mt-2">
                    <span className="font-semibold">₹{pkg.pricePerPerson}</span>
                    <span className="ml-2 text-muted-foreground">
                      {pkg.capacity} capacity | {pkg.duration}min
                    </span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="boatBookings" className="space-y-4">
          <h3 className="text-lg font-semibold">Boat Ride Bookings</h3>
          <div className="grid gap-4">
            {boatBookings.length === 0 ? (
              <p className="text-muted-foreground">No boat bookings yet</p>
            ) : (
              boatBookings.map((booking) => (
                <Card key={booking._id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{booking.packageId?.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {booking.numberOfPassengers} passengers | ₹{booking.totalPrice}
                        </p>
                        <p className="text-sm mt-2">
                          {new Date(booking.bookingDate).toLocaleDateString()} at {booking.departureTime}
                        </p>
                      </div>
                      <Select
                        value={booking.status}
                        onValueChange={(value) => updateBookingStatus(booking._id, value, 'boat')}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
