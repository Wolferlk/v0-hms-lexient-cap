const now = new Date();
const day = 24 * 60 * 60 * 1000;

const objectId = (prefix: number, index: number) =>
  `${prefix}${String(index + 1).padStart(21, '0')}`.slice(0, 24);
const isoDaysFromNow = (offset: number) =>
  new Date(now.getTime() + offset * day).toISOString();
const isoDaysAgo = (offset: number) =>
  new Date(now.getTime() - offset * day).toISOString();
const monthString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const pick = <T,>(items: readonly T[], index: number): T => items[index % items.length]!;

const sriLankanNames = [
  'Nimal Perera',
  'Sara Jayasinghe',
  'Ravindu Silva',
  'Amani Fernando',
  'Kamal Wickramasinghe',
  'Tharushi Ranatunga',
  'Dinesh Madushan',
  'Piumi Karunaratne',
  'Isuru Lakmal',
  'Nethmi Peris',
];

const roomCategories = ['Standard', 'Deluxe', 'Suite', 'Presidential'] as const;
const bookingStatuses = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'] as const;
const paymentStatuses = ['unpaid', 'partial', 'paid', 'refunded'] as const;
const menuCategories = ['appetizer', 'main', 'dessert', 'beverage', 'special'] as const;
const tableLocations = ['indoor', 'outdoor', 'private'] as const;
const restaurantReservationStatuses = ['pending', 'confirmed', 'completed', 'cancelled'] as const;
const orderStatuses = ['pending', 'approved', 'preparing', 'ready', 'delivered', 'completed', 'cancelled'] as const;
const dayOutActivities = ['Kayaking', 'Swimming', 'BBQ', 'Team Games', 'Boat Ride'];
const boatTypes = ['speed_boat', 'houseboat', 'yacht', 'catamaran', 'ferry'] as const;
const inventoryCategories = ['food', 'beverage', 'supplies', 'equipment'] as const;
const inventoryTransactionTypes = ['inbound', 'outbound', 'adjustment', 'damage'] as const;
const departments = ['housekeeping', 'restaurant', 'front_desk', 'maintenance', 'security', 'management'] as const;
const employeeStatuses = ['active', 'inactive', 'on_leave', 'terminated'] as const;
const attendanceStatuses = ['present', 'absent', 'half_day', 'leave', 'holiday'] as const;
const payrollStatuses = ['pending', 'processed', 'paid'] as const;
const incomeSources = ['booking', 'restaurant', 'wedding_hall', 'event', 'other'] as const;
const expenseCategories = ['utilities', 'maintenance', 'supplies', 'payroll', 'food', 'marketing', 'other'] as const;
const expenseStatuses = ['pending', 'approved', 'paid', 'rejected'] as const;
const weddingAvailability = ['available', 'booked', 'maintenance'] as const;
const weddingEventStatuses = ['inquiry', 'confirmed', 'completed', 'cancelled'] as const;
const weddingEventTypes = ['wedding', 'reception', 'pre_wedding', 'other'] as const;
const analyticsMetricTypes = [
  'total_bookings',
  'total_revenue',
  'occupancy_rate',
  'avg_booking_value',
  'new_customers',
  'repeat_customers',
  'cancellations',
  'no_shows',
  'average_rating',
  'checkout_conversion',
] as const;
const reportTypes = ['revenue', 'occupancy', 'customer', 'operational', 'financial', 'custom'] as const;
const reportPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'] as const;

export const sampleCustomers = Array.from({ length: 10 }, (_, index) => ({
  _id: objectId(1, index),
  email: `${sriLankanNames[index].toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
  name: sriLankanNames[index],
  phone: `+94 7${(index % 8) + 1} ${String(1200000 + index * 54321).slice(0, 3)} ${String(1200000 + index * 54321).slice(3, 7)}`,
  address: `${20 + index} Beach Road`,
  city: pick(['Colombo', 'Negombo', 'Galle', 'Kandy', 'Kalutara'], index),
  country: 'Sri Lanka',
  totalBookings: 1 + (index % 6),
  totalSpent: 45000 + index * 22500,
  isVIP: index % 3 === 0,
  preferences: {
    roomCategory: pick(roomCategories, index),
    specialRequests: pick(
      ['Late check-in', 'Vegetarian meals', 'Airport pickup', 'Pool view', 'Baby cot'],
      index
    ),
  },
  createdAt: isoDaysAgo(180 - index * 9),
  updatedAt: isoDaysAgo(10 - (index % 5)),
}));

export const sampleRooms = Array.from({ length: 10 }, (_, index) => ({
  _id: objectId(2, index),
  roomNumber: `${100 + index}`,
  category: pick(roomCategories, index),
  capacity: Math.min(2 + (index % 5), 6),
  pricePerNight: 18000 + index * 6500,
  description: `${pick(roomCategories, index)} room with ${pick(
    ['garden', 'pool', 'lagoon', 'ocean'],
    index
  )} view.`,
  amenities: [
    'WiFi',
    'Air Conditioning',
    pick(['Mini Bar', 'Balcony', 'Jacuzzi', 'Living Area'], index),
  ],
  images: [`/rooms/${100 + index}-1.jpg`],
  isAvailable: index % 4 !== 1,
  createdAt: isoDaysAgo(220 - index * 7),
  updatedAt: isoDaysAgo(index % 9),
}));

export const sampleBookings = Array.from({ length: 10 }, (_, index) => {
  const customer = sampleCustomers[index];
  const primaryRoom = sampleRooms[index];
  const secondaryRoom = sampleRooms[(index + 3) % sampleRooms.length];
  const roomIds = index % 4 === 0 ? [primaryRoom._id, secondaryRoom._id] : [primaryRoom._id];
  const status = pick(bookingStatuses, index);
  const paymentStatus =
    status === 'cancelled'
      ? 'refunded'
      : pick(paymentStatuses.filter((item) => item !== 'refunded'), index);
  const numberOfNights = 1 + (index % 4);
  const totalAmount = roomIds.length * (primaryRoom.pricePerNight * numberOfNights) + index * 1500;
  const amountPaid =
    paymentStatus === 'paid'
      ? totalAmount
      : paymentStatus === 'partial'
        ? Math.round(totalAmount * 0.4)
        : paymentStatus === 'refunded'
          ? totalAmount
          : 0;

  return {
    _id: objectId(3, index),
    bookingId: `BK-SAMPLE-${String(index + 1).padStart(3, '0')}`,
    customerId: customer._id,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    roomIds,
    checkInDate: isoDaysFromNow(index - 3),
    checkOutDate: isoDaysFromNow(index - 3 + numberOfNights),
    numberOfNights,
    numberOfGuests: Math.min(2 + (index % 4), 6),
    totalAmount,
    promoCode: index % 2 === 0 ? 'WELCOME10' : '',
    discountAmount: index % 2 === 0 ? 2500 : 0,
    amountPaid,
    payments:
      amountPaid > 0
        ? [
            {
              _id: objectId(93, index),
              amount: amountPaid,
              method: pick(['cash', 'card', 'upi', 'wallet', 'bank_transfer'] as const, index),
              date: isoDaysAgo(index + 1),
              notes: 'Sample payment entry',
              recordedBy: 'Front Desk',
            },
          ]
        : [],
    status,
    paymentStatus,
    paymentMethod: amountPaid > 0 ? pick(['cash', 'card', 'online transfer'], index) : '',
    notes: `Sample booking ${index + 1}`,
    bookingFromSource: pick(['direct', 'booking.com', 'other'] as const, index),
    externalBookingId: index % 3 === 1 ? `EXT-${7000 + index}` : '',
    checkInTime: status === 'checked-in' || status === 'checked-out' ? isoDaysFromNow(index - 3) : undefined,
    checkOutTime: status === 'checked-out' ? isoDaysFromNow(index - 3 + numberOfNights) : undefined,
    createdAt: isoDaysAgo(20 - index),
    updatedAt: isoDaysAgo(10 - (index % 7)),
  };
});

export const sampleMenuItems = Array.from({ length: 10 }, (_, index) => ({
  _id: objectId(4, index),
  name: `${pick(['Coconut', 'Spicy', 'Tropical', 'Grilled', 'Herbal'], index)} ${pick(
    ['Prawns', 'Rice', 'Salad', 'Juice', 'Platter'],
    index + 1
  )}`,
  description: `Chef special ${pick(menuCategories, index)} item ${index + 1}.`,
  category: pick(menuCategories, index),
  price: 800 + index * 450,
  vegetarian: index % 3 === 0,
  spiceLevel: index % 6,
  available: index % 5 !== 4,
  image: `/menu/item-${index + 1}.jpg`,
  preparationTime: 10 + index * 3,
  createdAt: isoDaysAgo(60 - index * 2),
}));

export const sampleRestaurantTables = Array.from({ length: 30 }, (_, index) => ({
  _id: objectId(45, index),
  tableNumber: `T${index + 1}`,
  capacity: 2 + (index % 5) * 2,
  location: pick(tableLocations, index),
  status:
    index < 6
      ? pick(['available', 'reserved', 'occupied'] as const, index)
      : index === 29
        ? 'maintenance'
        : 'available',
  amenities: [pick(['window_view', 'garden_view', 'private_corner', 'birthday_setup'], index)],
  createdAt: isoDaysAgo(90 - index * 3),
}));

export const sampleRestaurantReservations = Array.from({ length: 10 }, (_, index) => ({
  _id: objectId(46, index),
  customerId: sampleCustomers[index]._id,
  tableId: sampleRestaurantTables[index]._id,
  reservationDate: isoDaysFromNow(index + 1),
  guestCount: Math.min(sampleRestaurantTables[index].capacity, 2 + (index % 6)),
  duration: 90 + (index % 3) * 30,
  specialRequests: pick(['Birthday décor', 'Quiet corner', 'High chair', 'Vegan options', 'Window seat'], index),
  status: pick(restaurantReservationStatuses, index),
  contactPhone: sampleCustomers[index].phone,
  notes: `Reservation note ${index + 1}`,
  createdAt: isoDaysAgo(15 - index),
  updatedAt: isoDaysAgo(8 - (index % 5)),
}));

export const sampleRestaurantOrders = Array.from({ length: 10 }, (_, index) => {
  const customer = sampleCustomers[index];
  const menuA = sampleMenuItems[index];
  const menuB = sampleMenuItems[(index + 2) % sampleMenuItems.length];
  const items = [
    {
      menuItemId: menuA._id,
      itemName: menuA.name,
      quantity: 1 + (index % 3),
      specialInstructions: 'Less spicy',
      price: menuA.price,
    },
    {
      menuItemId: menuB._id,
      itemName: menuB.name,
      quantity: 1,
      specialInstructions: '',
      price: menuB.price,
    },
  ];
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const tax = Math.round(subtotal * 0.12);
  const discount = index % 4 === 0 ? 300 : 0;

  return {
    _id: objectId(47, index),
    reservationId: sampleRestaurantReservations[index]._id,
    bookingId: sampleBookings[index]._id,
    customerId: customer._id,
    orderType: pick(['dine-in', 'room-service'] as const, index),
    mealType: pick(['breakfast', 'lunch', 'dinner', 'snack', 'beverages'] as const, index),
    roomNumber: sampleRooms[index].roomNumber,
    items,
    subtotal,
    tax,
    discount,
    total: subtotal + tax - discount,
    paymentStatus: pick(['unpaid', 'partial', 'paid', 'charged_to_room'] as const, index),
    paymentMethod: pick(['cash', 'card', 'upi', 'wallet', 'room_charge'] as const, index),
    status: pick(orderStatuses, index),
    orderTime: isoDaysAgo(2 + index),
    completionTime: index % 3 === 0 ? isoDaysAgo(index) : undefined,
    createdAt: isoDaysAgo(12 - index),
    updatedAt: isoDaysAgo(6 - (index % 4)),
  };
});

export const sampleRestaurantBills = sampleRestaurantOrders.map((order, index) => ({
  _id: objectId(48, index),
  orderId: order._id,
  customerId: order.customerId,
  tableId: sampleRestaurantTables[index]._id,
  tableNumber: sampleRestaurantTables[index].tableNumber,
  partyName: sampleCustomers[index].name,
  items: order.items.map((item) => ({
    itemName: item.itemName,
    quantity: item.quantity,
    unitPrice: item.price,
    total: item.price * item.quantity,
  })),
  subtotal: order.subtotal,
  tax: order.tax,
  serviceCharge: index % 3 === 0 ? 250 : 0,
  discount: order.discount,
  totalAmount: order.total + (index % 3 === 0 ? 250 : 0),
  paymentStatus: 'paid',
  paymentMethods: [
    {
      method: order.paymentMethod || 'cash',
      amount: order.total + (index % 3 === 0 ? 250 : 0),
    },
  ],
  billNumber: `RB-SAMPLE-${String(index + 1).padStart(3, '0')}`,
  qrCodeValue: `/bills/RB-SAMPLE-${String(index + 1).padStart(3, '0')}`,
  billDate: order.completionTime || isoDaysAgo(index + 1),
  notes: `Historical settled bill ${index + 1}`,
  createdAt: order.completionTime || isoDaysAgo(index + 1),
}));

export const sampleDayOutPackages = Array.from({ length: 10 }, (_, index) => ({
  _id: objectId(5, index),
  name: `Day-out Package ${index + 1}`,
  description: `Fun-filled group package ${index + 1}.`,
  price: 35000 + index * 7000,
  capacity: 25 + index * 5,
  duration: 6 + (index % 5),
  activities: [pick(dayOutActivities, index), pick(dayOutActivities, index + 1)],
  inclusions: ['Welcome drink', 'Buffet lunch', 'Pool access'],
  image: `/dayout/package-${index + 1}.jpg`,
  minGroupSize: 8 + (index % 3) * 2,
  maxGroupSize: 30 + index * 5,
  availability: {
    startDate: isoDaysAgo(20),
    endDate: isoDaysFromNow(160),
    daysOfWeek: [1, 3, 5, 6],
  },
  amenities: ['Parking', 'Changing rooms', 'First-aid'],
  pricePerPerson: 3500 + index * 250,
  discountPercentage: (index % 4) * 5,
  createdAt: isoDaysAgo(80 - index * 3),
}));

export const sampleGroupBookings = Array.from({ length: 10 }, (_, index) => {
  const pkg = sampleDayOutPackages[index];
  const people = Math.min(pkg.minGroupSize + 4 + index, pkg.maxGroupSize);
  const gross = people * pkg.pricePerPerson;
  const totalPrice = Math.round(gross * (1 - pkg.discountPercentage / 100));
  const depositAmount = Math.round(totalPrice * 0.3);

  return {
    _id: objectId(51, index),
    packageId: pkg._id,
    customerId: sampleCustomers[index]._id,
    groupName: `Group Booking ${index + 1}`,
    bookingDate: isoDaysFromNow(index + 5),
    numberOfPeople: people,
    totalPrice,
    depositAmount,
    balanceAmount: totalPrice - depositAmount,
    paymentStatus: pick(['pending', 'partial', 'paid'] as const, index),
    status: pick(['pending', 'confirmed', 'completed', 'cancelled'] as const, index),
    specialRequests: 'Sample meal preference included.',
    contactPerson: {
      name: sampleCustomers[index].name,
      phone: sampleCustomers[index].phone,
      email: sampleCustomers[index].email,
    },
    activities: pkg.activities,
    notes: `Group note ${index + 1}`,
    createdAt: isoDaysAgo(18 - index),
    updatedAt: isoDaysAgo(9 - (index % 5)),
  };
});

export const sampleBoatRidePackages = Array.from({ length: 10 }, (_, index) => ({
  _id: objectId(52, index),
  name: `Boat Ride Package ${index + 1}`,
  description: `Scenic route package ${index + 1}.`,
  boatType: pick(boatTypes, index),
  capacity: 6 + index * 2,
  price: 18000 + index * 9000,
  pricePerPerson: 2500 + index * 300,
  duration: 60 + index * 15,
  routeDescription: `Route description ${index + 1}`,
  landmarks: ['Mangroves', 'Canal Bridge', 'Lighthouse'],
  mealIncluded: index % 2 === 0,
  lifeJacketsProvided: true,
  availability: {
    startDate: isoDaysAgo(10),
    endDate: isoDaysFromNow(120),
    departureTime: ['09:00', '14:00', '17:30'],
  },
  safetyRating: 3 + (index % 3),
  createdAt: isoDaysAgo(45 - index * 2),
}));

export const sampleBoatRideBookings = Array.from({ length: 10 }, (_, index) => {
  const pkg = sampleBoatRidePackages[index];
  const passengers = Math.min(2 + index, pkg.capacity);
  return {
    _id: objectId(53, index),
    packageId: pkg._id,
    customerId: sampleCustomers[index]._id,
    bookingDate: isoDaysFromNow(index + 2),
    departureTime: pick(pkg.availability.departureTime, index),
    numberOfPassengers: passengers,
    totalPrice: passengers * pkg.pricePerPerson,
    paymentStatus: pick(['unpaid', 'partial', 'paid'] as const, index),
    status: pick(['pending', 'confirmed', 'completed', 'cancelled'] as const, index),
    specialRequests: 'Life jacket size check',
    notes: `Boat ride note ${index + 1}`,
    createdAt: isoDaysAgo(14 - index),
    updatedAt: isoDaysAgo(7 - (index % 4)),
  };
});

export const sampleSuppliers = Array.from({ length: 10 }, (_, index) => ({
  _id: objectId(6, index),
  name: `Supplier ${index + 1}`,
  contactPerson: sriLankanNames[index],
  email: `supplier${index + 1}@example.com`,
  phone: `+94 11 ${String(3000000 + index * 4567).slice(0, 3)} ${String(3000000 + index * 4567).slice(3, 7)}`,
  address: `${100 + index} Market Street`,
  city: pick(['Colombo', 'Negombo', 'Ja-Ela', 'Gampaha'], index),
  state: 'Western',
  zipCode: `10${String(index).padStart(3, '0')}`,
  paymentTerms: pick(['COD', '15 days', '30 days'], index),
  taxId: `VAT-${index + 1}`,
  rating: 3.5 + (index % 4) * 0.4,
  isActive: index % 5 !== 4,
  createdAt: isoDaysAgo(200 - index * 6),
  updatedAt: isoDaysAgo(20 - (index % 8)),
}));

export const sampleInventoryItems = Array.from({ length: 10 }, (_, index) => ({
  _id: objectId(61, index),
  name: pick(['Tiger Prawns', 'Fresh Lime', 'Guest Towels', 'Coffee Beans', 'Detergent'], index) + ` ${index + 1}`,
  category: pick(inventoryCategories, index),
  quantity: 20 + index * 12,
  unit: pick(['kg', 'pcs', 'litres', 'packs'], index),
  minimumLevel: 10 + index,
  maximumLevel: 60 + index * 10,
  unitCost: 120 + index * 180,
  supplier: sampleSuppliers[index]._id,
  location: pick(['Freezer A', 'Bar Store', 'Laundry Store', 'Main Store'], index),
  expiryDate: index % 3 === 0 ? isoDaysFromNow(10 + index) : undefined,
  lastRestocked: isoDaysAgo(1 + index),
  createdAt: isoDaysAgo(90 - index * 4),
  updatedAt: isoDaysAgo(index % 6),
}));

export const sampleInventoryTransactions = Array.from({ length: 10 }, (_, index) => ({
  _id: objectId(62, index),
  inventoryItem: sampleInventoryItems[index]._id,
  type: pick(inventoryTransactionTypes, index),
  quantity: 5 + index,
  unit: sampleInventoryItems[index].unit,
  reference: `INV-TXN-${String(index + 1).padStart(3, '0')}`,
  reason: pick(['Weekly restock', 'Kitchen issue', 'Manual adjustment', 'Damage write-off'], index),
  notes: `Transaction note ${index + 1}`,
  createdBy: sampleEmployeesPlaceholder(index),
  transactionDate: isoDaysAgo(12 - index),
  createdAt: isoDaysAgo(12 - index),
  updatedAt: isoDaysAgo(12 - index),
}));

function sampleEmployeesPlaceholder(index: number) {
  return objectId(7, index);
}

export const sampleEmployees = Array.from({ length: 10 }, (_, index) => ({
  _id: objectId(7, index),
  name: sriLankanNames[index],
  email: `employee${index + 1}@lexienthotel.com`,
  phone: `+94 7${(index % 8) + 1} ${String(5000000 + index * 8888).slice(0, 3)} ${String(5000000 + index * 8888).slice(3, 7)}`,
  department: pick(departments, index),
  position: pick(
    ['Manager', 'Supervisor', 'Executive', 'Chef', 'Technician', 'Officer'],
    index
  ),
  joiningDate: isoDaysAgo(600 - index * 35),
  salary: 65000 + index * 14000,
  employmentType: pick(['full-time', 'part-time', 'contract'] as const, index),
  status: pick(employeeStatuses, index),
  address: `${10 + index} Palm Grove`,
  emergencyContact: {
    name: `${pick(['Nuwan', 'Sandya', 'Malsha', 'Sanjeewa', 'Kavindi'], index)} Contact`,
    phone: `+94 77 ${String(2000000 + index * 7777).slice(0, 3)} ${String(2000000 + index * 7777).slice(3, 7)}`,
    relation: pick(['Spouse', 'Sibling', 'Parent'], index),
  },
  bankDetails: {
    accountHolder: sriLankanNames[index],
    accountNumber: `${1122334400 + index}`,
    bankName: pick(['Commercial Bank', 'Sampath Bank', 'HNB', 'BOC'], index),
    ifscCode: `BANK${String(index + 1).padStart(3, '0')}`,
  },
  documents: {
    aadhar: '',
    pan: '',
    drivingLicense: `DL-${index + 1000}`,
  },
  createdAt: isoDaysAgo(600 - index * 35),
  updatedAt: isoDaysAgo(10 - (index % 5)),
}));

sampleInventoryTransactions.forEach((transaction, index) => {
  transaction.createdBy = sampleEmployees[index]._id;
});

export const sampleAttendance = Array.from({ length: 10 }, (_, index) => ({
  _id: objectId(71, index),
  employeeId: sampleEmployees[index]._id,
  attendanceDate: isoDaysAgo(index),
  checkInTime: index % 4 === 1 ? undefined : new Date(now.getTime() - index * day + (8 + (index % 2)) * 60 * 60 * 1000).toISOString(),
  checkOutTime: index % 4 === 1 ? undefined : new Date(now.getTime() - index * day + (17 + (index % 3)) * 60 * 60 * 1000).toISOString(),
  status: pick(attendanceStatuses, index),
  remarks: `Attendance remark ${index + 1}`,
  createdAt: isoDaysAgo(index),
}));

export const samplePayrolls = Array.from({ length: 10 }, (_, index) => {
  const payrollDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
  const basicSalary = sampleEmployees[index].salary;
  const allowances = 5000 + index * 1000;
  const deductions = 1500 + index * 700;
  return {
    _id: objectId(72, index),
    employeeId: sampleEmployees[index]._id,
    month: monthString(payrollDate),
    basicSalary,
    allowances,
    deductions,
    netSalary: basicSalary + allowances - deductions,
    status: pick(payrollStatuses, index),
    paymentDate: index % 3 === 0 ? isoDaysAgo(index + 2) : undefined,
    paymentMethod: pick(['bank_transfer', 'cash', 'cheque'] as const, index),
    remarks: `Payroll remark ${index + 1}`,
    createdAt: isoDaysAgo(index + 5),
  };
});

export const sampleIncome = Array.from({ length: 10 }, (_, index) => ({
  _id: objectId(8, index),
  source: pick(incomeSources, index),
  reference: `INC-${1000 + index}`,
  amount: 8500 + index * 22500,
  paymentMethod: pick(['cash', 'card', 'online', 'check'] as const, index),
  description: `Income entry ${index + 1}`,
  notes: `Income note ${index + 1}`,
  recordedBy: sampleEmployees[index]._id,
  recordedDate: isoDaysAgo(index + 1),
  createdAt: isoDaysAgo(index + 1),
  updatedAt: isoDaysAgo(index + 1),
}));

export const sampleExpenses = Array.from({ length: 10 }, (_, index) => ({
  _id: objectId(81, index),
  category: pick(expenseCategories, index),
  description: `Expense entry ${index + 1}`,
  amount: 5000 + index * 9300,
  paymentMethod: pick(['cash', 'card', 'check', 'bank_transfer'] as const, index),
  vendor: pick(['CEB', 'Water Board', 'Supplier A', 'Supplier B', 'Service Partner'], index),
  invoice: `EXP-${2000 + index}`,
  notes: `Expense note ${index + 1}`,
  attachments: [],
  approvedBy: index % 2 === 0 ? sampleEmployees[(index + 1) % sampleEmployees.length]._id : undefined,
  status: pick(expenseStatuses, index),
  dueDate: isoDaysFromNow(index + 1),
  paidDate: index % 3 === 0 ? isoDaysAgo(index) : undefined,
  createdBy: sampleEmployees[index]._id,
  createdAt: isoDaysAgo(index + 3),
  updatedAt: isoDaysAgo(index + 2),
}));

export const sampleWeddingHalls = Array.from({ length: 10 }, (_, index) => ({
  _id: objectId(9, index),
  name: `Wedding Hall ${index + 1}`,
  capacity: 120 + index * 30,
  area: 2500 + index * 320,
  basePrice: 125000 + index * 35000,
  amenities: ['Stage', 'Parking', pick(['LED Wall', 'Bridal Suite', 'Garden Access'], index)],
  images: [`/wedding/hall-${index + 1}.jpg`],
  description: `Elegant hall ${index + 1} for events and weddings.`,
  availability: pick(weddingAvailability, index),
  createdAt: isoDaysAgo(260 - index * 8),
  updatedAt: isoDaysAgo(index % 7),
}));

export const sampleWeddingEvents = Array.from({ length: 10 }, (_, index) => {
  const hall = sampleWeddingHalls[index];
  const totalPrice = hall.basePrice + index * 12000;
  const advancePayment = Math.round(totalPrice * 0.35);
  return {
    _id: objectId(91, index),
    hallId: hall._id,
    clientName: sriLankanNames[index],
    clientEmail: sampleCustomers[index].email,
    clientPhone: sampleCustomers[index].phone,
    eventDate: isoDaysFromNow(20 + index * 4),
    eventType: pick(weddingEventTypes, index),
    expectedGuests: Math.min(hall.capacity, 100 + index * 12),
    totalPrice,
    advancePayment,
    remainingPayment: totalPrice - advancePayment,
    status: pick(weddingEventStatuses, index),
    notes: `Wedding event note ${index + 1}`,
    requirements: ['Floral décor', 'Buffet setup'],
    contactPerson: `${sriLankanNames[index]} Coordinator`,
    createdAt: isoDaysAgo(30 - index),
    updatedAt: isoDaysAgo(10 - (index % 5)),
  };
});

export const sampleAnalyticsMetrics = analyticsMetricTypes.map((metric, index) => ({
  _id: objectId(95, index),
  date: isoDaysAgo(index),
  metric,
  value:
    metric === 'occupancy_rate'
      ? 62 + index * 2
      : metric === 'average_rating'
        ? 4.1 + index * 0.05
        : 10 + index * 15,
  breakdown: {
    byRoom: {
      Standard: 55 + index,
      Deluxe: 60 + index,
      Suite: 52 + index,
      Presidential: 40 + index,
    },
    byService: {
      hotel: 80000 + index * 12000,
      restaurant: 25000 + index * 5000,
      events: 40000 + index * 9000,
    },
    byPaymentMethod: {
      cash: 20000 + index * 2000,
      card: 45000 + index * 3000,
      online: 30000 + index * 4000,
    },
    byCustomerSegment: {
      vip: 2 + index,
      regular: 5 + index,
    },
  },
  createdAt: isoDaysAgo(index),
  updatedAt: isoDaysAgo(index),
}));

export const sampleReports = Array.from({ length: 10 }, (_, index) => ({
  _id: objectId(96, index),
  title: `Sample Report ${index + 1}`,
  type: pick(reportTypes, index),
  period: pick(reportPeriods, index),
  startDate: isoDaysAgo(30 + index * 3),
  endDate: isoDaysAgo(index),
  generatedBy: sampleEmployees[index]._id,
  data: {
    roomRevenue: 100000 + index * 15000,
    restaurantRevenue: 45000 + index * 6000,
    eventRevenue: 90000 + index * 14000,
  },
  summary: {
    totalRevenue: 235000 + index * 35000,
    totalBookings: 20 + index * 3,
    averageOccupancy: 60 + index * 2,
    averageBookingValue: 12000 + index * 500,
    customerSatisfaction: 4 + index * 0.05,
  },
  charts: [
    {
      type: 'bar',
      title: `Department Revenue ${index + 1}`,
      data: [
        { label: 'Rooms', value: 100000 + index * 15000 },
        { label: 'Restaurant', value: 45000 + index * 6000 },
        { label: 'Events', value: 90000 + index * 14000 },
      ],
    },
  ],
  filePath: `/reports/sample-report-${index + 1}.pdf`,
  shared: [],
  createdAt: isoDaysAgo(index + 1),
  updatedAt: isoDaysAgo(index + 1),
}));

export function withPopulatedRelations<T extends Record<string, any>>(
  items: T[],
  relations: Record<string, any[]>
) {
  return items.map((item) => ({
    ...item,
    ...Object.fromEntries(
      Object.entries(relations)
        .filter(([key]) => key in item)
        .map(([key, collection]) => {
          const value = item[key];
          if (Array.isArray(value)) {
            return [
              key,
              value.map((id) => collection.find((entry: any) => entry._id === id) ?? id),
            ];
          }
          return [key, collection.find((entry: any) => entry._id === value) ?? value];
        })
    ),
  }));
}
