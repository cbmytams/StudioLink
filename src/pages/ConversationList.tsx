import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { chatService } from '@/lib/chat/chatService';
import { getPublicProfileDisplayName, getPublicProfilesMap, type PublicProfileRecord } from '@/services/publicProfileService';

type ConversationProfile = PublicProfileRecord;

type ConversationItem = {
  id: string
  last_message_at: string
  contact: ConversationProfile | null
  mission_title?: string | null
  unreadCount: number
  status?: string | null
};

type ConversationRow = {
  id: string
  last_message_at: string | null
  studio_id?: string | null
  pro_id?: string | null
  participant_1?: string | null
  participant_2?: string | null
};

function formatRelativeTime(dateIso: string): string {
  const timestamp = new Date(dateIso).getTime();
  if (Number.isNaN(timestamp)) return '';
  const diffMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "à l'instant";
  if (diffMs < hour) return `il y a ${Math.floor(diffMs / minute)} min`;
  if (diffMs < day) return `il y a ${Math.floor(diffMs / hour)} h`;
  return `il y a ${Math.floor(diffMs / day)} j`;
}

export default function ConversationList() {
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

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchConversations = async () => {
      if (!userId) {
        if (!active) return;
        setConversations([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const sessionRows = await chatService.listSessions(userId);
        if (sessionRows.length > 0) {
          if (!active) return;
          const sessionIds = sessionRows.map((row) => row.id);
          const unreadMap: Record<string, number> = {};
          if (sessionIds.length > 0) {
            const unreadRows = await supabase
              .from('messages')
              .select('session_id')
              .in('session_id', sessionIds)
              .neq('sender_id', userId)
              .eq('is_read', false);

            if (!unreadRows.error) {
              ((unreadRows.data as Array<{ session_id: string }> | null) ?? []).forEach((row) => {
                unreadMap[row.session_id] = (unreadMap[row.session_id] ?? 0) + 1;
              });
            }
          }

          setConversations(sessionRows.map((row) => ({
            id: row.id,
            last_message_at: row.updated_at ?? row.created_at,
            contact: row.studio_id === userId ? row.pro : row.studio,
            mission_title: row.mission?.title ?? null,
            unreadCount: unreadMap[row.id] ?? 0,
            status: row.status,
          })));
          setLoading(false);
          return;
        }

        const primary = await supabase
          .from('conversations')
          .select(`
            id,
            last_message_at,
            studio_id,
            pro_id
          `)
          .or(`studio_id.eq.${userId},pro_id.eq.${userId}`)
          .order('last_message_at', { ascending: false });

        if (!primary.error && primary.data) {
          const rows = primary.data as ConversationRow[];
          const contactIds = Array.from(new Set(rows.map((row) => (
            row.studio_id === userId ? row.pro_id : row.studio_id
          )).filter((value): value is string => Boolean(value))));
          const profilesById = await getPublicProfilesMap(contactIds);
          if (!active) return;

          const mapped = rows.map((row) => ({
            id: row.id,
            last_message_at: row.last_message_at ?? new Date().toISOString(),
            contact: profilesById.get(row.studio_id === userId ? (row.pro_id ?? '') : (row.studio_id ?? '')) ?? null,
            unreadCount: 0,
          }));
          setConversations(mapped);
          setLoading(false);
          return;
        }

        const fallback = await supabase
          .from('conversations')
          .select('id, last_message_at, participant_1, participant_2')
          .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
          .order('last_message_at', { ascending: false });
        if (fallback.error) throw fallback.error;

        const fallbackRows = (fallback.data as ConversationRow[] | null) ?? [];
        const contactIds = Array.from(new Set(fallbackRows.map((row) => (
          row.participant_1 === userId ? row.participant_2 : row.participant_1
        )).filter((value): value is string => Boolean(value))));

        let profilesMap = new Map<string, ConversationProfile>();
        if (contactIds.length > 0) {
          profilesMap = await getPublicProfilesMap(contactIds);
        }

        if (!active) return;
        const mappedFallback = fallbackRows.map((row) => {
          const otherId = row.participant_1 === userId ? row.participant_2 : row.participant_1;
          return {
            id: row.id,
            last_message_at: row.last_message_at ?? new Date().toISOString(),
            contact: otherId ? (profilesMap.get(otherId) ?? null) : null,
            unreadCount: 0,
          };
        });
        setConversations(mappedFallback);
      } catch (fetchError) {
        if (!active) return;
        setConversations([]);
        setError(fetchError instanceof Error ? fetchError.message : 'Impossible de charger les conversations.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchConversations();
    return () => {
      active = false;
    };
  }, [userId]);

  const hasConversations = useMemo(() => conversations.length > 0, [conversations.length]);

  return (
    <div className="app-shell pb-24">
      <Helmet>
        <title>Mes conversations — StudioLink</title>
        <meta name="description" content="Consultez vos conversations avec les pros." />
      </Helmet>
      <div className="app-container">
        <button
          type="button"
          onClick={() => navigate(fallbackRoute)}
          className="mb-4 text-sm app-muted hover:text-black transition-colors"
        >
          ← Retour
        </button>

        <header className="mb-5">
          <h1 className="app-title">Mes conversations</h1>
        </header>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl border border-white/50 p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-stone-200" />
                  <div className="flex-1">
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
          </div>
        ) : null}

        {!loading && !error && !hasConversations ? (
          <p className="app-empty-state">Aucune conversation pour l&apos;instant.</p>
        ) : null}

        {!loading && !error && hasConversations ? (
          <div className="app-list">
            {conversations.map((conversation) => {
              const contactName = getPublicProfileDisplayName(conversation.contact);
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => navigate(`/chat/${conversation.id}`)}
                  className="bg-white rounded-2xl border border-white/50 p-4 flex items-center gap-3 w-full text-left hover:bg-orange-50 transition-colors"
                >
                  {conversation.contact?.avatar_url ? (
                    <img
                      src={conversation.contact.avatar_url}
                      alt={contactName}
                      className="h-10 w-10 rounded-full object-cover border border-white/50"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-orange-600">
                        {contactName.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-gray-900">{contactName}</p>
                      {conversation.status ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          conversation.status === 'completed'
                            ? 'bg-stone-100 text-stone-600'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {conversation.status === 'completed' ? 'Terminée' : 'Active'}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-400">
                      {conversation.mission_title ? `${conversation.mission_title} · ` : ''}
                      {formatRelativeTime(conversation.last_message_at)}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 ? (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                    </span>
                  ) : null}
                  <span className="text-gray-300">›</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
