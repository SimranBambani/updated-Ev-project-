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
import { FiPlus, FiEdit2, FiToggleLeft, FiToggleRight, FiDatabase, FiCpu, FiActivity } from 'react-icons/fi';
import { toast } from 'react-toastify';

export const BatteryInventory = () => {
  const { batteryInventory, refreshManagerData } = useContext(ManagerContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [togglingItem, setTogglingItem] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const filteredInventory = batteryInventory.filter(
    (item) =>
      item.batteryModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.health).includes(searchTerm) ||
      item.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingItem(null);
    reset({ batteryModel: '', capacity: '', health: '', status: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    reset({
      batteryModel: item.batteryModel || '',
      capacity: item.capacity ?? '',
      health: item.health ?? '',
      status: item.status || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    setLoadingAction(true);
    try {
      if (editingItem) {
        await slotService.updateBatteryItem(editingItem._id, data);
        await refreshManagerData();
        toast.success('Battery inventory item updated.');
      } else {
        await slotService.createBatteryItem(data);
        await refreshManagerData();
        toast.success('New battery pack added to station inventory.');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save battery details.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleConfirm = async () => {
    setLoadingAction(true);
    try {
      await slotService.setBatteryEnabled(togglingItem._id, !togglingItem.isEnabled);
      await refreshManagerData();
      toast.success(`Battery pack ${togglingItem.isEnabled ? 'disabled' : 'enabled'}.`);
      setTogglingItem(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update battery state.');
    } finally {
      setLoadingAction(false);
    }
  };

  const columns = [
    {
      header: 'Battery Pack Model',
      accessor: 'batteryModel',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-base border border-indigo-100">
            <FiDatabase />
          </div>
          <div>
            <p className="font-bold text-slate-900">{row.batteryModel}</p>
            <p className="text-[11px] text-slate-400 font-mono">ID: {row._id}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Energy Capacity',
      accessor: 'capacity',
      render: (row) => (
        <span className="font-bold text-primary-600 text-xs">
          {row.capacity} kWh
        </span>
      ),
    },
    {
      header: 'Health Condition',
      accessor: 'health',
      render: (row) => {
        const health = Number(row.health);
        const isLow = health < 70;
        const isFair = health >= 70 && health < 80;

        if (isLow) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-300 animate-pulse">
              <FiActivity className="text-rose-600" /> {health}% (Low Health)
            </span>
          );
        }
        if (isFair) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <FiActivity className="text-amber-500" /> {health}%
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <FiActivity className="text-emerald-500" /> {health}%
          </span>
        );
      },
    },
    {
      header: 'Inventory Status',
      accessor: 'status',
      render: (row) => {
        const status = row.status || 'Available';
        if (status === 'Out of Service') {
          return <StatusBadge status="Out of Service" className="bg-rose-100 text-rose-800 border-rose-300 font-extrabold" />;
        }
        if (!row.isEnabled) {
          return <StatusBadge status={`${status} (Disabled)`} className="bg-slate-100 text-slate-600 border-slate-300" />;
        }
        if (status === 'Maintenance' || status === 'Maintenance Required') {
          return <StatusBadge status="Maintenance Required" className="bg-amber-100 text-amber-800 border-amber-300 font-bold" />;
        }
        return <StatusBadge status={status} />;
      },
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
            title="Edit Battery"
          >
            <FiEdit2 className="text-base" />
          </button>
          <button
            onClick={() => setTogglingItem(row)}
            className="p-2 rounded-xl text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition"
            title={row.isEnabled ? 'Disable Battery' : 'Enable Battery'}
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
        title="Battery Inventory Management"
        description="Monitor station backup battery modules, state of health, and replacement schedules"
        actions={
          <Button variant="primary" icon={FiPlus} onClick={handleOpenAddModal}>
            Add Battery Pack
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by battery model, health, or status..."
        />
        <div className="text-xs text-slate-500 font-medium">
          Total Inventory Items: <strong className="text-slate-900">{filteredInventory.length}</strong>
        </div>
      </div>

      <DataTable columns={columns} data={filteredInventory} />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Battery Pack' : 'Add Battery Module to Inventory'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Battery Model Name"
            icon={FiCpu}
            placeholder="e.g. UltraCell 75kWh Pack"
            error={errors.batteryModel?.message}
            {...register('batteryModel', { required: 'Battery model is required' })}
          />

          <Input
            label="Capacity (kWh)"
            type="number"
            placeholder="75"
            min="0.1"
            step="any"
            error={errors.capacity?.message}
            {...register('capacity', {
              required: 'Capacity is required',
              valueAsNumber: true,
              min: { value: 0.1, message: 'Capacity must be greater than zero' },
              validate: (value) => Number.isFinite(value) || 'Enter a valid capacity',
            })}
          />

          <Input
            label="State of Health (SoH %)"
            type="number"
            placeholder="Enter 0–100"
            min="0"
            max="100"
            step="any"
            error={errors.health?.message}
            {...register('health', {
              required: 'State of health is required',
              valueAsNumber: true,
              min: { value: 0, message: 'SoH cannot be below 0%' },
              max: { value: 100, message: 'SoH cannot exceed 100%' },
              validate: (value) => Number.isFinite(value) || 'Enter a valid SoH percentage',
            })}
          />

          <Select
            label="Inventory Status"
            options={['Available', 'In Use', 'Charging', 'Maintenance', 'Out of Service']}
            error={errors.status?.message}
            {...register('status', {
              required: 'Select an inventory status',
              validate: (value) => ['Available', 'In Use', 'Charging', 'Maintenance', 'Out of Service'].includes(value) ||
                'Select a valid inventory status',
            })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loadingAction}>
              {editingItem ? 'Save Battery Pack' : 'Add Battery'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={!!togglingItem}
        onClose={() => setTogglingItem(null)}
        onConfirm={handleToggleConfirm}
        title={`${togglingItem?.isEnabled ? 'Disable' : 'Enable'} Battery Module`}
        message={togglingItem?.isEnabled
          ? 'Disable this battery module? Its record and history will be preserved.'
          : 'Re-enable this battery module? It will only be eligible for use if its inventory status permits.'}
        isLoading={loadingAction}
      />
    </div>
  );
};
