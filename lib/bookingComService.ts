import axios, { AxiosInstance, AxiosError } from 'axios';

// ── Config ────────────────────────────────────────────────────────────────────
const API_KEY        = process.env.BOOKING_COM_API_KEY     || '';
const API_SECRET     = process.env.BOOKING_COM_API_SECRET  || '';
const PROPERTY_ID    = process.env.BOOKING_COM_PROPERTY_ID || '';

// Booking.com Connectivity API v2
// Auth: Basic base64(apiKey:apiSecret)
const BASE_URL = 'https://supply.booking.com/supply/v2';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BookingComReservation {
  id: string;
  guest_name: string;
  email: string;
  phone: string;
  check_in_date: string;
  check_out_date: string;
  num_adults: number;
  num_children: number;
  status: 'new' | 'confirmed' | 'cancelled' | 'no_show' | 'invalid';
  total_price: number;
  currency: string;
  room_id?: string;
  room_type?: string;
  special_requests?: string;
  created_at: string;
}

export interface RateUpdate {
  roomId: string;
  ratePlanId: string;
  dates: { date: string; rate: number }[];
}

export interface AvailabilityUpdate {
  roomId: string;
  dates: { date: string; available: number; closed?: boolean }[];
}

export interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  statusCode?: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

class BookingComService {
  private client: AxiosInstance;

  constructor() {
    const credentials = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 15000,
    });

    // Log requests in dev
    this.client.interceptors.request.use(req => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Booking.com] ${req.method?.toUpperCase()} ${req.url}`);
      }
      return req;
    });
  }

  isConfigured(): boolean {
    return !!(API_KEY && API_SECRET && PROPERTY_ID);
  }

  getPropertyId(): string {
    return PROPERTY_ID;
  }

  private handleError(err: unknown): SyncResult {
    if (axios.isAxiosError(err)) {
      const e = err as AxiosError<any>;
      const code = e.response?.status;
      const msg  = e.response?.data?.message || e.response?.data?.error || e.message;
      if (code === 401) return { success: false, error: 'Invalid API credentials — check BOOKING_COM_API_KEY and BOOKING_COM_API_SECRET', statusCode: 401, message: '' };
      if (code === 403) return { success: false, error: 'Access denied — check BOOKING_COM_PROPERTY_ID or API permissions', statusCode: 403, message: '' };
      if (code === 404) return { success: false, error: 'Property not found — verify BOOKING_COM_PROPERTY_ID', statusCode: 404, message: '' };
      if (code === 429) return { success: false, error: 'Rate limited — wait before retrying', statusCode: 429, message: '' };
      return { success: false, error: `API error ${code}: ${msg}`, statusCode: code, message: '' };
    }
    return { success: false, error: String(err), message: '' };
  }

  // ── Connection Test ─────────────────────────────────────────────────────────
  async testConnection(): Promise<SyncResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Missing credentials: BOOKING_COM_API_KEY, BOOKING_COM_API_SECRET, BOOKING_COM_PROPERTY_ID', message: 'Not configured' };
    }
    try {
      const res = await this.client.get(`/properties/${PROPERTY_ID}`);
      return {
        success: true,
        message: 'Connection successful',
        data: {
          propertyId: PROPERTY_ID,
          propertyName: res.data?.name || 'Connected',
          country: res.data?.country,
          currency: res.data?.currency,
        },
      };
    } catch (err) {
      return this.handleError(err);
    }
  }

  // ── Pull Reservations ───────────────────────────────────────────────────────
  async pullReservations(options: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<SyncResult & { reservations?: BookingComReservation[] }> {
    if (!this.isConfigured()) return { success: false, error: 'Not configured', message: 'Missing credentials' };
    try {
      const res = await this.client.get(`/properties/${PROPERTY_ID}/reservations`, {
        params: {
          status: options.status || 'new',
          arrival_from: options.dateFrom,
          arrival_to: options.dateTo,
          rows: options.limit || 50,
          offset: options.offset || 0,
        },
      });
      const reservations: BookingComReservation[] = res.data?.result || res.data?.reservations || [];
      return { success: true, message: `Fetched ${reservations.length} reservations`, reservations };
    } catch (err) {
      return this.handleError(err);
    }
  }

  // ── Push Room Inventory ─────────────────────────────────────────────────────
  async pushRoomInventory(rooms: any[]): Promise<SyncResult> {
    if (!this.isConfigured()) return { success: false, error: 'Not configured', message: 'Missing credentials' };
    try {
      const payload = rooms.map(room => ({
        id: room._id?.toString(),
        name: `Room ${room.roomNumber}`,
        type: room.category || 'standard',
        max_occupancy: room.capacity || 2,
        base_rate: room.pricePerNight,
        available_count: room.status === 'available' ? 1 : 0,
      }));
      const res = await this.client.put(`/properties/${PROPERTY_ID}/rooms`, { rooms: payload });
      return { success: true, message: `${rooms.length} rooms pushed to Booking.com`, data: res.data };
    } catch (err) {
      return this.handleError(err);
    }
  }

  // ── Update Rates ────────────────────────────────────────────────────────────
  async updateRates(updates: RateUpdate[]): Promise<SyncResult> {
    if (!this.isConfigured()) return { success: false, error: 'Not configured', message: 'Missing credentials' };
    try {
      const results: SyncResult[] = [];
      for (const u of updates) {
        const res = await this.client.put(
          `/properties/${PROPERTY_ID}/rooms/${u.roomId}/rates/${u.ratePlanId}`,
          { rates: u.dates }
        );
        results.push({ success: true, message: `Rates updated for room ${u.roomId}`, data: res.data });
      }
      return { success: true, message: `Rates updated for ${updates.length} rooms`, data: results };
    } catch (err) {
      return this.handleError(err);
    }
  }

  // ── Update Availability ─────────────────────────────────────────────────────
  async updateAvailability(updates: AvailabilityUpdate[]): Promise<SyncResult> {
    if (!this.isConfigured()) return { success: false, error: 'Not configured', message: 'Missing credentials' };
    try {
      const results: SyncResult[] = [];
      for (const u of updates) {
        const res = await this.client.put(
          `/properties/${PROPERTY_ID}/rooms/${u.roomId}/availability`,
          { availability: u.dates }
        );
        results.push({ success: true, message: `Availability updated for room ${u.roomId}`, data: res.data });
      }
      return { success: true, message: `Availability updated for ${updates.length} rooms`, data: results };
    } catch (err) {
      return this.handleError(err);
    }
  }

  // ── Update Reservation Status ───────────────────────────────────────────────
  async updateReservationStatus(
    reservationId: string,
    status: 'confirmed' | 'cancelled' | 'no_show'
  ): Promise<SyncResult> {
    if (!this.isConfigured()) return { success: false, error: 'Not configured', message: 'Missing credentials' };
    try {
      const res = await this.client.patch(
        `/properties/${PROPERTY_ID}/reservations/${reservationId}`,
        { status }
      );
      return { success: true, message: `Reservation ${reservationId} updated to ${status}`, data: res.data };
    } catch (err) {
      return this.handleError(err);
    }
  }

  // ── Sync Single Local Booking to Booking.com ───────────────────────────────
  async syncLocalBooking(booking: any): Promise<SyncResult> {
    if (!this.isConfigured()) return { success: false, error: 'Not configured', message: 'Missing credentials' };
    try {
      const payload = {
        guest_name: booking.customerName,
        email: booking.customerEmail,
        phone: booking.customerPhone,
        check_in_date: new Date(booking.checkInDate).toISOString().slice(0, 10),
        check_out_date: new Date(booking.checkOutDate).toISOString().slice(0, 10),
        num_adults: booking.numberOfGuests || 1,
        total_price: booking.totalAmount,
        reference_id: booking.bookingId,
      };
      const res = await this.client.post(`/properties/${PROPERTY_ID}/reservations`, payload);
      return { success: true, message: 'Booking synced to Booking.com', data: res.data };
    } catch (err) {
      // Don't fail local booking if sync fails
      const r = this.handleError(err);
      return { ...r, message: 'Booking saved locally. Booking.com sync failed — will retry later.' };
    }
  }

  // ── Get Property Info ───────────────────────────────────────────────────────
  async getProperty(): Promise<SyncResult> {
    if (!this.isConfigured()) return { success: false, error: 'Not configured', message: 'Missing credentials' };
    try {
      const res = await this.client.get(`/properties/${PROPERTY_ID}`);
      return { success: true, message: 'Property info fetched', data: res.data };
    } catch (err) {
      return this.handleError(err);
    }
  }
}

export const bookingComService = new BookingComService();
