import React, { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AdminContext } from '../../context/AdminContext';
import { PageHeader } from '../../components/common/layout/PageHeader';
import { StatsCard } from '../../components/common/cards/StatsCard';
import { Card } from '../../components/common/cards/Card';
import { DataTable } from '../../components/common/tables/DataTable';
import { StatusBadge } from '../../components/common/badge/StatusBadge';
import { Button } from '../../components/common/buttons/Button';
import { formatDateTime } from '../../utils/helpers';
import { formatDuration } from '../../utils/estimationEngine';
import {
  FiUsers,
  FiMapPin,
  FiUserCheck,
  FiZap,
  FiPlus,
  FiActivity,
  FiDollarSign,
  FiBarChart2,
  FiPieChart,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiCalendar,
  FiCheckSquare,
  FiTrendingUp,
} from 'react-icons/fi';

export const AdminDashboard = () => {
  const { customers, stations, managers, bookings, sessions, stats, loading } = useContext(AdminContext);

  const bookingAnalytics = useMemo(() => {
    const status = (booking) => (booking.bookingStatus || '').toLowerCase();
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter((booking) => status(booking) === 'completed').length;
    const confirmedBookings = bookings.filter((booking) =>
      ['confirmed', 'charging'].includes(status(booking))
    ).length;
    const successfulBookings = completedBookings + confirmedBookings;
    const waitingBookings = bookings.filter((booking) => status(booking) === 'waiting').length;
    const cancelledBookings = bookings.filter((booking) => status(booking) === 'cancelled').length;
    const otherBookings = Math.max(
      0,
      totalBookings - completedBookings - confirmedBookings - waitingBookings - cancelledBookings
    );

    return {
      totalBookings,
      successfulBookings,
      confirmedBookings,
      cancelledBookings,
      waitingBookings,
      completedBookings,
      otherBookings,
      successRatePct: totalBookings ? Math.round((successfulBookings / totalBookings) * 100) : 0,
      cancellationRatePct: totalBookings ? Math.round((cancelledBookings / totalBookings) * 100) : 0,
    };
  }, [bookings]);

  const completedSessionCount = sessions.filter((session) => session.sessionStatus === 'Completed').length;
  const totalSlots = stations.reduce((total, station) => total + (Number(station.totalSlots) || 0), 0);
  const availableSlots = stations.reduce((total, station) => total + (Number(station.availableSlots) || 0), 0);
  const occupiedSlots = Math.max(0, totalSlots - availableSlots);
  const occupancyPct = totalSlots ? Math.round((occupiedSlots / totalSlots) * 100) : 0;
  const energyConsumed = Number(stats?.totalEnergyConsumedKWh) || 0;
  const sessionCount = Number(stats?.todaySessions ?? sessions.length) || 0;
  const averageEnergyPerSession = sessionCount
    ? (energyConsumed / sessionCount).toFixed(1)
    : '0.0';
  const bookingStatusSegments = [
    { label: 'Completed', count: bookingAnalytics.completedBookings, color: 'text-indigo-600', bg: 'bg-indigo-600' },
    { label: 'Confirmed / Charging', count: bookingAnalytics.confirmedBookings, color: 'text-emerald-500', bg: 'bg-emerald-500' },
    { label: 'Waiting', count: bookingAnalytics.waitingBookings, color: 'text-amber-500', bg: 'bg-amber-500' },
    { label: 'Cancelled', count: bookingAnalytics.cancelledBookings, color: 'text-rose-500', bg: 'bg-rose-500' },
    { label: 'Other', count: bookingAnalytics.otherBookings, color: 'text-slate-400', bg: 'bg-slate-400' },
  ];

  const columns = useMemo(
    () => [
      {
        header: 'Session ID',
        accessor: '_id',
        render: (row) => (
          <span className="font-bold text-slate-900 font-mono text-xs">{row._id}</span>
        ),
      },
      {
        header: 'Customer',
        accessor: 'customerName',
        render: (row) => (
          <div>
            <p className="font-semibold text-slate-900">{row.customerName || '—'}</p>
            <p className="text-[11px] text-slate-400 font-mono">{row.vehicleNumber || '—'}</p>
          </div>
        ),
      },
      {
        header: 'Station',
        accessor: 'stationName',
        render: (row) => (
          <span className="font-medium text-slate-700">{row.stationName || '—'}</span>
        ),
      },
      {
        header: 'Energy (kWh)',
        accessor: 'energyConsumed',
        render: (row) => (
          <span className="font-bold text-primary-600">
            {(Number(row.energyConsumed) || 0).toFixed(1)} kWh
          </span>
        ),
      },
      {
        header: 'Duration',
        accessor: 'duration',
        render: (row) => (
          <span className="text-xs font-semibold text-slate-600">
            {row.duration == null ? '—' : formatDuration(row.duration)}
          </span>
        ),
      },
      {
        header: 'Status',
        accessor: 'sessionStatus',
        render: (row) => <StatusBadge status={row.sessionStatus || 'Unknown'} />,
      },
      {
        header: 'Time',
        accessor: 'startTime',
        render: (row) => (
          <span className="text-xs text-slate-500">
            {row.startTime ? formatDateTime(row.startTime) : '—'}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <PageHeader
        title="Admin Executive Dashboard"
        description="Real-time monitoring of EV network infrastructure, customer volume, and booking analytics"
        actions={
          <>
            <Link to="/admin/stations">
              <Button variant="outline" size="sm" icon={FiPlus}>
                Add Station
              </Button>
            </Link>
            <Link to="/admin/managers">
              <Button variant="primary" size="sm" icon={FiUserCheck}>
                Add Manager
              </Button>
            </Link>
          </>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Customers"
          value={customers.length}
          subtitle="Registered EV Drivers"
          icon={FiUsers}
          color="primary"
        />
        <StatsCard
          title="Charging Stations"
          value={stations.length}
          subtitle="Active Network Hubs"
          icon={FiMapPin}
          color="emerald"
        />
        <StatsCard
          title="Station Managers"
          value={managers.length}
          subtitle="On-Site Shift Operators"
          icon={FiUserCheck}
          color="amber"
        />
        <StatsCard
          title="Charging Sessions"
          value={stats?.todaySessions ?? sessions.length}
          subtitle="Recorded sessions"
          icon={FiZap}
          color="indigo"
        />
      </div>

      {/* BOOKING ANALYTICS SECTION */}
      <div className="space-y-4 pt-2 border-t border-slate-200/80">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FiBarChart2 className="text-primary-600" /> Centralized Booking Analytics
            </h3>
            <p className="text-xs text-slate-500">Comprehensive breakdown across total, successful, waiting, completed & cancelled bookings</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <FiTrendingUp /> Booking Success Rate: <strong>{bookingAnalytics.successRatePct}%</strong>
            </span>
            <span className="text-xs font-extrabold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Cancellation: <strong>{bookingAnalytics.cancellationRatePct}%</strong>
            </span>
          </div>
        </div>

        {/* 5 Booking Analytics Statistic Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total Bookings"
            value={bookingAnalytics.totalBookings}
            subtitle="All time reservations"
            icon={FiCalendar}
            color="primary"
          />
          <StatsCard
            title="Successful Bookings"
            value={bookingAnalytics.successfulBookings}
            subtitle="Confirmed & Completed"
            icon={FiCheckSquare}
            color="emerald"
          />
          <StatsCard
            title="Cancelled Bookings"
            value={bookingAnalytics.cancelledBookings}
            subtitle="Driver cancelled"
            icon={FiXCircle}
            color="rose"
          />
          <StatsCard
            title="Waiting Bookings"
            value={bookingAnalytics.waitingBookings}
            subtitle="In queue line"
            icon={FiClock}
            color="amber"
          />
          <StatsCard
            title="Completed Sessions"
            value={completedSessionCount}
            subtitle="Fully charged sessions"
            icon={FiZap}
            color="indigo"
          />
        </div>

        {/* Charts Grid: Pie Chart + Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart Card */}
          <Card>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FiPieChart className="text-primary-600 text-lg" />
                <h4 className="font-bold text-slate-900 text-sm">Booking Status Distribution (Pie Chart)</h4>
              </div>
              <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {bookingAnalytics.successRatePct}% Success Rate
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
              <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 stroke-current"
                    strokeWidth="4"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {bookingStatusSegments.reduce(
                    (segments, segment) => {
                      const percentage = bookingAnalytics.totalBookings
                        ? (segment.count / bookingAnalytics.totalBookings) * 100
                        : 0;
                      segments.elements.push(
                        <path
                          key={segment.label}
                          className={`${segment.color} stroke-current transition-all duration-700`}
                          strokeDasharray={`${percentage}, 100`}
                          strokeDashoffset={`-${segments.offset}`}
                          strokeWidth="4.5"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      );
                      segments.offset += percentage;
                      return segments;
                    },
                    { elements: [], offset: 0 }
                  ).elements}
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-900">{bookingAnalytics.totalBookings}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                {bookingStatusSegments.map((segment) => {
                  const percentage = bookingAnalytics.totalBookings
                    ? Math.round((segment.count / bookingAnalytics.totalBookings) * 100)
                    : 0;
                  return (
                    <div key={segment.label} className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${segment.bg} shrink-0`} />
                      <span className="text-slate-600 font-medium">{segment.label}:</span>
                      <strong className="text-slate-900">{segment.count} ({percentage}%)</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Bar Chart Card */}
          <Card>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FiBarChart2 className="text-primary-600 text-lg" />
                <h4 className="font-bold text-slate-900 text-sm">Booking Volume Comparison (Bar Chart)</h4>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Live Volume</span>
            </div>

            <div className="grid grid-cols-5 gap-3 items-end h-44 pt-6 pb-2 border-b border-slate-100">
              {[
                { name: 'Total', count: bookingAnalytics.totalBookings, color: 'bg-primary-600', text: 'text-primary-600' },
                { name: 'Successful', count: bookingAnalytics.successfulBookings, color: 'bg-emerald-500', text: 'text-emerald-600' },
                { name: 'Completed', count: bookingAnalytics.completedBookings, color: 'bg-indigo-600', text: 'text-indigo-600' },
                { name: 'Waiting', count: bookingAnalytics.waitingBookings, color: 'bg-amber-500', text: 'text-amber-600' },
                { name: 'Cancelled', count: bookingAnalytics.cancelledBookings, color: 'bg-rose-500', text: 'text-rose-600' },
              ].map((bar) => {
                const heightPct = bookingAnalytics.totalBookings
                  ? Math.round((bar.count / bookingAnalytics.totalBookings) * 100)
                  : 0;
                return (
                  <div key={bar.name} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className={`text-xs font-extrabold ${bar.text}`}>{bar.count}</span>
                    <div
                      className={`w-full max-w-[36px] ${bar.color} rounded-t-xl transition-all duration-500 shadow-xs group-hover:brightness-110`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[11px] font-bold text-slate-600 truncate w-full text-center">
                      {bar.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Operational Overview & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary-50 text-primary-600 text-lg">
                  <FiActivity />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Network Operational Capacity</h3>
                  <p className="text-xs text-slate-500">Live slot occupancy across {stations.length} hubs</p>
                </div>
              </div>
              <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200">
                {occupancyPct}% occupied
              </span>
            </div>

            <div className="space-y-4 my-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Occupied charging slots</span>
                  <span className="text-primary-600 font-bold">{occupiedSlots} / {totalSlots} Slots ({occupancyPct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-primary-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${occupancyPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Available now: <strong className="text-slate-800">{availableSlots} slots</strong></span>
            <Link to="/admin/reports" className="font-bold text-primary-600 hover:underline flex items-center gap-1">
              View Detailed Analytics
            </Link>
          </div>
        </Card>

        {/* Revenue Card */}
        <Card className="flex flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-950 text-white">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Network Financial Summary
              </span>
              <div className="p-2 rounded-xl bg-white/10 text-emerald-400 text-lg">
                <FiDollarSign />
              </div>
            </div>

            <p className="text-3xl font-extrabold text-white tracking-tight">
              {stats?.totalRevenue ?? '₹0.00'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Estimated from recorded energy at ₹15/kWh</p>

            <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Recorded energy dispensed</span>
                <span className="font-bold text-emerald-400">
                  {energyConsumed.toFixed(1)} kWh
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Average energy per session</span>
                <span className="font-bold text-white">{averageEnergyPerSession} kWh</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Active charging sessions</span>
                <span className="font-bold text-white">
                  {stats?.activeVehiclesCharging ?? sessions.filter((session) => session.sessionStatus === 'Charging').length}
                </span>
              </div>
            </div>
          </div>

          <Link to="/admin/reports" className="mt-6">
            <Button variant="outline" fullWidth size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              View Reports
            </Button>
          </Link>
        </Card>
      </div>

      {/* Recent Charging Sessions Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Charging Sessions</h3>
            <p className="text-xs text-slate-500">Latest recorded and active EV charging sessions</p>
          </div>
          <Link to="/admin/reports">
            <Button variant="ghost" size="sm" icon={FiBarChart2}>
              View All History
            </Button>
          </Link>
        </div>

        <DataTable columns={columns} data={sessions.slice(0, 6)} isLoading={loading} itemsPerPage={5} />
      </div>
    </div>
  );
};
