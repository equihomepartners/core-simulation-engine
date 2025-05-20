import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatNumber } from '@/utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface ExitTimingHistogramProps {
  results: any;
  isLoading: boolean;
}

export function ExitTimingHistogram({
  results,
  isLoading
}: ExitTimingHistogramProps) {
  // Extract exit timing data
  const exitData = React.useMemo(() => {
    if (!results || isLoading) return [];

    // Get data from portfolio_evolution which is an object with year keys
    if (results.portfolio_evolution) {
      // Get all years from the portfolio evolution object
      const years = Object.keys(results.portfolio_evolution)
        .map(Number)
        .sort((a, b) => a - b);

      // Skip year 0 as there are typically no exits
      if (years.length <= 1) return [];

      // Convert to histogram format (count of loans exiting each year)
      const histogramData = [];

      for (let i = 1; i < years.length; i++) {
        const currentYear = years[i];
        const previousYear = years[i-1];

        // Get exited loans for current and previous year
        const currentExits = results.portfolio_evolution[currentYear]?.exited_loans || 0;
        const previousExits = results.portfolio_evolution[previousYear]?.exited_loans || 0;

        // Calculate exits in this year
        const exitsThisYear = currentExits - previousExits;

        if (exitsThisYear > 0) {
          histogramData.push({
            year: `Year ${currentYear}`,
            exits: exitsThisYear
          });
        }
      }

      return histogramData;
    }

    return [];
  }, [results, isLoading]);

  // Calculate mean exit year
  const meanExitYear = React.useMemo(() => {
    if (!results || isLoading || exitData.length === 0) return null;

    // Only use metrics.avg_exit_year if it's explicitly defined
    if (results.metrics?.avg_exit_year !== undefined) {
      return results.metrics.avg_exit_year;
    }

    // Calculate from exit data if metrics are not available
    let totalExits = 0;
    let weightedSum = 0;

    for (const data of exitData) {
      const year = parseInt(data.year.replace('Year ', ''));
      const exits = data.exits;

      totalExits += exits;
      weightedSum += year * exits;
    }

    if (totalExits > 0) {
      return weightedSum / totalExits;
    }

    return null;
  }, [results, exitData, isLoading]);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Exit Timing</CardTitle>
        <CardDescription>
          Distribution of loan exits by year
          {meanExitYear !== null && ` (Mean Exit: ${meanExitYear.toFixed(1)} years)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : exitData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={exitData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip
                formatter={(value: any) => [formatNumber(value), 'Loans']}
              />
              <Legend />
              <Bar
                dataKey="exits"
                name="Exited Loans"
                fill="#60a5fa"
              />
              {meanExitYear !== null && (
                <ReferenceLine
                  x={`Year ${Math.round(meanExitYear)}`}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{ value: 'Mean Exit', position: 'top', fill: '#ef4444' }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No exit timing data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
