import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/supabase/auth';
import type { NotificationRecord } from '@/types/backend';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
  subscribeToNotifications,
} from '@/lib/notifications/notificationService';
import { getNotificationTarget } from '@/lib/notifications/notificationUtils';
import { supabase } from '@/lib/supabase/client';

interface NotificationBellProps {
  userType: 'studio' | 'pro';
}

function formatRelativeTime(dateIso: string): string {
  const timestamp = new Date(dateIso).getTime();
  if (Number.isNaN(timestamp)) return '';

  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "à l'instant";
  if (diff < hour) return `il y a ${Math.max(1, Math.floor(diff / minute))} min`;
  if (diff < day) return `il y a ${Math.max(1, Math.floor(diff / hour))} h`;
  return `il y a ${Math.max(1, Math.floor(diff / day))} j`;
}

function upsertNotification(
  previous: NotificationRecord[],
  incoming: NotificationRecord,
): NotificationRecord[] {
  const exists = previous.some((item) => item.id === incoming.id);
  const next = exists
    ? previous.map((item) => (item.id === incoming.id ? { ...item, ...incoming } : item))
    : [incoming, ...previous];

  return next.sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

export function NotificationBell(_props: NotificationBellProps) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const rows = await getNotifications(userId);
        if (!active) return;
        setNotifications(rows);
      } catch {
        if (!active) return;
        setNotifications([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    const channel = subscribeToNotifications(userId, (incoming) => {
      setNotifications((previous) => upsertNotification(previous, incoming));
    });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!panelRef.current) return;
      if (panelRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const handleNotificationClick = async (notification: NotificationRecord) => {
    if (busy) return;

    setBusy(true);
    try {
      if (!notification.read) {
        await markAsRead(notification.id);
        setNotifications((previous) => previous.map((item) => (
          item.id === notification.id ? { ...item, read: true } : item
        )));
      }
    } finally {
      setBusy(false);
      setOpen(false);
      navigate(getNotificationTarget(notification));
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId || unreadCount === 0 || busy) return;

    setBusy(true);
    try {
      await markAllAsRead(userId);
      setNotifications((previous) => previous.map((item) => ({ ...item, read: true })));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        id="btn-notification-bell"
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/60 shadow-sm transition-colors hover:bg-white"
      >
        <Bell size={20} className="text-black/70" />
        {unreadCount > 0 ? (
          <span
            id="notification-badge"
            className="absolute -right-1 -top-1 min-w-[18px] rounded-full border-2 border-[#f4ece4] bg-orange-500 px-1 text-center text-[10px] font-bold leading-[18px] text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id="notification-panel"
          className="absolute right-0 top-14 z-50 w-[320px] overflow-hidden rounded-3xl border border-white/60 bg-[#fffaf6]/95 p-3 shadow-[0_18px_48px_rgba(26,26,26,0.12)] backdrop-blur-md"
        >
          <div className="mb-2 flex items-center justify-between px-2 py-1">
            <div>
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">{unreadCount} non lue(s)</p>
            </div>
            <button
              id="btn-mark-all-read"
              type="button"
              disabled={unreadCount === 0 || busy}
              onClick={() => void handleMarkAllRead()}
              className="text-xs font-medium text-orange-600 transition hover:text-orange-700 disabled:opacity-50"
            >
              Tout marquer lu
            </button>
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {!loading && notifications.length === 0 ? (
              <div id="notification-empty">
                <EmptyState
                  icon="✓"
                  title="Vous êtes à jour"
                  description="Les nouvelles candidatures, messages et livraisons apparaîtront ici en temps réel."
                  tone="light"
                  className="rounded-2xl px-4 py-6"
                />
              </div>
            ) : null}

            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-2xl border border-white/50 bg-white/80"
                />
              ))
            ) : notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => void handleNotificationClick(notification)}
                className={`notification-item block w-full rounded-2xl border px-3 py-3 text-left transition ${
                  notification.read
                    ? 'border-white/60 bg-white/80 hover:bg-white'
                    : 'notification-item--unread border-orange-100 bg-orange-50/80 hover:bg-orange-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                    {notification.body ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-600">
                        {notification.body}
                      </p>
                    ) : null}
                  </div>
                  {!notification.read ? (
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500" />
                  ) : null}
                </div>
                <p className="mt-2 text-[11px] uppercase tracking-wide text-gray-400">
                  {formatRelativeTime(notification.created_at)}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-3 border-t border-white/60 px-2 pt-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/notifications');
              }}
              className="w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-medium text-gray-800 transition hover:bg-white"
            >
              Voir toutes les notifications
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
