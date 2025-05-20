import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatPercentage, formatMultiple, formatCurrency, formatNumber } from '@/utils/format';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface RiskVarianceProps {
  simulation: any;
  results: any;
  isLoading: boolean;
}

export function RiskVariance({
  simulation,
  results,
  isLoading
}: RiskVarianceProps) {
  const [scenarioType, setScenarioType] = useState<'base' | 'rate_increase' | 'price_dip' | 'double_default'>('base');

  // Extract Monte Carlo IRR distribution data
  const monteCarloData = React.useMemo(() => {
    if (!results || isLoading) return [];

    // Try to get from monte_carlo_results
    if (results.monte_carlo_results?.metrics?.irr) {
      const irrMetrics = results.monte_carlo_results.metrics.irr;

      // Create violin plot data
      const min = irrMetrics.min || 0;
      const max = irrMetrics.max || 0;
      const p10 = irrMetrics.percentiles?.p10 || min;
      const p25 = irrMetrics.percentiles?.p25 || 0;
      const p50 = irrMetrics.percentiles?.p50 || 0;
      const p75 = irrMetrics.percentiles?.p75 || 0;
      const p90 = irrMetrics.percentiles?.p90 || max;

      // Create a violin-like shape using area chart
      return [
        { x: 0, p10, p25, p50, p75, p90, min, max },
        { x: 1, p50, p50, p50, p50, p50, p50, p50 }, // Middle point
        { x: 2, p10, p25, p50, p75, p90, min, max }
      ];
    }

    return [];
  }, [results, isLoading]);

  // Extract risk metrics for guardrail badges
  const riskMetrics = React.useMemo(() => {
    if (!results || isLoading) return null;

    // Try to get from risk_metrics
    if (results.risk_metrics) {
      // Only include metrics that are actually available
      const metrics: any = {};

      if (results.risk_metrics.min_liquidity_buffer !== undefined) {
        metrics.liquidityBufferMin = results.risk_metrics.min_liquidity_buffer;
      }

      if (results.risk_metrics.var_99 !== undefined) {
        metrics.var99 = results.risk_metrics.var_99;
      } else if (results.risk_metrics.var_95 !== undefined) {
        metrics.var99 = results.risk_metrics.var_95; // Using VaR 95 as proxy if 99 not available
      }

      if (results.risk_metrics.max_exit_lag !== undefined) {
        metrics.exitLagWorst = results.risk_metrics.max_exit_lag;
      }

      if (results.risk_metrics.max_borrow_base_utilization !== undefined) {
        metrics.borrowBaseUtilization = results.risk_metrics.max_borrow_base_utilization;
      }

      // Only return if we have at least one metric
      if (Object.keys(metrics).length > 0) {
        return metrics;
      }
    }

    return null;
  }, [results, isLoading]);

  // Extract stress scenario data
  const stressScenarios = React.useMemo(() => {
    if (!results || isLoading) return null;

    // Try to get from stress_test_results
    if (results.stress_test_results) {
      const scenarios: any = {};

      // Only include base scenario if all required metrics are available
      if (results.metrics?.irr !== undefined &&
          results.metrics?.equity_multiple !== undefined &&
          results.metrics?.default_rate !== undefined) {
        scenarios.base = {
          irr: results.metrics.irr,
          multiple: results.metrics.equity_multiple,
          defaultRate: results.metrics.default_rate
        };
      } else {
        // If base metrics are not available, we can't show any scenarios
        return null;
      }

      // Only include rate_increase scenario if all required metrics are available
      if (results.stress_test_results.rate_increase?.irr !== undefined &&
          results.stress_test_results.rate_increase?.equity_multiple !== undefined &&
          results.stress_test_results.rate_increase?.default_rate !== undefined) {
        scenarios.rate_increase = {
          irr: results.stress_test_results.rate_increase.irr,
          multiple: results.stress_test_results.rate_increase.equity_multiple,
          defaultRate: results.stress_test_results.rate_increase.default_rate
        };
      }

      // Only include price_dip scenario if all required metrics are available
      if (results.stress_test_results.price_dip?.irr !== undefined &&
          results.stress_test_results.price_dip?.equity_multiple !== undefined &&
          results.stress_test_results.price_dip?.default_rate !== undefined) {
        scenarios.price_dip = {
          irr: results.stress_test_results.price_dip.irr,
          multiple: results.stress_test_results.price_dip.equity_multiple,
          defaultRate: results.stress_test_results.price_dip.default_rate
        };
      }

      // Only include double_default scenario if all required metrics are available
      if (results.stress_test_results.double_default?.irr !== undefined &&
          results.stress_test_results.double_default?.equity_multiple !== undefined &&
          results.stress_test_results.double_default?.default_rate !== undefined) {
        scenarios.double_default = {
          irr: results.stress_test_results.double_default.irr,
          multiple: results.stress_test_results.double_default.equity_multiple,
          defaultRate: results.stress_test_results.double_default.default_rate
        };
      }

      // Only return if we have at least the base scenario
      if (Object.keys(scenarios).length > 0) {
        return scenarios;
      }
    }

    // No synthetic scenarios - return null if real data is not available
    return null;
  }, [results, isLoading]);

  // Get current scenario data
  const currentScenario = React.useMemo(() => {
    if (!stressScenarios) return null;
    return stressScenarios[scenarioType];
  }, [stressScenarios, scenarioType]);

  return (
    <div className="space-y-8">
      {/* Inner Monte-Carlo Violin */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>IRR Distribution (Monte Carlo)</CardTitle>
          <CardDescription>Distribution of IRR outcomes from inner Monte Carlo simulation</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : monteCarloData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monteCarloData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={[0, 2]}
                  hide
                />
                <YAxis
                  tickFormatter={(value) => typeof value === 'number' ? formatPercentage(value) : '0%'}
                />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'p50') return [formatPercentage(value), 'Median (P50)'];
                    if (name === 'p10') return [formatPercentage(value), 'P10'];
                    if (name === 'p90') return [formatPercentage(value), 'P90'];
                    if (name === 'p25') return [formatPercentage(value), 'P25'];
                    if (name === 'p75') return [formatPercentage(value), 'P75'];
                    if (name === 'min') return [formatPercentage(value), 'Minimum'];
                    if (name === 'max') return [formatPercentage(value), 'Maximum'];
                    return [formatPercentage(value), name];
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="min"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  name="Min-P10"
                />
                <Area
                  type="monotone"
                  dataKey="p10"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  name="P10-P25"
                />
                <Area
                  type="monotone"
                  dataKey="p25"
                  stackId="1"
                  stroke="#4ade80"
                  fill="#4ade80"
                  name="P25-P50"
                />
                <Area
                  type="monotone"
                  dataKey="p50"
                  stackId="1"
                  stroke="#60a5fa"
                  fill="#60a5fa"
                  name="P50-P75"
                />
                <Area
                  type="monotone"
                  dataKey="p75"
                  stackId="1"
                  stroke="#4ade80"
                  fill="#4ade80"
                  name="P75-P90"
                />
                <Area
                  type="monotone"
                  dataKey="p90"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  name="P90-Max"
                />
                <Area
                  type="monotone"
                  dataKey="max"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  name="Max"
                />
                <ReferenceLine
                  y={results.monte_carlo_results?.metrics?.irr?.median || 0}
                  stroke="#0ea5e9"
                  strokeDasharray="3 3"
                  label={{ value: 'Median', position: 'right', fill: '#0ea5e9' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No Monte Carlo data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guardrail Badge Bar */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Risk Guardrails</CardTitle>
          <CardDescription>Key risk metrics against guardrail thresholds</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-[100px]" />
          ) : riskMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Liquidity Buffer Min */}
              <div className="flex items-center p-4 border rounded-lg">
                <div className="mr-4">
                  {riskMetrics.liquidityBufferMin >= 0.04 ? (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Liquidity Buffer Min</p>
                  <p className="text-xl font-bold">{formatPercentage(riskMetrics.liquidityBufferMin)}</p>
                  <p className="text-xs text-muted-foreground">Target: ≥ 4%</p>
                </div>
              </div>

              {/* VaR 99% */}
              <div className="flex items-center p-4 border rounded-lg">
                <div className="mr-4">
                  {riskMetrics.var99 <= 0.1 ? (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-amber-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">VaR 99%</p>
                  <p className="text-xl font-bold">{formatPercentage(riskMetrics.var99)}</p>
                  <p className="text-xs text-muted-foreground">Target: ≤ 10%</p>
                </div>
              </div>

              {/* Exit-Lag Worst */}
              <div className="flex items-center p-4 border rounded-lg">
                <div className="mr-4">
                  {riskMetrics.exitLagWorst <= 12 ? (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Exit-Lag Worst</p>
                  <p className="text-xl font-bold">{riskMetrics.exitLagWorst} months</p>
                  <p className="text-xs text-muted-foreground">Target: ≤ 12 months</p>
                </div>
              </div>

              {/* Borrow-base Utilization Peak */}
              <div className="flex items-center p-4 border rounded-lg">
                <div className="mr-4">
                  {riskMetrics.borrowBaseUtilization <= 0.5 ? (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-amber-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Borrow-base Utilization Peak</p>
                  <p className="text-xl font-bold">{formatPercentage(riskMetrics.borrowBaseUtilization)}</p>
                  <p className="text-xs text-muted-foreground">Target: ≤ 50% of NAV</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[100px]">
              <p className="text-muted-foreground">No risk metrics available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stress-Scenario Switcher */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Stress Scenario Analysis</CardTitle>
              <CardDescription>Impact of stress scenarios on key metrics</CardDescription>
            </div>
            {stressScenarios && (
              <Tabs
                value={scenarioType}
                onValueChange={(value) => {
                  // Only allow switching to scenarios that exist
                  if (stressScenarios[value]) {
                    setScenarioType(value as any);
                  }
                }}
                className="w-[400px]"
              >
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Object.keys(stressScenarios).length}, 1fr)` }}>
                  {stressScenarios.base && <TabsTrigger value="base">Base Case</TabsTrigger>}
                  {stressScenarios.rate_increase && <TabsTrigger value="rate_increase">Rate +200bp</TabsTrigger>}
                  {stressScenarios.price_dip && <TabsTrigger value="price_dip">10% Price Dip</TabsTrigger>}
                  {stressScenarios.double_default && <TabsTrigger value="double_default">Double Default</TabsTrigger>}
                </TabsList>
              </Tabs>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-[200px]" />
          ) : currentScenario ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* IRR */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">IRR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatPercentage(currentScenario.irr)}
                  </div>
                  {scenarioType !== 'base' && (
                    <Badge variant={currentScenario.irr < stressScenarios.base.irr ? "destructive" : "success"} className="mt-2">
                      {formatPercentage(currentScenario.irr - stressScenarios.base.irr, { signDisplay: 'always' })}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Multiple */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Equity Multiple</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatMultiple(currentScenario.multiple)}
                  </div>
                  {scenarioType !== 'base' && (
                    <Badge variant={currentScenario.multiple < stressScenarios.base.multiple ? "destructive" : "success"} className="mt-2">
                      {formatMultiple(currentScenario.multiple - stressScenarios.base.multiple, { signDisplay: 'always' })}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Default Rate */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Default Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatPercentage(currentScenario.defaultRate)}
                  </div>
                  {scenarioType !== 'base' && (
                    <Badge variant={currentScenario.defaultRate > stressScenarios.base.defaultRate ? "destructive" : "success"} className="mt-2">
                      {formatPercentage(currentScenario.defaultRate - stressScenarios.base.defaultRate, { signDisplay: 'always' })}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-muted-foreground">No stress scenario data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
