import React from 'react';
import { MetricCard } from '@/components/ui/metric-card'; // Assuming a reusable MetricCard
import { Card, CardContent } from '@/components/ui/card'; // Added Card, CardContent imports
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Percent,
  ShieldCheck,
  Zap,
  HelpCircle, // Placeholder for tooltips/info
  ArrowDownToLine,
  InfoIcon // Added InfoIcon for tooltips
} from 'lucide-react';
import { formatPercentage, formatMultiple, formatNumber } from '@/lib/formatters';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components
import { Button } from '@/components/ui/button'; // Import Button component

interface KPIRibbonBProps {
  simulation: any;
  results: any;
  isLoading: boolean;
}

// Placeholder for sparkline component - to be implemented
const Sparkline = ({ data }: { data: number[] }) => {
  if (!data || data.length === 0) return <div className="h-6 w-12 bg-gray-200 rounded-sm opacity-50" />;
  return <div className="text-xs text-gray-400">~</div>;
};

const QChangeIndicator = ({ change, type }: { change: string | null, type: 'increase' | 'decrease' | 'neutral' }) => {
  if (change === null) return <span className="text-xs text-gray-400"></span>; // No change data

  let IconComponent = Minus;
  let textColor = 'text-gray-500';
  if (type === 'increase') {
    IconComponent = TrendingUp;
    textColor = 'text-green-600';
  } else if (type === 'decrease') {
    IconComponent = TrendingDown;
    textColor = 'text-red-600';
  }

  return (
    <span className={`flex items-center text-xs ${textColor}`}>
      <IconComponent className="h-3 w-3 mr-0.5" />
      {change}
    </span>
  );
};

export function KPIRibbonB({ simulation, results, isLoading }: KPIRibbonBProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-3 bg-gray-50 border-y">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[110px] w-full bg-white rounded-md border border-gray-200" />)}
      </div>
    );
  }

  if (!results) {
    return <div className="p-4 text-muted-foreground">KPI data not available.</div>;
  }

  const lpMetrics = results.metrics || {};
  const performanceMetrics = results.performance_metrics || {}; // Gross metrics might be here
  const config = simulation?.config || {};
  const leverageMetrics = results.leverage_metrics || {}; // As per LEVERAGE_UI_GUIDE.md
  const portfolioEvolution = results.portfolio_evolution || {};

  // --- KPI Calculations (Direct data or placeholders) ---

  // 1. Net IRR (P50)
  const netIRR = lpMetrics.lpNetIrr ?? lpMetrics.lp_irr;
  const netIRR_QQChangeVal = null; // Placeholder: e.g., 0.0015 for +15bp
  const netIRR_QQChangeFormatted = netIRR_QQChangeVal !== null ? `${netIRR_QQChangeVal > 0 ? '+' : ''}${(netIRR_QQChangeVal * 10000).toFixed(0)}bp` : null;

  // 2. TVPI
  const tvpi = lpMetrics.tvpi ?? lpMetrics.lpMultiple;
  const grossTVPI = performanceMetrics.gross_tvpi ?? performanceMetrics.grossMultiple ?? lpMetrics.gross_tvpi ?? lpMetrics.grossMultiple;

  // 3. DPI
  const dpi = lpMetrics.dpi;

  // 4. Hurdle-Clear Prob
  const hurdleClearProbVal = null; // Placeholder: e.g., 0.97
  const hurdleRate = config.hurdle_rate;

  // 5. Liquidity Buffer
  let liquidityBufferVal = null;
  const lastYearKey = Object.keys(portfolioEvolution).map(Number).filter(k => !isNaN(k)).sort((a,b) => b-a)[0];
  if (lastYearKey !== undefined && portfolioEvolution[lastYearKey]) {
    const lastYearData = portfolioEvolution[lastYearKey];
    const cashFlowsData = results.cash_flows || {};
    const yearlySummary = cashFlowsData.yearly_summary || {};
    const monthlySummary = cashFlowsData.monthly_summary || {};

    const availableCash = yearlySummary[lastYearKey]?.cash_balance ?? monthlySummary[lastYearKey*12+11]?.cash_balance;
    const nav = lastYearData.total_value;
    if (nav && nav > 0 && availableCash !== undefined) {
      liquidityBufferVal = availableCash / nav;
    }
  }
  const liquidityPolicyMin = 0.04;

  // 6. Leverage Util.
  let leverageUtilVal = null;
  if (leverageMetrics.avg_leverage !== undefined) { // from getApiLeverageMetrics
    leverageUtilVal = leverageMetrics.avg_leverage;
  } else if (leverageMetrics.total_debt_outstanding !== undefined && results.metrics?.current_nav !== undefined && results.metrics.current_nav > 0) {
     leverageUtilVal = leverageMetrics.total_debt_outstanding / results.metrics.current_nav;
  }
  const leverageLimit = 0.30;

  log(LogLevel.INFO, LogCategory.DATA, 'KPI Ribbon Metrics Values:', {
    netIRR, tvpi, grossTVPI, dpi, hurdleClearProbVal, liquidityBufferVal, leverageUtilVal
  });

  const kpis = [
    {
      title: "Net IRR (P50)",
      value: netIRR !== undefined && netIRR !== null ? formatPercentage(netIRR) : 'N/A',
      qqChange: netIRR_QQChangeFormatted,
      qqChangeType: netIRR_QQChangeVal === null ? 'neutral' : (netIRR_QQChangeVal > 0 ? 'increase' : 'decrease'),
      subText: `Hurdle: ${formatPercentage(hurdleRate)}`,
      tooltipContent: "Limited Partner Net Internal Rate of Return (P50). Q/Q change and P5/P95 toggle are illustrative placeholders.",
      icon: <Percent className="w-5 h-5 text-blue-600" />
    },
    {
      title: "TVPI",
      value: tvpi !== undefined && tvpi !== null ? formatMultiple(tvpi) : 'N/A',
      subText: grossTVPI ? `(Gross ${formatMultiple(grossTVPI)})` : "(Gross N/A)",
      tooltipContent: "Total Value to Paid-In Capital. Net of fees & carry.",
      icon: <TrendingUp className="w-5 h-5 text-green-600" />
    },
    {
      title: "DPI",
      value: dpi !== undefined && dpi !== null ? formatMultiple(dpi) : 'N/A',
      subText: "To-date distributions",
      tooltipContent: "Distributions to Paid-In Capital. Net of fees & carry.",
      icon: <ArrowDownToLine className="w-5 h-5 text-indigo-600" />
    },
    {
      title: "Hurdle-Clear Prob",
      value: hurdleClearProbVal !== null ? formatPercentage(hurdleClearProbVal) : "N/A",
      subText: hurdleClearProbVal === null ? "(MC data needed)" : (hurdleClearProbVal > 0.95 ? "🟢 High" : (hurdleClearProbVal > 0.8 ? "🟡 Med" : "🔴 Low")) ,
      tooltipContent: `Probability of Net IRR > ${formatPercentage(hurdleRate)}. Requires Monte Carlo simulation data. P95 view coming soon.`,
      icon: <ShieldCheck className="w-5 h-5 text-teal-600" />
    },
    {
      title: "Liquidity Buffer",
      value: liquidityBufferVal !== null ? formatPercentage(liquidityBufferVal) : "N/A",
      subText: `min ${formatPercentage(liquidityPolicyMin)} policy`,
      tooltipContent: "(Available Cash for LPs / LP NAV). Policy: maintain > 4%. Calculation is an approximation.",
      icon: <Zap className="w-5 h-5 text-orange-600" />
    },
    {
      title: "Leverage Util.",
      value: leverageUtilVal !== null ? formatPercentage(leverageUtilVal) : "N/A",
      subText: `limit ${formatPercentage(leverageLimit)}`,
      tooltipContent: "(Total Fund Debt / Fund NAV). Limit: 30% of NAV.",
      icon: <TrendingUp className="w-5 h-5 text-purple-600" />
    }
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-3 bg-gray-50 border-y">
        {kpis.map((kpi, index) => (
          <Card key={index} className="bg-white border border-gray-200 rounded-md group hover:scale-105 hover:shadow-md transition-transform duration-150 ease-in-out">
            <CardContent className="p-3 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-700 truncate">{kpi.title}</h4>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-50 hover:opacity-100">
                        <InfoIcon className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="max-w-xs text-xs">
                      <p>{kpi.tooltipContent}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-[#0B1C3F] truncate">
                    {kpi.value}
                  </span>
                  {kpi.qqChange && (
                    <QChangeIndicator change={kpi.qqChange} type={kpi.qqChangeType as any} />
                  )}
                </div>
              </div>
              <div className="mt-auto">
                <Sparkline data={[]} /> {/* Placeholder for sparkline */}
                {kpi.subText && (
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {kpi.subText}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}