import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { AdminContext } from '../../context/AdminContext';
import { customerService } from '../../services/customerService';
import { PageHeader } from '../../components/common/layout/PageHeader';
import { DataTable } from '../../components/common/tables/DataTable';
import { SearchBar } from '../../components/common/forms/SearchBar';
import { Button } from '../../components/common/buttons/Button';
import { Input } from '../../components/common/forms/Input';
import { Select } from '../../components/common/forms/Select';
import { Modal } from '../../components/common/modal/Modal';
import { ConfirmationModal } from '../../components/common/modal/ConfirmationModal';
import { StatusBadge } from '../../components/common/badge/StatusBadge';
import { emailValidation, phoneValidation, vehicleNumberValidation } from '../../utils/validators';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiMail, FiPhone, FiTruck, FiZap, FiDatabase } from 'react-icons/fi';
import { toast } from 'react-toastify';

export const CustomerManagement = () => {
  const { customers, stations, refreshAdminData } = useContext(AdminContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Filter synchronized customers by search term (case-insensitive, real-time across name, gmail, phone, vehicle number, vehicle model)
  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const nameMatch = (c.name || '').toLowerCase().includes(term);
    const gmailMatch = (c.gmail || c.email || '').toLowerCase().includes(term);
    const phoneMatch = (c.phone || '').includes(term);
    const vehNumMatch = (c.vehicleNumber || '').toLowerCase().includes(term);
    const vehModelMatch = (c.vehicleModel || '').toLowerCase().includes(term);
    return nameMatch || gmailMatch || phoneMatch || vehNumMatch || vehModelMatch;
  });

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    reset({
      name: '',
      email: '',
      phone: '',
      vehicleNumber: 'EV10AB1000',
      vehicleModel: 'Tesla Model 3',
      batteryModel: 'Li-Ion 75 kWh Pack',
      batteryPct: 65,
      bookingStatus: 'Confirmed',
      allocatedSlot: 'Slot A-1',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name || '',
      email: customer.gmail || customer.email || '',
      phone: customer.phone || '',
      vehicleNumber: customer.vehicleNumber || 'EV10AB1000',
      vehicleModel: customer.vehicleModel || 'Tesla Model 3',
      batteryModel: customer.batteryModel || 'Li-Ion 75 kWh Pack',
      batteryPct: customer.batteryPct || 65,
      bookingStatus: customer.bookingStatus || 'Confirmed',
      allocatedSlot: customer.allocatedSlot || 'Slot A-1',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    setLoadingAction(true);
    try {
      if (editingCustomer) {
        await customerService.update(editingCustomer._id, data);
        toast.success('Merged Customer & Vehicle record updated.');
      } else {
        await customerService.create(data);
        toast.success('New Customer & Vehicle profile registered.');
      }
      refreshAdminData();
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to save customer data.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setLoadingAction(true);
    try {
      await customerService.delete(deletingId);
      toast.success('Customer record deleted.');
      refreshAdminData();
      setDeletingId(null);
    } catch (err) {
      toast.error('Failed to delete customer.');
    } finally {
      setLoadingAction(false);
    }
  };

  // 9 Required Columns
  const columns = [
    {
      header: '1. Customer Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">
            {row.name ? row.name.charAt(0).toUpperCase() : <FiUser />}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-xs">{row.name}</p>
            <p className="text-[10px] text-slate-400 font-mono">ID: {row._id || row.customerId}</p>
          </div>
        </div>
      ),
    },
    {
      header: '2. Gmail',
      accessor: 'gmail',
      render: (row) => (
        <span className="font-medium text-slate-800 text-xs flex items-center gap-1">
          <FiMail className="text-slate-400 shrink-0" /> {row.gmail}
        </span>
      ),
    },
    {
      header: '3. Phone',
      accessor: 'phone',
      render: (row) => (
        <span className="text-xs text-slate-700 font-mono flex items-center gap-1">
          <FiPhone className="text-slate-400 shrink-0" /> {row.phone}
        </span>
      ),
    },
    {
      header: '4. Vehicle Number',
      accessor: 'vehicleNumber',
      render: (row) => (
        <span className="font-extrabold text-slate-900 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {row.vehicleNumber}
        </span>
      ),
    },
    {
      header: '5. Vehicle Model',
      accessor: 'vehicleModel',
      render: (row) => (
        <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
          <FiTruck className="text-primary-600" /> {row.vehicleModel}
        </span>
      ),
    },
    {
      header: '6. Battery Model',
      accessor: 'batteryModel',
      render: (row) => (
        <span className="text-xs text-slate-700 flex items-center gap-1">
          <FiDatabase className="text-indigo-500" /> {row.batteryModel}
        </span>
      ),
    },
    {
      header: '7. Battery %',
      accessor: 'batteryPct',
      render: (row) => (
        <span className="font-extrabold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {row.batteryPct}% Charged
        </span>
      ),
    },
    {
      header: '8. Booking Status',
      accessor: 'bookingStatus',
      render: (row) => <StatusBadge status={row.bookingStatus || 'Confirmed'} />,
    },
    {
      header: '9. Allocated Slot',
      accessor: 'allocatedSlot',
      render: (row) => (
        <span className="font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {row.allocatedSlot}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: '_id',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEditModal(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition"
            title="Edit Customer Details"
          >
            <FiEdit2 className="text-sm" />
          </button>
          <button
            onClick={() => setDeletingId(row._id)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Delete Customer"
          >
            <FiTrash2 className="text-sm" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Merged Customer & Vehicle Details"
        description="Unified master directory combining driver profiles, vehicle specifications, battery SoC, and slot reservations"
        actions={
          <Button variant="primary" icon={FiPlus} onClick={handleOpenAddModal}>
            Register Customer & Vehicle
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by customer name, gmail, phone, vehicle number, or model..."
        />
        <div className="text-xs text-slate-500 font-medium">
          Total Merged Records: <strong className="text-slate-900">{filteredCustomers.length}</strong>
        </div>
      </div>

      {/* Merged Master Data Table */}
      <DataTable
        columns={columns}
        data={filteredCustomers}
        emptyTitle="No Records Found"
        emptyMessage="Try adjusting your search query."
      />

      {/* Edit / Register Merged Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer & Vehicle Details' : 'Register Customer & Vehicle'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="1. Customer Name"
              icon={FiUser}
              placeholder="Alex Morgan"
              error={errors.name?.message}
              {...register('name', { required: 'Customer name is required' })}
            />
            <Input
              label="2. Gmail (Email)"
              type="email"
              icon={FiMail}
              placeholder="alex@gmail.com"
              error={errors.email?.message}
              {...register('email', emailValidation)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="3. Phone Number"
              icon={FiPhone}
              placeholder="9876543210"
              error={errors.phone?.message}
              {...register('phone', phoneValidation)}
            />
            <Input
              label="4. Vehicle Number"
              icon={FiZap}
              placeholder="EV10AB1000"
              error={errors.vehicleNumber?.message}
              {...register('vehicleNumber', vehicleNumberValidation)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="5. Vehicle Model"
              icon={FiTruck}
              placeholder="Tesla Model 3"
              {...register('vehicleModel')}
            />
            <Input
              label="6. Battery Model"
              icon={FiDatabase}
              placeholder="Li-Ion 75 kWh Pack"
              {...register('batteryModel')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="7. Battery Charge (%)"
              type="number"
              min="0"
              max="100"
              placeholder="65"
              {...register('batteryPct')}
            />
            <Select
              label="8. Booking Status"
              options={['Confirmed', 'Charging', 'Waiting', 'Completed']}
              {...register('bookingStatus')}
            />
            <Input
              label="9. Allocated Slot"
              placeholder="Slot A-1"
              {...register('allocatedSlot')}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loadingAction}>
              {editingCustomer ? 'Save Specifications' : 'Register Profile'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Record"
        message="Are you sure you want to remove this merged customer & vehicle record?"
        isLoading={loadingAction}
      />
    </div>
  );
};
