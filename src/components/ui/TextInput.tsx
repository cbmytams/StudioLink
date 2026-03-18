import { cn } from "@/lib/utils";
import { InputHTMLAttributes, ReactNode } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: string;
  action?: ReactNode;
  className?: string;
  label?: string;
  value?: string | number;
  onChange?: (e: any) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  onKeyDown?: (e: any) => void;
}

export function TextInput({ className, icon, error, action, ...props }: TextInputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="relative w-full">
        {icon && (
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-black/40">
            {icon}
          </div>
        )}
        <input
          className={cn(
            "w-full glass-input rounded-full py-4 text-sm",
            icon ? "pl-12" : "pl-6",
            action ? "pr-24" : "pr-6",
            error && "border-red-400/50 focus:border-red-500/50 bg-red-50/20",
            className
          )}
          {...props}
        />
        {action && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {action}
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-500 ml-4">{error}</span>}
    </div>
  );
}
