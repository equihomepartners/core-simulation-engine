import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface ReinvestmentBreakdownProps {
  results: any;
  isLoading: boolean;
}

export function ReinvestmentBreakdown({
  results,
  isLoading
}: ReinvestmentBreakdownProps) {
  // Extract reinvestment data by year
  const reinvestmentByYearData = React.useMemo(() => {
    if (!results || isLoading) return [];

    // Check if we have reinvestment_stats data
    if (!results.reinvestment_stats?.annual_reinvestments) return [];

    // Get annual reinvestments
    const annualReinvestments = results.reinvestment_stats.annual_reinvestments;
    
    // Convert to array format for chart
    const chartData = Object.keys(annualReinvestments)
      .map(year => ({
        year: `Year ${year}`,
        count: annualReinvestments[year].count,
        amount: annualReinvestments[year].amount,
        fill: annualReinvestments[year].count > 0 ? '#8b5cf6' : '#e5e7eb'
      }))
      .filter(item => parseInt(item.year.replace('Year ', '')) > 0); // Filter out year 0
    
    return chartData;
  }, [results, isLoading]);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Reinvestment Breakdown</CardTitle>
        <CardDescription>Number and amount of reinvestments by year</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : reinvestmentByYearData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={reinvestmentByYearData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => formatNumber(value)} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })} />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === 'count') return [formatNumber(value), 'Loans'];
                  return [formatCurrency(value), 'Amount'];
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="count"
                name="Loan Count"
                fill="#8b5cf6"
                barSize={20}
              >
                {reinvestmentByYearData.map((entry, index) => (
                  <Cell key={`cell-count-${index}`} fill={entry.count > 0 ? '#8b5cf6' : '#e5e7eb'} />
                ))}
              </Bar>
              <Bar
                yAxisId="right"
                dataKey="amount"
                name="Amount"
                fill="#60a5fa"
                barSize={20}
              >
                {reinvestmentByYearData.map((entry, index) => (
                  <Cell key={`cell-amount-${index}`} fill={entry.amount > 0 ? '#60a5fa' : '#e5e7eb'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No reinvestment data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
