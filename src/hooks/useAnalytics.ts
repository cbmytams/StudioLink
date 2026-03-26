import { useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth';
import * as events from '@/lib/analytics/events';
import { identifyUser } from '@/lib/analytics/posthog';

export function useAnalytics() {
  const { session, profile } = useAuth();
  const user = session?.user ?? null;

  const identify = useCallback(() => {
    const role = profile?.user_type ?? null;
    if (!user || !profile || (role !== 'studio' && role !== 'pro')) {
      return;
    }

    identifyUser(user.id, {
      role,
      email: profile.email ?? undefined,
      displayName: profile.display_name ?? undefined,
    });
  }, [profile, user]);

  return { ...events, identify };
}
