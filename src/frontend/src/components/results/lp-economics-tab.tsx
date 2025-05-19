import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, BarChart3, PieChart, LineChart, ArrowUpToLine,
  ArrowDownToLine, DollarSign, Percent, Info, Download,
  BarChart, Layers, RefreshCw, Clock, Target, AlertTriangle, Landmark
} from 'lucide-react';
import { formatCurrency, formatPercentage, formatMultiple, formatDecimal, formatNumber } from '@/lib/formatters';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MetricCard } from '@/components/ui/metric-card';

// Import visualization components
import { LPIRRComparisonChart } from './lp-irr-comparison-chart';
import { LPCashFlowChart } from './lp-cash-flow-chart';
import { LPReturnMetricsCard } from './lp-return-metrics-card';
import { LPIRRBreakdownChart } from './lp-irr-breakdown-chart';
import { IRRBreakdownCard } from './irr-breakdown-card';
import { IRRComponentsCard } from './irr-components-card';
import { InvestmentJourneyVisualization } from './investment-journey-visualization';

// Import section components
import { HeaderBarA } from './lp-economics/HeaderBarA';
import { KPIRibbonB } from './lp-economics/KPIRibbonB';
import { NavDpiQuadChartC } from './lp-economics/NavDpiQuadChartC';
import { RiskLiquidityQuadChartD } from './lp-economics/RiskLiquidityQuadChartD';
import { CashflowWaterfallE } from './lp-economics/CashflowWaterfallE';
import { ZoneVintageBreakdownF } from './lp-economics/ZoneVintageBreakdownF';
import { ForwardIRRDistributionG } from './lp-economics/ForwardIRRDistributionG';
import { ScenarioTornadoPanelH } from './lp-economics/ScenarioTornadoPanelH';

interface LPEconomicsTabProps {
  simulation: any;
  results: any;
  isLoading: boolean;
  timeGranularity: 'yearly' | 'monthly';
  cumulativeMode: boolean;
  onExport: () => void;
}

export function LPEconomicsTab({ simulation, results, isLoading, timeGranularity, cumulativeMode, onExport }: LPEconomicsTabProps) {
  console.log("VC_DEBUG: LPEconomicsTab rendering. isLoading:", isLoading, "Results available:", !!results, "Simulation available:", !!simulation);

  if (isLoading && !results) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-[40px] w-full" />
        <Skeleton className="h-[120px] w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[150px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!results) {
    return <div className="text-muted-foreground">No results data available for LP Economics.</div>;
  }

  // Extracting key metrics for LP Economics
  // Ensure to check for both camelCase and snake_case from results.metrics or results.performance_metrics
  const lpMetrics = results.metrics || {};
  const config = simulation?.config || {};
  const cashFlows = results.cash_flows || {};
  const waterfall = results.waterfall_results || {};

  const lpNetIrr = lpMetrics.lpNetIrr ?? lpMetrics.lp_irr ?? waterfall.lp_irr;
  const lpTvpi = lpMetrics.tvpi ?? lpMetrics.lpMultiple ?? waterfall.lp_multiple;
  const lpDpi = lpMetrics.dpi; // Usually calculated or directly from waterfall if available
  const lpRvpi = lpMetrics.rvpi; // Usually calculated or directly from waterfall if available

  const totalCapitalCalled = cashFlows.lp_contributions_total ?? waterfall.total_lp_contribution;
  const totalDistributions = cashFlows.lp_distributions_total ?? waterfall.total_lp_distribution;

  let lpNetProfit = null;
  if (totalDistributions !== undefined && totalCapitalCalled !== undefined) {
    lpNetProfit = totalDistributions - totalCapitalCalled;
  }

  const fundSize = config.fund_size;
  const gpCommitmentPct = config.gp_commitment_percentage;
  const lpCommittedCapital = fundSize && gpCommitmentPct !== undefined ? fundSize * (1 - gpCommitmentPct) : null;

  log(LogLevel.INFO, LogCategory.DATA, 'LP Economics Metrics:', {
    lpNetIrr,
    lpTvpi,
    lpDpi,
    lpRvpi,
    totalCapitalCalled,
    totalDistributions,
    lpNetProfit,
    lpCommittedCapital
  });

  return (
    <div className="flex flex-col h-full">
      {/* A. Header Bar (40px) */}
      <HeaderBarA simulation={simulation} results={results} onExport={onExport} />

      <div className="flex-grow overflow-y-auto space-y-4 p-4">
        {/* B. KPI Ribbon */}
        <KPIRibbonB simulation={simulation} results={results} isLoading={isLoading} />

        {/* C. NAV vs DPI QuadChart - Full Row */}
        {isLoading ? (
          <Skeleton className="h-[450px] w-full" />
        ) : (
          <NavDpiQuadChartC
            simulation={simulation}
            results={results}
            isLoading={isLoading}
            timeGranularity={timeGranularity}
          />
        )}

        {/* D. Risk & Liquidity QuadChart - Full Row */}
        {isLoading ? (
          <Skeleton className="h-[450px] w-full" />
        ) : (
          <RiskLiquidityQuadChartD
            simulation={simulation}
            results={results}
            isLoading={isLoading}
          />
        )}

        {/* E. Cash-Flow Waterfall + Run-Rate Heat-strip */}
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <CashflowWaterfallE
            simulation={simulation}
            results={results}
            isLoading={isLoading}
          />
        )}

        {/* F. Zone & Vintage Breakdown */}
        {isLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <ZoneVintageBreakdownF
            simulation={simulation}
            results={results}
            isLoading={isLoading}
          />
        )}

        {/* G. Forward IRR Distribution Ribbon */}
        {isLoading ? (
          <Skeleton className="h-[150px] w-full" />
        ) : (
          <ForwardIRRDistributionG
            simulation={simulation}
            results={results}
            isLoading={isLoading}
          />
        )}

        {/* H. Scenario Toggle & Tornado Panel */}
        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : (
          <ScenarioTornadoPanelH
            simulation={simulation}
            results={results}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
