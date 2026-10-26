import React from 'react';
import { FiInbox } from 'react-icons/fi';
import { Button } from '../buttons/Button';

export const EmptyState = ({
  icon: Icon = FiInbox,
  title = 'No Data Found',
  message = 'We couldn\'t find any records matching your request.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center text-3xl mb-4 border border-slate-200/60">
        <Icon />
      </div>
      <h4 className="text-base font-bold text-slate-800 tracking-tight mb-1">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed mb-5">{message}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
