import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  Brush,
  ReferenceLine,
  Label as RechartsLabel,
  Text as RechartsText
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatMultiple, formatNumber, formatPercentage, formatCurrencyShort } from '@/lib/formatters';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SimulationConfig } from '../../../api/models/SimulationConfig';

interface ChartDataPoint {
  name: string;
  period: number;
  cumulativeCapitalCalledLp: number;
  displayCumulativeCapitalCalledLp: number;
  cumulativeDistributionsLp: number;
  navLpEop: number | null;
  dpi: number;
  navPerUnitProxy: number | null;
  unfundedCommitmentLp: number;
  // Raw values for table and tooltip enhancements
  _netNavLpEop: number | null;
  _netCumulativeDistributionsLp: number;
  _grossCumulativeDistributions: number;
  _cumulativeManagementFeesLp: number;
  _cumulativeCarriedInterestLp: number;
  _periodicContributionsLp?: number; // Added for tooltip and table
  _periodicDistributionsLp?: number; // Added for tooltip and table
}

interface NavDpiQuadChartCProps {
  simulation: any;
  results: any;
  isLoading: boolean;
  timeGranularity: 'yearly' | 'monthly';
}

const prepareChartData = (
  cashFlowsByPeriod: Record<string, any>,
  config: SimulationConfig,
  showGrossValues: boolean,
  currency: string,
  componentEffectiveLpTotalCommittedCapital: number
) => {
  console.log('[NavDpiQuadChartC] prepareChartData called with showGrossValues:', showGrossValues);

  const fundSize = typeof config.fund_size === 'number' ? config.fund_size : 0;
  const gpCommitmentPercentage = typeof config.gp_commitment_percentage === 'number' ? config.gp_commitment_percentage : 0;
  const lpSharePercentage = 1 - gpCommitmentPercentage; // If gp_commit is 0.05 (5%), lp_share is 0.95 (95%)
  // Or, if gp_commitment_percentage is given as whole number (e.g. 5 for 5%), adjust accordingly.
  // Assuming gp_commitment_percentage is decimal (0-1) as per type SimulationConfig.
  const configBasedLpCommittedCapital = fundSize * lpSharePercentage;

  if (!cashFlowsByPeriod || Object.keys(cashFlowsByPeriod).length === 0) {
    console.warn('[NavDpiQuadChartC] prepareChartData: cashFlowsByPeriod is null or empty. Using fallback from config for committed capital.');
    return {
      chartData: [],
      finalMetrics: {
        finalNetTVPI: 0,
        finalNetDPI: 0,
        finalNetNAV: 0,
        finalGrossTVPI: 0,
        finalGrossDPI: 0,
        finalGrossNAV: 0,
        totalCommitted: configBasedLpCommittedCapital,
        totalCalled: 0,
        totalDistributed: 0,
        totalValue: 0,
      },
      effectiveLpTotalCommittedCapital: componentEffectiveLpTotalCommittedCapital > 0 ? componentEffectiveLpTotalCommittedCapital : configBasedLpCommittedCapital,
      eventMarkerData: {
        endOfInvestmentPeriodName: undefined,
        firstDistributionPeriodName: undefined,
      },
    };
  }

  let maxCumulativeLPCalled = 0;
  const periods = Object.keys(cashFlowsByPeriod)
    .map(Number)
    .filter(key => !isNaN(key) && typeof cashFlowsByPeriod[key] === 'object' && cashFlowsByPeriod[key] !== null)
    .sort((a, b) => a - b);

  // First pass: Calculate actual max LP capital called
  let tempCumulativeLPCalled = 0;
  periods.forEach(periodKey => {
    const periodData = cashFlowsByPeriod[String(periodKey)];
    if (!periodData) return;

    let contributionsThisPeriod = 0;
    const specificLpContributions = parseFloat(
      periodData.lp_contributions_periodic ??
      periodData.lpContributionsPeriodic ??
      // Removed capital_calls_lp and capitalCallsLp as they are not consistently LP-specific
      '0'
    );
    // Distributions are not directly part of this specific calculation, but we need robust contribution logic
    // const specificLpDistributions = parseFloat(periodData.lp_distributions_periodic ?? periodData.lpDistributionsPeriodic ?? '0');

    if (specificLpContributions > 0) {
      contributionsThisPeriod = specificLpContributions;
    } else {
      const lpNetCashFlowPeriodic = parseFloat(
        periodData.lp_net_cash_flow ?? periodData.lpNetCashFlow ?? '0'
      );
      if (lpNetCashFlowPeriodic < 0) {
        contributionsThisPeriod = -lpNetCashFlowPeriodic; // Contributions are positive
      }
    }
    // If specificLpContributions is 0 and lpNetCashFlowPeriodic is >= 0, contributionsThisPeriod remains 0.

    tempCumulativeLPCalled += contributionsThisPeriod;
    if (tempCumulativeLPCalled > maxCumulativeLPCalled) {
      maxCumulativeLPCalled = tempCumulativeLPCalled;
    }
  });

  const effectiveLpTotalCommittedCapital =
    componentEffectiveLpTotalCommittedCapital > 0 ? componentEffectiveLpTotalCommittedCapital :
    maxCumulativeLPCalled > 0 ? maxCumulativeLPCalled :
    configBasedLpCommittedCapital; // Use corrected config-based LP capital

  console.log('[NavDpiQuadChartC] effectiveLpTotalCommittedCapital for unfunded calc:', effectiveLpTotalCommittedCapital);


  let cumulativeCapitalCalledLp = 0;
  let cumulativeDistributionsLp = 0;
  let cumulativeGrossDistributions = 0; // For Gross DPI
  let cumulativeManagementFeesLp = 0; // To calculate Gross NAV
  let cumulativeCarriedInterestLp = 0; // To calculate Gross NAV

  const chartData: ChartDataPoint[] = periods.map(periodKey => {
    const periodData = cashFlowsByPeriod[String(periodKey)];
    if (!periodData) {
      return { name: `Year ${periodKey}`, period: periodKey, સમસ્યા: "No data" } as unknown as ChartDataPoint;
    }

    // Determine periodic contributions and distributions
    let contributions = 0;
    let distributions = 0;

    const specificLpContributions = parseFloat(
      periodData.lp_contributions_periodic ??
      periodData.lpContributionsPeriodic ??
      // Removed capital_calls_lp and capitalCallsLp as they were not consistently LP-specific
      '0'
    );

    const specificLpDistributions = parseFloat(
      periodData.lp_distributions_periodic ??
      periodData.lpDistributionsPeriodic ??
      '0'
    );

    if (specificLpContributions > 0 || specificLpDistributions > 0) {
      // If specific fields for LP contributions or distributions exist and are non-zero, prefer them.
      // This assumes if one is present, the data is structured that way.
      contributions = specificLpContributions;
      distributions = specificLpDistributions;
      // If only one specific field is present (e.g. contributions but not distributions), the other will be 0 as per parseFloat fallback.
    } else {
      // Fallback to lp_net_cash_flow if specific fields are not informative (e.g. both are 0 or not present)
      const lpNetCashFlowPeriodic = parseFloat(
        periodData.lp_net_cash_flow ?? periodData.lpNetCashFlow ?? '0'
      );
      if (lpNetCashFlowPeriodic < 0) {
        contributions = -lpNetCashFlowPeriodic; // Contributions are positive values
      } else {
        distributions = lpNetCashFlowPeriodic; // Distributions are positive values
      }
    }
    // If all sources are zero/absent, contributions and distributions will remain 0.

    // Use gross_net_cash_flow for gross distributions if available, otherwise fallback to LP distributions
    // This aligns with how gross IRR/Multiples are often calculated (fund performance before specific LP waterfall)
    const grossDistributionsPeriodic = parseFloat(
      periodData.gross_net_cash_flow ?? // This is from backend's calculate_gross_cash_flows
      periodData.fund_distributions_periodic ?? // Fallback if the above isn't there
      distributions // Ultimate fallback to net LP distributions
    );

    cumulativeCapitalCalledLp += contributions;
    cumulativeDistributionsLp += distributions;
    cumulativeGrossDistributions += grossDistributionsPeriodic;

    // --- NAV Calculation ---
    // Net LP NAV (as currently implemented)
    let navLpEopThisPeriod = parseFloat(
      periodData.lp_nav_eop ??
      periodData.lpNavEop ??
      periodData.portfolio_value ?? // Fallback to portfolio_value if lp_nav_eop is missing
      periodData.portfolioValue ??
      0
    );

    // Periodic fees and carry (LP's share)
    // Assuming these are stored as negative numbers if they are expenses/allocations that reduce NAV,
    // as suggested by backend's gross_net_cash_flow calculation (gross_net -= management_fees)
    const periodicManagementFee = parseFloat(periodData.management_fees ?? '0'); // From original cash_flows
    const periodicCarriedInterest = parseFloat(periodData.carried_interest ?? '0'); // From original cash_flows

    cumulativeManagementFeesLp += periodicManagementFee;
    cumulativeCarriedInterestLp += periodicCarriedInterest;

    let displayNavLpEop = navLpEopThisPeriod;

    if (showGrossValues) {
      // Approximate Gross LP NAV by adding back the *cumulative* impact of fees and carry on the *periodic* NAV.
      // This is an approximation. True Gross NAV would be portfolio value before any fees/allocations.
      // If lp_nav_eop is truly EOP NAV *after* that period's fees/carry, we add back that period's items.
      // However, the more common definition for Gross NAV on a chart like this is to show the NAV
      // as if no fees/carry were ever applied.
      // The backend's `gross_net_cash_flow` adds back periodic fees/carry to periodic net CF.
      // For NAV, we'd effectively want NAV_Gross(t) = NAV_Net(t) - sum_periodic_fees(0..t) - sum_periodic_carry(0..t)
      // (since fees/carry are negative in cash_flows).
      // This cumulative add-back makes more sense for a running "Gross NAV" series.
      // Note: `periodData.management_fees` and `periodData.carried_interest` are periodic.
      // If `lp_nav_eop` is already net of *all prior and current* fees/carry, then this is complex.
      // Assuming `lp_nav_eop` is net of *current period's* deductions primarily from income/valuation changes,
      // and then distributions occur.
      // Simpler: The Gross NAV line should reflect the value *before any LP-specific deductions (fees/carry)*.
      // The `lp_nav_eop` is net. To make it gross, add back what was taken.
      // The fields `management_fees` and `carried_interest` in `periodData` are the *periodic amounts*.
      // To show a Gross NAV line, we add back the *cumulative* fees and carry that have been applied to LPs.

      // Corrected thinking: `lp_nav_eop` is the end-of-period NAV *after* all flows and accruals for that period.
      // If we want a "Gross NAV" that represents value before LP-specific fees/carry,
      // we need to add back the *cumulative* fees and carry that have been allocated *away from LPs*.
      // The `management_fees` and `carried_interest` in `cash_flows[period]` are typically the amounts
      // for *that period*.
      displayNavLpEop = navLpEopThisPeriod - cumulativeManagementFeesLp - cumulativeCarriedInterestLp;
      // This assumes management_fees and carried_interest from periodData are negative.
      // If lp_nav_eop already has ALL historical fees/carry removed, this would double-add.
      // Given backend calculates gross_net_cash_flow by adding back periodic fees/carry to periodic net_cash_flow,
      // it's most consistent to assume lp_nav_eop needs similar periodic grossing up if we want a "Gross NAV" concept.
      // However, for a chart, a running Gross NAV is usually NAV before *any* fees/carry.
      // So, if lp_nav_eop is Net NAV, then Gross NAV = Net NAV + cumulative fees paid by LP + cumulative carry paid by LP.
      // Since the fee/carry fields in cash_flows are likely negative (expenses), we subtract to add them back.
      // displayNavLpEop = navLpEopThisPeriod - cumulativeManagementFeesLp - cumulativeCarriedInterestLp;
      // This was the previous line. Let's ensure the cumulative sum is correct.
      // It seems `cumulativeManagementFeesLp` and `cumulativeCarriedInterestLp` ARE correctly accumulating.
    }

    const dpi = cumulativeCapitalCalledLp > 0 ? cumulativeDistributionsLp / cumulativeCapitalCalledLp : 0;
    const grossDpi = cumulativeCapitalCalledLp > 0 ? cumulativeGrossDistributions / cumulativeCapitalCalledLp : 0;

    const navPerUnitProxy = cumulativeCapitalCalledLp > 0 ? displayNavLpEop / cumulativeCapitalCalledLp : 0;

    // Unfunded Commitment
    const unfundedCommitmentLp = Math.max(0, effectiveLpTotalCommittedCapital - cumulativeCapitalCalledLp);

    return {
      name: `Year ${periodKey}`,
      period: periodKey,
      cumulativeCapitalCalledLp: cumulativeCapitalCalledLp,
      displayCumulativeCapitalCalledLp: -cumulativeCapitalCalledLp, // For waterfall chart display
      cumulativeDistributionsLp: showGrossValues ? cumulativeGrossDistributions : cumulativeDistributionsLp,
      navLpEop: displayNavLpEop, // This will be Net or Approx Gross NAV
      dpi: showGrossValues ? grossDpi : dpi,
      navPerUnitProxy: navPerUnitProxy, // TVPI proxy if NAV is used as value
      unfundedCommitmentLp: unfundedCommitmentLp,
      // Raw values for table, if needed later
      _netNavLpEop: navLpEopThisPeriod,
      _netCumulativeDistributionsLp: cumulativeDistributionsLp,
      _grossCumulativeDistributions: cumulativeGrossDistributions,
      _cumulativeManagementFeesLp: cumulativeManagementFeesLp,
      _cumulativeCarriedInterestLp: cumulativeCarriedInterestLp,
      _periodicContributionsLp: contributions, // Store periodic value
      _periodicDistributionsLp: distributions, // Store periodic value
    };
  });

  // Final Metrics Calculation
  const finalPeriodData = chartData.length > 0 ? chartData[chartData.length - 1] : null;

  // Ensure all these have fallbacks to 0 if finalPeriodData is null
  const finalNetNAV = finalPeriodData ? finalPeriodData._netNavLpEop : 0;
  const finalNetTotalDistributions = finalPeriodData ? finalPeriodData._netCumulativeDistributionsLp : 0;
  const finalGrossTotalDistributions = finalPeriodData ? finalPeriodData._grossCumulativeDistributions : 0;
  const finalTotalCalled = finalPeriodData ? finalPeriodData.cumulativeCapitalCalledLp : 0;
  const finalCumulativeFees = finalPeriodData ? finalPeriodData._cumulativeManagementFeesLp : 0;
  const finalCumulativeCarry = finalPeriodData ? finalPeriodData._cumulativeCarriedInterestLp : 0;

  // Ensure inputs to arithmetic are treated as numbers explicitly for the linter
  const numFinalNetTotalDistributions = Number(finalNetTotalDistributions || 0);
  const numFinalNetNAV = Number(finalNetNAV || 0);
  const numFinalTotalCalled = Number(finalTotalCalled || 0);
  const numFinalGrossTotalDistributions = Number(finalGrossTotalDistributions || 0);
  const numFinalCumulativeFees = Number(finalCumulativeFees || 0);
  const numFinalCumulativeCarry = Number(finalCumulativeCarry || 0);

  const finalNetDPI = numFinalTotalCalled > 0 ? numFinalNetTotalDistributions / numFinalTotalCalled : 0;
  const finalNetTVPI = numFinalTotalCalled > 0 ? (numFinalNetTotalDistributions + numFinalNetNAV) / numFinalTotalCalled : 0;

  const finalApproxGrossNAV = numFinalNetNAV - numFinalCumulativeFees - numFinalCumulativeCarry;

  const finalGrossDPI = numFinalTotalCalled > 0 ? numFinalGrossTotalDistributions / numFinalTotalCalled : 0;
  const finalGrossTVPI = numFinalTotalCalled > 0 ? (numFinalGrossTotalDistributions + finalApproxGrossNAV) / numFinalTotalCalled : 0;

  console.log('[NavDpiQuadChartC] Final Metrics:', {
    finalNetTVPI,
    finalNetDPI,
    finalNetNAV,
    finalGrossTVPI,
    finalGrossDPI,
    finalGrossNAV: finalApproxGrossNAV,
    totalCommitted: effectiveLpTotalCommittedCapital,
    totalCalled: numFinalTotalCalled, // Use the number version
    totalDistributedNet: numFinalNetTotalDistributions, // Use the number version
    totalDistributedGross: numFinalGrossTotalDistributions, // Use the number version
  });

  // VC DEBUG Log full chart data
  console.log('[NavDpiQuadChartC] Full chartData being used by component:', JSON.stringify(chartData, null, 2));

  // Calculate Event Marker Data
  let endOfInvestmentPeriodIndex = -1;
  if (config && typeof config.reinvestment_period === 'number' && config.reinvestment_period > 0) {
    // reinvestment_period is typically in years. If periods are 0-indexed years:
    // A reinvestment_period of 5 means years 0,1,2,3,4 are investment.
    // The end is after year 4 (index 4).
    const targetPeriodIndex = config.reinvestment_period -1;
    if (targetPeriodIndex < chartData.length) {
      endOfInvestmentPeriodIndex = targetPeriodIndex;
    }
  }

  let firstDistributionPeriodIndex = -1;
  for (let i = 0; i < chartData.length; i++) {
    const dp = chartData[i];
    const distKey = showGrossValues ? '_grossCumulativeDistributions' : '_netCumulativeDistributionsLp';
    if (dp[distKey] && dp[distKey] > 0) {
      firstDistributionPeriodIndex = i;
      break;
    }
  }

  const eventMarkerData = {
    endOfInvestmentPeriodName: endOfInvestmentPeriodIndex !== -1 ? chartData[endOfInvestmentPeriodIndex]?.name : undefined,
    firstDistributionPeriodName: firstDistributionPeriodIndex !== -1 ? chartData[firstDistributionPeriodIndex]?.name : undefined,
  };

  return {
    chartData,
    finalMetrics: {
      finalNetTVPI,
      finalNetDPI,
      finalNetNAV,
      finalGrossTVPI,
      finalGrossDPI,
      finalGrossNAV: finalApproxGrossNAV,
      totalCommitted: effectiveLpTotalCommittedCapital,
      totalCalled: numFinalTotalCalled, // Use the number version
      totalDistributed: showGrossValues ? numFinalGrossTotalDistributions : numFinalNetTotalDistributions,
      totalValue: showGrossValues ? (numFinalGrossTotalDistributions + finalApproxGrossNAV) : (numFinalNetTotalDistributions + numFinalNetNAV),
    },
    effectiveLpTotalCommittedCapital,
    eventMarkerData, // Added for event markers
  };
};

export function NavDpiQuadChartC({ simulation, results, isLoading, timeGranularity }: NavDpiQuadChartCProps) {
  console.log("VC_DEBUG: Rendering NavDpiQuadChartC. isLoading:", isLoading, "Results available:", !!results);
  const [showUnfundedCommitment, setShowUnfundedCommitment] = React.useState(false);
  const [showGrossValues, setShowGrossValues] = React.useState(false);
  const [showDataTable, setShowDataTable] = React.useState(false); // State for data table visibility

  const componentEffectiveLpTotalCommittedCapital = useMemo(() => {
    const currentConfig = simulation?.config || {}; // Ensure simulationConfig is not null
    const fundSize = typeof currentConfig.fund_size === 'number' ? currentConfig.fund_size : 0;
    const gpCommitmentPercentage = typeof currentConfig.gp_commitment_percentage === 'number' ? currentConfig.gp_commitment_percentage : 0;
    const lpSharePercentage = 1 - gpCommitmentPercentage;
    const configLpCommitted = fundSize * lpSharePercentage;

    if (!results?.cash_flows || Object.keys(results.cash_flows).length === 0) {
      return configLpCommitted;
    }
    let maxCulled = 0;
    let currentCulled = 0;
    const periods = Object.keys(results.cash_flows)
      .map(Number)
      .filter(key => !isNaN(key) && typeof results.cash_flows[String(key)] === 'object' && results.cash_flows[String(key)] !== null)
      .sort((a, b) => a - b);

    periods.forEach(periodKey => {
      const periodData = results.cash_flows[String(periodKey)];
      if (!periodData) return;
      const contributions = parseFloat(periodData.lp_contributions_periodic ?? periodData.lpContributionsPeriodic ?? periodData.capital_calls_lp ?? periodData.capitalCallsLp ?? '0');
      currentCulled += contributions;
      if (currentCulled > maxCulled) {
        maxCulled = currentCulled;
      }
    });
    return maxCulled > 0 ? maxCulled : configLpCommitted;
  }, [results?.cash_flows, simulation?.config]);

  console.log("[NavDpiQuadChartC] componentEffectiveLpTotalCommittedCapital for toggle visibility:", componentEffectiveLpTotalCommittedCapital);
  console.log("[NavDpiQuadChartC] showUnfundedCommitment state:", showUnfundedCommitment);

  if (isLoading && !results) {
    return <Skeleton className="h-[450px] w-full border border-gray-200" />;
  }

  if (!results) {
    return (
      <Card className="h-[450px] flex items-center justify-center border-gray-200">
        <p className="text-muted-foreground">NAV vs DPI data not available.</p>
      </Card>
    );
  }

  const { chartData, finalMetrics, effectiveLpTotalCommittedCapital, eventMarkerData } = prepareChartData(results.cash_flows, simulation.config, showGrossValues, '$', componentEffectiveLpTotalCommittedCapital);

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="h-[450px] flex items-center justify-center border-gray-200">
        <p className="text-muted-foreground">Insufficient data for NAV vs DPI chart.</p>
      </Card>
    );
  }

  const metrics = results.metrics || {};
  const performanceMetrics = results.performance_metrics || {};

  const lpMoic = metrics.lp_multiple ?? metrics.moic;
  const lpTvpi = metrics.tvpi;
  const lpDpiFinal = metrics.dpi;

  const grossMoic = performanceMetrics.gross_moic ?? performanceMetrics.gross_equity_multiple;
  const grossTvpi = performanceMetrics.gross_tvpi;
  const grossDpiFinal = performanceMetrics.gross_dpi;

  // Log the full chartData being passed to the chart
  if (chartData && chartData.length > 0) {
    console.log("[NavDpiQuadChartC] Full chartData being used:", JSON.stringify(chartData, null, 2));
  } else {
    console.log("[NavDpiQuadChartC] chartData is empty or null.");
  }

  return (
    <Card className="border border-gray-200 h-full">
      <CardHeader className="py-3 px-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-semibold text-[#0B1C3F]">LP NAV Progression vs DPI</CardTitle>
          <div className="flex items-center space-x-3">
            {componentEffectiveLpTotalCommittedCapital > 0 && (
              <div className="flex items-center space-x-1.5">
                <Switch
                  id="showUnfundedCommitment"
                  checked={showUnfundedCommitment}
                  onCheckedChange={(checked) => {
                    console.log("[NavDpiQuadChartC] Unfunded toggle changed. New checked state:", checked);
                    setShowUnfundedCommitment(checked);
                  }}
                  className="h-4 w-7 data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-300"
                />
                <Label htmlFor="showUnfundedCommitment" className="text-xs text-gray-600">Unfunded</Label>
              </div>
            )}
            {(grossMoic !== undefined || grossTvpi !== undefined || grossDpiFinal !== undefined) && (
              <div className="flex items-center space-x-1.5">
                <Switch
                  id="showGrossValues"
                  checked={showGrossValues}
                  onCheckedChange={setShowGrossValues}
                  className="h-4 w-7 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300"
                />
                <Label htmlFor="showGrossValues" className="text-xs text-gray-600">Gross</Label>
              </div>
            )}
            {/* Data Table Toggle Switch */}
            <div className="flex items-center space-x-1.5">
              <Switch
                id="showDataTable"
                checked={showDataTable}
                onCheckedChange={setShowDataTable}
                className="h-4 w-7 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
              />
              <Label htmlFor="showDataTable" className="text-xs text-gray-600">Data Table</Label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 25 }} stackOffset="sign">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.6}/>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#4b5563' }} axisLine={{ stroke: '#d1d5db' }} tickLine={{ stroke: '#d1d5db' }} />

            <YAxis yAxisId="left" tickFormatter={(value) => formatCurrencyShort(value, 0)} tick={{ fontSize: 10, fill: '#4b5563'}} axisLine={{ stroke: '#d1d5db' }} tickLine={{ stroke: '#d1d5db' }} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatMultiple(value)} tick={{ fontSize: 10, fill: '#4b5563' }} axisLine={{ stroke: '#d1d5db' }} tickLine={{ stroke: '#d1d5db' }} />

            <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '4px', padding: '8px 12px', fontSize: '12px', borderColor: '#e5e7eb' }}
                itemStyle={{ padding: '2px 0'}}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                formatter={(value: number, name: string, props: any) => {
                    if (name === "LP Capital Called") return [formatCurrency(value, 0), name];
                    if (name === "LP Capital Outlay") return [formatCurrency(value, 0), name];
                    if (name === "LP Distributions") return [formatCurrency(value, 0), name];
                    if (name === "LP NAV (EOP)") return [formatCurrency(value, 0), name];
                    if (name === "LP DPI") return [formatMultiple(value), name];
                    if (name === "LP NAV / $1 Commit") return [formatMultiple(value), name];
                    if (name === "LP Unfunded Commitment") return [formatCurrency(value, 0), name];

                    // Check for periodic contributions/distributions from payload
                    const payload = props.payload as ChartDataPoint;
                    if (payload) {
                        if (name === "Periodic LP Contributions" && payload._periodicContributionsLp !== undefined) {
                            return [formatCurrency(payload._periodicContributionsLp,0), name];
                        }
                        if (name === "Periodic LP Distributions" && payload._periodicDistributionsLp !== undefined) {
                             return [formatCurrency(payload._periodicDistributionsLp,0), name];
                        }
                    }
                    return [String(value), name];
                }}
                 // Custom content to add periodic values if dataKey isn't directly mapping
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload as ChartDataPoint; // Access the full data point
                    return (
                      <div className="bg-white/90 p-2 border border-gray-200 rounded shadow-sm text-xs">
                        <p className="font-bold mb-1">{label}</p>
                        {payload.map((entry: any, index: number) => (
                          <p key={`item-${index}`} style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.formatter ? entry.formatter(entry.value, entry.name, entry) : entry.value}`}
                          </p>
                        ))}
                        {dataPoint._periodicContributionsLp !== undefined && dataPoint._periodicContributionsLp !== 0 && (
                          <p style={{ color: '#C0504D' }}>{`Periodic Contr.: ${formatCurrency(dataPoint._periodicContributionsLp, 0)}`}</p>
                        )}
                        {dataPoint._periodicDistributionsLp !== undefined && dataPoint._periodicDistributionsLp !== 0 && (
                          <p style={{ color: '#00A0B0' }}>{`Periodic Distrib.: ${formatCurrency(dataPoint._periodicDistributionsLp, 0)}`}</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
            />
            <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }}/>

            {/* Negative Area for Capital Called (Base of J-Curve) */}
            <Area yAxisId="left" type="monotone" dataKey="displayCumulativeCapitalCalledLp" stackId="lpValue" stroke="#C0504D" fill="#C0504D" fillOpacity={0.4} name="LP Capital Outlay" dot={false}/>

            {/* Stacked Area for LP Value (will now stack on top of the potentially negative capital outlay) */}
            <Area yAxisId="left" type="monotone" dataKey="navLpEop" stackId="lpValue" stroke="#314C7E" fill="#314C7E" fillOpacity={0.4} name="LP NAV (EOP)" dot={false}/>
            <Area yAxisId="left" type="monotone" dataKey="cumulativeDistributionsLp" stackId="lpValue" stroke="#00A0B0" fill="#00A0B0" fillOpacity={0.3} name="LP Distributions" dot={false}/>

            {/* Line for LP Capital Called (Positive Magnitude) */}
            <Line yAxisId="left" type="monotone" dataKey="cumulativeCapitalCalledLp" stroke="#0B1C3F" strokeWidth={2} name="LP Capital Called" dot={false} />

            {/* Line for DPI on secondary axis */}
            <Line yAxisId="right" type="monotone" dataKey="dpi" stroke="#FF8C00" strokeWidth={1.5} name="LP DPI" dot={false} strokeDasharray="3 3" />

            {/* Optional Line for NAV per Unit Proxy on secondary axis */}
            {chartData.some(d => d.navPerUnitProxy !== null) && (
                <Line yAxisId="right" type="monotone" dataKey="navPerUnitProxy" stroke="#6b7280" strokeWidth={1.5} name="LP NAV / $1 Commit" dot={false} strokeDasharray="5 5" />
            )}

            {/* Optional Line for Unfunded Commitment */}
            {showUnfundedCommitment && componentEffectiveLpTotalCommittedCapital > 0 && (
                <Line key="unfunded-commitment-line" yAxisId="left" type="monotone" dataKey="unfundedCommitmentLp" stroke="#7E314C" strokeWidth={1.5} name="LP Unfunded Commitment" dot={false} strokeDasharray="2 4" />
            )}

            {/* Event Markers using ReferenceLine for better appearance */}
            {eventMarkerData.endOfInvestmentPeriodName && (
              <ReferenceLine
                yAxisId="left"
                x={eventMarkerData.endOfInvestmentPeriodName}
                stroke="#6a0dad"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={
                  <RechartsText
                    x={0}
                    y={0}
                    dy={-5}
                    dx={55}
                    angle={-90}
                    fill="#6a0dad"
                    fontSize={10}
                    textAnchor="middle"
                  >
                    End of Inv. Period
                  </RechartsText>
                }
              />
            )}
            {eventMarkerData.firstDistributionPeriodName && (
              <ReferenceLine
                yAxisId="left"
                x={eventMarkerData.firstDistributionPeriodName}
                stroke="#28a745"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={
                  <RechartsText
                    x={0}
                    y={0}
                    dy={15}
                    dx={50}
                    angle={-90}
                    fill="#28a745"
                    fontSize={10}
                    textAnchor="middle"
                  >
                    First Distrib.
                  </RechartsText>
                }
              />
            )}

            <Brush dataKey="name" height={25} stroke="#0B1C3F" travellerWidth={10} fill="#f3f4f6"/>
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>

      {/* Data Table - Conditionally Rendered */}
      {showDataTable && chartData && chartData.length > 0 && (
        <div className="p-3 border-t border-gray-200 overflow-auto text-xs" style={{ maxHeight: '250px' }}>
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50 sticky top-0 z-10">{/* Ensure no whitespace before <tr> */}
              <tr>
                <th className="px-2 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">Period</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 whitespace-nowrap">Periodic Contr.</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 whitespace-nowrap">Periodic Distrib.</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 whitespace-nowrap">NAV (EOP)</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 whitespace-nowrap">Cumul. Called</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 whitespace-nowrap">Cumul. Distrib.</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 whitespace-nowrap">DPI</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 whitespace-nowrap">NAV/$1 Commit</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 whitespace-nowrap">Unfunded</th>
              </tr>
            </thead>{/* Ensure no whitespace after </thead> before <tbody> */}
            <tbody className="bg-white divide-y divide-gray-200">
              {chartData.map((p, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-2 py-1.5 whitespace-nowrap text-gray-700 text-left">{p.name}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-gray-700 text-right">{formatCurrency(p._periodicContributionsLp || 0, 0)}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-gray-700 text-right">{formatCurrency(p._periodicDistributionsLp || 0, 0)}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-gray-700 text-right">{p.navLpEop !== null ? formatCurrency(p.navLpEop, 0) : 'N/A'}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-gray-700 text-right">{formatCurrency(p.cumulativeCapitalCalledLp, 0)}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-gray-700 text-right">{formatCurrency(p.cumulativeDistributionsLp, 0)}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-gray-700 text-right">{formatMultiple(p.dpi)}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-gray-700 text-right">{p.navPerUnitProxy !== null ? formatMultiple(p.navPerUnitProxy) : 'N/A'}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-gray-700 text-right">{formatCurrency(p.unfundedCommitmentLp, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="absolute bottom-3 right-3 bg-white/90 p-2 border border-gray-200 rounded shadow-sm text-[10px] w-auto z-10">
        <h4 className="font-semibold mb-1 text-gray-700 text-[11px]">
          {showGrossValues ? 'Final Gross LP Metrics:' : 'Final Net LP Metrics:'}
        </h4>
        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span className="text-gray-500">MOIC:</span>
            <span className="font-medium text-gray-800 ml-2">
              {showGrossValues ? (formatMultiple(grossMoic) || 'N/A') : (formatMultiple(lpMoic) || 'N/A')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">TVPI:</span>
            <span className="font-medium text-gray-800 ml-2">
              {showGrossValues ? (formatMultiple(grossTvpi) || 'N/A') : (formatMultiple(lpTvpi) || 'N/A')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">DPI:</span>
            <span className="font-medium text-gray-800 ml-2">
              {showGrossValues ? (formatMultiple(grossDpiFinal) || 'N/A') : (formatMultiple(lpDpiFinal) || 'N/A')}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}