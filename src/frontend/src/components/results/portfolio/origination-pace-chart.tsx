import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatNumber } from '@/utils/format';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface OriginationPaceChartProps {
  results: any;
  isLoading: boolean;
  timeGranularity: 'yearly' | 'quarterly' | 'monthly';
}

export function OriginationPaceChart({
  results,
  isLoading,
  timeGranularity
}: OriginationPaceChartProps) {
  // Extract origination pace data
  const originationData = React.useMemo(() => {
    if (!results || isLoading) return [];

    // Get data from portfolio_evolution which is an object with year keys
    if (results.portfolio_evolution) {
      // Get all years from the portfolio evolution object
      const years = Object.keys(results.portfolio_evolution)
        .map(Number)
        .sort((a, b) => a - b);

      // Create data points for each year
      return years.map(year => {
        const yearData = results.portfolio_evolution[year];
        return {
          period: `Y${year}`,
          newLoans: yearData?.new_loans || 0
        };
      });
    }

    return [];
  }, [results, isLoading, timeGranularity]);

  // Calculate deployment period end for reference line
  const deploymentPeriodEnd = React.useMemo(() => {
    if (!results || isLoading) return null;

    // Only use the deployment period if it's explicitly defined in the results
    if (results.parameters?.deployment_period !== undefined) {
      const deploymentPeriod = results.parameters.deployment_period;

      if (timeGranularity === 'monthly') {
        return deploymentPeriod * 12;
      }

      return deploymentPeriod;
    }

    // If no deployment period is defined, don't show the reference line
    return null;
  }, [results, isLoading, timeGranularity]);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Origination Pace</CardTitle>
        <CardDescription>Number of new loans originated per {timeGranularity === 'monthly' ? 'month' : 'year'}</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : originationData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={originationData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip
                formatter={(value: any) => [formatNumber(value), 'New Loans']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="newLoans"
                name="New Loans"
                stroke="#4ade80"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              {deploymentPeriodEnd && (
                <ReferenceLine
                  x={timeGranularity === 'monthly' ? `M${deploymentPeriodEnd}` : `Y${deploymentPeriodEnd}`}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{ value: 'Deployment Period End', position: 'top', fill: '#ef4444' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No origination data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
