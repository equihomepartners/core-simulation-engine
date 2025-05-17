/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfigurationList } from '../models/ConfigurationList';
import type { ConfigurationRequest } from '../models/ConfigurationRequest';
import type { ConfigurationResponse } from '../models/ConfigurationResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ConfigsService {
    /**
     * Get Configurations
     * Get all configurations.
     *
     * Returns:
     * ConfigurationList: List of configurations
     * @returns ConfigurationList Successful Response
     * @throws ApiError
     */
    public static getConfigurationsApiConfigsGet(): CancelablePromise<ConfigurationList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/configs/',
            errors: {
                404: `Not found`,
            },
        });
    }
    /**
     * Save Configuration
     * Save a configuration.
     *
     * Args:
     * request: Configuration request
     *
     * Returns:
     * ConfigurationResponse: Saved configuration
     * @param requestBody
     * @returns ConfigurationResponse Successful Response
     * @throws ApiError
     */
    public static saveConfigurationApiConfigsPost(
        requestBody: ConfigurationRequest,
    ): CancelablePromise<ConfigurationResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/configs/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Configuration
     * Get a configuration by ID.
     *
     * Args:
     * config_id: ID of the configuration
     *
     * Returns:
     * ConfigurationResponse: Configuration data
     *
     * Raises:
     * HTTPException: If the configuration is not found
     * @param configId
     * @returns ConfigurationResponse Successful Response
     * @throws ApiError
     */
    public static getConfigurationApiConfigsConfigIdGet(
        configId: string,
    ): CancelablePromise<ConfigurationResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/configs/{config_id}',
            path: {
                'config_id': configId,
            },
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Configuration
     * Update a configuration.
     *
     * Args:
     * config_id: ID of the configuration
     * request: Configuration request
     *
     * Returns:
     * ConfigurationResponse: Updated configuration
     *
     * Raises:
     * HTTPException: If the configuration is not found
     * @param configId
     * @param requestBody
     * @returns ConfigurationResponse Successful Response
     * @throws ApiError
     */
    public static updateConfigurationApiConfigsConfigIdPut(
        configId: string,
        requestBody: ConfigurationRequest,
    ): CancelablePromise<ConfigurationResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/configs/{config_id}',
            path: {
                'config_id': configId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Configuration
     * Delete a configuration.
     *
     * Args:
     * config_id: ID of the configuration
     *
     * Returns:
     * Dict: Success message
     *
     * Raises:
     * HTTPException: If the configuration is not found
     * @param configId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteConfigurationApiConfigsConfigIdDelete(
        configId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/configs/{config_id}',
            path: {
                'config_id': configId,
            },
            errors: {
                404: `Not found`,
                422: `Validation Error`,
            },
        });
    }
}
