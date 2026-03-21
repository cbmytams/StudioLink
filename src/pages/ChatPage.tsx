import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { markConversationAsRead } from '@/services/notificationService';

type ConversationData = {
  id: string
  studio_id: string | null
  pro_id: string | null
  participant_1: string | null
  participant_2: string | null
};

type CounterpartyProfile = {
  id: string
  full_name: string | null
  company_name: string | null
  avatar_url: string | null
};

type ChatMessage = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
};

function formatTime(dateIso: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { session, profile } = useAuth();
  const userId = session?.user?.id ?? null;
  const profileType = (profile as { user_type?: 'studio' | 'pro' | null; type?: 'studio' | 'pro' | null } | null)?.user_type
    ?? (profile as { user_type?: 'studio' | 'pro' | null; type?: 'studio' | 'pro' | null } | null)?.type
    ?? null;
  const conversationListRoute = profileType === 'studio' ? '/studio/conversations' : '/pro/conversations';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [counterparty, setCounterparty] = useState<CounterpartyProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const counterpartName = useMemo(() => {
    return counterparty?.full_name ?? counterparty?.company_name ?? 'Contact';
  }, [counterparty?.company_name, counterparty?.full_name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let active = true;

    const loadConversation = async () => {
      if (!userId) {
        if (!active) return;
        setError('Session invalide.');
        setLoading(false);
        return;
      }

      if (!conversationId) {
        navigate(conversationListRoute, { replace: true });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let conversationData: ConversationData | null = null;

        const primaryConversation = await supabase
          .from('conversations')
          .select('id, studio_id, pro_id, participant_1, participant_2')
          .eq('id', conversationId)
          .maybeSingle();

        if (primaryConversation.error) {
          const fallbackConversation = await supabase
            .from('conversations')
            .select('id, participant_1, participant_2')
            .eq('id', conversationId)
            .maybeSingle();
          if (fallbackConversation.error) throw fallbackConversation.error;
          conversationData = fallbackConversation.data
            ? {
              id: fallbackConversation.data.id,
              studio_id: null,
              pro_id: null,
              participant_1: (fallbackConversation.data as { participant_1?: string | null }).participant_1 ?? null,
              participant_2: (fallbackConversation.data as { participant_2?: string | null }).participant_2 ?? null,
            }
            : null;
        } else {
          conversationData = primaryConversation.data as ConversationData | null;
        }

        if (!conversationData) {
          if (!active) return;
          setError('Conversation introuvable.');
          setLoading(false);
          return;
        }

        const participantA = conversationData.studio_id ?? conversationData.participant_1;
        const participantB = conversationData.pro_id ?? conversationData.participant_2;

        if (participantA !== userId && participantB !== userId) {
          if (!active) return;
          setError('Accès non autorisé à cette conversation.');
          setLoading(false);
          return;
        }

        const counterpartyId = participantA === userId ? participantB : participantA;

        const [profileResult, messagesResult] = await Promise.all([
          counterpartyId
            ? supabase
              .from('profiles')
              .select('id, full_name, company_name, avatar_url')
              .eq('id', counterpartyId)
              .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          supabase
            .from('messages')
            .select('id, conversation_id, sender_id, content, created_at')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(50),
        ]);

        if (profileResult.error) throw profileResult.error;
        if (messagesResult.error) throw messagesResult.error;

        if (!active) return;
        setConversation(conversationData);
        setCounterparty((profileResult.data as CounterpartyProfile | null) ?? null);
        setMessages(((messagesResult.data as ChatMessage[] | null) ?? []).filter((row) => Boolean(row.content)));
        try {
          await markConversationAsRead(conversationId, userId);
        } catch {
          // Non bloquant pour l'affichage de la conversation.
        }
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Impossible de charger la conversation.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadConversation();
    return () => {
      active = false;
    };
  }, [conversationId, conversationListRoute, navigate, userId]);

  useEffect(() => {
    if (!conversationId || !userId) return;

    const channel = supabase
      .channel(`messages:conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as ChatMessage;
          setMessages((previous) => {
            if (previous.some((message) => message.id === incoming.id)) return previous;
            return [...previous, incoming];
          });
          void markConversationAsRead(conversationId, userId);
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [conversationId, userId]);

  const sendMessage = async () => {
    if (!userId || !conversationId || sending) return;
    const content = draft.trim();
    if (!content) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: userId,
      content,
      created_at: new Date().toISOString(),
    };

    setError(null);
    setSending(true);
    setDraft('');
    setMessages((previous) => [...previous, optimisticMessage]);

    try {
      const insertResult = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content,
        })
        .select('id, conversation_id, sender_id, content, created_at')
        .single();

      if (insertResult.error) throw insertResult.error;

      const savedMessage = insertResult.data as ChatMessage;
      setMessages((previous) => previous.map((message) => (
        message.id === optimisticId ? savedMessage : message
      )));

      const updateResult = await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() } as never)
        .eq('id', conversationId);

      if (updateResult.error) {
        // Non bloquant pour l'expérience messagerie.
      }
    } catch (sendError) {
      setMessages((previous) => previous.filter((message) => message.id !== optimisticId));
      setDraft(content);
      setError(sendError instanceof Error ? sendError.message : "Impossible d'envoyer ce message.");
    } finally {
      setSending(false);
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <div className="app-container-compact flex min-h-screen items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen">
      <Helmet>
        <title>Conversation — StudioLink</title>
      </Helmet>

      <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f4ece4]/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(conversationListRoute)}
            className="text-sm app-muted hover:text-black transition-colors"
          >
            ←
          </button>

          {counterparty?.avatar_url ? (
            <img
              src={counterparty.avatar_url}
              alt={counterpartName}
              className="h-10 w-10 rounded-full border border-white/50 object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-sm font-bold text-orange-600">
                {counterpartName.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          )}

          <p className="font-semibold text-gray-900 truncate">{counterpartName}</p>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-4 pb-40">
        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}

        {!error && !conversation ? (
          <p className="app-empty-state">Conversation introuvable.</p>
        ) : null}

        {messages.map((message) => {
          const mine = message.sender_id === userId;
          return mine ? (
            <div key={message.id} className="mb-2 flex justify-end">
              <div className="bg-orange-500 text-white text-sm px-3 py-2 rounded-2xl rounded-tr-sm max-w-[75%]">
                {message.content}
                <span className="block text-xs text-orange-200 text-right mt-0.5">
                  {formatTime(message.created_at)}
                </span>
              </div>
            </div>
          ) : (
            <div key={message.id} className="mb-2 flex justify-start gap-2">
              <div className="bg-white text-gray-800 text-sm px-3 py-2 rounded-2xl rounded-tl-sm max-w-[75%] shadow-sm">
                {message.content}
                <span className="block text-xs text-gray-400 text-right mt-0.5">
                  {formatTime(message.created_at)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 border-t border-black/5 bg-[#f4ece4]/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-end gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, 2000))}
            onKeyDown={handleInputKeyDown}
            placeholder="Écrire un message..."
            rows={1}
            className="min-h-[44px] max-h-32 w-full resize-none rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={sending || draft.trim().length === 0}
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-orange-500 px-3 text-white font-semibold disabled:opacity-50"
          >
            →
          </button>
        </div>
        <p className="mx-auto mt-1 max-w-lg text-right text-[11px] text-stone-400">
          {draft.length}/2000
        </p>
      </div>
    </div>
  );
}
