import { BOOKING_STATUS, SLOT_STATUS, SESSION_STATUS } from './constants';

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
};

export const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'Active':
    case SLOT_STATUS.AVAILABLE:
    case BOOKING_STATUS.COMPLETED:
    case SESSION_STATUS.COMPLETED:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    
    case BOOKING_STATUS.CHARGING:
    case SESSION_STATUS.IN_PROGRESS:
      return 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse';

    case BOOKING_STATUS.CONFIRMED:
    case SLOT_STATUS.RESERVED:
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';

    case BOOKING_STATUS.PENDING:
    case SLOT_STATUS.OCCUPIED:
      return 'bg-amber-50 text-amber-700 border-amber-200';

    case 'Maintenance':
    case 'Maintenance Required':
    case SLOT_STATUS.MAINTENANCE:
      return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';

    case 'Out of Service':
    case 'Offline':
      return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';

    case 'Low Health':
    case 'Degraded':
      return 'bg-red-50 text-red-700 border-red-200 font-semibold';

    case 'Heavy Queue':
      return 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse font-bold';

    case BOOKING_STATUS.CANCELLED:
    case 'Inactive':
      return 'bg-slate-100 text-slate-600 border-slate-200';

    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const getBatteryColor = (percentage) => {
  if (percentage <= 20) return 'text-rose-600 bg-rose-50';
  if (percentage <= 50) return 'text-amber-600 bg-amber-50';
  return 'text-emerald-600 bg-emerald-50';
};

/**
 * Centralized helper for single-source-of-truth booking and slot state derivation.
 * Prevents contradictory UI states (e.g. Booking Status = Charging + Slot = Waiting in Queue).
 */
export const getBookingDisplayState = (booking = {}, session = null, slot = null) => {
  const rawStatus = (booking.bookingStatus || booking.chargingStatus || 'Waiting').trim();
  const sessionStatus = session?.sessionStatus;

  // 1. WAITING
  if (rawStatus === 'Waiting' || rawStatus === 'Pending' || (!booking.allocatedSlotId && rawStatus !== 'Completed' && rawStatus !== 'Cancelled' && rawStatus !== 'Confirmed' && rawStatus !== 'Charging')) {
    return {
      bookingStatus: 'Waiting',
      slotStatus: 'Unallocated',
      allocatedSlot: 'Waiting in Queue',
      chargingStatus: 'Waiting',
      queueStatus: booking.queuePosition ? `#${booking.queuePosition} in Queue` : 'Waiting in Queue',
    };
  }

  // 2. CONFIRMED / ALLOCATED (Slot assigned, session not yet active)
  if (rawStatus === 'Confirmed' && (!session || sessionStatus !== 'In Progress')) {
    const slotNum = booking.allocatedSlotNumber || slot?.slotNumber || 'Slot A-1';
    return {
      bookingStatus: 'Confirmed',
      slotStatus: 'Occupied',
      allocatedSlot: slotNum,
      chargingStatus: 'Confirmed',
      queueStatus: 'Allocated',
    };
  }

  // 3. CHARGING (Active Charging Session)
  if (rawStatus === 'Charging' || sessionStatus === 'In Progress') {
    const slotNum = booking.allocatedSlotNumber || session?.slotNumber || slot?.slotNumber || 'Slot A-1';
    return {
      bookingStatus: 'Charging',
      slotStatus: 'Occupied',
      allocatedSlot: slotNum,
      chargingStatus: 'Charging',
      queueStatus: 'Charging',
    };
  }

  // 4. COMPLETED
  if (rawStatus === 'Completed' || sessionStatus === 'Completed') {
    const slotNum = booking.allocatedSlotNumber ? `${booking.allocatedSlotNumber} (Released)` : 'Released';
    return {
      bookingStatus: 'Completed',
      slotStatus: 'Available',
      allocatedSlot: slotNum,
      chargingStatus: 'Completed',
      queueStatus: 'Completed',
    };
  }

  // 5. CANCELLED
  if (rawStatus === 'Cancelled') {
    return {
      bookingStatus: 'Cancelled',
      slotStatus: 'Available',
      allocatedSlot: 'No Active Slot',
      chargingStatus: 'Cancelled',
      queueStatus: 'Cancelled',
    };
  }

  // Fallback default
  return {
    bookingStatus: rawStatus,
    slotStatus: 'Available',
    allocatedSlot: booking.allocatedSlotNumber || 'Slot A-1',
    chargingStatus: rawStatus,
    queueStatus: 'N/A',
  };
};

