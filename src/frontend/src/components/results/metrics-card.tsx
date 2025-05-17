import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, logMissingData } from '@/utils/logging';
import { formatPercentage, formatCurrency, formatNumber } from '@/utils/format';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  description?: string;
  value: number | null | undefined;
  previousValue?: number | null;
  format: 'percentage' | 'currency' | 'number' | 'multiple';
  isLoading: boolean;
  icon?: React.ReactNode;
  className?: string;
  formatOptions?: Intl.NumberFormatOptions;
}

export function MetricsCard({
  title,
  description,
  value,
  previousValue,
  format,
  isLoading,
  icon,
  className = '',
  formatOptions = {}
}: MetricsCardProps) {
  // Format the value based on the specified format
  const formatValue = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'N/A';
    
    switch (format) {
      case 'percentage':
        return formatPercentage(val, { decimals: 2, ...formatOptions });
      case 'currency':
        return formatCurrency(val, { maximumFractionDigits: 2, ...formatOptions });
      case 'multiple':
        return `${formatNumber(val, { decimals: 2, ...formatOptions })}x`;
      case 'number':
      default:
        return formatNumber(val, { decimals: 0, ...formatOptions });
    }
  };

  // Calculate percentage change if both current and previous values are available
  const calculateChange = () => {
    if (value === null || value === undefined || previousValue === null || previousValue === undefined || previousValue === 0) {
      return null;
    }
    
    return (value - previousValue) / Math.abs(previousValue);
  };

  const change = calculateChange();
  const changeDirection = change === null ? 'neutral' : change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';

  // Determine the color based on the change direction
  const getChangeColor = () => {
    switch (changeDirection) {
      case 'positive':
        return 'text-green-500';
      case 'negative':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Determine the icon based on the change direction
  const getChangeIcon = () => {
    switch (changeDirection) {
      case 'positive':
        return <ArrowUpIcon className="h-4 w-4" />;
      case 'negative':
        return <ArrowDownIcon className="h-4 w-4" />;
      default:
        return <MinusIcon className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-24" />
          </CardTitle>
          {description && (
            <CardDescription>
              <Skeleton className="h-3 w-32" />
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="mt-1 flex items-center text-xs">
            <Skeleton className="h-3 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (value === null || value === undefined) {
    logMissingData('MetricsCard', title, 'number', value);
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          {title}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatValue(value)}
        </div>
        {change !== null && (
          <div className={`mt-1 flex items-center text-xs ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="ml-1">
              {formatPercentage(Math.abs(change), { decimals: 1 })} {change > 0 ? 'increase' : 'decrease'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
