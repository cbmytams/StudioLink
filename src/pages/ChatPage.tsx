import { type ChangeEvent, type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { chatService, type ChatSession, type ChatUpload } from '@/lib/chat/chatService';
import type { ChatFileType } from '@/types/backend';
import { markConversationAsRead } from '@/services/conversationReadService';
import { useToast } from '@/components/ui/Toast';
import { classifyMissionAsset } from '@/lib/files/fileUtils';
import { getSignedUrl, uploadDeliveryFile } from '@/lib/files/fileService';
import { DeliveryPanel } from '@/components/shared/DeliveryPanel';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageMeta } from '@/components/shared/PageMeta';
import { RatingModal } from '@/components/shared/RatingModal';
import { Avatar } from '@/components/ui/Avatar';
import { LazyImage } from '@/components/ui/LazyImage';
import { getPublicProfile, getPublicProfileDisplayName, type PublicProfileRecord } from '@/services/publicProfileService';
import { handleAuthError } from '@/lib/auth/handleAuthError';
import { toUserFacingErrorMessage } from '@/lib/errors/userFacing';
import { useMobileFixedBottomStyle } from '@/hooks/useVisualViewport';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getRatingForSession } from '@/lib/ratings/ratingService';

type CounterpartyProfile = PublicProfileRecord;

type LegacyConversationData = {
  id: string;
  participant_1: string | null;
  participant_2: string | null;
};

type LegacyMessageRow = {
  id: string;
  session_id: string | null;
  conversation_id: string | null;
  sender_id: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: ChatFileType | null;
  is_read: boolean | null;
  read: boolean | null;
  read_at: string | null;
  created_at: string;
};

type DisplayMessage = {
  id: string;
  sender_id: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: ChatFileType | null;
  is_read: boolean;
  created_at: string;
};

function formatTime(dateIso: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function mapLegacyMessage(row: LegacyMessageRow): DisplayMessage {
  return {
    id: row.id,
    sender_id: row.sender_id,
    content: row.content,
    file_url: row.file_url,
    file_name: row.file_name,
    file_type: row.file_type,
    is_read: row.is_read ?? (Boolean(row.read_at) || Boolean(row.read)),
    created_at: row.created_at,
  };
}

function buildFallbackRoute(profileType: 'studio' | 'pro' | null): string {
  return profileType === 'studio' ? '/studio/conversations' : '/pro/conversations';
}

function isSessionMessage(message: DisplayMessage): boolean {
  return Boolean(message.file_url) || Boolean(message.content);
}

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

export default function ChatPage() {
  const navigate = useNavigate();
  const { conversationId: chatId } = useParams<{ conversationId: string }>();
  const { session, profile } = useAuth();
  const { showToast } = useToast();

  const userId = session?.user?.id ?? null;
  const profileType = (
    profile as { user_type?: 'studio' | 'pro' | null; type?: 'studio' | 'pro' | null } | null
  )?.user_type
    ?? (
      profile as { user_type?: 'studio' | 'pro' | null; type?: 'studio' | 'pro' | null } | null
    )?.type
    ?? null;
  const conversationListRoute = buildFallbackRoute(profileType);

  const [mode, setMode] = useState<'session' | 'legacy' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<ChatSession | null>(null);
  const [conversation, setConversation] = useState<LegacyConversationData | null>(null);
  const [counterparty, setCounterparty] = useState<CounterpartyProfile | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<ChatUpload | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [signedAttachmentUrls, setSignedAttachmentUrls] = useState<Record<string, string>>({});
  const [deliveryRefreshKey, setDeliveryRefreshKey] = useState(0);
  const [completingSession, setCompletingSession] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasSubmittedRating, setHasSubmittedRating] = useState(false);
  const { isOnline } = useNetworkStatus();

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileComposerStyle = useMobileFixedBottomStyle(64);

  const counterpartName = useMemo(
    () => getPublicProfileDisplayName(counterparty),
    [counterparty],
  );
  const missionTitle = sessionData?.mission?.title ?? null;
  const resolvedUserType = useMemo<'studio' | 'pro' | null>(() => {
    if (sessionData && userId) {
      if (sessionData.studio_id === userId) return 'studio';
      if (sessionData.pro_id === userId) return 'pro';
    }
    return profileType;
  }, [profileType, sessionData, userId]);
  const canAttachFiles = mode !== 'session' || resolvedUserType === 'pro';
  const isStudioUser = resolvedUserType === 'studio';
  const typingIndicator = draft.trim().length > 0 ? 'Vous êtes en train d’écrire…' : null;
  const otherParticipant = useMemo(() => {
    if (!sessionData || !userId) return null;
    return sessionData.studio_id === userId ? sessionData.pro : sessionData.studio;
  }, [sessionData, userId]);
  const canCompleteSession = mode === 'session' && isStudioUser && sessionData?.status === 'confirmed';
  const canPromptRating = mode === 'session' && sessionData?.status === 'completed' && Boolean(otherParticipant) && !hasSubmittedRating;

  const updateIsAtBottom = useCallback(() => {
    const threshold = 120;
    const scrollBottom = window.scrollY + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;
    isAtBottomRef.current = pageHeight - scrollBottom < threshold;
  }, []);

  useEffect(() => {
    updateIsAtBottom();
    window.addEventListener('scroll', updateIsAtBottom, { passive: true });
    return () => window.removeEventListener('scroll', updateIsAtBottom);
  }, [updateIsAtBottom]);

  useEffect(() => {
    if (!isAtBottomRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let active = true;

    const resolveSignedUrls = async () => {
      const pendingMessages = messages.filter((message) => {
        if (!message.file_url) return false;
        if (/^https?:\/\//i.test(message.file_url)) return false;
        return !(message.id in signedAttachmentUrls);
      });

      if (pendingMessages.length === 0) return;

      const nextEntries = await Promise.all(
        pendingMessages.map(async (message) => {
          const bucket = mode === 'session' ? 'delivery-files' : 'message-files';
          const signedUrl = await getSignedUrl(bucket, message.file_url as string);
          return [message.id, signedUrl] as const;
        }),
      );

      if (!active) return;
      setSignedAttachmentUrls((previous) => Object.fromEntries([...Object.entries(previous), ...nextEntries]));
    };

    void resolveSignedUrls().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [messages, mode, signedAttachmentUrls]);

  useEffect(() => {
    let active = true;

    const loadLegacyConversation = async () => {
      if (!userId || !chatId) {
        throw new Error('Conversation introuvable.');
      }

      const fallbackConversation = await supabase
        .from('conversations')
        .select('id, participant_1, participant_2')
        .eq('id', chatId)
        .maybeSingle();
      if (fallbackConversation.error) throw fallbackConversation.error;

      const conversationData = fallbackConversation.data
        ? {
            id: fallbackConversation.data.id,
            participant_1: (fallbackConversation.data as { participant_1?: string | null }).participant_1 ?? null,
            participant_2: (fallbackConversation.data as { participant_2?: string | null }).participant_2 ?? null,
          }
        : null;

      if (!conversationData) {
        throw new Error('Conversation introuvable.');
      }

      const participantA = conversationData.participant_1;
      const participantB = conversationData.participant_2;

      if (participantA !== userId && participantB !== userId) {
        throw new Error('Accès non autorisé à cette conversation.');
      }

      const counterpartyId = participantA === userId ? participantB : participantA;
      const [profileResult, messagesResult] = await Promise.all([
        counterpartyId ? getPublicProfile(counterpartyId) : Promise.resolve(null),
        supabase
          .from('messages')
          .select('id, session_id, conversation_id, sender_id, content, file_url, file_name, file_type, is_read, read, read_at, created_at')
          .eq('conversation_id', chatId)
          .order('created_at', { ascending: true })
          .limit(200),
      ]);

      if (messagesResult.error) throw messagesResult.error;

      if (!active) return;
      setMode('legacy');
      setSessionData(null);
      setConversation(conversationData);
      setCounterparty(profileResult ?? null);
      setMessages(((messagesResult.data as LegacyMessageRow[] | null) ?? []).map(mapLegacyMessage));
      await markConversationAsRead(chatId, userId);
    };

    const loadChat = async () => {
      if (!userId) {
        if (!active) return;
        setError('Session invalide.');
        setLoading(false);
        return;
      }

      if (!chatId) {
        navigate(conversationListRoute, { replace: true });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextSession = await chatService.getSession(chatId);
        const nextCounterparty = nextSession.studio_id === userId ? nextSession.pro : nextSession.studio;
        const sessionMessages = await chatService.getMessages(chatId);

        if (!active) return;
        setMode('session');
        setSessionData(nextSession);
        setConversation(null);
        setCounterparty(nextCounterparty);
        setMessages(sessionMessages);
        setHasSubmittedRating(false);
        await chatService.markMessagesAsRead(chatId);
      } catch (sessionLoadError) {
        console.error('[ChatPage] session load failed, fallback to legacy:', sessionLoadError);
        try {
          await loadLegacyConversation();
        } catch (loadError) {
          if (!active) return;
          setMode(null);
          setSessionData(null);
          setConversation(null);
          setCounterparty(null);
          setMessages([]);
          setError(toUserFacingErrorMessage(loadError, 'Impossible de charger la conversation.'));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadChat();
    return () => {
      active = false;
    };
  }, [chatId, conversationListRoute, navigate, userId]);

  useEffect(() => {
    if (!chatId || !userId || !mode || !isOnline) return;

    if (mode === 'session') {
      const channel = chatService.subscribeToMessages(chatId, (incoming) => {
        setMessages((previous) => (
          previous.some((message) => message.id === incoming.id)
            ? previous
            : [...previous, incoming]
        ));
        if (incoming.sender_id !== userId) {
          void chatService.markMessagesAsRead(chatId).catch((markReadError) => {
            console.error('[ChatPage] markMessagesAsRead failed:', markReadError);
          });
        }
      });

      return () => {
        void supabase.removeChannel(channel);
      };
    }

    const channel = supabase
      .channel(`messages:conversation:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${chatId}`,
        },
        (payload) => {
          const incoming = mapLegacyMessage(payload.new as LegacyMessageRow);
          setMessages((previous) => (
            previous.some((message) => message.id === incoming.id)
              ? previous
              : [...previous, incoming]
          ));
          if (incoming.sender_id !== userId) {
            void markConversationAsRead(chatId, userId).catch((markReadError) => {
              console.error('[ChatPage] markConversationAsRead failed:', markReadError);
            });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [chatId, isOnline, mode, userId]);

  useEffect(() => {
    let active = true;

    const loadRatingState = async () => {
      if (mode !== 'session' || !chatId || !userId || sessionData?.status !== 'completed') {
        if (!active) return;
        setHasSubmittedRating(false);
        return;
      }

      try {
        const existingRating = await getRatingForSession(chatId, userId);
        if (!active) return;
        setHasSubmittedRating(Boolean(existingRating));
      } catch {
        if (!active) return;
        setHasSubmittedRating(false);
      }
    };

    void loadRatingState();

    return () => {
      active = false;
    };
  }, [chatId, mode, sessionData?.status, userId]);

  const sendMessage = async () => {
    if (!userId || !chatId || sending) return;

    const content = draft.trim();
    const pendingAttachment = attachment;
    if (!content && !pendingAttachment) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: DisplayMessage = {
      id: optimisticId,
      sender_id: userId,
      content: content || null,
      file_url: pendingAttachment?.fileUrl ?? null,
      file_name: pendingAttachment?.fileName ?? null,
      file_type: pendingAttachment?.fileType ?? null,
      is_read: true,
      created_at: new Date().toISOString(),
    };

    setError(null);
    setSending(true);
    setDraft('');
    setAttachment(null);
    setMessages((previous) => [...previous, optimisticMessage]);

    try {
      if (mode === 'session') {
        const savedMessage = await chatService.sendMessage(chatId, userId, content, pendingAttachment ?? undefined);
        setMessages((previous) => [
          ...previous.filter((message) => message.id !== optimisticId && message.id !== savedMessage.id),
          savedMessage,
        ]);
      } else {
        const insertResult = await supabase
          .from('messages')
          .insert({
            conversation_id: chatId,
            sender_id: userId,
            content: content || null,
            file_url: pendingAttachment?.fileUrl ?? null,
            file_name: pendingAttachment?.fileName ?? null,
            file_type: pendingAttachment?.fileType ?? null,
            is_read: false,
            read: false,
            read_at: null,
          })
          .select('id, session_id, conversation_id, sender_id, content, file_url, file_name, file_type, is_read, read, read_at, created_at')
          .single();

        if (insertResult.error) throw insertResult.error;

        const savedMessage = mapLegacyMessage(insertResult.data as LegacyMessageRow);
        setMessages((previous) => [
          ...previous.filter((message) => message.id !== optimisticId && message.id !== savedMessage.id),
          savedMessage,
        ]);

        const updateResult = await supabase
          .from('conversations')
          // TODO: typer proprement `last_message_at` quand le schéma Supabase local inclura cette colonne.
          .update({ last_message_at: new Date().toISOString() } as never)
          .eq('id', chatId);

        if (updateResult.error) {
          // Non bloquant.
        }
      }
    } catch (sendError) {
      setMessages((previous) => previous.filter((message) => message.id !== optimisticId));
      setDraft(content);
      setAttachment(pendingAttachment ?? null);
      if (await handleAuthError(sendError, navigate)) return;
      const message = sendError instanceof Error ? sendError.message : "Impossible d'envoyer ce message.";
      setError(message);
      showToast({
        title: 'Envoi impossible',
        description: message,
        variant: 'destructive',
      });
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

  const handleSelectAttachment = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !userId) return;
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      const message = 'Fichier trop volumineux (10 Mo maximum).';
      setError(message);
      showToast({
        title: 'Pièce jointe refusée',
        description: message,
        variant: 'destructive',
      });
      return;
    }
    if (mode === 'session' && (!chatId || !sessionData?.mission_id)) {
      setError('Session introuvable pour joindre un fichier.');
      return;
    }

    setUploadingAttachment(true);
    setError(null);

    try {
      const sessionChatId = mode === 'session' ? chatId : null;
      const uploaded = await (sessionChatId && sessionData?.mission_id
        ? uploadDeliveryFile(sessionChatId, sessionData.mission_id, file).then((missionFile) => ({
          fileUrl: missionFile.file_url,
          fileName: missionFile.file_name,
          fileType: classifyMissionAsset({ type: missionFile.mime_type, name: missionFile.file_name }),
        }))
        : chatService.uploadFile(file, userId));
      setAttachment(uploaded);
      if (mode === 'session') {
        setDeliveryRefreshKey((previous) => previous + 1);
      }
      showToast({
        title: 'Fichier prêt',
        description: uploaded.fileName,
        variant: 'default',
      });
    } catch (uploadError) {
      if (await handleAuthError(uploadError, navigate)) return;
      const message = toUserFacingErrorMessage(uploadError, 'Impossible de joindre ce fichier.');
      setError(message);
      showToast({
        title: 'Pièce jointe refusée',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(conversationListRoute);
  };

  const handleCompleteSession = async () => {
    if (!chatId || !canCompleteSession) return;

    setCompletingSession(true);
    setError(null);

    try {
      await chatService.completeSession(chatId);

      setSessionData((previous) => (
        previous
          ? {
              ...previous,
              status: 'completed',
              completed_at: new Date().toISOString(),
            }
          : previous
      ));
      setShowRatingModal(true);
      setHasSubmittedRating(false);
      showToast({
        title: 'Session terminée',
        description: 'Vous pouvez maintenant laisser une note.',
        variant: 'default',
      });
    } catch (completeError) {
      if (await handleAuthError(completeError, navigate)) return;
      const message = toUserFacingErrorMessage(completeError, 'Impossible de terminer la session.');
      setError(message);
      showToast({
        title: 'Clôture impossible',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setCompletingSession(false);
    }
  };

  const messageItems = useMemo(() => messages.map((message) => {
    const mine = message.sender_id === userId;
    const resolvedFileUrl = message.file_url
      ? (signedAttachmentUrls[message.id] ?? message.file_url)
      : null;
    return (
      <div
        key={message.id}
        className={`message-bubble ${mine ? 'message-bubble--own flex justify-end' : 'flex justify-start'}`}
      >
        <div
          className={`max-w-[var(--chat-bubble-max-width)] rounded-2xl px-3 py-2 text-sm shadow-sm ${
            mine
              ? 'rounded-tr-sm bg-orange-500 text-white'
              : 'rounded-tl-sm bg-white text-gray-800'
          }`}
        >
          {message.content ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : null}

          {message.file_url ? (
            <div className={message.content ? 'mt-2' : ''}>
              {message.file_type === 'audio' ? (
                resolvedFileUrl ? (
                  <audio controls src={resolvedFileUrl} className="w-full min-w-[var(--size-chart-height)] max-w-full" />
                ) : (
                  <span className={`text-xs ${mine ? 'text-white/80' : 'text-gray-500'}`}>Préparation du fichier…</span>
                )
              ) : message.file_type === 'image' ? (
                <a href={resolvedFileUrl ?? message.file_url} target="_blank" rel="noreferrer">
                  <LazyImage
                    src={resolvedFileUrl ?? message.file_url}
                    alt={message.file_name ?? 'Image envoyée'}
                    width={320}
                    height={240}
                    className="max-h-52 w-full rounded-xl object-cover"
                  />
                </a>
              ) : (
                <a
                  href={resolvedFileUrl ?? message.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 text-xs underline-offset-2 hover:underline ${
                    mine ? 'text-white/90' : 'text-orange-600'
                  }`}
                >
                  <span>📎</span>
                  <span>{message.file_name ?? 'Télécharger le document'}</span>
                </a>
              )}
            </div>
          ) : null}

          {isSessionMessage(message) ? (
            <span
              className={`mt-1 block text-right text-xs ${
                mine ? 'text-orange-100' : 'text-gray-400'
              }`}
            >
              {formatTime(message.created_at)}
            </span>
          ) : null}
        </div>
      </div>
    );
  }), [messages, signedAttachmentUrls, userId]);

  if (loading) {
    return (
      <div className="app-shell min-h-[var(--size-full-dvh)]">
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-6">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className={`flex ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}
              >
                <div className="h-16 w-[var(--skeleton-row-width)] animate-pulse rounded-2xl bg-white/10" />
              </div>
            ))}
          </div>
          <div className="fixed bottom-[var(--safe-offset-nav)] left-0 right-0 border-t border-black/5 bg-[var(--color-surface-soft)]/95 px-4 py-3">
            <div className="mx-auto max-w-6xl">
              <div className="h-11 animate-pulse rounded-2xl bg-white/70" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="chat-container"
      data-chat-mode={mode ?? 'pending'}
      data-chat-ready={!loading && (sessionData || conversation) ? 'true' : 'false'}
      className="app-shell min-h-[var(--size-full-dvh)]"
    >
      <PageMeta
        title="Conversation"
        description="Échangez en temps réel et partagez vos livrables dans la même discussion."
      />

      <header className="sticky top-0 z-30 border-b border-black/5 bg-[var(--color-surface-soft)]/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <button
            type="button"
            aria-label="Retour aux conversations"
            onClick={handleBack}
            className="app-muted flex min-h-[var(--size-touch)] min-w-[var(--size-touch)] items-center justify-center text-sm transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
          >
            <span aria-hidden="true">←</span>
          </button>

          <Avatar
            src={counterparty?.avatar_url}
            name={counterpartName}
            size="md"
            className="border border-white/50"
          />

          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">
              {missionTitle ?? counterpartName}
            </p>
            {missionTitle ? (
              <p className="truncate text-xs text-gray-500">{counterpartName}</p>
            ) : null}
            {sessionData?.status ? (
              <span
                className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[var(--text-2xs-plus)] font-semibold ${
                  sessionData.status === 'completed'
                    ? 'bg-stone-200 text-stone-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {sessionData.status === 'completed' ? 'Session terminée' : 'Session active'}
              </span>
            ) : null}
          </div>

          {canCompleteSession ? (
            <button
              id="btn-complete-session"
              type="button"
              disabled={completingSession}
              onClick={() => void handleCompleteSession()}
              className="ml-auto min-h-[var(--size-touch)] rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {completingSession ? '...' : 'Terminer et noter'}
            </button>
          ) : canPromptRating ? (
            <button
              id="btn-open-rating"
              type="button"
              onClick={() => setShowRatingModal(true)}
              className="ml-auto min-h-[var(--size-touch)] rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
            >
              Noter la session
            </button>
          ) : null}
          {mode === 'session' && sessionData?.status === 'completed' && hasSubmittedRating ? (
            <span className="ml-auto inline-flex rounded-full bg-green-100 px-2.5 py-1 text-[var(--text-2xs-plus)] font-semibold text-green-700">
              Note envoyée
            </span>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-44 pt-4">
        <div className="grid gap-6 lg:grid-cols-[var(--layout-side-panel)]">
          <div>
            {error ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : null}

            {!error && !conversation && !sessionData ? (
              <p className="app-empty-state">Conversation introuvable.</p>
            ) : null}

            <div id="messages-list" className="space-y-2">
              {!error && (conversation || sessionData) && messages.length === 0 ? (
                <EmptyState
                  icon="💬"
                  title="Démarrez la conversation"
                  description="Le premier message envoyé apparaîtra ici, avec les fichiers et livraisons liés à la mission."
                  className="px-4 py-8"
                />
              ) : null}
              {messageItems}
            </div>
            <div ref={bottomRef} />

            {mode === 'session' && sessionData?.mission_id ? (
              <div className="lg:hidden">
                <DeliveryPanel
                  sessionId={chatId ?? ''}
                  missionId={sessionData.mission_id}
                  canUpload={resolvedUserType === 'pro'}
                  refreshKey={`${messages.at(-1)?.id ?? messages.length}-${deliveryRefreshKey}`}
                />
              </div>
            ) : null}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[var(--tracking-caps)] text-white/40">Contexte</p>
                <h2 className="mt-3 text-xl font-semibold text-white">{missionTitle ?? 'Conversation'}</h2>
                <p className="mt-2 text-sm text-white/60">{counterpartName}</p>
                {sessionData?.status ? (
                  <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    sessionData.status === 'completed'
                      ? 'bg-stone-100 text-stone-700'
                      : 'bg-green-500/15 text-green-200'
                  }`}>
                    {sessionData.status === 'completed' ? 'Session terminée' : 'Session active'}
                  </span>
                ) : null}
              </section>

              {mode === 'session' && sessionData?.mission_id ? (
                <DeliveryPanel
                  sessionId={chatId ?? ''}
                  missionId={sessionData.mission_id}
                  canUpload={resolvedUserType === 'pro'}
                  refreshKey={`${messages.at(-1)?.id ?? messages.length}-${deliveryRefreshKey}`}
                />
              ) : (
                <section className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                  Les fichiers et livraisons apparaîtront ici dès qu’une session liée à une mission est active.
                </section>
              )}
            </div>
          </aside>
        </div>
      </div>

      {conversation || sessionData ? (
        <div
          className="fixed bottom-[var(--safe-offset-nav)] left-0 right-0 z-40 border-t border-black/5 bg-[var(--color-surface-soft)]/95 px-4 pb-[var(--safe-offset-compact)] pt-3 backdrop-blur-md"
          style={mobileComposerStyle}
        >
          <div className="mx-auto max-w-6xl lg:pr-[var(--layout-side-panel-offset)]">
            {typingIndicator ? (
              <p className="mb-2 text-xs text-stone-500" data-testid="typing-indicator">{typingIndicator}</p>
            ) : null}
            {attachment ? (
              <div className="mb-2 flex items-center justify-between rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-stone-700">
                <span className="truncate pr-3">📎 {attachment.fileName}</span>
                <button
                  type="button"
                  aria-label="Retirer la pièce jointe"
                  onClick={() => setAttachment(null)}
                  className="inline-flex min-h-[var(--size-touch)] items-center rounded-xl px-2 text-xs text-orange-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
                >
                  Retirer
                </button>
              </div>
            ) : null}

            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,application/pdf,.zip,application/zip,application/x-zip-compressed,image/*"
                className="hidden"
                onChange={handleSelectAttachment}
              />
              {canAttachFiles ? (
                <button
                  id="btn-attach"
                  type="button"
                  aria-label="Ajouter une pièce jointe"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAttachment || sending}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-600 transition hover:border-orange-300 hover:text-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  {uploadingAttachment ? '…' : '+'}
                </button>
              ) : null}
              <textarea
                id="chat-input"
                aria-label="Message"
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 2000))}
                onKeyDown={handleInputKeyDown}
                placeholder="Écrivez un message..."
                rows={1}
                className="min-h-[var(--size-touch)] max-h-32 w-full resize-none rounded-2xl border border-stone-200 bg-white px-3 py-2 text-base md:text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button
                id="btn-send"
                type="button"
                aria-label="Envoyer le message"
                onClick={() => void sendMessage()}
                disabled={sending || uploadingAttachment || (!draft.trim() && !attachment)}
                className="flex h-11 min-w-[var(--size-touch)] items-center justify-center rounded-2xl bg-orange-500 px-3 font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {sending ? '…' : '→'}
              </button>
            </div>
            <p className="mx-auto mt-1 max-w-lg text-right text-[var(--text-2xs-plus)] text-stone-400">
              {draft.length}/2000
            </p>
          </div>
        </div>
      ) : null}

      {mode === 'session' && chatId && otherParticipant ? (
        <RatingModal
          isOpen={showRatingModal}
          sessionId={chatId}
          rateeId={otherParticipant.id}
          rateeDisplayName={getPublicProfileDisplayName(otherParticipant)}
          onSubmitted={() => setHasSubmittedRating(true)}
          onClose={() => setShowRatingModal(false)}
        />
      ) : null}
    </div>
  );
}
