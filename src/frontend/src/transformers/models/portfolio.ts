/**
 * Model for portfolio data
 */
import { ZoneAllocation, Nullable, TimeSeriesPoint, ChartDataset } from './common';

/**
 * Represents a portfolio composition point in time
 */
export interface PortfolioCompositionPoint extends TimeSeriesPoint {
  zoneAllocation: ZoneAllocation;
  activeLoans: number;
  newLoans: number;
  exitedLoans: number;
  defaultedLoans: number;
  totalLoanValue: number;
}

/**
 * Represents portfolio composition summary
 */
export interface PortfolioSummary {
  zoneAllocation: ZoneAllocation;
  totalActiveLoans: Nullable<number>;
  totalValue: Nullable<number>;
  avgLoanSize: Nullable<number>;
  defaultRate: Nullable<number>;
}

/**
 * Chart-ready format for portfolio composition data
 */
export interface PortfolioChartData {
  labels: string[];
  datasets: ChartDataset<number>[];
  colors: string[];
}

/**
 * Comprehensive portfolio model
 */
export interface PortfolioModel {
  // Summary of current portfolio state
  summary: PortfolioSummary;
  
  // Chart-ready format for pie/donut charts
  chart: PortfolioChartData;
  
  // Historical portfolio composition (if available)
  history?: PortfolioCompositionPoint[];
  
  // Zone performance metrics
  zonePerformance?: {
    green: {
      irr: Nullable<number>;
      multiple: Nullable<number>;
      defaultRate: Nullable<number>;
    };
    orange: {
      irr: Nullable<number>;
      multiple: Nullable<number>;
      defaultRate: Nullable<number>;
    };
    red: {
      irr: Nullable<number>;
      multiple: Nullable<number>;
      defaultRate: Nullable<number>;
    };
  };
} 