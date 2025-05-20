import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatPercentage, formatMultiple, formatCurrency, formatNumber } from '@/utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CashFlowMechanicsProps {
  results: any;
  isLoading: boolean;
  timeGranularity: 'yearly' | 'quarterly' | 'monthly';
  cumulativeMode: boolean;
}

export function CashFlowMechanics({
  results,
  isLoading,
  timeGranularity,
  cumulativeMode
}: CashFlowMechanicsProps) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Extract cash flow data for waterfall chart
  const waterfallData = React.useMemo(() => {
    if (!results || isLoading) return [];

    // Try to get from cash_flows
    if (results.cash_flows) {
      const cashFlows = results.cash_flows;
      const years = cashFlows.years || [];

      // If a specific year is selected, filter to that year
      if (selectedYear !== null) {
        const yearIndex = years.findIndex((year: number) => year === selectedYear);
        if (yearIndex === -1) return [];

        // Extract cash flow components for the selected year
        return [
          {
            name: `Year ${selectedYear}`,
            capitalCalls: -(cashFlows.capital_called?.[yearIndex] || 0),
            originationFees: cashFlows.origination_fees?.[yearIndex] || 0,
            interestIncome: cashFlows.interest_income?.[yearIndex] || 0,
            appreciationIncome: cashFlows.appreciation_income?.[yearIndex] || 0,
            exitProceeds: cashFlows.exit_proceeds?.[yearIndex] || 0,
            managementFees: -(cashFlows.management_fees?.[yearIndex] || 0),
            carry: -(cashFlows.carried_interest?.[yearIndex] || 0),
            netToLP: cashFlows.lp_distributions?.[yearIndex] || 0
          }
        ];
      }

      // Otherwise, return data for all years
      return years.map((year: number, index: number) => ({
        name: `Year ${year}`,
        capitalCalls: -(cashFlows.capital_called?.[index] || 0),
        originationFees: cashFlows.origination_fees?.[index] || 0,
        interestIncome: cashFlows.interest_income?.[index] || 0,
        appreciationIncome: cashFlows.appreciation_income?.[index] || 0,
        exitProceeds: cashFlows.exit_proceeds?.[index] || 0,
        managementFees: -(cashFlows.management_fees?.[index] || 0),
        carry: -(cashFlows.carried_interest?.[index] || 0),
        netToLP: cashFlows.lp_distributions?.[index] || 0
      }));
    }

    return [];
  }, [results, isLoading, selectedYear]);

  // Extract data for heat strip
  const heatStripData = React.useMemo(() => {
    if (!results || isLoading) return [];

    // Try to get from monthly_cash_flows
    if (results.monthly_cash_flows) {
      const monthlyCashFlows = results.monthly_cash_flows;
      const months = Object.keys(monthlyCashFlows).sort((a, b) => parseInt(a) - parseInt(b));

      // Group by quarter
      const quarterlyData = [];

      for (let i = 0; i < months.length; i += 3) {
        const quarter = Math.floor(i / 3);
        const year = Math.floor(quarter / 4);
        const quarterInYear = quarter % 4;

        // Calculate net cash flow for this quarter
        let netCashFlow = 0;

        for (let j = i; j < i + 3 && j < months.length; j++) {
          const monthData = monthlyCashFlows[months[j]];
          netCashFlow += monthData.net_cash_flow || 0;
        }

        quarterlyData.push({
          id: quarter,
          year,
          quarter: quarterInYear + 1,
          netCashFlow
        });
      }

      return quarterlyData;
    }

    // We don't want to create synthetic quarterly data from yearly data
    // Only use real quarterly data if available

    return [];
  }, [results, isLoading]);

  // Extract data for cumulative distribution curve
  const cumulativeData = React.useMemo(() => {
    if (!results || isLoading) return [];

    // Try to get from cash_flows
    if (results.cash_flows?.cumulative_distributions) {
      const cashFlows = results.cash_flows;
      const years = cashFlows.years || [];
      const cumulativeDistributions = cashFlows.cumulative_distributions || [];
      const totalDistributions = cumulativeDistributions[cumulativeDistributions.length - 1] || 0;

      // Calculate percentage of total distributions
      return years.map((year: number, index: number) => ({
        name: timeGranularity === 'monthly' ? `M${year}` : `Y${year}`,
        value: totalDistributions > 0 ? cumulativeDistributions[index] / totalDistributions : 0
      }));
    }

    // Try to get from monthly_cash_flows
    if (timeGranularity === 'monthly' && results.monthly_cash_flows) {
      const monthlyCashFlows = results.monthly_cash_flows;
      const months = Object.keys(monthlyCashFlows).sort((a, b) => parseInt(a) - parseInt(b));

      // Calculate cumulative distributions
      let cumulativeDistribution = 0;
      const cumulativeData = [];

      for (const month of months) {
        const monthData = monthlyCashFlows[month];
        cumulativeDistribution += monthData.distributions || 0;

        cumulativeData.push({
          name: `M${month}`,
          value: cumulativeDistribution
        });
      }

      // Calculate percentage of total
      const totalDistributions = cumulativeData[cumulativeData.length - 1]?.value || 0;

      if (totalDistributions > 0) {
        return cumulativeData.map(data => ({
          ...data,
          value: data.value / totalDistributions
        }));
      }
    }

    return [];
  }, [results, isLoading, timeGranularity]);

  return (
    <div className="space-y-8">
      {/* Stacked Cash-Flow Waterfall */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Cash-Flow Waterfall</CardTitle>
              <CardDescription>Breakdown of cash flow components by year</CardDescription>
            </div>
            <Tabs
              value={selectedYear !== null ? selectedYear.toString() : 'all'}
              onValueChange={(value) => setSelectedYear(value === 'all' ? null : parseInt(value))}
              className="w-[400px]"
            >
              <TabsList className="grid grid-cols-6">
                <TabsTrigger value="all">All</TabsTrigger>
                {results?.cash_flows?.years?.slice(0, 5).map((year: number) => (
                  <TabsTrigger key={year} value={year.toString()}>Y{year}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="h-[400px]">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : waterfallData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={waterfallData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })} />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    const formattedValue = formatCurrency(value);
                    const displayName = name === 'capitalCalls' ? 'Capital Calls' :
                                        name === 'originationFees' ? 'Origination Fees' :
                                        name === 'interestIncome' ? 'Interest Income' :
                                        name === 'appreciationIncome' ? 'Appreciation Income' :
                                        name === 'exitProceeds' ? 'Exit Proceeds' :
                                        name === 'managementFees' ? 'Management Fees' :
                                        name === 'carry' ? 'Carried Interest' :
                                        name === 'netToLP' ? 'Net to LP' : name;
                    return [formattedValue, displayName];
                  }}
                />
                <Legend />
                <Bar dataKey="capitalCalls" name="Capital Calls" stackId="a" fill="#ef4444" />
                <Bar dataKey="originationFees" name="Origination Fees" stackId="a" fill="#4ade80" />
                <Bar dataKey="interestIncome" name="Interest Income" stackId="a" fill="#60a5fa" />
                <Bar dataKey="appreciationIncome" name="Appreciation Income" stackId="a" fill="#8b5cf6" />
                <Bar dataKey="exitProceeds" name="Exit Proceeds" stackId="a" fill="#f59e0b" />
                <Bar dataKey="managementFees" name="Management Fees" stackId="a" fill="#6b7280" />
                <Bar dataKey="carry" name="Carried Interest" stackId="a" fill="#ec4899" />
                <Bar dataKey="netToLP" name="Net to LP" stackId="a" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No cash flow data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Run-Rate Heat-Strip */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Quarterly Cash Flow Heat Map</CardTitle>
          <CardDescription>Net cash flow by quarter (blue = positive, red = negative)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-[100px]" />
          ) : heatStripData.length > 0 ? (
            <div className="grid grid-cols-4 gap-1">
              {heatStripData.map((quarter) => (
                <div
                  key={quarter.id}
                  className="relative h-10 rounded-sm flex items-center justify-center text-xs font-medium text-white cursor-pointer"
                  style={{
                    backgroundColor: quarter.netCashFlow >= 0 ?
                      `rgba(37, 99, 235, ${Math.min(1, Math.abs(quarter.netCashFlow) / 1000000)})` :
                      `rgba(239, 68, 68, ${Math.min(1, Math.abs(quarter.netCashFlow) / 1000000)})`
                  }}
                  title={`Year ${quarter.year}, Q${quarter.quarter}: ${formatCurrency(quarter.netCashFlow)}`}
                  onClick={() => setSelectedYear(quarter.year)}
                >
                  Y{quarter.year}Q{quarter.quarter}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[100px]">
              <p className="text-muted-foreground">No quarterly cash flow data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cumulative Distribution Curve */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Cumulative Distribution Curve</CardTitle>
          <CardDescription>Percentage of total LP distributions over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : cumulativeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={cumulativeData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) => typeof value === 'number' ? formatPercentage(value, { maximumFractionDigits: 0 }) : '0%'}
                  domain={[0, 1]}
                />
                <Tooltip
                  formatter={(value: any) => formatPercentage(value)}
                  labelFormatter={(label) => `Period ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Cumulative % of Total Distributions"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No cumulative distribution data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
