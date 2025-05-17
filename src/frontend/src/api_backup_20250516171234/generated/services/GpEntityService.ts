/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BasicEconomicsResponse } from '../models/BasicEconomicsResponse';
import type { GPCommitmentResponse } from '../models/GPCommitmentResponse';
import type { GPEntityCashflowsResponse } from '../models/GPEntityCashflowsResponse';
import type { GPEntityEconomicsResponse } from '../models/GPEntityEconomicsResponse';
import type { GPEntityMetricsResponse } from '../models/GPEntityMetricsResponse';
import type { ManagementCompanyResponse } from '../models/ManagementCompanyResponse';
import type { TeamEconomicsResponse } from '../models/TeamEconomicsResponse';
import type { VisualizationDataResponse } from '../models/VisualizationDataResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GpEntityService {
    /**
     * Get Gp Entity Economics
     * Get the GP entity economics for a completed simulation.
     *
     * Args:
     * simulation_id: ID of the simulation
     * token: Authentication token
     *
     * Returns:
     * GPEntityEconomicsResponse: GP entity economics
     *
     * Raises:
     * HTTPException: If the simulation is not found or not completed
     * @param simulationId
     * @returns GPEntityEconomicsResponse Successful Response
     * @throws ApiError
     */
    public static getGpEntityEconomicsGpEntitySimulationIdGet(
        simulationId: string,
    ): CancelablePromise<GPEntityEconomicsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/gp-entity/{simulation_id}',
            path: {
                'simulation_id': simulationId,
            },
            errors: {
                400: `Bad request`,
                401: `Unauthorized`,
                404: `Not found`,
                422: `Validation Error`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get Gp Entity Basic Economics
     * Get the basic GP entity economics for a completed simulation.
     *
     * Args:
     * simulation_id: ID of the simulation
     * token: Authentication token
     *
     * Returns:
     * BasicEconomicsResponse: Basic GP entity economics
     *
     * Raises:
     * HTTPException: If the simulation is not found or not completed
     * @param simulationId
     * @returns BasicEconomicsResponse Successful Response
     * @throws ApiError
     */
    public static getGpEntityBasicEconomicsGpEntitySimulationIdBasicGet(
        simulationId: string,
    ): CancelablePromise<BasicEconomicsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/gp-entity/{simulation_id}/basic',
            path: {
                'simulation_id': simulationId,
            },
            errors: {
                400: `Bad request`,
                401: `Unauthorized`,
                404: `Not found`,
                422: `Validation Error`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get Gp Entity Management Company
     * Get the management company metrics for a completed simulation.
     *
     * Args:
     * simulation_id: ID of the simulation
     * token: Authentication token
     *
     * Returns:
     * ManagementCompanyResponse: Management company metrics
     *
     * Raises:
     * HTTPException: If the simulation is not found or not completed
     * @param simulationId
     * @returns ManagementCompanyResponse Successful Response
     * @throws ApiError
     */
    public static getGpEntityManagementCompanyGpEntitySimulationIdManagementCompanyGet(
        simulationId: string,
    ): CancelablePromise<ManagementCompanyResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/gp-entity/{simulation_id}/management-company',
            path: {
                'simulation_id': simulationId,
            },
            errors: {
                400: `Bad request`,
                401: `Unauthorized`,
                404: `Not found`,
                422: `Validation Error`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get Gp Entity Team Economics
     * Get the team economics for a completed simulation.
     *
     * Args:
     * simulation_id: ID of the simulation
     * token: Authentication token
     *
     * Returns:
     * TeamEconomicsResponse: Team economics
     *
     * Raises:
     * HTTPException: If the simulation is not found or not completed
     * @param simulationId
     * @returns TeamEconomicsResponse Successful Response
     * @throws ApiError
     */
    public static getGpEntityTeamEconomicsGpEntitySimulationIdTeamEconomicsGet(
        simulationId: string,
    ): CancelablePromise<TeamEconomicsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/gp-entity/{simulation_id}/team-economics',
            path: {
                'simulation_id': simulationId,
            },
            errors: {
                400: `Bad request`,
                401: `Unauthorized`,
                404: `Not found`,
                422: `Validation Error`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get Gp Entity Gp Commitment
     * Get the GP commitment for a completed simulation.
     *
     * Args:
     * simulation_id: ID of the simulation
     * token: Authentication token
     *
     * Returns:
     * GPCommitmentResponse: GP commitment
     *
     * Raises:
     * HTTPException: If the simulation is not found or not completed
     * @param simulationId
     * @returns GPCommitmentResponse Successful Response
     * @throws ApiError
     */
    public static getGpEntityGpCommitmentGpEntitySimulationIdGpCommitmentGet(
        simulationId: string,
    ): CancelablePromise<GPCommitmentResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/gp-entity/{simulation_id}/gp-commitment',
            path: {
                'simulation_id': simulationId,
            },
            errors: {
                400: `Bad request`,
                401: `Unauthorized`,
                404: `Not found`,
                422: `Validation Error`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get Gp Entity Cashflows
     * Get the GP entity cashflows for a completed simulation.
     *
     * Args:
     * simulation_id: ID of the simulation
     * frequency: Frequency of cashflows (yearly or monthly)
     * token: Authentication token
     *
     * Returns:
     * GPEntityCashflowsResponse: GP entity cashflows
     *
     * Raises:
     * HTTPException: If the simulation is not found or not completed
     * @param simulationId
     * @param frequency Frequency of cashflows (yearly or monthly)
     * @returns GPEntityCashflowsResponse Successful Response
     * @throws ApiError
     */
    public static getGpEntityCashflowsGpEntitySimulationIdCashflowsGet(
        simulationId: string,
        frequency: string = 'yearly',
    ): CancelablePromise<GPEntityCashflowsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/gp-entity/{simulation_id}/cashflows',
            path: {
                'simulation_id': simulationId,
            },
            query: {
                'frequency': frequency,
            },
            errors: {
                400: `Bad request`,
                401: `Unauthorized`,
                404: `Not found`,
                422: `Validation Error`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get Gp Entity Metrics
     * Get the GP entity metrics for a completed simulation.
     *
     * Args:
     * simulation_id: ID of the simulation
     * token: Authentication token
     *
     * Returns:
     * GPEntityMetricsResponse: GP entity metrics
     *
     * Raises:
     * HTTPException: If the simulation is not found or not completed
     * @param simulationId
     * @returns GPEntityMetricsResponse Successful Response
     * @throws ApiError
     */
    public static getGpEntityMetricsGpEntitySimulationIdMetricsGet(
        simulationId: string,
    ): CancelablePromise<GPEntityMetricsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/gp-entity/{simulation_id}/metrics',
            path: {
                'simulation_id': simulationId,
            },
            errors: {
                400: `Bad request`,
                401: `Unauthorized`,
                404: `Not found`,
                422: `Validation Error`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get Gp Entity Visualization Data
     * Get the GP entity visualization data for a completed simulation.
     *
     * Args:
     * simulation_id: ID of the simulation
     * chart_type: Type of chart to retrieve (cashflows, revenue_sources, yearly_revenue, expense_breakdown, cashflow_over_time, dividend_over_time, team_allocation, portfolio_evolution, all)
     * time_granularity: Time granularity for time-series data (monthly, quarterly, yearly)
     * cumulative: Whether to return cumulative data for time-series charts
     * start_year: Start year for filtering time-series data
     * end_year: End year for filtering time-series data
     * token: Authentication token
     *
     * Returns:
     * VisualizationDataResponse: GP entity visualization data
     *
     * Raises:
     * HTTPException: If the simulation is not found or not completed
     * @param simulationId
     * @param chartType Type of chart to retrieve (cashflows, revenue_sources, yearly_revenue, expense_breakdown, cashflow_over_time, dividend_over_time, team_allocation, portfolio_evolution, all)
     * @param timeGranularity Time granularity for time-series data (monthly, quarterly, yearly)
     * @param cumulative Whether to return cumulative data for time-series charts
     * @param startYear Start year for filtering time-series data
     * @param endYear End year for filtering time-series data
     * @returns VisualizationDataResponse Successful Response
     * @throws ApiError
     */
    public static getGpEntityVisualizationDataGpEntitySimulationIdVisualizationGet(
        simulationId: string,
        chartType: string = 'all',
        timeGranularity: string = 'yearly',
        cumulative: boolean = false,
        startYear?: (number | null),
        endYear?: (number | null),
    ): CancelablePromise<VisualizationDataResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/gp-entity/{simulation_id}/visualization',
            path: {
                'simulation_id': simulationId,
            },
            query: {
                'chart_type': chartType,
                'time_granularity': timeGranularity,
                'cumulative': cumulative,
                'start_year': startYear,
                'end_year': endYear,
            },
            errors: {
                400: `Bad request`,
                401: `Unauthorized`,
                404: `Not found`,
                422: `Validation Error`,
                500: `Internal server error`,
            },
        });
    }
}
