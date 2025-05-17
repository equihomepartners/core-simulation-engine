/**
 * Simulation parameters interface
 */
export interface SimulationParameters {
  // Fund parameters
  fund_size: number;
  fund_term: number;
  deployment_period: number;
  deployment_pace: 'even' | 'front_loaded' | 'back_loaded' | 'bell_curve';
  reinvestment_period: number;
  
  // Loan parameters
  loan_count: number;
  avg_loan_size: number;
  loan_size_std_dev: number;
  avg_loan_exit_year: number;
  exit_year_std_dev: number;
  
  // Zone allocation
  zone_allocation: {
    green: number;
    orange: number;
    red: number;
  };
  
  // Appreciation rates
  appreciation_rates: {
    green: number;
    orange: number;
    red: number;
  };
  
  // Default rates
  default_rates: {
    green: number;
    orange: number;
    red: number;
  };
  
  // Waterfall parameters
  waterfall_structure: 'european' | 'american';
  hurdle_rate: number;
  catch_up_rate: number;
  catch_up_structure: 'full' | 'partial' | 'none';
  carried_interest_rate: number;
  
  // Management fee parameters
  management_fee_rate: number;
  management_fee_basis: 'committed_capital' | 'invested_capital' | 'net_asset_value' | 'stepped';
  management_fee_step_down: boolean;
  management_fee_step_down_year: number;
  management_fee_step_down_rate: number;
  
  // Fee parameters
  origination_fee_rate: number;
  origination_fee_to_gp: boolean;
  expense_rate: number;
  formation_costs: number;
  
  // Lifecycle parameters
  simulate_full_lifecycle: boolean;
  enable_reinvestments: boolean;
  enable_defaults: boolean;
  enable_early_repayments: boolean;
  enable_appreciation: boolean;
  early_exit_probability: number;
  reinvestment_rate: number;
  
  // Appreciation sharing parameters
  appreciation_sharing_method: 'fixed_percentage' | 'ltv_based' | 'tiered';
  appreciation_fund_share: number;
  property_value_discount_rate: number;
  appreciation_base: 'discounted_value' | 'market_value';
  
  // LTV-based appreciation parameters
  ltv_appreciation_base: number;
  ltv_appreciation_multiplier: number;
  
  // Tiered appreciation parameters
  tiered_appreciation: {
    tier1_threshold: number;
    tier1_fund_share: number;
    tier2_threshold: number;
    tier2_fund_share: number;
    tier3_fund_share: number;
  };
  
  // Performance metrics parameters
  risk_free_rate: number;
  discount_rate: number;
  target_irr: number;
  target_equity_multiple: number;
  target_distribution_yield: number;
  performance_metrics_display: string[];
  
  // Monte Carlo parameters
  monte_carlo_enabled: boolean;
  num_simulations: number;
  monte_carlo_parameters: {
    appreciation_rates: {
      enabled: boolean;
      variation: number;
      correlation: 'none' | 'low' | 'medium' | 'high';
    };
    default_rates: {
      enabled: boolean;
      variation: number;
      correlation: 'none' | 'low' | 'medium' | 'high';
    };
    exit_timing: {
      enabled: boolean;
      variation_years: number;
    };
    market_conditions?: {
      enabled: boolean;
      cycle_length_years: number;
      cycle_amplitude: number;
    };
  };
  
  // Sensitivity analysis parameters
  sensitivity_analysis_enabled: boolean;
  sensitivity_method: 'one_at_a_time' | 'morris' | 'sobol';
  sensitivity_parameters: string[];
  
  // GP entity parameters
  aggregate_gp_economics: boolean;
  gp_entity: {
    name: string;
    initial_cash_reserve: number;
    gp_commitment_percentage: number;
    cashflow_frequency: 'yearly' | 'quarterly' | 'monthly';
    cross_fund_carry: boolean;
    management_company: {
      base_expenses: number;
      expense_growth_rate: number;
      staff: Array<{
        id: string;
        name: string;
        role: string;
        salary: number;
        start_year: number;
        end_year: number | null;
      }>;
      office_expenses: number;
      technology_expenses: number;
      marketing_expenses: number;
      legal_expenses: number;
    };
    expenses: Array<{
      id: string;
      name: string;
      amount: number;
      type: 'one_time' | 'recurring';
      year: number;
      recurring_frequency?: 'annual' | 'quarterly' | 'monthly';
    }>;
    dividend_policy: {
      enabled: boolean;
      type: 'percentage' | 'fixed_amount';
      percentage: number;
      fixed_amount: number;
      frequency: 'annual' | 'semi_annual' | 'quarterly' | 'monthly';
      min_cash_reserve: number;
      start_year: number;
      min_profitability: number;
    };
  };
  
  // Multi-fund parameters
  deployment_start: number;
  tranche_id?: string;
  fund_id?: string;
  fund_group?: string;
  size?: number;
}
