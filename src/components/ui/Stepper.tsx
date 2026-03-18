import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (val: number) => string;
  className?: string;
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  formatValue = (v) => v.toString(),
  className
}: StepperProps) {
  const handleDecrease = () => {
    if (value - step >= min) onChange(value - step);
  };

  const handleIncrease = () => {
    if (value + step <= max) onChange(value + step);
  };

  return (
    <div className={cn("flex items-center gap-4 bg-white/40 border border-white/50 rounded-full p-1 shadow-sm w-fit", className)}>
      <button
        type="button"
        onClick={handleDecrease}
        disabled={value <= min}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/60 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-black"
      >
        <Minus size={16} />
      </button>
      
      <span className="min-w-[4rem] text-center font-medium text-sm">
        {formatValue(value)}
      </span>

      <button
        type="button"
        onClick={handleIncrease}
        disabled={value >= max}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/60 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-black"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
