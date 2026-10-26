import React, { useContext, useMemo } from 'react';
import { NotificationContext } from '../../context/NotificationContext';
import { PageHeader } from '../../components/common/layout/PageHeader';
import { Card } from '../../components/common/cards/Card';
import { Button } from '../../components/common/buttons/Button';
import { StatusBadge } from '../../components/common/badge/StatusBadge';
import { formatDateTime } from '../../utils/helpers';
import { FiCheckCircle, FiInfo, FiCheck, FiZap } from 'react-icons/fi';

export const CustomerNotifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useContext(NotificationContext);

  // Requirement: Only unread notifications should remain visible. Once marked as read, they immediately disappear.
  const unreadNotifications = useMemo(
    () => (notifications || []).filter((n) => n.status === 'Unread'),
    [notifications]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & Charging Alerts"
        description="Real-time unread updates on slot allocations, battery charging progress, and session completion"
        actions={
          unreadNotifications.length > 0 && (
            <Button variant="outline" icon={FiCheck} onClick={markAllAsRead}>
              Mark All as Read
            </Button>
          )
        }
      />

      <div className="space-y-4">
        {unreadNotifications.length === 0 ? (
          <Card className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
            <FiCheckCircle className="text-3xl text-emerald-500 mb-2" />
            <p className="font-bold text-slate-800 text-sm">All caught up!</p>
            <p className="text-xs text-slate-500 mt-1">No unread notifications at this time.</p>
          </Card>
        ) : (
          unreadNotifications.map((notif) => {
            const isComplete = notif.notificationType === 'CHARGING_COMPLETE';
            const isAllocated = notif.notificationType === 'SLOT_ALLOCATED';

            return (
              <Card
                key={notif._id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition bg-primary-50/20 border-primary-200"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                      isComplete
                        ? 'bg-emerald-100 text-emerald-700'
                        : isAllocated
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isComplete ? <FiCheckCircle /> : isAllocated ? <FiZap /> : <FiInfo />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                      <StatusBadge status="Pending" />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                      {formatDateTime(notif.createdAt)}
                    </p>
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={() => markAsRead(notif._id)}>
                  Mark as Read
                </Button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
