/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response model for team economics.
 */
export type TeamEconomicsResponse = {
    partner_carried_interest: Record<string, number>;
    employee_carried_interest: Record<string, number>;
    partner_management_fees: Record<string, number>;
    employee_management_fees: Record<string, number>;
    partner_origination_fees: Record<string, number>;
    employee_origination_fees: Record<string, number>;
    partner_total_compensation: Record<string, number>;
    employee_total_compensation: Record<string, number>;
    total_partner_allocation: number;
    total_employee_allocation: number;
    yearly_allocations: Record<string, Record<string, Record<string, Record<string, number>>>>;
};

