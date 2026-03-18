import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function SectionTitle({ children, className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-2xl font-light tracking-tight text-black", className)} {...props}>
      {children}
    </h2>
  );
}

export function Text({ 
  children, 
  variant = "primary", 
  className, 
  ...props 
}: HTMLAttributes<HTMLParagraphElement> & { variant?: "primary" | "secondary" | "tertiary" }) {
  return (
    <p 
      className={cn(
        variant === "primary" && "text-black",
        variant === "secondary" && "text-black/60",
        variant === "tertiary" && "text-black/40",
        className
      )} 
      {...props}
    >
      {children}
    </p>
  );
}
