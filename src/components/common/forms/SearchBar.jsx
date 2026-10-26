import React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search by name, ID, or vehicle number...',
  className = '',
}) => {
  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <FiSearch className="text-lg" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
        >
          <FiX className="text-lg" />
        </button>
      )}
    </div>
  );
};
