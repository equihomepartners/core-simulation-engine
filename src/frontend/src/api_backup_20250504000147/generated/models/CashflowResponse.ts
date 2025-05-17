/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response model for a single cashflow.
 */
export type CashflowResponse = {
    management_fees: number;
    carried_interest: number;
    origination_fees: number;
    additional_revenue: number;
    total_revenue: number;
    base_expenses: number;
    custom_expenses: number;
    expense_breakdown: Record<string, number>;
    total_expenses: number;
    net_income: number;
    dividend: number;
    cash_reserve: number;
};

