# Hotel Management System - Setup & Quick Start Guide

## Current Status

✅ **Phase 1 Complete** - All core features are built and ready to use!
- MongoDB connected
- Room management system
- Complete booking system
- Customer portal
- Admin dashboard
- Booking.com integration ready

## Quick Start (5 minutes)

### 1. Start the Development Server
```bash
cd /vercel/share/v0-project
pnpm dev
```

The app is now running at `http://localhost:3000`

### 2. Access the Application

- **Homepage**: http://localhost:3000
- **Book a Room**: http://localhost:3000/booking
- **View Rooms**: http://localhost:3000/rooms
- **Admin Dashboard**: http://localhost:3000/admin

## Testing the System

### Step 1: Add Sample Rooms
1. Go to **Admin Dashboard** → **Rooms Tab**
2. Click **"Add New Room"**
3. Fill in the form:
   - Room Number: `101`
   - Category: `Deluxe`
   - Capacity: `2`
   - Price: `150`
   - Amenities: `WiFi, AC, TV`
4. Click **"Create Room"**
5. Repeat for 3-5 rooms with different categories

### Step 2: Check Room Availability
1. Go to **Book Now** page
2. Select check-in and check-out dates
3. Leave other filters empty or set minimum capacity
4. Click **"Check Availability"**
5. View available rooms

### Step 3: Make a Test Booking
1. From the available rooms, select rooms you want
2. Click **"Continue to Details"**
3. Fill in guest information:
   - Name: `John Doe`
   - Email: `john@example.com`
   - Phone: `+1234567890`
   - Promo Code (optional): Try `WELCOME10` for 10% discount
4. Click **"Complete Booking"**

### Step 4: View Booking in Admin
1. Go to **Admin Dashboard** → **Bookings Tab**
2. See your created booking listed
3. Click the eye icon to view details
4. Change booking status or payment status

### Step 5: Check Dashboard Stats
1. Go to **Admin Dashboard** → **Dashboard Tab**
2. View real-time statistics:
   - Total Rooms
   - Available Rooms
   - Total Bookings
   - Total Revenue
   - Total Guests

## Booking.com Integration Setup

### Check Integration Status
1. Go to **Admin Dashboard** → **Booking.com Tab**
2. Click **"Check Status"** button
3. You'll see "Not Configured" message

### Enable Booking.com (Optional)

To enable Booking.com synchronization:

1. **Get your credentials** from Booking.com Partner Hub
2. **Update .env.local** with:
   ```
   BOOKING_COM_API_KEY=your_key_here
   BOOKING_COM_API_SECRET=your_secret_here
   BOOKING_COM_PROPERTY_ID=your_property_id_here
   ```
3. **Restart dev server**: `pnpm dev`
4. Go back to **Booking.com Tab**
5. Click **"Check Status"** to verify
6. Click **"Sync Rooms"** to push inventory
7. Click **"Pull Bookings"** to import bookings

## Database Overview

### Connected Database
- **Provider**: MongoDB Atlas
- **Database**: Cluster0
- **Collections**: 
  - `rooms` - Hotel room inventory
  - `bookings` - Booking records
  - `customers` - Guest profiles

### View Database
Visit MongoDB Atlas Dashboard:
1. Go to https://cloud.mongodb.com
2. Login with cluster credentials
3. Navigate to Collections to view data

## File Structure

```
/vercel/share/v0-project/
├── app/
│   ├── api/              # All API endpoints
│   ├── admin/            # Admin dashboard
│   ├── booking/          # Booking page
│   ├── rooms/            # Room listing
│   └── page.tsx          # Homepage
├── components/           # React components
├── lib/
│   ├── models/           # MongoDB schemas
│   ├── mongodb.ts        # DB connection
│   └── bookingComService.ts # Booking.com API
├── public/
│   └── uploads/          # Local file storage
└── .env.local           # Environment variables
```

## Common Tasks

### Add More Rooms
1. Admin Dashboard → Rooms Tab
2. Click "Add New Room"
3. Fill form and submit

### Change Booking Status
1. Admin Dashboard → Bookings Tab
2. Click eye icon on any booking
3. Use dropdown to change status
4. Select new status and it updates automatically

### Update Room Pricing
1. Admin Dashboard → Rooms Tab
2. Click edit icon on room
3. Change price and save

### Filter Bookings
1. Admin Dashboard → Bookings Tab
2. Use "Filter by Status" dropdown at top
3. Select: All, Pending, Confirmed, Checked-in, Checked-out, Cancelled

### Check Revenue
1. Admin Dashboard → Dashboard Tab
2. View "Total Revenue" card
3. Shows total from all confirmed bookings

## API Endpoints (For Advanced Users)

```bash
# Get all rooms
curl http://localhost:3000/api/rooms

# Create a room
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"roomNumber":"101","capacity":2,"pricePerNight":150}'

# Check availability
curl "http://localhost:3000/api/availability?checkIn=2026-06-01&checkOut=2026-06-05"

# Get all bookings
curl http://localhost:3000/api/bookings
```

## Troubleshooting

### Database Connection Error
- ✅ MongoDB is already configured with provided credentials
- Check `.env.local` has MONGODB_URI
- Verify internet connection

### Room Not Appearing in Availability
- Check if room's `isAvailable` flag is true
- Check dates don't conflict with existing bookings
- Try different capacity filter

### Booking.com Not Syncing
- Verify API credentials are correct
- Ensure BOOKING_COM_PROPERTY_ID is set
- Check Booking.com Partner Hub for API status

### Port 3000 Already in Use
```bash
# Kill the process
lsof -i :3000
kill -9 <PID>

# Or use different port
pnpm dev -p 3001
```

## Next Steps

### Immediate Actions
1. ✅ Test the system with sample data
2. ✅ Configure Booking.com if needed
3. ✅ Explore admin dashboard

### Phase 2 Features (Ready to Build)
- Inventory management (food stock, supplies)
- Financial system (expenses, reports)
- Wedding hall management
- Restaurant & table reservations
- Staff management
- Advanced analytics

### Production Deployment
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

## Support Resources

- **README.md**: Full documentation
- **API Routes**: Check `app/api/` directory
- **Database Models**: Check `lib/models/` directory
- **Components**: Check `components/` directory

## Performance Tips

- Room availability checking is optimized with MongoDB queries
- Dashboard stats load in parallel
- Images can be optimized using the sharp library

## Security Notes

- API keys are stored in .env.local (never commit to Git)
- All endpoints validate input
- Database queries use parameterized format
- Ready for authentication implementation

## Next Session

When you return, just run:
```bash
cd /vercel/share/v0-project
pnpm dev
```

All your data is stored in MongoDB Atlas and will persist!

---

**Need help?** Check the README.md for detailed documentation or explore the code in the `app/api/` and `components/` directories.
