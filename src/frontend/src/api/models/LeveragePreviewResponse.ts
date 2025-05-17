/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LeverageMetrics } from './LeverageMetrics';
export type LeveragePreviewResponse = {
    cash_flows?: Record<string, {
        interest?: number;
        commitment_fee?: number;
    }>;
    metrics?: LeverageMetrics;
};

