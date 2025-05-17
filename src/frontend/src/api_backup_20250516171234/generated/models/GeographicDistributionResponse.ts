/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response model for geographic distribution data.
 */
export type GeographicDistributionResponse = {
    regions: Array<Record<string, any>>;
    values: Record<string, number>;
    metrics?: (Record<string, Record<string, number>> | null);
};

