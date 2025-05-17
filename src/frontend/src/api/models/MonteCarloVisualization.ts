/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type MonteCarloDistributionModel = {
    labels?: Array<number>;
    datasets?: Array<MonteCarloChartDataset>;
    statistics?: MonteCarloStatistics;
};

export type MonteCarloSensitivityModel = {
    labels?: Array<string>;
    datasets?: Array<MonteCarloChartDataset>;
};

export type MonteCarloConfidenceModel = {
    mean?: number | null;
    median?: number | null;
    confidence_intervals?: {
        p10_p90?: [number | null, number | null];
        p25_p75?: [number | null, number | null];
    };
};

export type MonteCarloVisualization =
    | { type: 'distribution'; data: MonteCarloDistributionModel }
    | { type: 'sensitivity'; data: MonteCarloSensitivityModel }
    | { type: 'confidence'; data: MonteCarloConfidenceModel };

export type MonteCarloChartDataset = {
    label?: string;
    data?: Array<number>;
    color?: string | null;
};

export type MonteCarloStatistics = {
    min?: number | null;
    max?: number | null;
    mean?: number | null;
    median?: number | null;
    std_dev?: number | null;
    percentiles?: {
        p10?: number | null;
        p25?: number | null;
        p50?: number | null;
        p75?: number | null;
        p90?: number | null;
    };
};
