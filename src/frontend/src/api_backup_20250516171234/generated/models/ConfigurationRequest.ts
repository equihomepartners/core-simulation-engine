/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request for saving a configuration.
 */
export type ConfigurationRequest = {
    /**
     * Name of the configuration
     */
    name: string;
    /**
     * Description of the configuration
     */
    description?: (string | null);
    /**
     * Configuration data
     */
    config: Record<string, any>;
};

