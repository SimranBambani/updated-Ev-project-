import React from 'react';
import { clsx } from 'clsx';

export const Badge = ({ children, variant = 'primary', size = 'sm', className = '' }) => {
  const variants = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    secondary: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-semibold rounded-md border',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};
