'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Heart } from 'lucide-react';

interface WeddingHall {
  _id: string;
  name: string;
  capacity: number;
  area: number;
  basePrice: number;
  amenities: string[];
  description: string;
  availability: string;
}

interface WeddingEvent {
  _id: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  eventType: string;
  expectedGuests: number;
  totalPrice: number;
  status: string;
  hallId: { _id: string; name: string };
}

export default function WeddingHallManagement() {
  const [halls, setHalls] = useState<WeddingHall[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'halls' | 'events'>('halls');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [hallForm, setHallForm] = useState({
    name: '',
    capacity: 100,
    area: 0,
    basePrice: 0,
    amenities: '',
    description: '',
  });

  const [eventForm, setEventForm] = useState({
    hallId: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    eventDate: '',
    eventType: 'wedding',
    expectedGuests: 0,
    totalPrice: 0,
    advancePayment: 0,
    status: 'inquiry',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hallsRes, eventsRes] = await Promise.all([
        fetch('/api/wedding-hall/halls'),
        fetch('/api/wedding-hall/events'),
      ]);

      const [hallsData, eventsData] = await Promise.all([
        hallsRes.json(),
        eventsRes.json(),
      ]);

      if (hallsData.success) setHalls(hallsData.data);
      if (eventsData.success) setEvents(eventsData.data);
    } catch (error) {
      console.error('[v0] Fetch wedding data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHall = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hallForm.name || !hallForm.capacity || !hallForm.basePrice) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/wedding-hall/halls', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...hallForm,
          amenities: hallForm.amenities.split(',').map((a) => a.trim()),
        }),
      });

      if (response.ok) {
        fetchData();
        setIsDialogOpen(false);
        setEditingId(null);
        setHallForm({
          name: '',
          capacity: 100,
          area: 0,
          basePrice: 0,
          amenities: '',
          description: '',
        });
      }
    } catch (error) {
      console.error('[v0] Add hall error:', error);
      alert('Error saving hall');
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !eventForm.hallId ||
      !eventForm.clientName ||
      !eventForm.eventDate ||
      !eventForm.totalPrice
    ) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/wedding-hall/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm),
      });

      if (response.ok) {
        fetchData();
        setIsDialogOpen(false);
        setEventForm({
          hallId: '',
          clientName: '',
          clientPhone: '',
          clientEmail: '',
          eventDate: '',
          eventType: 'wedding',
          expectedGuests: 0,
          totalPrice: 0,
          advancePayment: 0,
          status: 'inquiry',
          notes: '',
        });
      }
    } catch (error) {
      console.error('[v0] Add event error:', error);
      alert('Error saving event');
    }
  };

  const handleDeleteHall = async (id: string) => {
    if (!confirm('Delete this wedding hall?')) return;

    try {
      const response = await fetch(`/api/wedding-hall/halls/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('[v0] Delete hall error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Wedding Hall Management</h2>
          <p className="text-sm text-muted-foreground">
            {activeTab === 'halls' ? `${halls.length} halls` : `${events.length} events`}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {activeTab === 'halls' ? 'Add Hall' : 'Add Event'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {activeTab === 'halls' ? 'Add Wedding Hall' : 'Add Wedding Event'}
              </DialogTitle>
            </DialogHeader>

            {activeTab === 'halls' ? (
              <form onSubmit={handleAddHall} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Hall Name *</label>
                  <Input
                    value={hallForm.name}
                    onChange={(e) =>
                      setHallForm({ ...hallForm, name: e.target.value })
                    }
                    placeholder="e.g., Grand Ballroom"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Capacity *</label>
                    <Input
                      type="number"
                      value={hallForm.capacity}
                      onChange={(e) =>
                        setHallForm({
                          ...hallForm,
                          capacity: parseInt(e.target.value),
                        })
                      }
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Area (sq.ft)</label>
                    <Input
                      type="number"
                      value={hallForm.area}
                      onChange={(e) =>
                        setHallForm({
                          ...hallForm,
                          area: parseInt(e.target.value),
                        })
                      }
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Base Price *</label>
                  <Input
                    type="number"
                    value={hallForm.basePrice}
                    onChange={(e) =>
                      setHallForm({
                        ...hallForm,
                        basePrice: parseFloat(e.target.value),
                      })
                    }
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Amenities (comma-separated)
                  </label>
                  <Input
                    value={hallForm.amenities}
                    onChange={(e) =>
                      setHallForm({ ...hallForm, amenities: e.target.value })
                    }
                    placeholder="AC, Stage, Parking, etc."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={hallForm.description}
                    onChange={(e) =>
                      setHallForm({
                        ...hallForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Hall description"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Save Hall
                </Button>
              </form>
            ) : (
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Hall *</label>
                  <Select
                    value={eventForm.hallId}
                    onValueChange={(value) =>
                      setEventForm({ ...eventForm, hallId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hall" />
                    </SelectTrigger>
                    <SelectContent>
                      {halls.map((hall) => (
                        <SelectItem key={hall._id} value={hall._id}>
                          {hall.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Client Name *</label>
                    <Input
                      value={eventForm.clientName}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          clientName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Phone *</label>
                    <Input
                      value={eventForm.clientPhone}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          clientPhone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={eventForm.clientEmail}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        clientEmail: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Event Date *</label>
                    <Input
                      type="date"
                      value={eventForm.eventDate}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          eventDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Event Type</label>
                    <Select
                      value={eventForm.eventType}
                      onValueChange={(value) =>
                        setEventForm({ ...eventForm, eventType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wedding">Wedding</SelectItem>
                        <SelectItem value="reception">Reception</SelectItem>
                        <SelectItem value="pre_wedding">Pre-Wedding</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Expected Guests</label>
                    <Input
                      type="number"
                      value={eventForm.expectedGuests}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          expectedGuests: parseInt(e.target.value),
                        })
                      }
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Total Price *</label>
                    <Input
                      type="number"
                      value={eventForm.totalPrice}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          totalPrice: parseFloat(e.target.value),
                        })
                      }
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Advance Payment</label>
                  <Input
                    type="number"
                    value={eventForm.advancePayment}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        advancePayment: parseFloat(e.target.value),
                      })
                    }
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Save Event
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'halls' ? 'default' : 'outline'}
          onClick={() => setActiveTab('halls')}
        >
          Wedding Halls
        </Button>
        <Button
          variant={activeTab === 'events' ? 'default' : 'outline'}
          onClick={() => setActiveTab('events')}
        >
          Events
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'halls' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {halls.map((hall) => (
            <Card key={hall._id}>
              <CardHeader>
                <CardTitle>{hall.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Capacity</p>
                    <p className="font-semibold">{hall.capacity} guests</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Area</p>
                    <p className="font-semibold">{hall.area} sq.ft</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Base Price</p>
                  <p className="text-lg font-bold">₹{hall.basePrice.toLocaleString()}</p>
                </div>
                {hall.amenities.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-1">
                      {hall.amenities.slice(0, 3).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingId(hall._id);
                      setHallForm({
                        name: hall.name,
                        capacity: hall.capacity,
                        area: hall.area,
                        basePrice: hall.basePrice,
                        amenities: hall.amenities.join(', '),
                        description: hall.description,
                      });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDeleteHall(hall._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Wedding Events</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : events.length === 0 ? (
              <p className="text-center text-muted-foreground">No events found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Client</th>
                      <th className="text-left py-3 px-2">Hall</th>
                      <th className="text-left py-3 px-2">Date</th>
                      <th className="text-right py-3 px-2">Guests</th>
                      <th className="text-right py-3 px-2">Amount</th>
                      <th className="text-left py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event._id} className="border-b">
                        <td className="py-3 px-2 font-medium">{event.clientName}</td>
                        <td className="py-3 px-2">{event.hallId.name}</td>
                        <td className="py-3 px-2">
                          {new Date(event.eventDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2 text-right">{event.expectedGuests}</td>
                        <td className="py-3 px-2 text-right font-semibold">
                          ₹{event.totalPrice.toLocaleString()}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                            event.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : event.status === 'inquiry'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {event.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
