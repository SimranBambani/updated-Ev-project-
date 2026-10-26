// Complete realistic mock data matching all Database Collections specified in requirements

export const mockUsers = Array.from({ length: 20 }, (_, index) => {
  const roles = ['Customer', 'Customer', 'Customer', 'Station Manager', 'Admin'];
  const role = roles[index % roles.length];
  const password = role === 'Station Manager' ? 'Manager@123' : role === 'Admin' ? 'Admin@123' : 'password123';
  return {
    _id: `usr_${100 + index}`,
    name: [
      'Alex Morgan', 'Sarah Jenkins', 'David Chen', 'Emily Watson', 'Michael Brown',
      'Priya Sharma', 'Rahul Verma', 'Jessica Taylor', 'James Wilson', 'Elena Rostova',
      'Marcus Vance', 'Anita Desai', 'Liam O\'Connor', 'Sophia Martinez', 'Kavita Patel',
      'Daniel Kim', 'Oliver Smith', 'Chloe Bennett', 'Vikram Singh', 'Admin User'
    ][index],
    email: `user${index + 1}@voltflow.io`,
    phone: `98765432${index < 10 ? '0' + index : index}`,
    password,
    role,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-08-01T14:30:00.000Z',
  };
});

export const mockCustomers = Array.from({ length: 15 }, (_, index) => ({
  _id: `cust_${200 + index}`,
  userId: `usr_${100 + index}`,
  address: `${12 + index * 4} Sector ${index + 1}, Cyber City, Tech Hub`,
  preferredStationId: `stn_${300 + (index % 5)}`,
}));

export const mockStationManagers = [
  { _id: 'mgr_1', userId: 'usr_103', stationId: 'stn_300', shift: 'Morning (06:00 - 14:00)', name: 'Emily Watson', email: 'user4@voltflow.io', phone: '9876543203' },
  { _id: 'mgr_2', userId: 'usr_108', stationId: 'stn_301', shift: 'Evening (14:00 - 22:00)', name: 'James Wilson', email: 'user9@voltflow.io', phone: '9876543208' },
  { _id: 'mgr_3', userId: 'usr_113', stationId: 'stn_302', shift: 'Night (22:00 - 06:00)', name: 'Sophia Martinez', email: 'user14@voltflow.io', phone: '9876543213' },
  { _id: 'mgr_4', userId: 'usr_117', stationId: 'stn_303', shift: 'Morning (06:00 - 14:00)', name: 'Chloe Bennett', email: 'user18@voltflow.io', phone: '9876543217' },
];

export const mockChargingStations = [
  {
    _id: 'stn_300',
    stationName: 'VoltFlow SuperHub CyberCity',
    address: 'DLF Cyber Hub, Phase 2',
    city: 'Gurugram',
    latitude: 28.4950,
    longitude: 77.0895,
    totalSlots: 8,
    availableSlots: 3,
    status: 'Active',
    pricingPerKWh: '$0.35',
    avgRating: 4.9,
  },
  {
    _id: 'stn_301',
    stationName: 'EcoCharge Central Mall',
    address: 'M.G. Road, Outer Ring',
    city: 'New Delhi',
    latitude: 28.6139,
    longitude: 77.2090,
    totalSlots: 6,
    availableSlots: 2,
    status: 'Active',
    pricingPerKWh: '$0.32',
    avgRating: 4.7,
  },
  {
    _id: 'stn_302',
    stationName: 'Apex PowerStation Connaught Place',
    address: 'Block C, Inner Circle',
    city: 'New Delhi',
    latitude: 28.6315,
    longitude: 77.2167,
    totalSlots: 10,
    availableSlots: 5,
    status: 'Active',
    pricingPerKWh: '$0.38',
    avgRating: 4.8,
  },
  {
    _id: 'stn_303',
    stationName: 'GreenGrid Tech Park Terminal',
    address: 'Electronic City Phase 1',
    city: 'Noida',
    latitude: 28.5355,
    longitude: 77.3910,
    totalSlots: 6,
    availableSlots: 0,
    status: 'Active',
    pricingPerKWh: '$0.30',
    avgRating: 4.6,
  },
  {
    _id: 'stn_304',
    stationName: 'IonMotion Express Plaza',
    address: 'Sector 62, Main Express Highway',
    city: 'Noida',
    latitude: 28.6280,
    longitude: 77.3649,
    totalSlots: 4,
    availableSlots: 1,
    status: 'Active',
    pricingPerKWh: '$0.33',
    avgRating: 4.5,
  },
  {
    _id: 'stn_305',
    stationName: 'VoltFlow Highway Oasis East',
    address: 'Grand Trunk Road Exit 14',
    city: 'Faridabad',
    latitude: 28.4089,
    longitude: 77.3178,
    totalSlots: 12,
    availableSlots: 8,
    status: 'Active',
    pricingPerKWh: '$0.28',
    avgRating: 4.9,
  },
  {
    _id: 'stn_306',
    stationName: 'UrbanGrid Mall Charging Zone',
    address: 'Saket District Centre',
    city: 'New Delhi',
    latitude: 28.5284,
    longitude: 77.2189,
    totalSlots: 8,
    availableSlots: 4,
    status: 'Active',
    pricingPerKWh: '$0.36',
    avgRating: 4.8,
  },
  {
    _id: 'stn_307',
    stationName: 'Nexus FastCharge Terminal',
    address: 'Aerocity Hospitality District',
    city: 'New Delhi',
    latitude: 28.5562,
    longitude: 77.1200,
    totalSlots: 14,
    availableSlots: 6,
    status: 'Active',
    pricingPerKWh: '$0.40',
    avgRating: 4.9,
  },
  {
    _id: 'stn_308',
    stationName: 'EcoVolt Business Hub',
    address: 'Golf Course Extension Road',
    city: 'Gurugram',
    latitude: 28.4190,
    longitude: 77.0980,
    totalSlots: 6,
    availableSlots: 2,
    status: 'Maintenance',
    pricingPerKWh: '$0.34',
    avgRating: 4.4,
  },
  {
    _id: 'stn_309',
    stationName: 'HyperDrive Station South',
    address: 'Greater Kailash Main Market',
    city: 'New Delhi',
    latitude: 28.5482,
    longitude: 77.2410,
    totalSlots: 8,
    availableSlots: 3,
    status: 'Active',
    pricingPerKWh: '$0.37',
    avgRating: 4.7,
  },
];

export const mockVehicles = Array.from({ length: 50 }, (_, idx) => {
  const models = [
    { model: 'Tesla Model 3', capacity: 75, type: '4 Wheeler (Sedan/SUV)' },
    { model: 'Tesla Model Y', capacity: 81, type: '4 Wheeler (Sedan/SUV)' },
    { model: 'Hyundai Ioniq 5', capacity: 77, type: '4 Wheeler (Sedan/SUV)' },
    { model: 'Kia EV6', capacity: 77, type: '4 Wheeler (Sedan/SUV)' },
    { model: 'BMW i4', capacity: 84, type: '4 Wheeler (Sedan/SUV)' },
    { model: 'Tata Nexon EV', capacity: 40.5, type: '4 Wheeler (Sedan/SUV)' },
    { model: 'MG ZS EV', capacity: 50.3, type: '4 Wheeler (Sedan/SUV)' },
    { model: 'Ather 450X', capacity: 3.7, type: '2 Wheeler' },
    { model: 'Ola S1 Pro', capacity: 4.0, type: '2 Wheeler' },
  ];
  const chosen = models[idx % models.length];
  return {
    _id: `veh_${400 + idx}`,
    customerId: `cust_${200 + (idx % 15)}`,
    vehicleNumber: `EV${10 + (idx % 90)}AB${1000 + idx}`,
    vehicleModel: chosen.model,
    batteryModel: `Li-Ion Gen${(idx % 3) + 4}`,
    batteryCapacity: chosen.capacity,
    currentCharge: Math.floor(15 + Math.random() * 70),
    vehicleType: chosen.type,
  };
});

export const mockChargingSlots = Array.from({ length: 30 }, (_, idx) => {
  const speeds = [22, 50, 150, 250];
  const statuses = ['Available', 'Occupied', 'Reserved', 'Maintenance'];
  const stnId = `stn_${300 + (idx % 5)}`;
  return {
    _id: `slot_${500 + idx}`,
    stationId: stnId,
    slotNumber: `Slot A-${(idx % 6) + 1}`,
    chargingSpeed: speeds[idx % speeds.length],
    slotStatus: statuses[idx % statuses.length],
  };
});

export const mockBookings = Array.from({ length: 40 }, (_, idx) => {
  let status = 'Confirmed';
  let allocatedSlotId = null;
  let allocatedSlotNumber = 'Waiting in Queue';
  let queuePosition = null;

  if (idx < 5) {
    status = 'Waiting';
    allocatedSlotId = null;
    allocatedSlotNumber = 'Waiting in Queue';
    queuePosition = idx + 1;
  } else if (idx < 15) {
    status = 'Charging';
    allocatedSlotId = `slot_${500 + (idx % 20)}`;
    allocatedSlotNumber = `Slot A-${(idx % 6) + 1}`;
  } else if (idx < 25) {
    status = 'Confirmed';
    allocatedSlotId = `slot_${500 + (idx % 20)}`;
    allocatedSlotNumber = `Slot A-${(idx % 6) + 1}`;
  } else if (idx < 35) {
    status = 'Completed';
    allocatedSlotId = null;
    allocatedSlotNumber = `Slot A-${(idx % 6) + 1} (Released)`;
  } else {
    status = 'Cancelled';
    allocatedSlotId = null;
    allocatedSlotNumber = 'No Active Slot';
  }

  return {
    _id: `bk_${600 + idx}`,
    customerId: `cust_${200 + (idx % 15)}`,
    vehicleId: `veh_${400 + idx}`,
    stationId: `stn_${300 + (idx % 5)}`,
    bookingTime: new Date(Date.now() - idx * 3600000).toISOString(),
    estimatedWaitingTime: status === 'Waiting' ? (idx + 1) * 10 : 0,
    estimatedChargingTime: 35 + (idx % 40),
    bookingStatus: status,
    chargingStatus: status === 'Charging' ? 'Charging' : status,
    allocatedSlotId,
    allocatedSlotNumber,
    queuePosition,
  };
});

export const mockChargingSessions = Array.from({ length: 30 }, (_, idx) => {
  const isChargingBooking = idx >= 5 && idx < 15;
  const sessionStatus = isChargingBooking ? 'In Progress' : (idx % 2 === 0 ? 'Completed' : 'In Progress');
  const initial = 15 + (idx % 20);
  const final = sessionStatus === 'Completed' ? 100 : Math.min(initial + 55, 95);
  return {
    _id: `sess_${700 + idx}`,
    bookingId: `bk_${600 + idx}`,
    slotId: `slot_${500 + (idx % 20)}`,
    startTime: new Date(Date.now() - (idx + 1) * 3600000).toISOString(),
    endTime: sessionStatus === 'Completed' ? new Date(Date.now() - idx * 1800000).toISOString() : null,
    initialBattery: initial,
    finalBattery: final,
    energyConsumed: (final - initial) * 0.6,
    duration: 45 + (idx % 30),
    sessionStatus,
  };
});

export const mockBatteryInventory = [
  { _id: 'bat_1', stationId: 'stn_300', batteryModel: 'UltraCell 75kWh Pack', capacity: 75, health: 'Low (48-59%)', status: 'Available' },
  { _id: 'bat_2', stationId: 'stn_300', batteryModel: 'ApexMax 50kWh Module', capacity: 50, health: 'Good (80-89%)', status: 'In Use' },
  { _id: 'bat_3', stationId: 'stn_301', batteryModel: 'VoltCell 40kWh Eco', capacity: 40, health: 'Excellent (90-100%)', status: 'Available' },
  { _id: 'bat_4', stationId: 'stn_300', batteryModel: 'PowerCore 80kWh Ultra', capacity: 80, health: 'Fair (70-79%)', status: 'Maintenance' },
  { _id: 'bat_5', stationId: 'stn_300', batteryModel: 'HyperVolt 100kWh Module', capacity: 100, health: 'Critical (< 45%)', status: 'Out of Service' },
  { _id: 'bat_6', stationId: 'stn_300', batteryModel: 'EcoCell 60kWh Standard', capacity: 60, health: 'Low (52%)', status: 'Maintenance' },
];

export const mockNotifications = [
  {
    _id: 'notif_mgr_1',
    customerId: 'cust_200',
    title: 'Heavy Queue Detected',
    message: 'Waiting vehicles (5) exceed available slots (2) at VoltFlow SuperHub. Immediate dispatch recommended.',
    notificationType: 'HEAVY_QUEUE_ALERT',
    priority: 'High',
    status: 'Unread',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    _id: 'notif_mgr_2',
    customerId: 'cust_201',
    title: 'Battery Health Low Alert',
    message: 'UltraCell 75kWh Pack (ID: bat_1) battery health degraded to Low (48%). Replacement required soon.',
    notificationType: 'BATTERY_HEALTH_LOW',
    priority: 'High',
    status: 'Unread',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    _id: 'notif_mgr_3',
    customerId: 'cust_202',
    title: 'Battery Requires Maintenance',
    message: 'PowerCore 80kWh Ultra (ID: bat_4) requires immediate cell thermal calibration & maintenance.',
    notificationType: 'BATTERY_MAINTENANCE_REQUIRED',
    priority: 'Medium',
    status: 'Unread',
    createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
  },
  {
    _id: 'notif_mgr_4',
    customerId: 'cust_203',
    title: 'Battery Out of Service',
    message: 'HyperVolt 100kWh Module (ID: bat_5) marked Out of Service due to severe voltage imbalance.',
    notificationType: 'BATTERY_OUT_OF_SERVICE',
    priority: 'High',
    status: 'Unread',
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
  },
  ...Array.from({ length: 46 }, (_, idx) => ({
    _id: `notif_${800 + idx}`,
    customerId: `cust_${200 + (idx % 15)}`,
    bookingId: `bk_${600 + (idx % 30)}`,
    title: [
      'Vehicle Fully Charged',
      'Slot Allocated',
      'Please Remove Vehicle',
      'Booking Confirmed',
      'Charging Session Started'
    ][idx % 5],
    message: [
      'Your vehicle has reached 100% state of charge. Please move it to free up the slot.',
      'Slot A-2 has been allocated for your upcoming booking at VoltFlow SuperHub.',
      'Grace period of 10 minutes ending. Overstay fees may apply.',
      'Your reservation for 14:00 today is confirmed.',
      'DC Fast Charging initialized successfully at 50 kW.'
    ][idx % 5],
    notificationType: ['CHARGING_COMPLETE', 'SLOT_ALLOCATED', 'VEHICLE_REMOVAL', 'BOOKING_CONFIRMED', 'CHARGING_STARTED'][idx % 5],
    priority: ['Low', 'Medium', 'Low', 'Low', 'Low'][idx % 5],
    status: idx % 3 === 0 ? 'Unread' : 'Read',
    createdAt: new Date(Date.now() - (idx + 3) * 1800000).toISOString(),
  })),
];
