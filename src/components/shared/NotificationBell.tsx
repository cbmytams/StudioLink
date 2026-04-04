import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/supabase/auth';
import type { NotificationRecord } from '@/types/backend';
import { EmptyState } from '@/components/shared/EmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useMarkAllRead, useMarkAsRead, useNotifications } from '@/hooks/useNotifications';
import { getNotificationTarget } from '@/lib/notifications/notificationUtils';

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

export function NotificationBell(_props: NotificationBellProps) {
  void _props;
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const isMobile = useMediaQuery('(max-width: 767px)');
  const notificationsQuery = useNotifications(userId ?? undefined);
  const markAsReadMutation = useMarkAsRead();
  const markAllReadMutation = useMarkAllRead(userId ?? undefined);

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const notifications = notificationsQuery.data ?? [];
  const loading = notificationsQuery.isLoading;
  const busy = markAsReadMutation.isPending || markAllReadMutation.isPending;

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

    try {
      if (!notification.read) {
        await markAsReadMutation.mutateAsync(notification.id);
      }
    } finally {
      setOpen(false);
      void navigate(getNotificationTarget(notification));
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId || unreadCount === 0 || busy) return;

    await markAllReadMutation.mutateAsync();
  };

  const panelContent = (
    <>
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
          className="min-h-[var(--size-touch)] px-2 text-xs font-medium text-orange-600 transition hover:text-orange-700 disabled:opacity-50"
        >
          Tout marquer lu
        </button>
      </div>

      <div className={`${isMobile ? 'min-h-0 flex-1 space-y-2 overflow-y-auto pr-1' : 'max-h-[var(--size-notification-panel-height)] space-y-2 overflow-y-auto pr-1'}`}>
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
            className={`notification-item block min-h-[var(--size-notification-item-min-height)] w-full rounded-2xl border px-3 py-3 text-left transition ${
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
            <p className="mt-2 text-[var(--text-2xs-plus)] uppercase tracking-wide text-gray-400">
              {formatRelativeTime(notification.created_at)}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-3 border-t border-white/60 px-2 pt-3">
        <button
          type="button"
          aria-label="Voir toutes les notifications"
          onClick={() => {
            setOpen(false);
            void navigate('/notifications');
          }}
          className="min-h-[var(--size-touch-lg)] w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-medium text-gray-800 transition hover:bg-white"
        >
          Voir toutes les notifications
        </button>
      </div>
    </>
  );

  return (
    <div ref={panelRef} className="relative">
      <button
        id="btn-notification-bell"
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={() => setOpen((previous) => !previous)}
        className="relative flex min-h-[var(--size-touch)] min-w-[var(--size-touch)] items-center justify-center rounded-full border border-white/50 bg-white/60 shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
      >
        <Bell size={20} className="text-black/70" />
        {unreadCount > 0 ? (
          <span
            id="notification-badge"
            className="absolute -right-1 -top-1 min-w-[var(--size-badge)] rounded-full border-2 border-[var(--color-surface-soft)] bg-orange-500 px-1 text-center text-[var(--text-2xs)] font-bold leading-[var(--size-badge)] text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open && isMobile ? (
        <BottomSheet
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Notifications"
          fullHeight
        >
          <div
            id="notification-panel"
            role="region"
            aria-label="Panneau de notifications"
            hidden={!open}
            className="flex h-full flex-col overflow-hidden"
          >
            {panelContent}
          </div>
        </BottomSheet>
      ) : null}

      {open && !isMobile ? (
        <div
          id="notification-panel"
          role="region"
          aria-label="Panneau de notifications"
          hidden={!open}
          className="absolute right-0 top-14 z-dropdown w-[var(--layout-side-panel-width)] overflow-hidden rounded-3xl border border-white/60 bg-[var(--color-surface-soft-elevated)]/95 p-3 shadow-[var(--shadow-overlay)] backdrop-blur-md"
        >
          {panelContent}
        </div>
      ) : null}
    </div>
  );
}
