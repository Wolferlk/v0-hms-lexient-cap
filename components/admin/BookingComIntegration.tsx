'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Loader2, RefreshCw, Upload, Download, Zap, CheckCircle,
  XCircle, AlertTriangle, Globe, Calendar, DollarSign,
  Webhook, Copy, ExternalLink, Info,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConnectionStatus {
  checked: boolean;
  configured: boolean;
  connected: boolean;
  propertyId?: string;
  propertyName?: string;
  error?: string;
}

interface SyncLog {
  id: string;
  action: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  timestamp: Date;
  detail?: string;
}

// ── Badge helper ──────────────────────────────────────────────────────────────

const StatusBadge = ({ ok, label }: { ok: boolean; label: string }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
    {ok ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
    {label}
  </span>
);

// ── Component ─────────────────────────────────────────────────────────────────

export default function BookingComIntegration() {
  const [status, setStatus] = useState<ConnectionStatus>({ checked: false, configured: false, connected: false });
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Sync controls
  const [pullStatus, setPullStatus] = useState('new');
  const [pullDateFrom, setPullDateFrom] = useState('');
  const [pullDateTo, setPullDateTo] = useState('');
  const [ratesDateFrom, setRatesDateFrom] = useState('');
  const [ratesDateTo, setRatesDateTo] = useState('');
  const [availDateFrom, setAvailDateFrom] = useState('');
  const [availDateTo, setAvailDateTo] = useState('');

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/bookingcom/webhook`
    : '/api/bookingcom/webhook';

  const addLog = useCallback((action: string, status: 'success' | 'error' | 'pending', message: string, detail?: string) => {
    setLogs(prev => [{
      id: Date.now().toString(),
      action, status, message,
      detail,
      timestamp: new Date(),
    }, ...prev].slice(0, 50));
  }, []);

  // ── Check connection on mount ─────────────────────────────────────────────
  const checkConnection = useCallback(async () => {
    setTestingConnection(true);
    try {
      const res = await fetch('/api/bookingcom/test-connection');
      const data = await res.json();

      if (!data.configured) {
        setStatus({ checked: true, configured: false, connected: false, error: data.error });
        addLog('Connection Check', 'error', 'Not configured — set env vars', data.error);
        toast.error('Booking.com not configured');
      } else if (data.success) {
        setStatus({
          checked: true, configured: true, connected: true,
          propertyId: data.propertyId,
          propertyName: data.property?.propertyName || data.property?.name,
        });
        addLog('Connection Check', 'success', `Connected to property ${data.propertyId}`);
        toast.success('Booking.com connected');
      } else {
        setStatus({ checked: true, configured: true, connected: false, error: data.error });
        addLog('Connection Check', 'error', 'Connection failed', data.error);
        toast.error(data.error || 'Connection failed');
      }
    } catch {
      setStatus({ checked: true, configured: false, connected: false, error: 'Network error' });
      addLog('Connection Check', 'error', 'Network error');
      toast.error('Network error');
    } finally {
      setTestingConnection(false);
    }
  }, [addLog]);

  useEffect(() => { checkConnection(); }, [checkConnection]);

  // ── Sync Inventory (rooms) ────────────────────────────────────────────────
  const syncInventory = async () => {
    setLoading(true);
    addLog('Push Inventory', 'pending', 'Pushing room inventory to Booking.com...');
    try {
      const res = await fetch('/api/bookingcom/sync-inventory', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.roomsCount} rooms pushed to Booking.com`);
        addLog('Push Inventory', 'success', data.message || `${data.roomsCount} rooms synced`);
      } else {
        toast.error(data.error || 'Failed to sync inventory');
        addLog('Push Inventory', 'error', data.error || 'Failed', data.message);
      }
    } catch {
      toast.error('Network error');
      addLog('Push Inventory', 'error', 'Network error');
    } finally { setLoading(false); }
  };

  // ── Pull Bookings ────────────────────────────────────────────────────────
  const pullBookings = async () => {
    setLoading(true);
    addLog('Pull Bookings', 'pending', `Fetching ${pullStatus} reservations...`);
    try {
      const res = await fetch('/api/bookingcom/pull-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: pullStatus, dateFrom: pullDateFrom || undefined, dateTo: pullDateTo || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        addLog('Pull Bookings', 'success', data.message, `Created: ${data.created}, Updated: ${data.updated}, Skipped: ${data.skipped}`);
      } else {
        toast.error(data.error || 'Failed to pull bookings');
        addLog('Pull Bookings', 'error', data.error || 'Failed');
      }
    } catch {
      toast.error('Network error');
      addLog('Pull Bookings', 'error', 'Network error');
    } finally { setLoading(false); }
  };

  // ── Push Rates ───────────────────────────────────────────────────────────
  const pushRates = async () => {
    if (!ratesDateFrom || !ratesDateTo) { toast.error('Select date range for rates'); return; }
    setLoading(true);
    addLog('Push Rates', 'pending', `Updating rates ${ratesDateFrom} → ${ratesDateTo}`);
    try {
      const res = await fetch('/api/bookingcom/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateFrom: ratesDateFrom, dateTo: ratesDateTo }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        addLog('Push Rates', 'success', data.message, `${data.roomsUpdated} rooms × ${data.datesUpdated} days`);
      } else {
        toast.error(data.error || 'Failed to update rates');
        addLog('Push Rates', 'error', data.error || 'Failed');
      }
    } catch {
      toast.error('Network error');
      addLog('Push Rates', 'error', 'Network error');
    } finally { setLoading(false); }
  };

  // ── Push Availability ────────────────────────────────────────────────────
  const pushAvailability = async () => {
    if (!availDateFrom || !availDateTo) { toast.error('Select date range for availability'); return; }
    setLoading(true);
    addLog('Push Availability', 'pending', `Syncing availability ${availDateFrom} → ${availDateTo}`);
    try {
      const res = await fetch('/api/bookingcom/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateFrom: availDateFrom, dateTo: availDateTo }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        addLog('Push Availability', 'success', data.message, `Range: ${data.datesRange}`);
      } else {
        toast.error(data.error || 'Failed to push availability');
        addLog('Push Availability', 'error', data.error || 'Failed');
      }
    } catch {
      toast.error('Network error');
      addLog('Push Availability', 'error', 'Network error');
    } finally { setLoading(false); }
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied!');
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Connection Status Bar ──────────────────────────────────────── */}
      <div className={`rounded-lg border p-4 flex flex-wrap items-center justify-between gap-3 ${status.connected ? 'border-green-200 bg-green-50' : status.configured ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-center gap-3">
          {!status.checked ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : status.connected ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <div>
            <p className="font-semibold text-sm">
              {!status.checked ? 'Checking connection...' : status.connected ? 'Connected to Booking.com' : status.configured ? 'Credentials set — connection failed' : 'Not configured'}
            </p>
            {status.connected && status.propertyId && (
              <p className="text-xs text-muted-foreground">Property ID: {status.propertyId}{status.propertyName ? ` · ${status.propertyName}` : ''}</p>
            )}
            {status.error && <p className="text-xs text-red-600 mt-0.5">{status.error}</p>}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={checkConnection} disabled={testingConnection}>
          {testingConnection ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
          Test Connection
        </Button>
      </div>

      {/* ── Not Configured Warning ─────────────────────────────────────── */}
      {!status.configured && status.checked && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-yellow-800 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4" />
            Booking.com API credentials required
          </div>
          <p className="text-xs text-yellow-700">Add these 3 variables to your <code className="bg-yellow-100 px-1 rounded">.env</code> file and restart the server:</p>
          <div className="font-mono text-xs bg-white rounded p-3 space-y-1 border border-yellow-200">
            <p><span className="text-blue-600">BOOKING_COM_API_KEY</span>=<span className="text-green-700">your_api_key</span></p>
            <p><span className="text-blue-600">BOOKING_COM_API_SECRET</span>=<span className="text-green-700">your_api_secret</span></p>
            <p><span className="text-blue-600">BOOKING_COM_PROPERTY_ID</span>=<span className="text-green-700">your_property_id</span></p>
          </div>
          <p className="text-xs text-yellow-700">
            Get credentials from:{' '}
            <span className="font-semibold">Booking.com Extranet → Account → API Access</span>
          </p>
        </div>
      )}

      {/* ── Main Tabs ──────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard"><Zap className="mr-1.5 h-3.5 w-3.5" />Sync</TabsTrigger>
          <TabsTrigger value="rates"><DollarSign className="mr-1.5 h-3.5 w-3.5" />Rates</TabsTrigger>
          <TabsTrigger value="webhook"><Webhook className="mr-1.5 h-3.5 w-3.5" />Webhook</TabsTrigger>
          <TabsTrigger value="logs"><Info className="mr-1.5 h-3.5 w-3.5" />Logs</TabsTrigger>
        </TabsList>

        {/* ══ SYNC ══════════════════════════════════════════════════════ */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">

            {/* Push Inventory */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-sm">Push Rooms</h3>
              </div>
              <p className="text-xs text-muted-foreground">Upload your room inventory, types, and base pricing to Booking.com.</p>
              <Button className="w-full" size="sm" onClick={syncInventory} disabled={loading || !status.connected}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                Push Room Inventory
              </Button>
            </div>

            {/* Pull Bookings */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold text-sm">Pull Bookings</h3>
              </div>
              <div className="space-y-2">
                <select
                  className="w-full h-8 rounded-md border bg-background px-3 text-sm"
                  value={pullStatus}
                  onChange={e => setPullStatus(e.target.value)}
                >
                  <option value="new">New / Unread</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="all">All</option>
                </select>
                <div className="grid grid-cols-2 gap-1.5">
                  <div><p className="text-xs text-muted-foreground mb-1">From</p><Input type="date" className="h-7 text-xs" value={pullDateFrom} onChange={e => setPullDateFrom(e.target.value)} /></div>
                  <div><p className="text-xs text-muted-foreground mb-1">To</p><Input type="date" className="h-7 text-xs" value={pullDateTo} onChange={e => setPullDateTo(e.target.value)} /></div>
                </div>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700" size="sm" onClick={pullBookings} disabled={loading || !status.connected}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
                Pull Reservations
              </Button>
            </div>

            {/* Push Availability */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <h3 className="font-semibold text-sm">Push Availability</h3>
              </div>
              <p className="text-xs text-muted-foreground">Sync real-time room availability based on current bookings.</p>
              <div className="grid grid-cols-2 gap-1.5">
                <div><p className="text-xs text-muted-foreground mb-1">From</p><Input type="date" className="h-7 text-xs" value={availDateFrom} onChange={e => setAvailDateFrom(e.target.value)} /></div>
                <div><p className="text-xs text-muted-foreground mb-1">To</p><Input type="date" className="h-7 text-xs" value={availDateTo} onChange={e => setAvailDateTo(e.target.value)} /></div>
              </div>
              <Button className="w-full bg-purple-600 hover:bg-purple-700" size="sm" onClick={pushAvailability} disabled={loading || !status.connected || !availDateFrom || !availDateTo}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Calendar className="h-3.5 w-3.5 mr-1.5" />}
                Push Availability
              </Button>
            </div>
          </div>

          {/* How it works info */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800 space-y-2">
            <p className="font-semibold flex items-center gap-2"><Globe className="h-4 w-4" />How the integration works</p>
            <ul className="space-y-1 text-xs list-disc list-inside">
              <li><strong>Push Rooms</strong> — uploads your room list, categories, and base prices to Booking.com</li>
              <li><strong>Pull Reservations</strong> — imports bookings made on Booking.com into this system</li>
              <li><strong>Push Availability</strong> — tells Booking.com which dates are open/closed based on real local bookings</li>
              <li><strong>Push Rates</strong> (Rates tab) — updates nightly pricing for a date range on Booking.com</li>
              <li><strong>Webhook</strong> (Webhook tab) — real-time: Booking.com pushes new reservations instantly to your system</li>
            </ul>
            <p className="text-xs mt-1 font-medium">Recommended: push availability after every check-in/check-out, pull bookings every 30 min.</p>
          </div>
        </TabsContent>

        {/* ══ RATES ══════════════════════════════════════════════════════ */}
        <TabsContent value="rates" className="space-y-4">
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <h3 className="font-semibold">Update Room Rates on Booking.com</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              This pushes your current room prices from this system to Booking.com for the selected date range.
              Each room's <strong>pricePerNight</strong> is used as the rate.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date *</Label>
                <Input type="date" value={ratesDateFrom} onChange={e => setRatesDateFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>To Date *</Label>
                <Input type="date" value={ratesDateTo} onChange={e => setRatesDateTo(e.target.value)} />
              </div>
            </div>
            {ratesDateFrom && ratesDateTo && (
              <div className="rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
                Updating rates for all rooms from <strong>{ratesDateFrom}</strong> to <strong>{ratesDateTo}</strong>
              </div>
            )}
            <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={pushRates} disabled={loading || !status.connected || !ratesDateFrom || !ratesDateTo}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
              Push Rates to Booking.com
            </Button>
          </div>

          <div className="rounded-lg bg-muted/40 p-4 text-sm space-y-2">
            <p className="font-semibold">Rate management tips</p>
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
              <li>Push rates whenever you update room prices in this system</li>
              <li>For seasonal pricing, update rates for specific date ranges</li>
              <li>Rates pushed here overwrite existing Booking.com rates for those dates</li>
              <li>Rate plan ID defaults to "standard" — contact Booking.com support to set up multiple rate plans</li>
            </ul>
          </div>
        </TabsContent>

        {/* ══ WEBHOOK ════════════════════════════════════════════════════ */}
        <TabsContent value="webhook" className="space-y-4">
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Webhook className="h-4 w-4 text-indigo-600" />
              <h3 className="font-semibold">Webhook — Real-time Booking Notifications</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Register this URL in Booking.com Extranet so Booking.com pushes reservations to your system instantly — no polling needed.
            </p>

            <div className="space-y-2">
              <Label>Your Webhook URL</Label>
              <div className="flex gap-2">
                <Input value={webhookUrl} readOnly className="font-mono text-sm bg-muted" />
                <Button variant="outline" size="sm" onClick={copyWebhook}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4 space-y-3 text-sm">
              <p className="font-semibold text-indigo-800">How to register in Booking.com Extranet:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-indigo-700">
                <li>Log in to <strong>Booking.com Extranet</strong> (extranet.booking.com)</li>
                <li>Go to <strong>Account → API Connectivity</strong></li>
                <li>Find <strong>Webhook / Notification URL</strong> settings</li>
                <li>Paste the webhook URL above and save</li>
                <li>Select events: <strong>New Reservation, Reservation Updated, Reservation Cancelled</strong></li>
                <li>Click <strong>Verify</strong> — Booking.com will send a GET request to confirm the endpoint is live</li>
              </ol>
            </div>

            <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
              <p className="font-semibold">Supported webhook events:</p>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {['new_reservation', 'reservation_updated', 'reservation_cancelled'].map(e => (
                  <span key={e} className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-center">{e}</span>
                ))}
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={async () => {
              const res = await fetch('/api/bookingcom/webhook');
              const data = await res.json();
              if (data.success) toast.success('Webhook endpoint is healthy');
              else toast.error('Webhook check failed');
            }}>
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Verify Webhook Endpoint
            </Button>
          </div>
        </TabsContent>

        {/* ══ LOGS ═══════════════════════════════════════════════════════ */}
        <TabsContent value="logs" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Sync Activity Log</p>
            <Button variant="ghost" size="sm" onClick={() => setLogs([])} className="text-xs h-7">Clear</Button>
          </div>
          {logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No activity yet — run a sync to see logs here</p>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className={`rounded-lg border p-3 text-sm ${
                  log.status === 'success' ? 'border-green-200 bg-green-50' :
                  log.status === 'error' ? 'border-red-200 bg-red-50' :
                  'border-yellow-200 bg-yellow-50'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {log.status === 'success' ? <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> :
                       log.status === 'error' ? <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" /> :
                       <Loader2 className="h-3.5 w-3.5 animate-spin text-yellow-600 shrink-0" />}
                      <div>
                        <span className="font-medium">{log.action}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{log.message}</span>
                        {log.detail && <p className="text-xs text-muted-foreground mt-0.5">{log.detail}</p>}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Configuration Reference ────────────────────────────────────── */}
      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-semibold">Environment Variables Reference</p>
        <div className="font-mono text-xs bg-muted rounded p-3 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-blue-600">BOOKING_COM_API_KEY</span>
            <StatusBadge ok={status.configured} label={status.configured ? 'Set' : 'Missing'} />
          </div>
          <div className="flex justify-between">
            <span className="text-blue-600">BOOKING_COM_API_SECRET</span>
            <StatusBadge ok={status.configured} label={status.configured ? 'Set' : 'Missing'} />
          </div>
          <div className="flex justify-between">
            <span className="text-blue-600">BOOKING_COM_PROPERTY_ID</span>
            <StatusBadge ok={!!status.propertyId || status.configured} label={status.propertyId || (status.configured ? 'Set' : 'Missing')} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Auth method: <strong>HTTP Basic</strong> (base64 of <code>API_KEY:API_SECRET</code>) ·
          API Base URL: <code>https://supply.booking.com/supply/v2</code>
        </p>
      </div>
    </div>
  );
}
