import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { ManagerContext } from '../../context/ManagerContext';
import { slotService } from '../../services/slotService';
import { PageHeader } from '../../components/common/layout/PageHeader';
import { Card } from '../../components/common/cards/Card';
import { DataTable } from '../../components/common/tables/DataTable';
import { SearchBar } from '../../components/common/forms/SearchBar';
import { Button } from '../../components/common/buttons/Button';
import { Input } from '../../components/common/forms/Input';
import { Select } from '../../components/common/forms/Select';
import { Modal } from '../../components/common/modal/Modal';
import { ConfirmationModal } from '../../components/common/modal/ConfirmationModal';
import { StatusBadge } from '../../components/common/badge/StatusBadge';
import { FiPlus, FiEdit2, FiToggleLeft, FiToggleRight, FiZap, FiGrid, FiList } from 'react-icons/fi';
import { toast } from 'react-toastify';

export const SlotManagement = () => {
  const { slots, refreshManagerData } = useContext(ManagerContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [togglingSlot, setTogglingSlot] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const filteredSlots = slots.filter((slot) => {
    const matchesSearch =
      slot.slotNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${slot.chargingSpeed}`.includes(searchTerm);

    const matchesStatus = statusFilter === 'All' ||
      (statusFilter === 'Disabled' ? !slot.isEnabled : slot.slotStatus === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setEditingSlot(null);
    reset({ chargingSpeed: '', slotStatus: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slot) => {
    setEditingSlot(slot);
    reset({
      chargingSpeed: slot.chargingSpeed || '',
      slotStatus: slot.slotStatus || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    setLoadingAction(true);
    try {
      if (editingSlot) {
        await slotService.updateSlot(editingSlot._id, data);
        await refreshManagerData();
        toast.success('Charging slot configuration updated.');
      } else {
        await slotService.createSlot(data);
        await refreshManagerData();
        toast.success('New charging slot port added.');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save slot details.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleConfirm = async () => {
    setLoadingAction(true);
    try {
      await slotService.setSlotEnabled(togglingSlot._id, !togglingSlot.isEnabled);
      await refreshManagerData();
      toast.success(`Charging slot ${togglingSlot.isEnabled ? 'disabled' : 'enabled'} successfully.`);
      setTogglingSlot(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update slot state.');
    } finally {
      setLoadingAction(false);
    }
  };

  const columns = [
    {
      header: 'Slot Port Number',
      accessor: 'slotNumber',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 font-bold flex items-center justify-center text-sm border border-primary-100">
            <FiZap />
          </div>
          <div>
            <p className="font-bold text-slate-900">{row.slotNumber}</p>
            <p className="text-[11px] text-slate-400 font-mono">ID: {row._id}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Charging Speed',
      accessor: 'chargingSpeed',
      render: (row) => (
        <span className="font-bold text-slate-800 text-xs bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
          {row.chargingSpeed === 'Fast' ? '50 kW Fast DC' : '11 kW Normal AC'}
        </span>
      ),
    },
    {
      header: 'Slot Status',
      accessor: 'slotStatus',
      render: (row) => <StatusBadge status={!row.isEnabled ? 'Disabled' : row.slotStatus || 'Unknown'} />,
    },
    {
      header: 'Actions',
      accessor: '_id',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleOpenEditModal(row)}
            className="p-2 rounded-xl text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition"
            title="Edit Slot"
          >
            <FiEdit2 className="text-base" />
          </button>
          <button
            onClick={() => setTogglingSlot(row)}
            className="p-2 rounded-xl text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition"
            title={row.isEnabled ? 'Disable Slot' : 'Enable Slot'}
          >
            {row.isEnabled ? <FiToggleRight className="text-base" /> : <FiToggleLeft className="text-base" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Charging Slots Management"
        description="Configure station charging ports, power outputs, and maintenance statuses"
        actions={
          <Button variant="primary" icon={FiPlus} onClick={handleOpenAddModal}>
            Add New Charging Slot
          </Button>
        }
      />

      {/* Filter Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by slot number (e.g. Slot A-1) or speed..."
        />
        <div className="flex items-center gap-3">
          <Select
            options={['All', 'Available', 'Occupied', 'Maintenance', 'Out of Service', 'Disabled']}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-44"
          />
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-semibold transition ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              <FiGrid />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-semibold transition ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              <FiList />
            </button>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSlots.map((slot) => {
            const isAvailable = slot.isEnabled && slot.slotStatus === 'Available';
            const isOccupied = slot.isEnabled && slot.slotStatus === 'Occupied';
            const isMaintenance = slot.isEnabled && slot.slotStatus === 'Maintenance';

            return (
              <Card
                key={slot._id}
                hover
                className={`flex flex-col justify-between border-2 transition-all ${
                  isAvailable
                    ? 'border-emerald-200 bg-white'
                    : isOccupied
                    ? 'border-blue-200 bg-blue-50/20'
                    : isMaintenance
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                      <FiZap
                        className={
                          isAvailable
                            ? 'text-emerald-500'
                            : isOccupied
                            ? 'text-blue-600'
                            : isMaintenance
                            ? 'text-amber-500'
                            : 'text-rose-600'
                        }
                      />
                      {slot.slotNumber}{!slot.isEnabled ? ' (Disabled)' : ''}
                    </span>
                    <StatusBadge status={!slot.isEnabled ? 'Disabled' : slot.slotStatus || 'Unknown'} />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 my-2 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Power Delivery:</span>
                      <strong className="text-primary-600">{slot.chargingSpeed === 'Fast' ? '50 kW Fast DC' : '11 kW Normal AC'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Port ID:</span>
                      <strong className="text-slate-600 font-mono text-[11px]">{slot._id}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={FiEdit2}
                    onClick={() => handleOpenEditModal(slot)}
                  >
                    Configure
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={slot.isEnabled ? FiToggleRight : FiToggleLeft}
                    onClick={() => setTogglingSlot(slot)}
                  >
                    {slot.isEnabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <DataTable columns={columns} data={filteredSlots} />
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSlot ? 'Configure Charging Slot' : 'Add New Charging Slot'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600">
            {editingSlot
              ? `Permanent slot identity: ${editingSlot.slotNumber}`
              : 'Slot number is assigned automatically using the lowest available number.'}
          </div>

          <Select
            label="Charging Speed (kW)"
            options={[
              { value: 'Fast', label: 'Fast DC - 50 kW' },
              { value: 'Normal', label: 'Normal AC - 11 kW' },
            ]}
            error={errors.chargingSpeed?.message}
            {...register('chargingSpeed', {
              required: 'Select a charging speed',
              validate: (value) => ['Fast', 'Normal'].includes(value) || 'Select a supported charging speed',
            })}
          />

          <Select
            label="Slot Operational Status"
            options={['Available', 'Occupied', 'Maintenance', 'Out of Service']}
            error={errors.slotStatus?.message}
            {...register('slotStatus', {
              required: 'Select an operational status',
              validate: (value) => ['Available', 'Maintenance', 'Out of Service'].includes(value) ||
                (editingSlot?.slotStatus === 'Occupied' && value === 'Occupied') || 'Choose a valid status',
            })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loadingAction}>
              {editingSlot ? 'Save Configuration' : 'Create Slot'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={!!togglingSlot}
        onClose={() => setTogglingSlot(null)}
        onConfirm={handleToggleConfirm}
        title={`${togglingSlot?.isEnabled ? 'Disable' : 'Enable'} Charging Slot`}
        message={togglingSlot?.isEnabled
          ? 'Disable this slot? It will be excluded from new allocations and live usable-slot views. Slot history will be preserved.'
          : 'Re-enable this slot? It will be usable again only if its operational status is Available.'}
        isLoading={loadingAction}
      />
    </div>
  );
};
