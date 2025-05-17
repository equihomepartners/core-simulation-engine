/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LeverageConfig } from './LeverageConfig';
export type LeveragePreviewRequest = {
    /**
     * Mapping of year→NAV
     */
    nav_by_year: Record<string, number>;
    config: LeverageConfig;
};

