import React from 'react';

export const PageHeader = ({ title, description, actions, children }) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
      {children}
    </div>
  );
};
