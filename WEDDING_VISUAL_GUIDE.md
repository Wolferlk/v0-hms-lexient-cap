# 🎊 Wedding Management System - Visual Guide

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   ADMIN DASHBOARD                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Wedding Tab                                        │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ [Quotations] [Wedding Halls] [Menu Packages (5)]   │   │
│  └─────────────────────────────────────────────────────┘   │
│         │                    │                    │         │
│         ├─ Create Dialog    ├─ Hall Dialog       ├─ Edit   │
│         ├─ Payment Dialog   ├─ Add/Edit Hall    │  Package │
│         ├─ Add Items Dialog └─ Features Toggle  └─ Dialog  │
│         ├─ Detail Panel                                    │
│         └─ Print with QR                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   API LAYER (RESTful)                       │
├─────────────────────────────────────────────────────────────┤
│  POST /quotations          - Create quotation (Draft)      │
│  GET /quotations           - List quotations (auto-expire) │
│  PUT /quotations/{id}      - Activate, Payment, Items, etc │
│  DELETE /quotations/{id}   - Delete quotation              │
│  GET /halls                - List wedding halls             │
│  POST /halls               - Add new hall                   │
│  PUT /halls                - Update hall                    │
│  GET /menu-packages        - List 5 packages               │
│  PUT /menu-packages        - Update package items          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (MongoDB)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─ WeddingHall                 ┌─ WeddingQuotation       │
│  │  ├─ hallType                 │  ├─ quoteNumber        │
│  │  ├─ capacity                 │  ├─ clientName         │
│  │  ├─ basePrice                │  ├─ hallId             │
│  │  ├─ features {}              │  ├─ menuPackageId      │
│  │  │  ├─ AC                    │  ├─ pax                │
│  │  │  ├─ parking               │  ├─ status             │
│  │  │  └─ danceFloor            │  ├─ totalAmount        │
│  │  └─ availability             │  ├─ advancePaid        │
│  └─                             │  ├─ validUntil         │
│                                 │  ├─ activatedDate      │
│  ┌─ WeddingMenuPackage          │  ├─ expiryDate         │
│  │  ├─ packageNumber (1-5)      │  ├─ qrCode             │
│  │  ├─ name                     │  ├─ payments []        │
│  │  ├─ pricePerHead             │  ├─ addOns []          │
│  │  └─ items []                 │  ├─ additionalItems [] │
│  └─                             │  └─ timestamps         │
│                                 └─                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Quotation Lifecycle Flow

```
                    ┌─────────────────────────────────┐
                    │ CREATE QUOTATION                │
                    │ Status: DRAFT                   │
                    │ Valid: 3 months                 │
                    │ (validUntil = now + 3mo)        │
                    └────────────────┬────────────────┘
                                     │
                ┌────────────────────┼────────────────────┐
                │                    │                    │
                ▼                    ▼                    ▼
        ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
        │ ACTIVATE     │     │ EXPIRES      │     │ CANCEL       │
        │ (with advance│     │ After 3mo    │     │              │
        │  payment)    │     │              │     │              │
        └──────┬───────┘     └────┬─────────┘     └──────────────┘
               │                  │
               │                  ├─→ Status: EXPIRED
               │                  │   └─→ [Can Reactivate]
               │                  │
               ▼                  │
        ┌──────────────┐          │    ┌─────────────────┐
        │ ACTIVE       │          │    │ REACTIVATE      │
        │ Status: ACTIVE         │    │ (with new adv.)│
        │ Valid: 3 months        │    │ New 3-month    │
        │ (expiryDate = now+3mo) │    │ window starts   │
        └──────┬───────┘          │    └────────┬────────┘
               │                  │            │
               ├─→ Add Items      │            ▼
               ├─→ Edit Items     └──────→ Back to ACTIVE
               ├─→ Delete Items          (New 3-month)
               ├─→ Payments
               │
               ▼
        ┌──────────────┐
        │ CLOSE EVENT  │
        │ Final Payment│
        │ (optional)   │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │ CLOSED       │
        │ Can Print Bill
        │ with QR Code │
        └──────────────┘
```

---

## Quotation Creation Wizard (4 Steps)

```
┌────────────────────────────────────────────────────────────────┐
│  STEP 1: CLIENT & HALL SELECTION                              │
├────────────────────────────────────────────────────────────────┤
│ [Progress: ████░░░░░░]                                        │
│                                                                │
│ Client Information:                                           │
│ ┌─────────────────────────────────────┐                       │
│ │ Full Name:        [________________] │                       │
│ │ Email:            [________________] │                       │
│ │ Phone:            [________________] │                       │
│ └─────────────────────────────────────┘                       │
│                                                                │
│ Hall Selection:                                               │
│ ┌─────────────────────────────────────┐                       │
│ │ Select Hall:                        │                       │
│ │ [Grand Ballroom - Premium - 500 pax]│                       │
│ │ [Silver Hall - Standard - 300 pax ] │                       │
│ │ [Garden Pavilion - Outdoor - 200px] │                       │
│ └─────────────────────────────────────┘                       │
│                                                                │
│                        [Next: Event Details →]                │
└────────────────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────────────────┐
│  STEP 2: EVENT DETAILS                                         │
├────────────────────────────────────────────────────────────────┤
│ [Progress: ████████░░]                                        │
│                                                                │
│ Event Date:          [2026-12-15______]                       │
│ Start Time:          [18:00_____]  End: [23:00_____]         │
│ Event Type:          [Wedding    ▼]                           │
│ Number of Guests:    [250_____]                              │
│                                                                │
│ [Next: Menu & Services →]  [← Back]                          │
└────────────────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────────────────┐
│  STEP 3: MENU & ADD-ON SERVICES                               │
├────────────────────────────────────────────────────────────────┤
│ [Progress: ████████████░░]                                   │
│                                                                │
│ Menu Packages:                                                │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│ │ Classic      │ │ Deluxe       │ │ Premium ✓    │          │
│ │ $25/head     │ │ $45/head     │ │ $65/head [✓] │          │
│ │ 7 items      │ │ 8 items      │ │ 9 items      │          │
│ └──────────────┘ └──────────────┘ └──────────────┘          │
│ ┌──────────────┐ ┌──────────────┐                            │
│ │ Royal        │ │ Elite        │                            │
│ │ $85/head     │ │ $120/head    │                            │
│ │ 10 items     │ │ 11 items     │                            │
│ └──────────────┘ └──────────────┘                            │
│                                                                │
│ Add-On Services:                                              │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│ │  DJ    │ │ Decor  │ │ Dance  │ │ Photo  │ │ Video  │     │
│ │ [$500] │ │[$1000] │ │ [$800] │ │ [$600] │ │ [$800] │     │
│ │   ✓    │ │   ✓    │ │        │ │        │ │        │     │
│ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘     │
│                                                                │
│ [Next: Review →]  [← Back]                                  │
└────────────────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────────────────┐
│  STEP 4: REVIEW & CREATE                                       │
├────────────────────────────────────────────────────────────────┤
│ [Progress: ████████████████]                                 │
│                                                                │
│ Summary:                                                      │
│ ┌────────────────────────────────────────┐                   │
│ │ Hall Base Charge          $1,500.00   │                   │
│ │ Menu (250 × $65)         $16,250.00   │                   │
│ │ DJ Services              $   500.00   │                   │
│ │ Decoration               $ 1,000.00   │                   │
│ │ Traditional Dancing      $   800.00   │                   │
│ ├────────────────────────────────────────┤                   │
│ │ GRAND TOTAL              $20,050.00   │                   │
│ └────────────────────────────────────────┘                   │
│                                                                │
│ ⏰ Valid for 3 months from today                              │
│    After 3 months → Quotation expires                        │
│    Can be reactivated with advance payment                   │
│                                                                │
│ Special Notes: ┌───────────────────────────┐                │
│               │ [e.g., dietary restrictions] │               │
│               └───────────────────────────┘                │
│                                                                │
│              [✅ Create Quotation]  [← Back]                │
└────────────────────────────────────────────────────────────────┘
```

---

## Payment & Actions by Status

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUOTATION STATUS ACTIONS                     │
├──────────────────┬─────────────────┬────────────────────────────┤
│  STATUS: DRAFT   │  STATUS: ACTIVE │  STATUS: EXPIRED           │
├──────────────────┼─────────────────┼────────────────────────────┤
│                  │                 │                            │
│ ✅ View Details  │ ✅ View Details │ ✅ View Details           │
│ ✅ Activate      │ ✅ Add Items    │ ✅ Reactivate             │
│ ✅ Cancel        │ ✅ Edit Items   │ ✅ View History           │
│ ✅ Search        │ ✅ Delete Items │ ❌ Add Items              │
│                  │ ✅ Payments     │ ❌ Edit Items             │
│ ❌ Add Items     │ ✅ Close Event  │                            │
│ ❌ Close Event   │ ✅ View History │                            │
│ ❌ Print Bill    │ ✅ Refresh      │                            │
│                  │                 │                            │
│ Color: 🟡 Yellow │ Color: 🟢 Green │ Color: 🟠 Orange          │
├──────────────────┼─────────────────┼────────────────────────────┤
│  STATUS: CLOSED  │  STATUS:        │                            │
│                  │  CANCELLED      │                            │
├──────────────────┼─────────────────┼────────────────────────────┤
│                  │                 │                            │
│ ✅ View Details  │ ✅ View Details │                            │
│ ✅ Print Bill    │ ✅ View History │                            │
│ ✅ Print QR Code │                 │                            │
│ ✅ View History  │ ❌ Reactivate   │                            │
│                  │ ❌ Reopen       │                            │
│ ❌ Add Items     │ ❌ Add Items     │                            │
│ ❌ Edit Items    │                 │                            │
│ ❌ Reopen        │                 │                            │
│                  │                 │                            │
│ Color: 🔵 Blue   │ Color: 🔴 Red   │                            │
└──────────────────┴─────────────────┴────────────────────────────┘
```

---

## Bill Printing with QR Code

```
╔═══════════════════════════════════════╗
║        LEXIENT HOTEL                  ║
║      Wedding Event Bill               ║
╠═══════════════════════════════════════╣
║ BILL #: WQ-1716889201-A7K2Q          ║
║ DATE:   28 MAY 2026                   ║
╠═══════════════════════════════════════╣
║ CLIENT: Rahul & Priya                ║
║ PHONE:  +91 98765 43210              ║
║ EMAIL:  rahul@email.com              ║
╠═══════════════════════════════════════╣
║ EVENT DATE:    15 DEC 2026            ║
║ TIME:          6:00 PM - 11:00 PM    ║
║ GUESTS:        250 PAX                ║
║ HALL:          Grand Ballroom         ║
╠═══════════════════════════════════════╣
║ BILLING BREAKDOWN                     ║
├───────────────────────────────────────┤
║ Hall Base                  $  1,500   ║
║ Menu (Premium, 250×$65)    $ 16,250   ║
║ DJ Services                $    500   ║
║ Decoration                 $  1,000   ║
║ Traditional Dancing        $    800   ║
║ Extra Flowers (+2)         $    300   ║
║ Premium Bar Service (+3hrs)$    800   ║
╠═══════════════════════════════════════╣
║ SUBTOTAL                   $ 21,150   ║
║ TAXES                      $  2,538   ║
╠═══════════════════════════════════════╣
║ TOTAL AMOUNT               $ 23,688   ║
║ AMOUNT PAID                $  5,000   ║
╠═══════════════════════════════════════╣
║ BALANCE DUE                $ 18,688   ║
╠═══════════════════════════════════════╣
║                                       ║
║        ┌──────────────────────┐      ║
║        │                      │      ║
║        │    ████████████      │      ║
║        │    █   QR CODE   █   │      ║
║        │    █             █   │      ║
║        │    ████████████      │      ║
║        │                      │      ║
║        └──────────────────────┘      ║
║    Scan for Digital Bill              ║
║    https://lexient.com/bill/WQ-xxx   ║
║                                       ║
╠═══════════════════════════════════════╣
║ Thank you for choosing Lexient Hotel! ║
║ For inquiries: events@lexient.com     ║
║ Generated: 28 MAY 2026, 2:45 PM       ║
╚═══════════════════════════════════════╝
```

---

## 5 Menu Packages Visual

```
╔════════════════════════════════════════════════════════════════════╗
║              WEDDING MENU PACKAGES (CUSTOMIZABLE)                 ║
╠════════════════════════════════════════════════════════════════════╣

┌─ PACKAGE 1: CLASSIC ───────────────────────────────────────────┐
│ 💰 $25 PER HEAD                                                 │
│ ┌────────────────────────────────────────┐                      │
│ │ • Welcome Drink        • Dessert        │                      │
│ │ • Soup                 • Tea/Coffee     │                      │
│ │ • 2 Veg Curries        • Bread Basket   │                      │
│ │ • 1 Non-Veg Curry      • Rice           │                      │
│ └────────────────────────────────────────┘                      │
│ For 100 guests: $2,500 • Edit Package                            │
└─────────────────────────────────────────────────────────────────┘

┌─ PACKAGE 2: DELUXE ────────────────────────────────────────────┐
│ 💰 $45 PER HEAD  [MOST POPULAR]                                 │
│ ┌────────────────────────────────────────┐                      │
│ │ • Welcome Cocktail     • Live Juice     │                      │
│ │ • Soup                 • 2 Desserts     │                      │
│ │ • 3 Veg Curries        • Rice & Breads  │                      │
│ │ • 2 Non-Veg Curries    • BBQ Station    │                      │
│ └────────────────────────────────────────┘                      │
│ For 100 guests: $4,500 • Edit Package                            │
└─────────────────────────────────────────────────────────────────┘

┌─ PACKAGE 3: PREMIUM ───────────────────────────────────────────┐
│ 💰 $65 PER HEAD                                                 │
│ ┌────────────────────────────────────────┐                      │
│ │ • Welcome Drinks Bar   • Fruit Counter  │                      │
│ │ • International Soup    • Ice Cream     │                      │
│ │ • 4 Veg Curries        • 3 Desserts     │                      │
│ │ • 3 Non-Veg Curries    • Pasta          │                      │
│ │ • Seafood Counter      • Coffee/Tea    │                      │
│ └────────────────────────────────────────┘                      │
│ For 100 guests: $6,500 • Edit Package                            │
└─────────────────────────────────────────────────────────────────┘

┌─ PACKAGE 4: ROYAL ─────────────────────────────────────────────┐
│ 💰 $85 PER HEAD                                                 │
│ ┌────────────────────────────────────────┐                      │
│ │ • Open Bar (3 hrs)     • Cheese Station │                      │
│ │ • Canapés              • Fruit Fountain │                      │
│ │ • International Buffet  • Midnight Snack│                      │
│ │ • Live Cooking Station • 4 Desserts     │                      │
│ │ • Seafood & Carving    • Pasta Bar      │                      │
│ └────────────────────────────────────────┘                      │
│ For 100 guests: $8,500 • Edit Package                            │
└─────────────────────────────────────────────────────────────────┘

┌─ PACKAGE 5: ELITE ─────────────────────────────────────────────┐
│ 💰 $120 PER HEAD  [ULTIMATE EXPERIENCE]                        │
│ ┌────────────────────────────────────────┐                      │
│ │ • Unlimited Open Bar   • Dedicated      │                      │
│ │ • Personalized Welcome │  Dessert Hall  │                      │
│ │ • Full International   • Chocolate      │                      │
│ │  Buffet (8 sections)   │  Fountain      │                      │
│ │ • 2 Live Cooking       • Wedding Cake   │                      │
│ │ • Seafood Extravaganza • Late Night    │                      │
│ │ • Spit Roast           │  Grill        │                      │
│ └────────────────────────────────────────┘                      │
│ For 100 guests: $12,000 • Edit Package                           │
└─────────────────────────────────────────────────────────────────┘

╚════════════════════════════════════════════════════════════════════╝
```

---

## 6 Add-On Services Matrix

```
╔═════════════════════════════════════════════════════════════════╗
║            PROFESSIONAL ADD-ON SERVICES                        ║
╠═════════════════════════════════════════════════════════════════╣

  🎵 DJ SERVICES              💃 TRADITIONAL DANCING TEAM
  Default: $500               Default: $800
  ✓ Customizable pricing      ✓ Customizable pricing
  ✓ Background music          ✓ Professional dancers
  ✓ Song requests             ✓ Traditional choreography
  ✓ Professional equipment    ✓ Costume included
  └→ Best for: Entertainment  └→ Best for: Cultural element

  🌺 DECORATION               📸 PHOTOGRAPHY
  Default: $1,000             Default: $600
  ✓ Customizable pricing      ✓ Customizable pricing
  ✓ Floral arrangements       ✓ Professional photos
  ✓ Lighting setup            ✓ Album preparation
  ✓ Theme design              ✓ Digital copies
  └→ Best for: Ambiance       └→ Best for: Memories

  🎬 VIDEOGRAPHY              🎁 OTHER SERVICES
  Default: $800               Custom pricing
  ✓ Customizable pricing      ✓ Set custom amounts
  ✓ Professional video        ✓ Flexible services
  ✓ Editing included          ✓ Any requirement
  ✓ Same-day highlights       ✓ Easy additions
  └→ Best for: Highlights     └→ Best for: Special requests

╚═════════════════════════════════════════════════════════════════╝
```

---

## Timeline Visualization

```
TODAY              MONTH 1           MONTH 2           MONTH 3
   │                  │                 │                 │
   ├──────────────────┼─────────────────┼─────────────────┤
   │                  │                 │                 │
Draft Period (3 months for review)      │                 │
   │                  │                 │                 │
   ├─ Quotation Valid ─────────────────────────────────────│
   │                  │                 │                 │
   └─→ ACTIVATE       │                 │                 │
      (Advance Pay)   │                 │                 │
      Active Period Starts              │                 │
      ├──────────────┼─────────────────┼─────────────────┤
      │              │                 │                 │
      Active (3 months for planning)    │                 │
      │              │                 │                 │
      ├─ Add Items   ├─ More Items    ├─ Final Items    │
      ├─ Payments    ├─ Payments      ├─ Close Event    │
      ├─ Edits       ├─ Edits         ├─ Print Bill     │
      │              │                 │                 │
      └─ Active Period Expires          └─ Closed Status  │
                                           QR Bill Ready  │
                                           
                    If Not Activated:
                    ├─ REACTIVATE (after 3 months)
                    │  └─→ NEW 3-month window starts
                    │
                    └─ EXPIRED Status
                       Can still be reactivated with payment
```

---

This visual guide provides a comprehensive overview of the entire wedding management system architecture, workflows, and user interactions.

**Status**: ✅ Complete and Ready for Reference
