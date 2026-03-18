import { useMemo } from 'react';
import { Bell, CheckCircle2, MessageSquare, XCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
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
  if (type === 'application_selected') return <CheckCircle2 size={16} className="text-emerald-600" />;
  if (type === 'application_rejected') return <XCircle size={16} className="text-red-600" />;
  if (type === 'new_message') return <MessageSquare size={16} className="text-blue-600" />;
  return <Star size={16} className="text-amber-600" />;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { data = [], isLoading } = useNotifications(userId);
  const markAllRead = useMarkAllRead(userId);
  const markAsRead = useMarkAsRead();

  const notifications = useMemo(() => data, [data]);

  return (
    <main className="min-h-screen p-4 pb-24 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <button
          type="button"
          onClick={() => markAllRead.mutate()}
          className="text-sm font-medium text-orange-600 min-h-[44px]"
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
      ) : notifications.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Bell size={20} className="mx-auto text-stone-400 mb-2" />
          <p className="text-sm text-stone-500">Aucune notification</p>
          <button
            type="button"
            onClick={() => navigate('/')}
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
              className={`w-full text-left rounded-2xl border p-4 min-h-[44px] ${
                item.read ? 'bg-white border-stone-200' : 'bg-orange-50 border-orange-200'
              }`}
              onClick={async () => {
                if (!item.read) {
                  await markAsRead.mutateAsync(item.id);
                }
                navigate(item.link || '/');
              }}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{iconForType(item.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900">{item.title}</p>
                  {item.body ? <p className="text-xs text-stone-600 mt-1">{item.body}</p> : null}
                </div>
                <span className="text-xs text-stone-500 whitespace-nowrap">{getRelativeTime(item.created_at)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
