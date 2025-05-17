/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SimulationConfig } from './SimulationConfig';
/**
 * Detailed information about a simulation.
 */
export type SimulationDetail = {
    /**
     * Unique ID for the simulation
     */
    simulation_id: string;
    /**
     * Name of the simulation
     */
    name?: string;
    /**
     * Description of the simulation
     */
    description?: string;
    /**
     * Status of the simulation (created, running, completed, failed, or cancelled)
     */
    status: string;
    /**
     * Progress of the simulation (0-1)
     */
    progress?: number;
    /**
     * Current step of the simulation
     */
    current_step?: string | null;
    /**
     * Creation time (Unix timestamp)
     */
    created_at?: number;
    /**
     * Last update time (Unix timestamp)
     */
    updated_at?: number;
    config?: SimulationConfig;
    /**
     * Error information if the simulation failed
     */
    error?: {
        /**
         * Error message
         */
        message?: string;
        /**
         * Error details
         */
        details?: Record<string, any> | null;
    } | null;
};

