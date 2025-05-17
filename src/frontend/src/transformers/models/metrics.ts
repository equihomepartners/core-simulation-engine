/**
 * Model for metrics data
 */
import { Nullable } from './common';

/**
 * Standardized metrics model
 */
export interface MetricsModel {
  // Return metrics
  irr: Nullable<number>;
  multiple: Nullable<number>;
  roi: Nullable<number>;
  tvpi: Nullable<number>;
  dpi: Nullable<number>;
  rvpi: Nullable<number>;
  moic: Nullable<number>;
  
  // Risk metrics
  defaultRate: Nullable<number>;
  volatility: Nullable<number>;
  sharpeRatio: Nullable<number>;
  sortinoRatio: Nullable<number>;
  maxDrawdown: Nullable<number>;
  
  // Fund info
  fundSize: Nullable<number>;
  fundTerm: Nullable<number>;
  
  // Timing metrics
  paybackPeriod: Nullable<number>;
  avgExitYear: Nullable<number>;

  // Cashflow totals
  distributionsTotal: Nullable<number>;
  capitalCallsTotal: Nullable<number>;

  // Additional metrics can be added here as needed
} 