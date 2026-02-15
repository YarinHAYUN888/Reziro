import React from 'react';
import { Building2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse at top, rgba(14, 40, 20, 0.8) 0%, transparent 60%), radial-gradient(ellipse at bottom, rgba(10, 30, 15, 0.7) 0%, transparent 60%), linear-gradient(135deg, #050f08 0%, #0a1810 15%, #0e2414 30%, #081a0f 50%, #0c2212 70%, #061408 85%, #030a05 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="glass-card rounded-2xl px-12 py-10 text-center max-w-sm">
        <Building2
          className="w-20 h-20 text-primary mx-auto mb-6 animate-pulse-soft"
          strokeWidth={1.5}
        />
        <h1 className="text-2xl font-bold text-primary tracking-widest uppercase mb-2">
          Reziro
        </h1>
        <p className="text-sm text-muted-foreground mb-6">Loading your experience...</p>
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-full min-w-[20%] bg-primary rounded-full animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
