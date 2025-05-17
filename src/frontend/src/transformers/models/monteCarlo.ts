/**
 * Model for Monte Carlo simulation data
 */
import { Nullable } from './common';

/**
 * Monte Carlo distribution point
 */
export interface MonteCarloDistributionPoint {
  value: number;
  frequency: number;
}

/**
 * Monte Carlo distribution statistics
 */
export interface MonteCarloStatistics {
  min: Nullable<number>;
  max: Nullable<number>;
  mean: Nullable<number>;
  median: Nullable<number>;
  std_dev: Nullable<number>;
  percentiles: {
    p10: Nullable<number>;
    p25: Nullable<number>;
    p50: Nullable<number>;
    p75: Nullable<number>;
    p90: Nullable<number>;
  };
}

/**
 * Monte Carlo distribution model
 */
export interface MonteCarloDistributionModel {
  labels: number[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
  statistics: MonteCarloStatistics;
}

/**
 * Monte Carlo sensitivity model
 */
export interface MonteCarloSensitivityModel {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

/**
 * Monte Carlo confidence interval model
 */
export interface MonteCarloConfidenceModel {
  mean: Nullable<number>;
  median: Nullable<number>;
  confidence_intervals: {
    p10_p90: [Nullable<number>, Nullable<number>];
    p25_p75: [Nullable<number>, Nullable<number>];
  };
}

/**
 * Union type for different Monte Carlo result types
 */
export type MonteCarloResult = 
  | { type: 'distribution'; data: MonteCarloDistributionModel }
  | { type: 'sensitivity'; data: MonteCarloSensitivityModel }
  | { type: 'confidence'; data: MonteCarloConfidenceModel }; 