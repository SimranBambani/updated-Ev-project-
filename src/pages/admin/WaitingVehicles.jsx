import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { bookingService } from '../../services/bookingService';
import { PageHeader } from '../../components/common/layout/PageHeader';
import { Card } from '../../components/common/cards/Card';
import { DataTable } from '../../components/common/tables/DataTable';
import { SearchBar } from '../../components/common/forms/SearchBar';
import { StatusBadge } from '../../components/common/badge/StatusBadge';
import { formatDateTime } from '../../utils/helpers';
import { formatDuration } from '../../utils/calculations';
import { FiClock, FiUser, FiTruck, FiMapPin, FiAlertTriangle, FiZap } from 'react-icons/fi';

export const WaitingVehicles = () => {
  const { stations } = useContext(AdminContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [waitingList, setWaitingList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWaitingData = async () => {
    setLoading(true);
    try {
      const allBookings = await bookingService.getAll();
      const waitingOnly = allBookings.filter((b) => b.bookingStatus === 'Waiting');
      setWaitingList(waitingOnly);
    } catch (err) {
      console.error('Failed to load waiting vehicles queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitingData();
  }, []);

  // Compute station-level waiting counts dynamically from actual waiting bookings
  const stationWaitingCounts = useMemo(() => {
    const counts = {};
    stations.forEach((stn) => {
      counts[stn.stationName] = 0;
    });
    waitingList.forEach((b) => {
      const name = b.stationName || 'VoltFlow Hub';
      counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  }, [stations, waitingList]);

  // Transform waiting bookings for table rendering
  const formattedWaitingData = useMemo(() => {
    return waitingList.map((b, idx) => ({
      _id: b._id,
      queuePosition: `#${b.queuePosition || idx + 1} in Queue`,
      customerName: b.customerName || 'Alex Morgan',
      vehicleNumber: b.vehicleNumber || 'EV10AB1000',
      vehicleModel: b.vehicleModel || 'Tesla Model 3',
      stationName: b.stationName || 'VoltFlow Hub',
      waitingTime: b.estimatedWaitingTime || (idx + 1) * 10,
      bookingTime: b.bookingTime || new Date().toISOString(),
      bookingStatus: 'Waiting',
    }));
  }, [waitingList]);

  const filteredData = formattedWaitingData.filter(
    (item) =>
      item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.stationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vehicleModel?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Queue Position',
      accessor: 'queuePosition',
      render: (row) => (
        <span className="font-extrabold text-amber-800 bg-amber-100 px-3 py-1 rounded-full text-xs border border-amber-300">
          {row.queuePosition}
        </span>
      ),
    },
    {
      header: 'Station Name',
      accessor: 'stationName',
      render: (row) => (
        <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
          <FiMapPin className="text-primary-600 shrink-0" /> {row.stationName}
        </span>
      ),
    },
    {
      header: 'Customer Name',
      accessor: 'customerName',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">
            <FiUser />
          </div>
          <span className="font-bold text-slate-900 text-xs">{row.customerName}</span>
        </div>
      ),
    },
    {
      header: 'Vehicle Details',
      accessor: 'vehicleNumber',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 font-mono text-xs flex items-center gap-1">
            <FiTruck className="text-slate-400" /> {row.vehicleNumber}
          </p>
          <p className="text-[11px] text-slate-500">{row.vehicleModel}</p>
        </div>
      ),
    },
    {
      header: 'Estimated Wait Time',
      accessor: 'waitingTime',
      render: (row) => (
        <span className="font-bold text-amber-700 text-xs flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          <FiClock className="text-amber-600" /> {formatDuration(row.waitingTime)}
        </span>
      ),
    },
    {
      header: 'Booking Time',
      accessor: 'bookingTime',
      render: (row) => (
        <span className="text-xs text-slate-500">{formatDateTime(row.bookingTime)}</span>
      ),
    },
    {
      header: 'Booking Status',
      accessor: 'bookingStatus',
      render: (row) => <StatusBadge status={row.bookingStatus || 'Waiting'} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waiting Vehicles Queue"
        description="Monitor EV drivers currently waiting in line for open charging slots across network hubs"
      />

      {/* Queue Alert Summary Card */}
      <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-none shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white font-black text-2xl flex items-center justify-center shrink-0">
              <FiAlertTriangle />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Active Queue: {waitingList.length} Vehicles Waiting</h3>
              <p className="text-xs text-amber-100 mt-0.5 font-medium">
                Total network queue count calculated dynamically from active waiting bookings.
              </p>
            </div>
          </div>
          <span className="bg-white text-amber-900 font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-xs self-end sm:self-center">
            Queue Status: {waitingList.length > 0 ? 'Busy' : 'Normal'}
          </span>
        </div>
      </Card>

      {/* Station-Level Waiting Breakdown Cards */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FiZap className="text-amber-500" /> Station-Level Waiting Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stationWaitingCounts).map(([stationName, count]) => (
            <Card key={stationName} className={`p-4 border-2 ${count > 0 ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-xs flex items-center gap-1">
                    <FiMapPin className="text-primary-600 shrink-0" /> {stationName}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Station Queue Count</p>
                </div>
                <span className={`text-lg font-black px-3 py-1 rounded-xl border ${count > 0 ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                  {count} Waiting
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Search & Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search waiting vehicles by customer, vehicle number, or station..."
          />
          <div className="text-xs text-slate-500 font-medium">
            Total Waiting Vehicles: <strong className="text-slate-900">{filteredData.length}</strong>
          </div>
        </div>

        <DataTable columns={columns} data={filteredData} isLoading={loading} />
      </div>
    </div>
  );
};

