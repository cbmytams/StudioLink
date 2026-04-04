import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
} from '@/lib/notifications/notificationService';
import { supabase } from '@/lib/supabase/client';
import type { NotificationRecord } from '@/types/backend';

function upsertNotifications(
  previous: NotificationRecord[] | undefined,
  incoming: NotificationRecord,
): NotificationRecord[] {
  const list = previous ?? [];
  const exists = list.some((notification) => notification.id === incoming.id);
  if (exists) {
    return list.map((notification) =>
      notification.id === incoming.id ? { ...notification, ...incoming } : notification,
    );
  }
  return [incoming, ...list].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function useNotifications(userId?: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      return getNotifications(userId);
    },
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (!userId || !supabase) return;

    const channel = supabase
      .channel(`notifications:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = payload.new as NotificationRecord;
          queryClient.setQueryData<NotificationRecord[]>(
            ['notifications', userId],
            (previous) => upsertNotifications(previous, incoming),
          );
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = payload.new as NotificationRecord;
          queryClient.setQueryData<NotificationRecord[]>(
            ['notifications', userId],
            (previous) => upsertNotifications(previous, incoming),
          );
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [queryClient, userId]);

  return query;
}

export function useUnreadCount(userId?: string) {
  const query = useNotifications(userId);
  const unreadCount = useMemo(
    () => (query.data ?? []).filter((item) => !item.read).length,
    [query.data],
  );

  return {
    ...query,
    unreadCount,
  };
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: (_data, id) => {
      queryClient.setQueriesData<NotificationRecord[]>(
        { queryKey: ['notifications'] },
        (previous) => (previous ?? []).map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
    },
  });
}

export function useMarkAllRead(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!userId) return;
      await markAllAsRead(userId);
    },
    onSuccess: () => {
      queryClient.setQueriesData<NotificationRecord[]>(
        { queryKey: ['notifications'] },
        (previous) => (previous ?? []).map((item) => ({ ...item, read: true })),
      );
    },
  });
}
