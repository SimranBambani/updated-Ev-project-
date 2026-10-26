import React from 'react';
import { NotificationBell } from '../notifications/NotificationBell';
import { useAuth } from '../../../hooks/useAuth';
import { FiUser, FiLogOut, FiMenu, FiZap } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar = ({ onToggleSidebar, title = 'Dashboard' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
              aria-label="Toggle Navigation"
            >
              <FiMenu className="text-xl" />
            </button>
          )}

          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center font-black text-lg">
              <FiZap />
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">VoltFlow</span>
          </div>

          <h1 className="hidden lg:block text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          <NotificationBell />

          {/* User Profile Pill */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <Link
              to="/profile"
              className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 transition"
            >
              <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 border border-primary-200 font-bold flex items-center justify-center text-sm shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : <FiUser />}
              </div>
              <div className="hidden sm:block text-left pr-2">
                <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] font-semibold text-primary-600 uppercase tracking-wider">
                  {user?.role || 'Guest'}
                </p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Sign Out"
            >
              <FiLogOut className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
