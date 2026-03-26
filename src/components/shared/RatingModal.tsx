import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth';
import { getRatingForSession, submitRating } from '@/lib/ratings/ratingService';
import { useToast } from '@/components/ui/Toast';
import { toUserFacingErrorMessage } from '@/lib/errors/userFacing';

interface RatingModalProps {
  isOpen: boolean;
  sessionId: string;
  rateeId: string;
  rateeDisplayName: string;
  onClose: () => void;
}

export function RatingModal({
  isOpen,
  sessionId,
  rateeId,
  rateeDisplayName,
  onClose,
}: RatingModalProps) {
  const { session, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const userId = session?.user?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) return;

    let active = true;
    setLoading(true);
    setError(null);

    void getRatingForSession(sessionId, userId)
      .then((existing) => {
        if (!active) return;
        if (existing) {
          setRating(existing.score);
          setComment(existing.comment ?? '');
          setSubmitted(true);
        } else {
          setRating(0);
          setComment('');
          setSubmitted(false);
        }
      })
      .catch((loadError) => {
        if (!active) return;
        setError(toUserFacingErrorMessage(loadError, 'Impossible de charger la note.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, sessionId, userId]);

  const stars = useMemo(() => Array.from({ length: 5 }, (_, index) => index + 1), []);

  const handleSubmit = async () => {
    if (!userId || rating < 1 || rating > 5 || submitted) return;

    setSubmitting(true);
    setError(null);
    try {
      await submitRating({
        sessionId,
        raterId: userId,
        ratedId: rateeId,
        score: rating,
        comment,
      });
      setSubmitted(true);
      await refreshProfile();
      showToast({
        title: 'Note envoyée',
        description: `Votre avis pour ${rateeDisplayName} a été enregistré.`,
        variant: 'default',
      });
    } catch (submitError) {
      const message = toUserFacingErrorMessage(submitError, 'Impossible d’envoyer la note.');
      setError(message);
      showToast({
        title: 'Envoi impossible',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#f4ece4]/85 p-4 backdrop-blur-sm">
      <div
        id="rating-modal"
        className="w-full max-w-md rounded-[28px] border border-white/60 bg-white/95 p-6 shadow-[0_20px_50px_rgba(26,26,26,0.15)]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Évaluation</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900">Noter {rateeDisplayName}</h2>
          </div>
          <button
            type="button"
            aria-label="Fermer la fenêtre de notation"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-full border border-stone-200 p-2 text-stone-500 transition hover:bg-stone-50"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black/60" />
          </div>
        ) : submitted ? (
          <div id="rating-submitted" className="space-y-4 rounded-2xl border border-green-100 bg-green-50/80 px-4 py-5">
            <div className="text-center">
              <p className="text-3xl">⭐</p>
              <p className="mt-2 text-sm font-medium text-green-700">Merci pour votre note.</p>
              <p className="mt-1 text-xs text-green-700/80">
                {rating}/5
                {comment ? ` · “${comment}”` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Fermer
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm leading-6 text-gray-600">
              Laissez une note rapide pour clôturer la session et enrichir le profil de {rateeDisplayName}.
            </p>

            <div className="flex items-center justify-center gap-2">
              {stars.map((value) => {
                const active = value <= rating;
                return (
                  <button
                    key={value}
                    id={`star-${value}`}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`min-h-[44px] min-w-[44px] rounded-full text-3xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
                      active ? 'text-orange-500' : 'text-stone-300 hover:text-orange-300'
                    }`}
                    aria-label={`Donner ${value} étoile${value > 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                );
              })}
            </div>

            <div>
              <label htmlFor="rating-comment" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Commentaire
              </label>
              <textarea
                id="rating-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value.slice(0, 500))}
                rows={4}
                placeholder="Un retour utile, en quelques mots."
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
              />
              <p className="mt-1 text-right text-[11px] text-gray-400">{comment.length}/500</p>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <button
              id="btn-submit-rating"
              type="button"
              disabled={rating === 0 || submitting}
              onClick={() => void handleSubmit()}
              className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Envoi...' : 'Envoyer ma note'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
