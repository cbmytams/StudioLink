import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messageService } from '@/services/messageService';
import type { MessageRecord } from '@/types/backend';
import { supabase } from '@/lib/supabase/client';

export function useConversations(userId?: string) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      if (!userId) return [];
      return messageService.getConversations(userId);
    },
    enabled: Boolean(userId),
  });
}

export function useUnreadMessages(userId?: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['messages', 'unread-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      return messageService.getUnreadConversationCount(userId);
    },
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (!userId || !supabase) return;

    const channel = supabase
      .channel(`messages:unread:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const incoming = payload.new as MessageRecord;
        if (incoming.sender_id === userId) return;
        void queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count', userId] });
        void queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count', userId] });
        void queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
      })
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [queryClient, userId]);

  return query;
}

export function useUnreadConversationCount(userId?: string) {
  return useUnreadMessages(userId);
}

export function useMessages(conversationId?: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      return messageService.getMessages(conversationId);
    },
    enabled: Boolean(conversationId),
  });

  useEffect(() => {
    if (!conversationId || !supabase) return;

    const channel = supabase
      .channel(`messages:conversation_id=eq.${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as MessageRecord;
          queryClient.setQueryData<MessageRecord[]>(['messages', conversationId], (previous) => {
            const list = previous ?? [];
            if (list.some((message) => message.id === incoming.id)) {
              return list;
            }
            return [...list, incoming];
          });
          void queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
          void queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [conversationId, queryClient]);

  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      senderId,
      content,
      fileUrl,
    }: {
      conversationId: string;
      senderId: string;
      content: string;
      fileUrl?: string;
    }) => messageService.sendMessage(conversationId, senderId, content, fileUrl),
    onSuccess: (saved, vars) => {
      queryClient.setQueryData<MessageRecord[]>(['messages', vars.conversationId], (previous) => {
        const list = previous ?? [];
        if (list.some((message) => message.id === saved.id)) {
          return list;
        }
        return [...list, saved];
      });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
    },
  });
}
