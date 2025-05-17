/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PortfolioEvolution } from '../models/PortfolioEvolution';
import type { SimulationConfig } from '../models/SimulationConfig';
import type { SimulationDetail } from '../models/SimulationDetail';
import type { SimulationList } from '../models/SimulationList';
import type { SimulationResponse } from '../models/SimulationResponse';
import type { SimulationResults } from '../models/SimulationResults';
import type { SimulationStatus } from '../models/SimulationStatus';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class DefaultService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List Simulations
     * List all simulations.
     *
     * @param status Filter by status (created, running, completed, or failed)
     * @param limit Maximum number of simulations to return
     * @param offset Offset for pagination
     * @returns SimulationList Successful Response
     * @throws ApiError
     */
    public getApiSimulations(
        status?: 'created' | 'running' | 'completed' | 'failed' | 'cancelled',
        limit: number = 10,
        offset?: number,
    ): CancelablePromise<SimulationList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/simulations/',
            query: {
                'status': status,
                'limit': limit,
                'offset': offset,
            },
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Simulation
     * Create and run a new simulation.
     *
     * @param requestBody
     * @returns SimulationResponse Successful Response
     * @throws ApiError
     */
    public postApiSimulations(
        requestBody: SimulationConfig,
    ): CancelablePromise<SimulationResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/simulations/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Simulation
     * Get a simulation by ID.
     *
     * This endpoint returns the simulation metadata including configuration
     * parameters, status, and creation time. It doesn't include the full
     * results, which are available through the /results endpoint.
     *
     * @param simulationId
     * @returns SimulationDetail Successful Response
     * @throws ApiError
     */
    public getApiSimulations1(
        simulationId: string,
    ): CancelablePromise<SimulationDetail> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/simulations/{simulation_id}',
            path: {
                'simulation_id': simulationId,
            },
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Simulation
     * Delete a simulation.
     *
     * @param simulationId
     * @returns any Successful Response
     * @throws ApiError
     */
    public deleteApiSimulations(
        simulationId: string,
    ): CancelablePromise<{
        message?: string;
    }> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/simulations/{simulation_id}',
            path: {
                'simulation_id': simulationId,
            },
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Simulation Status
     * Get the status of a simulation.
     *
     * @param simulationId
     * @param includePartialResults Include partial results in the response
     * @returns SimulationStatus Successful Response
     * @throws ApiError
     */
    public getApiSimulationsStatus(
        simulationId: string,
        includePartialResults: boolean = false,
    ): CancelablePromise<SimulationStatus> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/simulations/{simulation_id}/status',
            path: {
                'simulation_id': simulationId,
            },
            query: {
                'include_partial_results': includePartialResults,
            },
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Simulation Results
     * Get the results of a completed simulation, supporting both yearly and monthly granularity.
     *
     * @param simulationId
     * @param timeGranularity Time granularity for results (yearly or monthly)
     * @returns SimulationResults Successful Response
     * @throws ApiError
     */
    public getApiSimulationsResults(
        simulationId: string,
        timeGranularity: 'yearly' | 'monthly' = 'yearly',
    ): CancelablePromise<SimulationResults> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/simulations/{simulation_id}/results',
            path: {
                'simulation_id': simulationId,
            },
            query: {
                'time_granularity': timeGranularity,
            },
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cancel Simulation
     * Cancel a running simulation without deleting its data.
     *
     * This endpoint stops the background processing of a simulation
     * but keeps any partial results and marks the simulation as 'cancelled'.
     *
     * @param simulationId
     * @returns any Successful Response
     * @throws ApiError
     */
    public postApiSimulationsCancel(
        simulationId: string,
    ): CancelablePromise<{
        message?: string;
        simulation_id?: string;
        status?: string;
        progress?: number;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/simulations/{simulation_id}/cancel',
            path: {
                'simulation_id': simulationId,
            },
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Simulation Visualization
     * Get visualization data for a simulation, supporting both yearly and monthly granularity and advanced chart types.
     *
     * @param simulationId
     * @param chartType Type of chart to retrieve (basic, fan, heatmap, tornado, multi_dim_sensitivity, correlation_matrix, etc.)
     * @param timeGranularity Time granularity for time-series data
     * @param cumulative Whether to return cumulative data
     * @param startYear Start year for filtering
     * @param endYear End year for filtering
     * @param format Chart format (bar, line, pie, area, summary)
     * @param metrics Comma-separated list of metrics to include
     * @returns any Successful Response
     * @throws ApiError
     */
    public getApiSimulationsVisualization(
        simulationId: string,
        chartType: string = 'all',
        timeGranularity: string = 'yearly',
        cumulative: boolean = false,
        startYear?: number,
        endYear?: number,
        format: string = 'bar',
        metrics?: string,
    ): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/simulations/{simulation_id}/visualization',
            path: {
                'simulation_id': simulationId,
            },
            query: {
                'chart_type': chartType,
                'time_granularity': timeGranularity,
                'cumulative': cumulative,
                'start_year': startYear,
                'end_year': endYear,
                'format': format,
                'metrics': metrics,
            },
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Monte Carlo Visualization
     * Get Monte Carlo visualization data for a simulation.
     * @param simulationId
     * @param chartType Type of chart (distribution, sensitivity, confidence)
     * @param format Chart format (irr, multiple, default_rate)
     * @param metrics Comma-separated list of metrics to include
     * @returns any Successful Response
     * @throws ApiError
     */
    public getApiSimulationsMonteCarloVisualization(
        simulationId: string,
        chartType: string = 'distribution',
        format: string = 'irr',
        metrics?: string,
    ): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/simulations/{simulation_id}/monte-carlo/visualization',
            path: {
                'simulation_id': simulationId,
            },
            query: {
                'chart_type': chartType,
                'format': format,
                'metrics': metrics,
            },
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Simulation Loans
     * Get all loans with analytics for a simulation.
     * @param simulationId
     * @returns any Successful Response
     * @throws ApiError
     */
    public getApiSimulationsLoans(
        simulationId: string,
    ): CancelablePromise<Array<Record<string, any>>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/simulations/{simulation_id}/loans/',
            path: {
                'simulation_id': simulationId,
            },
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Simulation Loan
     * Get analytics for a single loan.
     * @param simulationId
     * @param loanId
     * @returns any Successful Response
     * @throws ApiError
     */
    public getApiSimulationsLoans1(
        simulationId: string,
        loanId: string,
    ): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/simulations/{simulation_id}/loans/{loan_id}/',
            path: {
                'simulation_id': simulationId,
                'loan_id': loanId,
            },
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Portfolio Evolution
     * Get portfolio evolution time series for a simulation.
     * @param simulationId
     * @returns PortfolioEvolution Successful Response
     * @throws ApiError
     */
    public getApiSimulationsPortfolioEvolution(
        simulationId: string,
    ): CancelablePromise<PortfolioEvolution> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/simulations/{simulation_id}/portfolio-evolution/',
            path: {
                'simulation_id': simulationId,
            },
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Recycling Analytics
     * Get recycling ratio and capital velocity for a simulation.
     * @param simulationId
     * @returns any Successful Response
     * @throws ApiError
     */
    public getApiSimulationsRecycling(
        simulationId: string,
    ): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/simulations/{simulation_id}/recycling/',
            path: {
                'simulation_id': simulationId,
            },
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Cohort Analytics
     * Get cohort/time-slice analytics for a simulation.
     * @param simulationId
     * @returns any Successful Response
     * @throws ApiError
     */
    public getApiSimulationsCohorts(
        simulationId: string,
    ): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/simulations/{simulation_id}/cohorts/',
            path: {
                'simulation_id': simulationId,
            },
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Export Simulation
     * Export simulation analytics as CSV or JSON.
     * @param simulationId
     * @param format
     * @returns any Successful Response
     * @throws ApiError
     */
    public getApiSimulationsExport(
        simulationId: string,
        format: string = 'json',
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/simulations/{simulation_id}/export/',
            path: {
                'simulation_id': simulationId,
            },
            query: {
                'format': format,
            },
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Health Check
     * Health check endpoint.
     * @returns any Successful Response
     * @throws ApiError
     */
    public getApiHealth(): CancelablePromise<{
        status?: string;
        timestamp?: string;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/health',
        });
    }
}
