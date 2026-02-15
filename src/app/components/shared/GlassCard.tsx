import React from 'react';
import { Card } from '../ui/card';
import { cn } from '../ui/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <Card 
      className={cn(
        'glass-card',
        'rounded-xl',
        'overflow-hidden',
        className
      )}
    >
      {children}
    </Card>
  );
}