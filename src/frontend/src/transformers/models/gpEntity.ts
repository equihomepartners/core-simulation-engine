/**
 * Model for GP Entity data
 */
import { Nullable, TimeSeriesPoint, ChartDataset } from './common';

/**
 * GP Entity revenue source
 */
export interface RevenueSource {
  source: string;
  amount: number;
  percentage: number;
  color?: string;
}

/**
 * GP Entity expense
 */
export interface Expense {
  category: string;
  amount: number;
  percentage: number;
  color?: string;
}

/**
 * GP Entity team allocation
 */
export interface TeamAllocation {
  role: string;
  headcount: number;
  cost: number;
  percentage: number;
  color?: string;
}

/**
 * GP Entity cashflow point
 */
export interface GPEntityCashflowPoint extends TimeSeriesPoint {
  revenue: number;
  expenses: number;
  profit: number;
  cumulative?: boolean;
}

/**
 * GP Entity metrics
 */
export interface GPEntityMetrics {
  totalRevenue: Nullable<number>;
  totalExpenses: Nullable<number>;
  totalProfit: Nullable<number>;
  profitMargin: Nullable<number>;
  revenueCAGR: Nullable<number>;
  averageHeadcount: Nullable<number>;
  averageExpensePerEmployee: Nullable<number>;
}

/**
 * GP Entity pie chart data
 */
export interface GPEntityPieChartData {
  labels: string[];
  values: number[];
  colors?: string[];
}

/**
 * GP Entity line chart data
 */
export interface GPEntityLineChartData {
  labels: (number | string)[];
  datasets: ChartDataset<number>[];
}

/**
 * Combined GP Entity data model
 */
export interface GPEntityModel {
  metrics: GPEntityMetrics;
  revenueSources: RevenueSource[];
  expenses: Expense[];
  teamAllocation: TeamAllocation[];
  cashflows: GPEntityCashflowPoint[];
  charts: {
    revenueSourcesChart: GPEntityPieChartData;
    expenseBreakdownChart: GPEntityPieChartData;
    teamAllocationChart: GPEntityPieChartData;
    cashflowChart: GPEntityLineChartData;
    yearlyRevenueChart: GPEntityLineChartData;
    yearlyDistributionsChart: GPEntityLineChartData;
  };
} 