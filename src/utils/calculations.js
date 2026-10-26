/**
 * Forwarding facade for backward compatibility.
 * All calculation logic is centralized in src/utils/estimationEngine.js
 */
export {
  calculateChargingTime,
  calculateWaitingTime,
  calculateRemainingTime,
  calculateQueuePosition,
  calculateEstimatedFinishTime,
  calculateStationLoad,
  calculateChargingProgress,
  formatDuration,
} from './estimationEngine';
