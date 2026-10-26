import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { AdminContext } from '../../context/AdminContext';
import { managerService } from '../../services/managerService';
import { PageHeader } from '../../components/common/layout/PageHeader';
import { DataTable } from '../../components/common/tables/DataTable';
import { SearchBar } from '../../components/common/forms/SearchBar';
import { Button } from '../../components/common/buttons/Button';
import { Input } from '../../components/common/forms/Input';
import { Select } from '../../components/common/forms/Select';
import { Modal } from '../../components/common/modal/Modal';
import { ConfirmationModal } from '../../components/common/modal/ConfirmationModal';
import { StatusBadge } from '../../components/common/badge/StatusBadge';
import { emailValidation, phoneValidation, passwordValidation } from '../../utils/validators';
import { FiPlus, FiEdit2, FiTrash2, FiUserCheck, FiMail, FiPhone, FiLock, FiClock, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-toastify';

export const ManagerManagement = () => {
  const { managers, stations, refreshAdminData } = useContext(AdminContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const filteredManagers = managers.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.stationName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingManager(null);
    reset({
      name: '',
      email: '',
      phone: '',
      password: 'Manager@123',
      stationId: stations[0]?._id || '',
      shift: 'Morning (06:00 - 14:00)',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mgr) => {
    setEditingManager(mgr);
    reset({
      name: mgr.name || '',
      email: mgr.email || '',
      phone: mgr.phone || '',
      password: mgr.password || 'Manager@123',
      stationId: mgr.stationId || stations[0]?._id || '',
      shift: mgr.shift || 'Morning (06:00 - 14:00)',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    setLoadingAction(true);
    try {
      if (editingManager) {
        await managerService.update(editingManager._id, data);
        toast.success('Station manager profile updated.');
      } else {
        await managerService.create(data);
        toast.success('New station manager assigned.');
      }
      refreshAdminData();
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save manager details.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setLoadingAction(true);
    try {
      await managerService.delete(deletingId);
      toast.success('Station Manager unassigned.');
      refreshAdminData();
      setDeletingId(null);
    } catch (err) {
      toast.error('Failed to delete manager.');
    } finally {
      setLoadingAction(false);
    }
  };

  const columns = [
    {
      header: 'Manager Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-bold flex items-center justify-center text-sm">
            {row.name ? row.name.charAt(0).toUpperCase() : <FiUserCheck />}
          </div>
          <div>
            <p className="font-bold text-slate-900">{row.name}</p>
            <p className="text-[11px] text-slate-400 font-mono">Manager ID: {row._id}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact Info',
      accessor: 'email',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800 text-xs flex items-center gap-1">
            <FiMail className="text-slate-400" /> {row.email}
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <FiPhone className="text-slate-400" /> {row.phone}
          </p>
        </div>
      ),
    },
    {
      header: 'Assigned Station',
      accessor: 'stationName',
      render: (row) => (
        <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
          <FiMapPin className="text-primary-600" />
          {row.stationName || 'VoltFlow Hub'}
        </span>
      ),
    },
    {
      header: 'Shift Schedule',
      accessor: 'shift',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
          <FiClock /> {row.shift || 'Morning (06:00 - 14:00)'}
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
            onClick={() => handleOpenEditModal(row)}
            className="p-2 rounded-xl text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition"
            title="Edit Manager"
          >
            <FiEdit2 className="text-base" />
          </button>
          <button
            onClick={() => setDeletingId(row._id)}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Delete Manager"
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
        title="Station Manager Management"
        description="Assign station managers, configure operational shifts, and supervise site operators"
        actions={
          <Button variant="primary" icon={FiPlus} onClick={handleOpenAddModal}>
            Assign Station Manager
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search manager by name, email, or station..."
        />
        <div className="text-xs text-slate-500 font-medium">
          Total Station Managers: <strong className="text-slate-900">{filteredManagers.length}</strong>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredManagers}
        emptyTitle="No Station Managers Found"
        emptyMessage="Try adjusting your search criteria or assign a new station manager."
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingManager ? 'Edit Manager Assignment' : 'Assign New Station Manager'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Manager Full Name"
            icon={FiUserCheck}
            placeholder="e.g. Marcus Vance"
            error={errors.name?.message}
            {...register('name', { required: 'Manager name is required' })}
          />

          <Input
            label="Email Address"
            type="email"
            icon={FiMail}
            placeholder="manager@voltflow.io"
            error={errors.email?.message}
            {...register('email', emailValidation)}
          />

          <Input
            label="Password"
            type="password"
            icon={FiLock}
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', passwordValidation)}
          />

          <Input
            label="Phone Number"
            icon={FiPhone}
            placeholder="9876543210"
            error={errors.phone?.message}
            {...register('phone', phoneValidation)}
          />

          <Select
            label="Assigned Charging Station"
            options={stations.map((s) => ({ label: s.stationName, value: s._id }))}
            error={errors.stationId?.message}
            {...register('stationId', { required: 'Please assign a station' })}
          />

          <Select
            label="Shift Schedule"
            options={[
              'Morning (06:00 - 14:00)',
              'Evening (14:00 - 22:00)',
              'Night (22:00 - 06:00)',
              'Full Day (08:00 - 20:00)',
            ]}
            error={errors.shift?.message}
            {...register('shift', { required: 'Shift is required' })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loadingAction}>
              {editingManager ? 'Save Assignment' : 'Assign Manager'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Unassign Station Manager"
        message="Are you sure you want to remove this station manager assignment?"
        isLoading={loadingAction}
      />
    </div>
  );
};
