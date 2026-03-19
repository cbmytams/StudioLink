import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Bell, CheckCircle2, MessageSquare, XCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/supabase/auth';
import { useMarkAllRead, useMarkAsRead, useNotifications } from '@/hooks/useNotifications';
import { NotificationSkeleton } from '@/components/skeletons/NotificationSkeleton';
import { GlassCard } from '@/components/ui/GlassCard';
import type { NotificationRecord } from '@/types/backend';

function getRelativeTime(dateIso: string) {
  const diff = Date.now() - new Date(dateIso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'à l’instant';
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days}j`;
  return new Date(dateIso).toLocaleDateString('fr-FR');
}

function iconForType(type: NotificationRecord['type']) {
  if (type === 'new_application') return <Bell size={16} className="text-orange-600" />;
  if (type === 'application_selected' || type === 'application_accepted') return <CheckCircle2 size={16} className="text-emerald-600" />;
  if (type === 'application_rejected') return <XCircle size={16} className="text-red-600" />;
  if (type === 'new_message') return <MessageSquare size={16} className="text-blue-600" />;
  return <Star size={16} className="text-amber-600" />;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const userId = session?.user?.id;
  const fallbackRoute = profile?.user_type === 'studio' ? '/studio/dashboard' : '/pro/dashboard';
  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useNotifications(userId);
  const markAllRead = useMarkAllRead(userId);
  const markAsRead = useMarkAsRead();

  const notifications = useMemo(() => data, [data]);

  return (
    <main className="app-shell">
      <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 md:pt-8">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="app-title">Notifications</h1>
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            className="min-h-[44px] text-sm font-medium text-orange-600"
          >
            Tout lire
          </button>
        </header>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-red-500">
              {error instanceof Error ? error.message : 'Impossible de charger les notifications.'}
            </p>
            <button
              type="button"
              onClick={() => navigate(fallbackRoute)}
              className="mt-4 min-h-[44px] rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white"
            >
              Retour à l’accueil
            </button>
          </GlassCard>
        ) : notifications.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Bell size={20} className="mx-auto mb-2 text-stone-400" />
            <p className="text-sm text-stone-500">Aucune notification</p>
            <button
              type="button"
              onClick={() => navigate(fallbackRoute)}
              className="mt-4 min-h-[44px] rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white"
            >
              Retour à l’accueil
            </button>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`min-h-[44px] w-full rounded-2xl border p-4 text-left transition-colors ${
                  item.read ? 'border-stone-200 bg-white' : 'border-orange-200 bg-orange-50'
                }`}
                onClick={async () => {
                  if (!item.read) {
                    await markAsRead.mutateAsync(item.id);
                  }
                  navigate(item.link || fallbackRoute);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{iconForType(item.type)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-stone-900">{item.title}</p>
                    {item.body ? <p className="mt-1 text-xs text-stone-600">{item.body}</p> : null}
                  </div>
                  <span className="whitespace-nowrap text-xs text-stone-500">{getRelativeTime(item.created_at)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
