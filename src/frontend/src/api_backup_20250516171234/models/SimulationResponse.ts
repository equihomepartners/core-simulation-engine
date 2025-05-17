/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response for a simulation creation request.
 */
export type SimulationResponse = {
    /**
     * Unique ID for the simulation
     */
    simulation_id: string;
    /**
     * Status of the simulation (created, running, completed, or failed)
     */
    status: string;
};

