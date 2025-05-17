import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, logMissingData } from '@/utils/logging';
import { formatCurrency, formatNumber } from '@/utils/format';

interface PortfolioEvolutionChartProps {
  results: any;
  isLoading: boolean;
  timeGranularity: 'yearly' | 'monthly';
  expanded?: boolean;
}

export function PortfolioEvolutionChart({
  results,
  isLoading,
  timeGranularity,
  expanded = false
}: PortfolioEvolutionChartProps) {
  // Process portfolio evolution data for the chart
  const chartData = React.useMemo(() => {
    if (isLoading || !results) return [];

    const portfolioEvolution = results.portfolio_evolution;
    if (!portfolioEvolution) {
      logMissingData('PortfolioEvolutionChart', 'portfolio_evolution', 'object', portfolioEvolution);
      return [];
    }

    // Handle different portfolio evolution data formats
    let timeSeriesData: any[] = [];

    // Format 1: portfolio_evolution has yearly and monthly properties
    if (portfolioEvolution.yearly || portfolioEvolution.monthly) {
      timeSeriesData = timeGranularity === 'yearly'
        ? portfolioEvolution.yearly || []
        : portfolioEvolution.monthly || [];
    }
    // Format 2: portfolio_evolution is a dictionary with numeric string keys
    else if (Object.keys(portfolioEvolution).some(key => !isNaN(Number(key)))) {
      timeSeriesData = Object.keys(portfolioEvolution)
        .filter(key => !isNaN(Number(key)))
        .sort((a, b) => Number(a) - Number(b))
        .map(key => ({
          year: Number(key),
          ...portfolioEvolution[key]
        }));
    }

    if (timeSeriesData.length === 0) {
      logMissingData('PortfolioEvolutionChart', `portfolio_evolution data`, 'array', timeSeriesData);
      return [];
    }

    // Transform data for the chart
    return timeSeriesData.map((item: any) => {
      const period = timeGranularity === 'yearly'
        ? `Year ${item.year}`
        : `${item.year}-${String(item.month).padStart(2, '0')}`;

      return {
        period,
        activeLoans: item.active_loans || 0,
        activeLoansValue: item.active_loans_value || 0,
        exitedLoansOriginal: item.exited_loans_original || 0,
        exitedLoansReinvest: item.exited_loans_reinvest || 0,
        totalExitedLoans: (item.exited_loans_original || 0) + (item.exited_loans_reinvest || 0),
        totalLoans: (item.active_loans || 0) + (item.exited_loans_original || 0) + (item.exited_loans_reinvest || 0)
      };
    });
  }, [results, isLoading, timeGranularity]);

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (!results || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No portfolio evolution data available</p>
      </div>
    );
  }

  // Custom tooltip formatter for loan counts
  const tooltipFormatter = (value: number, name: string) => {
    if (name === 'activeLoansValue') {
      return [formatCurrency(value, { maximumFractionDigits: 2 }), 'Active Loans Value'];
    }
    return [formatNumber(value), name.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())];
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
    <div className="w-full h-full">
      <div className="h-[calc(100%-20px)]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
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
              tickFormatter={yAxisFormatter}
              width={60}
            />
            <Tooltip formatter={tooltipFormatter} />
            <Legend verticalAlign="top" height={36} />

            <Area
              yAxisId="left"
              type="monotone"
              dataKey="activeLoans"
              name="Active Loans"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="exitedLoansOriginal"
              name="Exited Original Loans"
              stackId="1"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.6}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="exitedLoansReinvest"
              name="Exited Reinvested Loans"
              stackId="1"
              stroke="#eab308"
              fill="#eab308"
              fillOpacity={0.6}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="activeLoansValue"
              name="Active Loans Value"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>


    </div>
  );
}
