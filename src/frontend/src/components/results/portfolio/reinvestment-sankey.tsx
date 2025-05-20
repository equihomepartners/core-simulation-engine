import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface ReinvestmentSankeyProps {
  results: any;
  isLoading: boolean;
}

export function ReinvestmentSankey({
  results,
  isLoading
}: ReinvestmentSankeyProps) {
  // Extract reinvestment data
  const reinvestmentData = React.useMemo(() => {
    if (!results || isLoading) return [];

    // Check if we have reinvestment_stats data
    if (!results.reinvestment_stats) return [];

    // Get fund size from the results
    if (!results.fund_size) return [];
    const initialCapital = results.fund_size;

    // Check if we have cash_flows data
    if (!results.cash_flows) return [];

    // Calculate total exit proceeds from cash_flows
    let exitProceeds = 0;
    for (const year in results.cash_flows) {
      if (results.cash_flows[year].exit_proceeds) {
        exitProceeds += results.cash_flows[year].exit_proceeds;
      }
    }

    // Get total reinvested amount from reinvestment_stats
    const reinvestedCapital = results.reinvestment_stats.total_reinvested || 0;

    // Calculate distributions
    const distributions = exitProceeds - reinvestedCapital;

    // Only create chart data if we have valid values
    if (exitProceeds <= 0 || reinvestedCapital <= 0) return [];

    // Log the data for debugging
    console.log('Reinvestment Flow Data:', {
      initialCapital,
      exitProceeds,
      reinvestedCapital,
      distributions
    });

    // Create data for bar chart
    return [
      { name: 'Initial Capital', value: initialCapital, fill: '#4ade80' },
      { name: 'Exit Proceeds', value: exitProceeds, fill: '#60a5fa' },
      { name: 'Reinvested', value: reinvestedCapital, fill: '#8b5cf6' },
      { name: 'Distributions', value: distributions, fill: '#ef4444' }
    ];
  }, [results, isLoading]);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Reinvestment Flow</CardTitle>
        <CardDescription>Capital flow through the reinvestment cycle</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : reinvestmentData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={reinvestmentData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })} />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
              />
              <Legend />
              <Bar
                dataKey="value"
                name="Amount"
                isAnimationActive={false}
              >
                {reinvestmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
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
