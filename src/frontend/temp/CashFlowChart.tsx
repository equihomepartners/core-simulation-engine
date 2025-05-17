import React, { useState, useMemo, useEffect } from 'react';
import { Card, Typography, Space, Radio, Skeleton, Segmented } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Line, ComposedChart, Area } from 'recharts';

const { Text, Title } = Typography;

interface CashFlowData {
  years: number[];
  capital_called?: number[];
  distributions?: number[];
  net_cash_flow?: number[];
  cumulative_capital_called?: number[];
  cumulative_distributions?: number[];
  cumulative_net_cash_flow?: number[];
  lp_capital_called?: number[];
  lp_distributions?: number[];
  lp_net_cash_flow?: number[];
  lp_cumulative_capital_called?: number[];
  lp_cumulative_distributions?: number[];
  lp_cumulative_net_cash_flow?: number[];
  gp_capital_called?: number[];
  gp_distributions?: number[];
  gp_net_cash_flow?: number[];
  gp_cumulative_capital_called?: number[];
  gp_cumulative_distributions?: number[];
  gp_cumulative_net_cash_flow?: number[];
}

interface CashFlowChartProps {
  data?: CashFlowData;
  height?: number;
  showTitle?: boolean;
  isLoading?: boolean;
}

// Utility function to format currency
const safeFormatCurrency = (value: number, decimals: number = 2): string => {
  if (value === null || value === undefined) return 'N/A';
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: decimals,
    notation: decimals === 0 ? 'compact' : 'standard'
  });
  
  return formatter.format(value);
};

/**
 * Cash Flow Chart Component
 * Displays cash flow data over time
 */
export function CashFlowChart({
  data,
  height = 400,
  showTitle = true,
  isLoading = false
}: CashFlowChartProps) {
  const [viewMode, setViewMode] = useState<string>('cumulative');
  const [entity, setEntity] = useState<string>('lp');
  const [showChart, setShowChart] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowChart(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Prepare data for the chart
  const chartData = useMemo(() => {
    if (!data || !data.years || data.years.length === 0) {
      return [];
    }

    try {
      // Select data arrays based on entity
      let capital_called, distributions, net_cash_flow, cumulative_capital_called, cumulative_distributions, cumulative_net_cash_flow;
      if (entity === 'lp') {
        capital_called = data.lp_capital_called || data.capital_called || [];
        distributions = data.lp_distributions || data.distributions || [];
        net_cash_flow = data.lp_net_cash_flow || data.net_cash_flow || [];
        cumulative_capital_called = data.lp_cumulative_capital_called || data.cumulative_capital_called || [];
        cumulative_distributions = data.lp_cumulative_distributions || data.cumulative_distributions || [];
        cumulative_net_cash_flow = data.lp_cumulative_net_cash_flow || data.cumulative_net_cash_flow || [];
      } else if (entity === 'gp') {
        capital_called = data.gp_capital_called || [];
        distributions = data.gp_distributions || [];
        net_cash_flow = data.gp_net_cash_flow || [];
        cumulative_capital_called = data.gp_cumulative_capital_called || [];
        cumulative_distributions = data.gp_cumulative_distributions || [];
        cumulative_net_cash_flow = data.gp_cumulative_net_cash_flow || [];
      } else {
        capital_called = data.capital_called || [];
        distributions = data.distributions || [];
        net_cash_flow = data.net_cash_flow || [];
        cumulative_capital_called = data.cumulative_capital_called || [];
        cumulative_distributions = data.cumulative_distributions || [];
        cumulative_net_cash_flow = data.cumulative_net_cash_flow || [];
      }
      return data.years.map((year, index) => ({
        year,
        capitalCalled: capital_called[index] || 0,
        distributions: distributions[index] || 0,
        netCashFlow: net_cash_flow[index] || 0,
        cumulativeCapitalCalled: cumulative_capital_called ? cumulative_capital_called[index] || 0 : 0,
        cumulativeDistributions: cumulative_distributions ? cumulative_distributions[index] || 0 : 0,
        cumulativeNetCashFlow: cumulative_net_cash_flow ? cumulative_net_cash_flow[index] || 0 : 0
      }));
    } catch (error) {
      console.error('Error preparing chart data:', error);
      return [];
    }
  }, [data, entity]);

  // Custom tooltip formatter
  const formatTooltipValue = (value: number) => {
    return safeFormatCurrency(value, 0);
  };

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 8 }} style={{ height }} />;
  }

  return (
    <div style={{ width: '100%' }}>
      {showTitle && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>Cash Flow Over Time</Title>
          <Space>
            <Segmented
              value={entity}
              onChange={(value) => setEntity(value as string)}
              options={[
                { label: 'LP', value: 'lp' },
                { label: 'GP', value: 'gp' },
                { label: 'Fund', value: 'fund' }
              ]}
              size="small"
            />
            <Segmented
              value={viewMode}
              onChange={(value) => setViewMode(value as string)}
              options={[
                { label: 'Yearly', value: 'yearly' },
                { label: 'Cumulative', value: 'cumulative' }
              ]}
              size="small"
            />
          </Space>
        </div>
      )}

      <Card bodyStyle={{ padding: 16, height, minHeight: 250 }}>
        {chartData.length > 0 && showChart ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={200}>
            {viewMode === 'yearly' ? (
              // Yearly view - Bar chart with capital called and distributions
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  tickFormatter={(value) => safeFormatCurrency(value, 0)}
                  label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                />
                <RechartsTooltip
                  formatter={formatTooltipValue}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <Legend />
                <Bar
                  dataKey="capitalCalled"
                  name="Capital Called"
                  fill="#f5222d"
                  stackId="a"
                />
                <Bar
                  dataKey="distributions"
                  name="Distributions"
                  fill="#52c41a"
                  stackId="a"
                />
                <Line
                  type="monotone"
                  dataKey="netCashFlow"
                  name="Net Cash Flow"
                  stroke="#1890ff"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            ) : (
              // Cumulative view - Area chart with cumulative values
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  tickFormatter={(value) => safeFormatCurrency(value, 0)}
                  label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                />
                <RechartsTooltip
                  formatter={formatTooltipValue}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cumulativeCapitalCalled"
                  name="Cumulative Capital Called"
                  fill="#f5222d"
                  fillOpacity={0.3}
                  stroke="#f5222d"
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeDistributions"
                  name="Cumulative Distributions"
                  fill="#52c41a"
                  fillOpacity={0.3}
                  stroke="#52c41a"
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeNetCashFlow"
                  name="Cumulative Net Cash Flow"
                  stroke="#1890ff"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Text type="secondary">{!showChart ? "Loading chart..." : "No cash flow data available"}</Text>
          </div>
        )}
      </Card>
    </div>
  );
} 