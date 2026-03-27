import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  id?: string;
  variant?: "primary" | "secondary" | "ghost" | "icon" | "dark" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  type?: "button" | "submit" | "reset";
}

export function Button({ 
  children, 
  className, 
  variant = "primary", 
  size = "md",
  type = 'button',
  loading = false,
  loadingLabel,
  disabled = false,
  ...props 
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center font-medium transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
        // Variants
        variant === "primary" && "glass-btn-accent",
        variant === "secondary" && "glass-btn-primary",
        variant === "ghost" && "hover:bg-white/10 text-white/80 transition-colors",
        variant === "icon" && "glass-btn-circle",
        
        // Sizes
        size === "sm" && "text-sm h-11 px-4 rounded-full",
        size === "md" && "text-sm px-6 py-3 rounded-full",
        size === "lg" && "text-base px-8 py-4 rounded-full",
        size === "icon" && "h-11 w-11 p-0 rounded-full",
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>{loadingLabel ?? (typeof children === "string" ? children : "Chargement...")}</span>
        </span>
      ) : children}
    </button>
  );
}
