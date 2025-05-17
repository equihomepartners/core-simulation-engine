/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BootstrapResults } from './BootstrapResults';
import type { GridStressResults } from './GridStressResults';
import type { PerformanceMetrics } from './PerformanceMetrics';
import type { PortfolioEvolution } from './PortfolioEvolution';
import type { SimulationConfig } from './SimulationConfig';
import type { VintageVarResults } from './VintageVarResults';
import type { LeverageMetrics } from './LeverageMetrics';
/**
 * Results of a simulation.
 */
export type SimulationResults = {
    /**
     * Simulation ID
     */
    id?: string;
    /**
     * Status of the simulation
     */
    status?: string;
    /**
     * Status message
     */
    message?: string;
    /**
     * Whether these are partial results
     */
    partial_results?: boolean;
    /**
     * Progress of the simulation (0-1)
     */
    progress?: number;
    metrics?: PerformanceMetrics;
    performance_metrics?: PerformanceMetrics;
    /**
     * Cash flow data
     */
    cash_flows?: {
        /**
         * Years or periods
         */
        years?: Array<number>;
        /**
         * Capital called by period
         */
        capital_called?: Array<number>;
        /**
         * Distributions by period
         */
        distributions?: Array<number>;
        /**
         * Net cash flow by period
         */
        net_cash_flow?: Array<number>;
        /**
         * Cumulative capital called by period
         */
        cumulative_capital_called?: Array<number>;
        /**
         * Cumulative distributions by period
         */
        cumulative_distributions?: Array<number>;
        /**
         * Cumulative net cash flow by period
         */
        cumulative_net_cash_flow?: Array<number>;
    };
    portfolio?: PortfolioEvolution;
    yearly_portfolio?: PortfolioEvolution;
    monthly_portfolio?: PortfolioEvolution;
    /**
     * Monthly cash flow data
     */
    monthly_cash_flows?: Record<string, any>;
    /**
     * Waterfall distribution results
     */
    waterfall_results?: Record<string, any>;
    /**
     * Monte Carlo simulation results
     */
    monte_carlo_results?: Record<string, any>;
    leverage_metrics?: LeverageMetrics;
    bootstrap_results?: BootstrapResults;
    grid_stress_results?: GridStressResults;
    vintage_var?: VintageVarResults;
    /**
     * Fund size
     */
    fund_size?: number;
    config?: SimulationConfig;
};

