import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Info, Calendar, DollarSign, BarChart3, PieChart } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

import { TimeGranularity } from '@/types/finance';
import { formatCurrency, formatPercentage, formatMultiple } from '@/utils/format';
import { LogLevel, LogCategory, logMissingData, logDataLoaded, logBackendDataStructure } from '@/utils/logging';

import { EnhancedJourneyChart, JourneyDataPoint, JourneyKeyEvent } from './enhanced-journey-chart';
import { ViewToggle, ViewType } from './view-toggle';
import { TimeGranularityToggle } from './time-granularity-toggle';
import { PerspectiveToggle, Perspective } from './perspective-toggle';
import { DistributionBreakdown } from './distribution-breakdown';
import { AmericanWaterfallChart } from './waterfall-chart';

interface InvestmentJourneyVisualizationProps {
  results: any;
  isLoading: boolean;
  timeGranularity?: TimeGranularity;
  cumulativeMode?: boolean;
}

export function EnhancedInvestmentJourneyVisualization({
  results,
  isLoading,
  timeGranularity = 'yearly',
  cumulativeMode = true
}: InvestmentJourneyVisualizationProps) {
  console.log('EnhancedInvestmentJourneyVisualization rendering', { results, isLoading, timeGranularity, cumulativeMode });

  // View state
  const [viewType, setViewType] = useState<ViewType>('value');
  const [perspective, setPerspective] = useState<Perspective>('lp');
  const [granularity, setGranularity] = useState<TimeGranularity>(timeGranularity);
  const [selectedEvent, setSelectedEvent] = useState<JourneyKeyEvent | null>(null);
  const [showWaterfall, setShowWaterfall] = useState<boolean>(true);

  // Detect available granularities and perspectives
  const availableGranularities = useMemo(() => {
    if (!results) return ['yearly'] as TimeGranularity[];

    const availableOptions: TimeGranularity[] = ['yearly'];

    // Check if quarterly data exists
    if (results.quarterly_data || results.quarterlyData) {
      availableOptions.push('quarterly');
    }

    // Check if monthly data exists
    if (results.monthly_data || results.monthlyData) {
      availableOptions.push('monthly');
    }

    return availableOptions;
  }, [results]);

  // Detect available perspectives
  const availablePerspectives = useMemo(() => {
    if (!results) return ['lp', 'fund', 'gp'] as Perspective[];

    // Always include all three perspectives
    // We'll adapt the data based on the selected perspective
    return ['lp', 'fund', 'gp'] as Perspective[];
  }, [results]);

  // Reset perspective if current one is not available
  useEffect(() => {
    if (!availablePerspectives.includes(perspective)) {
      setPerspective(availablePerspectives[0] as Perspective);
    }
  }, [availablePerspectives, perspective]);

  // Reset granularity if current one is not available
  useEffect(() => {
    if (!availableGranularities.includes(granularity)) {
      setGranularity(availableGranularities[0] as TimeGranularity);
    }
  }, [availableGranularities, granularity]);

  // Log results data when it changes
  useEffect(() => {
    if (results) {
      logBackendDataStructure(results, 'Investment Journey Results');
    }
  }, [results]);

  // Process data for visualization
  const memoizedData = useMemo(() => {
    if (isLoading || !results) {
      logMissingData('EnhancedInvestmentJourneyVisualization', 'results', 'object', results);
      return {
        journeyData: [],
        keyEvents: [],
        summaryMetrics: {
          totalCapitalCalled: 0,
          totalDistributions: 0,
          currentNav: 0,
          netCashFlow: 0,
          grossIRR: 0,
          fundIRR: 0,
          lpIRR: 0,
          gpIRR: 0,
          dpiRatio: 0,
          tvpiRatio: 0,
          rvpiRatio: 0,
          managementFeeImpact: 0,
          carriedInterestImpact: 0,
          totalFeeDrag: 0,
          managementFees: 0,
          carriedInterest: 0,
          gpCarriedInterest: 0,
          gpManagementFees: 0,
          gpTotalEconomics: 0,
          totalLoans: 0,
          totalExitedLoans: 0,
          totalDefaultedLoans: 0,
          avgExitYear: 0,
          avgLoanSize: 0,
          avgPropertyValue: 0,
          avgLtv: 0
        },
        breakdownData: null,
        irrWaterfallData: [],
        timelineEvents: []
      };
    }

    console.log('Processing investment journey data with SDK results:', results);

    // Authoritative data sources
    const sdkWaterfall = results.waterfall_results || results.waterfallResults || {};
    const sdkPerfMetrics = results.performance_metrics || results.performanceMetrics || {};
    const sdkGeneralMetrics = results.metrics || {}; 

    const authLpContribution = parseFloat(String(sdkWaterfall.capital_contributions?.lp_contribution || sdkWaterfall.capitalContributions?.lpContribution || sdkGeneralMetrics.total_capital_calls || sdkGeneralMetrics.totalCapitalCalls || 0));
    const authTotalDistributionsToLP = parseFloat(String(sdkWaterfall.total_lp_distribution || sdkWaterfall.totalLpDistribution || sdkGeneralMetrics.total_distributions || 0));
    const authNav = parseFloat(String(sdkGeneralMetrics.current_nav || sdkGeneralMetrics.currentNAV || 0));
    const authFinalLpIRR = parseFloat(String(sdkWaterfall.lp_irr || sdkWaterfall.lpIrr || sdkWaterfall.lp_net_irr || sdkWaterfall.lpNetIrr || sdkGeneralMetrics.lp_irr || sdkGeneralMetrics.lpIrr || 0));
    const authFinalFundIRR = parseFloat(String(sdkPerfMetrics.fund_irr || sdkPerfMetrics.fundIrr || sdkPerfMetrics.irr || sdkGeneralMetrics.fund_irr || sdkGeneralMetrics.irr || 0));
    const authFinalGrossIRR = parseFloat(String(sdkPerfMetrics.gross_irr || sdkPerfMetrics.grossIrr || sdkGeneralMetrics.gross_irr || 0));
    
    const portfolioEvolution = results.portfolioEvolution || results.portfolio_evolution || {};
    const cashFlowsByYear = results.cashflows || results.cash_flows || results.cashFlows || {};
    const loanContributions = (sdkWaterfall?.loan_contribution_map || sdkWaterfall?.loanContributionMap) || {};
    const events = results.events || results.timeline_events || results.timelineEvents || [];
    const portfolioMetricsForJourney = results.portfolio_metrics || results.portfolioMetrics || {};

    // Initialize arrays for journey data construction
    const journeyDataPoints: JourneyDataPoint[] = [];
    const yearlyKeyEvents: JourneyKeyEvent[] = [];

    const allYears = new Set<number>();
    if (portfolioEvolution.years && Array.isArray(portfolioEvolution.years)) {
      portfolioEvolution.years.forEach((year: number) => {
        if (typeof year === 'number') allYears.add(year);
      });
    } else {
      Object.keys(portfolioEvolution).forEach(yearStr => {
        if (yearStr !== 'years' && yearStr !== 'activeLoans' && yearStr !== 'active_loans') {
          const yearNum = parseInt(yearStr);
          if (!isNaN(yearNum)) allYears.add(yearNum);
        }
      });
    }
    Object.keys(cashFlowsByYear).forEach(yearStr => {
      const yearNum = parseInt(yearStr);
      if (!isNaN(yearNum)) allYears.add(yearNum);
    });
    const sortedYearsRaw = Array.from(allYears).sort((a, b) => a - b);

    // Determine fund term (if available) to cap years
    const fundTerm: number | undefined = (results?.config?.fund_term ?? results?.config?.fundTerm) as number | undefined;

    // Helper to check if a cash-flow object has any real activity
    const hasActivity = (cf: any): boolean => {
      if (!cf || typeof cf !== 'object') return false;
      const valFields = [
        'capital_calls', 'capitalCalls',
        'distributions', 'distribution',
        'net_cash_flow', 'netCashFlow',
        'lp_net_cash_flow', 'lpNetCashFlow',
        'gross_net_cash_flow', 'grossNetCashFlow'
      ];
      return valFields.some(k => {
        const v = cf[k];
        if (v === undefined || v === null) return false;
        const num = parseFloat(String(v));
        return !isNaN(num) && num !== 0;
      });
    };

    const sortedYears = sortedYearsRaw.filter(year => {
      // Exclude years beyond fund term (if term provided)
      if (fundTerm !== undefined && year > fundTerm) return false;

      // Exclude years with no activity in cash-flows and no portfolio data
      const cfObj = cashFlowsByYear[year];
      const hasCF = hasActivity(cfObj);

      const peYear = portfolioEvolution[year] || {};
      const hasPortfolioActivity = typeof peYear === 'object' && Object.keys(peYear).length > 0 && (
        (peYear.activeLoans || peYear.active_loans || []).length > 0 ||
        (peYear.metrics && Object.values(peYear.metrics).some((v:any)=> parseFloat(String(v||0))!==0))
      );

      return hasCF || hasPortfolioActivity;
    });

    let cumulativeCapitalCalls = 0;
    let cumulativeDistributions = 0;
    let firstCapitalCallYear: number | null = null;
    let firstDistributionYear: number | null = null;
    let breakEvenYear: number | null = null;

    // Use authoritative IRR sources for yearly data in the journey chart
    const yearlyLpIRR = sdkWaterfall.lp_irr_by_year || sdkWaterfall.lpIrrByYear || sdkWaterfall.lp_net_irr_by_year || sdkWaterfall.lpNetIrrByYear || {};
    const yearlyFundIRR = sdkPerfMetrics.fund_irr_by_year || sdkPerfMetrics.fundIrrByYear || sdkGeneralMetrics.fund_irr_by_year || {};
    const yearlyGpIRR = sdkWaterfall.gp_irr_by_year || sdkWaterfall.gpIrrByYear || sdkPerfMetrics.gp_irr_by_year || sdkGeneralMetrics.gp_irr_by_year || {};
    const yearlyGrossIRR = sdkPerfMetrics.irr_by_year || sdkPerfMetrics.irrByYear || sdkGeneralMetrics.gross_irr_by_year || {};

    sortedYears.forEach(year => {
      let pointIrr = 0;
      if (perspective === 'lp') pointIrr = yearlyLpIRR[year] !== undefined ? yearlyLpIRR[year] : (year === sortedYears[sortedYears.length-1] ? authFinalLpIRR : 0);
      else if (perspective === 'fund') pointIrr = yearlyFundIRR[year] !== undefined ? yearlyFundIRR[year] : (year === sortedYears[sortedYears.length-1] ? authFinalFundIRR : 0);
      else if (perspective === 'gp') pointIrr = yearlyGpIRR[year] !== undefined ? yearlyGpIRR[year] : (year === sortedYears[sortedYears.length-1] ? (sdkWaterfall.gp_irr || sdkGeneralMetrics.gp_irr || 0) : 0);
      else pointIrr = yearlyGrossIRR[year] !== undefined ? yearlyGrossIRR[year] : (year === sortedYears[sortedYears.length-1] ? authFinalGrossIRR : 0);

      // Placeholder for the rest of the journeyDataPoint construction
      // This part needs to be carefully merged with the original file's extensive logic
      // For example:
      // const capitalCall = ... ;
      // const distribution = ... ;
      // const portfolioValue = ... ;
      // cumulativeCapitalCalls += capitalCall;
      // cumulativeDistributions += distribution; 
      // etc.
      // journeyDataPoints.push({ period: year, periodLabel: `Year ${year}`, capitalCall, distribution, portfolioValue, cumulativeCapitalCalls, cumulativeDistributions, irr: pointIrr, /* ... other fields */ });
    });

    // Initialize breakdownData before it's potentially populated
    let calculatedBreakdownData = null; 
    if (selectedEvent && (selectedEvent.eventType === 'distribution' || selectedEvent.eventType === 'firstDistribution')) {
      const yearData = cashFlowsByYear[selectedEvent.period] || {};
      const waterfallDataForBreakdown = (sdkWaterfall && sdkWaterfall[selectedEvent.period]) || {};
      calculatedBreakdownData = {
        period: selectedEvent.period,
        periodLabel: selectedEvent.periodLabel,
        totalDistribution: selectedEvent.value,
        returnOfCapital: yearData.return_of_capital || yearData.returnOfCapital ||
                        waterfallDataForBreakdown.return_of_capital || waterfallDataForBreakdown.returnOfCapital ||
                        (selectedEvent.value * 0.7), 
        preferredReturn: yearData.preferred_return || yearData.preferredReturn ||
                        waterfallDataForBreakdown.preferred_return || waterfallDataForBreakdown.preferredReturn ||
                        (selectedEvent.value * 0.1),
        gpCatchup: yearData.gp_catchup || yearData.gpCatchup ||
                  waterfallDataForBreakdown.gp_catchup || waterfallDataForBreakdown.gpCatchup ||
                  (selectedEvent.value * 0.1),
        carriedInterest: yearData.carried_interest || yearData.carriedInterest ||
                        waterfallDataForBreakdown.carried_interest || waterfallDataForBreakdown.carriedInterest ||
                        (selectedEvent.value * 0.1),
        lpShare: yearData.lp_share || yearData.lpShare ||
                waterfallDataForBreakdown.lp_share || waterfallDataForBreakdown.lpShare ||
                (selectedEvent.value * 0.8),
        gpShare: yearData.gp_share || yearData.gpShare ||
                waterfallDataForBreakdown.gp_share || waterfallDataForBreakdown.gpShare ||
                (selectedEvent.value * 0.2),
        hurdleRate: sdkGeneralMetrics.hurdle_rate || sdkGeneralMetrics.hurdleRate || 0.08,
        catchupRate: sdkGeneralMetrics.catchup_rate || sdkGeneralMetrics.catchupRate || 0.5,
        carryRate: sdkGeneralMetrics.carried_interest_rate || sdkGeneralMetrics.carriedInterestRate || 0.2
      };
    }

    // --- New Summary Metrics and IRR Waterfall Data Calculation ---
    let dpi = 0;
    if (authLpContribution > 0 && authTotalDistributionsToLP !== undefined) {
      dpi = authTotalDistributionsToLP / authLpContribution;
    }
    let rvpi = 0;
    if (authLpContribution > 0 && authNav !== undefined) {
      rvpi = authNav / authLpContribution;
    }
    let tvpi = 0;
    if (sdkWaterfall.lp_multiple !== undefined || sdkWaterfall.lpMultiple !== undefined) {
      tvpi = parseFloat(String(sdkWaterfall.lp_multiple || sdkWaterfall.lpMultiple));
    } else if (sdkGeneralMetrics.tvpi !== undefined) {
      tvpi = parseFloat(String(sdkGeneralMetrics.tvpi));
    } else if (authLpContribution > 0 && authTotalDistributionsToLP !== undefined && authNav !== undefined) {
      tvpi = (authTotalDistributionsToLP + authNav) / authLpContribution;
    } else {
      tvpi = dpi + rvpi; 
    }
    
    const summaryManagementFeeImpact = authFinalGrossIRR > 0 && authFinalFundIRR !== undefined ? authFinalGrossIRR - authFinalFundIRR : 0;
    const summaryCarriedInterestImpact = authFinalFundIRR > 0 && authFinalLpIRR !== undefined ? authFinalFundIRR - authFinalLpIRR : 0;

    const finalSummaryMetrics = {
      totalCapitalCalled: authLpContribution,
      totalDistributions: authTotalDistributionsToLP,
      currentNav: authNav,
      netCashFlow: authTotalDistributionsToLP - authLpContribution,
      grossIRR: authFinalGrossIRR,
      fundIRR: authFinalFundIRR,
      lpIRR: authFinalLpIRR,
      gpIRR: parseFloat(String(sdkWaterfall.gp_irr || sdkWaterfall.gpIrr || sdkGeneralMetrics.gp_irr || 0)),
      dpiRatio: dpi,
      tvpiRatio: tvpi,
      rvpiRatio: rvpi,
      managementFeeImpact: -Math.abs(summaryManagementFeeImpact),
      carriedInterestImpact: -Math.abs(summaryCarriedInterestImpact),
      totalFeeDrag: -Math.abs(authFinalGrossIRR > 0 && authFinalLpIRR !== undefined ? authFinalGrossIRR - authFinalLpIRR : 0),
      managementFees: parseFloat(String(sdkGeneralMetrics.management_fees || sdkGeneralMetrics.managementFees || 0)),
      carriedInterest: parseFloat(String(sdkGeneralMetrics.carried_interest || sdkGeneralMetrics.carriedInterest || sdkWaterfall.gp_carried_interest || sdkWaterfall.gpCarriedInterest || 0)),
      gpCarriedInterest: parseFloat(String(sdkWaterfall.gp_carried_interest || sdkWaterfall.gpCarriedInterest || sdkGeneralMetrics.gp_carried_interest || 0)),
      gpManagementFees: parseFloat(String(sdkGeneralMetrics.gp_management_fees || sdkGeneralMetrics.gpManagementFees || 0)),
      gpTotalEconomics: (parseFloat(String(sdkWaterfall.gp_carried_interest || sdkWaterfall.gpCarriedInterest || sdkGeneralMetrics.gp_carried_interest || 0))) + 
                        (parseFloat(String(sdkGeneralMetrics.gp_management_fees || sdkGeneralMetrics.gpManagementFees || 0))),
      totalLoans: parseInt(String(sdkGeneralMetrics.total_loans || sdkGeneralMetrics.totalLoans || portfolioMetricsForJourney.total_loans || portfolioMetricsForJourney.totalLoans || 0)),
      totalExitedLoans: parseInt(String(sdkGeneralMetrics.total_exited_loans || sdkGeneralMetrics.totalExitedLoans || portfolioMetricsForJourney.total_exited_loans || portfolioMetricsForJourney.totalExitedLoans || 0)),
      totalDefaultedLoans: parseInt(String(sdkGeneralMetrics.total_defaulted_loans || sdkGeneralMetrics.totalDefaultedLoans || portfolioMetricsForJourney.total_defaulted_loans || portfolioMetricsForJourney.totalDefaultedLoans || 0)),
      avgExitYear: parseFloat(String(sdkGeneralMetrics.avg_exit_year || sdkGeneralMetrics.avgExitYear || portfolioMetricsForJourney.avg_exit_year || portfolioMetricsForJourney.avgExitYear || 0)),
      avgLoanSize: parseFloat(String(sdkGeneralMetrics.avg_loan_size || sdkGeneralMetrics.avgLoanSize || portfolioMetricsForJourney.avg_loan_size || portfolioMetricsForJourney.avgLoanSize || 0)),
      avgPropertyValue: parseFloat(String(sdkGeneralMetrics.avg_property_value || sdkGeneralMetrics.avgPropertyValue || portfolioMetricsForJourney.avg_property_value || portfolioMetricsForJourney.avgPropertyValue || 0)),
      avgLtv: parseFloat(String(sdkGeneralMetrics.avg_ltv || sdkGeneralMetrics.avgLtv || portfolioMetricsForJourney.avg_ltv || portfolioMetricsForJourney.avgLtv || 0))
    };

    const finalIrrWaterfallData = [
      { name: 'Gross IRR', value: finalSummaryMetrics.grossIRR * 100, percentage: formatPercentage(finalSummaryMetrics.grossIRR), color: '#10b981', description: 'Pre-fee IRR' }
    ];
    if (summaryManagementFeeImpact !== 0) { 
      finalIrrWaterfallData.push({ name: 'Management Fees', value: -Math.abs(summaryManagementFeeImpact) * 100, percentage: formatPercentage(-Math.abs(summaryManagementFeeImpact)), color: '#ef4444', description: 'Impact of management fees' });
    }
    finalIrrWaterfallData.push({ name: 'Fund IRR', value: finalSummaryMetrics.fundIRR * 100, percentage: formatPercentage(finalSummaryMetrics.fundIRR), color: '#3b82f6', description: 'IRR after management fees' });
    if (summaryCarriedInterestImpact !== 0) { 
      finalIrrWaterfallData.push({ name: 'Carried Interest', value: -Math.abs(summaryCarriedInterestImpact) * 100, percentage: formatPercentage(-Math.abs(summaryCarriedInterestImpact)), color: '#f97316', description: 'Impact of carried interest' });
    }
    finalIrrWaterfallData.push({ name: 'LP Net IRR', value: finalSummaryMetrics.lpIRR * 100, percentage: formatPercentage(finalSummaryMetrics.lpIRR), color: '#8b5cf6', description: 'Net IRR to LPs' });

    // The existing timelineEvents processing using 'events' should be fine
    const processedTimelineEvents = Array.isArray(events) ? events.map(event => ({
      id: event.id || `event-${event.period || Math.random().toString(36).substring(2, 9)}`,
      period: event.period,
      date: event.date,
      type: event.type || event.eventType,
      subtype: event.subtype || event.eventSubtype,
      name: event.name || event.eventName,
      description: event.description,
      value: event.value || 0,
      metadata: event.metadata || {}
    })) : [];

    console.log('Processed journey data (main-visualization):', {
      journeyDataPoints: journeyDataPoints.length, 
      keyEvents: yearlyKeyEvents.length, 
      timelineEvents: processedTimelineEvents.length,
      summaryMetrics: finalSummaryMetrics,
      irrWaterfallData: finalIrrWaterfallData
    });

    return {
      journeyData: journeyDataPoints, 
      keyEvents: yearlyKeyEvents,   
      summaryMetrics: finalSummaryMetrics,
      breakdownData: calculatedBreakdownData,
      irrWaterfallData: finalIrrWaterfallData,
      timelineEvents: processedTimelineEvents
    };
  }, [results, isLoading, selectedEvent, perspective, granularity]);

  // Destructure with the correct name for the memoized result
  const { 
    journeyData,
    keyEvents,
    summaryMetrics,
    breakdownData,
    irrWaterfallData,
    timelineEvents
  } = memoizedData;

  // Handler for when a journey event is clicked
  const handleEventClick = (event: JourneyKeyEvent) => {
    setSelectedEvent(event);
  };

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="w-full h-[700px] space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-10 w-64 bg-muted animate-pulse rounded-md"></div>
          <div className="h-8 w-40 bg-muted animate-pulse rounded-md"></div>
        </div>
        <div className="h-[600px] w-full bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }

  // Handle empty data
  if (!journeyData.length) {
    return (
      <div className="w-full h-[700px] flex items-center justify-center border border-dashed rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No Investment Journey Data Available</h3>
          <p className="text-muted-foreground">There is no portfolio evolution data for this simulation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with title and controls */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Investment Journey
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>Comprehensive lifecycle analysis from capital calls to distributions</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h2>
          <p className="text-muted-foreground">Track the complete investment journey with detailed metrics and visualizations</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <ViewToggle
            value={viewType}
            onChange={setViewType}
          />

          <PerspectiveToggle
            value={perspective}
            onChange={setPerspective}
            availablePerspectives={availablePerspectives}
          />

          <TimeGranularityToggle
            value={granularity}
            onChange={setGranularity}
            availableGranularities={availableGranularities}
          />

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Capital Called</p>
                <p className="text-xl font-semibold">{formatCurrency(summaryMetrics.totalCapitalCalled)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-2 rounded-full">
                <BarChart3 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Distributions</p>
                <p className="text-xl font-semibold">{formatCurrency(summaryMetrics.totalDistributions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-full">
                <PieChart className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{perspective === 'lp' ? 'LP' : perspective === 'fund' ? 'Fund' : 'GP'} IRR</p>
                <p className="text-xl font-semibold">{formatPercentage(
                  perspective === 'lp' ? summaryMetrics.lpIRR :
                  perspective === 'fund' ? summaryMetrics.fundIRR :
                  summaryMetrics.gpIRR
                )}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chart - 3/5 width on large screens */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                {perspective === 'lp' ? 'LP' :
                 perspective === 'fund' ? 'Fund' :
                 perspective === 'gp' ? 'GP' : 'Fund'} Performance
                <Badge variant="outline" className="ml-2">
                  {viewType === 'value' ? 'Value View' :
                   viewType === 'multiple' ? 'Multiple View' :
                   'IRR View'}
                </Badge>
              </CardTitle>
              <CardDescription>
                {viewType === 'value' ? 'Capital calls, distributions, and portfolio value over time' :
                 viewType === 'multiple' ? 'Investment multiple progression throughout the fund lifecycle' :
                 'IRR progression showing performance over time'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <EnhancedJourneyChart
                data={journeyData}
                keyEvents={keyEvents}
                viewType={viewType}
                timeGranularity={granularity}
                perspective={perspective}
                onEventClick={handleEventClick}
                showWaterfall={showWaterfall}
                height={500}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right panels - 2/5 width on large screens */}
        <div className="lg:col-span-2 space-y-6">
          {/* IRR Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">IRR Breakdown</CardTitle>
              <CardDescription>Comprehensive breakdown of IRR components and fee impact</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <AmericanWaterfallChart
                data={irrWaterfallData}
                height={300}
                title=""
                showPercentages={true}
              />
            </CardContent>
          </Card>

          {/* Distribution Breakdown - only shown when an event is selected */}
          {selectedEvent && (selectedEvent.eventType === 'distribution' || selectedEvent.eventType === 'firstDistribution') && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Distribution Breakdown</CardTitle>
                <CardDescription>Waterfall breakdown for {selectedEvent.periodLabel} distribution</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <DistributionBreakdown
                  data={breakdownData}
                  isLoading={false}
                  isAmericanStyle={true}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Detailed Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Financial Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Financial Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">Capital Called</span>
                  <span className="text-base font-semibold text-red-600">
                    {formatCurrency(summaryMetrics.totalCapitalCalled)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">Distributions</span>
                  <span className="text-base font-semibold text-green-600">
                    {formatCurrency(summaryMetrics.totalDistributions)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm flex items-center gap-1">
                    Remaining Value
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            Remaining value consists of cash balance and any unrealized investments at the end of the fund term.
                            This is the value that hasn't been distributed to investors yet.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <span className="text-base font-semibold text-blue-600">
                    {formatCurrency(summaryMetrics.currentNav)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">Net Cash Flow</span>
                  <span className="text-base font-semibold text-green-600">
                    {formatCurrency(summaryMetrics.netCashFlow)}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">DPI</span>
                  <span className="text-base font-semibold">
                    {formatMultiple(summaryMetrics.dpiRatio)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">TVPI</span>
                  <span className="text-base font-semibold">
                    {formatMultiple(summaryMetrics.tvpiRatio)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">RVPI</span>
                  <span className="text-base font-semibold">
                    {formatMultiple(summaryMetrics.rvpiRatio)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* IRR Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">IRR Metrics</CardTitle>
            <CardDescription>Returns at different levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm flex items-center gap-1">
                    Gross IRR
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            Pre-fee IRR calculated on the raw investment returns (exit proceeds + interest + appreciation + origination fees)
                            before any management fees, fund expenses, or carried interest. This represents the performance of the
                            underlying investments only.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <span className="text-base font-semibold text-green-600">
                    {formatPercentage(summaryMetrics.grossIRR)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm flex items-center gap-1">
                    Fund IRR
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            Fund-level IRR after deducting management fees and fund expenses, but before carried interest.
                            This represents the performance at the fund level before distributions to LPs and GPs.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <span className="text-base font-semibold text-blue-600">
                    {formatPercentage(summaryMetrics.fundIRR)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm flex items-center gap-1">
                    LP IRR
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            Limited Partner IRR after deducting both management fees and carried interest.
                            This is the actual return received by LPs after the GP has taken their share.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <span className="text-base font-semibold text-violet-600">
                    {formatPercentage(summaryMetrics.lpIRR)}
                  </span>
                </div>
                {summaryMetrics.gpIRR > 0 && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm flex items-center gap-1">
                      GP IRR
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">
                              General Partner IRR calculated on the GP's economics (management fees + carried interest).
                              This represents the return on the GP's investment and effort, and is typically higher than
                              the other IRR metrics.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <span className="text-base font-semibold text-orange-600">
                      {formatPercentage(summaryMetrics.gpIRR)}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">Management Fee Impact</span>
                  <span className="text-base font-semibold text-red-600">
                    {formatPercentage(summaryMetrics.managementFeeImpact)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">Carried Interest Impact</span>
                  <span className="text-base font-semibold text-orange-600">
                    {formatPercentage(summaryMetrics.carriedInterestImpact)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">Total Fee Drag</span>
                  <span className="text-base font-semibold text-red-600">
                    {formatPercentage(summaryMetrics.totalFeeDrag)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Portfolio Metrics</CardTitle>
            <CardDescription>Loan and property statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">Total Loans</span>
                  <span className="text-base font-semibold">
                    {summaryMetrics.totalLoans}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">Exited Loans</span>
                  <span className="text-base font-semibold">
                    {summaryMetrics.totalExitedLoans}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">Defaulted Loans</span>
                  <span className="text-base font-semibold">
                    {summaryMetrics.totalDefaultedLoans}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">Avg. Exit Year</span>
                  <span className="text-base font-semibold">
                    {summaryMetrics.avgExitYear.toFixed(1)}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">Avg. Loan Size</span>
                  <span className="text-base font-semibold">
                    {formatCurrency(summaryMetrics.avgLoanSize)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">Avg. Property Value</span>
                  <span className="text-base font-semibold">
                    {formatCurrency(summaryMetrics.avgPropertyValue)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">Avg. LTV</span>
                  <span className="text-base font-semibold">
                    {formatPercentage(summaryMetrics.avgLtv)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Events */}
        <Card className="col-span-1 md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Investment Timeline</CardTitle>
            <CardDescription>Key events throughout the investment lifecycle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted"></div>

              <div className="space-y-6 pl-12 relative">
                {keyEvents.length > 0 ? (
                  keyEvents.map((event, index) => (
                    <div
                      key={`event-${index}`}
                      className={`relative ${selectedEvent && selectedEvent.period === event.period ? 'bg-muted/50' : ''} p-4 rounded-lg border cursor-pointer hover:bg-muted/30`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      {/* Timeline dot */}
                      <div
                        className="absolute left-[-2.5rem] top-4 h-4 w-4 rounded-full border-2 border-background"
                        style={{
                          backgroundColor: event.eventType === 'firstCapitalCall' ? '#ef4444' :
                                          event.eventType === 'firstDistribution' ? '#22c55e' :
                                          event.eventType === 'breakeven' ? '#3b82f6' :
                                          '#8b5cf6'
                        }}
                      ></div>

                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{event.eventName}</span>
                            <Badge variant="outline">
                              {event.periodLabel}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">
                            {event.eventType.includes('Capital') ? 'Capital Called:' : 'Distribution:'}
                          </span>
                          <p className="text-base font-semibold">
                            {formatCurrency(event.value)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No key events found in this simulation
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}