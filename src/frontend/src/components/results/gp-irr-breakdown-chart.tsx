import React from 'react';
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
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatPercentage } from '@/utils/format';

interface GPIRRBreakdownChartProps {
  data: any;
  isLoading?: boolean;
}

export function GPIRRBreakdownChart({ data, isLoading = false }: GPIRRBreakdownChartProps) {
  // Process data for the chart
  const chartData = React.useMemo(() => {
    if (isLoading || !data) return [];

    // Handle both camelCase and snake_case property names
    const waterfallResults = data.waterfall_results || data.waterfallResults;
    const cashFlows = data.cash_flows || data.cashFlows;
    const config = data.config;

    if (!waterfallResults) {
      log(LogLevel.WARN, LogCategory.DATA, 'Missing waterfall results data in GPIRRBreakdownChart');
      return [];
    }

    // Calculate total management fees from cash flows
    let managementFeeTotal = 0;
    if (cashFlows) {
      Object.keys(cashFlows).forEach(year => {
        const yearData = cashFlows[year];
        if (yearData && (yearData.management_fees || yearData.managementFees)) {
          managementFeeTotal += Math.abs(yearData.management_fees || yearData.managementFees || 0);
        }
      });
    }

    // Extract metrics from waterfall results
    const gpCommitmentPercentage = config?.gp_commitment_percentage || config?.gpCommitmentPercentage || 0;
    const fundSize = config?.fund_size || config?.fundSize || 0;
    const gpCommitment = waterfallResults.gp_return_of_capital ||
                        waterfallResults.gpReturnOfCapital ||
                        gpCommitmentPercentage * fundSize;

    const carriedInterestTotal = waterfallResults.gp_carried_interest ||
                                waterfallResults.gpCarriedInterest || 0;

    const gpCatchUp = waterfallResults.gp_catch_up ||
                     waterfallResults.gpCatchUp || 0;

    const gpDistributionsTotal = waterfallResults.total_gp_distribution ||
                                waterfallResults.totalGpDistribution || 0;

    // Calculate GP investment return (distributions minus commitment)
    const gpInvestmentReturn = gpDistributionsTotal - gpCommitment;

    // Calculate GP total return (management fees + carried interest + investment return)
    const gpTotalReturn = managementFeeTotal + carriedInterestTotal + gpCatchUp + gpInvestmentReturn;

    // Get GP multiple from waterfall results
    const gpMultiple = waterfallResults.gp_multiple ||
                      waterfallResults.gpMultiple || 0;

    // Calculate IRR if not available
    const fundTerm = config?.fund_term || config?.fundTerm || 10;
    const gpIRR = waterfallResults.gp_irr ||
                 waterfallResults.gpIrr ||
                 (gpMultiple > 1 ? Math.pow(gpMultiple, 1/fundTerm) - 1 : 0);

    // Calculate the contribution of each component to the total GP return
    const totalReturn = gpTotalReturn > 0 ? gpTotalReturn : 1; // Avoid division by zero

    // Management fees are a separate income stream
    const managementFeeContribution = managementFeeTotal / totalReturn;

    // For the investment return components, we need to break down the distributions
    // The total distributions include: return of capital, catch-up, and carried interest
    // But we only want to show the profit components (not return of capital)
    const totalDistributions = gpDistributionsTotal > 0 ? gpDistributionsTotal : 1;

    // Calculate what portion of the investment return comes from each component
    const catchUpPortion = gpCatchUp / totalDistributions;
    const carriedInterestPortion = carriedInterestTotal / totalDistributions;

    // Apply these portions to the investment return's contribution to total return
    const investmentReturnContribution = gpInvestmentReturn / totalReturn;
    const catchUpContribution = investmentReturnContribution * catchUpPortion;
    const carriedInterestContribution = investmentReturnContribution * carriedInterestPortion;

    // The remainder of the investment return is the GP's pro-rata share of profits
    const proRataContribution = investmentReturnContribution - catchUpContribution - carriedInterestContribution;

    // Create chart data
    return [
      {
        name: 'Management Fees',
        value: managementFeeContribution,
        amount: managementFeeTotal,
        color: '#3b82f6' // blue
      },
      {
        name: 'Carried Interest',
        value: carriedInterestContribution,
        amount: carriedInterestTotal,
        color: '#22c55e' // green
      },
      {
        name: 'Catch-Up',
        value: catchUpContribution,
        amount: gpCatchUp,
        color: '#a855f7' // purple
      },
      {
        name: 'Pro-Rata Return',
        value: proRataContribution,
        amount: gpInvestmentReturn - gpCatchUp - carriedInterestTotal,
        color: '#f59e0b' // amber
      },
      {
        name: 'Total',
        value: 1,
        amount: gpTotalReturn,
        color: '#6366f1' // indigo
      }
    ];
  }, [data, isLoading]);

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <p className="font-medium">{data.name}</p>
          <p>Contribution: {formatPercentage(data.value)}</p>
          <p>Amount: ${(data.amount / 1000000).toFixed(2)}M</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>GP Return Breakdown</CardTitle>
          <CardDescription>Sources of GP returns</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || chartData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>GP Return Breakdown</CardTitle>
          <CardDescription>Sources of GP returns</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No GP return data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>GP Return Breakdown</CardTitle>
        <CardDescription>Sources of GP returns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(value) => formatPercentage(value)}
                domain={[0, 1]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" name="Contribution to GP Return">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
