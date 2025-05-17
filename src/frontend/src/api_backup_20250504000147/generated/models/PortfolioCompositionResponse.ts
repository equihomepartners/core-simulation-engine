/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response model for portfolio composition data.
 */
export type PortfolioCompositionResponse = {
    time_points: Array<string>;
    categories: Array<string>;
    values: Array<Array<number>>;
    percentages?: Array<Array<number>>;
    colors?: Record<string, string>;
};

