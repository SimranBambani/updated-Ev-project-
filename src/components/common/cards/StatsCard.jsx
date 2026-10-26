import React from 'react';
import { Card } from './Card';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { clsx } from 'clsx';

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'primary',
  className = '',
}) => {
  const colorStyles = {
    primary: 'bg-primary-50 text-primary-600 border-primary-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <Card className={clsx('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
            {value}
          </h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div
            className={clsx(
              'p-3.5 rounded-2xl border flex items-center justify-center',
              colorStyles[color] || colorStyles.primary
            )}
          >
            <Icon className="text-xl lg:text-2xl" />
          </div>
        )}
      </div>

      {trendValue && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold">
          {trend === 'up' ? (
            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              <FiTrendingUp /> {trendValue}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
              <FiTrendingDown /> {trendValue}
            </span>
          )}
          <span className="text-slate-400 font-normal">vs last week</span>
        </div>
      )}
    </Card>
  );
};
