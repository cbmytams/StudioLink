import React from 'react';
import { Button } from '@/components/ui/Button';

type GradientButtonProps = React.ComponentProps<typeof Button>;

export function GradientButton({ children, className, ...props }: GradientButtonProps) {
  return (
    <Button
      className={`bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:opacity-95 ${className ?? ''}`}
      {...props}
    >
      {children}
    </Button>
  );
}
