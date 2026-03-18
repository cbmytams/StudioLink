import React, { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "outline";
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ children, className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wider uppercase",
        variant === "default" && "bg-black/5 text-black/70 border border-black/10",
        variant === "success" && "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
        variant === "warning" && "bg-orange-500/10 text-orange-700 border border-orange-500/20",
        variant === "error" && "bg-red-500/10 text-red-700 border border-red-500/20",
        variant === "outline" && "bg-transparent text-black/60 border border-black/20",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
