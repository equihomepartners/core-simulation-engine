/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BasicEconomicsResponse } from './BasicEconomicsResponse';
import type { GPCommitmentResponse } from './GPCommitmentResponse';
import type { GPEntityCashflowsResponse } from './GPEntityCashflowsResponse';
import type { GPEntityMetricsResponse } from './GPEntityMetricsResponse';
import type { ManagementCompanyResponse } from './ManagementCompanyResponse';
import type { TeamEconomicsResponse } from './TeamEconomicsResponse';
import type { VisualizationDataResponse } from './VisualizationDataResponse';
/**
 * Response model for GP entity economics.
 */
export type GPEntityEconomicsResponse = {
    basic_economics: BasicEconomicsResponse;
    management_company: ManagementCompanyResponse;
    team_economics: TeamEconomicsResponse;
    gp_commitment: GPCommitmentResponse;
    cashflows: GPEntityCashflowsResponse;
    metrics: GPEntityMetricsResponse;
    visualization_data: VisualizationDataResponse;
};

