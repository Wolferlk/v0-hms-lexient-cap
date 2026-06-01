'use client';

import { useCallback, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Anchor, Plus, RefreshCw, Play, CheckCircle2, Users, Clock,
  Wrench, Star, Trash2, Edit, Search, DollarSign, Waves,
  Ship, UserCheck, Package, BarChart3, AlertTriangle, XCircle,
  ChevronRight, Phone, Flag, BadgeCheck, Hammer, Fuel,
  ClipboardList,
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { BOAT_RIDE_CURRENCIES, BOAT_RIDE_CURRENCY_LABELS } from '@/lib/boatRideConstants';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BoatPackage {
  _id: string; name: string; boatType: string; capacity: number;
  pricePerPerson: number; duration: number; routeDescription?: string;
  safetyRating?: number; mealIncluded?: boolean; lifeJacketsProvided?: boolean;
}

interface Boat {
  _id: string; boatId: string; name: string; type: string;
  registrationNumber: string; capacity: number; color?: string;
  engineType?: string; yearBuilt?: number;
  status: 'available' | 'on_ride' | 'maintenance' | 'out_of_service';
  serviceRecords?: ServiceRecord[]; nextServiceDueNote?: string; notes?: string;
}

interface ServiceRecord {
  _id?: string; date: string; type: string; description: string;
  costLKR: number; performedBy?: string; nextDueDateNote?: string;
}

interface BoatRider {
  _id: string; riderId: string; name: string; phone: string; email?: string;
  riderType: 'company' | 'contract'; licenseNumber?: string;
  monthlySalaryLKR?: number; contractPricePerRideLKR?: number;
  assignedBoatId?: string; staffEmployeeId?: string; status: string; profileNote?: string;
}

interface Booking {
  _id: string; bookingRef: string; customerName: string; customerPhone: string;
  customerEmail?: string; customerType: 'local' | 'tourist'; nationality?: string;
  packageId: { _id: string; name: string; duration: number; pricePerPerson: number; boatType: string } | null;
  boatId?: { _id: string; name: string; type: string; registrationNumber: string } | null;
  riderId?: { _id: string; name: string; riderType: string; phone: string } | null;
  riderTypeSnapshot?: string; riderContractAmountLKR?: number; riderPaymentDone?: boolean;
  numberOfPassengers: number; scheduledDate: string; scheduledTime: string;
  basePriceLKR: number; paymentCurrency: string; paymentAmountInCurrency: number;
  exchangeRateToLKR?: number; amountPaidLKR: number; paymentMethod?: string;
  paymentStatus: string; status: string; startTime?: string; endTime?: string; notes?: string;
  createdAt: string;
}

interface DashStats {
  activeRideCount: number;
  activeRides: Booking[];
  todayBookings: number;
  availableBoats: number;
  activeRiders: number;
  todayRevenueLKR: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  riding:    'bg-emerald-100 text-emerald-800',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show:   'bg-orange-100 text-orange-800',
};

const BOAT_TYPE_LABELS: Record<string, string> = {
  speed_boat: 'Speed Boat', catamaran: 'Catamaran', dinghy: 'Dinghy',
  yacht: 'Yacht', canoe: 'Canoe', pontoon: 'Pontoon', houseboat: 'Houseboat', ferry: 'Ferry',
};

const BOAT_STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  on_ride:   'bg-blue-100 text-blue-800',
  maintenance: 'bg-amber-100 text-amber-800',
  out_of_service: 'bg-red-100 text-red-800',
};

const SERVICE_TYPE_ICONS: Record<string, React.ReactNode> = {
  routine: <Wrench className="h-3.5 w-3.5" />,
  repair: <Hammer className="h-3.5 w-3.5" />,
  inspection: <ClipboardList className="h-3.5 w-3.5" />,
  fuel: <Fuel className="h-3.5 w-3.5" />,
  cleaning: <Waves className="h-3.5 w-3.5" />,
};

function rideDuration(b: Booking) {
  if (!b.startTime) return null;
  const diff = b.endTime
    ? new Date(b.endTime).getTime() - new Date(b.startTime).getTime()
    : Date.now() - new Date(b.startTime).getTime();
  const mins = Math.floor(diff / 60000);
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────

function DashboardTab({ stats, loading, onRefresh }: {
  stats: DashStats | null; loading: boolean; onRefresh: () => void;
}) {
  const { fmt } = useCurrency();

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw className="animate-spin h-6 w-6 text-muted-foreground" />
    </div>
  );

  const s = stats;

  const statCards = [
    { label: 'Now Riding', value: s?.activeRideCount ?? 0, icon: Waves, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { label: "Today's Bookings", value: s?.todayBookings ?? 0, icon: ClipboardList, bg: 'bg-blue-50', color: 'text-blue-600' },
    { label: 'Available Boats', value: s?.availableBoats ?? 0, icon: Ship, bg: 'bg-cyan-50', color: 'text-cyan-600' },
    { label: 'Active Riders', value: s?.activeRiders ?? 0, icon: UserCheck, bg: 'bg-violet-50', color: 'text-violet-600' },
    {
      label: "Today's Revenue",
      value: `Rs.${(s?.todayRevenueLKR ?? 0).toLocaleString()}`,
      icon: DollarSign, bg: 'bg-amber-50', color: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Live Overview</h3>
        <Button size="sm" variant="outline" onClick={onRefresh}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((c) => (
          <Card key={c.label} className="overflow-hidden">
            <CardContent className="p-4">
              <div className={`mb-2 inline-flex rounded-lg p-2 ${c.bg}`}>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active rides */}
      <Card className="border-emerald-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Waves className="h-4 w-4 text-emerald-500 animate-pulse" />
            Now Riding — {s?.activeRideCount ?? 0} active
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!s?.activeRides.length ? (
            <p className="text-center text-muted-foreground py-6 text-sm">No rides in progress</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {s.activeRides.map((b) => (
                <div key={b._id} className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{b.customerName}</span>
                    <span className="text-xs bg-emerald-200 text-emerald-800 rounded-full px-2 py-0.5 font-medium">
                      RIDING
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p className="flex items-center gap-1.5"><Ship className="h-3 w-3" />{(b.boatId as any)?.name ?? '—'}</p>
                    <p className="flex items-center gap-1.5"><UserCheck className="h-3 w-3" />{(b.riderId as any)?.name ?? 'Unassigned'}</p>
                    <p className="flex items-center gap-1.5"><Users className="h-3 w-3" />{b.numberOfPassengers} passengers</p>
                    <p className="flex items-center gap-1.5"><Clock className="h-3 w-3" />
                      Started {b.startTime ? format(new Date(b.startTime), 'HH:mm') : '—'} · {rideDuration(b)} elapsed
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-emerald-800">
                    {(b.packageId as any)?.name ?? '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Bookings Tab ──────────────────────────────────────────────────────────────

function BookingsTab({
  bookings, boats, riders, loading, onRefresh, onReload,
}: {
  bookings: Booking[]; boats: Boat[]; riders: BoatRider[];
  loading: boolean; onRefresh: () => void; onReload: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [assignBoat, setAssignBoat] = useState('');
  const [assignRider, setAssignRider] = useState('');
  const [saving, setSaving] = useState(false);
  // Complete ride state
  const [completeDialog, setCompleteDialog] = useState(false);
  const [payLKR, setPayLKR] = useState('');
  const [payCurrency, setPayCurrency] = useState('LKR');
  const [payAmtCurrency, setPayAmtCurrency] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payRider, setPayRider] = useState(false);
  const [completing, setCompleting] = useState(false);
  const { fmt, convert, rates } = useCurrency();

  const filtered = bookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    const q = search.toLowerCase();
    return !q || b.customerName.toLowerCase().includes(q) || b.bookingRef.toLowerCase().includes(q);
  });

  const act = async (bookingId: string, action: 'start' | 'cancel' | 'confirm') => {
    setSaving(true);
    try {
      if (action === 'start') {
        const r = await fetch(`/api/boat-ride/bookings/${bookingId}/start`, { method: 'POST' });
        const d = await r.json();
        if (!d.success) { toast.error(d.error); return; }
        toast.success('Ride started!');
      } else {
        const r = await fetch(`/api/boat-ride/bookings/${bookingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: action === 'confirm' ? 'confirmed' : 'cancelled' }),
        });
        const d = await r.json();
        if (!d.success) { toast.error(d.error); return; }
        toast.success(`Booking ${action === 'confirm' ? 'confirmed' : 'cancelled'}`);
      }
      onReload();
    } finally { setSaving(false); }
  };

  const saveAssignment = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/boat-ride/bookings/${selected._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(assignBoat ? { boatId: assignBoat } : {}),
          ...(assignRider ? { riderId: assignRider } : {}),
          status: selected.status === 'pending' ? 'confirmed' : selected.status,
        }),
      });
      const d = await r.json();
      if (!d.success) { toast.error(d.error); return; }
      toast.success('Assignment saved');
      setSelected(null);
      onReload();
    } finally { setSaving(false); }
  };

  const completeRide = async () => {
    if (!selected) return;
    setCompleting(true);
    try {
      const r = await fetch(`/api/boat-ride/bookings/${selected._id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPaidLKR: parseFloat(payLKR) || selected.basePriceLKR,
          paymentCurrency: payCurrency,
          paymentAmountInCurrency: parseFloat(payAmtCurrency) || parseFloat(payLKR),
          exchangeRateToLKR: payCurrency !== 'LKR' ? rates[payCurrency] : undefined,
          paymentMethod: payMethod,
          markRiderPaid: payRider,
        }),
      });
      const d = await r.json();
      if (!d.success) { toast.error(d.error); return; }
      toast.success('Ride completed!');
      setCompleteDialog(false);
      setSelected(null);
      onReload();
    } finally { setCompleting(false); }
  };

  // Auto-fill currency amount when payCurrency changes
  const handleCurrencyChange = (cur: string) => {
    setPayCurrency(cur);
    const lkrAmt = parseFloat(payLKR) || (selected?.basePriceLKR ?? 0);
    if (cur === 'LKR') {
      setPayAmtCurrency(lkrAmt.toFixed(0));
    } else if (rates[cur]) {
      setPayAmtCurrency((lkrAmt / rates[cur]).toFixed(2));
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search name / ref…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['all','pending','confirmed','riding','completed','cancelled','no_show'].map(s => (
              <SelectItem key={s} value={s}>{s === 'all' ? 'All Status' : s.replace('_',' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No bookings found</p>
        ) : filtered.map(b => (
          <div key={b._id} className="rounded-xl border p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{b.customerName}</span>
                  <span className="text-xs text-muted-foreground font-mono">{b.bookingRef}</span>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_COLORS[b.status] ?? ''}`}>
                    {b.status.replace('_',' ')}
                  </span>
                  {b.customerType === 'tourist' && (
                    <span className="text-xs bg-purple-50 text-purple-700 rounded-full px-2 py-0.5">
                      <Flag className="inline h-2.5 w-2.5 mr-0.5" />{b.nationality || 'Tourist'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span><Phone className="inline h-3 w-3 mr-0.5" />{b.customerPhone}</span>
                  <span><Ship className="inline h-3 w-3 mr-0.5" />{(b.boatId as any)?.name ?? 'No boat'}</span>
                  <span><UserCheck className="inline h-3 w-3 mr-0.5" />{(b.riderId as any)?.name ?? 'No rider'}</span>
                  <span><Users className="inline h-3 w-3 mr-0.5" />{b.numberOfPassengers} pax</span>
                  <span><Clock className="inline h-3 w-3 mr-0.5" />{format(new Date(b.scheduledDate),'MMM dd')} {b.scheduledTime}</span>
                  <span className="font-medium text-foreground">
                    Rs.{b.basePriceLKR.toLocaleString()}
                    {b.paymentCurrency !== 'LKR' && ` / ${b.paymentCurrency} ${b.paymentAmountInCurrency.toLocaleString()}`}
                  </span>
                </div>
              </div>
              {/* Quick actions */}
              <div className="flex gap-1 shrink-0 flex-wrap">
                {['pending','confirmed'].includes(b.status) && (
                  <Button size="sm" variant="outline" className="h-7 text-xs"
                    onClick={() => { setSelected(b); setAssignBoat((b.boatId as any)?._id ?? ''); setAssignRider((b.riderId as any)?._id ?? ''); }}>
                    <Ship className="h-3 w-3 mr-1" />Assign
                  </Button>
                )}
                {b.status === 'confirmed' && b.boatId && (
                  <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => act(b._id, 'start')} disabled={saving}>
                    <Play className="h-3 w-3 mr-1" />Start
                  </Button>
                )}
                {b.status === 'riding' && (
                  <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setSelected(b);
                      setPayLKR(String(b.basePriceLKR));
                      setPayCurrency('LKR');
                      setPayAmtCurrency(String(b.basePriceLKR));
                      setPayRider(false);
                      setCompleteDialog(true);
                    }}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />Complete
                  </Button>
                )}
                {['pending','confirmed'].includes(b.status) && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:bg-red-50"
                    onClick={() => act(b._id, 'cancel')} disabled={saving}>
                    <XCircle className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assign Boat/Rider Dialog */}
      <Dialog open={!!selected && !completeDialog} onOpenChange={o => { if (!o) setSelected(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Boat & Rider — {selected?.customerName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Boat</Label>
              <Select value={assignBoat} onValueChange={setAssignBoat}>
                <SelectTrigger><SelectValue placeholder="Select boat…" /></SelectTrigger>
                <SelectContent>
                  {boats.filter(b => b.status === 'available' || b._id === assignBoat).map(b => (
                    <SelectItem key={b._id} value={b._id}>
                      {b.name} — {BOAT_TYPE_LABELS[b.type] ?? b.type} · {b.capacity} cap
                      {b.status !== 'available' && ` (${b.status})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Rider</Label>
              <Select value={assignRider} onValueChange={setAssignRider}>
                <SelectTrigger><SelectValue placeholder="Select rider…" /></SelectTrigger>
                <SelectContent>
                  {riders.filter(r => r.status === 'active' || r._id === assignRider).map(r => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.name} — {r.riderType === 'company' ? '🏢 Company' : `📋 Contract Rs.${r.contractPricePerRideLKR?.toLocaleString()}/ride`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
              <Button onClick={saveAssignment} disabled={saving}>
                {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <BadgeCheck className="h-4 w-4 mr-1" />}
                Confirm & Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Ride Dialog */}
      <Dialog open={completeDialog} onOpenChange={o => { if (!o) setCompleteDialog(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
              Complete Ride — {selected?.customerName}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 pt-1">
              {/* Ride summary */}
              <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Package</span><span className="font-medium">{(selected.packageId as any)?.name}</span></div>
                <div className="flex justify-between"><span>Passengers</span><span className="font-medium">{selected.numberOfPassengers}</span></div>
                <div className="flex justify-between"><span>Duration</span><span className="font-medium">{rideDuration(selected) ?? '—'}</span></div>
                <div className="flex justify-between font-semibold border-t pt-1"><span>Base Price</span><span>Rs.{selected.basePriceLKR.toLocaleString()}</span></div>
              </div>

              {/* Payment currency */}
              <div className="space-y-1.5">
                <Label>Payment Currency</Label>
                <Select value={payCurrency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BOAT_RIDE_CURRENCIES.map(c => (
                      <SelectItem key={c} value={c}>{BOAT_RIDE_CURRENCY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {payCurrency !== 'LKR' && (
                <div className="rounded-lg border bg-blue-50 p-3 text-xs space-y-1">
                  <p className="font-medium text-blue-800">Tourist Currency Payment</p>
                  <p>Rate: 1 {payCurrency} = Rs.{rates[payCurrency] ? (1 / (rates[payCurrency] / (rates['LKR'] ?? 1))).toFixed(2) : '—'}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount in {payCurrency}</Label>
                  <Input type="number" min={0} value={payAmtCurrency} onChange={e => {
                    setPayAmtCurrency(e.target.value);
                    if (payCurrency !== 'LKR' && rates[payCurrency]) {
                      const lkr = parseFloat(e.target.value) * (rates['LKR'] ?? 1) / (rates[payCurrency] ?? 1);
                      setPayLKR(lkr.toFixed(0));
                    } else {
                      setPayLKR(e.target.value);
                    }
                  }} />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount in LKR</Label>
                  <Input type="number" min={0} value={payLKR} onChange={e => setPayLKR(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['cash','card','upi','bank_transfer'].map(m => (
                      <SelectItem key={m} value={m}>{m.replace('_',' ').toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rider payment — only for contract riders */}
              {selected.riderTypeSnapshot === 'contract' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Contract Rider Payment</p>
                      <p className="text-xs text-muted-foreground">
                        {(selected.riderId as any)?.name} — Rs.{(selected.riderContractAmountLKR ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={payRider} onChange={e => setPayRider(e.target.checked)} className="h-4 w-4" />
                      Mark paid
                    </label>
                  </div>
                </div>
              )}
              {selected.riderTypeSnapshot === 'company' && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-muted-foreground">
                  <BadgeCheck className="inline h-3.5 w-3.5 mr-1 text-green-600" />
                  Company rider — covered by monthly salary. No per-ride payment.
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setCompleteDialog(false)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={completeRide} disabled={completing || !payLKR}>
                  {completing ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                  Complete & Collect Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── New Booking Tab ───────────────────────────────────────────────────────────

function NewBookingTab({
  packages, onCreated,
}: { packages: BoatPackage[]; onCreated: () => void }) {
  const { rates } = useCurrency();
  const blank = {
    customerName: '', customerPhone: '', customerEmail: '',
    customerType: 'tourist', nationality: '',
    packageId: '', numberOfPassengers: 1,
    scheduledDate: '', scheduledTime: '09:00',
    paymentCurrency: 'LKR', notes: '',
  };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const pkg = packages.find(p => p._id === form.packageId);
  const baseLKR = pkg ? pkg.pricePerPerson * form.numberOfPassengers : 0;
  const fxAmount = baseLKR && form.paymentCurrency !== 'LKR' && rates['LKR'] && rates[form.paymentCurrency]
    ? (baseLKR / rates[form.paymentCurrency]).toFixed(2)
    : String(baseLKR);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.customerName || !form.customerPhone || !form.packageId || !form.scheduledDate) {
      toast.error('Fill all required fields'); return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/boat-ride/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          numberOfPassengers: Number(form.numberOfPassengers),
          basePriceLKR: baseLKR,
          paymentAmountInCurrency: parseFloat(fxAmount),
          exchangeRateToLKR: form.paymentCurrency !== 'LKR' ? rates[form.paymentCurrency] : undefined,
        }),
      });
      const d = await r.json();
      if (!d.success) { toast.error(d.error); return; }
      toast.success(`Booking ${d.data.bookingRef} created!`);
      setForm(blank);
      onCreated();
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" /> Customer Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Full Name *</Label>
            <Input value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="Guest name" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone *</Label>
            <Input value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)} placeholder="+94 7X XXX XXXX" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.customerEmail} onChange={e => set('customerEmail', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Customer Type</Label>
            <Select value={form.customerType} onValueChange={v => set('customerType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="local">🇱🇰 Local</SelectItem>
                <SelectItem value="tourist">🌍 Tourist</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.customerType === 'tourist' && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nationality / Country</Label>
              <Input value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="e.g. USA, India, Australia…" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Anchor className="h-4 w-4 text-cyan-500" /> Ride Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Package *</Label>
            <Select value={form.packageId} onValueChange={v => set('packageId', v)}>
              <SelectTrigger><SelectValue placeholder="Choose package…" /></SelectTrigger>
              <SelectContent>
                {packages.map(p => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name} — {BOAT_TYPE_LABELS[p.boatType] ?? p.boatType} · {p.duration}min · Rs.{p.pricePerPerson.toLocaleString()}/person
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {pkg && (
            <div className="sm:col-span-2 rounded-lg bg-cyan-50 border border-cyan-200 p-3 text-xs grid grid-cols-3 gap-2">
              <div><p className="text-muted-foreground">Boat Type</p><p className="font-medium">{BOAT_TYPE_LABELS[pkg.boatType] ?? pkg.boatType}</p></div>
              <div><p className="text-muted-foreground">Duration</p><p className="font-medium">{pkg.duration} min</p></div>
              <div><p className="text-muted-foreground">Capacity</p><p className="font-medium">{pkg.capacity} pax</p></div>
              {pkg.routeDescription && <div className="col-span-3"><p className="text-muted-foreground">Route</p><p>{pkg.routeDescription}</p></div>}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Passengers *</Label>
            <Input type="number" min={1} max={pkg?.capacity ?? 100} value={form.numberOfPassengers}
              onChange={e => set('numberOfPassengers', parseInt(e.target.value) || 1)} />
          </div>
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Input type="date" value={form.scheduledDate} onChange={e => set('scheduledDate', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Time *</Label>
            <Input type="time" value={form.scheduledTime} onChange={e => set('scheduledTime', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-amber-500" /> Payment Currency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Payment Currency</Label>
            <Select value={form.paymentCurrency} onValueChange={v => set('paymentCurrency', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BOAT_RIDE_CURRENCIES.map(c => (
                  <SelectItem key={c} value={c}>{BOAT_RIDE_CURRENCY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {baseLKR > 0 && (
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 p-4 space-y-2 text-sm">
              <p className="font-semibold text-blue-800">Price Summary</p>
              <div className="flex justify-between"><span>Per person</span><span>Rs.{pkg!.pricePerPerson.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>× {form.numberOfPassengers} passengers</span><span>Rs.{baseLKR.toLocaleString()}</span></div>
              {form.paymentCurrency !== 'LKR' && (
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>In {form.paymentCurrency}</span>
                  <span className="text-blue-700">{form.paymentCurrency} {parseFloat(fxAmount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span>Total LKR</span>
                <span>Rs.{baseLKR.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any special requests…" />
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" onClick={submit} disabled={saving || !baseLKR}>
        {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
        Create Boat Ride Booking
      </Button>
    </div>
  );
}

// ── Packages Tab ──────────────────────────────────────────────────────────────

function PackagesTab({ packages, onReload }: { packages: BoatPackage[]; onReload: () => void }) {
  const blankPkg = { name: '', boatType: 'speed_boat', capacity: 8, pricePerPerson: 0, duration: 60, routeDescription: '', safetyRating: 5, mealIncluded: false, lifeJacketsProvided: true };
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<BoatPackage | null>(null);
  const [form, setForm] = useState(blankPkg);
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditing(null); setForm(blankPkg); setDialog(true); };
  const openEdit = (p: BoatPackage) => {
    setEditing(p);
    setForm({ name: p.name, boatType: p.boatType, capacity: p.capacity, pricePerPerson: p.pricePerPerson, duration: p.duration, routeDescription: p.routeDescription ?? '', safetyRating: p.safetyRating ?? 5, mealIncluded: !!p.mealIncluded, lifeJacketsProvided: p.lifeJacketsProvided !== false });
    setDialog(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const url = editing ? `/api/boat-ride/packages/${editing._id}` : '/api/boat-ride/packages';
      const r = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!d.success) { toast.error(d.error); return; }
      toast.success(editing ? 'Package updated' : 'Package created');
      setDialog(false); onReload();
    } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this package?')) return;
    await fetch(`/api/boat-ride/packages/${id}`, { method: 'DELETE' });
    toast.success('Deleted'); onReload();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{packages.length} packages</p>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Package</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map(p => (
          <Card key={p._id} className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold">{p.name}</h4>
                  <p className="text-xs text-muted-foreground">{BOAT_TYPE_LABELS[p.boatType] ?? p.boatType}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(p)}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => del(p._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded bg-muted/40 px-2 py-1.5">
                  <p className="text-muted-foreground">Capacity</p>
                  <p className="font-medium">{p.capacity} pax</p>
                </div>
                <div className="rounded bg-muted/40 px-2 py-1.5">
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{p.duration} min</p>
                </div>
                <div className="rounded bg-muted/40 px-2 py-1.5 col-span-2">
                  <p className="text-muted-foreground">Price / person</p>
                  <p className="font-bold text-sm">Rs.{p.pricePerPerson.toLocaleString()}</p>
                </div>
              </div>
              {p.routeDescription && <p className="text-xs text-muted-foreground line-clamp-2">{p.routeDescription}</p>}
              <div className="flex gap-3 text-xs text-muted-foreground">
                {p.mealIncluded && <span className="text-green-600">✓ Meal</span>}
                {p.lifeJacketsProvided && <span className="text-blue-600">✓ Life Jackets</span>}
                {p.safetyRating && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{p.safetyRating}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Package' : 'New Boat Ride Package'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5"><Label>Package Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Boat Type *</Label>
                <Select value={form.boatType} onValueChange={v => setForm(f => ({ ...f, boatType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(BOAT_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Capacity *</Label>
                <Input type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Price/Person (LKR) *</Label>
                <Input type="number" min={0} value={form.pricePerPerson} onChange={e => setForm(f => ({ ...f, pricePerPerson: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-1.5"><Label>Duration (min) *</Label>
                <Input type="number" min={1} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 1 }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Route Description</Label>
              <Input value={form.routeDescription} onChange={e => setForm(f => ({ ...f, routeDescription: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Safety Rating (1–5)</Label>
                <Input type="number" min={1} max={5} value={form.safetyRating} onChange={e => setForm(f => ({ ...f, safetyRating: parseInt(e.target.value) || 5 }))} /></div>
              <div className="flex flex-col gap-2 pt-5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.mealIncluded} onChange={e => setForm(f => ({ ...f, mealIncluded: e.target.checked }))} />
                  Meal Included
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.lifeJacketsProvided} onChange={e => setForm(f => ({ ...f, lifeJacketsProvided: e.target.checked }))} />
                  Life Jackets
                </label>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving || !form.name || !form.pricePerPerson}>
                {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : null}
                {editing ? 'Save Changes' : 'Create Package'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Fleet Tab ─────────────────────────────────────────────────────────────────

function FleetTab({ boats, onReload }: { boats: Boat[]; onReload: () => void }) {
  const blankBoat = { name: '', type: 'speed_boat', registrationNumber: '', capacity: 8, color: '', engineType: '', yearBuilt: '', notes: '' };
  const [boatDialog, setBoatDialog] = useState(false);
  const [editBoat, setEditBoat] = useState<Boat | null>(null);
  const [form, setForm] = useState(blankBoat);
  const [serviceDialog, setServiceDialog] = useState(false);
  const [serviceTarget, setServiceTarget] = useState<Boat | null>(null);
  const [svcForm, setSvcForm] = useState({ type: 'routine', description: '', costLKR: '', performedBy: '', nextDueDateNote: '' });
  const [statusDialog, setStatusDialog] = useState<Boat | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedBoat, setExpandedBoat] = useState<string | null>(null);

  const openAdd = () => { setEditBoat(null); setForm(blankBoat); setBoatDialog(true); };
  const openEdit = (b: Boat) => {
    setEditBoat(b);
    setForm({ name: b.name, type: b.type, registrationNumber: b.registrationNumber, capacity: b.capacity, color: b.color ?? '', engineType: b.engineType ?? '', yearBuilt: b.yearBuilt ? String(b.yearBuilt) : '', notes: b.notes ?? '' });
    setBoatDialog(true);
  };

  const saveBoat = async () => {
    setSaving(true);
    try {
      const url = editBoat ? `/api/boat-ride/boats/${editBoat._id}` : '/api/boat-ride/boats';
      const r = await fetch(url, {
        method: editBoat ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, capacity: Number(form.capacity), yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : undefined }),
      });
      const d = await r.json();
      if (!d.success) { toast.error(d.error); return; }
      toast.success(editBoat ? 'Boat updated' : 'Boat added');
      setBoatDialog(false); onReload();
    } finally { setSaving(false); }
  };

  const saveService = async () => {
    if (!serviceTarget || !svcForm.description) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/boat-ride/boats/${serviceTarget._id}/service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...svcForm, costLKR: parseFloat(svcForm.costLKR) || 0 }),
      });
      const d = await r.json();
      if (!d.success) { toast.error(d.error); return; }
      toast.success('Service record added');
      setServiceDialog(false); onReload();
    } finally { setSaving(false); }
  };

  const updateStatus = async (boatId: string, status: string) => {
    await fetch(`/api/boat-ride/boats/${boatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    toast.success('Status updated');
    setStatusDialog(null);
    onReload();
  };

  const delBoat = async (id: string) => {
    if (!confirm('Delete this boat?')) return;
    await fetch(`/api/boat-ride/boats/${id}`, { method: 'DELETE' });
    toast.success('Boat removed'); onReload();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{boats.length} boats in fleet</p>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Boat</Button>
      </div>

      <div className="space-y-3">
        {boats.length === 0 && <p className="text-center text-muted-foreground py-12">No boats yet</p>}
        {boats.map(b => (
          <Card key={b._id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold">{b.name}</h4>
                    <span className="text-xs font-mono text-muted-foreground">{b.boatId}</span>
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${BOAT_STATUS_COLORS[b.status] ?? ''}`}>
                      {b.status.replace('_',' ')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {BOAT_TYPE_LABELS[b.type] ?? b.type} · Cap {b.capacity} · Reg: {b.registrationNumber}
                    {b.color && ` · ${b.color}`}
                    {b.yearBuilt && ` · ${b.yearBuilt}`}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0 flex-wrap">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setStatusDialog(b); }}>
                    Status
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setServiceTarget(b); setSvcForm({ type: 'routine', description: '', costLKR: '', performedBy: '', nextDueDateNote: '' }); setServiceDialog(true); }}>
                    <Wrench className="h-3 w-3 mr-1" />Service
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(b)}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => delBoat(b._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setExpandedBoat(expandedBoat === b._id ? null : b._id)}>
                    <ChevronRight className={`h-4 w-4 transition-transform ${expandedBoat === b._id ? 'rotate-90' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Service records */}
              {expandedBoat === b._id && (
                <div className="mt-3 border-t pt-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Service Records ({b.serviceRecords?.length ?? 0})
                  </p>
                  {!b.serviceRecords?.length ? (
                    <p className="text-xs text-muted-foreground">No records yet</p>
                  ) : (
                    [...b.serviceRecords].reverse().slice(0, 10).map((s, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs">
                        <span className="shrink-0 mt-0.5">{SERVICE_TYPE_ICONS[s.type]}</span>
                        <div className="flex-1">
                          <p className="font-medium">{s.description}</p>
                          <p className="text-muted-foreground">
                            {format(new Date(s.date), 'dd MMM yyyy')} · Rs.{s.costLKR.toLocaleString()}
                            {s.performedBy && ` · ${s.performedBy}`}
                          </p>
                          {s.nextDueDateNote && <p className="text-amber-600">Next: {s.nextDueDateNote}</p>}
                        </div>
                      </div>
                    ))
                  )}
                  {b.notes && <p className="text-xs text-muted-foreground italic">{b.notes}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Boat */}
      <Dialog open={boatDialog} onOpenChange={setBoatDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editBoat ? 'Edit Boat' : 'Add Boat to Fleet'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2"><Label>Boat Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Type *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(BOAT_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Capacity *</Label>
                <Input type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value as any }))} /></div>
              <div className="space-y-1.5"><Label>Registration No. *</Label>
                <Input value={form.registrationNumber} onChange={e => setForm(f => ({ ...f, registrationNumber: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Color</Label>
                <Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Engine Type</Label>
                <Input value={form.engineType} onChange={e => setForm(f => ({ ...f, engineType: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Year Built</Label>
                <Input type="number" value={form.yearBuilt} onChange={e => setForm(f => ({ ...f, yearBuilt: e.target.value }))} /></div>
              <div className="space-y-1.5 col-span-2"><Label>Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setBoatDialog(false)}>Cancel</Button>
              <Button onClick={saveBoat} disabled={saving || !form.name || !form.registrationNumber}>
                {editBoat ? 'Save Changes' : 'Add Boat'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={serviceDialog} onOpenChange={setServiceDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Service Record — {serviceTarget?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5"><Label>Service Type *</Label>
              <Select value={svcForm.type} onValueChange={v => setSvcForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['routine','repair','inspection','fuel','cleaning'].map(t => (
                    <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Description *</Label>
              <Input value={svcForm.description} onChange={e => setSvcForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Cost (LKR)</Label>
                <Input type="number" min={0} value={svcForm.costLKR} onChange={e => setSvcForm(f => ({ ...f, costLKR: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Performed By</Label>
                <Input value={svcForm.performedBy} onChange={e => setSvcForm(f => ({ ...f, performedBy: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Next Service Note</Label>
              <Input value={svcForm.nextDueDateNote} onChange={e => setSvcForm(f => ({ ...f, nextDueDateNote: e.target.value }))} placeholder="e.g. In 3 months / After 200 hours" /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setServiceDialog(false)}>Cancel</Button>
              <Button onClick={saveService} disabled={saving || !svcForm.description}>Add Record</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={!!statusDialog} onOpenChange={o => { if (!o) setStatusDialog(null); }}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Update Status — {statusDialog?.name}</DialogTitle></DialogHeader>
          <div className="grid gap-2 pt-2">
            {(['available','maintenance','out_of_service'] as const).map(s => (
              <Button key={s} variant={statusDialog?.status === s ? 'default' : 'outline'} className="justify-start"
                onClick={() => statusDialog && updateStatus(statusDialog._id, s)}>
                <span className={`mr-2 h-2 w-2 rounded-full inline-block ${s === 'available' ? 'bg-green-500' : s === 'maintenance' ? 'bg-amber-500' : 'bg-red-500'}`} />
                {s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Riders Tab ────────────────────────────────────────────────────────────────

const UNASSIGNED_BOAT_VALUE = '__unassigned_boat__';

function RidersTab({ riders, boats, onReload }: { riders: BoatRider[]; boats: Boat[]; onReload: () => void }) {
  const blankRider = { name: '', phone: '', email: '', riderType: 'contract', licenseNumber: '', licenseExpiry: '', monthlySalaryLKR: '', contractPricePerRideLKR: '', assignedBoatId: '', profileNote: '' };
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<BoatRider | null>(null);
  const [form, setForm] = useState(blankRider);
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditing(null); setForm(blankRider); setDialog(true); };
  const openEdit = (r: BoatRider) => {
    setEditing(r);
    setForm({ name: r.name, phone: r.phone, email: r.email ?? '', riderType: r.riderType, licenseNumber: r.licenseNumber ?? '', licenseExpiry: '', monthlySalaryLKR: String(r.monthlySalaryLKR ?? ''), contractPricePerRideLKR: String(r.contractPricePerRideLKR ?? ''), assignedBoatId: r.assignedBoatId ?? '', profileNote: r.profileNote ?? '' });
    setDialog(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const url = editing ? `/api/boat-ride/riders/${editing._id}` : '/api/boat-ride/riders';
      const r = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          monthlySalaryLKR: parseFloat(form.monthlySalaryLKR) || 0,
          contractPricePerRideLKR: parseFloat(form.contractPricePerRideLKR) || 0,
        }),
      });
      const d = await r.json();
      if (!d.success) { toast.error(d.error); return; }
      toast.success(editing ? 'Rider updated' : 'Rider added');
      setDialog(false); onReload();
    } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Remove this rider?')) return;
    await fetch(`/api/boat-ride/riders/${id}`, { method: 'DELETE' });
    toast.success('Rider removed'); onReload();
  };

  const markAttendance = async (r: BoatRider) => {
    if (!r.staffEmployeeId) {
      toast.error('This rider is not linked to Staff yet');
      return;
    }

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const month = todayStr.slice(0, 7);
    const payload = {
      employeeId: r.staffEmployeeId,
      attendanceDate: todayStr,
      status: 'present',
      checkInTime: today.toISOString(),
      remarks: 'Marked from Boat Ride Management',
    };

    try {
      const existingRes = await fetch(`/api/staff/attendance?employeeId=${r.staffEmployeeId}&month=${month}`);
      const existingData = await existingRes.json();
      const existingToday = Array.isArray(existingData.data)
        ? existingData.data.find((record: any) => {
            const recordDate = record.attendanceDate ? new Date(record.attendanceDate).toISOString().slice(0, 10) : '';
            return recordDate === todayStr;
          })
        : null;

      const res = existingToday
        ? await fetch('/api/staff/attendance', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: existingToday._id,
              status: 'present',
              checkInTime: today.toISOString(),
              checkOutTime: existingToday.checkOutTime ?? undefined,
              remarks: 'Marked from Boat Ride Management',
            }),
          })
        : await fetch('/api/staff/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Failed to mark attendance');
        return;
      }
      toast.success(`${r.name} marked present`);
    } catch {
      toast.error('Failed to mark attendance');
    }
  };

  const payRider = async (r: BoatRider) => {
    if (!r.staffEmployeeId) {
      toast.error('This rider is not linked to Staff yet');
      return;
    }

    const month = new Date().toISOString().slice(0, 7);
    const salary = r.riderType === 'company'
      ? Number(r.monthlySalaryLKR) || 0
      : Number(r.contractPricePerRideLKR) || 0;

    try {
      const existingRes = await fetch(`/api/staff/payroll?employeeId=${r.staffEmployeeId}&month=${month}`);
      const existingData = await existingRes.json();
      const existing = Array.isArray(existingData.data)
        ? existingData.data.find((record: any) => record.month === month)
        : null;

      let payrollId = existing?._id;
      if (!existing) {
        const createRes = await fetch('/api/staff/payroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: r.staffEmployeeId,
            month,
            allowances: 0,
            deductions: 0,
          }),
        });
        const createData = await createRes.json();
        if (!createData.success) {
          toast.error(createData.error || 'Failed to create payroll');
          return;
        }
        payrollId = createData.data?._id;
      }

      const payRes = await fetch('/api/staff/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: payrollId,
          status: 'paid',
          paymentDate: new Date().toISOString(),
          paymentMethod: 'cash',
          remarks: `Boat ride staff payment for ${month} (${r.riderType} rider, Rs.${salary.toLocaleString()})`,
        }),
      });
      const payData = await payRes.json();
      if (!payData.success) {
        toast.error(payData.error || 'Failed to mark payment');
        return;
      }
      toast.success(`${r.name} marked paid`);
    } catch {
      toast.error('Failed to mark payment');
    }
  };

  const company = riders.filter(r => r.riderType === 'company');
  const contract = riders.filter(r => r.riderType === 'contract');

  const RiderCard = ({ r }: { r: BoatRider }) => {
    const assignedBoat = boats.find(b => b._id === r.assignedBoatId || b.boatId === r.assignedBoatId);
    return (
      <div className="rounded-xl border p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">{r.name}</p>
              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${r.riderType === 'company' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                {r.riderType === 'company' ? '🏢 Company' : '📋 Contract'}
              </span>
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${r.status === 'active' ? 'bg-green-100 text-green-700' : r.status === 'on_ride' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                {r.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{r.phone}{r.email && ` · ${r.email}`}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(r)}><Edit className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => del(r._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {r.riderType === 'company' ? (
            <>
              <div className="rounded bg-blue-50 px-2 py-1.5">
                <p className="text-muted-foreground">Monthly Salary</p>
                <p className="font-bold text-blue-800">Rs.{(r.monthlySalaryLKR ?? 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">No per-ride payment</p>
              </div>
              <div className="rounded bg-muted/40 px-2 py-1.5">
                <p className="text-muted-foreground">Assigned Boat</p>
                <p className="font-medium">{assignedBoat?.name ?? '—'}</p>
              </div>
            </>
          ) : (
            <div className="rounded bg-amber-50 px-2 py-1.5 col-span-2">
              <p className="text-muted-foreground">Contract Rate / Ride</p>
              <p className="font-bold text-amber-800">Rs.{(r.contractPricePerRideLKR ?? 0).toLocaleString()}</p>
            </div>
          )}
        </div>
        {r.licenseNumber && (
          <p className="text-xs text-muted-foreground">
            <BadgeCheck className="inline h-3 w-3 mr-1 text-green-600" />License: {r.licenseNumber}
          </p>
        )}
        {r.profileNote && <p className="text-xs text-muted-foreground italic">{r.profileNote}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markAttendance(r)}>
            <UserCheck className="h-3.5 w-3.5 mr-1" />Mark Attendance
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => payRider(r)}>
            <DollarSign className="h-3.5 w-3.5 mr-1" />Pay
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{riders.length} riders total</p>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Rider</Button>
      </div>

      {company.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
            <BadgeCheck className="h-4 w-4" />Company Riders ({company.length}) — Monthly Salary
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {company.map(r => <RiderCard key={r._id} r={r} />)}
          </div>
        </div>
      )}

      {contract.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />Contract Riders ({contract.length}) — Per-Ride Payment
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contract.map(r => <RiderCard key={r._id} r={r} />)}
          </div>
        </div>
      )}

      {riders.length === 0 && <p className="text-center text-muted-foreground py-12">No riders added yet</p>}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Rider' : 'Add Rider'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2"><Label>Full Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Phone *</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="space-y-1.5 col-span-2"><Label>Rider Type *</Label>
                <Select value={form.riderType} onValueChange={v => setForm(f => ({ ...f, riderType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">🏢 Company Rider (Monthly Salary)</SelectItem>
                    <SelectItem value="contract">📋 Contract Rider (Per-Ride Payment)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.riderType === 'company' ? (
                <>
                  <div className="space-y-1.5"><Label>Monthly Salary (LKR)</Label>
                    <Input type="number" min={0} value={form.monthlySalaryLKR} onChange={e => setForm(f => ({ ...f, monthlySalaryLKR: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>Assigned Boat</Label>
                    <Select
                      value={form.assignedBoatId || UNASSIGNED_BOAT_VALUE}
                      onValueChange={v => setForm(f => ({ ...f, assignedBoatId: v === UNASSIGNED_BOAT_VALUE ? '' : v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED_BOAT_VALUE}>— None —</SelectItem>
                        {boats.map(b => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5 col-span-2"><Label>Contract Price / Ride (LKR)</Label>
                  <Input type="number" min={0} value={form.contractPricePerRideLKR} onChange={e => setForm(f => ({ ...f, contractPricePerRideLKR: e.target.value }))} /></div>
              )}
              <div className="space-y-1.5"><Label>License Number</Label>
                <Input value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Note</Label>
                <Input value={form.profileNote} onChange={e => setForm(f => ({ ...f, profileNote: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving || !form.name || !form.phone}>
                {editing ? 'Save Changes' : 'Add Rider'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Root Component ────────────────────────────────────────────────────────────

export default function BoatRideManagement() {
  const [tab, setTab] = useState('dashboard');
  const [packages, setPackages] = useState<BoatPackage[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [riders, setRiders] = useState<BoatRider[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DashStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const [pkgRes, boatRes, riderRes, bookRes] = await Promise.all([
      fetch('/api/boat-ride/packages'),
      fetch('/api/boat-ride/boats'),
      fetch('/api/boat-ride/riders'),
      fetch('/api/boat-ride/bookings'),
    ]);
    const [p, b, r, bk] = await Promise.all([pkgRes.json(), boatRes.json(), riderRes.json(), bookRes.json()]);
    if (p.success) setPackages(p.data);
    if (b.success) setBoats(b.data);
    if (r.success) setRiders(r.data);
    if (bk.success) setBookings(bk.data);
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const r = await fetch('/api/boat-ride/stats');
      const d = await r.json();
      if (d.success) setStats(d.data);
    } finally { setStatsLoading(false); }
  }, []);

  useEffect(() => {
    loadAll();
    loadStats();
  }, [loadAll, loadStats]);

  const reload = () => { loadAll(); loadStats(); };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
          <Waves className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Boat Ride Management</h2>
          <p className="text-sm text-muted-foreground">Fleet · Riders · Bookings · Multi-currency Payments</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Dashboard</TabsTrigger>
          <TabsTrigger value="bookings" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" />Bookings</TabsTrigger>
          <TabsTrigger value="new-booking" className="gap-1.5"><Plus className="h-3.5 w-3.5" />New Booking</TabsTrigger>
          <TabsTrigger value="packages" className="gap-1.5"><Package className="h-3.5 w-3.5" />Packages</TabsTrigger>
          <TabsTrigger value="fleet" className="gap-1.5"><Ship className="h-3.5 w-3.5" />Fleet</TabsTrigger>
          <TabsTrigger value="riders" className="gap-1.5"><UserCheck className="h-3.5 w-3.5" />Riders</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="dashboard">
            <DashboardTab stats={stats} loading={statsLoading} onRefresh={reload} />
          </TabsContent>
          <TabsContent value="bookings">
            <BookingsTab bookings={bookings} boats={boats} riders={riders} loading={false} onRefresh={loadAll} onReload={reload} />
          </TabsContent>
          <TabsContent value="new-booking">
            <NewBookingTab packages={packages} onCreated={() => { reload(); setTab('bookings'); }} />
          </TabsContent>
          <TabsContent value="packages">
            <PackagesTab packages={packages} onReload={loadAll} />
          </TabsContent>
          <TabsContent value="fleet">
            <FleetTab boats={boats} onReload={loadAll} />
          </TabsContent>
          <TabsContent value="riders">
            <RidersTab riders={riders} boats={boats} onReload={loadAll} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
