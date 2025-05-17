/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Results of 2-D parameter grid stress analysis.
 */
export type GridStressResults = {
    /**
     * Name of the parameter varied along the X-axis
     */
    axis_x?: string;
    /**
     * Name of the parameter varied along the Y-axis
     */
    axis_y?: string;
    /**
     * Scaling factors applied to the baseline for each axis
     */
    factors?: Array<number>;
    /**
     * Matrix of IRR values; rows correspond to Y-axis factors, columns to X-axis factors
     */
    irr_matrix?: Array<Array<number>>;
};

