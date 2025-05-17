// Simulation types
export interface SimulationConfig {
  fund_size: number;
  fund_term: number;
  gp_commitment_percentage: number;
  hurdle_rate: number;
  carried_interest_rate: number;
  waterfall_structure: string;
  monte_carlo_enabled: boolean;
  optimization_enabled: boolean;
  stress_testing_enabled: boolean;
  external_data_enabled: boolean;
  generate_reports: boolean;
  management_fee_rate?: number;
  management_fee_basis?: string;
  management_fee_step_down?: boolean;
  management_fee_step_down_year?: number;
  management_fee_step_down_rate?: number;
  deployment_pace?: string;
  deployment_period?: number;
  deployment_period_unit?: string;
  deployment_monthly_granularity?: boolean;
  average_ltv?: number;
  ltv_std_dev?: number;
  min_ltv?: number;
  max_ltv?: number;
  catch_up_rate?: number;
  catch_up_structure?: string;
  preferred_return_compounding?: string;
  distribution_timing?: string;
  clawback_provision?: boolean;
  management_fee_offset_percentage?: number;
  distribution_frequency?: string;
  reinvestment_logic?: string;
  origination_fee_rate?: number;
  origination_fee_to_gp?: boolean;
  expense_rate?: number;
  formation_costs?: number;
  zone_targets?: {
    green?: number;
    orange?: number;
    red?: number;
  };
  market_conditions_by_year?: Record<string, {
    housing_market_trend: string;
    interest_rate_environment: string;
    economic_outlook: string;
  }>;
  default_correlation?: {
    same_zone: number;
    cross_zone: number;
    enabled: boolean;
  };
  rebalancing_strength?: number;
  zone_drift_threshold?: number;
  zone_rebalancing_enabled?: boolean;
  zone_allocation_precision?: number;
  avg_loan_exit_year?: number;
  exit_year_std_dev?: number;
  min_holding_period?: number;
  exit_year_skew?: number;
  simulate_full_lifecycle?: boolean;
  enable_reinvestments?: boolean;
  enable_defaults?: boolean;
  enable_early_repayments?: boolean;
  enable_appreciation?: boolean;
  early_exit_probability?: number;
  reinvestment_rate?: number;
  default_rates?: {
    green: number;
    orange: number;
    red: number;
  };
  appreciation_rates?: {
    green: number;
    orange: number;
    red: number;
  };
  appreciation_share_method?: string;
  property_value_discount_rate?: number;
  appreciation_base?: string;
  risk_free_rate?: number;
  discount_rate?: number;
  target_irr?: number;
  target_equity_multiple?: number;
  target_distribution_yield?: number;
  performance_metrics_display?: string[];
  monte_carlo_parameters?: {
    appreciation_rates?: {
      enabled: boolean;
      variation: number;
      correlation: string;
    };
    default_rates?: {
      enabled: boolean;
      variation: number;
      correlation: string;
    };
    exit_timing?: {
      enabled: boolean;
      variation_years: number;
    };
    ltv_ratios?: {
      enabled: boolean;
      variation: number;
    };
  };
  num_simulations?: number;
  random_seed?: number;
  aggregate_gp_economics?: boolean;
  avg_loan_size?: number;
  loan_size_std_dev?: number;
  min_loan_size?: number;
  max_loan_size?: number;
  avg_loan_interest_rate?: number;
  interest_rate?: number;

  // GP Entity configuration
  gp_entity?: {
    name?: string;
    management_company?: {
      base_expenses?: number;
      expense_growth_rate?: number;
      staff?: any[];
      office_expenses?: number;
      technology_expenses?: number;
      marketing_expenses?: number;
      legal_expenses?: number;
      other_expenses?: number;
    };
    team_allocation?: {
      partners?: any[];
      employees?: any[];
    };
    cross_fund_carry?: boolean;
    cross_fund_carry_rules?: {
      hurdle_rate?: number;
      carried_interest_rate?: number;
      catch_up_rate?: number;
      waterfall_structure?: string;
      apply_hurdle?: boolean;
    };
    cashflow_frequency?: string;
    expenses?: Array<{
      name: string;
      amount: number;
      type: string;
      frequency: string;
      start_year: number;
      end_year?: number;
      growth_rate: number;
    }>;
    dividend_policy?: {
      enabled?: boolean;
      type?: string;
      percentage?: number;
      fixed_amount?: number;
      frequency?: string;
      min_cash_reserve?: number;
      start_year?: number;
      max_dividend?: number;
      min_profitability?: number;
    };
    initial_cash_reserve?: number;
  };
  estimated_number_of_loans?: number;
}

export interface SimulationStatus {
  simulation_id: string;
  status: 'created' | 'running' | 'completed' | 'failed';
  progress: number;
  current_step: string | null;
  step_progress?: number;
  step_details?: string;
  estimated_completion_time: number | null;
  created_at: number;
  updated_at: number;

  // Snapshot data for visualization during loading
  snapshots?: {
    portfolio?: {
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
    metrics?: {
      irr?: number;
      equity_multiple?: number;
      roi?: number;
      dpi?: number;
      tvpi?: number;
      payback_period?: number;
    };
    waterfall?: {
      total_contributions?: number;
      preferred_return?: number;
      catch_up?: number;
      carried_interest?: number;
      lp_distributions?: number;
      gp_distributions?: number;
      total_distributions?: number;
    };
    monte_carlo?: {
      iterations?: number;
      completed?: number;
      irr_distribution?: {
        mean?: number;
        median?: number;
        min?: number;
        max?: number;
      };
    };
    [key: string]: any;
  };

  // Partial results that might be available during simulation
  partial_results?: any;
}

export interface SimulationListResponse {
  simulations: SimulationStatus[];
  total: number;
  limit: number;
  offset: number;
}

export interface SimulationCreateResponse {
  simulation_id: string;
  status: string;
}

// Visualization types
export interface KeyMetrics {
  irr: number;
  multiple: number;
  roi: number;
  dpi: number;
  tvpi: number;
  payback_period: number;
  default_rate: number;
  avg_exit_year: number;
}

export interface WaterfallMetrics {
  total_contributions: number;
  preferred_return: number;
  catch_up: number;
  carried_interest: number;
  lp_distributions: number;
  gp_distributions: number;
  total_distributions: number;
}

export interface RiskMetrics {
  volatility: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  downside_deviation: number;
  var_95: number;
  cvar_95: number;
}

export interface Dataset {
  label: string;
  data: number[];
}

export interface CashflowsResponse {
  labels: number[];
  datasets: Dataset[];
}

export interface PortfolioResponse {
  labels: string[];
  values: number[];
  colors: string[];
}

export interface ZonePerformance {
  metrics: {
    green: {
      irr: number;
      multiple: number;
      default_rate: number;
    };
    orange: {
      irr: number;
      multiple: number;
      default_rate: number;
    };
    red: {
      irr: number;
      multiple: number;
      default_rate: number;
    };
  };
}

export interface LoanPerformanceMetrics {
  total_loans: number;
  defaulted_loans: number;
  default_rate: number;
  average_irr: number;
  average_multiple: number;
}

export interface PortfolioEvolution {
  labels: number[];
  datasets: Dataset[];
}

export interface MonteCarloDistribution {
  labels: number[];
  datasets: {
    label: string;
    data: number[];
  }[];
  statistics: {
    min: number;
    max: number;
    mean: number;
    median: number;
    std_dev: number;
    percentiles: {
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
    };
  };
}

// Wizard step types
export interface WizardStep {
  id: string;
  title: string;
  description: string;
}

// GP Entity types
export interface GPEntityBasic {
  name: string;
  total_committed_capital: number;
  total_aum: number;
  total_management_fees: number;
  total_carried_interest: number;
  total_gp_commitment: number;
  total_origination_fees: number;
}

export interface ManagementCompany {
  base_expenses: number;
  expense_growth_rate: number;
  staff: any[];
  office_expenses: number;
  technology_expenses: number;
  marketing_expenses: number;
  legal_expenses: number;
  other_expenses: number;
}

export interface TeamEconomics {
  partners: any[];
  employees: any[];
}

export interface GPCommitment {
  total_commitment: number;
  total_return: number;
  multiple: number;
  roi: number;
  breakdown_by_fund: Record<string, {
    commitment: number;
    return: number;
    multiple: number;
  }>;
}

export interface GPCashflows {
  revenue: number[];
  expenses: number[];
  net_income: number[];
  dividend: number[];
  cash_reserve: number[];
}

export interface GPMetrics {
  total_revenue: number;
  total_expenses: number;
  total_net_income: number;
  profit_margin: number;
  cagr: number;
  irr: number;
  payback_period: number;
}