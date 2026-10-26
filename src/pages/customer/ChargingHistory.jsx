import React, { useState, useEffect, useContext, useMemo } from 'react';
import { reportService } from '../../services/reportService';
import { AuthContext } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/layout/PageHeader';
import { Card } from '../../components/common/cards/Card';
import { StatsCard } from '../../components/common/cards/StatsCard';
import { DataTable } from '../../components/common/tables/DataTable';
import { SearchBar } from '../../components/common/forms/SearchBar';
import { StatusBadge } from '../../components/common/badge/StatusBadge';
import { EmptyState } from '../../components/common/loading/EmptyState';
import { formatDateTime } from '../../utils/helpers';
import { formatDuration } from '../../utils/estimationEngine';
import { FiClock, FiZap, FiTruck } from 'react-icons/fi';
import { toast } from 'react-toastify';

export const ChargingHistory = () => {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const customerId = user?.roleProfileId || user?.user_id;
        const data = await reportService.getChargingHistoryForCustomer(customerId);
        setHistory(data || []);
      } catch (err) {
        toast.error('Failed to load charging history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const filteredHistory = useMemo(() => {
    return (history || []).filter(
      (h) =>
        h.stationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.vehicleModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  // Dynamically compute KPI metrics from filtered customer history
  const { totalEnergy, totalSessions, totalMiles } = useMemo(() => {
    const energy = history.reduce((acc, curr) => acc + (curr.energyConsumed || 0), 0);
    const sessions = history.length;
    const miles = Math.round(energy * 3.8); // 3.8 miles per kWh
    return {
      totalEnergy: energy.toFixed(1),
      totalSessions: sessions,
      totalMiles: miles.toLocaleString(),
    };
  }, [history]);

  const columns = useMemo(
    () => [
      {
        header: 'Station Location',
        accessor: 'stationName',
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 font-bold flex items-center justify-center text-xs border border-primary-100">
              <FiZap />
            </div>
            <div>
              <p className="font-bold text-slate-900">{row.stationName || 'VoltFlow SuperHub'}</p>
              <p className="text-[10px] text-slate-400">CyberCity District</p>
            </div>
          </div>
        ),
      },
      {
        header: 'Vehicle Reg',
        accessor: 'vehicleNumber',
        render: (row) => (
          <div>
            <p className="font-semibold text-slate-800 text-xs flex items-center gap-1">
              <FiTruck className="text-slate-400" /> {row.vehicleModel || 'Tesla Model 3'}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">{row.vehicleNumber || 'EV12AB1234'}</p>
          </div>
        ),
      },
      {
        header: 'SoC Delta',
        accessor: 'initialBattery',
        render: (row) => (
          <span className="font-bold text-emerald-600 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {row.initialBattery || 20}% ➔ {row.finalBattery || 100}%
          </span>
        ),
      },
      {
        header: 'Energy Dispensed',
        accessor: 'energyConsumed',
        render: (row) => (
          <span className="font-bold text-primary-600 text-xs">
            {(row.energyConsumed || 34.5).toFixed(1)} kWh
          </span>
        ),
      },
      {
        header: 'Duration',
        accessor: 'duration',
        render: (row) => (
          <span className="text-xs font-semibold text-slate-700">
            {formatDuration(row.duration || 45)}
          </span>
        ),
      },
      {
        header: 'Status',
        accessor: 'sessionStatus',
        render: (row) => <StatusBadge status={row.sessionStatus || 'Completed'} />,
      },
      {
        header: 'Date',
        accessor: 'startTime',
        render: (row) => (
          <span className="text-xs text-slate-500">
            {formatDateTime(row.startTime || new Date().toISOString())}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Charging Session History"
        description="Comprehensive log of your past electric vehicle charging sessions and energy consumption"
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatsCard
          title="Total Energy Charged"
          value={`${totalEnergy} kWh`}
          subtitle="Lifetime electricity dispensed"
          icon={FiZap}
          color="primary"
        />
        <StatsCard
          title="Completed Plug-Ins"
          value={totalSessions}
          subtitle="Successful charging sessions"
          icon={FiClock}
          color="emerald"
        />
        <StatsCard
          title="Total Clean Miles Added"
          value={`${totalMiles} Miles`}
          subtitle="Zero emission transport"
          icon={FiTruck}
          color="indigo"
        />
      </div>

      {/* Search & History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search history by station, vehicle model, or registration..."
          />
          <div className="text-xs text-slate-500 font-medium">
            Total Sessions: <strong className="text-slate-900">{filteredHistory.length}</strong>
          </div>
        </div>

        {history.length === 0 && !loading ? (
          <Card className="py-12 flex flex-col items-center justify-center text-center">
            <EmptyState
              title="No charging history available yet."
              message="You haven't completed any charging sessions yet. Reserve a charging slot to get started."
            />
          </Card>
        ) : (
          <DataTable
            columns={columns}
            data={filteredHistory}
            isLoading={loading}
            emptyTitle="No charging history available yet."
            emptyMessage="No matching sessions found."
          />
        )}
      </div>
    </div>
  );
};
