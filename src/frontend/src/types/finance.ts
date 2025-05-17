// Basic finance types
export type TimeGranularity = 'yearly' | 'quarterly' | 'monthly';
export type InvestmentLevel = 'lp' | 'gp' | 'fund' | 'investment';

// Fund metrics types
export interface FundMetrics {
  // IRR metrics
  gross_irr?: number;
  fund_irr?: number;
  lp_irr?: number;
  
  // Multiple metrics
  gross_multiple?: number;
  fund_multiple?: number;
  lp_multiple?: number;
  
  // Distribution metrics
  dpi?: number;
  rvpi?: number;
  tvpi?: number;
  
  // Cash flow metrics
  total_capital_calls?: number;
  total_distributions?: number;
  net_cash_flow?: number;
  current_nav?: number;
  
  // Fee metrics
  management_fees?: number;
  carried_interest?: number;
}

// Simple chart data interface
export interface ChartDataPoint {
  period: string | number;
  value: number;
  label?: string;
  category?: string;
}

export interface PerformanceMetrics {
  dpi?: number;
  tvpi?: number;
  rvpi?: number;
  irr?: number;
  gross_irr?: number;
  grossIRR?: number;
  fund_irr?: number;
  fundIRR?: number;
  lp_irr?: number;
  lpIRR?: number;
  management_fee_impact?: number;
  carried_interest_impact?: number;
  fee_impact?: number;
  feeImpact?: number;
  total_capital_called?: number;
  totalCapitalCalls?: number;
  total_distributions?: number;
  totalDistributions?: number;
  current_nav?: number;
  currentNAV?: number;
  net_cash_flow?: number;
  netCashFlow?: number;
  management_fees?: number;
  managementFees?: number;
  carried_interest?: number;
  carriedInterest?: number;
} 