import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star } from 'lucide-react';
import { StarRating } from '@/components/ui/StarRating';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    interlocutorName: string;
    interlocutorAvatar: string;
    serviceType: string;
    date: string;
  };
}

export function RatingModal({ isOpen, onClose, sessionData }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setRating(0);
      setComment('');
      onClose();
    }, 2000);
  };

  const handleClose = () => {
    if (!isSubmitted) {
      setRating(0);
      setComment('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="bg-[#f4ece4] w-full max-w-sm rounded-3xl p-6 flex flex-col items-center gap-6 shadow-2xl"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <img 
                src={sessionData.interlocutorAvatar} 
                alt={sessionData.interlocutorName} 
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm mb-2"
                referrerPolicy="no-referrer"
              />
              <h3 className="text-xl font-semibold">{sessionData.interlocutorName}</h3>
              <span className="text-sm text-black/50 font-medium capitalize">
                {sessionData.serviceType} · {sessionData.date}
              </span>
            </div>

            <div className="flex flex-col items-center gap-4 w-full">
              <h4 className="text-lg font-medium text-center">Comment s'est passée la session ?</h4>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <div className="w-full relative">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 200))}
                placeholder="Laisse un commentaire... (optionnel)"
                rows={3}
                className="bg-white/60 resize-none"
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-black/40 font-medium">
                {comment.length}/200
              </span>
            </div>

            <div className="flex flex-col gap-3 w-full mt-2">
              <Button 
                variant="primary" 
                className="w-full"
                disabled={rating === 0}
                onClick={handleSubmit}
              >
                Envoyer mon avis
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={handleClose}
              >
                Plus tard
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center gap-4 text-white"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <Star size={64} className="fill-orange-500 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
            </motion.div>
            <h2 className="text-2xl font-bold tracking-tight text-center">Merci pour ton avis !</h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
