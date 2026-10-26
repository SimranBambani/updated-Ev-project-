import { useChargingEstimation } from './useChargingEstimation';

/**
 * Backward compatibility wrapper for useCalculations.
 * Redirects to central useChargingEstimation hook.
 */
export const useCalculations = (currentCharge, batteryCapacity, chargingSpeed, queueDetails) => {
  const est = useChargingEstimation({
    currentCharge,
    batteryCapacity,
    chargingSpeed,
    queueDetails,
  });

  return {
    ...est.chargingTime,
    ...est.waitingTime,
  };
};

export { useChargingEstimation };
