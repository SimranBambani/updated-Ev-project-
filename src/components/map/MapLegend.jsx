import React from 'react';

export const MapLegend = () => {
  return (
    <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 text-[11px] font-medium text-slate-300">
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        <span>Slots Free</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
        <span>Fully Occupied</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
        <span>Selected</span>
      </div>
    </div>
  );
};
