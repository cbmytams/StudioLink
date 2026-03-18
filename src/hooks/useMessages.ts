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

export function useUnreadConversationCount(userId?: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['messages', 'unread-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      return messageService.getUnreadConversationCount(userId);
    },
    enabled: Boolean(userId),
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!userId || !supabase) return;

    const channel = supabase
      .channel(`messages:unread:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
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

export function useMessages(conversationId?: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      return messageService.getMessages(conversationId);
    },
    enabled: Boolean(conversationId),
  });
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
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ['messages', vars.conversationId] });
      const previous = queryClient.getQueryData<MessageRecord[]>(['messages', vars.conversationId]) ?? [];
      const optimistic: MessageRecord = {
        id: `optimistic-${Date.now()}`,
        conversation_id: vars.conversationId,
        sender_id: vars.senderId,
        content: vars.content || null,
        file_url: vars.fileUrl ?? null,
        read: false,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<MessageRecord[]>(['messages', vars.conversationId], [...previous, optimistic]);
      return { previous, conversationId: vars.conversationId };
    },
    onError: (_error, vars, ctx) => {
      if (ctx) {
        queryClient.setQueryData(['messages', ctx.conversationId], ctx.previous);
      }
      void queryClient.invalidateQueries({ queryKey: ['messages', vars.conversationId] });
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['messages', vars.conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useRealtimeMessages(conversationId?: string) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!conversationId) return;
    const channel = messageService.subscribeToMessages(conversationId, (incoming) => {
      queryClient.setQueryData<MessageRecord[]>(['messages', conversationId], (previous) => {
        const list = previous ?? [];
        if (list.some((message) => message.id === incoming.id)) return list;
        return [...list, incoming];
      });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
    });

    return () => {
      void channel.unsubscribe();
    };
  }, [conversationId, queryClient]);
}
