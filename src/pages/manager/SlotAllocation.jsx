import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { ManagerContext } from '../../context/ManagerContext';
import { slotService } from '../../services/slotService';
import { bookingService } from '../../services/bookingService';
import { PageHeader } from '../../components/common/layout/PageHeader';
import { Card } from '../../components/common/cards/Card';
import { Button } from '../../components/common/buttons/Button';
import { Select } from '../../components/common/forms/Select';
import { Modal } from '../../components/common/modal/Modal';
import { StatusBadge } from '../../components/common/badge/StatusBadge';
import { FiSliders, FiZap, FiCheckCircle, FiClock, FiArrowRight, FiCheck, FiUser, FiPlay } from 'react-icons/fi';
import { toast } from 'react-toastify';


export const SlotAllocation = () => {
  const { slots, chargingSessions, bookings, waitingBookings, refreshManagerData, error } = useContext(ManagerContext);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [releasingSlotId, setReleasingSlotId] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const availableSlots = slots.filter((s) => s.isEnabled && s.slotStatus === 'Available');
  const occupiedSlots = slots.filter((s) => s.isEnabled && s.slotStatus === 'Occupied');
  const confirmedBookings = bookings.filter((b) => b.bookingStatus === 'Confirmed');
  const allocatedSlotIds = new Set(confirmedBookings.map((booking) => booking.allocatedSlotId).filter(Boolean));
  const unassignedConfirmedBookings = confirmedBookings.filter((booking) =>
    !booking.allocatedSlotId &&
    !chargingSessions.some((session) => session.bookingId === booking._id && session.sessionStatus === 'Charging')
  );
  const unallocatedAvailableSlots = availableSlots.filter((slot) => !allocatedSlotIds.has(slot._id));
  const reservedConfirmedSlots = unallocatedAvailableSlots.slice(0, unassignedConfirmedBookings.length);
  const slotsForWaitingBookings = unallocatedAvailableSlots.slice(reservedConfirmedSlots.length);

  const handleOpenAssignModal = (slot = null, waitingBk = null) => {
    const defaultBk = waitingBk || waitingBookings[0];

    reset({
      slotId: slot?._id || slotsForWaitingBookings[0]?._id || '',
      bookingId: defaultBk?._id || '',
    });
    setIsAssignModalOpen(true);
  };

  const onAllocateSubmit = async (data) => {
    setLoadingAction(true);
    try {
      if (!data.bookingId) throw new Error('Select a waiting booking to allocate.');
      await bookingService.allocateSlotToWaitingVehicle(data.bookingId, data.slotId);
      await refreshManagerData();
      toast.success('Waiting vehicle allocated. The session can now be started from its slot.');
      setIsAssignModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to allocate slot.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleStartCharging = async (bookingId, slotId) => {
    setLoadingAction(true);
    try {
      await bookingService.startChargingSession(bookingId, slotId);
      await refreshManagerData();
      toast.success('Charging session started.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start charging session.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReleaseSlot = async (slotId) => {
    const session = chargingSessions.find((item) =>
      item.slotId === slotId && item.sessionStatus === 'Charging'
    );
    if (!session) {
      toast.error('No active charging session was found for this slot.');
      return;
    }
    setReleasingSlotId(slotId);
    try {
      await bookingService.completeChargingSession(session.sessionId);
      await refreshManagerData();
      toast.success('Charging session completed and slot released.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete charging session.');
    } finally {
      setReleasingSlotId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Slot Allocation & Queue Dispatch"
        description="Allocate open slots to waiting queue vehicles (Confirmed) and initiate live charging sessions (Charging)"
        actions={
          <Button
            variant="primary"
            icon={FiSliders}
            onClick={() => handleOpenAssignModal()}
            isDisabled={slotsForWaitingBookings.length === 0 || waitingBookings.length === 0}
          >
            Allocate Slot to Vehicle
          </Button>
        }
      />

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Allocation Overview Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="flex items-center gap-4 bg-emerald-50/60 border-emerald-200">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xl shadow-md shadow-emerald-600/20">
            <FiCheckCircle />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-800 uppercase">Available Ports</p>
            <p className="text-2xl font-extrabold text-slate-900">{availableSlots.length} Open Slots</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-blue-50/60 border-blue-200">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-xl shadow-md shadow-blue-600/20">
            <FiZap />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-800 uppercase">Occupied Ports</p>
            <p className="text-2xl font-extrabold text-slate-900">{occupiedSlots.length} Active Charges</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-amber-50/60 border-amber-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-bold flex items-center justify-center text-xl shadow-md shadow-amber-500/20">
            <FiClock />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-800 uppercase">Queue Waiting</p>
            <p className="text-2xl font-extrabold text-slate-900">{waitingBookings.length} Vehicles</p>
          </div>
        </Card>
      </div>

      {/* Waiting Vehicles Queue Section */}
      {waitingBookings.length > 0 && (
        <Card className="border-2 border-amber-200 bg-amber-50/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center text-sm">
                <FiClock />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Waiting Vehicles Queue</h3>
                <p className="text-xs text-slate-500">Arriving vehicles awaiting slot allocation ({waitingBookings.length} waiting)</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              Queue Total: {waitingBookings.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {waitingBookings.map((b, idx) => (
              <div key={b._id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300">
                    Queue #{b.queuePosition || idx + 1}
                  </span>
                  <StatusBadge status="Waiting" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 font-mono text-sm">{b.vehicleNumber}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <FiUser className="text-slate-400" /> {b.customerName || 'Customer'} • {b.vehicleModel}
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  icon={FiSliders}
                  isDisabled={availableSlots.length === 0}
                  onClick={() => handleOpenAssignModal(null, b)}
                >
                  Allocate Slot (Confirmed)
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Interactive Slot Grid for Allocation */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Interactive Station Slots</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {slots.map((slot) => {
            const isAvailable = slot.isEnabled && slot.slotStatus === 'Available';
            const isOccupied = slot.isEnabled && slot.slotStatus === 'Occupied';
            const isMaintenance = slot.isEnabled && slot.slotStatus === 'Maintenance';
            const isOutOfService = !slot.isEnabled || slot.slotStatus === 'Out of Service';

            const matchingConfirmed = confirmedBookings.find((b) => b.allocatedSlotId === slot._id);
            const openSlotIndex = unallocatedAvailableSlots.findIndex((availableSlot) => availableSlot._id === slot._id);
            const unassignedConfirmed = !matchingConfirmed && openSlotIndex >= 0
              ? unassignedConfirmedBookings[openSlotIndex]
              : null;
            const confirmedBooking = matchingConfirmed || unassignedConfirmed;
            const activeSession = chargingSessions.find((session) =>
              session.slotId === slot._id && session.sessionStatus === 'Charging'
            );

            return (
              <Card
                key={slot._id}
                className={`flex flex-col justify-between border-2 transition-all ${
                  isAvailable
                    ? 'border-emerald-200 bg-white hover:border-emerald-400'
                    : isOccupied
                    ? 'border-blue-200 bg-blue-50/30'
                    : isMaintenance
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-rose-200 bg-rose-50/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                      <FiZap className={isAvailable ? 'text-emerald-500' : isOccupied ? 'text-blue-600' : isMaintenance ? 'text-amber-500' : 'text-rose-600'} />
                      {slot.slotNumber}
                    </span>
                    <StatusBadge status={!slot.isEnabled ? 'Disabled' : slot.slotStatus || 'Unknown'} />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1 my-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Charging Speed:</span>
                      <strong className="text-slate-800">{slot.chargingSpeed === 'Fast' ? '50 kW Fast DC' : '11 kW Normal AC'}</strong>
                    </div>
                    {activeSession && (
                      <div className="flex justify-between text-blue-600 font-semibold">
                        <span>Current Session:</span>
                        <span>{activeSession.vehicleNumber} (In Progress)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-2 space-y-2">
                  {isAvailable && confirmedBooking ? (
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      icon={FiPlay}
                      isLoading={loadingAction}
                      onClick={() => handleStartCharging(confirmedBooking._id, slot._id)}
                    >
                      Start Charging
                    </Button>
                  ) : isAvailable && slotsForWaitingBookings.some((availableSlot) => availableSlot._id === slot._id) ? (
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      icon={FiSliders}
                      onClick={() => handleOpenAssignModal(slot)}
                      isDisabled={waitingBookings.length === 0}
                    >
                      {waitingBookings.length ? 'Allocate Waiting Vehicle' : 'Available for Booking'}
                    </Button>
                  ) : isOccupied && activeSession ? (
                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        fullWidth
                        icon={FiCheck}
                        isLoading={releasingSlotId === slot._id}
                        onClick={() => handleReleaseSlot(slot._id)}
                      >
                        Release Slot & Finish
                      </Button>
                    </div>
                  ) : isOutOfService ? (
                    <Button variant="ghost" size="sm" fullWidth isDisabled className="text-rose-600 font-bold">
                      {slot.isEnabled ? 'Slot Out of Service' : 'Slot Disabled'}
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" fullWidth isDisabled className="text-amber-600 font-semibold">
                      Slot Under Maintenance
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Assign / Allocate Vehicle Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Allocate Waiting Vehicle to Charging Slot"
      >
        <form onSubmit={handleSubmit(onAllocateSubmit)} className="space-y-4">
          {waitingBookings.length > 0 && (
            <Select
              label="Select Waiting Queue Vehicle"
              options={[
                { label: '-- Select from Waiting Queue --', value: '' },
                ...waitingBookings.map((w) => ({
                  label: `Queue #${w.queuePosition || 1}: ${w.vehicleNumber} (${w.customerName})`,
                  value: w._id,
                })),
              ]}
              {...register('bookingId')}
            />
          )}

          <Select
            label="Select Available Charging Slot"
            options={slotsForWaitingBookings.map((s) => ({
              label: `${s.slotNumber} (${s.chargingSpeed} kW Fast DC)`,
              value: s._id,
            }))}
            error={errors.slotId?.message}
            {...register('slotId', { required: 'Please select an available slot' })}
          />

          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold">Lifecycle State Transition Rule:</p>
            <p>1. Allocation sets booking status to <strong>Confirmed</strong> and removes vehicle from Waiting Queue.</p>
            <p>2. Status becomes <strong>Charging</strong> only when session is explicitly started.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loadingAction}>
              Confirm Allocation (Status: Confirmed)
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
