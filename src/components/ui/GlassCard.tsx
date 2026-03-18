import React, { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "dark";
  radius?: "normal" | "large" | "full";
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: any) => void;
}

export function GlassCard({ 
  children, 
  className, 
  variant = "light", 
  radius = "large",
  ...props 
}: GlassCardProps) {
  return (
    <div
      className={cn(
        variant === "light" ? "glass-panel" : "glass-dark",
        radius === "normal" && "rounded-2xl",
        radius === "large" && "rounded-[2.5rem]",
        radius === "full" && "rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
