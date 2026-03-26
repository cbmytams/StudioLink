import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth';
import { EmptyState } from '@/components/shared/EmptyState';
import { getNotificationTarget } from '@/lib/notifications/notificationUtils';
import { useMarkAllRead, useMarkAsRead, useNotifications } from '@/hooks/useNotifications';
import type { NotificationRecord } from '@/types/backend';
import { toUserFacingErrorMessage } from '@/lib/errors/userFacing';

function formatRelativeTime(dateIso: string): string {
  const timestamp = new Date(dateIso).getTime();
  if (Number.isNaN(timestamp)) return '';
  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "à l'instant";
  if (diff < hour) return `il y a ${Math.floor(diff / minute)} min`;
  if (diff < day) return `il y a ${Math.floor(diff / hour)} h`;
  if (diff < day * 7) return `il y a ${Math.floor(diff / day)} j`;
  return new Date(dateIso).toLocaleDateString('fr-FR');
}

function getDateGroupLabel(dateIso: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return 'Plus ancien';

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.floor((startOfToday - startOfTarget) / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return 'Cette semaine';
  return 'Plus ancien';
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const userId = session?.user?.id ?? null;
  const profileType = (
    profile as { user_type?: 'studio' | 'pro' | null; type?: 'studio' | 'pro' | null } | null
  )?.user_type
    ?? (
      profile as { user_type?: 'studio' | 'pro' | null; type?: 'studio' | 'pro' | null } | null
  )?.type
    ?? null;
  const fallbackRoute = profileType === 'studio' ? '/studio/dashboard' : '/pro/dashboard';
  const notificationsQuery = useNotifications(userId ?? undefined);
  const markAsReadMutation = useMarkAsRead();
  const markAllReadMutation = useMarkAllRead(userId ?? undefined);
  const notifications = notificationsQuery.data ?? [];
  const loading = notificationsQuery.isLoading;
  const error = notificationsQuery.error
    ? toUserFacingErrorMessage(notificationsQuery.error, 'Impossible de charger les notifications.')
    : null;
  const totalUnread = notifications.filter((item) => !item.read).length;
  const groupedNotifications = useMemo(() => notifications.reduce<Record<string, NotificationRecord[]>>((acc, item) => {
    const label = getDateGroupLabel(item.created_at);
    acc[label] = [...(acc[label] ?? []), item];
    return acc;
  }, {}), [notifications]);

  return (
    <main className="app-shell">
      <Helmet>
        <title>Notifications — StudioLink</title>
        <meta name="description" content="Consultez vos notifications StudioLink triées par date." />
      </Helmet>

      <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 md:pt-8">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="app-title">Notifications</h1>
          <button
            type="button"
            id="btn-mark-all-read"
            onClick={() => void markAllReadMutation.mutateAsync()}
            disabled={markAllReadMutation.isPending || totalUnread === 0}
            className="min-h-[44px] text-sm font-medium text-orange-600 disabled:opacity-50"
          >
            Tout marquer comme lu
          </button>
        </header>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl border border-white/50 p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-stone-200" />
                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-36 bg-stone-200 rounded" />
                    <div className="mt-2 h-3 w-20 bg-stone-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => navigate(fallbackRoute)}
              className="mt-3 text-sm text-orange-600 hover:underline"
            >
              Retour
            </button>
          </div>
        ) : null}

        {!loading && !error && notifications.length === 0 ? (
          <div id="notification-empty">
            <EmptyState
              icon="✓"
              title="Vous êtes à jour"
              description="Les nouvelles candidatures, messages, livraisons et évaluations apparaîtront ici."
              tone="light"
            />
          </div>
        ) : null}

        {!loading && !error && notifications.length > 0 ? (
          <div className="space-y-3">
            {Object.entries(groupedNotifications).map(([groupLabel, items]: [string, NotificationRecord[]]) => (
              <section key={groupLabel}>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
                  {groupLabel}
                </p>
                <div className="space-y-3">
                  {items.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => {
                        if (!notification.read) {
                          void markAsReadMutation.mutateAsync(notification.id);
                        }
                        navigate(getNotificationTarget(notification));
                      }}
                      className={`notification-item w-full rounded-2xl border p-4 text-left transition-colors hover:bg-orange-50 ${
                        notification.read
                          ? 'border-white/50 bg-white'
                          : 'notification-item--unread border-orange-100 bg-orange-50/90'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                          <Bell size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-stone-900">
                                {notification.title}
                              </p>
                              {notification.body ? (
                                <p className="mt-1 text-sm leading-5 text-stone-600">
                                  {notification.body}
                                </p>
                              ) : null}
                            </div>
                            {!notification.read ? (
                              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
                            ) : null}
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-stone-400">
                            <span>{formatRelativeTime(notification.created_at)}</span>
                            <span className="inline-flex items-center gap-1 font-medium text-orange-600">
                              Ouvrir <ChevronRight size={14} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
