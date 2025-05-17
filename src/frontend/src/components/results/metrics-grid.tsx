import React from 'react';
import { MetricsCard } from './metrics-card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, logMissingData } from '@/utils/logging';
import { 
  TrendingUpIcon, 
  BarChart3Icon, 
  DollarSignIcon, 
  CalendarIcon,
  PieChartIcon,
  PercentIcon,
  ArrowDownIcon,
  ArrowUpIcon
} from 'lucide-react';

interface MetricsGridProps {
  results: any;
  isLoading: boolean;
  className?: string;
}

export function MetricsGrid({
  results,
  isLoading,
  className = ''
}: MetricsGridProps) {
  // Extract metrics from results
  const metrics = React.useMemo(() => {
    if (isLoading || !results) return null;

    const metricsData = results.metrics;
    if (!metricsData) {
      logMissingData('MetricsGrid', 'metrics', 'object', metricsData);
      return null;
    }

    return metricsData;
  }, [results, isLoading]);

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array(8).fill(0).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">No metrics data available</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {/* IRR */}
      <MetricsCard
        title="Net IRR"
        description="Internal Rate of Return"
        value={metrics.irr}
        format="percentage"
        isLoading={isLoading}
        icon={<TrendingUpIcon className="h-4 w-4" />}
      />

      {/* Equity Multiple */}
      <MetricsCard
        title="Equity Multiple"
        description="Total Return / Invested Capital"
        value={metrics.multiple}
        format="multiple"
        isLoading={isLoading}
        icon={<BarChart3Icon className="h-4 w-4" />}
      />

      {/* DPI */}
      <MetricsCard
        title="DPI"
        description="Distributions to Paid-In"
        value={metrics.dpi}
        format="multiple"
        isLoading={isLoading}
        icon={<ArrowDownIcon className="h-4 w-4" />}
      />

      {/* RVPI */}
      <MetricsCard
        title="RVPI"
        description="Residual Value to Paid-In"
        value={metrics.rvpi}
        format="multiple"
        isLoading={isLoading}
        icon={<ArrowUpIcon className="h-4 w-4" />}
      />

      {/* TVPI */}
      <MetricsCard
        title="TVPI"
        description="Total Value to Paid-In"
        value={metrics.tvpi}
        format="multiple"
        isLoading={isLoading}
        icon={<PieChartIcon className="h-4 w-4" />}
      />

      {/* Fund Size */}
      <MetricsCard
        title="Fund Size"
        description="Total Committed Capital"
        value={metrics.fund_size}
        format="currency"
        isLoading={isLoading}
        icon={<DollarSignIcon className="h-4 w-4" />}
      />

      {/* Fund Term */}
      <MetricsCard
        title="Fund Term"
        description="Investment Period"
        value={metrics.fund_term}
        format="number"
        isLoading={isLoading}
        icon={<CalendarIcon className="h-4 w-4" />}
        formatOptions={{ maximumFractionDigits: 0 }}
      />

      {/* Average Loan Yield */}
      <MetricsCard
        title="Avg. Loan Yield"
        description="Weighted Average Yield"
        value={metrics.avg_loan_yield}
        format="percentage"
        isLoading={isLoading}
        icon={<PercentIcon className="h-4 w-4" />}
      />
    </div>
  );
}
