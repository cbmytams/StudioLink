import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { chatService } from '@/lib/chat/chatService';
import { getPublicProfileDisplayName, getPublicProfilesMap, type PublicProfileRecord } from '@/services/publicProfileService';
import { Avatar } from '@/components/ui/Avatar';

type ConversationProfile = PublicProfileRecord;

type ConversationItem = {
  id: string
  last_message_at: string
  contact: ConversationProfile | null
  mission_title?: string | null
  last_message_preview?: string | null
  unreadCount: number
  status?: string | null
};

type ConversationRow = {
  id: string
  created_at: string | null
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

function buildPreview(message: {
  content?: string | null
  file_name?: string | null
  file_type?: string | null
} | null | undefined): string {
  if (!message) return 'Aucun message pour le moment';
  if (message.content?.trim()) return message.content.trim();
  if (message.file_name) return `📎 ${message.file_name}`;
  if (message.file_type === 'audio') return '🎧 Fichier audio';
  return 'Nouveau message';
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
          const previewMap: Record<string, string> = {};
          if (sessionIds.length > 0) {
            const [unreadRows, previewRows] = await Promise.all([
              supabase
                .from('messages')
                .select('session_id')
                .in('session_id', sessionIds)
                .neq('sender_id', userId)
                .eq('is_read', false),
              supabase
                .from('messages')
                .select('session_id, content, file_name, file_type, created_at')
                .in('session_id', sessionIds)
                .order('created_at', { ascending: false }),
            ]);

            if (!unreadRows.error) {
              ((unreadRows.data as Array<{ session_id: string }> | null) ?? []).forEach((row) => {
                unreadMap[row.session_id] = (unreadMap[row.session_id] ?? 0) + 1;
              });
            }

            if (!previewRows.error) {
              ((previewRows.data as Array<{
                session_id: string
                content: string | null
                file_name: string | null
                file_type: string | null
              }> | null) ?? []).forEach((row) => {
                if (!previewMap[row.session_id]) {
                  previewMap[row.session_id] = buildPreview(row);
                }
              });
            }
          }

          setConversations(sessionRows.map((row) => ({
            id: row.id,
            last_message_at: row.updated_at ?? row.created_at,
            contact: row.studio_id === userId ? row.pro : row.studio,
            mission_title: row.mission?.title ?? null,
            last_message_preview: previewMap[row.id] ?? 'Aucun message pour le moment',
            unreadCount: unreadMap[row.id] ?? 0,
            status: row.status,
          })));
          setLoading(false);
          return;
        }

        const fallback = await supabase
          .from('conversations')
          .select('id, created_at, participant_1, participant_2')
          .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
          .order('created_at', { ascending: false });
        if (fallback.error) throw fallback.error;

        const fallbackRows = (fallback.data as ConversationRow[] | null) ?? [];
        const contactIds = Array.from(new Set(fallbackRows.map((row) => (
          row.participant_1 === userId ? row.participant_2 : row.participant_1
        )).filter((value): value is string => Boolean(value))));

        let profilesMap = new Map<string, ConversationProfile>();
        if (contactIds.length > 0) {
          profilesMap = await getPublicProfilesMap(contactIds);
        }

        const previewMap: Record<string, string> = {};
        if (fallbackRows.length > 0) {
          const previewRows = await supabase
            .from('messages')
            .select('conversation_id, content, file_name, file_type, created_at')
            .in('conversation_id', fallbackRows.map((row) => row.id))
            .order('created_at', { ascending: false });

          if (!previewRows.error) {
            ((previewRows.data as Array<{
              conversation_id: string | null
              content: string | null
              file_name: string | null
              file_type: string | null
            }> | null) ?? []).forEach((row) => {
              if (row.conversation_id && !previewMap[row.conversation_id]) {
                previewMap[row.conversation_id] = buildPreview(row);
              }
            });
          }
        }

        if (!active) return;
        const mappedFallback = fallbackRows.map((row) => {
          const otherId = row.participant_1 === userId ? row.participant_2 : row.participant_1;
          return {
            id: row.id,
            last_message_at: row.created_at ?? new Date().toISOString(),
            contact: otherId ? (profilesMap.get(otherId) ?? null) : null,
            last_message_preview: previewMap[row.id] ?? 'Aucun message pour le moment',
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
      <div className="app-container-wide">
        <button
          type="button"
          onClick={() => navigate(fallbackRoute)}
          className="mb-4 inline-flex min-h-[var(--size-touch)] items-center px-1 text-sm app-muted transition-colors hover:text-white"
        >
          ← Retour
        </button>

        <header className="mb-5">
          <h1 className="app-title">Mes conversations</h1>
          <p className="app-subtitle">Retrouvez rapidement la bonne mission, l’interlocuteur et le dernier échange sans recharger l’écran.</p>
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
          <div className="grid gap-6 xl:grid-cols-[var(--layout-conversation-columns)]">
            <div className="app-list">
              {conversations.map((conversation) => {
                const contactName = getPublicProfileDisplayName(conversation.contact);
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => navigate(`/chat/${conversation.id}`)}
                    className="w-full rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={conversation.contact?.avatar_url}
                        name={contactName}
                        size="lg"
                        className="h-12 w-12 border border-white/10"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-white">{contactName}</p>
                          {conversation.status ? (
                            <span className={`rounded-full px-2 py-0.5 text-[var(--text-2xs)] font-semibold ${
                              conversation.status === 'completed'
                                ? 'bg-stone-100 text-stone-600'
                                : 'bg-green-500/15 text-green-200'
                            }`}>
                              {conversation.status === 'completed' ? 'Terminée' : 'Active'}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-sm text-white/45">
                          {conversation.mission_title ?? 'Conversation directe'}
                        </p>
                        <p className="mt-2 line-clamp-1 sm:line-clamp-2 text-sm leading-5 text-white/70">
                          {conversation.last_message_preview}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-white/35">{formatRelativeTime(conversation.last_message_at)}</span>
                        {conversation.unreadCount > 0 ? (
                          <span className="flex h-6 min-w-[var(--size-badge-counter)] items-center justify-center rounded-full bg-red-500 px-1 text-[var(--text-2xs)] font-bold text-white">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <aside className="hidden xl:block">
              <div className="sticky top-8 space-y-4">
                <section className="app-card p-6">
                  <p className="text-xs font-semibold uppercase tracking-[var(--tracking-caps)] text-white/40">Boîte de réception</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Toutes vos sessions en un coup d’œil</h2>
                  <p className="mt-3 text-sm leading-6 text-white/60">
                    Chaque ligne remonte la mission, le dernier échange et les messages non lus. Sur mobile, ouvrez une conversation plein écran.
                  </p>
                </section>
                <section className="app-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-[var(--tracking-caps)] text-white/40">Synthèse</p>
                  <div className="mt-4 space-y-3 text-sm text-white/70">
                    <div className="flex items-center justify-between">
                      <span>Conversations</span>
                      <span className="text-white">{conversations.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Messages non lus</span>
                      <span className="text-white">
                        {conversations.reduce((total, conversation) => total + conversation.unreadCount, 0)}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}
