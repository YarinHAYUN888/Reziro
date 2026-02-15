import React from 'react';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

interface GlowButtonProps extends React.ComponentProps<typeof Button> {}

export function GlowButton({ className, children, ...props }: GlowButtonProps) {
  return (
    <Button
      className={cn(
        'bg-primary hover:bg-primary/90',
        'text-primary-foreground',
        'font-semibold',
        'border-0',
        'hover:scale-105',
        'active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}