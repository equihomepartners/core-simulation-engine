import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Label
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, logMissingData } from '@/utils/logging';
import { formatCurrency } from '@/utils/format';

interface CashFlowChartProps {
  results: any;
  isLoading: boolean;
  timeGranularity: 'yearly' | 'monthly';
  cumulativeMode: boolean;
  expanded?: boolean;
}

export function CashFlowChart({
  results,
  isLoading,
  timeGranularity,
  cumulativeMode,
  expanded = false
}: CashFlowChartProps) {
  // Process cash flow data for the chart
  const chartData = React.useMemo(() => {
    if (isLoading || !results) return [];

    const cashFlows = results.cash_flows;
    if (!cashFlows) {
      logMissingData('CashFlowChart', 'cash_flows', 'array', cashFlows);
      return [];
    }

    // Handle different cash flow data formats
    let timeSeriesData: any[] = [];

    // Format 1: cash_flows has yearly and monthly properties
    if (cashFlows.yearly || cashFlows.monthly) {
      timeSeriesData = timeGranularity === 'yearly'
        ? cashFlows.yearly || []
        : cashFlows.monthly || [];
    }
    // Format 2: cash_flows is a dictionary with numeric string keys
    else if (Object.keys(cashFlows).some(key => !isNaN(Number(key)))) {
      timeSeriesData = Object.keys(cashFlows)
        .filter(key => !isNaN(Number(key)))
        .sort((a, b) => Number(a) - Number(b))
        .map(key => ({
          year: Number(key),
          ...cashFlows[key]
        }));
    }

    if (timeSeriesData.length === 0) {
      logMissingData('CashFlowChart', `cash_flows data`, 'array', timeSeriesData);
      return [];
    }

    // Transform data for the chart
    let cumulativeCapitalCalls = 0;
    let cumulativeDistributions = 0;
    let cumulativeNetCashFlow = 0;

    return timeSeriesData.map((item: any) => {
      const period = timeGranularity === 'yearly'
        ? `Year ${item.year}`
        : `${item.year}-${String(item.month).padStart(2, '0')}`;

      const capitalCalls = -(item.capital_calls || 0);
      const distributions = item.distributions || 0;
      const netCashFlow = distributions + capitalCalls; // Capital calls are negative

      // Update cumulative values
      cumulativeCapitalCalls += capitalCalls;
      cumulativeDistributions += distributions;
      cumulativeNetCashFlow += netCashFlow;

      return {
        period,
        capitalCalls: cumulativeMode ? cumulativeCapitalCalls : capitalCalls,
        distributions: cumulativeMode ? cumulativeDistributions : distributions,
        netCashFlow: cumulativeMode ? cumulativeNetCashFlow : netCashFlow
      };
    });
  }, [results, isLoading, timeGranularity, cumulativeMode]);

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (!results || !results.cash_flows || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No cash flow data available</p>
      </div>
    );
  }

  // Custom tooltip formatter
  const tooltipFormatter = (value: number) => {
    return formatCurrency(value, { maximumFractionDigits: 2 });
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
      <BarChart
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
          tickFormatter={yAxisFormatter}
          width={60}
        />
        <Tooltip
          formatter={tooltipFormatter}
          labelFormatter={(label) => `Period: ${label}`}
        />
        <Legend
          verticalAlign="top"
          height={36}
        />
        <ReferenceLine y={0} stroke="#000" />
        <Bar
          dataKey="capitalCalls"
          name="Capital Calls"
          fill="#ef4444"
          stackId={cumulativeMode ? undefined : "a"}
        />
        <Bar
          dataKey="distributions"
          name="Distributions"
          fill="#22c55e"
          stackId={cumulativeMode ? undefined : "a"}
        />
        {cumulativeMode && (
          <Bar
            dataKey="netCashFlow"
            name="Net Cash Flow"
            fill="#3b82f6"
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
