/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Value-at-Risk by origination vintage derived from Monte-Carlo simulations.
 */
export type VintageVarResults = {
    /**
     * Status of the analysis (success, skipped, error)
     */
    status?: string;
    /**
     * Mapping of vintage year to VaR information
     */
    vintage_var?: Record<string, {
        /**
         * Percentile used for VaR (e.g. 5)
         */
        percentile?: number;
        /**
         * IRR at the specified downside percentile
         */
        value_at_risk?: number;
    }>;
};

