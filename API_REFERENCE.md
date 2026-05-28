# Hotel Management System - API Reference

## Base URL
```
http://localhost:3000/api
```

---

## Rooms API

### List All Rooms
```
GET /rooms
```

**Query Parameters:**
- `category` (optional): Standard, Deluxe, Suite, Presidential
- `available` (optional): true or false

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "roomNumber": "101",
      "category": "Deluxe",
      "capacity": 2,
      "pricePerNight": 150,
      "description": "Beautiful deluxe room",
      "amenities": ["WiFi", "AC", "TV"],
      "images": [],
      "isAvailable": true,
      "createdAt": "2026-05-28T00:00:00.000Z",
      "updatedAt": "2026-05-28T00:00:00.000Z"
    }
  ]
}
```

### Create Room
```
POST /rooms
Content-Type: application/json

{
  "roomNumber": "102",
  "category": "Suite",
  "capacity": 4,
  "pricePerNight": 250,
  "description": "Spacious suite with living area",
  "amenities": ["WiFi", "AC", "TV", "Minibar"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "roomNumber": "102",
    "category": "Suite",
    "capacity": 4,
    "pricePerNight": 250,
    ...
  }
}
```

### Get Single Room
```
GET /rooms/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "roomNumber": "101",
    ...
  }
}
```

### Update Room
```
PUT /rooms/507f1f77bcf86cd799439011
Content-Type: application/json

{
  "pricePerNight": 175,
  "amenities": ["WiFi", "AC", "TV", "Gym"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "roomNumber": "101",
    "pricePerNight": 175,
    ...
  }
}
```

### Delete Room
```
DELETE /rooms/507f1f77bcf86cd799439011
```

**Response (200):**
```json
{
  "success": true,
  "message": "Room deleted successfully"
}
```

---

## Bookings API

### List All Bookings
```
GET /bookings
```

**Query Parameters:**
- `status` (optional): pending, confirmed, checked-in, checked-out, cancelled
- `customerId` (optional): Filter by customer

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "607f1f77bcf86cd799439013",
      "bookingId": "BK-1704067200000-ABC123",
      "customerId": "CUST-1704067200000",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "customerPhone": "+1234567890",
      "roomIds": ["507f1f77bcf86cd799439011"],
      "checkInDate": "2026-06-01T00:00:00.000Z",
      "checkOutDate": "2026-06-05T00:00:00.000Z",
      "numberOfNights": 4,
      "numberOfGuests": 2,
      "totalAmount": 600,
      "discountAmount": 0,
      "status": "confirmed",
      "paymentStatus": "paid",
      "promoCode": "",
      "bookingFromSource": "direct",
      ...
    }
  ]
}
```

### Create Booking
```
POST /bookings
Content-Type: application/json

{
  "customerId": "CUST-1704067200000",
  "customerName": "Jane Smith",
  "customerEmail": "jane@example.com",
  "customerPhone": "+1987654321",
  "roomIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "checkInDate": "2026-06-10",
  "checkOutDate": "2026-06-15",
  "numberOfGuests": 4,
  "promoCode": "WELCOME10"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "607f1f77bcf86cd799439014",
    "bookingId": "BK-1704067200001-DEF456",
    "customerId": "CUST-1704067200000",
    "customerName": "Jane Smith",
    "customerEmail": "jane@example.com",
    "customerPhone": "+1987654321",
    "roomIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    "checkInDate": "2026-06-10T00:00:00.000Z",
    "checkOutDate": "2026-06-15T00:00:00.000Z",
    "numberOfNights": 5,
    "numberOfGuests": 4,
    "totalAmount": 700,
    "discountAmount": 70,
    "status": "pending",
    "paymentStatus": "unpaid",
    "promoCode": "WELCOME10",
    ...
  }
}
```

### Get Single Booking
```
GET /bookings/607f1f77bcf86cd799439014
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "607f1f77bcf86cd799439014",
    "bookingId": "BK-1704067200001-DEF456",
    ...
  }
}
```

### Update Booking
```
PUT /bookings/607f1f77bcf86cd799439014
Content-Type: application/json

{
  "status": "confirmed",
  "paymentStatus": "paid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "607f1f77bcf86cd799439014",
    "status": "confirmed",
    "paymentStatus": "paid",
    ...
  }
}
```

### Delete Booking
```
DELETE /bookings/607f1f77bcf86cd799439014
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking deleted successfully"
}
```

---

## Availability API

### Check Room Availability
```
GET /availability?checkIn=2026-06-01&checkOut=2026-06-05&capacity=2&category=Deluxe
```

**Query Parameters:**
- `checkIn` (required): ISO date string (YYYY-MM-DD)
- `checkOut` (required): ISO date string (YYYY-MM-DD)
- `capacity` (optional): Minimum number of guests
- `category` (optional): Room category filter

**Response:**
```json
{
  "success": true,
  "data": {
    "availableRooms": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "roomNumber": "101",
        "category": "Deluxe",
        "capacity": 2,
        "pricePerNight": 150,
        "description": "Beautiful deluxe room",
        "amenities": ["WiFi", "AC", "TV"],
        "images": [],
        "isAvailable": true
      }
    ],
    "checkInDate": "2026-06-01T00:00:00.000Z",
    "checkOutDate": "2026-06-05T00:00:00.000Z",
    "numberOfNights": 4
  }
}
```

---

## Booking.com Integration API

### Check Integration Status
```
GET /bookingcom/sync-inventory
```

**Response:**
```json
{
  "success": true,
  "configured": true,
  "message": "Booking.com integration is configured"
}
```

### Sync Inventory (Push Rooms)
```
POST /bookingcom/sync-inventory
```

**Response:**
```json
{
  "success": true,
  "message": "Room inventory synced to Booking.com successfully",
  "roomsCount": 15
}
```

### Pull Bookings from Booking.com
```
POST /bookingcom/pull-bookings
```

**Response:**
```json
{
  "success": true,
  "syncedCount": 5,
  "totalBookings": 8,
  "message": "Successfully synced 5 bookings from Booking.com",
  "errors": [
    {
      "bookingId": "bcom-123",
      "error": "Failed to sync booking"
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Room not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Room number already exists"
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Failed to fetch rooms"
}
```

---

## Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successfully retrieved or updated data |
| 201 | Created | New room or booking created |
| 400 | Bad Request | Missing or invalid parameters |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate room number |
| 500 | Server Error | Database or server error |

---

## Request Examples

### Using cURL

**Create a room:**
```bash
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "roomNumber": "101",
    "category": "Deluxe",
    "capacity": 2,
    "pricePerNight": 150
  }'
```

**Create a booking:**
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST-001",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+1234567890",
    "roomIds": ["507f1f77bcf86cd799439011"],
    "checkInDate": "2026-06-01",
    "checkOutDate": "2026-06-05",
    "numberOfGuests": 2
  }'
```

**Check availability:**
```bash
curl "http://localhost:3000/api/availability?checkIn=2026-06-01&checkOut=2026-06-05&capacity=2"
```

### Using JavaScript/Fetch

**Create a room:**
```javascript
const response = await fetch('/api/rooms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    roomNumber: '101',
    category: 'Deluxe',
    capacity: 2,
    pricePerNight: 150,
  }),
});
const data = await response.json();
```

**Create a booking:**
```javascript
const response = await fetch('/api/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    customerId: 'CUST-001',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+1234567890',
    roomIds: ['507f1f77bcf86cd799439011'],
    checkInDate: '2026-06-01',
    checkOutDate: '2026-06-05',
    numberOfGuests: 2,
  }),
});
const data = await response.json();
```

---

## Data Models

### Room Schema
```typescript
{
  _id: ObjectId
  roomNumber: string (unique)
  category: "Standard" | "Deluxe" | "Suite" | "Presidential"
  capacity: number (1-10)
  pricePerNight: number
  description: string
  amenities: string[]
  images: string[]
  isAvailable: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Booking Schema
```typescript
{
  _id: ObjectId
  bookingId: string (unique)
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  roomIds: ObjectId[]
  checkInDate: Date
  checkOutDate: Date
  numberOfNights: number
  numberOfGuests: number
  totalAmount: number
  discountAmount: number
  promoCode: string
  status: "pending" | "confirmed" | "checked-in" | "checked-out" | "cancelled"
  paymentStatus: "unpaid" | "partial" | "paid" | "refunded"
  paymentMethod: string
  notes: string
  bookingFromSource: "direct" | "booking.com" | "other"
  externalBookingId: string
  createdAt: Date
  updatedAt: Date
}
```

### Customer Schema
```typescript
{
  _id: ObjectId
  email: string (unique)
  name: string
  phone: string
  address: string
  city: string
  country: string
  profileImage: string
  totalBookings: number
  totalSpent: number
  isVIP: boolean
  preferences: {
    roomCategory: string
    specialRequests: string
  }
  createdAt: Date
  updatedAt: Date
}
```

---

## Common Promo Codes

| Code | Discount | Description |
|------|----------|-------------|
| WELCOME10 | 10% | Welcome 10% discount |
| WELCOME20 | 20% | Welcome 20% discount |

---

## Rate Limits

Currently no rate limits are enforced. For production, implement:
- 100 requests per minute per IP
- 1000 requests per day per API key
- 5 concurrent requests per connection

---

## Webhooks (Ready for Implementation)

Future webhook events:
- `booking.created` - When a new booking is created
- `booking.confirmed` - When booking is confirmed
- `booking.cancelled` - When booking is cancelled
- `booking.checked-in` - When guest checks in
- `booking.checked-out` - When guest checks out
- `payment.received` - When payment is received
- `inventory.updated` - When room inventory changes

---

## Authentication (Ready for Implementation)

Framework ready for:
- JWT tokens
- Session cookies
- API key authentication
- OAuth 2.0 integration

---

## Pagination (Ready for Implementation)

Ready to add:
- `?page=1&limit=50`
- `?offset=0&limit=50`
- Cursor-based pagination

---

## Sorting (Ready for Implementation)

Ready to add:
- `?sort=createdAt:asc`
- `?sort=pricePerNight:desc`

---

## Documentation Version

- **API Version**: 1.0
- **Last Updated**: May 28, 2026
- **Status**: Production Ready
- **Base Implementation**: Complete

For the latest updates and examples, check the source code in the `app/api/` directory.
