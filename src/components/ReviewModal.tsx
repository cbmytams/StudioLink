import { useEffect, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { StarRating } from '@/components/ui/StarRating';
import { useCreateReview } from '@/hooks/useReviews';
import { useAuth } from '@/lib/supabase/auth';
import { toUserFacingErrorMessage } from '@/lib/errors/userFacing';
import { reviewService } from '@/services/reviewService';
import { useToast } from '@/components/ui/Toast';

type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  missionId: string;
  reviewedId: string;
  reviewedName: string;
  onSubmitted?: () => void;
};

export function ReviewModal({
  isOpen,
  onClose,
  missionId,
  reviewedId,
  reviewedName,
  onSubmitted,
}: ReviewModalProps) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const createReview = useCreateReview(session?.user?.id);

  useEffect(() => {
    if (!isOpen) return;
    window.requestAnimationFrame(() => {
      const cancelButton = document.getElementById('btn-review-cancel') as HTMLButtonElement | null;
      cancelButton?.focus();
    });
    setRating(0);
    setComment('');
    setCheckError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    let active = true;

    const checkAlreadyReviewed = async () => {
      if (!isOpen || !session?.user?.id) return;
      try {
        const reviewed = await reviewService.hasReviewed(missionId, session.user.id);
        if (!active) return;
        setAlreadyReviewed(reviewed);
      } catch (error) {
        if (!active) return;
        setAlreadyReviewed(false);
        setCheckError(toUserFacingErrorMessage(error, 'Impossible de vérifier les avis existants.'));
      }
    };

    void checkAlreadyReviewed();

    return () => {
      active = false;
    };
  }, [isOpen, missionId, session?.user?.id]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-[var(--color-surface-soft)]/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <FocusTrap>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
          className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-white/60 bg-white/85 p-5 shadow-[var(--shadow-overlay-xs)]"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <h2 id="review-modal-title" className="text-lg font-semibold">Laisser un avis</h2>
          <p className="text-sm text-stone-600">Pour {reviewedName}</p>

          <StarRating value={rating} onChange={setRating} />

          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            placeholder="Votre commentaire (optionnel)"
          />

          {checkError ? <p className="text-xs text-red-500">{checkError}</p> : null}
          {alreadyReviewed ? <p className="text-xs text-stone-500">Vous avez déjà laissé un avis pour cette mission.</p> : null}

          <div className="flex gap-2">
            <Button id="btn-review-cancel" variant="ghost" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button
              className="flex-1"
              disabled={rating === 0 || createReview.isPending || alreadyReviewed}
              onClick={async () => {
                try {
                  await createReview.mutateAsync({
                    missionId,
                    reviewedId,
                    rating,
                    comment,
                  });
                  onSubmitted?.();
                  onClose();
                } catch (error) {
                  const message = toUserFacingErrorMessage(error, 'Impossible d’envoyer cet avis.');
                  showToast({
                    title: 'Envoi impossible',
                    description: message,
                    variant: 'destructive',
                  });
                }
              }}
            >
              {createReview.isPending ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
