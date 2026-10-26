import React, { useState, useRef, useEffect } from 'react';
import { FiBell, FiCheckCircle, FiInfo, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { useNotification } from '../../../hooks/useNotification';
import { formatTime } from '../../../utils/helpers';

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-xs"
        aria-label="Notifications"
      >
        <FiBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white border border-slate-100 shadow-modal z-50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
              <p className="text-xs text-slate-500">{unreadCount} unread messages</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <FiCheck /> Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No notifications</div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n._id}
                  onClick={() => markAsRead(n._id)}
                  className={`p-4 transition cursor-pointer hover:bg-slate-50 ${
                    n.status === 'Unread' ? 'bg-primary-50/30 font-medium' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary-100 text-primary-600 text-sm mt-0.5">
                      <FiInfo />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-900">{n.title}</h5>
                        <span className="text-[10px] text-slate-400">{formatTime(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
