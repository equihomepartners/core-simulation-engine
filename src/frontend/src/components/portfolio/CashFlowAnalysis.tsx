import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatCurrency, formatPercentage } from '../../lib/formatters';

interface CashFlowAnalysisProps {
  data: any;
  isLoading: boolean;
}

const CashFlowAnalysis: React.FC<CashFlowAnalysisProps> = ({ data, isLoading }) => {
  const [viewType, setViewType] = useState<'components' | 'timeline'>('components');
  const [showCumulative, setShowCumulative] = useState(true);

  // Extract cash flow data
  const cashFlows = data?.cash_flows || data?.cashFlows || {};

  // Transform data for charts
  const cashFlowData = Object.entries(cashFlows).map(([year, yearData]: [string, any]) => ({
    year: Number(year),
    capitalCalls: Math.abs(yearData.capital_calls || yearData.capitalCalls || 0),
    loanDeployments: Math.abs(yearData.loan_deployments || yearData.loanDeployments || 0),
    originationFees: yearData.origination_fees || yearData.originationFees || 0,
    interestIncome: yearData.interest_income || yearData.interestIncome || 0,
    appreciationIncome: yearData.appreciation_income || yearData.appreciationIncome || 0,
    exitProceeds: yearData.exit_proceeds || yearData.exitProceeds || 0,
    managementFees: Math.abs(yearData.management_fees || yearData.managementFees || 0),
    fundExpenses: Math.abs(yearData.fund_expenses || yearData.fundExpenses || 0),
    netCashFlow: yearData.net_cash_flow || yearData.netCashFlow || 0,
    // Calculate inflows and outflows
    inflows: (yearData.origination_fees || yearData.originationFees || 0) +
             (yearData.interest_income || yearData.interestIncome || 0) +
             (yearData.appreciation_income || yearData.appreciationIncome || 0) +
             (yearData.exit_proceeds || yearData.exitProceeds || 0),
    outflows: Math.abs(yearData.capital_calls || yearData.capitalCalls || 0) +
              Math.abs(yearData.loan_deployments || yearData.loanDeployments || 0) +
              Math.abs(yearData.management_fees || yearData.managementFees || 0) +
              Math.abs(yearData.fund_expenses || yearData.fundExpenses || 0),
  })).sort((a, b) => a.year - b.year);

  // Calculate cumulative data if needed
  const processedData = showCumulative
    ? cashFlowData.reduce((acc: any[], curr, index) => {
        if (index === 0) return [curr];
        const prev = acc[index - 1];
        return [...acc, {
          ...curr,
          capitalCalls: prev.capitalCalls + curr.capitalCalls,
          loanDeployments: prev.loanDeployments + curr.loanDeployments,
          originationFees: prev.originationFees + curr.originationFees,
          interestIncome: prev.interestIncome + curr.interestIncome,
          appreciationIncome: prev.appreciationIncome + curr.appreciationIncome,
          exitProceeds: prev.exitProceeds + curr.exitProceeds,
          managementFees: prev.managementFees + curr.managementFees,
          fundExpenses: prev.fundExpenses + curr.fundExpenses,
          netCashFlow: prev.netCashFlow + curr.netCashFlow,
          inflows: prev.inflows + curr.inflows,
          outflows: prev.outflows + curr.outflows,
        }];
      }, [])
    : cashFlowData;

  // Find breakeven year
  const breakevenYear = processedData.findIndex(d => d.netCashFlow > 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Cash Flow Analysis</CardTitle>
            <CardDescription>Detailed analysis of fund cash flows</CardDescription>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="cumulative-switch"
                checked={showCumulative}
                onCheckedChange={setShowCumulative}
              />
              <Label htmlFor="cumulative-switch">Cumulative</Label>
            </div>
            <Tabs
              value={viewType}
              onValueChange={(value) => setViewType(value as 'components' | 'timeline')}
              className="w-[200px]"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="components">Components</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[400px]">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : viewType === 'components' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              stackOffset={showCumulative ? "none" : "expand"}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => formatCurrency(value, 0)} />
              <Tooltip
                formatter={(value: number, name) => [formatCurrency(value), name]}
                labelFormatter={(year) => `Year ${year}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="originationFees"
                name="Origination Fees"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
              />
              <Area
                type="monotone"
                dataKey="interestIncome"
                name="Interest Income"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
              />
              <Area
                type="monotone"
                dataKey="appreciationIncome"
                name="Appreciation Income"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
              />
              <Area
                type="monotone"
                dataKey="exitProceeds"
                name="Exit Proceeds"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
              />
              <Area
                type="monotone"
                dataKey="managementFees"
                name="Management Fees"
                stackId="2"
                stroke="#ef4444"
                fill="#ef4444"
              />
              <Area
                type="monotone"
                dataKey="fundExpenses"
                name="Fund Expenses"
                stackId="2"
                stroke="#6b7280"
                fill="#6b7280"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => formatCurrency(value, 0)} />
              <Tooltip
                formatter={(value: number, name) => [formatCurrency(value), name]}
                labelFormatter={(year) => `Year ${year}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="inflows"
                name="Total Inflows"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="outflows"
                name="Total Outflows"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="netCashFlow"
                name="Net Cash Flow"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              {breakevenYear > 0 && (
                <ReferenceLine
                  x={breakevenYear}
                  stroke="#8884d8"
                  strokeDasharray="3 3"
                  label={{ value: 'Breakeven', position: 'top' }}
                />
              )}
              <ReferenceLine y={0} stroke="#000" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default CashFlowAnalysis;
