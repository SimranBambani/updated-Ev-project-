import {
  calculateChargingTime,
  calculateWaitingTime,
  calculateStationLoad,
  calculateRemainingTime,
  calculateEstimatedFinishTime,
} from '../utils/estimationEngine';

/**
 * Backend-ready Estimation Service exposing asynchronous mock API methods.
 * Backend developers can later swap internal mock calculations with API calls.
 */
export const estimationService = {
  getChargingEstimate: async (currentCharge, targetCharge, batteryCapacity, chargingSpeed) => {
    await new Promise((r) => setTimeout(r, 150));
    return calculateChargingTime(currentCharge, targetCharge, batteryCapacity, chargingSpeed);
  },

  getWaitingEstimate: async (queueDetails) => {
    await new Promise((r) => setTimeout(r, 150));
    return calculateWaitingTime(queueDetails);
  },

  getStationLoad: async (availableSlots, totalSlots) => {
    await new Promise((r) => setTimeout(r, 150));
    return calculateStationLoad(availableSlots, totalSlots);
  },

  getRemainingEstimate: async (currentCharge, targetCharge, batteryCapacity, chargingSpeed) => {
    await new Promise((r) => setTimeout(r, 150));
    return calculateRemainingTime(currentCharge, targetCharge, batteryCapacity, chargingSpeed);
  },

  getEstimatedFinishTime: async (currentCharge, targetCharge, batteryCapacity, chargingSpeed, startTime) => {
    await new Promise((r) => setTimeout(r, 150));
    return calculateEstimatedFinishTime(currentCharge, targetCharge, batteryCapacity, chargingSpeed, startTime);
  },
};
