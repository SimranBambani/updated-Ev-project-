export const ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Station Manager',
  CUSTOMER: 'Customer',
};

export const STATION_STATUS = {
  ACTIVE: 'Active',
  MAINTENANCE: 'Maintenance',
  INACTIVE: 'Inactive',
};

export const SLOT_STATUS = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  MAINTENANCE: 'Maintenance',
};

export const BOOKING_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CHARGING: 'Charging',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const SESSION_STATUS = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  TERMINATED: 'Terminated',
};

export const VEHICLE_TYPES = {
  TWO_WHEELER: '2 Wheeler',
  FOUR_WHEELER: '4 Wheeler (Sedan/SUV)',
  COMMERCIAL: 'Commercial (Van/Bus)',
};

export const BATTERY_HEALTH = {
  EXCELLENT: 'Excellent (90-100%)',
  GOOD: 'Good (80-89%)',
  FAIR: 'Fair (70-79%)',
  REPLACEMENT_NEEDED: 'Needs Replacement (<70%)',
};

export const CHARGING_SPEEDS = [
  { value: 22, label: 'Standard AC - 22 kW' },
  { value: 50, label: 'Fast DC - 50 kW' },
  { value: 150, label: 'Ultra Fast DC - 150 kW' },
  { value: 250, label: 'Supercharger - 250 kW' },
];

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'voltflow_token',
  USER_INFO: 'voltflow_user',
  CUSTOM_STATIONS: 'voltflow_custom_stations',
  CUSTOM_MANAGERS: 'voltflow_custom_managers',
  CUSTOM_USERS: 'voltflow_custom_users',
};
