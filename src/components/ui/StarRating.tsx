import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
}

export function StarRating({ value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const labels = [
    '',
    'Décevant',
    'Moyen',
    'Bien',
    'Très bien',
    'Excellent !'
  ];

  const displayValue = hovered > 0 ? hovered : value;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            aria-label={`Donner ${star} étoile${star > 1 ? 's' : ''}`}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className="p-1 focus:outline-none"
          >
            <Star
              size={32}
              className={cn(
                "transition-colors duration-200",
                star <= displayValue ? "fill-orange-500 text-orange-500" : "fill-transparent text-black/20"
              )}
            />
          </motion.button>
        ))}
      </div>
      <div className="h-6 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {displayValue > 0 && (
            <motion.span
              key={displayValue}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-sm font-medium text-orange-600"
            >
              {labels[displayValue]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
