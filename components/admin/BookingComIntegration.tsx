'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Upload, Download } from 'lucide-react';

interface SyncStatus {
  configured: boolean;
  lastSync?: string;
  synced?: number;
}

export default function BookingComIntegration() {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ configured: false });
  const [showSettings, setShowSettings] = useState(false);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/bookingcom/sync-inventory');
      const data = await response.json();
      setSyncStatus({
        configured: data.configured,
      });

      if (data.configured) {
        toast.success('Booking.com is configured and ready');
      } else {
        toast.error('Booking.com is not configured');
        setShowSettings(true);
      }
    } catch (error) {
      console.error('[v0] Error checking status:', error);
      toast.error('Failed to check Booking.com status');
    }
  };

  const handleSyncInventory = async () => {
    if (!syncStatus.configured) {
      toast.error('Please configure Booking.com first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bookingcom/sync-inventory', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        toast.success(
          `${data.roomsCount} rooms synced to Booking.com successfully`
        );
        setSyncStatus((prev) => ({
          ...prev,
          synced: data.roomsCount,
        }));
      } else {
        toast.error(data.error || 'Failed to sync inventory');
      }
    } catch (error) {
      console.error('[v0] Error syncing inventory:', error);
      toast.error('Failed to sync inventory');
    } finally {
      setLoading(false);
    }
  };

  const handlePullBookings = async () => {
    if (!syncStatus.configured) {
      toast.error('Please configure Booking.com first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bookingcom/pull-bookings', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`${data.syncedCount} bookings pulled from Booking.com`);
      } else {
        toast.error(data.error || 'Failed to pull bookings');
      }
    } catch (error) {
      console.error('[v0] Error pulling bookings:', error);
      toast.error('Failed to pull bookings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Booking.com Integration Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-muted p-4">
            <div>
              <p className="text-sm font-medium">
                Status:{' '}
                <span
                  className={
                    syncStatus.configured
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {syncStatus.configured ? 'Configured' : 'Not Configured'}
                </span>
              </p>
              {syncStatus.synced && (
                <p className="text-xs text-muted-foreground">
                  Last sync: {syncStatus.synced} rooms
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkStatus}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Check Status
            </Button>
          </div>

          {!syncStatus.configured && (
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 p-4 text-sm text-yellow-700">
              <p className="font-medium">Configuration Required</p>
              <p className="mt-1">
                Set your Booking.com API credentials in environment variables to enable integration.
              </p>
              <p className="mt-2 font-mono text-xs">
                BOOKING_COM_API_KEY<br />
                BOOKING_COM_API_SECRET<br />
                BOOKING_COM_PROPERTY_ID
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Operations */}
      {syncStatus.configured && (
        <Card>
          <CardHeader>
            <CardTitle>Synchronization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border border-blue-200">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Push Inventory</h4>
                    <p className="text-xs text-muted-foreground">
                      Upload your room inventory and pricing to Booking.com
                    </p>
                  </div>
                  <Button
                    onClick={handleSyncInventory}
                    disabled={loading}
                    className="mt-4 w-full gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Sync Rooms
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-green-200">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Pull Bookings</h4>
                    <p className="text-xs text-muted-foreground">
                      Fetch recent bookings from Booking.com into your system
                    </p>
                  </div>
                  <Button
                    onClick={handlePullBookings}
                    disabled={loading}
                    className="mt-4 w-full gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Pull Bookings
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
              <p className="font-medium">Synchronization Schedule</p>
              <p className="mt-1">
                For production use, set up automated syncs using a cron job or webhook:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                <li>Push inventory every 6 hours</li>
                <li>Pull bookings every 30 minutes</li>
                <li>Update booking status on check-in/check-out</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Credentials (for reference) */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To enable Booking.com integration, add these environment variables to your .env.local file:
          </p>
          <div className="space-y-3 rounded-lg bg-muted p-4 font-mono text-xs">
            <div>
              <p className="font-semibold">BOOKING_COM_API_KEY=your_api_key_here</p>
            </div>
            <div>
              <p className="font-semibold">BOOKING_COM_API_SECRET=your_api_secret_here</p>
            </div>
            <div>
              <p className="font-semibold">BOOKING_COM_PROPERTY_ID=your_property_id_here</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Get these credentials from your Booking.com Partner Hub under Property Settings → API Access
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
