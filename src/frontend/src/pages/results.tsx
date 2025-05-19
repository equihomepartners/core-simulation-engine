import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Error } from '@/components/ui/error';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useSimulation } from '@/hooks/use-simulation';
import { useSimulationResults } from '@/hooks/use-simulation-results';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft,
  RefreshCw,
  Download,
  Info,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  DollarSign,
  Calendar,
  Percent,
  ArrowDownToLine,
  ArrowUpToLine,
  FileText,
  BarChart,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  Briefcase,
  Clock,
  Users,
  Layers,
  MinusCircle,
  Terminal
} from 'lucide-react';

// Import our enhanced components
import { BackendDataLogger } from '@/components/debug/backend-data-logger';
import { EnhancedHeadlineMetrics } from '@/components/results/enhanced-headline-metrics';
import { EnhancedCashFlowChart } from '@/components/results/enhanced-cash-flow-chart';
import { EnhancedIRRBreakdownChart } from '@/components/results/enhanced-irr-breakdown-chart';
import { EnhancedPortfolioEvolutionChart } from '@/components/results/enhanced-portfolio-evolution-chart';
import { SimplePortfolioEvolutionChart } from '@/components/results/simple-portfolio-evolution-chart';
import { GPCashFlowChart } from '@/components/results/gp-cash-flow-chart';
import { GPEconomicsMetrics } from '@/components/results/gp-economics-metrics';
import { GPIRRBreakdownChart } from '@/components/results/gp-irr-breakdown-chart';
import { EnhancedZoneAllocationChart } from '@/components/results/enhanced-zone-allocation-chart';
import { LPEconomicsTab } from '@/components/results/lp-economics-tab';
import { PortfolioReturnsTab } from '@/components/results/portfolio-returns-tab';
import { InvestmentJourneyVisualization } from '@/components/results/investment-journey-visualization';
import { MonteCarloResults } from '@/components/results/MonteCarloResults';
import { EfficientFrontierChart } from '@/components/results/EfficientFrontierChart';
import { StressImpactHeatmap } from '@/components/results/StressImpactHeatmap';
import { BootstrapFanChart } from '@/components/results/BootstrapFanChart';
import { VintageVarAreaChart } from '@/components/results/VintageVarAreaChart';
import { MetricCard } from '@/components/ui/metric-card';
import { useStructuredLogger } from '@/providers/structured-logger-provider';
import { formatCurrency, formatPercentage, formatMultiple, formatDecimal, formatNumber } from '@/lib/formatters';

// Import portfolio components
import {
  PortfolioOverview,
  PortfolioEvolution,
  LoanDistribution,
  LoanPerformance,
  CashFlowAnalysis,
  RiskReturnAnalysis,
  LoanExplorer,
  ConfigurationAnalysis,
  PortfolioHealthScore
} from '@/components/portfolio';

import { LoanDistributionCard } from '@/components/results/investment-journey/loan-distribution-card';
import { TimelineEventCard } from '@/components/results/investment-journey/timeline-event-card';
import { FundAggregationSummary } from '@/components/results/fund-aggregation-summary';
import { TrancheDetailsTable } from '@/components/results/tranche-details-table';

export function Results() {
  const { simulationId } = useParams<{ simulationId: string }>();
  const navigate = useNavigate();
  const { simulation, isLoading: isLoadingSimulation, error: simulationError, refetch: refetchSimulation } = useSimulation(simulationId || '');

  // State for time granularity
  const [timeGranularity, setTimeGranularity] = useState<'yearly' | 'monthly'>('yearly');

  // State for cumulative mode
  const [cumulativeMode, setCumulativeMode] = useState(true);

  // State for active tab
  const [activeTab, setActiveTab] = useState('lp-economics');

  // State for debug info
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Advanced visualization settings
  const [chartColorScheme, setChartColorScheme] = useState('default');
  const [showAnnotations, setShowAnnotations] = useState(true);

  // Get the structured logger
  const { showConsole, logSimulationEvent } = useStructuredLogger();

  // Fetch simulation results with the selected time granularity
  const {
    results,
    visualizationData,
    isLoading: isLoadingResults,
    error: resultsError,
    refetch: refetchResults
  } = useSimulationResults(simulationId || '', {
    timeGranularity,
    enabled: !!simulation && simulation.status === 'completed',
    includeVisualization: true
  });

  // Combine loading states
  const isLoading = isLoadingSimulation || isLoadingResults;

  // Combine errors
  const error = simulationError || resultsError;

  // Combined refetch function
  const refetch = () => {
    refetchSimulation();
    refetchResults();
  };

  // Export results to JSON
  const handleExport = () => {
    if (!results) return;

    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `simulation-${simulationId}-${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Log backend data structure once
  useEffect(() => {
    if (results && !isLoading) {
      // Log key metrics using our structured logger
      logSimulationEvent(
        `Simulation results loaded successfully`,
        {
          metrics: {
            grossIrr: results?.metrics?.gross_irr || results?.metrics?.grossIrr,
            fundIrr: results?.metrics?.fund_irr || results?.metrics?.fundIrr,
            lpIrr: results?.metrics?.lp_irr || results?.metrics?.lpIrr,
            moic: results?.metrics?.moic || results?.metrics?.multiple,
            tvpi: results?.metrics?.tvpi || results?.metrics?.TVPI,
            dpi: results?.metrics?.dpi || results?.metrics?.DPI,
            rvpi: results?.metrics?.rvpi || results?.metrics?.RVPI
          },
          portfolio: {
            totalLoans: results?.portfolio?.total_loans || results?.portfolio?.totalLoans,
            activeLoans: results?.portfolio?.active_loans || results?.portfolio?.activeLoans,
            exitedLoans: results?.portfolio?.exited_loans || results?.portfolio?.exitedLoans
          },
          hasAdvancedFeatures: {
            monteCarloEnabled: !!results?.monte_carlo || !!results?.monteCarlo,
            optimizationEnabled: !!results?.optimization || !!results?.efficientFrontier,
            stressTestingEnabled: !!results?.stress_testing || !!results?.stressTesting
          }
        }
      );

      // Log IRR metrics specifically
      if (results?.metrics?.gross_irr || results?.metrics?.grossIrr) {
        const irrValue = (results?.metrics?.gross_irr || results?.metrics?.grossIrr) * 100;
        logSimulationEvent(
          `Gross IRR: ${irrValue.toFixed(2)}%`,
          { value: irrValue }
        );
      }

      if (results?.metrics?.fund_irr || results?.metrics?.fundIrr) {
        const irrValue = (results?.metrics?.fund_irr || results?.metrics?.fundIrr) * 100;
        logSimulationEvent(
          `Fund IRR: ${irrValue.toFixed(2)}%`,
          { value: irrValue }
        );
      }

      if (results?.metrics?.lp_irr || results?.metrics?.lpIrr) {
        const irrValue = (results?.metrics?.lp_irr || results?.metrics?.lpIrr) * 100;
        logSimulationEvent(
          `LP IRR: ${irrValue.toFixed(2)}%`,
          { value: irrValue }
        );
      }

      // Log missing data (only once per missing item)
      if (!results.metrics?.irr && !results.metrics?.fund_irr && !results.metrics?.fundIrr) {
        logSimulationEvent('Missing IRR data in simulation results');
      }

      if (!results.metrics?.moic && !results.metrics?.multiple) {
        logSimulationEvent('Missing equity multiple data in simulation results');
      }

      if (!results.cash_flows && !results.cashFlows) {
        logSimulationEvent('Missing cash flow data in simulation results');
      }

      // Log GP metrics data
      if (!results.gp_metrics && !results.gp_economics && !results.waterfall_results?.gp_economics) {
        logSimulationEvent('Missing GP metrics data in simulation results');
      } else {
        logSimulationEvent(
          'GP metrics data found in simulation results',
          {
            hasGpMetrics: !!results.gp_metrics,
            hasGpEconomics: !!results.gp_economics,
            hasWaterfallResults: !!results.waterfall_results?.gp_economics
          }
        );
      }
    }
  }, [results, isLoading, simulationId, logSimulationEvent]);

  // Add this console.log to help debug
  useEffect(() => {
    console.log('Current active tab:', activeTab);
    console.log('Available components:', {
      InvestmentJourneyVisualization: typeof InvestmentJourneyVisualization,
      LoanDistributionCard: typeof LoanDistributionCard,
      TimelineEventCard: typeof TimelineEventCard,
    });
  }, [activeTab]);

  if (isLoading) {
    return <Loading text="Loading simulation results..." className="h-[400px]" />;
  }

  if (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : 'An unknown error occurred';

    return (
      <Error
        title="Failed to load simulation results"
        message={errorMessage}
        onRetry={refetch}
        className="h-[400px]"
      />
    );
  }

  if (!simulation) {
    return (
      <Error
        title="Simulation not found"
        message={`No simulation found with ID: ${simulationId}`}
        className="h-[400px]"
      />
    );
  }

  return (
    <div className="space-y-6 w-full max-w-none">
      {/* Header with navigation and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {simulation.name || `Simulation ${simulation.simulationId || simulation.simulation_id}`}
            </h1>
            <p className="text-muted-foreground">
              {simulation?.config?.fund_size && `${formatCurrency(simulation.config.fund_size)} fund over ${simulation.config.fund_term || 10} years`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Add Journey tab quick access button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('journey')}
            className="bg-purple-100 border-purple-300"
          >
            <Calendar className="h-4 w-4 mr-2" />
            View Journey
          </Button>

          <Badge variant={simulation.status === 'completed' ? 'default' : 'secondary'}>
            {simulation.status ? simulation.status.charAt(0).toUpperCase() + simulation.status.slice(1) : 'Unknown'}
          </Badge>

          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading || !results}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button variant="outline" size="sm" onClick={showConsole}>
            <Terminal className="h-4 w-4 mr-2" />
            Console
          </Button>

          <Button variant="outline" size="sm" onClick={() => setShowDebugInfo(!showDebugInfo)}>
            <Info className="h-4 w-4 mr-2" />
            {showDebugInfo ? 'Hide Debug' : 'Show Debug'}
          </Button>
        </div>
      </div>

      {results?.aggregated && (
        <FundAggregationSummary aggregated={results.aggregated} isLoading={isLoading} />
      )}

      {results?.aggregated?.tranches &&
        Object.keys(results.aggregated.tranches).length > 0 && (
          <TrancheDetailsTable tranches={results.aggregated.tranches} isLoading={isLoading} />
        )}

      {/* Main tabs */}
      <div className="flex justify-between items-center mb-4">
        {/* Controls for time granularity and cumulative mode */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Cumulative</span>
            <ToggleGroup
              type="single"
              value={cumulativeMode ? "true" : "false"}
              onValueChange={(value) => {
                if (value) setCumulativeMode(value === "true");
              }}
              className="border rounded-md"
            >
              <ToggleGroupItem value="true" aria-label="Cumulative view">
                Yes
              </ToggleGroupItem>
              <ToggleGroupItem value="false" aria-label="Periodic view">
                No
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Time Granularity</span>
            <ToggleGroup
              type="single"
              value={timeGranularity}
              onValueChange={(value) => {
                if (value) setTimeGranularity(value as 'yearly' | 'monthly');
              }}
              className="border rounded-md"
            >
              <ToggleGroupItem value="yearly" aria-label="Yearly view">
                Yearly
              </ToggleGroupItem>
              <ToggleGroupItem value="monthly" aria-label="Monthly view">
                Monthly
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <Tabs defaultValue="lp-economics" value={activeTab} onValueChange={(value) => {
        console.log('Tab changed to:', value);
        setActiveTab(value);
      }}>
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="lp-economics">LP Economics</TabsTrigger>
          <TabsTrigger value="gp-economics">GP Economics</TabsTrigger>
          <TabsTrigger value="portfolio-returns">Portfolio & Returns</TabsTrigger>
          <TabsTrigger value="journey">Journey</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        {/* LP Economics Tab */}
        <TabsContent value="lp-economics">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : results ? (
          <LPEconomicsTab
            simulation={simulation}
            results={results}
            isLoading={isLoading}
              timeGranularity={timeGranularity}
              cumulativeMode={cumulativeMode}
              onExport={handleExport}
          />
          ) : (
            <div className="text-muted-foreground">No results data available for LP Economics.</div>
          )}
        </TabsContent>

        {/* GP Economics Tab */}
        <TabsContent value="gp-economics" className="p-6">
          <div className="text-muted-foreground">GP Economics dashboard coming soon.</div>
        </TabsContent>

        {/* Portfolio & Returns Tab */}
        <TabsContent value="portfolio-returns">
          <PortfolioReturnsTab
            simulation={simulation}
            results={results}
            isLoading={isLoading}
            timeGranularity={timeGranularity}
            cumulativeMode={cumulativeMode}
          />
        </TabsContent>

        {/* Journey Tab */}
        <TabsContent value="journey" className="p-6">
          <div className="text-muted-foreground">Journey dashboard coming soon.</div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-8 p-6">
          {simulationId && (
            <>
              <MonteCarloResults simulationId={simulationId} />
              <EfficientFrontierChart optimizationId={simulationId} />
              <StressImpactHeatmap simulationId={simulationId} />
              <BootstrapFanChart simulationId={simulationId} />
              <VintageVarAreaChart simulationId={simulationId} />
              <Card>
                <CardHeader>
                  <CardTitle>Visualization Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="color-scheme">Color Scheme</Label>
                    <Select value={chartColorScheme} onValueChange={setChartColorScheme}>
                      <SelectTrigger id="color-scheme" className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="warm">Warm</SelectItem>
                        <SelectItem value="cool">Cool</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="annotations" checked={showAnnotations} onCheckedChange={setShowAnnotations} />
                    <Label htmlFor="annotations">Show Annotations</Label>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Debug Info */}
      {showDebugInfo && (
        <>
          <BackendDataLogger
            data={results}
            title="Simulation Results"
            description="Complete data structure from the backend API"
          />
          {results?.gp_economics && (
            <BackendDataLogger
              data={results.gp_economics}
              title="GP Economics"
              description="GP Economics data structure"
            />
          )}
          {results?.gp_metrics && (
            <BackendDataLogger
              data={results.gp_metrics}
              title="GP Metrics"
              description="GP Metrics data structure"
            />
          )}
          {results?.waterfall_results && (
            <BackendDataLogger
              data={results.waterfall_results}
              title="Waterfall Results"
              description="Waterfall Results data structure"
            />
          )}
          {results?.sensitivity && (
            <BackendDataLogger
              data={results.sensitivity}
              title="Sensitivity Analysis"
              description="Sensitivity Analysis data structure"
            />
          )}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>GP Data Paths</CardTitle>
              <CardDescription>Available data paths for GP metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>GP IRR:</strong> {JSON.stringify({
                  "results?.gp_metrics?.irr": results?.gp_metrics?.irr,
                  "results?.gp_economics?.gp_irr": results?.gp_economics?.gp_irr,
                  "results?.waterfall_results?.gp_economics?.gp_irr": results?.waterfall_results?.gp_economics?.gp_irr
                })}</div>
                <div><strong>GP Multiple:</strong> {JSON.stringify({
                  "results?.gp_metrics?.multiple": results?.gp_metrics?.multiple,
                  "results?.gp_economics?.gp_multiple": results?.gp_economics?.gp_multiple,
                  "results?.waterfall_results?.gp_economics?.gp_multiple": results?.waterfall_results?.gp_economics?.gp_multiple
                })}</div>
                <div><strong>Management Fees:</strong> {JSON.stringify({
                  "results?.gp_metrics?.management_fees": results?.gp_metrics?.management_fees,
                  "results?.gp_economics?.total_management_fees": results?.gp_economics?.total_management_fees,
                  "results?.waterfall_results?.gp_economics?.management_fees_total": results?.waterfall_results?.gp_economics?.management_fees_total
                })}</div>
                <div><strong>Carried Interest:</strong> {JSON.stringify({
                  "results?.gp_metrics?.carried_interest": results?.gp_metrics?.carried_interest,
                  "results?.gp_economics?.total_carried_interest": results?.gp_economics?.total_carried_interest,
                  "results?.waterfall_results?.gp_economics?.carried_interest_total": results?.waterfall_results?.gp_economics?.carried_interest_total
                })}</div>
                <div><strong>GP Commitment:</strong> {JSON.stringify({
                  "results?.gp_metrics?.commitment": results?.gp_metrics?.commitment,
                  "results?.gp_economics?.gp_commitment": results?.gp_economics?.gp_commitment,
                  "results?.waterfall_results?.gp_economics?.gp_commitment": results?.waterfall_results?.gp_economics?.gp_commitment,
                  "simulation?.config?.gp_commitment_percentage": simulation?.config?.gp_commitment_percentage
                })}</div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Enhanced Headline Metrics */}
    </div>
  );
}
