/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HealthService {
    /**
     * Health Check
     * Health check endpoint.
     *
     * Returns basic information about the server and its status.
     *
     * Returns:
     * Dict with server status information
     * @returns any Successful Response
     * @throws ApiError
     */
    public static healthCheckHealthGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
        });
    }
    /**
     * Ping
     * Simple ping endpoint.
     *
     * Returns a simple response to check if the server is running.
     *
     * Returns:
     * Dict with pong message
     * @returns any Successful Response
     * @throws ApiError
     */
    public static pingHealthPingGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health/ping',
        });
    }
    /**
     * Api Ping
     * Simple ping endpoint for the /api/health/ping path.
     *
     * This is a duplicate of the /health/ping endpoint to support
     * frontend requests that use the /api prefix.
     *
     * Returns:
     * Dict with pong message
     * @returns any Successful Response
     * @throws ApiError
     */
    public static apiPingApiHealthPingGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/health/ping',
        });
    }
}
