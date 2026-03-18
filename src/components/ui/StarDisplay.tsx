import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarDisplayProps {
  rating: number;
  maxStars?: number;
  className?: string;
  size?: number;
}

export function StarDisplay({ rating, maxStars = 5, className, size = 14 }: StarDisplayProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} size={size} className="text-amber-500 fill-amber-500" />
      ))}
      {hasHalfStar && <StarHalf size={size} className="text-amber-500 fill-amber-500" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} size={size} className="text-black/20" />
      ))}
    </div>
  );
}
