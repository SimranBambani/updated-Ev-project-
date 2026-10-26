import React from 'react';
import { FiZap, FiMapPin, FiStar, FiNavigation } from 'react-icons/fi';
import { clsx } from 'clsx';

export const StationMarker = ({ station, isSelected, onClick }) => {
  const isAvailable = (station.availableSlots || 0) > 0;

  return (
    <div className="relative group cursor-pointer" onClick={onClick}>
      {/* Google Maps Pin Marker */}
      <button
        type="button"
        className={clsx(
          'relative flex items-center gap-2 px-3 py-2 rounded-2xl shadow-xl transition-all duration-300 border focus:outline-none backdrop-blur-md',
          isSelected
            ? 'bg-primary-600 text-white border-white ring-4 ring-primary-400/40 scale-110 z-30'
            : isAvailable
            ? 'bg-slate-900/90 text-white border-emerald-500/50 hover:border-primary-400 hover:scale-105 z-10'
            : 'bg-slate-900/80 text-slate-400 border-rose-500/40 opacity-75'
        )}
      >
        <div
          className={clsx(
            'w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm',
            isAvailable ? 'bg-emerald-500 text-slate-950 animate-pulse' : 'bg-rose-500 text-white'
          )}
        >
          <FiZap />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold leading-tight line-clamp-1 max-w-[130px]">
            {station.stationName}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
            <span
              className={clsx(
                'font-extrabold px-1.5 py-0.2 rounded-md',
                isAvailable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-300'
              )}
            >
              {station.availableSlots}/{station.totalSlots} Free
            </span>
            {station.formattedDistance && (
              <span className="text-slate-300 flex items-center gap-0.5">
                <FiNavigation className="text-[9px]" /> {station.formattedDistance}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Pin Pointer Stem */}
      <div
        className={clsx(
          'w-2 h-2 mx-auto -mt-1 rotate-45 transition-colors',
          isSelected ? 'bg-primary-600' : 'bg-slate-900/90'
        )}
      />

      {/* Hover Google Maps Style Popup Card */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-40 w-56 bg-slate-900/95 text-white p-3 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-lg pointer-events-none animate-fadeIn">
        <div className="flex justify-between items-start mb-1">
          <h5 className="font-bold text-xs text-white leading-snug">{station.stationName}</h5>
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 bg-amber-400/20 px-1.5 py-0.5 rounded">
            <FiStar className="fill-current text-[9px]" /> {station.avgRating || 4.8}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-2">
          <FiMapPin className="text-primary-400" /> {station.address}
        </p>
        <div className="flex justify-between text-[11px] pt-1.5 border-t border-slate-800 text-slate-300 font-medium">
          <span>Price: <strong className="text-emerald-400">{station.pricingPerKWh || '₹15'}</strong>/kWh</span>
          <span>Wait: <strong className="text-amber-300">{station.formattedWaiting || 'No Wait'}</strong></span>
        </div>
      </div>
    </div>
  );
};
