import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';

export function useNotifications(userId?: string) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      return notificationService.getNotifications(userId);
    },
    enabled: Boolean(userId),
    refetchInterval: 15000,
  });
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
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!userId) return;
      await notificationService.markAllRead(userId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
