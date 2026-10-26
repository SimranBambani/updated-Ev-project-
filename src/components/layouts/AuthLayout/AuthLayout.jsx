import React from 'react';
import { Outlet } from 'react-router-dom';
import { FiZap, FiShield, FiClock, FiCpu } from 'react-icons/fi';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-primary-500/10 via-primary-500/5 to-transparent pointer-events-none blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-primary-600 text-white font-extrabold text-2xl shadow-xl shadow-primary-600/30 mb-4">
          <FiZap />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">VoltFlow</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Smart EV Charging Management & Queue Engine
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-card rounded-3xl border border-slate-200/80">
          <Outlet />
        </div>

        {/* Startup trust highlights */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500 font-semibold">
          <div className="flex flex-col items-center gap-1">
            <FiClock className="text-primary-600 text-base" />
            <span>Real-Time ETAs</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <FiCpu className="text-primary-600 text-base" />
            <span>AI Slot Manager</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <FiShield className="text-primary-600 text-base" />
            <span>Enterprise Security</span>
          </div>
        </div>
      </div>
    </div>
  );
};
