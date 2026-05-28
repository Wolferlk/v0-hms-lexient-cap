'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, differenceInHours } from 'date-fns';
import {
  Hotel,
  Calendar,
  DollarSign,
  Users,
  UtensilsCrossed,
  Heart,
  Anchor,
  Eye,
  Clock,
  CheckCircle,
  BedDouble,
  TableIcon,
  RefreshCw,
} from 'lucide-react';

interface Props {
  onNavigate?: (tab: string) => void;
}

interface BookingRow {
  _id: string;
  bookingId: string;
  customerName: string;
  roomIds: string[];
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  numberOfGuests: number;
  status: string;
  totalAmount: number;
  discountAmount: number;
  amountPaid: number;
}

interface TableRow {
  _id: string;
  tableNumber: string;
  capacity: number;
  location: string;
  status: string;
  partyName: string;
  partySize: number;
  openedAt?: string;
}

interface WeddingRow {
  _id: string;
  quoteNumber?: string;
  clientName: string;
  eventDate: string;
  eventType: string;
  pax: number;
  status: string;
  totalAmount: number;
  advancePaid: number;
  hallId?: { name: string };
}

interface DayOutRow {
  _id: string;
  groupName: string;
  bookingDate: string;
  numberOfPeople: number;
  status: string;
  packageId?: { name: string };
}

interface Stats {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  checkedInToday: number;
  totalRevenue: number;
  todayGuests: number;
  activeTables: number;
  activeWeddings: number;
}

export default function Dashboard({ onNavigate }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingRow[]>([]);
  const [activeRooms, setActiveRooms] = useState<BookingRow[]>([]);
  const [activeTables, setActiveTables] = useState<TableRow[]>([]);
  const [upcomingWeddings, setUpcomingWeddings] = useState<WeddingRow[]>([]);
  const [activeDayOuts, setActiveDayOuts] = useState<DayOutRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsRes, allBookingsRes, checkedInRes, upcomingRes, tablesRes, weddingsRes, dayoutsRes] =
        await Promise.all([
          fetch('/api/rooms'),
          fetch('/api/bookings'),
          fetch('/api/bookings?status=checked-in'),
          fetch('/api/bookings?upcoming=true&limit=3'),
          fetch('/api/restaurant/tables'),
          fetch('/api/wedding-hall/quotations?upcoming=true&limit=3'),
          fetch('/api/day-out/group-bookings?status=confirmed'),
        ]);

      const [rooms, allB, checkedIn, upcoming, tables, weddings, dayouts] = await Promise.all([
        roomsRes.json(),
        allBookingsRes.json(),
        checkedInRes.json(),
        upcomingRes.json(),
        tablesRes.json(),
        weddingsRes.json(),
        dayoutsRes.json(),
      ]);

      const roomsList = rooms.data || [];
      const allBookings = allB.data || [];
      const checkedInList = checkedIn.data || [];
      const tablesList = tables.data || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayCheckIns = allBookings.filter((b: BookingRow) => {
        const d = new Date(b.checkInDate);
        return d >= today && d < tomorrow;
      });

      const occupiedCount = roomsList.filter((r: any) => !r.isAvailable).length;
      const revenue = allBookings
        .filter((b: BookingRow) => ['checked-out', 'checked-in'].includes(b.status))
        .reduce((s: number, b: BookingRow) => s + (b.totalAmount - (b.discountAmount || 0)), 0);

      const occupiedTables = tablesList.filter((t: TableRow) => t.status === 'occupied');
      const todayWeddings = (weddings.data || []).filter(
        (w: WeddingRow) => new Date(w.eventDate).toDateString() === new Date().toDateString()
      );

      setStats({
        totalRooms: roomsList.length,
        occupiedRooms: occupiedCount,
        availableRooms: roomsList.filter((r: any) => r.isAvailable).length,
        checkedInToday: todayCheckIns.length,
        totalRevenue: revenue,
        todayGuests: checkedInList.reduce((s: number, b: BookingRow) => s + b.numberOfGuests, 0),
        activeTables: occupiedTables.length,
        activeWeddings: todayWeddings.length,
      });

      setActiveRooms(checkedInList);
      setUpcomingBookings(upcoming.data || []);
      setActiveTables(occupiedTables);
      setUpcomingWeddings(weddings.data || []);
      setActiveDayOuts((dayouts.data || []).slice(0, 4));
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const nav = (tab: string) => onNavigate?.(tab);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  const statCards = stats
    ? [
        { label: 'Rooms Occupied', value: `${stats.occupiedRooms} / ${stats.totalRooms}`, icon: BedDouble, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Available Rooms', value: stats.availableRooms, icon: Hotel, color: 'text-green-600', bg: 'bg-green-50' },
        { label: "Today's Guests", value: stats.todayGuests, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
        { label: 'Checked-in Today', value: stats.checkedInToday, icon: CheckCircle, color: 'text-teal-500', bg: 'bg-teal-50' },
        { label: 'Active Tables', value: stats.activeTables, icon: TableIcon, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((c, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <div className={`mb-2 inline-flex rounded-lg p-2 ${c.bg}`}>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Upcoming Room Bookings ───────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" /> Upcoming Check-ins
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => nav('bookings')}>
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingBookings.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No upcoming check-ins</p>
            ) : (
              upcomingBookings.map((b) => (
                <div key={b._id} className="rounded-lg border border-border p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{b.customerName}</span>
                    <span className={`rounded-full px-2 py-0.5 font-medium ${
                      b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{b.status}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(b.checkInDate), 'MMM dd')}
                    </span>
                    <span>{b.numberOfNights}n · {b.numberOfGuests} guests</span>
                    <span className="font-medium text-foreground">${(b.totalAmount - (b.discountAmount || 0)).toFixed(0)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* ── Upcoming Weddings ────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" /> Upcoming Weddings
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => nav('wedding')}>
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingWeddings.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No upcoming events</p>
            ) : (
              upcomingWeddings.map((w) => (
                <div key={w._id} className="rounded-lg border border-border p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{w.clientName}</span>
                    <span className={`rounded-full px-2 py-0.5 font-medium ${
                      w.status === 'active' ? 'bg-green-100 text-green-700' :
                      w.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{w.status}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(w.eventDate), 'MMM dd, yyyy')}
                    </span>
                    <span>{w.pax} pax</span>
                    {w.hallId && <span className="text-foreground">{w.hallId.name}</span>}
                  </div>
                  <div className="mt-1 flex justify-between text-muted-foreground">
                    <span>Total: <span className="font-medium text-foreground">${(w.totalAmount || 0).toFixed(0)}</span></span>
                    <span>Paid: <span className="font-medium text-green-600">${(w.advancePaid || 0).toFixed(0)}</span></span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* ── Active Day-out Packages ──────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Anchor className="h-4 w-4 text-cyan-500" /> Active Day-outs
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => nav('dayout')}>
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeDayOuts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No active day-outs</p>
            ) : (
              activeDayOuts.map((d) => (
                <div key={d._id} className="rounded-lg border border-border p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{d.groupName}</span>
                    <span className="rounded-full bg-cyan-100 text-cyan-700 px-2 py-0.5 font-medium">{d.status}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-muted-foreground">
                    <span>{format(new Date(d.bookingDate), 'MMM dd')}</span>
                    <span>{d.numberOfPeople} people</span>
                    {d.packageId && <span className="text-foreground">{d.packageId.name}</span>}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Active Rooms ─────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-blue-500" /> Active Rooms
              <span className="ml-1 rounded-full bg-blue-100 text-blue-700 text-xs px-2 py-0.5">
                {activeRooms.length}
              </span>
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => nav('bookings')}>
              <Eye className="h-3.5 w-3.5 mr-1" /> All Bookings
            </Button>
          </CardHeader>
          <CardContent>
            {activeRooms.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No guests currently checked in</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {activeRooms.map((b) => {
                  const hoursLeft = differenceInHours(new Date(b.checkOutDate), new Date());
                  const checkingOutSoon = hoursLeft <= 24 && hoursLeft > 0;
                  return (
                    <div key={b._id} className={`flex items-center gap-3 rounded-lg border p-2.5 text-xs ${
                      checkingOutSoon ? 'border-amber-300 bg-amber-50' : 'border-border'
                    }`}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm shrink-0">
                        {b.roomIds.length}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{b.customerName}</p>
                        <p className="text-muted-foreground">
                          Check-out: {format(new Date(b.checkOutDate), 'MMM dd')}
                          {checkingOutSoon && <span className="ml-1 text-amber-600 font-medium">· checking out soon</span>}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 text-xs shrink-0" onClick={() => nav('bookings')}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Active Restaurant Tables ──────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-orange-500" /> Active Tables
              <span className="ml-1 rounded-full bg-orange-100 text-orange-700 text-xs px-2 py-0.5">
                {activeTables.length}
              </span>
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => nav('restaurant')}>
              <Eye className="h-3.5 w-3.5 mr-1" /> Restaurant
            </Button>
          </CardHeader>
          <CardContent>
            {activeTables.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No tables currently occupied</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {activeTables.map((t) => (
                  <div key={t._id} className="flex items-center gap-3 rounded-lg border border-border p-2.5 text-xs">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700 font-bold text-sm shrink-0">
                      {t.tableNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{t.partyName || 'Guest'}</p>
                      <p className="text-muted-foreground">
                        {t.partySize} guests · {t.location}
                        {t.openedAt && ` · opened ${format(new Date(t.openedAt), 'HH:mm')}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-xs shrink-0" onClick={() => nav('restaurant')}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Refresh button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" /> Refresh Dashboard
        </Button>
      </div>
    </div>
  );
}
