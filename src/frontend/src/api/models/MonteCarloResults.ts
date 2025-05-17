/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Results from Monte Carlo simulations.
 */
export type MonteCarloResults = {
    distributions?: {
        irr?: MonteCarloDistributionSummary;
        multiple?: MonteCarloDistributionSummary;
        default_rate?: MonteCarloDistributionSummary;
    };
    sensitivity?: Array<{
        parameter?: string;
        impact?: number;
        correlation?: number;
    }>;
    efficient_frontier?: Array<Record<string, any>>;
    convergence?: {
        running_mean?: Array<number>;
        running_ci?: Array<number>;
    };
    factor_decomposition?: Record<string, any>;
    num_simulations?: number;
    variation_factor?: number;
    time_granularity?: string;
    simulation_results?: Array<Record<string, any>>;
    errors?: Array<Record<string, any>>;
};

export type MonteCarloDistributionSummary = {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    stdDev?: number;
    percentiles?: {
        p10?: number;
        p25?: number;
        p50?: number;
        p75?: number;
        p90?: number;
    };
    histogram?: Array<{
        bin?: number;
        frequency?: number;
    }>;
};
