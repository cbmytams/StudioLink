import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { getUnreadCount } from '@/services/notificationService';

export function useUnreadCount() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }

    let active = true;

    const refresh = async () => {
      try {
        const nextCount = await getUnreadCount(userId);
        if (!active) return;
        setCount(nextCount);
      } catch {
        if (!active) return;
        setCount(0);
      }
    };

    void refresh();

    const channel = supabase
      .channel(`unread-count:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          void refresh();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return count;
}
