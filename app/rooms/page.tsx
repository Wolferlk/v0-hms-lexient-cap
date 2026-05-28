'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';

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

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/rooms');
        const data = await response.json();
        if (data.success) {
          setRooms(data.data);
        }
      } catch (error) {
        console.error('[v0] Error fetching rooms:', error);
        toast.error('Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter((room) => {
    if (filterCategory === 'all') return true;
    return room.category === filterCategory;
  });

  const categories = ['Standard', 'Deluxe', 'Suite', 'Presidential'];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold">Our Rooms</h1>

        {/* Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          <Button
            variant={filterCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterCategory('all')}
          >
            All Rooms
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={filterCategory === category ? 'default' : 'outline'}
              onClick={() => setFilterCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading rooms...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center text-muted-foreground">No rooms available</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => (
              <Card key={room._id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Room {room.roomNumber}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {room.category}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div>
                    <p className="text-2xl font-bold">
                      ${room.pricePerNight}
                      <span className="text-sm font-normal text-muted-foreground">
                        /night
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Capacity: {room.capacity} guests
                    </p>
                  </div>

                  {room.description && (
                    <p className="text-sm text-muted-foreground">
                      {room.description}
                    </p>
                  )}

                  {room.amenities.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Amenities
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.map((amenity) => (
                          <span
                            key={amenity}
                            className="rounded-full bg-secondary px-2 py-1 text-xs"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-4">
                    <Link href="/booking">
                      <Button className="w-full">Book Now</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
