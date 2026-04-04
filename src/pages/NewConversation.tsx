import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';

type NewConversationState = {
  proId?: string
  proName?: string
  studioId?: string
  studioName?: string
};

type ConversationLookup = {
  id: string
};

export default function NewConversation() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { session, profile } = useAuth();
  const userId = session?.user?.id ?? null;
  const payload = (state as NewConversationState | null) ?? null;
  const currentUserType = (profile as { user_type?: 'studio' | 'pro' | null; type?: 'studio' | 'pro' | null } | null)?.user_type
    ?? (profile as { user_type?: 'studio' | 'pro' | null; type?: 'studio' | 'pro' | null } | null)?.type
    ?? null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const initConversation = async () => {
      const targetId = payload?.proId ?? payload?.studioId ?? null;

      if (!userId || !targetId) {
        if (!active) return;
        setError('Impossible de démarrer la conversation.');
        setLoading(false);
        return;
      }

      let studioId: string | null = null;
      let proId: string | null = null;
      if (currentUserType === 'studio') {
        studioId = userId;
        proId = payload?.proId ?? null;
      } else if (currentUserType === 'pro') {
        studioId = payload?.studioId ?? null;
        proId = userId;
      } else if (payload?.proId) {
        studioId = userId;
        proId = payload.proId;
      } else if (payload?.studioId) {
        studioId = payload.studioId;
        proId = userId;
      }

      if (!studioId || !proId || studioId === proId) {
        if (!active) return;
        setError('Conversation invalide.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const existing = await supabase
          .from('conversations')
          .select('id')
          .or(
            `and(participant_1.eq.${userId},participant_2.eq.${targetId}),and(participant_1.eq.${targetId},participant_2.eq.${userId})`,
          )
          .maybeSingle();

        if (existing.error) throw existing.error;
        if (existing.data?.id) {
          if (!active) return;
          navigate(`/chat/${existing.data.id}`, { replace: true });
          return;
        }

        const create = await supabase
          .from('conversations')
          .insert({
            participant_1: userId,
            participant_2: targetId,
          })
          .select('id')
          .single();

        if (create.error) throw create.error;

        if (!active) return;
        navigate(`/chat/${(create.data as ConversationLookup).id}`, { replace: true });
      } catch (createError) {
        if (!active) return;
        setError(createError instanceof Error ? createError.message : 'Impossible de créer la conversation.');
        setLoading(false);
      }
    };

    void initConversation();
    return () => {
      active = false;
    };
  }, [currentUserType, navigate, payload?.proId, payload?.studioId, userId]);

  return (
    <div className="app-shell min-h-[var(--size-full-dvh)]">
      <Helmet>
        <title>Nouvelle conversation — StudioLink</title>
      </Helmet>
      <div className="app-container-compact flex min-h-[var(--size-full-dvh)] items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
            <p className="text-sm app-muted">
              Ouverture de la conversation avec {payload?.proName ?? payload?.studioName ?? 'ce contact'}...
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm text-red-600">{error ?? 'Une erreur est survenue.'}</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-orange-500 text-sm hover:underline mt-3"
            >
              ← Retour
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
