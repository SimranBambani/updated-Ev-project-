import React from 'react';
import { clsx } from 'clsx';

export const Skeleton = ({ className = '' }) => {
  return (
    <div
      className={clsx(
        'animate-pulse bg-slate-200/80 rounded-xl',
        className
      )}
    />
  );
};
