import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiZap, FiX } from 'react-icons/fi';
import { clsx } from 'clsx';

export const Sidebar = ({ navItems = [], isOpen, onClose, roleTitle = 'Portal' }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-slate-800 shadow-2xl lg:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-primary-600/30">
                <FiZap />
              </div>
              <div>
                <span className="font-extrabold text-white text-lg tracking-tight block leading-tight">
                  VoltFlow
                </span>
                <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest block">
                  {roleTitle}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item, idx) => (
              <NavLink
                key={idx}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  )
                }
              >
                {item.icon && <item.icon className="text-lg" />}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* System Version Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 text-center">
          <div className="bg-slate-800/60 rounded-xl p-3 text-left">
            <p className="text-[11px] font-bold text-slate-200">Smart EV Platform</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Real-Time Slot Engine v1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
};
