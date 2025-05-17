/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GeographicDistributionResponse } from './GeographicDistributionResponse';
import type { PortfolioCompositionResponse } from './PortfolioCompositionResponse';
/**
 * Response model for visualization data.
 */
export type VisualizationDataResponse = {
    revenue_sources?: Record<string, number>;
    expense_breakdown?: Record<string, (Array<string> | Array<number>)>;
    custom_expense_breakdown?: Record<string, (Array<string> | Array<number>)>;
    yearly_revenue?: Record<string, Array<number>>;
    cashflow_over_time?: Record<string, Array<number>>;
    dividend_over_time?: Record<string, Array<number>>;
    expenses_over_time?: Record<string, Array<number>>;
    aum_over_time?: Record<string, Array<number>>;
    team_allocation?: Record<string, any>;
    carried_interest_distribution?: Record<string, any>;
    management_fee_distribution?: Record<string, any>;
    portfolio_composition?: PortfolioCompositionResponse;
    geographic_distribution?: GeographicDistributionResponse;
    loan_performance?: Record<string, any>;
    exit_timing?: Record<string, any>;
    waterfall_chart?: Record<string, any>;
    sensitivity_analysis?: Record<string, any>;
    comparative_metrics?: Record<string, any>;
    time_series?: Record<string, Record<string, any>>;
};

