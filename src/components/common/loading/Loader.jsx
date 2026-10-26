import React from 'react';
import { FiZap } from 'react-icons/fi';

export const Loader = ({ fullScreen = false, label = 'Loading VoltFlow System...' }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/30 mb-4 animate-bounce">
        <FiZap className="text-3xl" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
