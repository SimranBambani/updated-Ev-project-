import React from 'react';
import { FiNavigation } from 'react-icons/fi';

export const UserLocationMarker = ({ location }) => {
  return (
    <div className="absolute flex flex-col items-center justify-center z-15">
      <div className="relative flex items-center justify-center">
        <span className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-primary-400 opacity-75" />
        <div className="relative w-9 h-9 rounded-full bg-primary-600 border-2 border-white text-white flex items-center justify-center shadow-lg">
          <FiNavigation className="text-base animate-pulse" />
        </div>
      </div>
      <div className="mt-1 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-bold text-white shadow-sm">
        Your Location
      </div>
    </div>
  );
};
