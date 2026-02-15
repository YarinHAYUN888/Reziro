import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../ui/utils';
import { LucideIcon } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  className?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sparklineData?: number[];
}

export function StatCard({ title, value, icon: Icon, className, trend, sparklineData }: StatCardProps) {
  const chartData = sparklineData?.map((val, idx) => ({ value: val, index: idx })) || [];

  return (
    <Card className={cn('glass-card overflow-hidden group hover:border-primary/40 transition-all duration-300', className)}>
      <CardHeader className="pb-5">
        <div className="flex items-start justify-between gap-5">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">
              {title}
            </CardTitle>
          </div>
          <div className="shrink-0 p-4 rounded-2xl bg-primary/10">
            <Icon className="w-7 h-7 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-7">
        <div className="flex items-baseline justify-between gap-5 mb-4">
          <div className="text-4xl xl:text-5xl font-black text-foreground tracking-tight leading-none tabular-nums min-w-0 flex-1 ">
            {value}
          </div>
          {trend && (
            <div className={cn(
              'text-sm font-black tabular-nums shrink-0 px-3 py-1.5 rounded-lg',
              trend.isPositive ? 'text-primary bg-primary/15' : 'text-destructive bg-destructive/15'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}%
            </div>
          )}
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <div className="h-12 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}