'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Hotel, Calendar, DollarSign, Users } from 'lucide-react';

interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  totalGuests: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [roomsRes, bookingsRes] = await Promise.all([
          fetch('/api/rooms'),
          fetch('/api/bookings'),
        ]);

        const roomsData = await roomsRes.json();
        const bookingsData = await bookingsRes.json();

        if (roomsData.success && bookingsData.success) {
          const rooms = roomsData.data || [];
          const bookings = bookingsData.data || [];

          const availableRooms = rooms.filter((r: any) => r.isAvailable).length;
          const confirmedBookings = bookings.filter(
            (b: any) => b.status === 'confirmed'
          ).length;
          const totalRevenue = bookings.reduce(
            (sum: number, b: any) => sum + (b.totalAmount - b.discountAmount),
            0
          );

          setStats({
            totalRooms: rooms.length,
            availableRooms,
            totalBookings: bookings.length,
            confirmedBookings,
            totalRevenue,
            totalGuests: bookings.reduce((sum: number, b: any) => sum + b.numberOfGuests, 0),
          });
        }
      } catch (error) {
        console.error('[v0] Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading...</div>;
  }

  if (!stats) {
    return <div className="text-center text-muted-foreground">Failed to load stats</div>;
  }

  const cards = [
    {
      title: 'Total Rooms',
      value: stats.totalRooms,
      icon: Hotel,
      color: 'text-blue-500',
    },
    {
      title: 'Available Rooms',
      value: stats.availableRooms,
      icon: Hotel,
      color: 'text-green-500',
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-purple-500',
    },
    {
      title: 'Confirmed Bookings',
      value: stats.confirmedBookings,
      icon: Calendar,
      color: 'text-orange-500',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Total Guests',
      value: stats.totalGuests,
      icon: Users,
      color: 'text-pink-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Detailed analytics and activity logs coming in the next phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
