import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { AdminContext } from '../../context/AdminContext';
import { stationService } from '../../services/stationService';
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
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiZap, FiGrid, FiList, FiNavigation } from 'react-icons/fi';
import { toast } from 'react-toastify';

import { validateStationSlots } from '../../utils/validators';

export const StationManagement = () => {
  const { stations, refreshAdminData } = useContext(AdminContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm();

  const filteredStations = stations.filter(
    (s) =>
      s.stationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingStation(null);
    reset({
      stationName: '',
      address: '',
      city: 'Ahmedabad',
      latitude: 23.0225,
      longitude: 72.5714,
      totalSlots: 8,
      availableSlots: 8,
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (stn) => {
    setEditingStation(stn);
    reset({
      stationName: stn.stationName || '',
      address: stn.address || '',
      city: stn.city || 'Ahmedabad',
      latitude: stn.latitude || 23.0225,
      longitude: stn.longitude || 72.5714,
      totalSlots: stn.totalSlots || 8,
      availableSlots: stn.availableSlots || 4,
      status: stn.status || 'Active',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    // 1. Run Centralized Validation
    const valErr = validateStationSlots(data.totalSlots, data.availableSlots);
    if (valErr) {
      toast.error(valErr);
      return;
    }

    setLoadingAction(true);
    try {
      if (editingStation) {
        await stationService.update(editingStation._id, data);
        toast.success('Charging Station updated successfully.');
      } else {
        await stationService.create(data);
        toast.success('New Charging Hub registered on network.');
      }
      refreshAdminData();
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save station configuration.');
    } finally {
      setLoadingAction(false);
    }
  };


  const handleDeleteConfirm = async () => {
    setLoadingAction(true);
    try {
      await stationService.delete(deletingId);
      toast.success('Charging Station removed from system.');
      refreshAdminData();
      setDeletingId(null);
    } catch (err) {
      toast.error('Failed to delete station.');
    } finally {
      setLoadingAction(false);
    }
  };

  const columns = [
    {
      header: 'Station Hub Name',
      accessor: 'stationName',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-primary-600 text-white font-bold flex items-center justify-center text-base shadow-sm">
            <FiZap />
          </div>
          <div>
            <p className="font-bold text-slate-900">{row.stationName}</p>
            <p className="text-[11px] text-slate-400 font-mono">ID: {row._id}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Location & GPS',
      accessor: 'address',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs flex items-center gap-1">
            <FiMapPin className="text-primary-600" /> {row.address}, {row.city}
          </p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <FiNavigation /> Lat: {row.latitude}, Lng: {row.longitude}
          </p>
        </div>
      ),
    },
    {
      header: 'Slot Capacity',
      accessor: 'totalSlots',
      render: (row) => (
        <div className="text-xs">
          <span className="font-bold text-emerald-600">{row.availableSlots} Available</span>
          <span className="text-slate-400"> / {row.totalSlots} Total</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'Active'} />,
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
            title="Edit Station"
          >
            <FiEdit2 className="text-base" />
          </button>
          <button
            onClick={() => setDeletingId(row._id)}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Delete Station"
          >
            <FiTrash2 className="text-base" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Charging Station Management"
        description="Deploy, monitor, and manage EV charging hub locations and slot capacities"
        actions={
          <Button variant="primary" icon={FiPlus} onClick={handleOpenAddModal}>
            Deploy New Station Hub
          </Button>
        }
      />

      {/* Search & Layout Toggle Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by station name, city, or address..."
        />
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              <FiGrid /> Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              <FiList /> Table
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Table Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.map((stn) => (
            <Card key={stn._id} hover className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white font-bold flex items-center justify-center text-xl shadow-md shadow-primary-600/20">
                    <FiZap />
                  </div>
                  <StatusBadge status={stn.status || 'Active'} />
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-tight mb-1">
                  {stn.stationName}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                  <FiMapPin className="text-primary-600 shrink-0" /> {stn.address}, {stn.city}
                </p>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 my-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Available Slots:</span>
                    <strong className="text-emerald-600">{stn.availableSlots} Slots Free</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Capacity:</span>
                    <strong className="text-slate-800">{stn.totalSlots} Slots</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">GPS Coordinates:</span>
                    <strong className="text-slate-600 font-mono text-[11px]">
                      {stn.latitude}, {stn.longitude}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  icon={FiEdit2}
                  onClick={() => handleOpenEditModal(stn)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={FiTrash2}
                  onClick={() => setDeletingId(stn._id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={filteredStations} />
      )}

      {/* Station Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStation ? 'Edit Station Hub' : 'Deploy New Charging Station'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Station Name"
            icon={FiZap}
            placeholder="e.g. VoltFlow SuperHub CyberCity"
            error={errors.stationName?.message}
            {...register('stationName', { required: 'Station name is required' })}
          />

          <Input
            label="Street Address"
            icon={FiMapPin}
            placeholder="DLF Cyber Hub, Phase 2"
            error={errors.address?.message}
            {...register('address', { required: 'Address is required' })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="Gurugram / New Delhi"
              error={errors.city?.message}
              {...register('city', { required: 'City is required' })}
            />
            <Select
              label="Status"
              options={['Active', 'Maintenance', 'Inactive']}
              error={errors.status?.message}
              {...register('status')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude"
              type="number"
              step="0.0001"
              placeholder="28.4950"
              error={errors.latitude?.message}
              {...register('latitude', { required: 'Latitude is required' })}
            />
            <Input
              label="Longitude"
              type="number"
              step="0.0001"
              placeholder="77.0895"
              error={errors.longitude?.message}
              {...register('longitude', { required: 'Longitude is required' })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Slots"
              type="number"
              min="1"
              placeholder="8"
              error={errors.totalSlots?.message}
              {...register('totalSlots', {
                required: 'Total slots required',
                min: { value: 1, message: 'Total slots must be greater than 0.' },
                validate: (val) => {
                  const avail = Number(watch('availableSlots'));
                  if (avail > Number(val)) {
                    return 'Available slots cannot be greater than total slots.';
                  }
                  return true;
                },
              })}
            />
            <Input
              label="Available Slots"
              type="number"
              min="0"
              max={watch('totalSlots') ? Number(watch('totalSlots')) : undefined}
              placeholder="4"
              error={errors.availableSlots?.message || (Number(watch('availableSlots')) > Number(watch('totalSlots')) ? 'Available slots cannot be greater than total slots.' : undefined)}
              {...register('availableSlots', {
                required: 'Available slots required',
                min: { value: 0, message: 'Available slots cannot be negative.' },
                validate: (val) => {
                  const total = Number(watch('totalSlots'));
                  if (Number(val) > total) {
                    return 'Available slots cannot be greater than total slots.';
                  }
                  return true;
                },
              })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loadingAction}>
              {editingStation ? 'Save Hub Details' : 'Deploy Station'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Charging Station"
        message="Are you sure you want to delete this station hub? All slot data and session records associated with it will be unlinked."
        isLoading={loadingAction}
      />
    </div>
  );
};
