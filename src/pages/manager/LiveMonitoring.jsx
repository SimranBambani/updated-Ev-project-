import React, { useState, useContext, useMemo } from 'react';
import { ManagerContext } from '../../context/ManagerContext';
import { PageHeader } from '../../components/common/layout/PageHeader';
import { Card } from '../../components/common/cards/Card';
import { Button } from '../../components/common/buttons/Button';
import { DataTable } from '../../components/common/tables/DataTable';
import { StatusBadge } from '../../components/common/badge/StatusBadge';
import { calculateChargingTime } from '../../utils/estimationEngine';
import { slotService } from '../../services/slotService';
import { ConfirmationModal } from '../../components/common/modal/ConfirmationModal';
import { FiActivity, FiZap, FiClock, FiTruck, FiUser, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-toastify';

export const LiveMonitoring = () => {
  const { chargingSessions, refreshManagerData, loading, error } = useContext(ManagerContext);
  const [refreshing, setRefreshing] = useState(false);
  const [stoppingSession, setStoppingSession] = useState(null);
  const [stopping, setStopping] = useState(false);

  const activeSessions = useMemo(
    () => chargingSessions.filter(
      (s) => s.sessionStatus === 'Charging' && s.slotEnabled && s.slotStatus === 'Occupied'
    ),
    [chargingSessions]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const refreshed = await refreshManagerData();
      if (refreshed) toast.success('Station telemetry refreshed.');
      else toast.error('Unable to refresh station telemetry.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleEmergencyStop = async () => {
    if (!stoppingSession) return;
    setStopping(true);
    try {
      const result = await slotService.emergencyStopSession(stoppingSession._id);
      await refreshManagerData();
      toast.info(result.message);
      setStoppingSession(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Emergency stop request failed.');
    } finally {
      setStopping(false);
    }
  };

  const currentlyChargingData = activeSessions;

  // Columns for Currently Charging Table required by Station Manager
  const columns = useMemo(
    () => [
      {
        header: 'Vehicle Number',
        accessor: 'vehicleNumber',
        render: (row) => (
          <span className="font-bold text-slate-900 font-mono text-xs flex items-center gap-1.5">
            <FiTruck className="text-slate-400" /> {row.vehicleNumber}
          </span>
        ),
      },
      {
        header: 'Customer Name',
        accessor: 'customerName',
        render: (row) => (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">
              <FiUser />
            </div>
            <span className="font-semibold text-slate-900 text-xs">{row.customerName}</span>
          </div>
        ),
      },
      {
        header: 'Slot Number',
        accessor: 'slotNumber',
        render: (row) => (
          <span className="font-extrabold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            {row.slotNumber}
          </span>
        ),
      },
      {
        header: 'Battery Percentage',
        accessor: 'batteryPercentage',
        render: (row) => (
          <div className="w-28">
            <span className="text-xs font-bold text-primary-600 mb-0.5 block">{row.batteryPercentage}%</span>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${row.batteryPercentage}%` }}
              />
            </div>
          </div>
        ),
      },
      {
        header: 'Charging Progress',
        accessor: 'chargingProgress',
        render: (row) => (
          <span className="font-bold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            {row.chargingProgress}% Done
          </span>
        ),
      },
      {
        header: 'Estimated Finish Time',
        accessor: 'estimatedFinishTime',
        render: (row) => (
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <FiClock className="text-amber-500" /> {row.estimatedFinishTime}
          </span>
        ),
      },
      {
        header: 'Charging Status',
        accessor: 'chargingStatus',
        render: (row) => <StatusBadge status={row.chargingStatus || 'Charging'} />,
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Charging Telemetry & Monitoring"
        description="Software-estimated battery progress and completion times from active charging sessions"
        actions={
          <Button
            variant="outline"
            icon={FiRefreshCw}
            isLoading={refreshing}
            onClick={handleRefresh}
          >
            Refresh Telemetry
          </Button>
        }
      />

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Currently Charging Table Required Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FiZap className="text-emerald-500" /> Currently Charging Vehicles Table
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Active Ports: <strong className="text-slate-900">{currentlyChargingData.length}</strong>
          </span>
        </div>

        <DataTable
          columns={columns}
          data={currentlyChargingData}
          isLoading={loading}
          emptyTitle="No vehicles currently charging"
          emptyMessage="Active sessions on enabled, occupied slots will appear here."
        />
      </div>

      {/* Real-Time Telemetry Cards Grid */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80">
        <h3 className="text-base font-bold text-slate-900">Estimated Charging Telemetry (Software)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentlyChargingData.map((session) => {
            const batteryCapacity = session.batteryCapacity;
            const chargingSpeed = session.chargingSpeedKw;
            const { totalMinutes, energyNeededKWh, formattedTime } = calculateChargingTime(
              session.batteryPercentage,
              100,
              batteryCapacity,
              chargingSpeed
            );

            return (
              <Card key={session._id} hover className="border-2 border-slate-200">
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white font-bold flex items-center justify-center text-xl shadow-md shadow-primary-600/20 charging-pulse">
                      <FiZap />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{session.vehicleNumber}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <FiUser className="text-slate-400" /> {session.customerName}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={session.sessionStatus} />
                </div>

                {/* Driver & Slot Info */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs mb-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Assigned Slot</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <FiZap className="text-emerald-500" /> {session.slotNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Power Rate</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <FiZap className="text-amber-500" /> {chargingSpeed} kW estimated
                    </span>
                  </div>
                </div>

                {/* Animated Progress Bar */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">State of Charge (SoC)</span>
                    <span className="font-extrabold text-primary-600 text-sm">{session.batteryPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-700 shadow-sm"
                      style={{ width: `${session.batteryPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Calculated Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-100 mb-4">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Energy Needed</span>
                    <strong className="text-slate-800">{energyNeededKWh} kWh</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Est. Remaining</span>
                    <strong className="text-primary-600">{formattedTime}</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Finish ETA</span>
                    <strong className="text-slate-800">{session.estimatedFinishTime}</strong>
                  </div>
                </div>

                {/* Terminate Action */}
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  icon={FiAlertTriangle}
                  onClick={() => setStoppingSession(session)}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Emergency Stop Session
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
      <ConfirmationModal
        isOpen={!!stoppingSession}
        onClose={() => setStoppingSession(null)}
        onConfirm={handleEmergencyStop}
        title="Emergency Stop Session"
        message={`Stop software session ${stoppingSession?._id}? This application does not control or verify physical charger power isolation.`}
        isLoading={stopping}
      />
    </div>
  );
};
