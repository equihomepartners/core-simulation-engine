/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Root
     * Root endpoint.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static rootGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/',
        });
    }
    /**
     * Test Simulation
     * Trigger a test simulation with predefined parameters and send updates over WebSocket.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testSimulationApiSimulationsTestSimulationIdPost({
        simulationId,
    }: {
        simulationId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/simulations/test/{simulation_id}',
            path: {
                'simulation_id': simulationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
