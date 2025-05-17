import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatPercentage, formatMultiple, formatCurrency } from '@/utils/format';

// Import visualization components
import { LPIRRComparisonChart } from './lp-irr-comparison-chart';
import { LPCashFlowChart } from './lp-cash-flow-chart';
import { LPReturnMetricsCard } from './lp-return-metrics-card';
import { LPIRRBreakdownChart } from './lp-irr-breakdown-chart';
import { LPFeeImpactChart } from './lp-fee-impact-chart';

interface LPOverviewTabProps {
  simulation: any;
  results: any;
  isLoading: boolean;
  timeGranularity: 'yearly' | 'quarterly' | 'monthly';
  cumulativeMode: boolean;
}

export function LPOverviewTab({ 
  simulation, 
  results, 
  isLoading,
  timeGranularity,
  cumulativeMode
}: LPOverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* Top Row - IRR Comparison and Cash Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* IRR Comparison */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>IRR Comparison</CardTitle>
            <CardDescription>Comparing different IRR metrics</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <LPIRRComparisonChart
                results={results}
                isLoading={isLoading}
              />
            )}
          </CardContent>
        </Card>

        {/* Cash Flow Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Cash Flow Analysis</CardTitle>
            <CardDescription>Capital calls and distributions over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <LPCashFlowChart
                results={results}
                isLoading={isLoading}
                timeGranularity={timeGranularity}
                cumulativeMode={cumulativeMode}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Middle Row - Return Metrics and IRR Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Return Metrics */}
        <Card className="shadow-sm">
          <CardContent className="h-[500px] pt-6">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <LPReturnMetricsCard
                results={results}
                isLoading={isLoading}
              />
            )}
          </CardContent>
        </Card>

        {/* IRR Breakdown */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>IRR Breakdown</CardTitle>
            <CardDescription>Components contributing to IRR</CardDescription>
          </CardHeader>
          <CardContent className="h-[450px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <LPIRRBreakdownChart
                results={results}
                isLoading={isLoading}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Fee Impact Analysis */}
      <div>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Fee Impact Analysis</CardTitle>
            <CardDescription>How fees affect your returns</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <LPFeeImpactChart
                results={results}
                isLoading={isLoading}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
