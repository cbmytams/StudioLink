import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { markConversationAsRead } from '@/services/notificationService';

type ConversationProfile = {
  id: string
  full_name: string | null
  avatar_url: string | null
};

type ConversationRow = {
  id: string
  last_message_at: string | null
  studio_id: string | null
  pro_id: string | null
  participant_1?: string | null
  participant_2?: string | null
  studio?: ConversationProfile | ConversationProfile[] | null
  pro?: ConversationProfile | ConversationProfile[] | null
};

type ConversationNotification = {
  id: string
  lastMessageAt: string
  contact: ConversationProfile | null
  unreadCount: number
};

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

  const [conversations, setConversations] = useState<ConversationNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    let active = true;

    const fetchNotificationsCenter = async () => {
      setLoading(true);
      setError(null);

      try {
        let rows: ConversationRow[] = [];

        const primary = await supabase
          .from('conversations')
          .select(`
            id,
            last_message_at,
            studio_id,
            pro_id,
            studio:profiles!conversations_studio_id_fkey(id, full_name, avatar_url),
            pro:profiles!conversations_pro_id_fkey(id, full_name, avatar_url)
          `)
          .or(`studio_id.eq.${userId},pro_id.eq.${userId}`)
          .order('last_message_at', { ascending: false });

        if (!primary.error && primary.data) {
          rows = primary.data as unknown as ConversationRow[];
        } else {
          const fallback = await supabase
            .from('conversations')
            .select('id, last_message_at, participant_1, participant_2')
            .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
            .order('last_message_at', { ascending: false });
          if (fallback.error) throw fallback.error;

          const fallbackRows = (fallback.data as ConversationRow[] | null) ?? [];
          const otherIds = Array.from(new Set(fallbackRows.map((row) => (
            row.participant_1 === userId ? row.participant_2 : row.participant_1
          )).filter((id): id is string => Boolean(id))));

          let profileMap: Record<string, ConversationProfile> = {};
          if (otherIds.length > 0) {
            const profiles = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', otherIds);
            if (profiles.error) throw profiles.error;
            profileMap = ((profiles.data as ConversationProfile[] | null) ?? []).reduce<Record<string, ConversationProfile>>(
              (acc, item) => {
                acc[item.id] = item;
                return acc;
              },
              {},
            );
          }

          rows = fallbackRows.map((row) => {
            const otherId = row.participant_1 === userId ? row.participant_2 : row.participant_1;
            const mappedContact = otherId ? (profileMap[otherId] ?? null) : null;
            return {
              ...row,
              studio_id: null,
              pro_id: null,
              studio: mappedContact,
              pro: null,
            };
          });
        }

        const conversationIds = rows.map((row) => row.id);
        const unreadMap: Record<string, number> = {};

        if (conversationIds.length > 0) {
          const unreadPrimary = await supabase
            .from('messages')
            .select('conversation_id')
            .in('conversation_id', conversationIds)
            .neq('sender_id', userId)
            .is('read_at', null);

          if (!unreadPrimary.error) {
            ((unreadPrimary.data as Array<{ conversation_id: string }> | null) ?? []).forEach((item) => {
              unreadMap[item.conversation_id] = (unreadMap[item.conversation_id] ?? 0) + 1;
            });
          } else {
            const unreadFallback = await supabase
              .from('messages')
              .select('conversation_id')
              .in('conversation_id', conversationIds)
              .neq('sender_id', userId)
              .eq('read', false);
            if (unreadFallback.error) throw unreadFallback.error;
            ((unreadFallback.data as Array<{ conversation_id: string }> | null) ?? []).forEach((item) => {
              unreadMap[item.conversation_id] = (unreadMap[item.conversation_id] ?? 0) + 1;
            });
          }
        }

        if (!active) return;
        const mapped = rows.map((row) => {
          const studioProfile = Array.isArray(row.studio) ? (row.studio[0] ?? null) : (row.studio ?? null);
          const proProfile = Array.isArray(row.pro) ? (row.pro[0] ?? null) : (row.pro ?? null);
          const contact = row.studio_id === userId ? proProfile : studioProfile;

          return {
            id: row.id,
            lastMessageAt: row.last_message_at ?? new Date().toISOString(),
            contact,
            unreadCount: unreadMap[row.id] ?? 0,
          };
        });
        setConversations(mapped);
      } catch (fetchError) {
        if (!active) return;
        setConversations([]);
        setError(fetchError instanceof Error ? fetchError.message : 'Impossible de charger les conversations.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchNotificationsCenter();

    const channel = supabase
      .channel(`notifications-center:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        void fetchNotificationsCenter();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        void fetchNotificationsCenter();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, () => {
        void fetchNotificationsCenter();
      })
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
    [conversations],
  );

  const markAllAsRead = async () => {
    if (!userId) return;
    const unreadConversations = conversations.filter((conversation) => conversation.unreadCount > 0);
    if (unreadConversations.length === 0) return;

    setMarkingAll(true);
    try {
      await Promise.all(
        unreadConversations.map((conversation) => markConversationAsRead(conversation.id, userId)),
      );
      setConversations((previous) => previous.map((conversation) => ({ ...conversation, unreadCount: 0 })));
    } catch {
      // L'affichage d'erreur global reste suffisant via le refresh realtime.
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <main className="app-shell">
      <Helmet>
        <title>Notifications — StudioLink</title>
        <meta name="description" content="Consultez vos conversations non lues sur StudioLink." />
      </Helmet>

      <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 md:pt-8">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="app-title">Notifications</h1>
          <button
            type="button"
            onClick={() => void markAllAsRead()}
            disabled={markingAll || totalUnread === 0}
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

        {!loading && !error && conversations.length === 0 ? (
          <div className="app-card p-8 text-center">
            <Bell size={20} className="mx-auto mb-2 text-stone-400" />
            <p className="text-sm text-stone-500">Aucune conversation</p>
          </div>
        ) : null}

        {!loading && !error && conversations.length > 0 ? (
          <div className="space-y-3">
            {conversations.map((conversation) => {
              const name = conversation.contact?.full_name ?? 'Contact';
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => navigate(`/chat/${conversation.id}`)}
                  className="w-full rounded-2xl border border-white/50 bg-white p-4 text-left transition-colors hover:bg-orange-50"
                >
                  <div className="flex items-center gap-3">
                    {conversation.contact?.avatar_url ? (
                      <img
                        src={conversation.contact.avatar_url}
                        alt={name}
                        className="h-10 w-10 rounded-full border border-white/50 object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-orange-600">
                          {name.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-900 truncate">{name}</p>
                      <p className="text-xs text-stone-500">{formatRelativeTime(conversation.lastMessageAt)}</p>
                    </div>

                    {conversation.unreadCount > 0 ? (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </main>
  );
}
