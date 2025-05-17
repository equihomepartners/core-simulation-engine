/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Status of a simulation.
 */
export type SimulationStatus = {
    /**
     * Unique ID for the simulation
     */
    simulation_id: string;
    /**
     * Status of the simulation (created, running, completed, failed, or cancelled)
     */
    status: string;
    /**
     * Progress of the simulation (0-1)
     */
    progress: number;
    /**
     * Current step of the simulation
     */
    current_step?: string | null;
    /**
     * Estimated completion time (Unix timestamp)
     */
    estimated_completion_time?: number | null;
    /**
     * Creation time (Unix timestamp)
     */
    created_at: number;
    /**
     * Last update time (Unix timestamp)
     */
    updated_at: number;
    /**
     * Partial results if available
     */
    partial_results?: Record<string, any> | null;
};

