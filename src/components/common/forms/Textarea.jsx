import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Textarea = forwardRef(
  ({ label, error, helperText, rows = 3, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={twMerge(
            clsx(
              'block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-slate-50 disabled:text-slate-500',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
              className
            )
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
