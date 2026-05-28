'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit2, Trash2, Plus } from 'lucide-react';

interface Room {
  _id: string;
  roomNumber: string;
  category: string;
  capacity: number;
  pricePerNight: number;
  description: string;
  amenities: string[];
  isAvailable: boolean;
}

export default function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    roomNumber: '',
    category: 'Standard',
    capacity: '1',
    pricePerNight: '',
    description: '',
    amenities: '',
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rooms');
      const data = await response.json();
      if (data.success) {
        setRooms(data.data);
      }
    } catch (error) {
      console.error('[v0] Error fetching rooms:', error);
      toast.error('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.roomNumber || !formData.pricePerNight) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/rooms/${editingId}` : '/api/rooms';

      const amenitiesArray = formData.amenities
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: formData.roomNumber,
          category: formData.category,
          capacity: parseInt(formData.capacity),
          pricePerNight: parseFloat(formData.pricePerNight),
          description: formData.description,
          amenities: amenitiesArray,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          editingId ? 'Room updated successfully' : 'Room created successfully'
        );
        setFormData({
          roomNumber: '',
          category: 'Standard',
          capacity: '1',
          pricePerNight: '',
          description: '',
          amenities: '',
        });
        setEditingId(null);
        setShowForm(false);
        fetchRooms();
      } else {
        toast.error(data.error || 'Failed to save room');
      }
    } catch (error) {
      console.error('[v0] Error saving room:', error);
      toast.error('Failed to save room');
    }
  };

  const handleEdit = (room: Room) => {
    setFormData({
      roomNumber: room.roomNumber,
      category: room.category,
      capacity: room.capacity.toString(),
      pricePerNight: room.pricePerNight.toString(),
      description: room.description,
      amenities: room.amenities.join(', '),
    });
    setEditingId(room._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      const response = await fetch(`/api/rooms/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Room deleted successfully');
        fetchRooms();
      } else {
        toast.error(data.error || 'Failed to delete room');
      }
    } catch (error) {
      console.error('[v0] Error deleting room:', error);
      toast.error('Failed to delete room');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      roomNumber: '',
      category: 'Standard',
      capacity: '1',
      pricePerNight: '',
      description: '',
      amenities: '',
    });
  };

  return (
    <div className="space-y-6">
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Room
        </Button>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Edit Room' : 'Add New Room'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="roomNumber">Room Number *</Label>
                  <Input
                    id="roomNumber"
                    value={formData.roomNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, roomNumber: e.target.value })
                    }
                    placeholder="e.g. 101"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Deluxe">Deluxe</SelectItem>
                      <SelectItem value="Suite">Suite</SelectItem>
                      <SelectItem value="Presidential">Presidential</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity (guests)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricePerNight">Price Per Night ($) *</Label>
                  <Input
                    id="pricePerNight"
                    type="number"
                    step="0.01"
                    value={formData.pricePerNight}
                    onChange={(e) =>
                      setFormData({ ...formData, pricePerNight: e.target.value })
                    }
                    placeholder="e.g. 99.99"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Room description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amenities">
                  Amenities (comma-separated)
                </Label>
                <Input
                  id="amenities"
                  value={formData.amenities}
                  onChange={(e) =>
                    setFormData({ ...formData, amenities: e.target.value })
                  }
                  placeholder="WiFi, AC, TV, Minibar"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1">
                  {editingId ? 'Update Room' : 'Create Room'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Rooms ({rooms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : rooms.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No rooms yet. Add your first room!
            </p>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">Room {room.roomNumber}</h4>
                    <p className="text-sm text-muted-foreground">
                      {room.category} • {room.capacity} guests • ${room.pricePerNight}/night
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
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(room)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(room._id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
