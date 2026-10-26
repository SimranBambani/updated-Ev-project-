import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 transition-all duration-200',
          hover && 'hover:shadow-card-hover hover:border-primary-200 hover:-translate-y-0.5',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
