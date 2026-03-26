import { supabase } from '@/lib/supabase/client';
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
  return mapRating(data as RatingRow);
}
