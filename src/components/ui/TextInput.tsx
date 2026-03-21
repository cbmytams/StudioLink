import { cn } from "@/lib/utils";
import { ChangeEventHandler, InputHTMLAttributes, KeyboardEventHandler, ReactNode } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  icon?: ReactNode;
  error?: string;
  action?: ReactNode;
  className?: string;
  label?: string;
  value?: string | number | readonly string[];
  onChange?: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  autoCapitalize?: string;
  maxLength?: number;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
}

export function TextInput({ className, icon, error, action, label, id, ...props }: TextInputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={id} className="mb-1 px-1 text-sm font-medium text-white/70">
          {label}
        </label>
      )}
      <div className="relative w-full">
        {icon && (
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-black/40">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={cn(
            "glass-input",
            icon ? "pl-12" : "",
            action ? "pr-24" : "",
            error && "border-red-400/50 focus:border-red-500/50 bg-red-500/10",
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
