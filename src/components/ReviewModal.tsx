import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useCreateReview } from '@/hooks/useReviews';
import { useAuth } from '@/auth/AuthProvider';

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
  const createReview = useCreateReview(session?.user?.id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 flex flex-col gap-4">
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
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button
            className="flex-1"
            disabled={rating === 0 || createReview.isPending}
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
