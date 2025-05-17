import * as z from 'zod';

// Define the schema based on the canonical simulation configuration schema
export const simulationSchema = z.object({
  // 1. Fund Structure
  fund_size: z.number().int().min(1000000, "Fund size must be at least $1,000,000").default(100_000_000),
  fund_term: z.number().int().min(1).max(30, "Fund term must be between 1 and 30 years").default(10),
  fund_id: z.string().optional(),
  fund_group: z.string().optional(),
  tranche_id: z.string().optional(),

  // 2. Fees and Expenses
  management_fee_rate: z.number().min(0).max(0.1, "Management fee rate must be between 0% and 10%").default(0.02),
  management_fee_basis: z.enum(['committed_capital', 'invested_capital', 'net_asset_value', 'stepped']).default('committed_capital'),
  management_fee_step_down: z.boolean().default(false),
  management_fee_step_down_year: z.number().int().min(1).max(20, "Step-down year must be between 1 and 20").default(5),
  management_fee_step_down_rate: z.number().min(0).max(1, "Step-down rate must be between 0 and 1").default(0.5),
  expense_rate: z.number().min(0).max(0.1, "Expense rate must be between 0% and 10%").default(0.005),
  formation_costs: z.number().min(0).default(0),

  // 3. Deployment and Capital Calls
  deployment_pace: z.enum(['even', 'front_loaded', 'back_loaded', 'bell_curve']).default('even'),
  deployment_period: z.number().int().min(1).max(20, "Deployment period must be between 1 and 20").default(3),
  deployment_period_unit: z.enum(['years', 'months', 'quarters']).default('years'),
  deployment_monthly_granularity: z.boolean().default(false),
  capital_call_schedule: z.enum(['upfront', 'equal', 'front_loaded', 'back_loaded', 'custom']).default('upfront'),
  capital_call_years: z.number().int().min(1).max(10, "Capital call years must be between 1 and 10").default(3),
  custom_capital_call_schedule: z.record(z.string(), z.number()).optional(),
  custom_capital_call_schedule_monthly: z.record(z.string(), z.number()).optional(),
  custom_deployment_schedule_monthly: z.record(z.string(), z.number()).optional(),

  // 4. Reinvestment and Exit
  reinvestment_period: z.number().int().min(0).max(20, "Reinvestment period must be between 0 and 20 years").default(5),
  reinvestment_percentage: z.number().min(0).max(1, "Reinvestment percentage must be between 0% and 100%").default(0.0),
  reinvestment_rate: z.number().min(0).max(1, "Reinvestment rate must be between 0% and 100%").default(0.0),
  profit_reinvestment_percentage: z.number().min(0).max(1, "Profit reinvestment percentage must be between 0% and 100%").default(0.0),
  reinvestment_reserve_rate: z.number().min(0).max(1, "Reinvestment reserve rate must be between 0% and 100%").default(0.8),
  avg_loan_exit_year: z.number().min(1).max(20, "Average loan exit year must be between 1 and 20").default(7),
  exit_year_std_dev: z.number().min(0).max(10, "Exit year standard deviation must be between 0 and 10").default(1.5),
  early_exit_probability: z.number().min(0).max(1, "Early exit probability must be between 0% and 100%").default(0.3),
  force_exit_within_fund_term: z.boolean().default(true),

  // 5. Waterfall and Returns
  waterfall_structure: z.enum(['european', 'american']).default('european'),
  hurdle_rate: z.number().min(0).max(0.5, "Hurdle rate must be between 0% and 50%").default(0.08),
  catch_up_rate: z.number().min(0).max(1, "Catch-up rate must be between 0% and 100%").default(0.0),
  catch_up_structure: z.enum(['full', 'partial', 'none']).default('full'),
  carried_interest_rate: z.number().min(0).max(0.5, "Carried interest rate must be between 0% and 50%").default(0.20),
  gp_commitment_percentage: z.number().min(0).max(0.5, "GP commitment percentage must be between 0% and 50%").default(0.05),
  preferred_return_compounding: z.enum(['annual', 'quarterly', 'monthly', 'continuous']).default('annual'),
  distribution_frequency: z.enum(['annual', 'quarterly', 'semi_annual']).default('annual'),
  distribution_policy: z.enum(['available_cash', 'income_only', 'return_of_capital', 'reinvestment_priority']).default('available_cash'),
  clawback_provision: z.boolean().default(true),
  management_fee_offset_percentage: z.number().min(0).max(1, "Management fee offset percentage must be between 0% and 100%").default(0.0),

  // 6. Market and Loan Parameters
  market_conditions_by_year: z.record(z.string(), z.object({
    housing_market_trend: z.enum(['appreciating', 'stable', 'depreciating']).default('stable'),
    interest_rate_environment: z.enum(['rising', 'stable', 'falling']).default('stable'),
    economic_outlook: z.enum(['expansion', 'stable', 'recession']).default('stable'),
  })).optional(),
  avg_loan_size: z.number().min(10000).max(10000000, "Average loan size must be between $10,000 and $10,000,000").default(250000),
  loan_size_std_dev: z.number().min(0).max(1000000, "Loan size standard deviation must be between 0 and $1,000,000").default(50000),
  min_loan_size: z.number().min(1000).max(1000000, "Minimum loan size must be between $1,000 and $1,000,000").default(100000),
  max_loan_size: z.number().min(100000).max(100000000, "Maximum loan size must be between $100,000 and $100,000,000").default(500000),
  avg_loan_term: z.number().min(1).max(30, "Average loan term must be between 1 and 30 years").default(5),
  avg_loan_interest_rate: z.number().min(0).max(0.5, "Average loan interest rate must be between 0% and 50%").default(0.06),
  avg_loan_ltv: z.number().min(0).max(1, "Average loan LTV must be between 0% and 100%").default(0.75),
  ltv_std_dev: z
    .number()
    .min(0)
    .max(0.5, "LTV standard deviation must be between 0 and 0.5")
    .default(0.05),
  min_ltv: z.number().min(0).max(1).nullable().default(null),
  max_ltv: z.number().min(0).max(1).nullable().default(null),
  zone_allocations: z.record(z.string(), z.number()).optional(),

  use_tls_zone_growth: z.boolean().default(false),

  leverage: z
    .object({
      green_sleeve: z
        .object({
          enabled: z.boolean().default(true),
          max_mult: z.number().min(0).max(2).default(1.5),
          spread_bps: z.number().int().default(275),
          commitment_fee_bps: z.number().int().default(50),
        })
        .default({ enabled: true, max_mult: 1.5, spread_bps: 275, commitment_fee_bps: 50 }),
      a_plus_overadvance: z
        .object({
          enabled: z.boolean().default(false),
          tls_grade: z.string().default('A+'),
          advance_rate: z.number().min(0).max(1).default(0.75),
        })
        .default({ enabled: false, tls_grade: 'A+', advance_rate: 0.75 }),
      deal_note: z
        .object({
          enabled: z.boolean().default(false),
          note_pct: z.number().min(0).max(1).default(0.3),
          note_rate: z.number().min(0).max(1).default(0.07),
        })
        .default({ enabled: false, note_pct: 0.3, note_rate: 0.07 }),
      ramp_line: z
        .object({
          enabled: z.boolean().default(false),
          limit_pct_commit: z.number().min(0).max(1).default(0.15),
          draw_period_months: z.number().int().min(1).default(24),
          spread_bps: z.number().int().default(300),
        })
        .default({ enabled: false, limit_pct_commit: 0.15, draw_period_months: 24, spread_bps: 300 }),
      dynamic_rules: z.array(z.any()).default([]),
    })
    .default({
      green_sleeve: { enabled: true, max_mult: 1.5, spread_bps: 275, commitment_fee_bps: 50 },
      a_plus_overadvance: { enabled: false, tls_grade: 'A+', advance_rate: 0.75 },
      deal_note: { enabled: false, note_pct: 0.3, note_rate: 0.07 },
      ramp_line: { enabled: false, limit_pct_commit: 0.15, draw_period_months: 24, spread_bps: 300 },
      dynamic_rules: [],
    }),

  default_correlation: z
    .object({
      same_zone: z.number().min(0).max(1).default(0.3),
      cross_zone: z.number().min(0).max(1).default(0.1),
      enabled: z.boolean().default(true),
    })
    .default({ same_zone: 0.3, cross_zone: 0.1, enabled: true }),

  rebalancing_strength: z.number().min(0).max(1).default(0.5),
  zone_drift_threshold: z.number().min(0).max(1).default(0.1),
  zone_rebalancing_enabled: z.boolean().default(true),
  zone_allocation_precision: z.number().min(0).max(1).default(0.8),

  // 7. Advanced/Analytics
  monte_carlo_enabled: z.boolean().default(false),
  num_simulations: z.number().int().min(10).max(10000, "Number of simulations must be between 10 and 10,000").default(1000),
  inner_monte_carlo_enabled: z.boolean().default(false),
  num_inner_simulations: z.number().int().min(1).max(1000, "Number of inner simulations must be between 1 and 1,000").default(100),
  variation_factor: z.number().min(0).max(1, "Variation factor must be between 0 and 1").default(0.1),
  monte_carlo_seed: z.number().int().nullable().default(null),
  optimization_enabled: z.boolean().default(false),
  stress_testing_enabled: z.boolean().default(false),
  external_data_enabled: z.boolean().default(false),
  generate_reports: z.boolean().default(true),
  gp_entity_enabled: z.boolean().default(false),
  aggregate_gp_economics: z.boolean().default(true),
  report_config: z.record(z.string(), z.any()).optional(),
  stress_config: z.record(z.string(), z.any()).optional(),
  gp_entity: z.record(z.string(), z.any()).optional(),

  // Default Correlation
  default_correlation: z
    .object({
      enabled: z.boolean().default(true),
      same_zone: z.number().min(0).max(1).default(0.3),
      cross_zone: z.number().min(0).max(1).default(0.1),
    })
    .default({ enabled: true, same_zone: 0.3, cross_zone: 0.1 }),

  // Zone Rebalancing
  zone_rebalancing_enabled: z.boolean().default(true),
  rebalancing_strength: z.number().min(0).max(1).default(0.5),
  zone_drift_threshold: z.number().min(0).max(0.5).default(0.1),
  zone_allocation_precision: z.number().min(0).max(1).default(0.8),

  // Lifecycle Timing
  exit_year_max_std_dev: z.number().min(1).max(5).default(3),
});

// Define the type based on the schema
export type SimulationConfig = z.infer<typeof simulationSchema>;

// Define the default values
export const defaultSimulationConfig: SimulationConfig = {
  // 1. Fund Structure
  fund_size: 100_000_000,
  fund_term: 10,

  // 2. Fees and Expenses
  management_fee_rate: 0.02,
  management_fee_basis: 'committed_capital',
  management_fee_step_down: false,
  management_fee_step_down_year: 5,
  management_fee_step_down_rate: 0.5,
  expense_rate: 0.005,
  formation_costs: 0,

  // 3. Deployment and Capital Calls
  deployment_pace: 'even',
  deployment_period: 3,
  deployment_period_unit: 'years',
  deployment_monthly_granularity: false,
  capital_call_schedule: 'upfront',
  capital_call_years: 3,

  // 4. Reinvestment and Exit
  reinvestment_period: 5,
  reinvestment_percentage: 0.0,
  reinvestment_rate: 0.0,
  profit_reinvestment_percentage: 0.0,
  reinvestment_reserve_rate: 0.8,
  avg_loan_exit_year: 7,
  exit_year_std_dev: 1.5,
  early_exit_probability: 0.3,
  force_exit_within_fund_term: true,

  // 5. Waterfall and Returns
  waterfall_structure: 'european',
  hurdle_rate: 0.08,
  catch_up_rate: 0.0,
  catch_up_structure: 'full',
  carried_interest_rate: 0.20,
  gp_commitment_percentage: 0.05,
  preferred_return_compounding: 'annual',
  distribution_frequency: 'annual',
  distribution_policy: 'available_cash',
  clawback_provision: true,
  management_fee_offset_percentage: 0.0,

  // 6. Market and Loan Parameters
  avg_loan_size: 250000,
  loan_size_std_dev: 50000,
  min_loan_size: 100000,
  max_loan_size: 500000,
  avg_loan_term: 5,
  avg_loan_interest_rate: 0.06,
  avg_loan_ltv: 0.75,
  ltv_std_dev: 0.05,
  min_ltv: null,
  max_ltv: null,
  use_tls_zone_growth: false,
  leverage: {
    green_sleeve: {
      enabled: true,
      max_mult: 1.5,
      spread_bps: 275,
      commitment_fee_bps: 50,
    },
    a_plus_overadvance: {
      enabled: false,
      tls_grade: 'A+',
      advance_rate: 0.75,
    },
    deal_note: {
      enabled: false,
      note_pct: 0.3,
      note_rate: 0.07,
    },
    ramp_line: {
      enabled: false,
      limit_pct_commit: 0.15,
      draw_period_months: 24,
      spread_bps: 300,
    },
    dynamic_rules: [],
  },
  default_correlation: { same_zone: 0.3, cross_zone: 0.1, enabled: true },
  rebalancing_strength: 0.5,
  zone_drift_threshold: 0.1,
  zone_rebalancing_enabled: true,
  zone_allocation_precision: 0.8,

  // 7. Advanced/Analytics
  monte_carlo_enabled: false,
  num_simulations: 1000,
  inner_monte_carlo_enabled: false,
  num_inner_simulations: 100,
  variation_factor: 0.1,
  monte_carlo_seed: null,
  optimization_enabled: false,
  stress_testing_enabled: false,
  external_data_enabled: false,
  generate_reports: true,
  gp_entity_enabled: false,
  aggregate_gp_economics: true,

  // Default Correlation
  default_correlation: {
    enabled: true,
    same_zone: 0.3,
    cross_zone: 0.1,
  },

  // Zone Rebalancing
  zone_rebalancing_enabled: true,
  rebalancing_strength: 0.5,
  zone_drift_threshold: 0.1,
  zone_allocation_precision: 0.8,

  // Lifecycle Timing
  exit_year_max_std_dev: 3,
};

// Define the wizard steps
export const wizardSteps = [
  {
    id: 'fund-structure',
    title: 'Fund Structure',
    description: 'Configure the basic fund parameters',
    fields: ['fund_size', 'fund_term', 'fund_id', 'fund_group', 'tranche_id'],
  },
  {
    id: 'fees-expenses',
    title: 'Fees & Expenses',
    description: 'Configure management fees and fund expenses',
    fields: [
      'management_fee_rate', 'management_fee_basis', 'management_fee_step_down',
      'management_fee_step_down_year', 'management_fee_step_down_rate',
      'expense_rate', 'formation_costs',
    ],
  },
  {
    id: 'deployment',
    title: 'Deployment',
    description: 'Configure capital deployment and capital calls',
    fields: [
      'deployment_pace', 'deployment_period', 'deployment_period_unit',
      'deployment_monthly_granularity', 'capital_call_schedule',
      'capital_call_years', 'custom_capital_call_schedule',
      'custom_capital_call_schedule_monthly', 'custom_deployment_schedule_monthly',
    ],
  },
  {
    id: 'reinvestment',
    title: 'Reinvestment & Exit',
    description: 'Configure reinvestment strategy and exit parameters',
    fields: [
      'reinvestment_period', 'reinvestment_percentage', 'reinvestment_rate',
      'profit_reinvestment_percentage', 'reinvestment_reserve_rate',
      'avg_loan_exit_year', 'exit_year_std_dev', 'early_exit_probability',
      'force_exit_within_fund_term',
    ],
  },
  {
    id: 'waterfall',
    title: 'Waterfall',
    description: 'Configure waterfall structure and returns',
    fields: [
      'waterfall_structure', 'hurdle_rate', 'catch_up_rate',
      'catch_up_structure', 'carried_interest_rate', 'gp_commitment_percentage',
      'preferred_return_compounding', 'distribution_frequency',
      'distribution_policy', 'clawback_provision', 'management_fee_offset_percentage',
    ],
  },
  {
    id: 'market-loan',
    title: 'Market & Loans',
    description: 'Configure market conditions and loan parameters',
    fields: [
      'market_conditions_by_year', 'avg_loan_size', 'loan_size_std_dev',
      'min_loan_size', 'max_loan_size', 'avg_loan_term',
      'avg_loan_interest_rate', 'avg_loan_ltv', 'zone_allocations',
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Configure advanced analytics and reporting',
    fields: [
      'use_tls_zone_growth',
      'default_correlation',
      'rebalancing_strength',
      'zone_drift_threshold',
      'zone_rebalancing_enabled',
      'zone_allocation_precision',
      'ltv_std_dev',
      'min_ltv',
      'max_ltv',
      'leverage',
      'monte_carlo_enabled',
      'num_simulations',
      'inner_monte_carlo_enabled',
      'num_inner_simulations',
      'variation_factor',
      'monte_carlo_seed',
      'optimization_enabled',
      'stress_testing_enabled',
      'external_data_enabled',
      'generate_reports',
      'gp_entity_enabled',
      'aggregate_gp_economics',
      'exit_year_max_std_dev',
      'report_config',
      'stress_config',
      'gp_entity',
    ],
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Review and submit your simulation configuration',
    fields: [],
  },
];
