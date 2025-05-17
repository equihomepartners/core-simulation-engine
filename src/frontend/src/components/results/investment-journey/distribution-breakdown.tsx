import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatPercentage } from '@/utils/format';
import { AmericanWaterfallChart } from './waterfall-chart';

interface DistributionBreakdown {
  period: number;
  periodLabel: string;
  totalDistribution: number;
  returnOfCapital: number;
  preferredReturn: number;
  gpCatchup: number;
  carriedInterest: number;
  lpShare: number;
  gpShare: number;
  hurdleRate?: number;
  catchupRate?: number;
  carryRate?: number;
}

interface DistributionBreakdownProps {
  data: DistributionBreakdown | null;
  isLoading: boolean;
  isAmericanStyle?: boolean;
}

export function DistributionBreakdown({
  data,
  isLoading,
  isAmericanStyle = true
}: DistributionBreakdownProps) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribution Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <p className="text-muted-foreground">
              {isLoading ? 'Loading distribution data...' : 'No distribution data available'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentages of total distribution
  const totalDistribution = data.totalDistribution;
  const rocPercentage = totalDistribution > 0 ? data.returnOfCapital / totalDistribution : 0;
  const prefReturnPercentage = totalDistribution > 0 ? data.preferredReturn / totalDistribution : 0;
  const catchupPercentage = totalDistribution > 0 ? data.gpCatchup / totalDistribution : 0;
  const carryPercentage = totalDistribution > 0 ? data.carriedInterest / totalDistribution : 0;

  // Create the waterfall data for visualization
  const waterfallData = [
    {
      name: 'Total Distribution',
      value: data.totalDistribution,
      isTotal: true,
      isPositive: true,
      percentage: '100%',
      description: 'Total cash distribution for this period'
    },
    {
      name: 'Return of Capital',
      value: data.returnOfCapital,
      isPositive: true,
      percentage: formatPercentage(rocPercentage),
      description: 'Return of invested capital to LPs'
    },
    {
      name: 'Preferred Return',
      value: data.preferredReturn,
      isPreferred: true,
      isPositive: true,
      percentage: formatPercentage(prefReturnPercentage),
      description: `${formatPercentage(data.hurdleRate || 0.08)} preferred return to LPs`
    },
    {
      name: 'GP Catch-up',
      value: data.gpCatchup,
      isGpCatchup: true,
      isPositive: true,
      percentage: formatPercentage(catchupPercentage),
      description: `${formatPercentage(data.catchupRate || 0.5)} GP catch-up rate`
    },
    {
      name: 'Carried Interest',
      value: data.carriedInterest,
      isCarry: true,
      isPositive: true,
      percentage: formatPercentage(carryPercentage),
      description: `${formatPercentage(data.carryRate || 0.2)} carried interest rate`
    }
  ];

  return (
    <div>
      <AmericanWaterfallChart
        data={waterfallData}
        height={300}
        title={`${data.periodLabel} Distribution Breakdown`}
        showPercentages={true}
      />

      <div className="mt-6 space-y-4">
        <Separator />

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Distribution Allocation</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">LP Share:</span>
                <span className="font-medium">{formatCurrency(data.lpShare)} ({formatPercentage(data.lpShare / data.totalDistribution)})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GP Share:</span>
                <span className="font-medium">{formatCurrency(data.gpShare)} ({formatPercentage(data.gpShare / data.totalDistribution)})</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Total Distribution:</span>
                <span className="font-medium">{formatCurrency(data.totalDistribution)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Waterfall Parameters</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hurdle Rate:</span>
                <span className="font-medium">{formatPercentage(data.hurdleRate || 0.08)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Catch-up Rate:</span>
                <span className="font-medium">{formatPercentage(data.catchupRate || 0.5)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Carry Rate:</span>
                <span className="font-medium">{formatPercentage(data.carryRate || 0.2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}