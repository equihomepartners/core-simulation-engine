/**
 * Model for cashflow data
 */
import { TimeSeriesPoint, ChartDataset } from './common';

/**
 * Represents a single cashflow data point
 */
export interface CashflowPoint extends TimeSeriesPoint {
  capitalCalls: number;
  distributions: number;
  netCashflow: number;
  cumulative?: boolean;
}

/**
 * Chart-ready format for cashflow data
 */
export interface CashflowChartData {
  labels: (number | string)[];
  datasets: ChartDataset<number>[];
}

/**
 * Raw format for cashflow data (array of points)
 */
export interface CashflowPointsData {
  points: CashflowPoint[];
}

/**
 * Comprehensive cashflow model with multiple representations
 */
export interface CashflowModel {
  // Raw data points
  points: CashflowPoint[];
  
  // Chart-ready format
  chart: CashflowChartData;
  
  // Summary metrics
  summary: {
    totalCapitalCalls: number;
    totalDistributions: number;
    netCashflow: number;
    yearRange: [number, number];
  };
} 