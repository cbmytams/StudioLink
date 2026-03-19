import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useCreateReview } from '@/hooks/useReviews';
import { useAuth } from '@/lib/supabase/auth';
import { reviewService } from '@/services/reviewService';

interface ReviewModalProps {
  isOpen: boolean;
  missionId: string;
  revieweeId: string;
  onClose: () => void;
}

export function ReviewModal({ isOpen, missionId, revieweeId, onClose }: ReviewModalProps) {
  const { session } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [canSubmit, setCanSubmit] = useState(true);
  const [checkError, setCheckError] = useState<string | null>(null);
  const createReview = useCreateReview(session?.user?.id);

  useEffect(() => {
    let active = true;
    const checkEligibility = async () => {
      if (!isOpen || !session?.user?.id) return;
      try {
        const eligible = await reviewService.canReview(session.user.id, revieweeId, missionId);
        if (!active) return;
        setCanSubmit(eligible);
        setCheckError(eligible ? null : 'Avis déjà envoyé pour cette mission.');
      } catch (error) {
        if (!active) return;
        setCanSubmit(false);
        setCheckError(error instanceof Error ? error.message : "Impossible de vérifier l'éligibilité.");
      }
    };
    void checkEligibility();
    return () => {
      active = false;
    };
  }, [isOpen, missionId, revieweeId, session?.user?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#f4ece4]/80 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-white/60 bg-white/85 p-5 shadow-[0_12px_32px_rgba(26,26,26,0.08)]">
        <h3 className="text-lg font-semibold">Laisser un avis</h3>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => {
            const value = index + 1;
            return (
              <button key={value} type="button" onClick={() => setRating(value)} className="p-1">
                <Star
                  size={22}
                  className={value <= rating ? 'text-orange-500 fill-orange-500' : 'text-stone-300'}
                />
              </button>
            );
          })}
        </div>
        <Textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          placeholder="Ton commentaire"
        />
        {checkError ? <p className="text-xs text-red-500">{checkError}</p> : null}
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button
            className="flex-1"
            disabled={rating === 0 || createReview.isPending || !canSubmit}
            onClick={async () => {
              await createReview.mutateAsync({
                mission_id: missionId,
                reviewee_id: revieweeId,
                rating,
                comment,
              });
              onClose();
            }}
          >
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}
