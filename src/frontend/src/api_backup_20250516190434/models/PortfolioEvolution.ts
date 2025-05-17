/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Portfolio evolution over time.
 */
export type PortfolioEvolution = {
    /**
     * Years or periods
     */
    years?: Array<number>;
    /**
     * Number of active loans by period
     */
    active_loans?: Array<number>;
    /**
     * Number of new loans by period
     */
    new_loans?: Array<number>;
    /**
     * Number of exited loans by period
     */
    exited_loans?: Array<number>;
    /**
     * Number of defaulted loans by period
     */
    defaulted_loans?: Array<number>;
    /**
     * Number of reinvestments by period
     */
    reinvestments?: Array<number>;
    /**
     * Amount reinvested by period
     */
    reinvested_amount?: Array<number>;
};

