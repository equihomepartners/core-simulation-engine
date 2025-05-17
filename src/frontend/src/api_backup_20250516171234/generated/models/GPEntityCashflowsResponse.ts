/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CashflowResponse } from './CashflowResponse';
/**
 * Response model for GP entity cashflows.
 */
export type GPEntityCashflowsResponse = {
    yearly: Record<string, CashflowResponse>;
    monthly: Record<string, CashflowResponse>;
};

