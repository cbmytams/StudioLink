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
  type?: "button" | "submit" | "reset";
}

export function Button({ 
  children, 
  className, 
  variant = "primary", 
  size = "md",
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all active:scale-95 min-h-[44px]",
        // Variants
        variant === "primary" && "bg-orange-500 hover:bg-orange-600 text-white shadow-sm",
        variant === "secondary" && "bg-white/40 hover:bg-white/60 text-black border border-white/40",
        variant === "ghost" && "hover:text-black/60 text-black",
        variant === "icon" && "bg-white/70 hover:bg-white text-black border border-white/50 backdrop-blur-md",
        
        // Sizes
        size === "sm" && "text-sm h-11 px-4 rounded-full",
        size === "md" && "text-sm px-6 py-3 rounded-full",
        size === "lg" && "text-base px-8 py-4 rounded-full",
        size === "icon" && "h-11 w-11 p-0 rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
