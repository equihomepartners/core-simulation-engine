import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number | null;
  description?: string;
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  isLoading?: boolean;
  className?: string;
  valueClassName?: string;
  formatter?: (value: any) => string;
}

export function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
  trendLabel,
  isLoading = false,
  className,
  valueClassName,
  formatter = (val) => String(val)
}: MetricCardProps) {
  // Determine trend color and icon
  let trendColor = 'text-gray-500';
  let TrendIcon = MinusIcon;

  if (trend !== undefined && trend !== null) {
    if (trend > 0) {
      trendColor = 'text-green-500';
      TrendIcon = ArrowUpIcon;
    } else if (trend < 0) {
      trendColor = 'text-red-500';
      TrendIcon = ArrowDownIcon;
    }
  }

  return (
    <Card className={cn("overflow-hidden border shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="h-5 w-5">{icon}</div>}
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {isLoading ? (
          <Skeleton className="h-8 w-[100px]" />
        ) : (
          <>
            <div className={cn("text-2xl font-bold truncate", valueClassName)}>
              {value !== null && value !== undefined ? formatter(value) : 'N/A'}
            </div>
            {(description || trend !== undefined) && (
              <p className="text-xs text-muted-foreground mt-1.5 truncate" title={description}>
                {description}
                {trend !== undefined && (
                  <span className={cn("inline-flex items-center gap-1 ml-1", trendColor)}>
                    <TrendIcon className="h-3 w-3 inline" />
                    {Math.abs(trend)}%
                    {trendLabel && ` ${trendLabel}`}
                  </span>
                )}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
