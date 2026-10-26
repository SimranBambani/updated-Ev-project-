import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Select = forwardRef(
  ({ label, options = [], error, helperText, icon: Icon, placeholder = 'Select an option', className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-sm">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Icon className="text-lg" />
            </div>
          )}
          <select
            ref={ref}
            className={twMerge(
              clsx(
                'block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm text-slate-900 shadow-sm transition duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-slate-50 disabled:text-slate-500 appearance-none bg-no-repeat bg-[right_1rem_center]',
                Icon && 'pl-10',
                error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
                className
              )
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt, idx) => {
              const value = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              return (
                <option key={idx} value={value}>
                  {optLabel}
                </option>
              );
            })}
          </select>
        </div>
        {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
