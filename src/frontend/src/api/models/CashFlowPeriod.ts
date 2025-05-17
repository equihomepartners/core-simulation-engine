/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Cash flow data for a single period.
 */
export type CashFlowPeriod = {
    /**
     * Year or period number
     */
    year?: number;
    /**
     * Capital calls for the period
     */
    capitalCalls?: number;
    /**
     * Distributions for the period
     */
    distributions?: number;
    /**
     * Net cash flow for the period
     */
    net?: number;
};

