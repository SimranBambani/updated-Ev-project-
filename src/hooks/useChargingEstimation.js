import { useMemo } from 'react';
import {
  calculateChargingTime,
  calculateWaitingTime,
  calculateRemainingTime,
  calculateQueuePosition,
  calculateEstimatedFinishTime,
  calculateStationLoad,
  calculateChargingProgress,
} from '../utils/estimationEngine';

/**
 * Reusable hook exposing all central estimation engine metrics to any module.
 */
export const useChargingEstimation = ({
  currentCharge = 20,
  targetCharge = 100,
  initialCharge = 20,
  batteryCapacity = 60,
  chargingSpeed = 50,
  queueDetails = null,
  stationDetails = null,
  startTime = new Date(),
} = {}) => {
  const chargingTime = useMemo(() => {
    return calculateChargingTime(currentCharge, targetCharge, batteryCapacity, chargingSpeed);
  }, [currentCharge, targetCharge, batteryCapacity, chargingSpeed]);

  const waitingTime = useMemo(() => {
    return calculateWaitingTime(queueDetails || {});
  }, [queueDetails]);

  const remainingTime = useMemo(() => {
    return calculateRemainingTime(currentCharge, targetCharge, batteryCapacity, chargingSpeed);
  }, [currentCharge, targetCharge, batteryCapacity, chargingSpeed]);

  const estimatedFinishTime = useMemo(() => {
    return calculateEstimatedFinishTime(
      currentCharge,
      targetCharge,
      batteryCapacity,
      chargingSpeed,
      startTime
    );
  }, [currentCharge, targetCharge, batteryCapacity, chargingSpeed, startTime]);

  const queuePosition = useMemo(() => {
    if (!queueDetails) return { position: 0, label: 'Immediate Allocation' };
    return calculateQueuePosition(queueDetails.vehiclesWaiting, queueDetails.availableSlots);
  }, [queueDetails]);

  const stationLoad = useMemo(() => {
    if (!stationDetails) return { loadPercent: 0, loadStatus: 'Low', badgeColor: 'emerald' };
    return calculateStationLoad(stationDetails.availableSlots, stationDetails.totalSlots);
  }, [stationDetails]);

  const chargingProgress = useMemo(() => {
    return calculateChargingProgress(initialCharge, currentCharge, targetCharge);
  }, [initialCharge, currentCharge, targetCharge]);

  return {
    chargingTime,
    waitingTime,
    remainingTime,
    estimatedFinishTime,
    queuePosition,
    stationLoad,
    chargingProgress,
  };
};
