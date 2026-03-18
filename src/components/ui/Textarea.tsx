import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  className?: string;
  label?: string;
  value?: string | number;
  onChange?: (e: any) => void;
  placeholder?: string;
  rows?: number;
}

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <textarea
        className={cn(
          "w-full glass-input rounded-2xl py-4 px-6 text-sm min-h-[120px] resize-y",
          error && "border-red-400/50 focus:border-red-500/50 bg-red-50/20",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500 ml-4">{error}</span>}
    </div>
  );
}
