import React from 'react';
import { getStatusBadgeStyle } from '../../../utils/helpers';
import { clsx } from 'clsx';

export const StatusBadge = ({ status, className = '' }) => {
  const badgeStyle = getStatusBadgeStyle(status);

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs',
        badgeStyle,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {status}
    </span>
  );
};
