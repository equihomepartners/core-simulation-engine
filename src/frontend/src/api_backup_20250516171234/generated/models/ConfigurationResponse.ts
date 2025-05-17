/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response for a configuration operation.
 */
export type ConfigurationResponse = {
    /**
     * Unique ID for the configuration
     */
    id: string;
    /**
     * Name of the configuration
     */
    name: string;
    /**
     * Description of the configuration
     */
    description: string;
    /**
     * Configuration data
     */
    config: Record<string, any>;
    /**
     * Creation time (Unix timestamp)
     */
    created_at: number;
    /**
     * Last update time (Unix timestamp)
     */
    updated_at: number;
};

