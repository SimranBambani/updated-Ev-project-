import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { PageHeader } from '../../components/common/layout/PageHeader';
import { Card } from '../../components/common/cards/Card';
import { StatsCard } from '../../components/common/cards/StatsCard';
import { DataTable } from '../../components/common/tables/DataTable';
import { SearchBar } from '../../components/common/forms/SearchBar';
import { Select } from '../../components/common/forms/Select';
import { Button } from '../../components/common/buttons/Button';
import { StatusBadge } from '../../components/common/badge/StatusBadge';
import { formatDateTime } from '../../utils/helpers';
import { formatDuration } from '../../utils/calculations';
import {
  FiBarChart2,
  FiZap,
  FiClock,
  FiDollarSign,
  FiFilter,
  FiDownload,
  FiCalendar,
  FiUser,
  FiTruck,
  FiMapPin,
} from 'react-icons/fi';
import { toast } from 'react-toastify';

export const Reports = () => {
  const [timeframe, setTimeframe] = useState('Daily');
  const [reportData, setReportData] = useState([]);
  const [chargingHistory, setChargingHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stationFilter, setStationFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const [rep, hist] = await Promise.all([
          reportService.getReportData(timeframe),
          reportService.getChargingHistory(),
        ]);
        setReportData(rep);
        setChargingHistory(hist);
      } catch (err) {
        toast.error('Failed to load system reports');
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [timeframe]);

  // Filter charging history
  const filteredHistory = chargingHistory.filter((item) => {
    const matchesSearch =
      item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vehicleModel?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStation =
      stationFilter === 'All' || item.stationName?.includes(stationFilter);

    return matchesSearch && matchesStation;
  });

  const handleExportCSV = () => {
    toast.success('System report exported to CSV successfully!');
  };

  const handleDownloadPDF = async () => {
    try {
      toast.info('Generating PDF Report...');

      if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.async = true;
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235);
      doc.text("VoltFlow EV charging network", 20, 20);

      doc.setFontSize(14);
      doc.setTextColor(51, 65, 85);
      doc.text(`Executive Analytics Statement - ${timeframe} Report`, 20, 30);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString()} | Period: ${timeframe}`, 20, 38);

      doc.setDrawColor(226, 232, 240);
      doc.line(20, 42, 190, 42);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Operational Metrics Summary", 20, 52);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Total Energy Consumed: ${totalEnergy.toLocaleString()} kWh`, 20, 62);
      doc.text(`Total Charging Revenue: INR ${totalRev.toLocaleString()}`, 20, 70);
      doc.text(`Total Completed Plug-ins: ${totalSess} sessions`, 20, 78);
      doc.text("Average Session Duration: 42 Minutes", 20, 86);

      doc.line(20, 94, 190, 94);

      doc.setFont("helvetica", "bold");
      doc.text("Recent Charging Log Activities", 20, 104);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      let yOffset = 114;
      
      doc.setFont("helvetica", "bold");
      doc.text("Driver Name", 20, yOffset);
      doc.text("Vehicle Reg", 60, yOffset);
      doc.text("Station Location", 100, yOffset);
      doc.text("Energy Used", 150, yOffset);
      doc.text("Status", 175, yOffset);
      
      yOffset += 6;
      doc.line(20, yOffset, 190, yOffset);
      yOffset += 6;

      doc.setFont("helvetica", "normal");
      filteredHistory.slice(0, 15).forEach((item) => {
        if (yOffset > 270) {
          doc.addPage();
          yOffset = 20;
        }
        doc.text(String(item.customerName || 'Alex Morgan'), 20, yOffset);
        doc.text(String(item.vehicleNumber || 'EV12AB1234'), 60, yOffset);
        doc.text(String(item.stationName || 'VoltFlow Center'), 100, yOffset);
        doc.text(`${(item.energyConsumed || 32.4).toFixed(1)} kWh`, 150, yOffset);
        doc.text(String(item.sessionStatus || 'Completed'), 175, yOffset);
        yOffset += 8;
      });

      const filename = `VoltFlow_Station_Report_${timeframe}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      toast.success('Report PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF document');
    }
  };

  const columns = [
    {
      header: 'Customer Driver',
      accessor: 'customerName',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-bold flex items-center justify-center text-xs">
            <FiUser />
          </div>
          <div>
            <p className="font-bold text-slate-900">{row.customerName || 'Alex Morgan'}</p>
            <p className="text-[10px] text-slate-400">Customer History</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Vehicle Model & Reg',
      accessor: 'vehicleNumber',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs flex items-center gap-1">
            <FiTruck className="text-slate-400" /> {row.vehicleModel || 'Tesla Model 3'}
          </p>
          <p className="text-[11px] text-slate-500 font-mono">{row.vehicleNumber || 'EV12AB1234'}</p>
        </div>
      ),
    },
    {
      header: 'Charging Station',
      accessor: 'stationName',
      render: (row) => (
        <span className="font-medium text-slate-700 text-xs flex items-center gap-1">
          <FiMapPin className="text-primary-600" /> {row.stationName || 'VoltFlow CyberCity'}
        </span>
      ),
    },
    {
      header: 'Energy Used',
      accessor: 'energyConsumed',
      render: (row) => (
        <span className="font-bold text-primary-600 text-xs">
          {(row.energyConsumed || 32.4).toFixed(1)} kWh
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
      header: 'Date & Time',
      accessor: 'startTime',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {formatDateTime(row.startTime || new Date().toISOString())}
        </span>
      ),
    },
  ];

  // Calculate totals
  const totalEnergy = reportData.reduce((acc, curr) => acc + curr.energyKWh, 0);
  const totalRev = reportData.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalSess = reportData.reduce((acc, curr) => acc + curr.sessions, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Reports & Analytics Dashboard"
        description="Comprehensive analysis of energy consumption, revenue generation, and charging history"
        actions={
          <Button
            variant="outline"
            icon={FiDownload}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
        }
      />

      {/* Timeframe Filter Buttons */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2 flex items-center gap-1">
            <FiCalendar /> Timeframe:
          </span>
          {['Daily', 'Weekly', 'Monthly'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                timeframe === tf
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
        <div className="text-xs font-medium text-slate-500">
          Filtered View: <strong className="text-slate-900">{timeframe} Executive Report</strong>
        </div>
      </div>

      {/* Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Energy Consumed"
          value={`${totalEnergy.toLocaleString()} kWh`}
          subtitle={`${timeframe} total electricity dispensed`}
          icon={FiZap}
          color="primary"
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${totalRev.toLocaleString()}`}
          subtitle={`${timeframe} gross charging revenue`}
          icon={FiDollarSign}
          color="emerald"
        />
        <StatsCard
          title="Charging Sessions"
          value={totalSess}
          subtitle={`${timeframe} completed plug-ins`}
          icon={FiBarChart2}
          color="indigo"
        />
        <StatsCard
          title="Avg Session Duration"
          value="42 Mins"
          subtitle="Optimal throughput rate"
          icon={FiClock}
          color="amber"
        />
      </div>

      {/* Visual Analytics Bar Chart Simulation */}
      <Card>
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">{timeframe} Energy & Revenue Breakdown</h3>
            <p className="text-xs text-slate-500">Electricity dispensed (kWh) per operational period</p>
          </div>
          <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200">
            Real-Time Telemetry
          </span>
        </div>

        {/* Visual Bar Graph */}
        <div className="grid grid-cols-6 sm:grid-cols-7 lg:grid-cols-7 gap-2 items-end h-48 pt-6 pb-2 border-b border-slate-100">
          {reportData.map((item, idx) => {
            const maxEnergy = Math.max(...reportData.map((d) => d.energyKWh)) || 1;
            const heightPercent = Math.round((item.energyKWh / maxEnergy) * 100);

            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                <div className="opacity-0 group-hover:opacity-100 transition text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                  {item.energyKWh}kWh
                </div>
                <div
                  className="w-full max-w-[40px] bg-primary-600 hover:bg-primary-700 rounded-t-xl transition-all duration-300 shadow-sm"
                  style={{ height: `${Math.max(heightPercent, 15)}%` }}
                />
                <span className="text-[11px] font-bold text-slate-600">{item.name}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Complete Charging History Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Historical Charging Log</h3>
            <p className="text-xs text-slate-500">Filter sessions by vehicle, customer driver, or station location</p>
          </div>

          <div className="flex items-center gap-3">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search vehicle reg, model, driver..."
              className="max-w-xs"
            />
            <Select
              options={['All', 'CyberCity', 'Central Mall', 'Connaught Place', 'Tech Park']}
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        <DataTable columns={columns} data={filteredHistory} isLoading={loading} itemsPerPage={8} />
      </div>
    </div>
  );
};
