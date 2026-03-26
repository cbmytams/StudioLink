import {
  fillLastNDays,
  normalizeProDashboard,
  normalizeStudioDashboard,
  type ProDashboard,
  type StudioDashboard,
  type TimeSeriesPoint,
} from './analyticsUtils';

async function ensureClient() {
  const { supabase } = await import('@/lib/supabase/client');
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

export type { ProDashboard, StudioDashboard, TimeSeriesPoint } from './analyticsUtils';

export async function getStudioDashboard(studioId: string): Promise<StudioDashboard> {
  const client = await ensureClient();
  const { data, error } = await client.rpc('get_studio_dashboard', {
    p_studio_id: studioId,
  });

  if (error) throw error;
  return normalizeStudioDashboard(data);
}

export async function getProDashboard(proId: string): Promise<ProDashboard> {
  const client = await ensureClient();
  const { data, error } = await client.rpc('get_pro_dashboard', {
    p_pro_id: proId,
  });

  if (error) throw error;
  return normalizeProDashboard(data);
}

export async function getApplicationsOverTime(
  userId: string,
  role: 'studio' | 'pro',
): Promise<TimeSeriesPoint[]> {
  const client = await ensureClient();
  const { data, error } = await client.rpc('get_applications_over_time', {
    p_user_id: userId,
    p_role: role,
  });

  if (error) throw error;

  const points = ((data as Array<{ day: string; count: number }> | null) ?? []).map((row) => ({
    day: row.day,
    count: Number(row.count ?? 0),
  }));

  return fillLastNDays(points, 30);
}
