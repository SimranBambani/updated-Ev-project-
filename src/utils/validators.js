export const emailValidation = {
  required: 'Gmail ID is required',
  pattern: {
    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: 'Please enter a valid Gmail ID',
  },
};

export const phoneValidation = {
  required: 'Phone number is required',
  pattern: {
    value: /^[0-9]{10}$/,
    message: 'Please enter a valid 10-digit phone number',
  },
};

export const vehicleNumberValidation = {
  required: 'Vehicle registration number is required',
  pattern: {
    value: /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/i,
    message: 'Format must match pattern e.g., MH12AB1234 or DL01EV9999',
  },
};

export const batteryPercentageValidation = {
  required: 'Current battery percentage is required',
  min: { value: 0, message: 'Percentage cannot be less than 0%' },
  max: { value: 100, message: 'Percentage cannot exceed 100%' },
};

export const batteryCapacityValidation = {
  required: 'Battery capacity is required',
  min: { value: 1, message: 'Capacity must be at least 1 kWh' },
  max: { value: 300, message: 'Capacity cannot exceed 300 kWh' },
};

export const passwordValidation = {
  required: 'Password is required',
  minLength: {
    value: 6,
    message: 'Password must be at least 6 characters long',
  },
};

/**
 * Centralized Station Slot validation.
 * Ensures:
 * - Total Slots > 0
 * - Available Slots >= 0
 * - Available Slots <= Total Slots (Total Slots >= Available Slots)
 */
export const validateStationSlots = (totalSlots, availableSlots) => {
  const total = Number(totalSlots);
  const available = Number(availableSlots);

  if (isNaN(total) || total <= 0) {
    return 'Total slots must be greater than 0.';
  }
  if (isNaN(available) || available < 0) {
    return 'Available slots cannot be negative.';
  }
  if (available > total) {
    return 'Available slots cannot be greater than total slots.';
  }
  return null;
};

