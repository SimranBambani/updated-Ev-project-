import React from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiHome } from 'react-icons/fi';

export const Breadcrumb = ({ items = [] }) => {
  return (
    <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4">
      <Link to="/" className="flex items-center gap-1 hover:text-slate-900 transition">
        <FiHome className="text-sm" />
        <span>Home</span>
      </Link>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <FiChevronRight className="text-slate-300" />
          {item.path ? (
            <Link to={item.path} className="hover:text-slate-900 transition">
              {item.label}
            </Link>
          ) : (
            <span className="text-primary-600 font-bold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
