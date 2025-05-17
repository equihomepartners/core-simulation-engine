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
    revenue_sources?: (Record<string, number> | null);
    expense_breakdown?: (Record<string, (Array<string> | Array<number>)> | null);
    custom_expense_breakdown?: (Record<string, (Array<string> | Array<number>)> | null);
    yearly_revenue?: (Record<string, Array<number>> | null);
    cashflow_over_time?: (Record<string, Array<number>> | null);
    dividend_over_time?: (Record<string, Array<number>> | null);
    expenses_over_time?: (Record<string, Array<number>> | null);
    aum_over_time?: (Record<string, Array<number>> | null);
    team_allocation?: (Record<string, any> | null);
    carried_interest_distribution?: (Record<string, any> | null);
    management_fee_distribution?: (Record<string, any> | null);
    portfolio_composition?: (PortfolioCompositionResponse | null);
    geographic_distribution?: (GeographicDistributionResponse | null);
    loan_performance?: (Record<string, any> | null);
    exit_timing?: (Record<string, any> | null);
    waterfall_chart?: (Record<string, any> | null);
    sensitivity_analysis?: (Record<string, any> | null);
    comparative_metrics?: (Record<string, any> | null);
    time_series?: (Record<string, Record<string, any>> | null);
};

