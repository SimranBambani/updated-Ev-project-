import React, { useState, useContext, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { CustomerContext } from '../../context/CustomerContext';
import { AuthContext } from '../../context/AuthContext';
import { vehicleService } from '../../services/vehicleService';
import { PageHeader } from '../../components/common/layout/PageHeader';
import { Card } from '../../components/common/cards/Card';
import { DataTable } from '../../components/common/tables/DataTable';
import { SearchBar } from '../../components/common/forms/SearchBar';
import { Button } from '../../components/common/buttons/Button';
import { Input } from '../../components/common/forms/Input';
import { Select } from '../../components/common/forms/Select';
import { Modal } from '../../components/common/modal/Modal';
import { ConfirmationModal } from '../../components/common/modal/ConfirmationModal';
import { EmptyState } from '../../components/common/loading/EmptyState';
import { vehicleNumberValidation, batteryPercentageValidation, batteryCapacityValidation } from '../../utils/validators';
import { getBatteryColor } from '../../utils/helpers';
import { VEHICLE_TYPES } from '../../utils/constants';
import { FiPlus, FiEdit2, FiTruck, FiZap, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { toast } from 'react-toastify';

const VEHICLE_TYPE_OPTIONS = [
  { value: '', label: 'Select Vehicle Type' },
  ...Object.values(VEHICLE_TYPES).map((t) => ({ value: t, label: t })),
];

export const VehicleManagement = () => {
  const { user } = useContext(AuthContext);
  const { vehicles, refreshCustomerData, loading } = useContext(CustomerContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null); // { id, isActive }
  const [loadingAction, setLoadingAction] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const filteredVehicles = useMemo(() => {
    return (vehicles || []).filter(
      (v) =>
        v.vehicleModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.vehicleType?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vehicles, searchTerm]);

  const handleOpenAddModal = useCallback(() => {
    setEditingVehicle(null);
    // All fields start empty — no auto-defaults
    reset({
      vehicleNumber: '',
      vehicleModel: '',
      batteryModel: '',
      batteryCapacity: '',
      currentCharge: '',
      vehicleType: '',
    });
    setIsModalOpen(true);
  }, [reset]);

  const handleOpenEditModal = useCallback(
    (veh) => {
      setEditingVehicle(veh);
      // Populate from actual saved vehicle data — no arbitrary defaults
      reset({
        vehicleNumber: veh.vehicleNumber || '',
        vehicleModel: veh.vehicleModel || '',
        batteryModel: veh.batteryModel || '',
        batteryCapacity: veh.batteryCapacity !== undefined ? String(veh.batteryCapacity) : '',
        currentCharge: veh.currentCharge !== undefined ? String(veh.currentCharge) : '',
        vehicleType: veh.vehicleType || '',
      });
      setIsModalOpen(true);
    },
    [reset]
  );

  const onSubmit = async (data) => {
    // Validate that vehicleType was explicitly selected
    if (!data.vehicleType) {
      toast.error('Please select a vehicle type.');
      return;
    }

    setLoadingAction(true);
    try {
      if (editingVehicle) {
        await vehicleService.update(editingVehicle._id, data);
        toast.success('Vehicle details updated and saved.');
      } else {
        await vehicleService.create(data);
        toast.success('New EV vehicle added to your garage.');
      }
      await refreshCustomerData();
      setIsModalOpen(false);
    } catch (err) {
      const errMsg = err?.response?.data?.message || 'Failed to save vehicle.';
      toast.error(errMsg);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleConfirm = async () => {
    if (!toggleTarget) return;
    setLoadingAction(true);
    try {
      const updated = await vehicleService.toggleActive(toggleTarget.id);
      const action = updated.isActive ? 'enabled' : 'disabled';
      toast.success(`Vehicle successfully ${action}.`);
      await refreshCustomerData();
      setTogglingId(null);
      setToggleTarget(null);
    } catch (err) {
      const errMsg = err?.response?.data?.message || 'Failed to update vehicle status.';
      toast.error(errMsg);
    } finally {
      setLoadingAction(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: 'Vehicle Model',
        accessor: 'vehicleModel',
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl font-bold flex items-center justify-center text-lg border ${
              row.isActive !== false
                ? 'bg-primary-50 text-primary-600 border-primary-100'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}>
              <FiTruck />
            </div>
            <div>
              <p className={`font-bold text-sm ${row.isActive !== false ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                {row.vehicleModel}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">Reg: {row.vehicleNumber}</p>
            </div>
          </div>
        ),
      },
      {
        header: 'Status',
        accessor: 'isActive',
        render: (row) => (
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              row.isActive !== false
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}
          >
            {row.isActive !== false ? '● Enabled' : '● Disabled'}
          </span>
        ),
      },
      {
        header: 'Vehicle Type',
        accessor: 'vehicleType',
        render: (row) => (
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            {row.vehicleType || '—'}
          </span>
        ),
      },
      {
        header: 'Battery Capacity',
        accessor: 'batteryCapacity',
        render: (row) => (
          <span className="font-bold text-primary-600 text-xs">
            {row.batteryCapacity} kWh ({row.batteryModel || 'Li-Ion'})
          </span>
        ),
      },
      {
        header: 'Current Battery %',
        accessor: 'currentCharge',
        render: (row) => {
          const pct = row.currentCharge || 0;
          const colorClass = getBatteryColor(pct);

          return (
            <div className="w-36">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className={`px-1.5 py-0.5 rounded text-[11px] ${colorClass}`}>{pct}% Charged</span>
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
        header: 'Actions',
        accessor: '_id',
        className: 'text-right',
        render: (row) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleOpenEditModal(row)}
              className="p-2 rounded-xl text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition"
              title="Edit Vehicle"
            >
              <FiEdit2 className="text-base" />
            </button>
            <button
              onClick={() => {
                setTogglingId(row._id);
                setToggleTarget({ id: row._id, isActive: row.isActive !== false });
              }}
              className={`p-2 rounded-xl transition flex items-center gap-1 text-xs font-semibold ${
                row.isActive !== false
                  ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-50'
                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
              title={row.isActive !== false ? 'Disable Vehicle' : 'Enable Vehicle'}
            >
              {row.isActive !== false ? (
                <><FiToggleLeft className="text-base" /> Disable</>
              ) : (
                <><FiToggleRight className="text-base" /> Enable</>
              )}
            </button>
          </div>
        ),
      },
    ],
    [handleOpenEditModal]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Garage & EV Vehicles"
        description="Register your electric vehicles, specify battery capacities, and monitor current charge levels"
        actions={
          <Button variant="primary" icon={FiPlus} onClick={handleOpenAddModal}>
            Register New Vehicle
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by vehicle model, registration number, or type..."
        />
        <div className="text-xs text-slate-500 font-medium">
          Total Vehicles: <strong className="text-slate-900">{filteredVehicles.length}</strong>
          {' '}
          <span className="text-emerald-600">({filteredVehicles.filter(v => v.isActive !== false).length} enabled)</span>
        </div>
      </div>

      {vehicles.length === 0 && !loading ? (
        <Card className="py-12 flex flex-col items-center justify-center text-center">
          <EmptyState
            title="No vehicles added yet."
            message="Your garage is currently empty. Click 'Register New Vehicle' to add your electric vehicle."
          />
          <div className="mt-4">
            <Button variant="primary" icon={FiPlus} onClick={handleOpenAddModal}>
              Register New Vehicle
            </Button>
          </div>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={filteredVehicles}
          isLoading={loading}
          emptyTitle="No vehicles found."
          emptyMessage="No vehicles found matching your criteria. Add your EV vehicle using the button above."
        />
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVehicle ? 'Edit Vehicle Specifications' : 'Register New Electric Vehicle'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Vehicle Model *"
            icon={FiTruck}
            placeholder="e.g. Tesla Model 3 / Hyundai Ioniq 5"
            error={errors.vehicleModel?.message}
            {...register('vehicleModel', { required: 'Vehicle model is required' })}
          />

          <Input
            label="Registration Vehicle Number *"
            icon={FiZap}
            placeholder="MH12AB1234 or DL01EV9999"
            error={errors.vehicleNumber?.message}
            {...register('vehicleNumber', vehicleNumberValidation)}
          />

          <Select
            label="Vehicle Category / Type *"
            options={VEHICLE_TYPE_OPTIONS}
            placeholder={null}
            error={errors.vehicleType?.message}
            {...register('vehicleType', { required: 'Vehicle type is required' })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Battery Model *"
              placeholder="e.g. Li-Ion 75 kWh"
              error={errors.batteryModel?.message}
              {...register('batteryModel', { required: 'Battery model is required' })}
            />
            <Input
              label="Battery Capacity (kWh) *"
              type="number"
              min="1"
              max="500"
              placeholder="e.g. 75"
              error={errors.batteryCapacity?.message}
              {...register('batteryCapacity', batteryCapacityValidation)}
            />
          </div>

          <Input
            label="Current Battery Charge (%)"
            type="number"
            min="0"
            max="100"
            placeholder="e.g. 25"
            error={errors.currentCharge?.message}
            {...register('currentCharge', batteryPercentageValidation)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loadingAction}>
              {editingVehicle ? 'Save Specifications' : 'Register Vehicle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Enable/Disable Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!togglingId}
        onClose={() => { setTogglingId(null); setToggleTarget(null); }}
        onConfirm={handleToggleConfirm}
        title={toggleTarget?.isActive ? 'Disable Vehicle' : 'Enable Vehicle'}
        message={
          toggleTarget?.isActive
            ? 'Are you sure you want to disable this vehicle? It will not be available for new bookings while disabled. Existing booking records will be preserved.'
            : 'Are you sure you want to enable this vehicle? It will become available for new bookings again.'
        }
        confirmText={toggleTarget?.isActive ? 'Disable Vehicle' : 'Enable Vehicle'}
        isLoading={loadingAction}
      />
    </div>
  );
};
