import React from 'react';
import { cn } from '../ui/utils';
import { LanguageToggle } from '../shared/LanguageToggle';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, action, className, children }: PageHeaderProps) {
  return (
    <div className={cn('border-b border-border px-8 py-6 mb-8', className)}>
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-primary tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-2.5 text-base tracking-wide">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          {children}
          {action}
          <LanguageToggle />
        </div>
      </div>
    </div>
  );
}