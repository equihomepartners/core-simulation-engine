import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, logMissingData } from '@/utils/logging';
import { formatCurrency, formatPercentage } from '@/utils/format';

interface DistributionTimelineChartProps {
  results: any;
  isLoading: boolean;
  timeGranularity: 'yearly' | 'monthly';
  expanded?: boolean;
}

export function DistributionTimelineChart({
  results,
  isLoading,
  timeGranularity,
  expanded = false
}: DistributionTimelineChartProps) {
  // Process distribution timeline data for the chart
  const chartData = React.useMemo(() => {
    if (isLoading || !results) return [];

    const distributions = results.distributions;
    if (!distributions) {
      logMissingData('DistributionTimelineChart', 'distributions', 'object', distributions);
      return [];
    }

    // Get the appropriate distribution data based on time granularity
    const timeSeriesData = timeGranularity === 'yearly' 
      ? distributions.yearly || [] 
      : distributions.monthly || [];

    if (timeSeriesData.length === 0) {
      logMissingData('DistributionTimelineChart', `distributions.${timeGranularity}`, 'array', timeSeriesData);
      return [];
    }

    // Transform data for the chart
    let cumulativeDistributions = 0;
    let cumulativeDPI = 0;

    return timeSeriesData.map((item: any) => {
      const period = timeGranularity === 'yearly' 
        ? `Year ${item.year}` 
        : `${item.year}-${String(item.month).padStart(2, '0')}`;
      
      const distributions = item.distributions || 0;
      const dpi = item.dpi || 0;
      
      // Update cumulative values
      cumulativeDistributions += distributions;
      cumulativeDPI = dpi; // DPI is already cumulative

      return {
        period,
        distributions,
        cumulativeDistributions,
        dpi: cumulativeDPI
      };
    });
  }, [results, isLoading, timeGranularity]);

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (!results || !results.distributions || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No distribution timeline data available</p>
      </div>
    );
  }

  // Custom tooltip formatter
  const tooltipFormatter = (value: number, name: string) => {
    switch (name) {
      case 'distributions':
        return [formatCurrency(value, { maximumFractionDigits: 2 }), 'Distributions'];
      case 'cumulativeDistributions':
        return [formatCurrency(value, { maximumFractionDigits: 2 }), 'Cumulative Distributions'];
      case 'dpi':
        return [formatPercentage(value, { decimals: 2 }), 'DPI'];
      default:
        return [formatCurrency(value, { maximumFractionDigits: 2 }), name];
    }
  };

  // Custom label formatter for the Y axis
  const yAxisFormatter = (value: number) => {
    if (Math.abs(value) >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(0)}M`;
    } else if (Math.abs(value) >= 1_000) {
      return `${(value / 1_000).toFixed(0)}K`;
    }
    return value.toFixed(0);
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="period" 
          angle={-45} 
          textAnchor="end" 
          height={60} 
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          yAxisId="left"
          tickFormatter={yAxisFormatter}
          width={60}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          tickFormatter={(value) => value.toFixed(1) + 'x'}
          domain={[0, Math.max(...chartData.map(item => item.dpi)) * 1.2 || 1]}
          width={40}
        />
        <Tooltip formatter={tooltipFormatter} />
        <Legend verticalAlign="top" height={36} />
        
        <Bar 
          yAxisId="left"
          dataKey="distributions" 
          name="Distributions" 
          fill="#22c55e" 
          radius={[4, 4, 0, 0]}
        />
        <Line 
          yAxisId="left"
          type="monotone" 
          dataKey="cumulativeDistributions" 
          name="Cumulative Distributions" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="dpi" 
          name="DPI" 
          stroke="#ef4444" 
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <ReferenceLine 
          yAxisId="right" 
          y={1} 
          stroke="#6366f1" 
          strokeDasharray="3 3" 
          label={{ value: 'Breakeven', position: 'insideBottomRight', fill: '#6366f1' }} 
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
