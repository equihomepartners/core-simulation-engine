/**
 * Simulation presets
 *
 * This module contains predefined simulation configurations that can be used
 * throughout the application. It serves as the single source of truth for
 * preset configurations.
 */

import { SimulationConfig } from '@/api';
import { LogCategory, LogLevel, log } from '@/utils/logging';

/**
 * Get the default simulation configuration
 * @returns Default simulation configuration
 */
export function getDefaultPreset(): SimulationConfig {
  try {
    log(LogLevel.INFO, LogCategory.PRESETS, 'Getting default preset configuration');

    return {
      // Fund Configuration
      fund_size: 10000000,
      fund_term: 7,
      gp_commitment_percentage: 0.0,
      hurdle_rate: 0.08,
      carried_interest_rate: 0.20,
      waterfall_structure: 'european',
      preferred_return_compounding: 'annual',
      management_fee_rate: 0.02,
      management_fee_basis: 'committed_capital',
      catch_up_rate: 0.20,
      catch_up_structure: 'full',
      clawback_provision: true,
      management_fee_offset_percentage: 0.0,
      distribution_frequency: 'quarterly',
      distribution_timing: 'end_of_period',

      // Deployment Parameters
      deployment_pace: 'even',
      deployment_period: 2,
      deployment_period_unit: 'years',
      deployment_monthly_granularity: true,
      capital_call_schedule: 'as_needed',
      capital_call_years: 2,

      // Zone Allocations
      zone_allocations: {
        green: 0.6,
        orange: 0.3,
        red: 0.1,
      },

      // Zone Balance Parameters
      rebalancing_strength: 0.5,
      zone_drift_threshold: 0.1,
      zone_rebalancing_enabled: true,

      // Loan Parameters
      avg_loan_size: 250000,
      loan_size_std_dev: 50000,
      min_loan_size: 100000,
      max_loan_size: 500000,
      avg_loan_interest_rate: 0.06,
      avg_loan_term: 5,
      avg_loan_ltv: 0.65,

      // Full Lifecycle Simulation Parameters
      simulate_full_lifecycle: true,
      enable_reinvestments: true,
      enable_defaults: true,
      enable_early_repayments: true,
      enable_appreciation: true,
      early_exit_probability: 0.1,
      reinvestment_rate: 0.8,
      default_rates: {
        green: 0.01,
        orange: 0.03,
        red: 0.05
      },
      appreciation_rates: {
        green: 0.03,
        orange: 0.04,
        red: 0.05
      },

      // Analysis Settings
      risk_free_rate: 0.03,
      discount_rate: 0.08,
      target_irr: 0.15,
      target_equity_multiple: 1.8,
      target_distribution_yield: 0.07,
    };
  } catch (error) {
    log(LogLevel.ERROR, LogCategory.PRESETS, `Error getting default preset: ${error}`);
    throw error;
  }
}

/**
 * Get the 100M preset configuration
 * @returns 100M preset configuration
 */
export function get100MPreset(): SimulationConfig {
  try {
    log(LogLevel.INFO, LogCategory.PRESETS, 'Getting 100M preset configuration');

    return {
      // Fund Configuration
      fund_size: 100000000,
      fund_term: 10,
      fund_id: "100M_Fund",
      fund_group: "Institutional",
      tranche_id: "Main",
      gp_commitment_percentage: 0.0,
      hurdle_rate: 0.08,
      carried_interest_rate: 0.20,
      waterfall_structure: 'american',
      preferred_return_compounding: 'annual',
      management_fee_rate: 0.02,
      management_fee_basis: 'committed_capital',
      management_fee_step_down: false,
      management_fee_step_down_year: 5,
      management_fee_step_down_rate: 0.5,
      expense_rate: 0.005,
      formation_costs: 500000,
      catch_up_rate: 0.20,
      catch_up_structure: 'full',
      clawback_provision: true,
      management_fee_offset_percentage: 0.0,
      distribution_frequency: 'quarterly',
      distribution_timing: 'end_of_period',
      distribution_policy: 'available_cash',

      // Deployment Parameters
      deployment_pace: 'even',
      deployment_period: 3,
      deployment_period_unit: 'months',
      deployment_monthly_granularity: true,
      capital_call_schedule: 'as_needed',
      capital_call_years: 3,

      // Zone Allocations (renamed from Zone Targets for consistency)
      zone_allocations: {
        green: 0.8,
        orange: 0.2,
        red: 0.0,
      },

      // Zone Balance Parameters
      rebalancing_strength: 0.5,
      zone_drift_threshold: 0.1,
      zone_rebalancing_enabled: true,
      zone_allocation_precision: 0.8,

      // Loan Parameters
      avg_loan_size: 1000000,
      loan_size_std_dev: 200000,
      min_loan_size: 500000,
      max_loan_size: 2000000,
      avg_loan_term: 10,
      avg_loan_interest_rate: 0.1,
      avg_loan_ltv: 0.35,
      ltv_std_dev: 0.05,
      min_ltv: 0.1,
      max_ltv: 0.6,

      // Exit Timing Parameters
      avg_loan_exit_year: 4,
      exit_year_std_dev: 1.5,
      exit_year_max_std_dev: 3,
      exit_year_skew: 0,
      min_holding_period: 0.25,
      force_exit_within_fund_term: true,
      early_exit_probability: 0.25,

      // Reinvestment Parameters
      reinvestment_period: 5,
      reinvestment_rate: 0.9,
      reinvestment_reserve_rate: 0.8,

      // Market Parameters
      base_appreciation_rate: 0.03,
      appreciation_volatility: 0.02,
      base_default_rate: 0.01,
      default_volatility: 0.005,
      correlation: 0.3,
      default_rates: {
        green: 0.01,
        orange: 0.03,
        red: 0.05
      },
      appreciation_rates: {
        green: 0.03,
        orange: 0.04,
        red: 0.05
      },
      appreciation_std_dev: {
        green: 0.01,
        orange: 0.015,
        red: 0.02
      },
      recovery_rates: {
        green: 0.9,
        orange: 0.8,
        red: 0.7
      },

      // LTV Parameters (defined above, no need to duplicate)

      // Default Correlation
      default_correlation: {
        same_zone: 0.3,
        cross_zone: 0.1,
        enabled: true,
      },

      // Advanced Analytics Parameters
      monte_carlo_enabled: true,
      num_simulations: 1000,
      inner_monte_carlo_enabled: true,
      num_inner_simulations: 100,
      variation_factor: 0.1,
      monte_carlo_seed: null,
      bootstrap_enabled: false,
      bootstrap_iterations: 1000,
      grid_stress_enabled: false,
      grid_stress_steps: 5,
      grid_stress_axes: ["base_appreciation_rate", "base_default_rate"],
      vintage_var_enabled: true,
      optimization_enabled: true,
      generate_efficient_frontier: true,
      efficient_frontier_points: 50,
      stress_testing_enabled: true,
      external_data_enabled: true,
      generate_reports: true,
      run_dual_leverage_comparison: true,
      monte_carlo_parameters: {
        loan_parameters: {
          parameters: {
            avg_loan_ltv: { base: 0.35, dist: "normal", args: { std: 0.05 } }
          }
        },
        zone_allocation: {
          parameters: {
            green_weight: { base: 0.8, dist: "uniform", args: { min: 0.7, max: 0.9 } }
          }
        },
        exit_timing: {
          parameters: {
            avg_exit_year: { base: 4, dist: "normal", args: { std: 1.0 } }
          }
        }
      },

      // Leverage Parameters
      leverage: {
        green_sleeve: {
          enabled: true, // Enable NAV facility for green zone
          max_mult: 1.5, // 1.5x leverage on NAV
          spread_bps: 275, // 2.75% spread
          commitment_fee_bps: 50, // 0.5% commitment fee
        },
        a_plus_overadvance: {
          enabled: true, // Enable over-advance for A+ rated properties
          tls_grade: 'A+',
          advance_rate: 0.75, // 75% advance rate
        },
        deal_note: {
          enabled: true, // Enable deal-level notes
          note_pct: 0.3, // 30% of deal as note
          note_rate: 0.07, // 7% note rate
        },
        ramp_line: {
          enabled: true, // Enable ramp line
          limit_pct_commit: 0.15, // 15% of committed capital
          draw_period_months: 24, // 2-year draw period
          spread_bps: 300, // 3% spread
        },
        dynamic_rules: [
          {
            trigger: "nav > 50000000", // If NAV exceeds $50M
            action: "increase_green_sleeve",
            max: 1.75 // Increase green sleeve leverage to 1.75x
          },
          {
            trigger: "default_rate > 0.03", // If default rate exceeds 3%
            action: "decrease_green_sleeve",
            max: 1.25 // Decrease green sleeve leverage to 1.25x
          }
        ],
      },

      // GP Entity Parameters
      gp_entity_enabled: true,
      aggregate_gp_economics: true,
      gp_entity: {
        name: "Equihome Partners",
        management_company: {
          operating_expenses: 2000000,
          revenue_share_percentage: 0.5,
          team_size: 10,
        },
        team_allocation: {
          senior_partners: 0.6,
          junior_partners: 0.3,
          associates: 0.1,
        },
        gp_commitment_percentage: 0.0,
        cross_fund_carry: false,
        cashflow_frequency: "yearly",
        initial_cash_reserve: 0,
      },

      // Sydney Suburb Data Configuration
      geo_strategy: "profile", // Use profile-based strategy for suburb allocation
      use_tls_zone_growth: true, // Use TLS data for zone growth rates
      zone_profiles: {
        "Sydney-Green": {
          ids: ["2000", "2010", "2011", "2060", "2061"], // Sydney CBD and Eastern Suburbs
          weight: 0.8
        },
        "Sydney-Orange": {
          ids: ["2170", "2200", "2204", "2208", "2213"], // Inner West and South Sydney
          weight: 0.2
        },
        "Sydney-Red": {
          ids: ["2145", "2150", "2160", "2161", "2166"], // Western Sydney
          weight: 0.0
        }
      },
      risk_weight_table: {
        // Override risk weights for specific suburbs if needed
        "2000": 0.8, // Sydney CBD
        "2010": 0.85, // Surry Hills
        "2170": 0.6, // Liverpool
        "2145": 0.4, // Westmead
      },

      // Analysis Settings
      risk_free_rate: 0.03,
      discount_rate: 0.08,
      target_irr: 0.15,
      target_equity_multiple: 1.8,
      target_distribution_yield: 0.07,
    };
  } catch (error) {
    log(LogLevel.ERROR, LogCategory.PRESETS, `Error getting 100M preset: ${error}`);
    throw error;
  }
}
