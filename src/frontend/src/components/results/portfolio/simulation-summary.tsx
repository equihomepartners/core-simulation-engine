import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatPercentage, formatMultiple, formatCurrency, formatNumber } from '@/utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ReinvestmentBreakdown } from './reinvestment-breakdown';

interface SimulationSummaryProps {
  simulation: any;
  results: any;
  isLoading: boolean;
}

export function SimulationSummary({
  simulation,
  results,
  isLoading
}: SimulationSummaryProps) {
  // Extract key metrics from results
  const totalLoans = React.useMemo(() => {
    if (!results || isLoading) return null;

    // Try to get from portfolio_snapshot first
    if (results.portfolio_snapshot?.total_loans !== undefined) {
      return results.portfolio_snapshot.total_loans;
    }

    // Try to calculate from portfolio evolution
    if (results.portfolio_evolution) {
      // Get the last year (highest key) in the portfolio evolution
      const years = Object.keys(results.portfolio_evolution).map(Number).sort((a, b) => a - b);
      const lastYear = years[years.length - 1];

      // Get active loans from the last year
      const activeLoans = results.portfolio_evolution[lastYear]?.active_loans || 0;

      // Sum up all exited loans across all years
      let exitedLoans = 0;
      for (const year of years) {
        exitedLoans += results.portfolio_evolution[year]?.exited_loans || 0;
      }

      // Calculate total loans
      return activeLoans + exitedLoans;
    }

    // Try to get from cohorts data
    if (results.cohorts) {
      let totalLoans = 0;
      for (const cohortYear in results.cohorts) {
        totalLoans += results.cohorts[cohortYear].loans || 0;
      }
      return totalLoans;
    }

    return null;
  }, [results, isLoading]);

  const grossCapitalDeployed = React.useMemo(() => {
    if (!results || isLoading) return null;

    // Try to get from metrics
    if (results.metrics?.total_deployed !== undefined) {
      return results.metrics.total_deployed;
    }

    // Try to get from fund size
    if (simulation?.parameters?.fund_size) {
      return simulation.parameters.fund_size;
    }

    return null;
  }, [results, simulation, isLoading]);

  const aggregateIRR = React.useMemo(() => {
    if (!results || isLoading) return null;

    // Try to get from metrics
    if (results.metrics?.irr !== undefined) {
      return results.metrics.irr;
    }

    // Try to get from monte_carlo_results
    if (results.monte_carlo_results?.metrics?.irr?.median !== undefined) {
      return results.monte_carlo_results.metrics.irr.median;
    }

    return null;
  }, [results, isLoading]);

  const tvpi = React.useMemo(() => {
    if (!results || isLoading) return null;

    // Try to get from metrics
    if (results.metrics?.tvpi !== undefined) {
      return results.metrics.tvpi;
    }

    return null;
  }, [results, isLoading]);

  const moic = React.useMemo(() => {
    if (!results || isLoading) return null;

    // Try to get from metrics
    if (results.metrics?.equity_multiple !== undefined) {
      return results.metrics.equity_multiple;
    }

    return null;
  }, [results, isLoading]);

  const peakNAVYear = React.useMemo(() => {
    if (!results || isLoading) return null;

    // Try to calculate from portfolio evolution
    if (results.portfolio_evolution?.total_value && results.portfolio_evolution?.years) {
      const totalValues = results.portfolio_evolution.total_value;
      const years = results.portfolio_evolution.years;

      if (Array.isArray(totalValues) && Array.isArray(years) && totalValues.length === years.length) {
        let maxValue = -Infinity;
        let maxYear = null;

        for (let i = 0; i < totalValues.length; i++) {
          if (totalValues[i] > maxValue) {
            maxValue = totalValues[i];
            maxYear = years[i];
          }
        }

        return maxYear;
      }
    }

    return null;
  }, [results, isLoading]);

  // Prepare lifecycle timeline data
  const lifecycleData = React.useMemo(() => {
    if (!results || isLoading) return [];

    const fundTerm = simulation?.parameters?.fund_term || 10;
    const deploymentPeriod = simulation?.parameters?.deployment_period || 2;
    const reinvestmentPeriod = simulation?.parameters?.reinvestment_period || 5;

    // Calculate phase durations in months
    const originationMonths = deploymentPeriod * 12;
    const rampMonths = (reinvestmentPeriod - deploymentPeriod) * 12;
    const harvestMonths = ((fundTerm - reinvestmentPeriod) * 12) * 0.7; // 70% of remaining time
    const windUpMonths = ((fundTerm - reinvestmentPeriod) * 12) * 0.3; // 30% of remaining time

    return [
      { name: 'Origination', months: originationMonths, fill: '#4ade80' },
      { name: 'Ramp', months: rampMonths, fill: '#60a5fa' },
      { name: 'Harvest', months: harvestMonths, fill: '#f59e0b' },
      { name: 'Wind-Up', months: windUpMonths, fill: '#ef4444' }
    ];
  }, [results, simulation, isLoading]);

  // Prepare loan cohort funnel data
  const loanCohortData = React.useMemo(() => {
    if (!results || isLoading) return [];

    // Calculate total loans created
    const totalLoansCreated = totalLoans || 0;

    // Calculate total exited loans by summing up from each year
    let exitedInTerm = 0;
    if (results.portfolio_evolution) {
      // Get the last year (highest key) in the portfolio evolution
      const years = Object.keys(results.portfolio_evolution).map(Number).sort((a, b) => a - b);
      const lastYear = years[years.length - 1];

      // Sum up all exited loans across all years
      for (const year of years) {
        exitedInTerm += results.portfolio_evolution[year]?.exited_loans || 0;
      }

      // Alternative: Just use the last year's cumulative value
      // exitedInTerm = results.portfolio_evolution[lastYear]?.exited_loans || 0;
    }

    const hitMaturity = totalLoansCreated - exitedInTerm;

    // Log the data for debugging
    console.log('Loan Cohort Data:', { totalLoansCreated, exitedInTerm, hitMaturity });

    return [
      { name: 'Created', value: totalLoansCreated, fill: '#4ade80' },
      { name: 'Exited In-Term', value: exitedInTerm, fill: '#60a5fa' },
      { name: 'Hit Maturity', value: hitMaturity, fill: '#f59e0b' }
    ];
  }, [results, totalLoans, isLoading]);

  return (
    <div className="space-y-8">
      {/* Headline KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Simulated Loans */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Simulated Loans</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {totalLoans !== null ? formatNumber(totalLoans) : 'N/A'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gross Capital Deployed */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gross Capital Deployed</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {grossCapitalDeployed !== null ? formatCurrency(grossCapitalDeployed) : 'N/A'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aggregate IRR (P50) */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aggregate IRR (P50)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {aggregateIRR !== null ? formatPercentage(aggregateIRR) : 'N/A'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* TVPI */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TVPI</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {tvpi !== null ? formatMultiple(tvpi) : 'N/A'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* MOIC */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">MOIC</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {moic !== null ? formatMultiple(moic) : 'N/A'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Peak NAV Year */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Peak NAV Year</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {peakNAVYear !== null ? `Y${peakNAVYear}` : 'N/A'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Life-cycle Timeline Bar */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Life-cycle Timeline</CardTitle>
          <CardDescription>Fund lifecycle phases sized by months</CardDescription>
        </CardHeader>
        <CardContent className="h-[150px]">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={lifecycleData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barSize={40}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 'dataMax']} tickFormatter={(value) => `${value} mo`} />
                <YAxis type="category" dataKey="name" />
                <Tooltip
                  formatter={(value: any) => [`${value} months`, 'Duration']}
                  labelFormatter={(label) => `${label} Phase`}
                />
                <Bar dataKey="months" fill="#8884d8">
                  {lifecycleData.map((entry, index) => (
                    <Bar key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Loan Cohort Funnel */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Loan Cohort Funnel</CardTitle>
          <CardDescription>Loan lifecycle outcomes</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px]">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={loanCohortData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barSize={60}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => [formatNumber(value), 'Loans']}
                />
                <Bar dataKey="value" fill="#8884d8">
                  {loanCohortData.map((entry, index) => (
                    <Bar key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Reinvestment Breakdown */}
      <ReinvestmentBreakdown results={results} isLoading={isLoading} />
    </div>
  );
}
