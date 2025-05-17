/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LeverageConfig } from './LeverageConfig';
/**
 * Configuration for a simulation.
 */
export type SimulationConfig = {
    /**
     * Fund size in dollars
     */
    fund_size?: number;
    /**
     * Fund term in years
     */
    fund_term?: number;
    /**
     * GP commitment percentage (0-1)
     */
    gp_commitment_percentage?: number;
    /**
     * Hurdle rate (0-1)
     */
    hurdle_rate?: number;
    /**
     * Carried interest rate (0-1)
     */
    carried_interest_rate?: number;
    /**
     * Waterfall structure (european or american)
     */
    waterfall_structure?: string;
    /**
     * Enable Monte Carlo simulation
     */
    monte_carlo_enabled?: boolean;
    /**
     * Enable portfolio optimization
     */
    optimization_enabled?: boolean;
    /**
     * Enable stress testing
     */
    stress_testing_enabled?: boolean;
    /**
     * Enable external data sources
     */
    external_data_enabled?: boolean;
    /**
     * Generate reports
     */
    generate_reports?: boolean;
    /**
     * Base appreciation rate (0-1)
     */
    base_appreciation_rate?: number;
    /**
     * Appreciation volatility (0-1)
     */
    appreciation_volatility?: number;
    /**
     * Base default rate (0-1)
     */
    base_default_rate?: number;
    /**
     * Default volatility (0-1)
     */
    default_volatility?: number;
    /**
     * Correlation between appreciation and default rates (-1 to 1)
     */
    correlation?: number;
    /**
     * Average loan size in dollars
     */
    avg_loan_size?: number;
    /**
     * Standard deviation of loan size in dollars
     */
    loan_size_std_dev?: number;
    /**
     * Minimum loan size in dollars
     */
    min_loan_size?: number;
    /**
     * Maximum loan size in dollars
     */
    max_loan_size?: number;
    /**
     * Average loan term in years
     */
    avg_loan_term?: number;
    /**
     * Average loan interest rate (0-1)
     */
    avg_loan_interest_rate?: number;
    /**
     * Average loan LTV (0-1)
     */
    avg_loan_ltv?: number;
    /**
     * Zone allocations (must sum to 1)
     */
    zone_allocations?: Record<string, number>;
    /**
     * Management fee rate (0-1)
     */
    management_fee_rate?: number;
    /**
     * Management fee basis (committed_capital, invested_capital, or nav)
     */
    management_fee_basis?: string;
    /**
     * Distribution frequency (annual, quarterly, or monthly)
     */
    distribution_frequency?: string;
    /**
     * Distribution policy (available_cash, income_only, return_of_capital, or reinvestment_priority)
     */
    distribution_policy?: string;
    /**
     * Reinvestment period in years
     */
    reinvestment_period?: number;
    /**
     * Average loan exit year
     */
    avg_loan_exit_year?: number;
    /**
     * Standard deviation of exit year
     */
    exit_year_std_dev?: number;
    /**
     * Probability of early exit (0-1)
     */
    early_exit_probability?: number;
    /**
     * Number of Monte Carlo simulations
     */
    num_simulations?: number;
    /**
     * Variation factor for Monte Carlo simulation (0-1)
     */
    variation_factor?: number;
    /**
     * Seed for Monte Carlo simulation
     */
    monte_carlo_seed?: number | null;
    /**
     * Optimization objective (max_sharpe, min_volatility, efficient_risk, or efficient_return)
     */
    optimization_objective?: string;
    /**
     * Risk-free rate for Sharpe ratio calculation (0-1)
     */
    risk_free_rate?: number;
    /**
     * Geographical allocation strategy (simple/profile/explicit)
     */
    geo_strategy?: SimulationConfig.geo_strategy;
    /**
     * Named groupings of suburb IDs with target weights
     */
    zone_profiles?: Record<string, {
        ids: Array<string>;
        weight: number;
    }>;
    /**
     * Override risk weights by suburb id
     */
    risk_weight_table?: Record<string, number>;
    /**
     * Minimum allocation for optimization (0-1)
     */
    min_allocation?: number;
    /**
     * Maximum allocation for optimization (0-1)
     */
    max_allocation?: number;
    /**
     * Stress testing configuration
     */
    stress_config?: Record<string, any>;
    /**
     * Report configuration
     */
    report_config?: Record<string, any>;
    leverage?: LeverageConfig;
    /**
     * Use monthly granularity for deployment/exit
     */
    deployment_monthly_granularity?: boolean;
    /**
     * Time granularity for simulation (yearly or monthly)
     */
    time_granularity?: SimulationConfig.time_granularity;
    leverage?: LeverageConfig;
};
export namespace SimulationConfig {
    /**
     * Geographical allocation strategy (simple/profile/explicit)
     */
    export enum geo_strategy {
        SIMPLE = 'simple',
        PROFILE = 'profile',
        EXPLICIT = 'explicit',
    }
    /**
     * Time granularity for simulation (yearly or monthly)
     */
    export enum time_granularity {
        YEARLY = 'yearly',
        MONTHLY = 'monthly',
    }
}

