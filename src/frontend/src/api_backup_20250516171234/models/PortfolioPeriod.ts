/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Portfolio data for a single period.
 */
export type PortfolioPeriod = {
    /**
     * Year or period number
     */
    year?: number;
    /**
     * Number of active loans
     */
    activeLoans?: number;
    /**
     * Number of exited loans
     */
    exitedLoans?: number;
    /**
     * Number of new loans
     */
    newLoans?: number;
    /**
     * Number of defaulted loans
     */
    defaultedLoans?: number;
    /**
     * Number of reinvestments
     */
    reinvestments?: number;
    /**
     * Amount reinvested
     */
    reinvestedAmount?: number;
    /**
     * Portfolio value
     */
    portfolioValue?: number;
};

