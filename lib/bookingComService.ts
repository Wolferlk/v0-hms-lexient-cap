import axios, { AxiosInstance } from 'axios';

// Booking.com API Configuration
const BOOKING_COM_API_KEY = process.env.BOOKING_COM_API_KEY || '';
const BOOKING_COM_API_SECRET = process.env.BOOKING_COM_API_SECRET || '';
const BOOKING_COM_PROPERTY_ID = process.env.BOOKING_COM_PROPERTY_ID || '';
const BOOKING_COM_BASE_URL = 'https://api.booking.com/v1';

interface BookingComRoom {
  id: string;
  name: string;
  type: string;
  max_occupancy: number;
  rate: number;
  available_rooms: number;
}

interface BookingComBooking {
  id: string;
  guest_name: string;
  email: string;
  phone: string;
  check_in_date: string;
  check_out_date: string;
  num_adults: number;
  num_children: number;
  status: string;
  total_price: number;
}

class BookingComService {
  private client: AxiosInstance;
  private apiKey: string;
  private propertyId: string;

  constructor() {
    this.apiKey = BOOKING_COM_API_KEY;
    this.propertyId = BOOKING_COM_PROPERTY_ID;

    this.client = axios.create({
      baseURL: BOOKING_COM_BASE_URL,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Check if Booking.com is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && !!this.propertyId;
  }

  /**
   * Push room inventory to Booking.com
   * This syncs your room availability and pricing
   */
  async pushRoomInventory(rooms: any[]): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Booking.com API not configured. Please set BOOKING_COM_API_KEY and BOOKING_COM_PROPERTY_ID.',
        };
      }

      // Transform internal room format to Booking.com format
      const bookingComRooms = rooms.map((room) => ({
        id: room._id.toString(),
        name: `Room ${room.roomNumber}`,
        type: room.category,
        max_occupancy: room.capacity,
        rate: room.pricePerNight,
        available_rooms: room.isAvailable ? 1 : 0,
      }));

      // Send to Booking.com
      const response = await this.client.post(
        `/properties/${this.propertyId}/rooms`,
        {
          rooms: bookingComRooms,
        }
      );

      console.log('[v0] Booking.com inventory push response:', response.data);

      return {
        success: true,
        message: 'Room inventory synced to Booking.com successfully',
      };
    } catch (error) {
      console.error('[v0] Error pushing inventory to Booking.com:', error);
      return {
        success: false,
        message: 'Failed to sync inventory to Booking.com',
      };
    }
  }

  /**
   * Pull booking data from Booking.com
   * This fetches recent bookings made through Booking.com
   */
  async pullBookings(limit: number = 50): Promise<{
    success: boolean;
    bookings?: BookingComBooking[];
    message: string;
  }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Booking.com API not configured',
        };
      }

      const response = await this.client.get(
        `/properties/${this.propertyId}/bookings`,
        {
          params: {
            limit,
            status: 'confirmed',
          },
        }
      );

      console.log('[v0] Booking.com bookings response:', response.data);

      return {
        success: true,
        bookings: response.data.bookings || [],
        message: `Retrieved ${response.data.bookings?.length || 0} bookings from Booking.com`,
      };
    } catch (error) {
      console.error('[v0] Error pulling bookings from Booking.com:', error);
      return {
        success: false,
        message: 'Failed to pull bookings from Booking.com',
      };
    }
  }

  /**
   * Get availability data from Booking.com
   */
  async getAvailability(
    checkInDate: string,
    checkOutDate: string
  ): Promise<{
    success: boolean;
    availability?: any;
    message: string;
  }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Booking.com API not configured',
        };
      }

      const response = await this.client.get(
        `/properties/${this.propertyId}/availability`,
        {
          params: {
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
          },
        }
      );

      return {
        success: true,
        availability: response.data,
        message: 'Availability data retrieved',
      };
    } catch (error) {
      console.error('[v0] Error getting availability from Booking.com:', error);
      return {
        success: false,
        message: 'Failed to get availability from Booking.com',
      };
    }
  }

  /**
   * Update booking status on Booking.com
   */
  async updateBookingStatus(
    bookingId: string,
    status: 'confirmed' | 'cancelled' | 'completed'
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Booking.com API not configured',
        };
      }

      const response = await this.client.put(
        `/properties/${this.propertyId}/bookings/${bookingId}`,
        {
          status,
        }
      );

      return {
        success: true,
        message: `Booking status updated to ${status}`,
      };
    } catch (error) {
      console.error('[v0] Error updating booking status on Booking.com:', error);
      return {
        success: false,
        message: 'Failed to update booking status on Booking.com',
      };
    }
  }

  /**
   * Sync a local booking to Booking.com
   */
  async syncLocalBookingToBcom(booking: any): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Booking.com API not configured',
        };
      }

      const bookingComData = {
        guest_name: booking.customerName,
        email: booking.customerEmail,
        phone: booking.customerPhone,
        check_in_date: booking.checkInDate,
        check_out_date: booking.checkOutDate,
        num_adults: booking.numberOfGuests,
        num_children: 0,
        total_price: booking.totalAmount - booking.discountAmount,
        reference_id: booking.bookingId,
      };

      const response = await this.client.post(
        `/properties/${this.propertyId}/bookings`,
        bookingComData
      );

      console.log('[v0] Booking synced to Booking.com:', response.data);

      return {
        success: true,
        message: 'Booking synced to Booking.com',
      };
    } catch (error) {
      console.error('[v0] Error syncing booking to Booking.com:', error);
      // Don't fail the booking if Booking.com sync fails
      return {
        success: false,
        message: 'Booking created locally but failed to sync to Booking.com',
      };
    }
  }
}

// Export singleton instance
export const bookingComService = new BookingComService();
