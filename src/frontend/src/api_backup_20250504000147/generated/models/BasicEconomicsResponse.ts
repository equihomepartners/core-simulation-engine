/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response model for basic GP entity economics.
 */
export type BasicEconomicsResponse = {
    total_management_fees: number;
    total_origination_fees: number;
    total_carried_interest: number;
    total_catch_up: number;
    total_return_of_capital: number;
    total_distributions: number;
    total_revenue: number;
    yearly_management_fees: Record<string, number>;
    yearly_carried_interest: Record<string, number>;
    yearly_distributions: Record<string, number>;
    yearly_origination_fees: Record<string, number>;
    yearly_total_revenue: Record<string, number>;
};

