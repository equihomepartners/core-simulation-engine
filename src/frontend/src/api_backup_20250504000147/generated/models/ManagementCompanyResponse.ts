/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExpenseBreakdownResponse } from './ExpenseBreakdownResponse';
import type { StaffGrowthResponse } from './StaffGrowthResponse';
/**
 * Response model for management company metrics.
 */
export type ManagementCompanyResponse = {
    yearly_expenses: Record<string, number>;
    total_expenses: number;
    yearly_additional_revenue: Record<string, number>;
    total_additional_revenue: number;
    expense_breakdown: ExpenseBreakdownResponse;
    staff_growth: StaffGrowthResponse;
    yearly_aum: Record<string, number>;
    yearly_fund_count: Record<string, number>;
    yearly_loan_count: Record<string, number>;
};

