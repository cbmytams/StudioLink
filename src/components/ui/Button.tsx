import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "icon" | "dark" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  children: ReactNode;
  className?: string;
  onClick?: (e: any) => void;
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
        "inline-flex items-center justify-center font-medium transition-all active:scale-95",
        // Variants
        variant === "primary" && "bg-[#1a1a1a] hover:bg-black text-white shadow-xl",
        variant === "secondary" && "bg-white/40 hover:bg-white/60 text-black border border-white/40",
        variant === "ghost" && "hover:text-black/60 text-black",
        variant === "icon" && "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md",
        
        // Sizes
        size === "sm" && "text-xs px-4 py-2 rounded-full",
        size === "md" && "text-sm px-6 py-3 rounded-full",
        size === "lg" && "text-base px-8 py-4 rounded-full",
        size === "icon" && "p-3 rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
