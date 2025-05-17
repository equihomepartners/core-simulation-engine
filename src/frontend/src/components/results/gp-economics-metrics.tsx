import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatCurrency, formatPercentage } from '@/utils/format';

interface GPEconomicsMetricsProps {
  data: any;
  isLoading?: boolean;
}

export function GPEconomicsMetrics({ data, isLoading = false }: GPEconomicsMetricsProps) {
  // Extract GP economics metrics from the data
  const metrics = React.useMemo(() => {
    if (isLoading || !data) return null;

    // Handle both camelCase and snake_case property names
    const waterfallResults = data.waterfall_results || data.waterfallResults;
    const cashFlows = data.cash_flows || data.cashFlows;
    const config = data.config;

    if (!waterfallResults) {
      log(LogLevel.WARN, LogCategory.DATA, 'Missing waterfall results data in GPEconomicsMetrics');
      return null;
    }

    // Calculate total management fees from cash flows
    // Management fees are recorded as negative in cash flows but are positive income for the GP
    let managementFeeTotal = 0;
    if (cashFlows) {
      Object.keys(cashFlows).forEach(year => {
        const yearData = cashFlows[year];
        if (yearData && (yearData.management_fees !== undefined || yearData.managementFees !== undefined)) {
          // Take absolute value since they're recorded as negative in cash flows
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
    // This already includes catch-up and carried interest
    const gpInvestmentReturn = gpDistributionsTotal - gpCommitment;

    // Calculate GP total return (management fees + investment return)
    // We don't add carried interest separately as it's already included in investment return
    const gpTotalReturn = managementFeeTotal + gpInvestmentReturn;

    // Get GP multiple from waterfall results
    const gpMultiple = waterfallResults.gp_multiple ||
                      waterfallResults.gpMultiple || 0;

    // Calculate GP profit share (carried interest as % of total profits)
    const totalProfits = (waterfallResults.total_lp_distribution || waterfallResults.totalLpDistribution || 0) -
                        (waterfallResults.lp_return_of_capital || waterfallResults.lpReturnOfCapital || 0) +
                        gpTotalReturn - gpCommitment;

    const gpProfitShare = totalProfits > 0 ? (gpTotalReturn - gpCommitment) / totalProfits : 0;

    // Get percentages from config
    const managementFeePercent = config?.management_fee_rate ||
                                config?.managementFeeRate ||
                                0;

    const carriedInterestPercent = config?.carried_interest_rate ||
                                  config?.carriedInterestRate ||
                                  waterfallResults?.waterfall_params?.carried_interest_rate ||
                                  waterfallResults?.waterfallParams?.carriedInterestRate ||
                                  0;

    const gpCommitmentPercent = config?.gp_commitment_percentage ||
                               config?.gpCommitmentPercentage ||
                               (fundSize > 0 ? gpCommitment / fundSize : 0);

    // Calculate IRR if not available
    // For a more accurate estimate, we use the GP multiple and the fund term
    // The formula is: IRR = (Multiple)^(1/Years) - 1
    const fundTerm = config?.fund_term || config?.fundTerm || 10;
    const gpIRR = waterfallResults.gp_irr ||
                 waterfallResults.gpIrr ||
                 (gpMultiple > 1 ? Math.pow(gpMultiple, 1/fundTerm) - 1 : 0);

    // Log the actual values for debugging
    console.log('GP Economics Metrics - Raw Data:', {
      cashFlows: cashFlows ? Object.keys(cashFlows).length : 0,
      waterfallResults: waterfallResults ? Object.keys(waterfallResults).length : 0,
      yearlyWaterfall: waterfallResults.yearly_breakdown ? Object.keys(waterfallResults.yearly_breakdown).length :
                      waterfallResults.yearlyBreakdown ? Object.keys(waterfallResults.yearlyBreakdown).length : 0,
      gpCommitment,
      managementFeeTotal,
      carriedInterestTotal: waterfallResults.gp_carried_interest || waterfallResults.gpCarriedInterest,
      gpCatchUp: waterfallResults.gp_catch_up || waterfallResults.gpCatchUp,
      gpDistributionsTotal: waterfallResults.total_gp_distribution || waterfallResults.totalGpDistribution,
      gpInvestmentReturn,
      gpTotalReturn,
      gpMultiple,
      gpIRR: gpIRR * 100 + '%',
      firstYearCashFlow: cashFlows && cashFlows['0'] ? cashFlows['0'] : null,
      firstYearWaterfall: waterfallResults.yearly_breakdown && waterfallResults.yearly_breakdown['0'] ?
                         waterfallResults.yearly_breakdown['0'] :
                         waterfallResults.yearlyBreakdown && waterfallResults.yearlyBreakdown['0'] ?
                         waterfallResults.yearlyBreakdown['0'] : null
    });

    return {
      managementFeeTotal,
      carriedInterestTotal,
      gpCatchUp,
      gpCommitment,
      gpDistributionsTotal,
      gpInvestmentReturn,
      gpTotalReturn,
      gpIRR,
      gpMultiple,
      gpProfitShare,
      managementFeePercent,
      carriedInterestPercent,
      gpCommitmentPercent
    };
  }, [data, isLoading]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>GP Economics</CardTitle>
          <CardDescription>Key metrics for general partner returns</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !metrics) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>GP Economics</CardTitle>
          <CardDescription>Key metrics for general partner returns</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No GP economics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>GP Economics</CardTitle>
        <CardDescription>Key metrics for general partner returns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">GP Commitment</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics.gpCommitment)}</p>
            <p className="text-sm text-muted-foreground">{formatPercentage(metrics.gpCommitmentPercent)} of fund size</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Management Fees</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics.managementFeeTotal)}</p>
            <p className="text-sm text-muted-foreground">{formatPercentage(metrics.managementFeePercent)} of committed capital</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Carried Interest</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics.carriedInterestTotal)}</p>
            <p className="text-sm text-muted-foreground">{formatPercentage(metrics.carriedInterestPercent)} carry</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Catch-Up</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics.gpCatchUp)}</p>
            <p className="text-sm text-muted-foreground">GP preferred return catch-up</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">GP Distributions</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics.gpDistributionsTotal)}</p>
            <p className="text-sm text-muted-foreground">Total distributions to GP</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Investment Return</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics.gpInvestmentReturn)}</p>
            <p className="text-sm text-muted-foreground">Return on GP investment</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total GP Return</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics.gpTotalReturn)}</p>
            <p className="text-sm text-muted-foreground">All GP income streams</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">GP Multiple</p>
            <p className="text-2xl font-bold">{metrics.gpMultiple.toFixed(2)}x</p>
            <p className="text-sm text-muted-foreground">Return multiple on GP investment</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">GP IRR</p>
            <p className="text-2xl font-bold">{formatPercentage(metrics.gpIRR)}</p>
            <p className="text-sm text-muted-foreground">Internal rate of return</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
