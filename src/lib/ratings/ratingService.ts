import { supabase } from '@/lib/supabase/client';
import { trackRatingGiven } from '@/lib/analytics/events';
import type { RatingRecord } from '@/types/backend';

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase non configuré.');
  }
  return supabase;
}

type RatingRow = {
  id: string;
  session_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  comment: string | null;
  created_at: string;
};

function mapRating(row: RatingRow): RatingRecord {
  return {
    id: row.id,
    session_id: row.session_id,
    rater_id: row.rater_id,
    rated_id: row.rated_id,
    score: row.score,
    comment: row.comment,
    created_at: row.created_at,
  };
}

async function resolveRaterRole(sessionId: string, raterId: string): Promise<'studio' | 'pro' | null> {
  const client = ensureClient();
  const { data, error } = await client
    .from('sessions')
    .select('studio_id, pro_id')
    .eq('id', sessionId)
    .maybeSingle();

  if (error || !data) return null;
  if (data.studio_id === raterId) return 'studio';
  if (data.pro_id === raterId) return 'pro';
  return null;
}

export async function getRatingForSession(sessionId: string, raterId: string): Promise<RatingRecord | null> {
  const client = ensureClient();
  const { data, error } = await client
    .from('ratings')
    .select('id, session_id, rater_id, rated_id, score, comment, created_at')
    .eq('session_id', sessionId)
    .eq('rater_id', raterId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRating(data as RatingRow) : null;
}

export async function submitRating(input: {
  sessionId: string;
  raterId: string;
  ratedId: string;
  score: number;
  comment?: string;
}): Promise<RatingRecord> {
  const client = ensureClient();
  const { data, error } = await client
    .from('ratings')
    .insert({
      session_id: input.sessionId,
      rater_id: input.raterId,
      rated_id: input.ratedId,
      score: input.score,
      comment: input.comment?.trim() ? input.comment.trim() : null,
    })
    .select('id, session_id, rater_id, rated_id, score, comment, created_at')
    .single();

  if (error) throw error;
  const created = mapRating(data as RatingRow);
  const role = await resolveRaterRole(input.sessionId, input.raterId);
  if (role) {
    trackRatingGiven({
      score: input.score,
      role,
      sessionId: input.sessionId,
    });
  }
  return created;
}
