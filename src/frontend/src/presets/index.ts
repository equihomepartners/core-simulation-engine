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

      // Zone Targets
      zone_targets: {
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
      interest_rate: 0.06,
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
      gp_commitment_percentage: 0.0,
      hurdle_rate: 0.08,
      carried_interest_rate: 0.20,
      waterfall_structure: 'american',
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
      deployment_period: 3,
      deployment_period_unit: 'years',
      deployment_monthly_granularity: true,
      capital_call_schedule: 'as_needed',
      capital_call_years: 3,

      // Zone Targets
      zone_targets: {
        green: 0.5,
        orange: 0.3,
        red: 0.2,
      },

      // Zone Balance Parameters
      rebalancing_strength: 0.5,
      zone_drift_threshold: 0.1,
      zone_rebalancing_enabled: true,

      // Loan Parameters
      avg_loan_size: 1000000,
      loan_size_std_dev: 200000,
      min_loan_size: 500000,
      max_loan_size: 2000000,
      avg_loan_interest_rate: 0.1,
      interest_rate: 0.1,
      avg_loan_term: 5,
      avg_loan_ltv: 0.75,

      // Full Lifecycle Simulation Parameters
      simulate_full_lifecycle: true,
      enable_reinvestments: true,
      enable_defaults: true,
      enable_early_repayments: true,
      enable_appreciation: true,
      force_exit_within_fund_term: true,
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
    log(LogLevel.ERROR, LogCategory.PRESETS, `Error getting 100M preset: ${error}`);
    throw error;
  }
}
