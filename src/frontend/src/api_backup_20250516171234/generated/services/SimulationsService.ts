/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SimulationConfig } from '../models/SimulationConfig';
import type { SimulationResponse } from '../models/SimulationResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SimulationsService {
    /**
     * Create Simulation
     * Create and run a new simulation.
     *
     * Args:
     * config: Configuration for the simulation
     * background_tasks: Background tasks for running the simulation
     * token: Authentication token
     *
     * Returns:
     * SimulationResponse: Response with simulation ID and status
     * @param requestBody
     * @returns SimulationResponse Successful Response
     * @throws ApiError
     */
    public static createSimulationApiSimulationsPost(
        requestBody: SimulationConfig,
    ): CancelablePromise<SimulationResponse> {
        return __request(OpenAPI, {
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
     * List Simulations
     * List all simulations.
     *
     * Args:
     * status: Filter by status (created, running, completed, or failed)
     * limit: Maximum number of simulations to return
     * offset: Offset for pagination
     *
     * Returns:
     * Dict[str, Any]: List of simulations and pagination info
     * @param status
     * @param limit
     * @param offset
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listSimulationsApiSimulationsGet(
        status?: (string | null),
        limit: number = 10,
        offset?: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
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
     * Get Simulation Status
     * Get the status of a simulation.
     *
     * Args:
     * simulation_id: ID of the simulation
     * include_partial_results: Whether to include partial results in the response
     *
     * Returns:
     * Dict: Status of the simulation with optional partial results
     *
     * Raises:
     * HTTPException: If the simulation is not found
     * @param simulationId
     * @param includePartialResults Include partial results in the response
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getSimulationStatusApiSimulationsSimulationIdStatusGet(
        simulationId: string,
        includePartialResults: boolean = false,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
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
     * Get Simulation
     * Get a simulation by ID.
     *
     * This endpoint returns the simulation metadata including configuration
     * parameters, status, and creation time. It doesn't include the full
     * results, which are available through the /results endpoint.
     *
     * Args:
     * simulation_id: ID of the simulation
     * token: Authentication token
     *
     * Returns:
     * Dict[str, Any]: Simulation data
     *
     * Raises:
     * HTTPException: If the simulation is not found
     * @param simulationId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getSimulationApiSimulationsSimulationIdGet(
        simulationId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
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
     * Args:
     * simulation_id: ID of the simulation
     * token: Authentication token
     *
     * Returns:
     * Dict[str, str]: Success message
     *
     * Raises:
     * HTTPException: If the simulation is not found
     * @param simulationId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteSimulationApiSimulationsSimulationIdDelete(
        simulationId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
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
     * Get Simulation Results
     * @backend
     * Get the results of a completed simulation, supporting both yearly and monthly granularity.
     * Args:
     * simulation_id: ID of the simulation
     * time_granularity: 'yearly' or 'monthly'
     * Returns:
     * Dict[str, Any]: Simulation results
     * Raises:
     * HTTPException: If the simulation is not found or not completed
     * @param simulationId
     * @param timeGranularity Time granularity for results (yearly or monthly)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getSimulationResultsApiSimulationsSimulationIdResultsGet(
        simulationId: string,
        timeGranularity: string = 'yearly',
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
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
     * Args:
     * simulation_id: ID of the simulation to cancel
     *
     * Returns:
     * Dict[str, Any]: Response with status message
     *
     * Raises:
     * HTTPException: If the simulation is not found or not in a cancellable state
     * @param simulationId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static cancelSimulationApiSimulationsSimulationIdCancelPost(
        simulationId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
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
     * @backend
     * Get visualization data for a simulation, supporting both yearly and monthly granularity and advanced chart types.
     * Args:
     * simulation_id: ID of the simulation
     * chart_type: Type of chart to retrieve (basic, fan, heatmap, tornado, multi_dim_sensitivity, correlation_matrix, etc.)
     * time_granularity: 'yearly' or 'monthly'
     * ...
     * Returns:
     * Dict[str, Any]: Visualization data
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
    public static getSimulationVisualizationApiSimulationsSimulationIdVisualizationGet(
        simulationId: string,
        chartType: string = 'all',
        timeGranularity: string = 'yearly',
        cumulative: boolean = false,
        startYear?: (number | null),
        endYear?: (number | null),
        format: string = 'bar',
        metrics?: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
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
    public static getMonteCarloVisualizationApiSimulationsSimulationIdMonteCarloVisualizationGet(
        simulationId: string,
        chartType: string = 'distribution',
        format: string = 'irr',
        metrics?: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
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
    public static getSimulationLoansApiSimulationsSimulationIdLoansGet(
        simulationId: string,
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
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
    public static getSimulationLoanApiSimulationsSimulationIdLoansLoanIdGet(
        simulationId: string,
        loanId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
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
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getPortfolioEvolutionApiSimulationsSimulationIdPortfolioEvolutionGet(
        simulationId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
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
    public static getRecyclingAnalyticsApiSimulationsSimulationIdRecyclingGet(
        simulationId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
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
    public static getCohortAnalyticsApiSimulationsSimulationIdCohortsGet(
        simulationId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
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
    public static exportSimulationApiSimulationsSimulationIdExportGet(
        simulationId: string,
        format: string = 'json',
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
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
     * Run Simulation
     * Run an existing simulation.
     *
     * Args:
     * simulation_id: ID of the simulation to run
     * background_tasks: Background tasks for running the simulation
     *
     * Returns:
     * Dict: Status of the simulation
     *
     * Raises:
     * HTTPException: If the simulation is not found
     * @param simulationId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static runSimulationApiSimulationsSimulationIdRunPost(
        simulationId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/simulations/{simulation_id}/run',
            path: {
                'simulation_id': simulationId,
            },
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
}
