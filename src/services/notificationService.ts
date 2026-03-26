import { supabase } from '@/lib/supabase/client';
import type { NotificationRecord } from '@/types/backend';

const NOTIFICATION_SELECT_COLUMNS = 'id, user_id, type, title, body, data, link, read, created_at';

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

export const notificationService = {
  async getNotifications(userId: string): Promise<NotificationRecord[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from('notifications')
      .select(NOTIFICATION_SELECT_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as NotificationRecord[];
  },

  async markAsRead(id: string): Promise<void> {
    const client = ensureClient();
    const { error } = await client.from('notifications').update({ read: true }).eq('id', id);
    if (error) throw error;
  },

  async markAllRead(userId: string): Promise<void> {
    const client = ensureClient();
    const { error } = await client
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) throw error;
  },

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const client = ensureClient();
    const { count, error } = await client
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) throw error;
    return count ?? 0;
  },
};

export async function getUserConversationIds(userId: string): Promise<string[]> {
  const client = ensureClient();

  const primary = await client
    .from('conversations')
    .select('id')
    .or(`studio_id.eq.${userId},pro_id.eq.${userId}`);

  if (!primary.error && primary.data) {
    return (primary.data as Array<{ id: string }>).map((conversation) => conversation.id);
  }

  const fallback = await client
    .from('conversations')
    .select('id')
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

  if (fallback.error) throw fallback.error;
  return ((fallback.data as Array<{ id: string }> | null) ?? []).map((conversation) => conversation.id);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const client = ensureClient();
  const conversationIds = await getUserConversationIds(userId);
  if (conversationIds.length === 0) return 0;

  const primary = await client
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .neq('sender_id', userId)
    .is('read_at', null)
    .in('conversation_id', conversationIds);

  if (!primary.error) {
    return primary.count ?? 0;
  }

  const fallback = await client
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .neq('sender_id', userId)
    .eq('read', false)
    .in('conversation_id', conversationIds);

  if (fallback.error) throw fallback.error;
  return fallback.count ?? 0;
}

export async function markConversationAsRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  const client = ensureClient();

  const primary = await client
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .is('read_at', null);

  if (!primary.error) return;

  const fallback = await client
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('read', false);

  if (fallback.error) throw fallback.error;
}
