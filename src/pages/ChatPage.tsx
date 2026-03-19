import { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUp, Info, Paperclip } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useConversations, useMessages, useSendMessage } from '@/hooks/useMessages';
import { messageService } from '@/services/messageService';
import { useToast } from '@/components/ui/Toast';
import { ConversationSkeleton } from '@/components/skeletons/ConversationSkeleton';
import type { MessageRecord } from '@/types/backend';

function EmptyState({
  emoji,
  text,
  cta,
  onCta,
}: {
  emoji: string;
  text: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="text-sm leading-relaxed text-stone-500">{text}</p>
      {cta && onCta ? (
        <button
          type="button"
          onClick={onCta}
          className="mt-1 min-h-[44px] rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white"
        >
          {cta}
        </button>
      ) : null}
    </div>
  );
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session, profile } = useAuth();
  const userId = session?.user?.id;
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<'studio' | 'pro'>('studio');
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(conversationId);
  const [draft, setDraft] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [sendingFile, setSendingFile] = useState(false);
  const [isPeerTyping, setIsPeerTyping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const activeTab = searchParams.get('tab') === 'files' ? 'files' : 'messages';

  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    isError: conversationsError,
    error: conversationsErrorData,
  } = useConversations(userId);

  const {
    data: messages = [],
    isLoading: messagesLoading,
    isError: messagesError,
    error: messagesErrorData,
  } = useMessages(selectedConversationId);

  const sendMessage = useSendMessage();

  useEffect(() => {
    if (!selectedConversationId || !userId) return;

    const markReadOnOpen = async () => {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', selectedConversationId)
        .neq('sender_id', userId)
        .eq('read', false);
    };

    void markReadOnOpen();
  }, [selectedConversationId, userId]);

  useEffect(() => {
    if (!selectedConversationId || !userId || messages.length === 0) return;
    const hasUnreadFromOther = messages.some(
      (message) => message.sender_id !== userId && !message.read,
    );
    if (!hasUnreadFromOther) return;

    const markRead = async () => {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', selectedConversationId)
        .neq('sender_id', userId)
        .eq('read', false);
    };

    void markRead();
  }, [messages, selectedConversationId, userId]);

  useEffect(() => {
    if (conversationId) {
      setSelectedConversationId(conversationId);
      return;
    }
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversationId, conversations, selectedConversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!selectedConversationId || !userId || !supabase) return;

    const channel = supabase
      .channel(`typing:${selectedConversationId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const senderId = (payload as { senderId?: string }).senderId;
        if (!senderId || senderId === userId) return;
        setIsPeerTyping(true);
        if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
        typingTimerRef.current = window.setTimeout(() => setIsPeerTyping(false), 1200);
      })
      .subscribe();

    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      setIsPeerTyping(false);
      void channel.unsubscribe();
    };
  }, [selectedConversationId, userId]);

  useEffect(() => {
    if (!selectedConversationId || !userId || !supabase || !draft.trim()) return;
    const channel = supabase.channel(`typing:${selectedConversationId}`);
    void channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return;
      void channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { senderId: userId },
      });
      void channel.unsubscribe();
    });
  }, [draft, selectedConversationId, userId]);

  const fileMessages = useMemo(
    () => messages.filter((message) => Boolean(message.file_url)),
    [messages],
  );

  const send = async () => {
    if (!selectedConversationId || !userId) return;
    const hasText = draft.trim().length > 0;
    if (!hasText && !selectedFile) return;

    try {
      let fileUrl: string | undefined;
      if (selectedFile) {
        setSendingFile(true);
        fileUrl = await messageService.uploadFile(selectedFile, userId);
      }
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        senderId: userId,
        content: draft.trim(),
        fileUrl,
      });

      const recipientId = activeConversation
        ? (activeConversation.participant_1 === userId
          ? activeConversation.participant_2
          : activeConversation.participant_1)
        : null;

      if (recipientId) {
        const senderName = profile?.display_name || 'Un contact';
        const { error: notificationError } = await supabase.from('notifications').insert({
          user_id: recipientId,
          type: 'new_message',
          title: 'Nouveau message',
          body: `${senderName} vous a envoyé un message`,
          read: false,
        });
        if (notificationError) {
          showToast({
            title: 'Message envoyé',
            description: 'Le message est bien parti, mais la notification destinataire a échoué.',
            variant: 'destructive',
          });
        }
      }

      setDraft('');
      setSelectedFile(null);
    } catch (error) {
      showToast({
        title: 'Envoi impossible',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setSendingFile(false);
    }
  };

  const switchTab = (tab: 'messages' | 'files') => {
    setSearchParams(tab === 'messages' ? {} : { tab }, { replace: true });
  };

  const activeConversation = conversations.find((conversation) => conversation.id === selectedConversationId);

  return (
    <div className="app-shell flex flex-col">
      <Helmet>
        <title>Messagerie — StudioLink</title>
        <meta name="description" content="Échangez avec vos contacts StudioLink." />
      </Helmet>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-[#f4ece4]/85 px-4 py-3 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full"
          >
            <ArrowLeft size={18} />
          </button>
          <p className="text-sm font-semibold">Messagerie</p>
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full"
          >
            <Info size={18} />
          </button>
        </div>

        <div className="mb-2 grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant={viewMode === 'studio' ? 'primary' : 'ghost'}
            onClick={() => setViewMode('studio')}
          >
            Vue Studio
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'pro' ? 'primary' : 'ghost'}
            onClick={() => setViewMode('pro')}
          >
            Vue Pro
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {conversationsLoading ? (
            <ConversationSkeleton />
          ) : conversationsError ? (
            <span className="text-xs text-red-500">
              {conversationsErrorData instanceof Error ? conversationsErrorData.message : 'Erreur de chargement.'}
            </span>
          ) : conversations.length === 0 ? (
            <span className="text-xs text-stone-500">Aucune conversation</span>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => {
                  setSelectedConversationId(conversation.id);
                  navigate(`/chat/${conversation.id}`, { replace: true });
                }}
                className={`flex min-h-[44px] flex-shrink-0 items-center rounded-full px-3 text-xs font-medium ${
                  selectedConversationId === conversation.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/70 text-stone-700'
                }`}
              >
                Conversation {conversation.id.slice(0, 6)}
              </button>
            ))
          )}
        </div>

        <div className="mt-3 flex border-b border-stone-200">
          <button
            type="button"
            onClick={() => switchTab('messages')}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'messages'
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-stone-500'
            }`}
          >
            Messages
          </button>
          <button
            type="button"
            onClick={() => switchTab('files')}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'files'
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-stone-500'
            }`}
          >
            Fichiers
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-40 pt-4">
        {activeTab === 'messages' ? (
          selectedConversationId ? (
            messagesLoading ? (
              <div className="space-y-3">
                <ConversationSkeleton />
                <ConversationSkeleton />
              </div>
            ) : messagesError ? (
              <p className="text-sm text-red-500">
                {messagesErrorData instanceof Error ? messagesErrorData.message : 'Impossible de charger les messages.'}
              </p>
            ) : messages.length === 0 ? (
              <EmptyState emoji="💬" text="Commencez la conversation !" />
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const mine = message.sender_id === userId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? 'rounded-br-sm bg-orange-500 text-white'
                            : 'rounded-bl-sm bg-white/80 text-stone-800'
                        }`}
                      >
                        {message.content ? <p>{message.content}</p> : null}
                        {message.file_url ? (
                          <a
                            href={message.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className={`mt-1 block text-xs underline ${mine ? 'text-white/90' : 'text-orange-600'}`}
                          >
                            Fichier joint
                          </a>
                        ) : null}
                        <p className={`mt-1 text-[10px] ${mine ? 'text-white/80' : 'text-stone-500'}`}>
                          {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {isPeerTyping ? (
                  <p className="text-xs text-stone-500">en train d&apos;écrire...</p>
                ) : null}
                <div ref={bottomRef} />
              </div>
            )
          ) : (
            <EmptyState
              emoji="💬"
              text="Aucune conversation — commencez par contacter un professionnel."
              cta="Explorer les missions"
              onCta={() => navigate(profile?.user_type === 'studio' ? '/studio/dashboard' : '/pro/feed')}
            />
          )
        ) : (
          <div className="space-y-3">
            {fileMessages.length === 0 ? (
              <EmptyState emoji="📁" text="Aucun fichier partagé." />
            ) : (
              fileMessages.map((message: MessageRecord) => (
                <div key={message.id}>
                  <GlassCard className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">Pièce jointe</p>
                      <p className="text-xs text-stone-500">
                        {new Date(message.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => window.location.assign(message.file_url || '#')}
                    >
                      Ouvrir
                    </Button>
                  </GlassCard>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {activeTab === 'messages' ? (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 border-t border-stone-200 bg-[#f4ece4]/90 p-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-stone-500 hover:bg-black/5"
            >
              <Paperclip size={18} />
            </button>

            <div className="flex min-h-[44px] flex-1 items-center rounded-3xl border border-stone-200 bg-white/80 px-3">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Écrire un message..."
                className="w-full bg-transparent text-sm placeholder:text-stone-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.1 }}
              onClick={() => void send()}
              disabled={!selectedConversationId || sendMessage.isPending || sendingFile}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-orange-500 text-white disabled:opacity-50"
            >
              <ArrowUp size={18} />
            </motion.button>
          </div>
          {selectedFile ? (
            <p className="mx-auto mt-2 max-w-3xl truncate text-xs text-stone-600">
              Fichier prêt: {selectedFile.name}
            </p>
          ) : null}
        </div>
      ) : null}

      <BottomSheet isOpen={infoOpen} onClose={() => setInfoOpen(false)} title="Détails conversation">
        <div className="space-y-3 p-4">
          <p className="text-sm text-stone-700">Type de vue: {viewMode === 'studio' ? 'Studio' : 'Pro'}</p>
          <p className="text-sm text-stone-700">
            Conversation active: {activeConversation?.id || 'Aucune'}
          </p>
          <p className="text-sm text-stone-700">Utilisateur: {profile?.display_name || profile?.email || '—'}</p>
        </div>
      </BottomSheet>
    </div>
  );
}
