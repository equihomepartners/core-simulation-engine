/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * List of simulations with pagination info.
 */
export type SimulationList = {
    /**
     * List of simulations
     */
    simulations: Array<{
        /**
         * Unique ID for the simulation
         */
        simulation_id?: string;
        /**
         * Status of the simulation
         */
        status?: string;
        /**
         * Progress of the simulation (0-1)
         */
        progress?: number;
        /**
         * Creation time (Unix timestamp)
         */
        created_at?: number;
        /**
         * Last update time (Unix timestamp)
         */
        updated_at?: number;
    }>;
    /**
     * Total number of simulations matching the filter
     */
    total: number;
    /**
     * Maximum number of simulations returned
     */
    limit: number;
    /**
     * Offset for pagination
     */
    offset: number;
};

