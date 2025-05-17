import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, logMissingData } from '@/utils/logging';
import { formatPercentage, formatCurrency, formatNumber } from '@/utils/format';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MetricsTimelineChartProps {
  results: any;
  isLoading: boolean;
  timeGranularity: 'yearly' | 'monthly';
  expanded?: boolean;
}

export function MetricsTimelineChart({
  results,
  isLoading,
  timeGranularity,
  expanded = false
}: MetricsTimelineChartProps) {
  const [activeMetric, setActiveMetric] = useState<'irr' | 'multiple' | 'dpi' | 'rvpi'>('irr');

  // Process metrics timeline data for the chart
  const chartData = React.useMemo(() => {
    if (isLoading || !results) return [];

    const metricsTimeline = results.metrics_timeline;
    if (!metricsTimeline) {
      logMissingData('MetricsTimelineChart', 'metrics_timeline', 'object', metricsTimeline);
      return [];
    }

    // Get the appropriate metrics data based on time granularity
    const timeSeriesData = timeGranularity === 'yearly' 
      ? metricsTimeline.yearly || [] 
      : metricsTimeline.monthly || [];

    if (timeSeriesData.length === 0) {
      logMissingData('MetricsTimelineChart', `metrics_timeline.${timeGranularity}`, 'array', timeSeriesData);
      return [];
    }

    // Transform data for the chart
    return timeSeriesData.map((item: any) => {
      const period = timeGranularity === 'yearly' 
        ? `Year ${item.year}` 
        : `${item.year}-${String(item.month).padStart(2, '0')}`;
      
      return {
        period,
        irr: item.irr || 0,
        multiple: item.multiple || 0,
        dpi: item.dpi || 0,
        rvpi: item.rvpi || 0,
        tvpi: (item.dpi || 0) + (item.rvpi || 0)
      };
    });
  }, [results, isLoading, timeGranularity]);

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (!results || !results.metrics_timeline || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No metrics timeline data available</p>
      </div>
    );
  }

  // Custom tooltip formatter
  const tooltipFormatter = (value: number, name: string) => {
    switch (name) {
      case 'irr':
        return [formatPercentage(value, { decimals: 2 }), 'IRR'];
      case 'multiple':
        return [formatNumber(value, { decimals: 2 }), 'Equity Multiple'];
      case 'dpi':
        return [formatNumber(value, { decimals: 2 }), 'DPI'];
      case 'rvpi':
        return [formatNumber(value, { decimals: 2 }), 'RVPI'];
      case 'tvpi':
        return [formatNumber(value, { decimals: 2 }), 'TVPI'];
      default:
        return [formatNumber(value, { decimals: 2 }), name];
    }
  };

  // Get the appropriate Y-axis formatter based on the active metric
  const getYAxisFormatter = () => {
    switch (activeMetric) {
      case 'irr':
        return (value: number) => formatPercentage(value, { decimals: 0 });
      default:
        return (value: number) => value.toFixed(1) + 'x';
    }
  };

  // Get the appropriate domain based on the active metric
  const getYAxisDomain = () => {
    switch (activeMetric) {
      case 'irr':
        return [0, Math.max(...chartData.map(item => item.irr)) * 1.2];
      case 'multiple':
        return [0, Math.max(...chartData.map(item => item.multiple)) * 1.2];
      case 'dpi':
        return [0, Math.max(...chartData.map(item => item.dpi)) * 1.2];
      case 'rvpi':
        return [0, Math.max(...chartData.map(item => item.rvpi)) * 1.2];
      default:
        return [0, 'auto'];
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs 
        defaultValue="irr" 
        value={activeMetric} 
        onValueChange={(value) => setActiveMetric(value as any)} 
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="irr">IRR</TabsTrigger>
          <TabsTrigger value="multiple">Equity Multiple</TabsTrigger>
          <TabsTrigger value="dpi">DPI</TabsTrigger>
          <TabsTrigger value="rvpi">RVPI</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
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
              tickFormatter={getYAxisFormatter()}
              domain={getYAxisDomain()}
              width={60}
            />
            <Tooltip formatter={tooltipFormatter} />
            <Legend verticalAlign="top" height={36} />
            
            {activeMetric === 'irr' && (
              <Line 
                type="monotone" 
                dataKey="irr" 
                name="IRR" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            )}
            
            {activeMetric === 'multiple' && (
              <Line 
                type="monotone" 
                dataKey="multiple" 
                name="Equity Multiple" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            )}
            
            {activeMetric === 'dpi' && (
              <Line 
                type="monotone" 
                dataKey="dpi" 
                name="DPI" 
                stroke="#eab308" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            )}
            
            {activeMetric === 'rvpi' && (
              <Line 
                type="monotone" 
                dataKey="rvpi" 
                name="RVPI" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
