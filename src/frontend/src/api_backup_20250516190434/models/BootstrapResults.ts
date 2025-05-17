/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Results of bootstrap sequencing risk analysis.
 */
export type BootstrapResults = {
    /**
     * Status of the bootstrap analysis (success, skipped, error)
     */
    status?: string;
    /**
     * Number of bootstrap iterations
     */
    iterations?: number;
    /**
     * Distribution of IRR values from bootstrap samples
     */
    irr_distribution?: Array<number>;
    /**
     * Mean IRR across all bootstrap samples
     */
    mean_irr?: number;
    /**
     * 5th percentile IRR
     */
    percentile_5?: number;
    /**
     * 95th percentile IRR
     */
    percentile_95?: number;
};

