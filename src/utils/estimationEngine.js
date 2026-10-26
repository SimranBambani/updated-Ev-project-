/**
 * Centralized Estimation Engine for EV Charging Network
 * Reusable functions for calculating charging time, waiting time, remaining time,
 * queue position, finish time, station load, and charging progress.
 */

/**
 * Calculate charging time based on current battery %, target %, battery capacity, and charging speed.
 * 
 * remainingPercent = targetCharge - currentCharge
 * energyNeededKWh = batteryCapacity * remainingPercent / 100
 * chargingTimeHours = energyNeededKWh / chargingSpeed
 */
export const calculateChargingTime = (
  currentCharge = 20,
  targetCharge = 100,
  batteryCapacity = 60,
  chargingSpeed = 50
) => {
  const parsedCurrent = Math.min(Math.max(parseFloat(currentCharge) || 0, 0), 100);
  const parsedTarget = Math.min(Math.max(parseFloat(targetCharge) || 100, parsedCurrent), 100);
  const parsedCapacity = Math.max(parseFloat(batteryCapacity) || 0, 1);
  const parsedSpeed = Math.max(parseFloat(chargingSpeed) || 0, 1);

  const remainingPercent = parsedTarget - parsedCurrent;
  const energyNeededKWh = (parsedCapacity * remainingPercent) / 100;
  const chargingTimeHours = energyNeededKWh / parsedSpeed;
  
  const totalMinutes = Math.round(chargingTimeHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    remainingPercent,
    energyNeededKWh: parseFloat(energyNeededKWh.toFixed(2)),
    chargingTimeHours: parseFloat(chargingTimeHours.toFixed(2)),
    totalMinutes,
    hours,
    minutes,
    formattedTime: formatDuration(totalMinutes),
  };
};

/**
 * Calculate estimated waiting time for a charging station queue
 */
export const calculateWaitingTime = ({
  totalSlots = 4,
  availableSlots = 1,
  vehiclesCharging = 3,
  vehiclesWaiting = 0,
  avgSessionMins = 40,
} = {}) => {
  const parsedTotal = Math.max(parseInt(totalSlots, 10) || 1, 1);
  const parsedAvailable = Math.max(parseInt(availableSlots, 10) || 0, 0);
  const parsedWaiting = Math.max(parseInt(vehiclesWaiting, 10) || 0, 0);
  const parsedAvgSession = Math.max(parseInt(avgSessionMins, 10) || 30, 1);

  // If there are available slots and no waiting queue, waiting time is 0
  if (parsedAvailable > 0 && parsedWaiting === 0) {
    return {
      waitingMinutes: 0,
      formattedWaiting: 'No Wait (Slots Available)',
    };
  }

  // Active slots processing rate
  const activeSlots = parsedTotal;
  const totalInQueue = parsedWaiting + (parsedAvailable === 0 ? 1 : 0);
  
  const estimatedMins = Math.round((totalInQueue / activeSlots) * parsedAvgSession);

  return {
    waitingMinutes: estimatedMins,
    formattedWaiting: formatDuration(estimatedMins),
  };
};

/**
 * Calculate remaining charging time from current charge to 100%
 */
export const calculateRemainingTime = (
  currentCharge = 0,
  targetCharge = 100,
  batteryCapacity = 60,
  chargingSpeed = 50
) => {
  const est = calculateChargingTime(currentCharge, targetCharge, batteryCapacity, chargingSpeed);
  return {
    remainingMinutes: est.totalMinutes,
    formattedRemaining: est.formattedTime,
  };
};

/**
 * Calculate queue position for a waiting customer
 */
export const calculateQueuePosition = (vehiclesWaiting = 0, availableSlots = 0) => {
  const waiting = Math.max(parseInt(vehiclesWaiting, 10) || 0, 0);
  const available = Math.max(parseInt(availableSlots, 10) || 0, 0);

  if (available > 0 && waiting === 0) {
    return { position: 0, label: 'Immediate Allocation' };
  }
  const pos = waiting + 1;
  return { position: pos, label: `#${pos} in Queue` };
};

/**
 * Calculate estimated finish Date / Time
 */
export const calculateEstimatedFinishTime = (
  currentCharge = 20,
  targetCharge = 100,
  batteryCapacity = 60,
  chargingSpeed = 50,
  startTime = new Date()
) => {
  const { totalMinutes } = calculateChargingTime(currentCharge, targetCharge, batteryCapacity, chargingSpeed);
  const start = startTime instanceof Date ? startTime : new Date(startTime || Date.now());
  const finishDate = new Date(start.getTime() + totalMinutes * 60000);

  const formattedFinishTime = finishDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    finishDate,
    formattedFinishTime,
    totalMinutes,
  };
};

/**
 * Calculate station load percentage & occupancy level
 */
export const calculateStationLoad = (availableSlots = 0, totalSlots = 8) => {
  const total = Math.max(parseInt(totalSlots, 10) || 1, 1);
  const available = Math.min(Math.max(parseInt(availableSlots, 10) || 0, 0), total);
  const occupied = total - available;

  const loadPercent = Math.round((occupied / total) * 100);

  let loadStatus = 'Low';
  let badgeColor = 'emerald';

  if (loadPercent >= 90) {
    loadStatus = 'Overloaded';
    badgeColor = 'rose';
  } else if (loadPercent >= 70) {
    loadStatus = 'Heavy';
    badgeColor = 'amber';
  } else if (loadPercent >= 40) {
    loadStatus = 'Moderate';
    badgeColor = 'indigo';
  }

  return {
    loadPercent,
    occupiedSlots: occupied,
    totalSlots: total,
    availableSlots: available,
    loadStatus,
    badgeColor,
  };
};

/**
 * Calculate charging percentage progress (0-100%)
 */
export const calculateChargingProgress = (
  initialCharge = 20,
  currentCharge = 50,
  targetCharge = 100
) => {
  const initial = Math.max(parseFloat(initialCharge) || 0, 0);
  const current = Math.min(Math.max(parseFloat(currentCharge) || 0, initial), 100);
  const target = Math.min(Math.max(parseFloat(targetCharge) || 100, current), 100);

  if (target === initial) return 100;
  const progressPct = Math.round(((current - initial) / (target - initial)) * 100);
  return Math.min(Math.max(progressPct, 0), 100);
};

/**
 * Helper to format total minutes into human readable string
 */
export const formatDuration = (totalMinutes) => {
  if (!totalMinutes || totalMinutes <= 0) return '0 mins';
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);

  if (hours === 0) return `${mins} min${mins !== 1 ? 's' : ''}`;
  if (mins === 0) return `${hours} hr${hours !== 1 ? 's' : ''}`;
  return `${hours} hr ${mins} min${mins !== 1 ? 's' : ''}`;
};
