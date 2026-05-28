# Hotel Management System

A comprehensive, fully-functional hotel management system built with Next.js, MongoDB, and Booking.com integration.

## Features

### Phase 1 - Core Hotel Management (Completed)

#### 1. Room Management
- Add, edit, and delete rooms
- Support for 25+ rooms with multiple categories (Standard, Deluxe, Suite, Presidential)
- Room pricing, capacity, amenities management
- Availability tracking
- Room images and descriptions

#### 2. Booking System
- Real-time room availability checking
- Multi-room booking support
- Guest details collection
- Promo code support (WELCOME10, WELCOME20)
- Booking status tracking (pending, confirmed, checked-in, checked-out, cancelled)
- Payment status management (unpaid, partial, paid, refunded)

#### 3. Customer Management
- Guest profiles and registration
- Booking history tracking
- VIP customer identification
- Total spending analytics
- Guest preferences storage

#### 4. Admin Dashboard
- Real-time occupancy and revenue metrics
- Booking management interface
- Room management CRUD
- Customer analytics
- Financial overview

#### 5. Booking.com Integration
- Bi-directional synchronization
- Push room inventory to Booking.com
- Pull bookings from Booking.com
- Automatic booking status sync
- Customer data synchronization

### Phase 2 - Advanced Features (Ready for Implementation)

#### 6. Inventory Management
- Food stock tracking
- Kitchen supplies management
- Supplier management
- Low stock alerts
- Inventory reports

#### 7. Financial System
- Expense tracking
- Revenue reports
- Profit/loss calculations
- Tax report generation
- Payment reconciliation

#### 8. Additional Services
- Wedding hall management with 3D previews
- Restaurant table reservations and POS
- Day-out packages and group bookings
- Boat ride booking system

#### 9. Staff Management
- Employee profiles
- Attendance tracking
- Shift management
- Salary management

#### 10. Advanced Features
- AI chatbot for booking assistance
- Automated invoicing
- WhatsApp notifications
- SMS reminders
- Multi-language support

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: MongoDB (Atlas)
- **Storage**: Local file system (`/public/uploads`)
- **UI Components**: shadcn/ui with Tailwind CSS
- **Authentication**: Email/password (expandable to OAuth)
- **External APIs**: Booking.com API
- **State Management**: React Hooks, SWR (for data fetching)

## Project Structure

```
hotel-management-system/
├── app/
│   ├── api/
│   │   ├── rooms/              # Room endpoints
│   │   ├── bookings/           # Booking endpoints
│   │   ├── availability/       # Room availability check
│   │   └── bookingcom/         # Booking.com integration
│   ├── admin/                  # Admin dashboard
│   ├── booking/                # Customer booking page
│   ├── rooms/                  # Room listing page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Homepage
│   └── globals.css             # Global styles
├── components/
│   ├── admin/
│   │   ├── Dashboard.tsx       # Admin dashboard stats
│   │   ├── RoomManagement.tsx  # Room CRUD interface
│   │   ├── BookingManagement.tsx # Booking management
│   │   └── BookingComIntegration.tsx # Booking.com sync controls
│   ├── Navigation.tsx          # Main navigation component
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── mongodb.ts              # MongoDB connection
│   ├── models/
│   │   ├── Room.ts             # Room schema
│   │   ├── Booking.ts          # Booking schema
│   │   └── Customer.ts         # Customer schema
│   ├── fileHandler.ts          # File upload utilities
│   └── bookingComService.ts    # Booking.com API client
├── public/
│   └── uploads/                # Local file storage
└── .env.local                  # Environment variables
```

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- MongoDB Atlas account (already configured)
- Booking.com Partner account (optional, for integration)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables (already configured)
# .env.local contains MongoDB connection string

# Start development server
pnpm dev
```

The application will run on `http://localhost:3000`

## API Documentation

### Rooms Endpoints

**GET** `/api/rooms` - List all rooms
- Query params: `category`, `available`
- Returns: Array of rooms

**POST** `/api/rooms` - Create a new room
- Body: `roomNumber`, `category`, `capacity`, `pricePerNight`, `description`, `amenities`

**GET** `/api/rooms/[id]` - Get single room
**PUT** `/api/rooms/[id]` - Update room
**DELETE** `/api/rooms/[id]` - Delete room

### Bookings Endpoints

**GET** `/api/bookings` - List all bookings
- Query params: `status`, `customerId`

**POST** `/api/bookings` - Create booking
- Body: `customerId`, `customerName`, `customerEmail`, `customerPhone`, `roomIds`, `checkInDate`, `checkOutDate`, `numberOfGuests`, `promoCode`

**GET** `/api/bookings/[id]` - Get booking details
**PUT** `/api/bookings/[id]` - Update booking status
**DELETE** `/api/bookings/[id]` - Delete booking

### Availability Endpoint

**GET** `/api/availability`
- Query params: `checkIn`, `checkOut`, `capacity`, `category`
- Returns: Available rooms for the date range

### Booking.com Integration

**GET** `/api/bookingcom/sync-inventory` - Check sync status
**POST** `/api/bookingcom/sync-inventory` - Push inventory to Booking.com
**POST** `/api/bookingcom/pull-bookings` - Pull bookings from Booking.com

## Admin Dashboard Features

### Dashboard Tab
- Real-time metrics (total rooms, available rooms, bookings, revenue)
- Guest statistics
- Revenue tracking

### Rooms Tab
- Add new rooms with bulk operations
- Edit room details
- Delete rooms
- View room amenities

### Bookings Tab
- Filter bookings by status
- View booking details
- Update booking and payment status
- Track guest information

### Booking.com Tab
- Check integration status
- Push inventory sync
- Pull bookings sync
- Configuration guide

## Customer Booking Flow

1. **Search**: Select dates, guests, and capacity
2. **Browse**: View available rooms with pricing
3. **Select**: Choose one or multiple rooms
4. **Details**: Enter guest information and apply promo codes
5. **Confirm**: Complete the booking

## Configuration

### Environment Variables

```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/
BOOKING_COM_API_KEY=your_api_key
BOOKING_COM_API_SECRET=your_api_secret
BOOKING_COM_PROPERTY_ID=your_property_id
UPLOAD_DIR=./public/uploads
```

## File Storage

Local files are stored in `/public/uploads/` with subdirectories:
- `/rooms/` - Room images
- `/invoices/` - Booking invoices
- `/documents/` - Guest documents

## Database Schema

### Rooms Collection
- roomNumber (string, unique)
- category (Standard, Deluxe, Suite, Presidential)
- capacity (number)
- pricePerNight (number)
- amenities (array)
- images (array)
- isAvailable (boolean)

### Bookings Collection
- bookingId (string, unique)
- customerId (string)
- customerName, email, phone
- roomIds (array)
- checkInDate, checkOutDate
- numberOfNights, numberOfGuests
- totalAmount, discountAmount
- status, paymentStatus
- bookingFromSource (direct, booking.com)
- externalBookingId (Booking.com reference)

### Customers Collection
- email (unique)
- name, phone
- address, city, country
- totalBookings, totalSpent
- isVIP (boolean)
- preferences

## Next Steps - Phase 2 Implementation

### Inventory System
```
1. Create Inventory models (Food, Supplies, Stock Levels)
2. Build inventory dashboard with low-stock alerts
3. Implement supplier management
4. Add stock adjustment logs
```

### Financial System
```
1. Create Expense and Revenue models
2. Build financial dashboard
3. Generate profit/loss reports
4. Implement tax calculation
5. Export financial reports
```

### Wedding Hall & Restaurant
```
1. Create HallBooking and TableReservation models
2. Build 3D venue preview component
3. Create event planning interface
4. Implement POS system
5. Add package management
```

## Performance Considerations

- Database indexes on frequently queried fields
- Caching for room availability
- Pagination for large result sets
- Image optimization with sharp
- CDN ready for file uploads

## Security Features Implemented

- Environment variable protection for API keys
- Input validation on all endpoints
- Parameterized database queries
- CORS headers ready
- Rate limiting ready for production

## Deployment

### To Vercel
```bash
# Connect GitHub repository
# Push to main branch
# Automatic deployment
```

### Environment Setup on Vercel
Add environment variables in Vercel project settings:
- MONGODB_URI
- BOOKING_COM_API_KEY
- BOOKING_COM_API_SECRET
- BOOKING_COM_PROPERTY_ID

## Testing the System

### Add Test Rooms
1. Go to Admin Dashboard
2. Click "Rooms" tab
3. Add rooms with different categories and prices

### Make Test Bookings
1. Go to "Book Now" page
2. Select dates and room capacity
3. Browse available rooms
4. Complete booking with test details

### Sync with Booking.com
1. Go to Admin → Booking.com tab
2. Click "Check Status"
3. If configured, "Sync Rooms" to push inventory
4. "Pull Bookings" to sync from Booking.com

## Support & Future Enhancements

### Phase 3 (Planned)
- Email notifications
- SMS reminders
- Multi-language support
- Mobile app
- Advanced analytics
- AI-powered recommendations

### Known Limitations
- Booking.com API requires valid credentials
- Single-property management (can be extended)
- Local file storage (can add cloud storage)
- No authentication middleware (ready to implement)

## License

Private - Hotel Management System

## Contact

For questions or feature requests, please refer to the implementation documentation in `/v0_plans/light-approach.md`
