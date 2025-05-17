import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, logMissingData } from '@/utils/logging';
import { formatPercentage, formatCurrency } from '@/utils/format';

// Helper function to get color for zone
const getZoneColor = (zoneName: string): string => {
  const zoneColors: Record<string, string> = {
    'zone_1': '#3b82f6', // blue
    'zone_2': '#22c55e', // green
    'zone_3': '#eab308', // yellow
    'zone_4': '#ef4444', // red
    'zone_5': '#6366f1', // indigo
    'other': '#a855f7',  // purple
    'Green Zone': '#10b981', // emerald
    'Orange Zone': '#f59e0b', // amber
    'Red Zone': '#ef4444', // red
  };

  return zoneColors[zoneName] || '#a855f7'; // purple as default
};

interface ZoneAllocationChartProps {
  results: any;
  isLoading: boolean;
  expanded?: boolean;
}

export function ZoneAllocationChart({
  results,
  isLoading,
  expanded = false
}: ZoneAllocationChartProps) {
  // Process zone allocation data for the chart
  const chartData = React.useMemo(() => {
    if (isLoading || !results) return [];

    // Try to get zone allocation from different sources

    // Format 1: Direct zone_allocation in results
    if (results.zone_allocation && results.zone_allocation.zones) {
      const { zones, values, colors } = results.zone_allocation;

      // Transform data for the chart
      return zones.map((zone: string, index: number) => ({
        name: zone,
        value: values[index] * (results.fund_size || 100000000), // Convert percentage to value
        fill: colors?.[index] || getZoneColor(zone)
      }));
    }

    // Format 2: portfolio.zone_allocation
    const portfolio = results.portfolio;
    if (!portfolio) {
      logMissingData('ZoneAllocationChart', 'portfolio', 'object', portfolio);
      return [];
    }

    const zoneAllocation = portfolio.zone_allocation;
    if (!zoneAllocation) {
      logMissingData('ZoneAllocationChart', 'portfolio.zone_allocation', 'object', zoneAllocation);
      return [];
    }

    // Transform data for the chart
    return Object.entries(zoneAllocation)
      .filter(([key, value]) => key.startsWith('zone_') && typeof value === 'number' && value > 0)
      .map(([key, value]) => ({
        name: key.replace('zone_', 'Zone '),
        value: value,
        fill: getZoneColor(key)
      }));
  }, [results, isLoading]);

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (!results || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No zone allocation data available</p>
      </div>
    );
  }

  // Calculate total for percentage calculation
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltip formatter
  const tooltipFormatter = (value: number, name: string, props: any) => {
    const percentage = (value / total) * 100;
    return [
      `${formatCurrency(value, { maximumFractionDigits: 2 })} (${formatPercentage(percentage / 100, { decimals: 1 })})`,
      name
    ];
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip formatter={tooltipFormatter} />
        <Legend layout="vertical" verticalAlign="middle" align="right" />
      </PieChart>
    </ResponsiveContainer>
  );
}
