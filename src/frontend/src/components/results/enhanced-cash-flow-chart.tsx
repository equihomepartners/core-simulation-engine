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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

interface EnhancedCashFlowChartProps {
  data: any;
  isLoading?: boolean;
  timeGranularity?: 'yearly' | 'monthly' | 'quarterly';
  cumulativeMode?: boolean;
}

export function EnhancedCashFlowChart({
  data,
  isLoading = false,
  timeGranularity = 'yearly',
  cumulativeMode = false
}: EnhancedCashFlowChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'area' | 'line'>('area');

  // Process cash flow data for the chart with camelCase/snake_case handling
  const chartData = React.useMemo(() => {
    if (isLoading || !data) return [];

    // Handle both camelCase and snake_case property names
    const cashFlows = data.cash_flows || data.cashFlows;
    if (!cashFlows) {
      log(LogLevel.WARN, LogCategory.DATA, 'Missing cash_flows data in EnhancedCashFlowChart');
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
      log(LogLevel.WARN, LogCategory.DATA, 'No cash flow data available after processing');
      return [];
    }

    // Normalize data to handle both camelCase and snake_case property names
    const normalizedData = timeSeriesData.map((item: any) => {
      // Get values with fallbacks for both camelCase and snake_case
      const capitalCalls = item.capital_calls !== undefined ? item.capital_calls : (item.capitalCalls || 0);
      const distributions = item.distributions !== undefined ? item.distributions : (item.distributionsValue || 0);
      const netCashFlow = item.net_cash_flow !== undefined ? item.net_cash_flow : (item.netCashFlow || 0);

      return {
        ...item,
        // Always use snake_case for consistency in our chart
        capital_calls: capitalCalls,
        distributions: distributions,
        net_cash_flow: netCashFlow,
        // Include year/month if not already present
        year: item.year || item.period,
        month: item.month || item.period
      };
    });

    // Calculate cumulative values if needed
    if (cumulativeMode) {
      let cumulativeCapitalCalls = 0;
      let cumulativeDistributions = 0;
      let cumulativeNetCashFlow = 0;

      return normalizedData.map((item: any) => {
        cumulativeCapitalCalls += (item.capital_calls || 0);
        cumulativeDistributions += (item.distributions || 0);
        cumulativeNetCashFlow += (item.net_cash_flow || 0);

        return {
          ...item,
          capital_calls: cumulativeCapitalCalls,
          distributions: cumulativeDistributions,
          net_cash_flow: cumulativeNetCashFlow
        };
      });
    }

    return normalizedData;
  }, [data, isLoading, timeGranularity, cumulativeMode]);

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-md p-4">
          <p className="font-medium text-sm mb-2">
            {timeGranularity === 'yearly' ? `Year ${label}` :
             timeGranularity === 'quarterly' ? `Q${label % 4 || 4} ${Math.floor((label - 1) / 4) + 1}` :
             `Month ${label}`}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
              <span className="text-sm font-medium">{entry.name}:</span>
              <span className="text-sm ml-2 font-semibold">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!data || chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">No cash flow data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="flex justify-end mb-4">
        <Select value={chartType} onValueChange={(value) => setChartType(value as any)}>
          <SelectTrigger className="h-8 text-xs w-[100px]">
            <SelectValue placeholder="Chart Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Bar Chart</SelectItem>
            <SelectItem value="area">Area Chart</SelectItem>
            <SelectItem value="line">Line Chart</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="h-[calc(100%-40px)]">
        {chartType === 'bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
              barSize={cumulativeMode ? 20 : 30}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={timeGranularity === 'yearly' ? 'year' : 'month'}
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
                tickFormatter={(value) => formatCurrency(value, 0)}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
                width={80}
              >
                <Label
                  value="Amount ($)"
                  angle={-90}
                  position="left"
                  offset={-20}
                  style={{ fontSize: 12, fill: '#6b7280', textAnchor: 'middle' }}
                />
              </YAxis>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                iconType="circle"
                iconSize={8}
              />
              <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} />
              <Bar dataKey="capital_calls" name="Capital Calls" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="distributions" name="Distributions" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net_cash_flow" name="Net Cash Flow" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === 'area' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={timeGranularity === 'yearly' ? 'year' : 'month'}
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
                tickFormatter={(value) => formatCurrency(value, 0)}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
                width={80}
              >
                <Label
                  value="Amount ($)"
                  angle={-90}
                  position="left"
                  offset={-20}
                  style={{ fontSize: 12, fill: '#6b7280', textAnchor: 'middle' }}
                />
              </YAxis>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                iconType="circle"
                iconSize={8}
              />
              <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} />
              <defs>
                <linearGradient id="colorCapitalCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDistributions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="capital_calls"
                name="Capital Calls"
                fill="url(#colorCapitalCalls)"
                stroke="#ef4444"
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="distributions"
                name="Distributions"
                fill="url(#colorDistributions)"
                stroke="#22c55e"
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="net_cash_flow"
                name="Net Cash Flow"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {chartType === 'line' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={timeGranularity === 'yearly' ? 'year' : 'month'}
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
                tickFormatter={(value) => formatCurrency(value, 0)}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
                width={80}
              >
                <Label
                  value="Amount ($)"
                  angle={-90}
                  position="left"
                  offset={-20}
                  style={{ fontSize: 12, fill: '#6b7280', textAnchor: 'middle' }}
                />
              </YAxis>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                iconType="circle"
                iconSize={8}
              />
              <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} />
              <Line
                type="monotone"
                dataKey="capital_calls"
                name="Capital Calls"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="distributions"
                name="Distributions"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="net_cash_flow"
                name="Net Cash Flow"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
