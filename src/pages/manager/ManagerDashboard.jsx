import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ManagerContext } from '../../context/ManagerContext';
import { PageHeader } from '../../components/common/layout/PageHeader';
import { StatsCard } from '../../components/common/cards/StatsCard';
import { Card } from '../../components/common/cards/Card';
import { DataTable } from '../../components/common/tables/DataTable';
import { StatusBadge } from '../../components/common/badge/StatusBadge';
import { Button } from '../../components/common/buttons/Button';
import { formatDuration } from '../../utils/calculations';
import {
  FiZap,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiSliders,
  FiActivity,
  FiPlus,
  FiTruck,
  FiUser,
  FiAlertTriangle,
} from 'react-icons/fi';

export const ManagerDashboard = () => {
  const { slots, chargingSessions, bookings, waitingBookings, loading, error, refreshManagerData } = useContext(ManagerContext);

  const activeBookingIds = new Set(chargingSessions
    .filter((session) => session.sessionStatus === 'Charging')
    .map((session) => session.bookingId));
  const allocatedSlotIds = new Set(bookings
    .filter((booking) => booking.bookingStatus === 'Confirmed')
    .map((booking) => booking.allocatedSlotId)
    .filter(Boolean));
  const unassignedConfirmedCount = bookings.filter((booking) =>
    booking.bookingStatus === 'Confirmed' &&
    !booking.allocatedSlotId &&
    !activeBookingIds.has(booking._id)
  ).length;
  const freeUnallocatedSlotsCount = slots.filter((slot) =>
    slot.isEnabled &&
    slot.slotStatus === 'Available' &&
    !allocatedSlotIds.has(slot._id)
  ).length;
  const availableSlotsCount = Math.max(0, freeUnallocatedSlotsCount - unassignedConfirmedCount);
  const occupiedSlotsCount = slots.filter((s) => s.isEnabled && s.slotStatus === 'Occupied').length;
  const maintenanceSlotsCount = slots.filter((s) => s.isEnabled && s.slotStatus === 'Maintenance').length;
  const outOfServiceSlotsCount = slots.filter((s) => s.isEnabled && s.slotStatus === 'Out of Service').length;
  const inProgressSessions = chargingSessions.filter(
    (s) => s.sessionStatus === 'Charging' && s.slotEnabled && s.slotStatus === 'Occupied'
  );

  const waitingVehiclesCount = waitingBookings.length;
  const isHeavyQueue = waitingVehiclesCount > availableSlotsCount && waitingVehiclesCount > 0;

  // Fully Populated Relational Columns for Currently Charging Table
  const columns = [
    {
      header: 'Vehicle Number',
      accessor: 'vehicleNumber',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">
            <FiTruck />
          </div>
          <div>
            <p className="font-bold text-slate-900 font-mono text-xs">
              {row.vehicleNumber || '—'}
            </p>
            <p className="text-[11px] text-slate-400">
              {row.vehicleModel || '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Customer Name',
      accessor: 'customerName',
      render: (row) => (
        <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px]">
            <FiUser />
          </div>
          {row.customerName || '—'}
        </span>
      ),
    },
    {
      header: 'Slot Number',
      accessor: 'slotNumber',
      render: (row) => (
        <span className="font-extrabold text-emerald-800 text-xs bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
          {row.slotNumber || '—'}
        </span>
      ),
    },
    {
      header: 'Current Battery %',
      accessor: 'batteryPercentage',
      render: (row) => (
        <span className="font-bold text-slate-700 text-xs bg-slate-50 px-2 py-1 rounded border border-slate-200">
          {row.batteryPercentage ?? row.currentBattery ?? '—'}{row.batteryPercentage == null && row.currentBattery == null ? '' : '% Current'}
        </span>
      ),
    },
    {
      header: 'Charging Progress',
      accessor: 'chargingProgress',
      render: (row) => {
        const pct = row.chargingProgress ?? 0;
        return (
          <div className="w-28">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-primary-600 font-mono">{pct}%</span>
              <span className="text-slate-400 text-[10px]">Target 100%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Est. Remaining Time',
      accessor: 'estimatedRemainingTime',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
          <FiClock className="text-amber-500" /> {row.estimatedRemainingTime || '—'}
        </span>
      ),
    },
    {
      header: 'Completion Time',
      accessor: 'estimatedFinishTime',
      render: (row) => (
        <span className="text-xs font-mono text-slate-600">
          {row.estimatedFinishTime || '—'}
        </span>
      ),
    },
    {
      header: 'Charging Status',
      accessor: 'chargingStatus',
      render: (row) => <StatusBadge status={row.chargingStatus || row.sessionStatus || 'Unknown'} />,
    },
  ];


  return (
    <div className="space-y-6">
      <PageHeader
        title="Station Operations Dashboard"
        description="Real-time hub monitoring, slot availability, and vehicle charging queue management"
        actions={
          <div className="flex items-center gap-3">
            <Link to="/manager/allocation">
              <Button variant="primary" size="sm" icon={FiSliders}>
                Allocate Vehicle Slot
              </Button>
            </Link>
            <Link to="/manager/slots">
              <Button variant="outline" size="sm" icon={FiPlus}>
                Add Slot
              </Button>
            </Link>
          </div>
        }
      />

      {error && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={refreshManagerData}>Retry</Button>
        </div>
      )}

      {/* Heavy Queue Alert Banner (When Waiting > Available Slots) */}
      {isHeavyQueue && (
        <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-xl shrink-0 shadow-md">
              <FiAlertTriangle />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-rose-900 uppercase tracking-wide">
                  Heavy Queue Alert Detected!
                </h4>
                <StatusBadge status="Heavy Queue" />
              </div>
              <p className="text-xs text-rose-700 mt-0.5 font-medium">
                Waiting vehicles (<strong>{waitingVehiclesCount}</strong>) exceed available charging slots (<strong>{availableSlotsCount}</strong>). High station congestion detected.
              </p>
            </div>
          </div>
          <Link to="/manager/allocation" className="shrink-0 self-end sm:self-center">
            <Button variant="primary" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white border-none shadow-sm">
              Manage Queue Now
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Charging Sessions"
          value={chargingSessions.length}
          subtitle="Sessions on record"
          icon={FiZap}
          color="primary"
        />
        <StatsCard
          title="Waiting Queue"
          value={`${waitingVehiclesCount} Vehicles`}
          subtitle="Next in line for slot"
          icon={FiClock}
          color={isHeavyQueue ? 'rose' : 'amber'}
        />
        <StatsCard
          title="Available Slots"
          value={availableSlotsCount}
          subtitle="Ready for immediate charge"
          icon={FiCheckCircle}
          color="emerald"
        />
        <StatsCard
          title="Occupied Slots"
          value={occupiedSlotsCount}
          subtitle="Currently dispensing power"
          icon={FiActivity}
          color="indigo"
        />
      </div>

      {/* Full-Width Station Slot Availability Breakdown (Quick Controls Removed) */}
      <Card className="w-full">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Station Slot Availability Breakdown</h3>
            <p className="text-xs text-slate-500">Live operational status across all charging ports</p>
          </div>
          <span className="text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
            Live inventory
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-2">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
            <p className="text-xs font-bold text-emerald-800 uppercase">Available</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{availableSlotsCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-center">
            <p className="text-xs font-bold text-blue-800 uppercase">Occupied</p>
            <p className="text-3xl font-extrabold text-blue-600 mt-1">{occupiedSlotsCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-center">
            <p className="text-xs font-bold text-amber-800 uppercase">Maintenance</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">{maintenanceSlotsCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-center">
            <p className="text-xs font-bold text-rose-800 uppercase">Out of Service</p>
            <p className="text-3xl font-extrabold text-rose-600 mt-1">{outOfServiceSlotsCount}</p>
          </div>
        </div>
      </Card>

      {/* Active Charging Vehicles Table (All 7 Columns Rendered) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Vehicles Currently Charging</h3>
            <p className="text-xs text-slate-500">Live monitoring of power output and remaining duration</p>
          </div>
          <Link to="/manager/monitoring">
            <Button variant="ghost" size="sm" icon={FiActivity}>
              View Full Monitoring
            </Button>
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={inProgressSessions.slice(0, 5)}
          isLoading={loading}
          itemsPerPage={5}
          emptyTitle="No vehicles currently charging"
          emptyMessage="Active sessions on enabled, occupied slots will appear here."
        />
      </div>
    </div>
  );
};
