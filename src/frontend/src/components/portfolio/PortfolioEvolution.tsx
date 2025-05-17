import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from 'recharts';
import { formatCurrency, formatNumber } from '../../lib/formatters';

interface PortfolioEvolutionProps {
  data: any;
  isLoading: boolean;
}

const PortfolioEvolution: React.FC<PortfolioEvolutionProps> = ({ data, isLoading }) => {
  const [viewMode, setViewMode] = useState<'cumulative' | 'yearly'>('cumulative');
  const [chartType, setChartType] = useState<'loans' | 'status'>('loans');

  // Extract portfolio evolution data
  const portfolioEvolution = data?.portfolio_evolution || data?.portfolioEvolution || {};

  // Transform data for charts
  const chartData = Object.entries(portfolioEvolution).map(([year, yearData]: [string, any]) => ({
    year: Number(year),
    activeLoans: yearData.active_loans || yearData.activeLoans || 0,
    exitedLoansOriginal: yearData.exited_loans_original || yearData.exitedLoansOriginal || 0,
    exitedLoansReinvest: yearData.exited_loans_reinvest || yearData.exitedLoansReinvest || 0,
    exitedLoans: yearData.exited_loans || yearData.exitedLoans || 0,
    newLoans: yearData.new_loans || yearData.newLoans || 0,
    reinvestments: yearData.reinvestments || 0,
    reinvestedAmount: yearData.reinvested_amount || yearData.reinvestedAmount || 0,
    defaultedLoans: yearData.defaulted_loans || yearData.defaultedLoans || 0,
  })).sort((a, b) => a.year - b.year);

  // Calculate cumulative data if needed
  const processedData = viewMode === 'cumulative'
    ? chartData.reduce((acc: any[], curr, index) => {
        if (index === 0) return [curr];
        const prev = acc[index - 1];
        return [...acc, {
          ...curr,
          activeLoans: curr.activeLoans,
          exitedLoansOriginal: prev.exitedLoansOriginal + curr.exitedLoansOriginal,
          exitedLoansReinvest: prev.exitedLoansReinvest + curr.exitedLoansReinvest,
          exitedLoans: prev.exitedLoans + curr.exitedLoans,
          newLoans: prev.newLoans + curr.newLoans,
          reinvestments: prev.reinvestments + curr.reinvestments,
          reinvestedAmount: prev.reinvestedAmount + curr.reinvestedAmount,
          defaultedLoans: prev.defaultedLoans + curr.defaultedLoans,
        }];
      }, [])
    : chartData;

  // Find years with reinvestments for annotations
  const reinvestmentYears = chartData
    .filter(d => d.reinvestments > 0)
    .map(d => d.year);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Portfolio Evolution</CardTitle>
            <CardDescription>Changes in portfolio composition over time</CardDescription>
          </div>
          <div className="flex gap-4">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as 'cumulative' | 'yearly')}
              className="border rounded-md"
            >
              <ToggleGroupItem value="cumulative" aria-label="Cumulative view">
                Cumulative
              </ToggleGroupItem>
              <ToggleGroupItem value="yearly" aria-label="Yearly view">
                Yearly
              </ToggleGroupItem>
            </ToggleGroup>

            <ToggleGroup
              type="single"
              value={chartType}
              onValueChange={(value) => value && setChartType(value as 'loans' | 'status')}
              className="border rounded-md"
            >
              <ToggleGroupItem value="loans" aria-label="Loans view">
                Loans
              </ToggleGroupItem>
              <ToggleGroupItem value="status" aria-label="Status view">
                Status
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[400px]">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : chartType === 'loans' ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => formatNumber(value)}
                labelFormatter={(year) => `Year ${year}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="activeLoans"
                name="Active Loans"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="exitedLoans"
                name="Exited Loans"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="newLoans"
                name="New Loans"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="defaultedLoans"
                name="Defaulted Loans"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              {reinvestmentYears.map(year => (
                <ReferenceLine
                  key={`reinvestment-${year}`}
                  x={year}
                  stroke="#8884d8"
                  strokeDasharray="3 3"
                >
                  <Label value="Reinvestment" position="top" />
                </ReferenceLine>
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              stackOffset="expand"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
              <Tooltip
                formatter={(value: number, name) => [
                  viewMode === 'cumulative'
                    ? formatNumber(value)
                    : `${(value / (chartData.find(d => d.year === name)?.activeLoans || 1) * 100).toFixed(1)}%`,
                  name
                ]}
                labelFormatter={(year) => `Year ${year}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="activeLoans"
                name="Active Original Loans"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
              />
              <Area
                type="monotone"
                dataKey="exitedLoansOriginal"
                name="Exited Original Loans"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
              />
              <Area
                type="monotone"
                dataKey="exitedLoansReinvest"
                name="Exited Reinvested Loans"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
              />
              <Area
                type="monotone"
                dataKey="defaultedLoans"
                name="Defaulted Loans"
                stackId="1"
                stroke="#6b7280"
                fill="#6b7280"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioEvolution;
