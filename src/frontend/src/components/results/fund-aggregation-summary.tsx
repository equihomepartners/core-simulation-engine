import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatPercentage } from '@/utils/formatters';

interface FundAggregationSummaryProps {
  aggregated: any | null;
  isLoading?: boolean;
}

export function FundAggregationSummary({ aggregated, isLoading = false }: FundAggregationSummaryProps) {
  const metrics = React.useMemo(() => {
    if (!aggregated || isLoading) return null;
    return {
      totalFundSize: aggregated.total_fund_size ?? aggregated.totalFundSize ?? 0,
      totalLoanCount: aggregated.total_loan_count ?? aggregated.totalLoanCount ?? 0,
      weightedIrr: aggregated.weighted_irr ?? aggregated.weightedIrr ?? 0,
      weightedMultiple: aggregated.weighted_multiple ?? aggregated.weightedMultiple ?? 0,
      totalInvested: aggregated.total_invested ?? aggregated.totalInvested,
      totalReturned: aggregated.total_returned ?? aggregated.totalReturned,
    };
  }, [aggregated, isLoading]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Aggregated Results</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Aggregated Results</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total Fund Size</p>
          <p className="text-lg font-semibold">{formatCurrency(metrics.totalFundSize)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total Loans</p>
          <p className="text-lg font-semibold">{metrics.totalLoanCount}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Weighted IRR</p>
          <p className="text-lg font-semibold">{formatPercentage(metrics.weightedIrr)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Weighted Multiple</p>
          <p className="text-lg font-semibold">{metrics.weightedMultiple?.toFixed?.(2)}x</p>
        </div>
        {metrics.totalInvested !== undefined && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Invested</p>
            <p className="text-lg font-semibold">{formatCurrency(metrics.totalInvested)}</p>
          </div>
        )}
        {metrics.totalReturned !== undefined && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Returned</p>
            <p className="text-lg font-semibold">{formatCurrency(metrics.totalReturned)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
