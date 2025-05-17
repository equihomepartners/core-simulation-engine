import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, logMissingData } from '@/utils/logging';
import { formatCurrency, formatPercentage, formatMultiple } from '@/utils/format';

interface HeadlineMetricsProps {
  simulation: any;
  results: any;
  isLoading: boolean;
}

export function HeadlineMetrics({ simulation, results, isLoading }: HeadlineMetricsProps) {
  // Extract metrics from results or simulation
  const metrics = React.useMemo(() => {
    if (isLoading) return null;

    // Try to get metrics from results first, then fall back to simulation
    const metricsData = results?.metrics || simulation?.metrics;

    if (!metricsData) {
      logMissingData('HeadlineMetrics', 'metrics', 'object', metricsData);
      return null;
    }

    return metricsData;
  }, [results, simulation, isLoading]);

  // Extract fund size from different possible locations
  const fundSize = React.useMemo(() => {
    if (isLoading) return null;

    // Try different possible locations for fund size
    return results?.fund_size ||
           simulation?.config?.fund_size ||
           results?.config?.fund_size ||
           simulation?.fund_size;
  }, [results, simulation, isLoading]);

  if (!fundSize && !isLoading) {
    logMissingData('HeadlineMetrics', 'fund_size', 'number', fundSize);
  }

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      <MetricCard
        title="LP Net IRR"
        value={metrics?.lp_irr || metrics?.lpIrr}
        formatter={(value) => formatPercentage(value)}
        isLoading={isLoading}
        metricName="lp_irr"
      />
      <MetricCard
        title="LP Multiple"
        value={metrics?.lp_multiple || metrics?.lpMultiple || metrics?.multiple}
        formatter={(value) => formatMultiple(value)}
        isLoading={isLoading}
        metricName="lp_multiple"
      />
      <MetricCard
        title="Fund Size"
        value={fundSize}
        formatter={(value) => formatCurrency(value)}
        isLoading={isLoading}
        metricName="fund_size"
      />
      <MetricCard
        title="Total Distributions"
        value={metrics?.total_distributions}
        formatter={(value) => formatCurrency(value)}
        isLoading={isLoading}
        metricName="total_distributions"
      />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: any;
  formatter: (value: any) => string;
  isLoading: boolean;
  metricName: string;
}

function MetricCard({ title, value, formatter, isLoading, metricName }: MetricCardProps) {
  // Log missing data if value is undefined or null and not loading
  React.useEffect(() => {
    if ((value === undefined || value === null) && !isLoading) {
      logMissingData('MetricCard', metricName, 'number', value);
    }
  }, [value, isLoading, metricName]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        {isLoading ? (
          <Skeleton className="h-9 w-24 mt-1" />
        ) : (
          <div className="text-3xl font-bold mt-1">
            {value !== undefined && value !== null ? formatter(value) : 'N/A'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
