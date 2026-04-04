import React, { HTMLAttributes, MouseEventHandler } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "dark";
  radius?: "normal" | "large" | "full";
  children?: React.ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export function GlassCard({ 
  children, 
  className, 
  variant = "light", 
  radius = "large",
  ...props 
}: GlassCardProps) {
  void variant;
  return (
    <div
      className={cn(
        "glass-card",
        radius === "normal" && "rounded-2xl",
        radius === "large" && "rounded-[var(--radius-2xl)]",
        radius === "full" && "rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
