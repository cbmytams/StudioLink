import { cn } from "@/lib/utils";
import { ChangeEventHandler, TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id?: string;
  error?: string;
  className?: string;
  label?: string;
  value?: string | number | readonly string[];
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  rows?: number;
}

export function Textarea({ className, error, label, id, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={id} className="mb-1 px-1 text-sm font-medium text-stone-700">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          "w-full glass-input rounded-2xl py-4 px-6 text-base md:text-sm min-h-[120px] resize-y",
          error && "border-red-400/50 focus:border-red-500/50 bg-red-50/20",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500 ml-4">{error}</span>}
    </div>
  );
}
