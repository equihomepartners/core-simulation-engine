/**
 * Common type definitions shared across the transformation layer
 */

/**
 * Represents a value that can be null
 */
export type Nullable<T> = T | null;

/**
 * Represents a time series data point
 */
export interface TimeSeriesPoint {
  year: number;
  quarter?: number;
  month?: number;
}

/**
 * Represents a dataset for a chart
 */
export interface ChartDataset<T> {
  label: string;
  data: T[];
  color?: string;
}

/**
 * Represents zone types
 */
export type ZoneType = 'green' | 'orange' | 'red';

/**
 * Represents zone allocation percentages
 */
export interface ZoneAllocation {
  green: number;
  orange: number;
  red: number;
}

/**
 * Represents a fund parameter
 */
export interface FundParameter {
  name: string;
  value: any;
  description?: string;
}

/**
 * Common options for transformations
 */
export interface TransformOptions {
  cumulative?: boolean;
  timeGranularity?: 'yearly' | 'quarterly' | 'monthly';
  yearRange?: [number, number];
}

/**
 * Base response format for visualizations
 */
export interface BaseVisualizationResponse {
  [key: string]: any;
} 