import React, { useState } from 'react';
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
  ComposedChart,
  Line,
  Area,
  Label
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatCurrency, formatPercentage } from '@/utils/format';

interface LPCashFlowChartProps {
  results: any;
  isLoading: boolean;
  timeGranularity?: 'yearly' | 'quarterly' | 'monthly';
  cumulativeMode?: boolean;
  expanded?: boolean;
}

export function LPCashFlowChart({
  results,
  isLoading,
  timeGranularity = 'yearly',
  cumulativeMode = false,
  expanded = false
}: LPCashFlowChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'area' | 'composed'>('composed');

  // Process cash flow data
  const chartData = React.useMemo(() => {
    if (isLoading || !results) return [];

    // Try to get cash flows from results
    const cashFlows = results.cash_flows || results.cashFlows;
    if (!cashFlows) {
      log(LogLevel.WARN, LogCategory.DATA, 'Missing cash_flows in LPCashFlowChart');
      return [];
    }

    // Convert cash flows to array if it's an object
    let cashFlowArray = Array.isArray(cashFlows)
      ? cashFlows
      : Object.entries(cashFlows).map(([key, value]) => ({
          period: parseInt(key, 10),
          ...(typeof value === 'object' && value !== null ? value : {})
        }));

    // Sort by period
    cashFlowArray = cashFlowArray.sort((a, b) => a.period - b.period);

    // Transform data for the chart
    const transformedData = cashFlowArray.map((cf: any) => {
      // Get period label based on time granularity
      const period = timeGranularity === 'yearly' ?
        `Year ${cf.period}` :
        timeGranularity === 'quarterly' ?
          `Q${cf.period % 4 === 0 ? 4 : cf.period % 4} ${Math.floor((cf.period - 1) / 4) + 1}` :
          `Month ${cf.period}`;

      // Log the raw cash flow data for debugging
      log(LogLevel.DEBUG, LogCategory.DATA, `Raw cash flow data for period ${cf.period}:`, cf);

      // Get capital calls (negative values)
      // Capital calls should be negative, so we ensure they're negative here
      let capitalCalls = 0;
      if (cf.capital_called !== undefined) capitalCalls = -Math.abs(cf.capital_called);
      else if (cf.capitalCalled !== undefined) capitalCalls = -Math.abs(cf.capitalCalled);
      else if (cf.capital_calls !== undefined) capitalCalls = -Math.abs(cf.capital_calls);
      else if (cf.capitalCalls !== undefined) capitalCalls = -Math.abs(cf.capitalCalls);

      // --- LP perspective distributions: prioritise LP-only fields ---
      let distributions = 0;
      if (cf.lp_distribution !== undefined) distributions = cf.lp_distribution;
      else if (cf.lpDistribution !== undefined) distributions = cf.lpDistribution;
      else if (cf.total_lp_distribution !== undefined) distributions = cf.total_lp_distribution;
      else if (cf.totalLpDistribution !== undefined) distributions = cf.totalLpDistribution;
      // Fallback to generic distributions (fund-level) only if LP-specific not present
      else if (cf.distributions !== undefined) distributions = cf.distributions;

      // If we still don't have distributions but have positive net cash flow, use that
      if (distributions === 0 && cf.net_cash_flow !== undefined && cf.net_cash_flow > 0) {
        distributions = cf.net_cash_flow;
      } else if (distributions === 0 && cf.netCashFlow !== undefined && cf.netCashFlow > 0) {
        distributions = cf.netCashFlow;
      }

      // Net cash flow from LP perspective if available
      const netCashFlow = cf.lp_net_cash_flow !== undefined ? cf.lp_net_cash_flow :
                         cf.lpNetCashFlow !== undefined ? cf.lpNetCashFlow :
                         cf.net_cash_flow !== undefined ? cf.net_cash_flow :
                         cf.netCashFlow !== undefined ? cf.netCashFlow :
                         (distributions + capitalCalls);

      // Skip periods that contain no real cash-flow activity
      const hasActivity = (capitalCalls !== 0) || (distributions !== 0) || (netCashFlow !== 0);
      if (!hasActivity) {
        return null; // filtered later
      }

      return {
        period,
        year: cf.period,
        capitalCalls,
        distributions,
        netCashFlow
      };
    });

    // Drop nulls from periods with no activity
    let cleanData = transformedData.filter((d: any): d is any => d !== null);

    // Cap to fund term if available (handles both camel & snake)
    const fundTerm: number | undefined = (results?.config?.fund_term ?? results?.config?.fundTerm ??
                                         results?.metrics?.fund_term ?? results?.metrics?.fundTerm) as number | undefined;
    if (fundTerm !== undefined) {
      cleanData = cleanData.filter((d: any) => d.year <= fundTerm);
    }

    // Recompute cumulative arrays if cumulativeMode set, after filtering
    if (cumulativeMode) {
      let cumulativeCapitalCalls = 0;
      let cumulativeDistributions = 0;
      let cumulativeNetCashFlow = 0;

      cleanData = cleanData.map((item: any) => {
        cumulativeCapitalCalls += item.capitalCalls;
        cumulativeDistributions += item.distributions;
        cumulativeNetCashFlow += item.netCashFlow;

        return {
          ...item,
          capitalCalls: cumulativeCapitalCalls,
          distributions: cumulativeDistributions,
          netCashFlow: cumulativeNetCashFlow
        };
      });
    }

    return cleanData;
  }, [results, isLoading, timeGranularity, cumulativeMode]);

  // Custom tooltip formatter
  const tooltipFormatter = (value: number, name: string) => {
    if (name === 'capitalCalls') return [formatCurrency(value), 'Capital Calls'];
    if (name === 'distributions') return [formatCurrency(value), 'Distributions'];
    if (name === 'netCashFlow') return [formatCurrency(value), 'Net Cash Flow'];
    return [formatCurrency(value), name];
  };

  // Y-axis formatter
  const yAxisFormatter = (value: number) => {
    return formatCurrency(value);
  };

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No cash flow data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="flex justify-end mb-4">
        <Tabs value={chartType} onValueChange={(value) => setChartType(value as 'bar' | 'area' | 'composed')} className="w-[300px]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bar">Bar</TabsTrigger>
            <TabsTrigger value="area">Area</TabsTrigger>
            <TabsTrigger value="composed">Composed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="h-[calc(100%-50px)]">
        {chartType === 'bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              barSize={cumulativeMode ? 20 : 30}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
              >
                <Label
                  value={timeGranularity === 'yearly' ? 'Year' :
                         timeGranularity === 'quarterly' ? 'Quarter' : 'Month'}
                  position="bottom"
                  offset={20}
                  style={{ fontSize: 12, fill: '#6b7280' }}
                />
              </XAxis>
              <YAxis
                tickFormatter={yAxisFormatter}
                domain={[
                  // Calculate the minimum value with some padding
                  Math.floor(Math.min(0, ...chartData.map(d => Math.min(d.capitalCalls, d.distributions, d.netCashFlow))) / 10000000) * 10000000,
                  // Calculate the maximum value with some padding
                  Math.ceil(Math.max(...chartData.map(d => Math.max(d.capitalCalls, d.distributions, d.netCashFlow))) / 10000000) * 10000000
                ]}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
              >
                <Label
                  value="Amount ($)"
                  position="left"
                  angle={-90}
                  offset={-10}
                  style={{ fontSize: 12, fill: '#6b7280', textAnchor: 'middle' }}
                />
              </YAxis>
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <ReferenceLine y={0} stroke="#000" />
              <Bar dataKey="capitalCalls" name="Capital Calls" fill="#ef4444" />
              <Bar dataKey="distributions" name="Distributions" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === 'area' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
              >
                <Label
                  value={timeGranularity === 'yearly' ? 'Year' :
                         timeGranularity === 'quarterly' ? 'Quarter' : 'Month'}
                  position="bottom"
                  offset={20}
                  style={{ fontSize: 12, fill: '#6b7280' }}
                />
              </XAxis>
              <YAxis
                tickFormatter={yAxisFormatter}
                domain={[
                  // Calculate the minimum value with some padding
                  Math.floor(Math.min(0, ...chartData.map(d => Math.min(d.capitalCalls, d.distributions, d.netCashFlow))) / 10000000) * 10000000,
                  // Calculate the maximum value with some padding
                  Math.ceil(Math.max(...chartData.map(d => Math.max(d.capitalCalls, d.distributions, d.netCashFlow))) / 10000000) * 10000000
                ]}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
              >
                <Label
                  value="Amount ($)"
                  position="left"
                  angle={-90}
                  offset={-10}
                  style={{ fontSize: 12, fill: '#6b7280', textAnchor: 'middle' }}
                />
              </YAxis>
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <ReferenceLine y={0} stroke="#000" />
              <Area
                type="monotone"
                dataKey="capitalCalls"
                name="Capital Calls"
                fill="#ef4444"
                fillOpacity={0.3}
                stroke="#ef4444"
              />
              <Area
                type="monotone"
                dataKey="distributions"
                name="Distributions"
                fill="#22c55e"
                fillOpacity={0.3}
                stroke="#22c55e"
              />
              <Line
                type="monotone"
                dataKey="netCashFlow"
                name="Net Cash Flow"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {chartType === 'composed' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
              >
                <Label
                  value={timeGranularity === 'yearly' ? 'Year' :
                         timeGranularity === 'quarterly' ? 'Quarter' : 'Month'}
                  position="bottom"
                  offset={20}
                  style={{ fontSize: 12, fill: '#6b7280' }}
                />
              </XAxis>
              <YAxis
                tickFormatter={yAxisFormatter}
                domain={[
                  // Calculate the minimum value with some padding
                  Math.floor(Math.min(0, ...chartData.map(d => Math.min(d.capitalCalls, d.distributions, d.netCashFlow))) / 10000000) * 10000000,
                  // Calculate the maximum value with some padding
                  Math.ceil(Math.max(...chartData.map(d => Math.max(d.capitalCalls, d.distributions, d.netCashFlow))) / 10000000) * 10000000
                ]}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
              >
                <Label
                  value="Amount ($)"
                  position="left"
                  angle={-90}
                  offset={-10}
                  style={{ fontSize: 12, fill: '#6b7280', textAnchor: 'middle' }}
                />
              </YAxis>
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <ReferenceLine y={0} stroke="#000" />
              <Bar dataKey="capitalCalls" name="Capital Calls" fill="#ef4444" />
              <Bar dataKey="distributions" name="Distributions" fill="#22c55e" />
              <Line
                type="monotone"
                dataKey="netCashFlow"
                name="Net Cash Flow"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>


    </div>
  );
}
