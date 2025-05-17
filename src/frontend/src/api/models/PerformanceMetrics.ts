/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Performance metrics for a simulation.
 */
export type PerformanceMetrics = {
    /**
     * Internal Rate of Return
     */
    irr?: number;
    /**
     * Multiple on Invested Capital
     */
    moic?: number;
    /**
     * Return on Investment
     */
    roi?: number;
    /**
     * Payback Period in years
     */
    payback_period?: number;
    /**
     * Total Value to Paid-In
     */
    tvpi?: number;
    /**
     * Distributions to Paid-In
     */
    dpi?: number;
    /**
     * Residual Value to Paid-In
     */
    rvpi?: number;
    /**
     * Paid-In Capital
     */
    pic?: number;
    /**
     * LP Internal Rate of Return
     */
    lpIrr?: number;
    /**
     * LP Multiple on Invested Capital
     */
    lpMultiple?: number;
    /**
     * GP Internal Rate of Return
     */
    gpIrr?: number;
    /**
     * Default Rate
     */
    defaultRate?: number;
    /**
     * Sharpe Ratio
     */
    sharpeRatio?: number;
    /**
     * Sortino Ratio
     */
    sortinoRatio?: number;
    /**
     * Maximum Drawdown
     */
    maxDrawdown?: number;
    /**
     * Alpha
     */
    alpha?: number;
    /**
     * Beta
     */
    beta?: number;
    /**
     * Distribution Yield
     */
    distributionYield?: number;
    /**
     * Total Capital Calls
     */
    totalCapitalCalls?: number;
    /**
     * Total Distributions
     */
    totalDistributions?: number;
    /**
     * Net Cash Flow
     */
    netCashFlow?: number;
    /**
     * Year-to-Date Cash Flow
     */
    ytdCashFlow?: number;
    /**
     * Reinvestment Count
     */
    reinvestmentCount?: number;
    /**
     * Reinvestment Amount
     */
    reinvestmentAmount?: number;
    /**
     * Reinvestment Rate
     */
    reinvestmentRate?: number;
    /**
     * Zone Allocation
     */
    zoneAllocation?: {
        /**
         * Green Zone Allocation
         */
        green?: number;
        /**
         * Orange Zone Allocation
         */
        orange?: number;
        /**
         * Red Zone Allocation
         */
        red?: number;
    };
};

