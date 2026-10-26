import React from 'react';

export const RoutePolyline = ({ isVisible = true }) => {
  if (!isVisible) return null;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <path
        d="M 180 280 Q 320 180 460 320 T 620 220"
        fill="none"
        stroke="#2563EB"
        strokeWidth="4"
        strokeDasharray="8 6"
        className="animate-pulse"
      />
    </svg>
  );
};
