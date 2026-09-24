import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AppNotification } from '../../types';
import { Bell, CheckCheck, Clock, ShieldCheck, ShoppingBag, MessageSquare, AlertCircle } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';

export const NotificationsPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.warn('Could not fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {}
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'verification_approved':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'verification_rejected':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      case 'order_created':
      case 'order_status_updated':
        return <ShoppingBag className="w-5 h-5 text-blue-600" />;
      case 'message_received':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Corporate Notifications & Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            System dispatches on verification status, order updates, and B2B inquiries.
          </p>
        </div>

        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications found."
          description="You are fully up to date. Important regulatory approvals, procurement updates, and buyer messages will appear here."
          icon={Bell}
        />
      ) : (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs divide-y divide-slate-100">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.isRead) handleMarkAsRead(n.id);
                if (n.link) navigate(n.link);
              }}
              className={`py-4 px-3 rounded-xl transition-colors flex items-start gap-4 cursor-pointer ${
                n.isRead ? 'opacity-80 hover:bg-slate-50' : 'bg-slate-50/80 hover:bg-slate-100/70'
              }`}
            >
              <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0">
                {getNotificationIcon(n.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs ${n.isRead ? 'font-semibold text-slate-700' : 'font-bold text-slate-900'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {n.message}
                </p>
              </div>

              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
