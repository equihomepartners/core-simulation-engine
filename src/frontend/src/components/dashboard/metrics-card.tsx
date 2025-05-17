import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LogCategory, LogLevel, log } from '@/utils/logging';

interface MetricsCardProps {
  title: string;
  description?: string;
  value: string | number | null | undefined;
  previousValue?: string | number | null;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
  className?: string;
  formatter?: (value: number) => string;
  target?: number;
  targetLabel?: string;
}

export function MetricsCard({
  title,
  description,
  value,
  previousValue,
  icon,
  trend,
  isLoading = false,
  className,
  formatter = (val) => String(val),
  target,
  targetLabel = 'Target',
}: MetricsCardProps) {
  // Handle missing or invalid data
  if (value === undefined || value === null) {
    log(LogLevel.WARN, LogCategory.METRICS, `Missing metric: ${title}`);
    value = 'N/A';
  }

  // Calculate trend if not provided but we have previous value
  if (trend === undefined && previousValue !== undefined && previousValue !== null && typeof value === 'number' && typeof previousValue === 'number') {
    if (previousValue === 0) {
      trend = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral';
    } else {
      trend = value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral';
    }
  }

  // Format the value if it's a number and we have a formatter
  const displayValue = typeof value === 'number' ? formatter(value) : value;
  const displayTarget = target !== undefined && typeof target === 'number' ? formatter(target) : null;

  // Calculate percent change if we have previous value
  let percentChange: string | null = null;
  if (typeof value === 'number' && typeof previousValue === 'number' && previousValue !== 0) {
    const change = ((value - previousValue) / Math.abs(previousValue)) * 100;
    percentChange = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  }

  // Calculate target comparison if we have a target
  let targetComparison: { text: string; status: 'success' | 'warning' | 'danger' | 'neutral' } | null = null;
  if (typeof value === 'number' && target !== undefined) {
    const diff = value - target;
    const percentDiff = (diff / target) * 100;

    if (Math.abs(percentDiff) < 5) {
      targetComparison = {
        text: `On target (${percentDiff > 0 ? '+' : ''}${percentDiff.toFixed(1)}%)`,
        status: 'neutral'
      };
    } else if (diff > 0) {
      targetComparison = {
        text: `Above target (+${percentDiff.toFixed(1)}%)`,
        status: 'success'
      };
    } else {
      targetComparison = {
        text: `Below target (${percentDiff.toFixed(1)}%)`,
        status: diff < 0 && Math.abs(percentDiff) > 20 ? 'danger' : 'warning'
      };
    }
  }

  // Get trend icon
  const getTrendIcon = () => {
    if (!trend) return null;

    if (trend === 'up') {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-green-600"
        >
          <path d="m18 15-6-6-6 6"/>
        </svg>
      );
    } else if (trend === 'down') {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-600"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      );
    }

    return null;
  };

  return (
    <Card className={cn('overflow-hidden hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon || getTrendIcon()}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            {isLoading ? (
              <div className="h-9 w-24 animate-pulse rounded-md bg-muted"></div>
            ) : (
              <div className="text-2xl font-bold">{displayValue}</div>
            )}
          </div>

          {percentChange && trend && (
            <p
              className={cn(
                'text-xs font-medium flex items-center gap-1',
                trend === 'up' && 'text-green-600',
                trend === 'down' && 'text-red-600'
              )}
            >
              {percentChange} from previous
            </p>
          )}

          {displayTarget && (
            <div className="text-xs text-muted-foreground">
              {targetLabel}: {displayTarget}
            </div>
          )}

          {targetComparison && (
            <div
              className={cn(
                'text-xs font-medium mt-1 px-2 py-1 rounded-full w-fit',
                targetComparison.status === 'success' && 'bg-green-100 text-green-800',
                targetComparison.status === 'warning' && 'bg-yellow-100 text-yellow-800',
                targetComparison.status === 'danger' && 'bg-red-100 text-red-800',
                targetComparison.status === 'neutral' && 'bg-gray-100 text-gray-800'
              )}
            >
              {targetComparison.text}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
