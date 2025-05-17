/**
 * Simulation results interface that matches the actual API response structure
 */
export interface SimulationResults {
  // Metadata
  id: string;
  name?: string;
  status: 'created' | 'running' | 'completed' | 'failed';
  progress?: number;
  current_step?: string;
  created_at?: number;
  updated_at?: number;
  description?: string;

  // Configuration parameters
  parameters?: {
    fund_size?: number;
    fund_term?: number;
    gp_commitment_percentage?: number;
    hurdle_rate?: number;
    carried_interest_rate?: number;
    waterfall_structure?: string;
    management_fees?: number;
    zone_allocations?: {
      green?: number;
      orange?: number;
      red?: number;
      [key: string]: number | undefined;
    };
    [key: string]: any;
  };

  // Core metrics
  metrics?: {
    irr?: number;
    equity_multiple?: number;
    roi?: number;
    dpi?: number;
    tvpi?: number;
    payback_period?: number;
    default_rate?: number;
    avg_exit_year?: number;
    [key: string]: any;
  };

  // Waterfall distribution
  waterfall?: {
    total_contributions?: number;
    preferred_return?: number;
    catch_up?: number;
    carried_interest?: number;
    lp_distributions?: number;
    gp_distributions?: number;
    total_distributions?: number;
    [key: string]: any;
  };

  // Cash flows
  cash_flows?: {
    years?: number[];
    capital_called?: number[];
    distributions?: number[];
    net_cash_flow?: number[];
    cumulative_capital_called?: number[];
    cumulative_distributions?: number[];
    cumulative_net_cash_flow?: number[];
    [key: string]: any;
  };

  // Portfolio evolution
  portfolio_evolution?: {
    years?: number[];
    active_loans?: number[];
    new_loans?: number[];
    exited_loans?: number[];
    exited_loans_original?: number[];
    exited_loans_reinvest?: number[];
    defaulted_loans?: number[];
    reinvestments?: number[];
    reinvested_amount?: number[];
    [key: string]: any;
  };

  // Risk metrics
  risk_metrics?: {
    volatility?: number;
    sharpe_ratio?: number;
    sortino_ratio?: number;
    max_drawdown?: number;
    var_95?: number;
    cvar_95?: number;
    [key: string]: any;
  };

  // Monte Carlo results
  monte_carlo_results?: {
    metrics?: {
      irr?: {
        mean: number;
        median: number;
        std_dev: number;
        min: number;
        max: number;
        percentiles: {
          p10: number;
          p25: number;
          p50: number;
          p75: number;
          p90: number;
        };
      };
      equity_multiple?: {
        mean: number;
        median: number;
        std_dev: number;
        min: number;
        max: number;
        percentiles: {
          p10: number;
          p25: number;
          p50: number;
          p75: number;
          p90: number;
        };
      };
      [key: string]: any;
    };
    simulations?: Array<{
      id: number;
      irr: number;
      equity_multiple: number;
      roi: number;
      [key: string]: any;
    }>;
    [key: string]: any;
  };

  // GP entity
  gp_entity?: {
    revenue?: {
      management_fees?: number[];
      carried_interest?: number[];
      origination_fees?: number[];
      other_revenue?: number[];
      total?: number[];
      [key: string]: any;
    };
    expenses?: {
      staff?: number[];
      office?: number[];
      technology?: number[];
      marketing?: number[];
      legal?: number[];
      other?: number[];
      total?: number[];
      [key: string]: any;
    };
    net_income?: number[];
    cash_reserve?: number[];
    dividends?: number[];
    years?: number[];
    [key: string]: any;
  };

  // Snapshot data for visualization during loading
  portfolio_snapshot?: {
    total_loans?: number;
    active_loans?: number;
    zone_distribution?: {
      green?: number;
      orange?: number;
      red?: number;
      [key: string]: number | undefined;
    };
    loan_sizes?: {
      min?: number;
      max?: number;
      avg?: number;
    };
  };

  metrics_snapshot?: {
    irr?: number;
    equity_multiple?: number;
    roi?: number;
    dpi?: number;
    tvpi?: number;
    payback_period?: number;
  };

  waterfall_snapshot?: {
    total_contributions?: number;
    preferred_return?: number;
    catch_up?: number;
    carried_interest?: number;
    lp_distributions?: number;
    gp_distributions?: number;
    total_distributions?: number;
  };

  // Flag for demo data
  isDemo?: boolean;

  // Any other properties
  [key: string]: any;
}

/**
 * Interface for portfolio evolution data
 */
export interface PortfolioEvolutionData {
  years?: number[];
  new_loans?: number[];
  exited_loans?: number[];
  exited_loans_original?: number[];
  exited_loans_reinvest?: number[];
  defaulted_loans?: number[];
  active_loans?: number[];
  reinvestments?: number[];
  reinvested_amount?: number[];
  isFallback?: boolean;
  [key: string]: any;
}

/**
 * Interface for cash flow data
 */
export interface CashFlowData {
  years?: number[];
  capital_called?: number[];
  distributions?: number[];
  net_cash_flow?: number[];
  cumulative_capital_called?: number[];
  cumulative_distributions?: number[];
  cumulative_net_cash_flow?: number[];
  lp_capital_called?: number[];
  lp_distributions?: number[];
  lp_net_cash_flow?: number[];
  lp_cumulative_capital_called?: number[];
  lp_cumulative_distributions?: number[];
  lp_cumulative_net_cash_flow?: number[];
  gp_capital_called?: number[];
  gp_distributions?: number[];
  gp_net_cash_flow?: number[];
  gp_cumulative_capital_called?: number[];
  gp_cumulative_distributions?: number[];
  gp_cumulative_net_cash_flow?: number[];
  [key: string]: any;
}

/**
 * Interface for visualization data
 */
export interface VisualizationData {
  chart_type?: string;
  data?: any;
  [key: string]: any;
}

/**
 * Interface for metrics data
 */
export interface MetricsData {
  irr?: number;
  equity_multiple?: number;
  roi?: number;
  dpi?: number;
  tvpi?: number;
  payback_period?: number;
  default_rate?: number;
  avg_exit_year?: number;
  [key: string]: any;
}
