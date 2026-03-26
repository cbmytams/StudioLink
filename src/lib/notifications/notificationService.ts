import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import type { NotificationRecord } from '@/types/backend';

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  link: string | null;
  read: boolean | null;
  created_at: string;
};

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

function mapNotificationRow(row: NotificationRow): NotificationRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type as NotificationRecord['type'],
    title: row.title,
    body: row.body,
    data: row.data ?? {},
    link: row.link,
    read: row.read ?? false,
    created_at: row.created_at,
  };
}

export async function getNotifications(userId: string): Promise<NotificationRecord[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from('notifications')
    .select('id, user_id, type, title, body, data, link, read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return ((data as NotificationRow[] | null) ?? []).map(mapNotificationRow);
}

export async function markAsRead(notificationId: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllAsRead(userId: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const client = ensureClient();
  const { count, error } = await client
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
  return count ?? 0;
}

export function subscribeToNotifications(
  userId: string,
  callback: (notification: NotificationRecord) => void,
): RealtimeChannel {
  const client = ensureClient();
  return client
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback(mapNotificationRow(payload.new as NotificationRow)),
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback(mapNotificationRow(payload.new as NotificationRow)),
    )
    .subscribe();
}
