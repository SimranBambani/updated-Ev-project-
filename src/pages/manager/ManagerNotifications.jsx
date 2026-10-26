import React, { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { NotificationContext } from '../../context/NotificationContext';
import { PageHeader } from '../../components/common/layout/PageHeader';
import { Card } from '../../components/common/cards/Card';
import { Button } from '../../components/common/buttons/Button';
import { StatusBadge } from '../../components/common/badge/StatusBadge';
import { formatDateTime } from '../../utils/helpers';
import {
  FiBell,
  FiCheckCircle,
  FiAlertCircle,
  FiCheck,
  FiSliders,
  FiActivity,
  FiTool,
  FiAlertTriangle,
  FiClock,
} from 'react-icons/fi';

export const ManagerNotifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useContext(NotificationContext);

  // Filter ONLY unread manager operational alerts so read notifications immediately disappear
  const unreadManagerNotifications = useMemo(() => {
    return (notifications || []).filter(
      (n) =>
        n.status === 'Unread' &&
        [
          'BATTERY_HEALTH_LOW',
          'BATTERY_MAINTENANCE_REQUIRED',
          'BATTERY_OUT_OF_SERVICE',
          'HEAVY_QUEUE_ALERT',
          'QUEUE_EXCEEDS_SLOTS',
          'CHARGING_COMPLETE',
          'VEHICLE_REMOVAL',
          'SLOT_ALLOCATED',
        ].includes(n.notificationType)
    );
  }, [notifications]);

  const getPriorityBadge = (priority = 'Low') => {
    switch (priority) {
      case 'High':
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'Medium':
      case 'Warning':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 font-semibold';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Station Manager Alerts & Operational Notifications"
        description="Real-time unread alerts for battery health low, maintenance, out-of-service packs, and queue overload"
        actions={
          unreadManagerNotifications.length > 0 && (
            <Button variant="outline" icon={FiCheck} onClick={markAllAsRead}>
              Mark All as Read
            </Button>
          )
        }
      />

      <div className="space-y-4">
        {unreadManagerNotifications.length === 0 ? (
          <Card className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
            <FiCheckCircle className="text-3xl text-emerald-500 mb-2" />
            <p className="font-bold text-slate-800 text-sm">No unread operational alerts!</p>
            <p className="text-xs text-slate-500 mt-1">All manager alerts have been read and dismissed.</p>
          </Card>
        ) : (
          unreadManagerNotifications.map((notif) => {
            const isComplete = notif.notificationType === 'CHARGING_COMPLETE';
            const isHeavyQueue = notif.notificationType === 'HEAVY_QUEUE_ALERT' || notif.notificationType === 'QUEUE_EXCEEDS_SLOTS';
            const isBatteryLow = notif.notificationType === 'BATTERY_HEALTH_LOW';
            const isBatteryMaint = notif.notificationType === 'BATTERY_MAINTENANCE_REQUIRED';
            const isBatteryOut = notif.notificationType === 'BATTERY_OUT_OF_SERVICE';

            return (
              <Card
                key={notif._id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition bg-primary-50/20 border-primary-200"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                      isHeavyQueue || isBatteryOut
                        ? 'bg-rose-100 text-rose-700 animate-pulse'
                        : isBatteryLow || isBatteryMaint
                        ? 'bg-amber-100 text-amber-700'
                        : isComplete
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {isHeavyQueue ? (
                      <FiAlertTriangle />
                    ) : isBatteryLow ? (
                      <FiActivity />
                    ) : isBatteryMaint ? (
                      <FiTool />
                    ) : isBatteryOut ? (
                      <FiAlertCircle />
                    ) : isComplete ? (
                      <FiCheckCircle />
                    ) : (
                      <FiBell />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${getPriorityBadge(
                          notif.priority || 'Low'
                        )}`}
                      >
                        Priority: {notif.priority || 'Low'}
                      </span>
                      <StatusBadge status="Pending" />
                    </div>
                    <p className="text-xs text-slate-600">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-medium flex items-center gap-1">
                      <FiClock className="text-slate-400" /> Time: {formatDateTime(notif.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isHeavyQueue && (
                    <Link to="/manager/allocation">
                      <Button variant="primary" size="sm" icon={FiSliders}>
                        Manage Queue
                      </Button>
                    </Link>
                  )}
                  {(isBatteryLow || isBatteryMaint || isBatteryOut) && (
                    <Link to="/manager/battery">
                      <Button variant="outline" size="sm" icon={FiTool}>
                        Inspect Battery
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => markAsRead(notif._id)}>
                    Mark as Read
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
