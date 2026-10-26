import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CustomerContext } from '../../context/CustomerContext';
import { AuthContext } from '../../context/AuthContext';
import { bookingService } from '../../services/bookingService';
import { PageHeader } from '../../components/common/layout/PageHeader';
import { Card } from '../../components/common/cards/Card';
import { DataTable } from '../../components/common/tables/DataTable';
import { Button } from '../../components/common/buttons/Button';
import { Select } from '../../components/common/forms/Select';
import { Input } from '../../components/common/forms/Input';
import { Modal } from '../../components/common/modal/Modal';
import { ConfirmationModal } from '../../components/common/modal/ConfirmationModal';
import { StatusBadge } from '../../components/common/badge/StatusBadge';
import { formatDuration } from '../../utils/estimationEngine';
import { useChargingEstimation } from '../../hooks/useChargingEstimation';
import { formatDateTime } from '../../utils/helpers';
import {
  FiCalendar,
  FiZap,
  FiClock,
  FiTruck,
  FiMapPin,
  FiXCircle,
  FiInfo,
  FiBatteryCharging,
  FiCheckCircle,
} from 'react-icons/fi';
import { toast } from 'react-toastify';

export const Bookings = () => {
  const { user } = useContext(AuthContext);
  const { bookings, vehicles, stations, refreshCustomerData, loading } = useContext(CustomerContext);
  const location = useLocation();
  const preselectedStation = location.state?.preselectedStation;

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Only active (enabled) vehicles can be selected for booking
  const activeVehicles = useMemo(() => (vehicles || []).filter((v) => v.isActive !== false), [vehicles]);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      vehicleId: '',
      stationId: '',
      customBatteryPct: '',
      preferredSpeed: 'Fast',
    },
  });

  const selectedVehicleId = watch('vehicleId');
  const selectedStationId = watch('stationId');
  const watchBatteryPct = watch('customBatteryPct');

  const selectedVehicle = useMemo(
    () => activeVehicles.find((v) => String(v._id) === String(selectedVehicleId)),
    [activeVehicles, selectedVehicleId]
  );

  const selectedStn = useMemo(
    () => stations.find((s) => String(s._id) === String(selectedStationId)),
    [stations, selectedStationId]
  );

  // When a vehicle is selected, pre-fill battery percentage with its saved charge
  useEffect(() => {
    if (selectedVehicle && selectedVehicle.currentCharge !== undefined) {
      setValue('customBatteryPct', String(selectedVehicle.currentCharge));
    }
  }, [selectedVehicle, setValue]);

  const effectiveBatteryPct = useMemo(() => {
    if (watchBatteryPct !== undefined && watchBatteryPct !== '') {
      return Math.min(100, Math.max(0, parseFloat(watchBatteryPct) || 0));
    }
    return selectedVehicle?.currentCharge || 0;
  }, [watchBatteryPct, selectedVehicle]);

  const chargingSpeed = 50;

  const { chargingTime: chargingEst, waitingTime: waitingEst } = useChargingEstimation({
    currentCharge: effectiveBatteryPct,
    batteryCapacity: selectedVehicle?.batteryCapacity || 60,
    chargingSpeed,
    queueDetails: {
      totalSlots: selectedStn?.totalSlots || 8,
      availableSlots: selectedStn?.availableSlots ?? 2,
      vehiclesCharging: (selectedStn?.totalSlots || 8) - (selectedStn?.availableSlots ?? 2),
      vehiclesWaiting: (selectedStn?.availableSlots ?? 1) === 0 ? 2 : 0,
    },
  });

  // Open booking modal — all dropdowns start blank (no auto-selection)
  const handleOpenBookModal = useCallback(() => {
    reset({
      vehicleId: '',
      stationId: '',
      customBatteryPct: '',
      preferredSpeed: 'Fast',
    });
    setIsBookModalOpen(true);
  }, [reset]);

  // If a station was pre-selected from the dashboard, open modal with station pre-filled only
  useEffect(() => {
    if (preselectedStation) {
      reset({
        stationId: String(preselectedStation._id),
        vehicleId: '',
        customBatteryPct: '',
        preferredSpeed: 'Fast',
      });
      setIsBookModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedStation]);

  const onBookSubmit = async (data) => {
    if (!data.vehicleId) {
      toast.error('Please select a vehicle.');
      return;
    }
    if (!data.stationId) {
      toast.error('Please select a charging station.');
      return;
    }

    setLoadingAction(true);
    try {
      const booking = await bookingService.create({
        vehicleId: data.vehicleId,
        stationId: data.stationId,
        preferredSpeed: data.preferredSpeed || 'Fast',
      });

      if (booking?.booking_status === 'Confirmed') {
        toast.success('Slot booked and confirmed! Slot has been allocated.');
      } else {
        toast.info('Booking placed. You have been added to the waiting queue.');
      }

      await refreshCustomerData();
      setIsBookModalOpen(false);
    } catch (err) {
      const errMsg = err?.response?.data?.message || 'Failed to process booking. Please try again.';
      toast.error(errMsg);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancelBooking = async () => {
    setLoadingAction(true);
    try {
      await bookingService.cancel(cancellingId);
      toast.info('Booking cancelled successfully. Slot availability has been updated.');
      await refreshCustomerData();
      setCancellingId(null);
    } catch (err) {
      const errMsg = err?.response?.data?.message || 'Failed to cancel booking.';
      toast.error(errMsg);
    } finally {
      setLoadingAction(false);
    }
  };

  // Active booking (one that is in progress) — for live status display
  const activeBooking = useMemo(
    () => bookings.find((b) => b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Waiting'),
    [bookings]
  );

  const columns = useMemo(
    () => [
      {
        header: 'Booking ID',
        accessor: '_id',
        render: (row) => (
          <span className="font-bold text-slate-900 font-mono text-xs">#{row._id}</span>
        ),
      },
      {
        header: 'Station Name',
        accessor: 'stationName',
        render: (row) => (
          <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
            <FiMapPin className="text-primary-600" /> {row.stationName || '—'}
          </span>
        ),
      },
      {
        header: 'Vehicle & Reg',
        accessor: 'vehicleModel',
        render: (row) => (
          <div>
            <p className="font-semibold text-slate-900 text-xs flex items-center gap-1">
              <FiTruck className="text-slate-400" /> {row.vehicleModel || '—'}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">{row.vehicleNumber || '—'}</p>
          </div>
        ),
      },
      {
        header: 'Est. Charging',
        accessor: 'estimatedChargingTime',
        render: (row) => (
          <span className="font-bold text-primary-600 text-xs flex items-center gap-1">
            <FiZap />
            {row.estimatedChargingTime ? formatDuration(row.estimatedChargingTime) : '—'}
          </span>
        ),
      },
      {
        header: 'Est. Wait',
        accessor: 'estimatedWaitingTime',
        render: (row) => (
          <span className="text-xs text-slate-600 flex items-center gap-1">
            <FiClock className="text-slate-400" />
            {row.estimatedWaitingTime ? `${row.estimatedWaitingTime} min` : '—'}
          </span>
        ),
      },
      {
        header: 'Booking Status',
        accessor: 'bookingStatus',
        render: (row) => <StatusBadge status={row.bookingStatus || 'Waiting'} />,
      },
      {
        header: 'Booked On',
        accessor: 'bookingTime',
        render: (row) => (
          <span className="text-xs text-slate-500">
            {row.bookingTime ? formatDateTime(row.bookingTime) : '—'}
          </span>
        ),
      },
      {
        header: 'Actions',
        accessor: '_id',
        className: 'text-right',
        render: (row) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setSelectedBookingDetails(row)}
              className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 transition text-xs font-semibold flex items-center gap-1"
              title="View Details"
            >
              <FiInfo className="text-sm" /> Details
            </button>
            {row.bookingStatus !== 'Cancelled' && row.bookingStatus !== 'Completed' && (
              <button
                onClick={() => setCancellingId(row._id)}
                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition text-xs font-semibold flex items-center gap-1"
              >
                <FiXCircle className="text-sm" /> Cancel
              </button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  // Station options for dropdown
  const stationOptions = useMemo(() => [
    { value: '', label: '— Select a Charging Station —' },
    ...stations.map((s) => ({
      label: `${s.stationName} (${s.availableSlots ?? 0}/${s.totalSlots ?? 0} Free)`,
      value: String(s._id),
    })),
  ], [stations]);

  // Vehicle options — only active vehicles selectable for booking
  const vehicleOptions = useMemo(() => [
    { value: '', label: '— Select Your Vehicle —' },
    ...activeVehicles.map((v) => ({
      label: `${v.vehicleModel} (${v.vehicleNumber}) — ${v.batteryCapacity} kWh`,
      value: String(v._id),
    })),
  ], [activeVehicles]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings & Live Charging Progress"
        description="Book a charging slot, view your reservations, and track booking status"
        actions={
          <Button variant="primary" icon={FiCalendar} onClick={handleOpenBookModal}>
            New Slot Reservation
          </Button>
        }
      />

      {/* Active Booking Status Card */}
      {activeBooking && (
        <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white border-none shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                    activeBooking.bookingStatus === 'Confirmed'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  <FiZap className={activeBooking.bookingStatus === 'Confirmed' ? 'animate-pulse' : ''} />
                  Status:{' '}
                  <strong>
                    {activeBooking.bookingStatus === 'Confirmed' ? 'Slot Confirmed' : 'Waiting in Queue'}
                  </strong>
                </span>
                <span className="text-xs text-slate-400 font-mono">Booking #: {activeBooking._id}</span>
              </div>

              <h3 className="text-2xl font-extrabold text-white tracking-tight mt-1">
                {activeBooking.stationName}
              </h3>
              <div className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                  Vehicle: <strong className="text-white">{activeBooking.vehicleModel}</strong> (
                  {activeBooking.vehicleNumber})
                </span>
                <span>•</span>
                <span>
                  Est. Charging:{' '}
                  <strong className="text-emerald-400">
                    {activeBooking.estimatedChargingTime
                      ? formatDuration(activeBooking.estimatedChargingTime)
                      : 'Calculating...'}
                  </strong>
                </span>
                {activeBooking.estimatedWaitingTime > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      Est. Wait:{' '}
                      <strong className="text-amber-300">{activeBooking.estimatedWaitingTime} min</strong>
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 min-w-[220px]">
              <div className="flex items-center gap-2 mb-3">
                <FiBatteryCharging className="text-emerald-400 text-xl" />
                <span className="text-sm font-bold text-white">Booking Summary</span>
              </div>
              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <strong className={activeBooking.bookingStatus === 'Confirmed' ? 'text-emerald-400' : 'text-amber-300'}>
                    {activeBooking.bookingStatus}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Slot Allocation:</span>
                  <strong className="text-white">{activeBooking.allocatedSlotNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Battery Model:</span>
                  <strong className="text-slate-300">{activeBooking.batteryModel || '—'}</strong>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Bookings Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Your Booking Reservations</h3>
        {bookings.length === 0 && !loading ? (
          <Card className="py-10 text-center text-slate-500 text-sm">
            <FiCalendar className="mx-auto text-3xl mb-2 text-slate-300" />
            <p className="font-semibold">No bookings yet.</p>
            <p className="text-xs mt-1">Click "New Slot Reservation" to book your first charging slot.</p>
          </Card>
        ) : (
          <DataTable columns={columns} data={bookings} isLoading={loading} />
        )}
      </div>

      {/* Reserve Slot Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Reserve Charging Slot"
      >
        <form onSubmit={handleSubmit(onBookSubmit)} className="space-y-4">
          {activeVehicles.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
              <strong>No active vehicles available.</strong> Please go to My Garage and add or enable a vehicle before booking.
            </div>
          ) : null}

          <Select
            label="Select Your EV Vehicle *"
            options={vehicleOptions}
            placeholder={null}
            error={errors.vehicleId?.message}
            {...register('vehicleId', { required: 'Please select a vehicle' })}
          />

          <Select
            label="Select Charging Station *"
            options={stationOptions}
            placeholder={null}
            error={errors.stationId?.message}
            {...register('stationId', { required: 'Please select a station' })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Current Battery Charge (%)"
              type="number"
              min="0"
              max="99"
              placeholder="Enter current battery %"
              {...register('customBatteryPct')}
            />
            <Select
              label="Preferred Charging Speed"
              options={[
                { value: 'Fast', label: 'Fast (DC - 50 kW)' },
                { value: 'Normal', label: 'Normal (AC - 11 kW)' },
              ]}
              placeholder={null}
              {...register('preferredSpeed')}
            />
          </div>

          {/* Estimation Engine Panel */}
          {selectedVehicle && selectedStn && (
            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h5 className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <FiZap className="text-emerald-400" /> Estimation Engine
                </h5>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Live Calculated</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Battery SoC</span>
                  <strong className="text-white text-sm">{effectiveBatteryPct}%</strong>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Capacity</span>
                  <strong className="text-white text-sm">{selectedVehicle?.batteryCapacity || '—'} kWh</strong>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Charger Speed</span>
                  <strong className="text-emerald-400 text-sm">{chargingSpeed} kW DC</strong>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Slots Free</span>
                  <strong className="text-primary-400 text-sm">
                    {selectedStn?.availableSlots ?? 0} / {selectedStn?.totalSlots ?? 0}
                  </strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Est. Charging Time:</span>
                  <strong className="text-emerald-300 font-extrabold text-sm">
                    {chargingEst.formattedTime} ({chargingEst.energyNeededKWh} kWh)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Est. Queue Wait:</span>
                  <strong className="text-amber-300 font-extrabold text-sm">
                    {waitingEst.formattedWaiting}
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsBookModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loadingAction}
              disabled={activeVehicles.length === 0}
              icon={FiCheckCircle}
            >
              Confirm Reservation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Booking Details Modal */}
      {selectedBookingDetails && (
        <Modal
          isOpen={!!selectedBookingDetails}
          onClose={() => setSelectedBookingDetails(null)}
          title={`Booking Details — #${selectedBookingDetails._id}`}
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
              {[
                ['Booking ID', `#${selectedBookingDetails._id}`],
                ['Vehicle', selectedBookingDetails.vehicleModel],
                ['Reg Number', selectedBookingDetails.vehicleNumber],
                ['Station', selectedBookingDetails.stationName],
                ['Status', null, <StatusBadge status={selectedBookingDetails.bookingStatus || 'Waiting'} />],
                ['Slot', selectedBookingDetails.allocatedSlotNumber],
                ['Est. Charging', selectedBookingDetails.estimatedChargingTime ? formatDuration(selectedBookingDetails.estimatedChargingTime) : '—'],
                ['Est. Wait', selectedBookingDetails.estimatedWaitingTime ? `${selectedBookingDetails.estimatedWaitingTime} min` : '—'],
                ['Booked On', selectedBookingDetails.bookingTime ? formatDateTime(selectedBookingDetails.bookingTime) : '—'],
              ].map(([label, val, node], i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-slate-200/60 last:border-0">
                  <span className="text-slate-500 font-medium">{label}:</span>
                  {node || <strong className="text-slate-900 font-mono text-xs">{val}</strong>}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedBookingDetails(null)}>
                Close Details
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmationModal
        isOpen={!!cancellingId}
        onClose={() => setCancellingId(null)}
        onConfirm={handleCancelBooking}
        title="Cancel Slot Booking"
        message="Are you sure you want to cancel this charging reservation? If this booking was confirmed, the slot will be released back to availability."
        isLoading={loadingAction}
      />
    </div>
  );
};
