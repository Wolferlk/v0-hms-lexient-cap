# Lexient HMS — Full API Reference

> **Base URL:** `http://localhost:3000/api`  
> **Content-Type:** `application/json` (all POST/PUT bodies)  
> **All responses:** `{ success: true, data: ... }` or `{ success: false, error: "..." }`

---

## Table of Contents
1. [Authentication](#1-authentication)
2. [Rooms](#2-rooms)
3. [Room Bookings](#3-room-bookings)
4. [Restaurant](#4-restaurant)
5. [Day-out](#5-day-out)
6. [Boat Rides](#6-boat-rides)
7. [Wedding Hall](#7-wedding-hall)
8. [Staff](#8-staff)
9. [Finance](#9-finance)
10. [Inventory](#10-inventory)
11. [Currency & Exchange](#11-currency--exchange)
12. [Analytics](#12-analytics)
13. [Booking.com Integration](#13-bookingcom-integration)
14. [Chatbot](#14-chatbot)

---

## 1. Authentication

### POST `/auth/login`
```json
// Request
{
  "email": "admin@lexient.com",
  "password": "Admin@1234"
}

// Response 200
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "64f...", "email": "admin@lexient.com", "role": "admin" }
}
```

### POST `/auth/register`
```json
// Request
{
  "name": "Nimantha Manager",
  "email": "nimantha@lexient.com",
  "password": "Secure@5678",
  "role": "manager"
}

// Response 201
{
  "success": true,
  "data": { "_id": "64f...", "name": "Nimantha Manager", "email": "nimantha@lexient.com" }
}
```

---

## 2. Rooms

### GET `/rooms`
```
Query params:
  category   = Deluxe | Suite | Standard | Presidential
  available  = true | false
```
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "roomNumber": "101",
      "category": "Deluxe",
      "capacity": 2,
      "pricePerNight": 120,
      "isAvailable": true,
      "amenities": ["AC", "WiFi", "TV", "Mini Bar"],
      "description": "Sea-view deluxe room"
    }
  ]
}
```

### POST `/rooms`
```json
// Request
{
  "roomNumber": "205",
  "category": "Suite",
  "capacity": 3,
  "pricePerNight": 250,
  "description": "Luxury suite with private balcony",
  "amenities": ["AC", "WiFi", "Jacuzzi", "Kitchen", "TV"]
}

// Response 201
{
  "success": true,
  "data": { "_id": "64f...", "roomNumber": "205", "isAvailable": true, ... }
}
```

### PUT `/rooms/:id`
```json
// Request — partial update allowed
{
  "pricePerNight": 275,
  "isAvailable": false
}
```

### DELETE `/rooms/:id`
```
DELETE /api/rooms/64f1a2b3c4d5e6f7a8b9c0d1
Response: { "success": true }
```

### GET `/availability`
```
Query params:
  checkIn  = 2025-07-10
  checkOut = 2025-07-13
  guests   = 2
```
```json
// Response 200
{
  "success": true,
  "data": [
    { "_id": "64f...", "roomNumber": "101", "category": "Deluxe", "pricePerNight": 120 }
  ]
}
```

---

## 3. Room Bookings

### GET `/bookings`
```
Query params:
  status     = pending | confirmed | checked-in | checked-out | cancelled
  customerId = 64f...
  upcoming   = true
  limit      = 5
```

### POST `/bookings`
```json
// Request
{
  "customerId": "guest",
  "customerName": "John Smith",
  "customerEmail": "john.smith@email.com",
  "customerPhone": "+94771234567",
  "roomIds": ["64f1a2b3c4d5e6f7a8b9c0d1"],
  "checkInDate": "2025-07-10",
  "checkOutDate": "2025-07-13",
  "numberOfGuests": 2,
  "promoCode": "WELCOME10"
}

// Response 201
{
  "success": true,
  "data": {
    "_id": "64f...",
    "bookingId": "BK-1751234567890-ABC123",
    "customerName": "John Smith",
    "numberOfNights": 3,
    "totalAmount": 360,
    "discountAmount": 36,
    "status": "pending",
    "paymentStatus": "unpaid"
  }
}
```

### GET `/bookings/:id`
```json
// Response 200
{
  "success": true,
  "data": {
    "_id": "64f...",
    "bookingId": "BK-...",
    "customerName": "John Smith",
    "roomIds": ["64f..."],
    "checkInDate": "2025-07-10T00:00:00.000Z",
    "checkOutDate": "2025-07-13T00:00:00.000Z",
    "numberOfNights": 3,
    "totalAmount": 360,
    "status": "confirmed",
    "payments": []
  }
}
```

### PUT `/bookings/:id`
```json
// Request — update status or any fields
{ "status": "confirmed" }
```

### DELETE `/bookings/:id`
```
Only pending or cancelled bookings can be deleted.
```

---

### POST `/bookings/:id/checkin`
```json
// Request
{
  "docType": "passport",
  "docNumber": "N1234567",
  "expiryDate": "2030-06-30",
  "scanUrl": "https://cdn.lexient.com/docs/scan1.jpg",
  "checkInPayment": {
    "amount": 200,
    "method": "card"
  }
}

// Response 200
{
  "success": true,
  "data": {
    "status": "checked-in",
    "checkInTime": "2025-07-10T14:00:00.000Z",
    "amountPaid": 200,
    "guestDocument": { "docType": "passport", "docNumber": "N1234567", "isReturned": false }
  }
}
```

---

### POST `/bookings/:id/checkout`
```json
// Request
{
  "paymentAmount": 200,
  "paymentMethod": "cash",
  "notes": "Balance cleared at checkout",
  "returnDocument": true
}

// Response 200
{
  "success": true,
  "data": { "status": "checked-out", "paymentStatus": "paid" },
  "checkedOut": true,
  "balanceDue": 0,
  "grandTotal": 400,
  "roomTotal": 324,
  "foodTotal": 76,
  "amountPaid": 400
}
```

---

### GET `/bookings/:id/invoice`
```json
// Response 200
{
  "success": true,
  "data": {
    "invoiceNumber": "INV-BK-...",
    "booking": { "customerName": "John Smith", "numberOfNights": 3 },
    "roomCharges": {
      "items": [{ "description": "Room 101 (Deluxe) × 3 night(s)", "unitPrice": 120, "quantity": 3, "total": 360 }],
      "subtotal": 360,
      "discount": 36,
      "total": 324
    },
    "foodCharges": { "subtotal": 65, "tax": 3.25, "total": 68.25 },
    "additionalCharges": { "items": [], "total": 0 },
    "summary": {
      "grandTotal": 392.25,
      "amountPaid": 200,
      "balanceDue": 192.25
    }
  }
}
```

---

### POST `/bookings/:id/room-service`
```json
// Request
{
  "mealType": "dinner",
  "items": [
    { "menuItemId": "64f...", "quantity": 2, "specialInstructions": "No onions" },
    { "menuItemId": "64f...", "quantity": 1 }
  ],
  "notes": "Deliver by 7 PM"
}

// Response 201
{
  "success": true,
  "data": {
    "_id": "64f...",
    "orderType": "room-service",
    "mealType": "dinner",
    "subtotal": 45.00,
    "tax": 2.25,
    "total": 47.25,
    "status": "pending",
    "paymentStatus": "charged_to_room"
  }
}
```

---

### POST `/bookings/:id/charges` — Add manual charge
```json
// Request
{
  "description": "Extra bed",
  "qty": 1,
  "unitAmount": 30
}
// Response 201
{ "success": true, "data": { "additionalCharges": [...] } }
```

### PUT `/bookings/:id/charges` — Update charge
```json
{ "chargeId": "64f...", "description": "Extra bed (queen)", "qty": 1, "unitAmount": 35 }
```

### DELETE `/bookings/:id/charges?chargeId=64f...`

---

## 4. Restaurant

### GET `/restaurant/menu`
```
Query params:
  category  = starter | main | dessert | beverage | snacks
  available = true | false
```
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "name": "Grilled Salmon",
      "category": "main",
      "price": 18.50,
      "available": true,
      "vegetarian": false,
      "spiceLevel": 1,
      "preparationTime": 20
    }
  ]
}
```

### POST `/restaurant/menu`
```json
// Request
{
  "name": "Mango Lassi",
  "category": "beverage",
  "price": 4.50,
  "vegetarian": true,
  "spiceLevel": 0,
  "preparationTime": 5,
  "available": true
}
```

### PUT `/restaurant/menu`
```json
{ "id": "64f...", "price": 5.00, "available": false }
```

### DELETE `/restaurant/menu?id=64f...`

---

### GET `/restaurant/tables`
```json
// Response 200 — includes current status
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "tableNumber": "T-01",
      "capacity": 4,
      "location": "indoor",
      "status": "occupied",
      "partyName": "Silva Family",
      "partySize": 3
    }
  ]
}
```

### POST `/restaurant/tables` — Create table
```json
{ "tableNumber": "T-05", "capacity": 6, "location": "outdoor" }
```

### POST `/restaurant/tables/:id/service` — Table actions
```json
// Open table (seat guests)
{ "action": "open", "partyName": "Kumar Party", "partySize": 4 }

// Add item to order
{ "action": "add_item", "items": [{ "menuItemId": "64f...", "quantity": 2 }] }

// Remove item
{ "action": "remove_item", "menuItemId": "64f..." }

// Update item quantity
{ "action": "update_item", "menuItemId": "64f...", "quantity": 3 }

// Close table (generate bill)
{
  "action": "close",
  "paymentMethod": "card",
  "discount": 5.00,
  "serviceCharge": 3.00,
  "notes": "VIP table"
}

// Transfer table
{ "action": "transfer", "sourceTableId": "64f..." }
```

---

### GET `/restaurant/orders`
```
Query params:
  status     = pending | preparing | ready | delivered | cancelled
  customerId = 64f...
```

### GET `/restaurant/bills`
```
Query params:
  limit = 50
```

### GET `/restaurant/bills/:billNumber`
```
GET /api/restaurant/bills/BILL-20250710-001
```

### GET/POST `/restaurant/reservations`
```json
// POST Request
{
  "customerName": "Priya Perera",
  "phone": "+94712345678",
  "reservationDate": "2025-07-15",
  "reservationTime": "19:00",
  "partySize": 4,
  "tablePreference": "outdoor",
  "specialRequests": "Anniversary decoration"
}
```

---

## 5. Day-out

### GET `/day-out/packages`
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "name": "Mountain Trekking Adventure",
      "description": "Full-day guided trek",
      "pricePerPerson": 3500,
      "maxGroupSize": 30,
      "minGroupSize": 10,
      "duration": 8,
      "capacity": 50,
      "discountPercentage": 10,
      "activities": ["trekking", "swimming", "bbq"],
      "inclusions": ["Transport", "Lunch", "Guide"],
      "amenities": ["Changing room", "First aid"]
    }
  ]
}
```

### POST `/day-out/packages`
```json
// Request
{
  "name": "Beach Day Out",
  "description": "Relaxing beach experience with water sports",
  "pricePerPerson": 4500,
  "price": 4500,
  "capacity": 60,
  "duration": 8,
  "maxGroupSize": 50,
  "minGroupSize": 10,
  "discountPercentage": 0,
  "activities": ["swimming", "water_sports", "volleyball"],
  "inclusions": ["Transport", "Breakfast", "Lunch", "Guide"],
  "amenities": ["Locker", "Shower", "First aid kit"]
}

// Response 201
{
  "success": true,
  "data": { "_id": "64f...", "name": "Beach Day Out", ... }
}
```

### PUT `/day-out/packages`
```json
{
  "id": "64f...",
  "pricePerPerson": 5000,
  "discountPercentage": 5
}
```

### DELETE `/day-out/packages?id=64f...`

---

### GET `/day-out/group-bookings`
```
Query params:
  status = pending | confirmed | completed | cancelled
```

### POST `/day-out/group-bookings`
```json
// Request
{
  "packageId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "groupName": "ABC Company Team",
  "bookingDate": "2025-08-05",
  "numberOfPeople": 25,
  "contactPerson": {
    "name": "Sunil Fernando",
    "phone": "+94771234567",
    "email": "sunil@abc.lk"
  },
  "specialRequests": "Vegetarian meals required for 5 members",
  "advanceAmount": 30000,
  "paymentMethod": "bank_transfer"
}

// Response 201
{
  "success": true,
  "data": {
    "_id": "64f...",
    "groupName": "ABC Company Team",
    "numberOfPeople": 25,
    "totalPrice": 101250,
    "totalAmount": 101250,
    "depositAmount": 30375,
    "balanceAmount": 70875,
    "advancePaid": 30000,
    "paymentStatus": "partial",
    "status": "pending"
  }
}
```

### PUT `/day-out/group-bookings` — Multi-action update
```json
// Confirm booking
{ "id": "64f...", "action": "confirm" }

// Record payment
{ "id": "64f...", "action": "pay", "amount": 50000, "method": "cash", "notes": "Balance paid" }

// Complete booking
{ "id": "64f...", "action": "complete" }

// Cancel booking
{ "id": "64f...", "action": "cancel" }

// Add additional item
{
  "id": "64f...",
  "action": "add_item",
  "additionalItems": [{ "name": "BBQ Add-on", "quantity": 25, "unitPrice": 200 }]
}

// Update existing item (by index)
{ "id": "64f...", "action": "update_item", "itemIndex": 0, "itemUpdate": { "unitPrice": 250 } }

// Full update (metadata)
{ "id": "64f...", "bookingDate": "2025-08-10", "specialRequests": "Updated requests" }
```

### DELETE `/day-out/group-bookings?id=64f...`

---

## 6. Boat Rides

> All routes under `/boat-ride/`

### GET `/boat-ride/stats`
```json
// Response 200
{
  "success": true,
  "data": {
    "activeRideCount": 2,
    "activeRides": [{ "_id": "...", "customerName": "...", "boatId": {...}, "startTime": "..." }],
    "todayBookings": 5,
    "availableBoats": 3,
    "activeRiders": 4,
    "todayRevenueLKR": 45000
  }
}
```

---

### GET `/boat-ride/packages`
### POST `/boat-ride/packages`
```json
// Request
{
  "name": "Sunset Cruise",
  "boatType": "catamaran",
  "capacity": 12,
  "pricePerPerson": 3500,
  "duration": 90,
  "routeDescription": "Harbour to reef point and back",
  "safetyRating": 5,
  "mealIncluded": false,
  "lifeJacketsProvided": true
}
```

### PUT `/boat-ride/packages/:id`
```json
{ "pricePerPerson": 4000, "mealIncluded": true }
```

### DELETE `/boat-ride/packages/:id`

---

### GET `/boat-ride/boats`
### POST `/boat-ride/boats`
```json
// Request
{
  "name": "Blue Marlin",
  "type": "speed_boat",
  "registrationNumber": "SL-WP-1234",
  "capacity": 8,
  "color": "White/Blue",
  "engineType": "Yamaha 150HP",
  "yearBuilt": 2020,
  "notes": "Primary tourist boat"
}

// Response 201
{
  "success": true,
  "data": {
    "_id": "64f...",
    "boatId": "BT-LK3X8A",
    "name": "Blue Marlin",
    "status": "available",
    "serviceRecords": []
  }
}
```

### PUT `/boat-ride/boats/:id`
```json
{ "status": "maintenance", "notes": "Engine check scheduled" }
```

### DELETE `/boat-ride/boats/:id`

### POST `/boat-ride/boats/:id/service` — Add service record
```json
// Request
{
  "type": "repair",
  "description": "Replace propeller shaft seal",
  "costLKR": 15000,
  "performedBy": "Marine Technicians Ltd",
  "nextDueDateNote": "Next inspection in 3 months"
}

// Response 201
{
  "success": true,
  "data": { "_id": "64f...", "serviceRecords": [{ "type": "repair", "costLKR": 15000, ... }] }
}
```
> **type** options: `routine` | `repair` | `inspection` | `fuel` | `cleaning`

---

### GET `/boat-ride/riders`
### POST `/boat-ride/riders`
```json
// Company rider (monthly salary, no per-ride payment)
{
  "name": "Kamal Perera",
  "phone": "+94771234567",
  "email": "kamal@lexient.com",
  "riderType": "company",
  "licenseNumber": "SL-MBL-9876",
  "monthlySalaryLKR": 65000,
  "assignedBoatId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "profileNote": "Senior captain, 10 years experience"
}

// Contract rider (paid per ride)
{
  "name": "Nuwan Silva",
  "phone": "+94712345678",
  "riderType": "contract",
  "licenseNumber": "SL-MBL-5432",
  "contractPricePerRideLKR": 1500,
  "profileNote": "Weekend contractor"
}
```

### PUT `/boat-ride/riders/:id`
```json
{ "contractPricePerRideLKR": 1800, "status": "active" }
```

### DELETE `/boat-ride/riders/:id`

---

### GET `/boat-ride/bookings`
```
Query params:
  status = pending | confirmed | riding | completed | cancelled | no_show
  date   = 2025-07-10
  limit  = 20
```

### POST `/boat-ride/bookings`
```json
// Request — Tourist paying in USD
{
  "customerName": "James Wilson",
  "customerPhone": "+1234567890",
  "customerEmail": "james@email.com",
  "customerType": "tourist",
  "nationality": "USA",
  "packageId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "numberOfPassengers": 3,
  "scheduledDate": "2025-07-15",
  "scheduledTime": "09:00",
  "basePriceLKR": 10500,
  "paymentCurrency": "USD",
  "paymentAmountInCurrency": 33.07,
  "exchangeRateToLKR": 317.50,
  "notes": "First time visitors, need life jackets XL"
}

// Request — Local paying in LKR
{
  "customerName": "Kasun Jayasinghe",
  "customerPhone": "+94771234567",
  "customerType": "local",
  "packageId": "64f...",
  "numberOfPassengers": 2,
  "scheduledDate": "2025-07-15",
  "scheduledTime": "14:00",
  "basePriceLKR": 7000,
  "paymentCurrency": "LKR",
  "paymentAmountInCurrency": 7000
}

// Response 201
{
  "success": true,
  "data": {
    "_id": "64f...",
    "bookingRef": "BR-A1B2C3",
    "status": "pending",
    "paymentStatus": "unpaid"
  }
}
```

### PUT `/boat-ride/bookings/:id` — Assign boat + rider
```json
{
  "boatId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "riderId": "64f9a8b7c6d5e4f3a2b1c0d9",
  "status": "confirmed"
}
// riderTypeSnapshot + riderContractAmountLKR auto-filled from rider record
```

### POST `/boat-ride/bookings/:id/start` — Start ride
```json
// No body required
// Sets booking status → riding, boat → on_ride, rider → on_ride
// Response 200
{
  "success": true,
  "data": { "status": "riding", "startTime": "2025-07-15T09:05:00.000Z" }
}
```

### POST `/boat-ride/bookings/:id/complete` — Complete & collect payment
```json
// Tourist paying in SAR (Saudi Riyal)
{
  "amountPaidLKR": 10500,
  "paymentCurrency": "SAR",
  "paymentAmountInCurrency": 117.32,
  "exchangeRateToLKR": 89.51,
  "paymentMethod": "cash",
  "markRiderPaid": true
}

// Local paying in LKR
{
  "amountPaidLKR": 7000,
  "paymentCurrency": "LKR",
  "paymentAmountInCurrency": 7000,
  "paymentMethod": "card",
  "markRiderPaid": false
}

// Response 200
{
  "success": true,
  "data": { "status": "completed", "paymentStatus": "paid" },
  "amountPaidLKR": 10500,
  "paymentStatus": "paid"
}
```
> **paymentCurrency** options: `LKR` | `USD` | `INR` | `AUD` | `SAR` | `CNY` | `JPY`  
> **Company riders**: `markRiderPaid` is ignored — they have monthly salary, no per-ride payment  
> **Contract riders**: set `markRiderPaid: true` to flag rider payment as done

---

## 7. Wedding Hall

### GET `/wedding-hall/halls`
### GET `/wedding-hall/menu-packages`
### GET `/wedding-hall/supplier-packages`
### GET `/wedding-hall/events`

### GET `/wedding-hall/quotations`
```
Query params:
  status   = draft | active | expired | cancelled
  upcoming = true
  limit    = 10
```

### POST `/wedding-hall/quotations`
```json
// Request
{
  "hallId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "clientName": "Saman & Dilani",
  "clientEmail": "saman.dilani@gmail.com",
  "clientPhone": "+94771234567",
  "eventDate": "2025-12-20",
  "eventStartTime": "16:00",
  "eventEndTime": "23:00",
  "eventType": "wedding",
  "pax": 300,
  "menuPackageId": "64f...",
  "supplierPackageId": "64f...",
  "addOns": [
    { "name": "Floral arch", "price": 25000 },
    { "name": "Photo booth", "price": 15000 }
  ],
  "additionalItems": [
    { "name": "Extra dessert table", "quantity": 1, "unitPrice": 20000 }
  ],
  "notes": "Beach theme wedding"
}

// Response 201
{
  "success": true,
  "data": {
    "_id": "64f...",
    "quoteNumber": "WQ-1751234567890-AB1C2",
    "totalAmount": 850000,
    "advancePaid": 0,
    "status": "draft",
    "validUntil": "2025-11-20T00:00:00.000Z"
  }
}
```

### GET `/wedding-hall/quotations/:id`
### PUT `/wedding-hall/quotations/:id`
```json
// Confirm (activate) a draft quotation
{ "status": "active" }

// Record advance payment
{ "advancePaid": 200000, "paymentMethod": "bank_transfer" }
```

---

## 8. Staff

### GET `/staff/employees`
```
Query params:
  department = housekeeping | restaurant | front_desk | maintenance | security | management | boat_rides | spa | accounts
  status     = active | inactive | on_leave | terminated
```

### POST `/staff/employees`
```json
// Request
{
  "name": "Samanthi Rathnayake",
  "email": "samanthi@lexient.com",
  "phone": "+94712345678",
  "department": "front_desk",
  "position": "Receptionist",
  "joiningDate": "2025-01-15",
  "salary": 55000,
  "employmentType": "full-time",
  "address": "123 Main St, Colombo 03",
  "emergencyContact": {
    "name": "Sunil Rathnayake",
    "phone": "+94771234567",
    "relation": "Husband"
  }
}
```

### PUT `/staff/employees`
```json
{ "id": "64f...", "salary": 60000, "position": "Senior Receptionist" }
```

---

### GET `/staff/attendance`
```
Query params:
  employeeId    = 64f...
  attendanceDate = 2025-07-10
  month         = 2025-07
```

### POST `/staff/attendance`
```json
{
  "employeeId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "attendanceDate": "2025-07-10",
  "status": "present",
  "checkInTime": "2025-07-10T08:00:00.000Z",
  "checkOutTime": "2025-07-10T17:00:00.000Z",
  "remarks": "On time"
}
```
> **status** options: `present` | `absent` | `half_day` | `leave` | `holiday`

### PUT `/staff/attendance`
```json
{ "id": "64f...", "status": "half_day", "remarks": "Left early for medical appointment" }
```

---

### GET `/staff/payroll`
```
Query params:
  employeeId = 64f...
  month      = 2025-07
```

### POST `/staff/payroll`
```json
{
  "employeeId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "month": "2025-07",
  "allowances": [
    { "type": "transport", "amount": 5000 },
    { "type": "meal", "amount": 3000 }
  ],
  "deductions": [
    { "type": "EPF", "amount": 4950 },
    { "type": "ETF", "amount": 2200 }
  ]
}

// Response 201
{
  "success": true,
  "data": {
    "basicSalary": 55000,
    "totalAllowances": 8000,
    "totalDeductions": 7150,
    "netSalary": 55850,
    "status": "pending"
  }
}
```

### PUT `/staff/payroll`
```json
// Mark as paid
{
  "id": "64f...",
  "status": "paid",
  "paymentDate": "2025-07-31",
  "paymentMethod": "bank_transfer"
}
```

---

## 9. Finance

### GET `/finance/income`
```
Query params:
  source    = rooms | restaurant | day_out | boat_rides | wedding | other
  startDate = 2025-07-01
  endDate   = 2025-07-31
  page      = 1
  limit     = 20
```

### POST `/finance/income`
```json
{
  "source": "rooms",
  "reference": "BK-1751234567890-ABC123",
  "amount": 324,
  "paymentMethod": "card",
  "description": "Room booking payment — John Smith",
  "recordedBy": "Front Desk",
  "recordedDate": "2025-07-13"
}
```

---

### GET `/finance/expenses`
```
Query params:
  category  = utilities | supplies | maintenance | salaries | marketing | other
  startDate = 2025-07-01
  endDate   = 2025-07-31
```

### POST `/finance/expenses`
```json
{
  "category": "maintenance",
  "description": "Air conditioner servicing — Room 201-205",
  "amount": 45000,
  "paymentMethod": "bank_transfer",
  "vendor": "Cool Tech Services",
  "invoice": "INV-CT-20250710",
  "notes": "Annual maintenance contract",
  "status": "paid",
  "createdBy": "Accounts Manager"
}
```

---

## 10. Inventory

### GET `/inventory/items`
```
Query params:
  category = food | beverage | cleaning | amenities | maintenance
  lowStock = true   ← items below minimumLevel
```

### POST `/inventory/items`
```json
{
  "name": "Jasmine Rice",
  "category": "food",
  "quantity": 200,
  "unit": "kg",
  "minimumLevel": 50,
  "unitCost": 180,
  "supplier": "64f1a2b3c4d5e6f7a8b9c0d1"
}
```

### PUT `/inventory/items`
```json
{ "id": "64f...", "quantity": 180, "unitCost": 190 }
```

---

### GET `/inventory/suppliers`
### POST `/inventory/suppliers`
```json
{
  "name": "Ceylon Fresh Produce",
  "contactPerson": "Ranjan Silva",
  "phone": "+94112345678",
  "email": "orders@ceylonfresh.lk",
  "address": "No 45, Peliyagoda Market",
  "category": "food"
}
```

---

### GET `/inventory/transactions`
### POST `/inventory/transactions`
```json
// Stock in
{
  "itemId": "64f...",
  "type": "in",
  "quantity": 100,
  "unitCost": 185,
  "notes": "Weekly delivery from Ceylon Fresh",
  "recordedBy": "Store Keeper"
}

// Stock out
{
  "itemId": "64f...",
  "type": "out",
  "quantity": 20,
  "notes": "Restaurant kitchen — lunch service",
  "recordedBy": "Head Chef"
}
```

---

## 11. Currency & Exchange

### GET `/currency/rates`
```json
// Response 200 (live from ExchangeRate-API, cached 1 hour)
{
  "success": true,
  "cached": false,
  "fetchedAt": "2025-07-10T08:00:00.000Z",
  "rates": {
    "LKR": 317.50,
    "GBP": 0.7845,
    "AED": 3.6725,
    "AUD": 1.5432,
    "INR": 83.45,
    "SAR": 3.7500,
    "CNY": 7.2450,
    "JPY": 157.32,
    "EUR": 0.9210
  }
}
```

### GET `/currency/history`
```
Query params:
  days       = 7  (max 30)
  currencies = LKR,GBP,AED,AUD
```
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "fetchedAt": "2025-07-04T08:00:00.000Z",
      "label": "Jul 4, 08:00 AM",
      "LKR": 316.20,
      "GBP": 0.7831,
      "AED": 3.6725,
      "AUD": 1.5389
    }
  ],
  "count": 7
}
```

---

## 12. Analytics

### GET `/analytics/metrics`
```
Query params:
  period = daily | weekly | monthly | yearly
  from   = 2025-07-01
  to     = 2025-07-31
```

### GET `/analytics/reports`
```
Query params:
  type   = revenue | occupancy | restaurant | staff
  period = monthly
  year   = 2025
  month  = 7
```

---

## 13. Booking.com Integration

### GET `/bookingcom/test-connection`
```json
// Response 200
{ "success": true, "connected": true, "propertyId": "1234567" }
```

### GET `/bookingcom/availability`
```
Query params:
  checkIn  = 2025-07-10
  checkOut = 2025-07-13
```

### GET `/bookingcom/rates`
### POST `/bookingcom/sync-inventory`
### POST `/bookingcom/pull-bookings`
### POST `/bookingcom/webhook`
```json
// Booking.com sends reservation events here
// Header: X-Booking-Signature: <hmac>
{
  "event": "new_booking",
  "reservation_id": "BDC-987654321",
  "property_id": "1234567",
  "arrival": "2025-07-10",
  "departure": "2025-07-13",
  "guest_name": "Maria Garcia",
  "total_price": 360.00,
  "currency": "USD"
}
```

---

## 14. Chatbot

### POST `/chatbot/chat`
```json
// Request
{
  "message": "What rooms are available from July 10 to July 13 for 2 guests?",
  "sessionId": "session_abc123",
  "context": {}
}

// Response 200
{
  "success": true,
  "data": {
    "reply": "We have 3 rooms available from July 10–13: Room 101 (Deluxe, $120/night), Room 203 (Suite, $250/night)...",
    "sessionId": "session_abc123",
    "suggestions": ["Book Room 101", "View all rooms", "Check pricing"]
  }
}
```

---

## Quick Reference — Enums

| Field | Values |
|---|---|
| Room category | `Standard` `Deluxe` `Suite` `Presidential` |
| Booking status | `pending` `confirmed` `checked-in` `checked-out` `cancelled` |
| Payment status | `unpaid` `partial` `paid` `refunded` |
| Payment method | `cash` `card` `upi` `wallet` `bank_transfer` |
| Boat type | `speed_boat` `catamaran` `dinghy` `yacht` `canoe` `pontoon` `houseboat` `ferry` |
| Boat status | `available` `on_ride` `maintenance` `out_of_service` |
| Rider type | `company` `contract` |
| Boat booking currency | `LKR` `USD` `INR` `AUD` `SAR` `CNY` `JPY` |
| Boat booking status | `pending` `confirmed` `riding` `completed` `cancelled` `no_show` |
| Service type | `routine` `repair` `inspection` `fuel` `cleaning` |
| Staff department | `housekeeping` `restaurant` `front_desk` `maintenance` `security` `management` `boat_rides` `spa` `accounts` |
| Menu category | `starter` `main` `dessert` `beverage` `snacks` |
| Attendance status | `present` `absent` `half_day` `leave` `holiday` |
| Day-out status | `pending` `confirmed` `completed` `cancelled` |
| Wedding status | `draft` `active` `expired` `cancelled` |

---

## Postman Collection — Quick Import

Save the following as `lexient-hms.postman_collection.json` and import into Postman:

```json
{
  "info": { "name": "Lexient HMS API", "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
  "variable": [{ "key": "base", "value": "http://localhost:3000/api" }],
  "item": [
    {
      "name": "Day-out",
      "item": [
        { "name": "List Packages", "request": { "method": "GET", "url": "{{base}}/day-out/packages" } },
        { "name": "Create Package", "request": { "method": "POST", "url": "{{base}}/day-out/packages", "header": [{"key":"Content-Type","value":"application/json"}], "body": { "mode": "raw", "raw": "{\"name\":\"Beach Day Out\",\"pricePerPerson\":4500,\"price\":4500,\"capacity\":60,\"duration\":8,\"maxGroupSize\":50,\"minGroupSize\":10,\"discountPercentage\":0,\"activities\":[\"swimming\"],\"inclusions\":[\"Transport\",\"Lunch\"],\"amenities\":[\"Shower\"]}" } } },
        { "name": "Update Package", "request": { "method": "PUT", "url": "{{base}}/day-out/packages", "header": [{"key":"Content-Type","value":"application/json"}], "body": { "mode": "raw", "raw": "{\"id\":\"REPLACE_ID\",\"pricePerPerson\":5000}" } } },
        { "name": "Delete Package", "request": { "method": "DELETE", "url": "{{base}}/day-out/packages?id=REPLACE_ID" } },
        { "name": "List Group Bookings", "request": { "method": "GET", "url": "{{base}}/day-out/group-bookings" } },
        { "name": "Create Group Booking", "request": { "method": "POST", "url": "{{base}}/day-out/group-bookings", "header": [{"key":"Content-Type","value":"application/json"}], "body": { "mode": "raw", "raw": "{\"packageId\":\"REPLACE_PKG_ID\",\"groupName\":\"ABC Company\",\"bookingDate\":\"2025-08-05\",\"numberOfPeople\":25,\"contactPerson\":{\"name\":\"Sunil Fernando\",\"phone\":\"+94771234567\",\"email\":\"sunil@abc.lk\"},\"advanceAmount\":30000,\"paymentMethod\":\"bank_transfer\"}" } } },
        { "name": "Confirm Booking", "request": { "method": "PUT", "url": "{{base}}/day-out/group-bookings", "header": [{"key":"Content-Type","value":"application/json"}], "body": { "mode": "raw", "raw": "{\"id\":\"REPLACE_ID\",\"action\":\"confirm\"}" } } },
        { "name": "Record Payment", "request": { "method": "PUT", "url": "{{base}}/day-out/group-bookings", "header": [{"key":"Content-Type","value":"application/json"}], "body": { "mode": "raw", "raw": "{\"id\":\"REPLACE_ID\",\"action\":\"pay\",\"amount\":50000,\"method\":\"cash\"}" } } }
      ]
    },
    {
      "name": "Boat Rides",
      "item": [
        { "name": "Stats", "request": { "method": "GET", "url": "{{base}}/boat-ride/stats" } },
        { "name": "List Packages", "request": { "method": "GET", "url": "{{base}}/boat-ride/packages" } },
        { "name": "List Boats", "request": { "method": "GET", "url": "{{base}}/boat-ride/boats" } },
        { "name": "Add Boat", "request": { "method": "POST", "url": "{{base}}/boat-ride/boats", "header": [{"key":"Content-Type","value":"application/json"}], "body": { "mode": "raw", "raw": "{\"name\":\"Blue Marlin\",\"type\":\"speed_boat\",\"registrationNumber\":\"SL-WP-1234\",\"capacity\":8,\"color\":\"White/Blue\",\"engineType\":\"Yamaha 150HP\",\"yearBuilt\":2020}" } } },
        { "name": "Add Service Record", "request": { "method": "POST", "url": "{{base}}/boat-ride/boats/REPLACE_ID/service", "header": [{"key":"Content-Type","value":"application/json"}], "body": { "mode": "raw", "raw": "{\"type\":\"routine\",\"description\":\"Engine oil change\",\"costLKR\":8000,\"performedBy\":\"Lakmal Mechanics\"}" } } },
        { "name": "Add Company Rider", "request": { "method": "POST", "url": "{{base}}/boat-ride/riders", "header": [{"key":"Content-Type","value":"application/json"}], "body": { "mode": "raw", "raw": "{\"name\":\"Kamal Perera\",\"phone\":\"+94771234567\",\"riderType\":\"company\",\"licenseNumber\":\"SL-MBL-9876\",\"monthlySalaryLKR\":65000}" } } },
        { "name": "Add Contract Rider", "request": { "method": "POST", "url": "{{base}}/boat-ride/riders", "header": [{"key":"Content-Type","value":"application/json"}], "body": { "mode": "raw", "raw": "{\"name\":\"Nuwan Silva\",\"phone\":\"+94712345678\",\"riderType\":\"contract\",\"contractPricePerRideLKR\":1500}" } } },
        { "name": "Create Booking (Tourist/USD)", "request": { "method": "POST", "url": "{{base}}/boat-ride/bookings", "header": [{"key":"Content-Type","value":"application/json"}], "body": { "mode": "raw", "raw": "{\"customerName\":\"James Wilson\",\"customerPhone\":\"+1234567890\",\"customerType\":\"tourist\",\"nationality\":\"USA\",\"packageId\":\"REPLACE_PKG_ID\",\"numberOfPassengers\":3,\"scheduledDate\":\"2025-07-15\",\"scheduledTime\":\"09:00\",\"basePriceLKR\":10500,\"paymentCurrency\":\"USD\",\"paymentAmountInCurrency\":33.07,\"exchangeRateToLKR\":317.50}" } } },
        { "name": "Assign Boat & Rider", "request": { "method": "PUT", "url": "{{base}}/boat-ride/bookings/REPLACE_ID", "header": [{"key":"Content-Type","value":"application/json"}], "body": { "mode": "raw", "raw": "{\"boatId\":\"REPLACE_BOAT_ID\",\"riderId\":\"REPLACE_RIDER_ID\",\"status\":\"confirmed\"}" } } },
        { "name": "Start Ride", "request": { "method": "POST", "url": "{{base}}/boat-ride/bookings/REPLACE_ID/start" } },
        { "name": "Complete Ride (LKR)", "request": { "method": "POST", "url": "{{base}}/boat-ride/bookings/REPLACE_ID/complete", "header": [{"key":"Content-Type","value":"application/json"}], "body": { "mode": "raw", "raw": "{\"amountPaidLKR\":10500,\"paymentCurrency\":\"LKR\",\"paymentAmountInCurrency\":10500,\"paymentMethod\":\"cash\",\"markRiderPaid\":true}" } } }
      ]
    },
    {
      "name": "Rooms",
      "item": [
        { "name": "List Rooms", "request": { "method": "GET", "url": "{{base}}/rooms" } },
        { "name": "Available Rooms", "request": { "method": "GET", "url": "{{base}}/rooms?available=true" } },
        { "name": "Check Availability", "request": { "method": "GET", "url": "{{base}}/availability?checkIn=2025-07-10&checkOut=2025-07-13&guests=2" } }
      ]
    },
    {
      "name": "Currency",
      "item": [
        { "name": "Live Rates", "request": { "method": "GET", "url": "{{base}}/currency/rates" } },
        { "name": "Rate History (7 days)", "request": { "method": "GET", "url": "{{base}}/currency/history?days=7&currencies=LKR,GBP,AED,AUD" } }
      ]
    }
  ]
}
```

---

*Generated for Lexient HMS v1 — 2025*
