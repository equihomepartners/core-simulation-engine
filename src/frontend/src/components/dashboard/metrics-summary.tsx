import React from 'react';
import { MetricsCard } from './metrics-card';
import { formatCurrency, formatPercentage, formatNumber } from '@/utils/format';
import { LogCategory, LogLevel, log } from '@/utils/logging';

interface MetricsSummaryProps {
  simulations: any[];
  className?: string;
  isLoading?: boolean;
}

export function MetricsSummary({ simulations, className, isLoading = false }: MetricsSummaryProps) {
  // Calculate metrics from simulations
  const completedSimulations = simulations.filter(
    (sim) => sim.status?.toLowerCase() === 'completed'
  );

  const runningSimulations = simulations.filter(
    (sim) => sim.status?.toLowerCase() === 'running'
  );

  // Total number of simulations
  const totalSimulations = simulations.length;

  // Average IRR across completed simulations
  const averageIrr = calculateAverageIrr(completedSimulations);

  // Average multiple across completed simulations
  const averageMultiple = calculateAverageMultiple(completedSimulations);

  // Total fund size across all simulations
  const totalFundSize = calculateTotalFundSize(simulations);

  // Number of completed simulations
  const completedCount = completedSimulations.length;

  // Number of running simulations
  const runningCount = runningSimulations.length;

  // Completion rate
  const completionRate = totalSimulations > 0 ? completedCount / totalSimulations : 0;

  // Get previous period metrics (this would normally come from historical data)
  // For demo purposes, we'll simulate previous values
  const previousTotalSimulations = Math.max(0, totalSimulations - Math.floor(totalSimulations * 0.2));
  const previousCompletedCount = Math.max(0, completedCount - Math.floor(completedCount * 0.15));
  const previousAverageIrr = averageIrr * 0.9; // 10% lower
  const previousAverageMultiple = averageMultiple * 0.95; // 5% lower
  const previousTotalFundSize = totalFundSize * 0.8; // 20% lower

  // Target values
  const targetIrr = 0.15; // 15% target IRR
  const targetMultiple = 2.0; // 2.0x target multiple
  const targetCompletionRate = 0.9; // 90% target completion rate

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricsCard
          title="Total Simulations"
          description="Total number of simulations created"
          value={totalSimulations}
          previousValue={previousTotalSimulations}
          formatter={formatNumber}
          isLoading={isLoading}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <MetricsCard
          title="Completed Simulations"
          description="Number of simulations that have finished"
          value={completedCount}
          previousValue={previousCompletedCount}
          formatter={formatNumber}
          isLoading={isLoading}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <MetricsCard
          title="Running Simulations"
          description="Number of simulations currently running"
          value={runningCount}
          formatter={formatNumber}
          isLoading={isLoading}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M12 2v4" />
              <path d="M12 18v4" />
              <path d="m4.93 4.93 2.83 2.83" />
              <path d="m16.24 16.24 2.83 2.83" />
              <path d="M2 12h4" />
              <path d="M18 12h4" />
              <path d="m4.93 19.07 2.83-2.83" />
              <path d="m16.24 7.76 2.83-2.83" />
            </svg>
          }
        />
        <MetricsCard
          title="Completion Rate"
          description="Percentage of simulations completed"
          value={completionRate}
          formatter={formatPercentage}
          isLoading={isLoading}
          target={targetCompletionRate}
          targetLabel="Target Rate"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M12 22V8" />
              <path d="m5 12 7-4 7 4" />
              <path d="M5 16l7-4 7 4" />
              <path d="M5 20l7-4 7 4" />
            </svg>
          }
        />
        <MetricsCard
          title="Average IRR"
          description="Average internal rate of return"
          value={averageIrr}
          previousValue={previousAverageIrr}
          formatter={formatPercentage}
          isLoading={isLoading}
          target={targetIrr}
          targetLabel="Target IRR"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M12 2v20" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <MetricsCard
          title="Average Multiple"
          description="Average investment multiple"
          value={averageMultiple}
          previousValue={previousAverageMultiple}
          formatter={(val) => `${val.toFixed(2)}x`}
          isLoading={isLoading}
          target={targetMultiple}
          targetLabel="Target Multiple"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m8 14 2.5-2.5" />
              <path d="m14 8 2.5-2.5" />
              <path d="m8 8-2.5-2.5" />
              <path d="m14 14 2.5 2.5" />
            </svg>
          }
        />
        <MetricsCard
          title="Total Fund Size"
          description="Sum of all fund sizes"
          value={totalFundSize}
          previousValue={previousTotalFundSize}
          formatter={formatCurrency}
          isLoading={isLoading}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z" />
              <path d="M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z" />
              <path d="M7 14c3.22-2.91 4.29-8.75 5-12 1.66 2.38 4.94 9 5 12" />
              <path d="M22 9c-4.29 0-7.14-2.33-10-7 5.71 0 10 4.67 10 7Z" />
            </svg>
          }
        />
      </div>
    </div>
  );
}

// Helper functions to calculate metrics

function calculateAverageIrr(simulations: any[]): number {
  if (simulations.length === 0) return 0;

  let totalIrr = 0;
  let count = 0;

  simulations.forEach((sim) => {
    const irr = sim.metrics?.irr;
    if (typeof irr === 'number' && !isNaN(irr)) {
      totalIrr += irr;
      count++;
    } else {
      log(LogLevel.WARN, LogCategory.METRICS, `Missing metric: IRR`);
    }
  });

  return count > 0 ? totalIrr / count : 0;
}

function calculateAverageMultiple(simulations: any[]): number {
  if (simulations.length === 0) return 0;

  let totalMultiple = 0;
  let count = 0;

  simulations.forEach((sim) => {
    const multiple = sim.metrics?.multiple;
    if (typeof multiple === 'number' && !isNaN(multiple)) {
      totalMultiple += multiple;
      count++;
    } else {
      log(LogLevel.WARN, LogCategory.METRICS, `Missing metric: Multiple`);
    }
  });

  return count > 0 ? totalMultiple / count : 0;
}

function calculateTotalFundSize(simulations: any[]): number {
  let totalFundSize = 0;

  simulations.forEach((sim) => {
    const fundSize = sim.config?.fund_size;
    if (typeof fundSize === 'number' && !isNaN(fundSize)) {
      totalFundSize += fundSize;
    } else {
      log(LogLevel.WARN, LogCategory.METRICS, `Missing metric: Fund Size`);
    }
  });

  return totalFundSize;
}
