# Wedding Management System - Quick Reference

## 🎯 What's New

### Advanced Wedding Quotation System
**Complete lifecycle management for wedding events with 3-month validity windows**

---

## ⚡ Quick Start

### Create a New Wedding Quotation
1. Go to Admin → Wedding Tab
2. Click "New Quotation"
3. **Step 1**: Enter client details + select hall
4. **Step 2**: Set event date, time, guest count
5. **Step 3**: Choose menu package + add services (DJ, Decoration, etc.)
6. **Step 4**: Review totals + create

### Activate Quotation (Confirm Booking)
1. Find quotation in draft status
2. Click "Activate"
3. Enter advance payment amount
4. System generates 3-month validity
5. QR code created for bill

### Manage Active Event
- **Add Items**: Click "Add Items" button
- **Edit Items**: View details panel, click "Edit"
- **Record Payment**: Click "Payment" button
- **Close Event**: Click "Close Event" when done

### Print Final Bill
1. Quotation must be in "Closed" status
2. Click "Print Bill" button
3. Bill prints with embedded QR code
4. Customer can scan for digital copy

---

## 📊 System Features

| Feature | Description |
|---------|-------------|
| **5 Hall Types** | Premium, Standard, Basic, Indoor, Outdoor |
| **Hall Features** | AC, Parking, Kitchen, Dance Floor, Stage, Sound System |
| **5 Menu Packages** | Classic, Deluxe, Premium, Royal, Elite ($25-$120/head) |
| **Add-on Services** | DJ, Decoration, Traditional Dancing, Photography, Videography |
| **3-Month Validity** | Active quotations valid for exactly 3 months from activation |
| **Item Management** | Add, edit, delete items before closing |
| **Payment Tracking** | Record all payments with method and date |
| **QR Bill Scanning** | Embedded QR code for digital bill verification |
| **Auto-Expiry** | System automatically expires quotations after 3 months |
| **Reactivation** | Expired quotations can be reactivated with new advance payment |

---

## 💰 Pricing Breakdown

### Menu Packages (Per Head)
- Package 1 - Classic: **$25/head**
- Package 2 - Deluxe: **$45/head**
- Package 3 - Premium: **$65/head**
- Package 4 - Royal: **$85/head**
- Package 5 - Elite: **$120/head**

### Default Add-on Pricing
- DJ Services: **$500**
- Decoration: **$1,000**
- Traditional Dancing: **$800**
- Photography: **$600**
- Videography: **$800**

---

## 📋 Quotation Statuses

```
Draft
├─→ Activate → Active (3 months)
│              ├─→ Add Items/Edit/Payments
│              ├─→ Expire (after 3 months)
│              └─→ Close → Closed
│
├─→ Expired (3 months passed)
│  └─→ Reactivate (pay advance) → Active (new 3 months)
│
└─→ Cancelled (no recovery)
```

---

## 🔑 Key Workflows

### Complete Event Booking
```
1. Create Quotation (Draft - valid 3 months)
2. Client reviews
3. Activate (Advance Payment) → Active (3-month window starts)
4. Wait for event date
5. During Event: Add items, record payments
6. After Event: Close Event
7. Print Bill with QR Code
```

### Late Activation
```
1. Quotation created but not activated
2. 3 months pass → Status becomes Expired
3. Client still wants to book
4. Click "Reactivate"
5. Pay new advance → Active (new 3-month window)
```

### Bill Modifications
```
Active Quotation:
✓ Add items
✓ Edit quantities
✓ Change pricing
✓ Delete items
✓ Record payments

Closed/Expired:
✗ No modifications allowed
✗ Only view and print
```

---

## 🏃 User Actions by Status

### Draft Status
- ✅ View details
- ✅ Edit quotation
- ✅ Activate (pay advance)
- ✅ Cancel
- ❌ Close event
- ❌ Add items

### Active Status
- ✅ View details
- ✅ Add items
- ✅ Edit items
- ✅ Delete items
- ✅ Record payment
- ✅ Close event
- ✅ Print bill (preview)
- ❌ Delete quotation

### Expired Status
- ✅ View details
- ✅ Reactivate (pay advance)
- ✅ Print quotation
- ❌ Make changes
- ❌ Add items

### Closed Status
- ✅ View details
- ✅ Print bill with QR
- ✅ View payment history
- ❌ Make changes
- ❌ Add items

---

## 💡 Pro Tips

1. **Set Realistic Dates**: Quotations valid for 3 months - set expiry accordingly
2. **Advance Payment**: Always collect advance to activate - secures the booking
3. **Item Planning**: Add all known items during creation, then add extras later
4. **Payment Methods**: Record all payment methods for accounting accuracy
5. **QR Codes**: Embedded in bills for customer verification and tracking
6. **Reactivation**: If quota expires, client can still book by paying new advance
7. **Customization**: Edit menu packages and add-on prices to match your rates

---

## 📞 Common Tasks

### How to change a menu package price?
1. Admin → Wedding Tab → Menu Packages
2. Click "Customize Package"
3. Change "Price Per Head"
4. Save - automatically updates all future quotations

### How to add a new item to a menu package?
1. Admin → Wedding Tab → Menu Packages
2. Click "Customize Package"
3. Click "Add Menu Item"
4. Type item name
5. Save

### How to add items to an active event?
1. Find quotation in Active status
2. Click "View Details"
3. Click "Add Items"
4. Enter item name, quantity, unit price
5. Click "Add to Quotation"

### How to edit items already added?
1. Find quotation in Active status
2. Click "View Details"
3. Scroll to "Additional Items"
4. Click "✏️ Edit" to enable edit mode
5. Click item to modify
6. Change quantity/price
7. Click "Done"

### How to print final bill?
1. Close the event first
2. Click "View Details"
3. Click "Print Bill" button
4. Bill prints with QR code
5. Customer can scan QR to verify

### How to reactivate an expired quotation?
1. Find quotation in Expired status
2. Click "Reactivate" button
3. Enter advance payment amount
4. System sets new 3-month validity
5. Now back to Active status

---

## 🎁 Features Summary

| Feature | Benefit |
|---------|---------|
| **5 Hall Types** | Choose from various venue options |
| **Hall Features** | Know exactly what's available (AC, parking, etc.) |
| **5 Menu Choices** | Different budget options for different events |
| **Customizable Add-ons** | Offer DJ, decoration, dancing teams, etc. |
| **3-Month Active Window** | Enough time for event planning |
| **Item Management** | Flexibility to add/edit costs before billing |
| **Payment Tracking** | Clear record of all payments |
| **QR Bill Scanning** | Modern, customer-friendly verification |
| **Auto-Expiry** | System keeps track - no manual archiving |
| **Reactivation Option** | Don't lose bookings to late payments |

---

## 📱 Mobile Compatibility

- Fully responsive design
- Mobile-friendly dialogs and forms
- Touch-optimized buttons and controls
- Receipt prints optimized for 80mm thermal printer

---

## 🔒 Data Security

- All quotation data encrypted in database
- Payment information secured
- QR codes don't expose sensitive data
- Audit trail maintained for all changes
- Timestamps track creation/modification times

---

**Last Updated**: May 28, 2026
**System Version**: 2.0 - Advanced Wedding Management
**Status**: ✅ Production Ready
