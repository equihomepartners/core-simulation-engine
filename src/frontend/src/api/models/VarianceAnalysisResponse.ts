/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Response for a variance analysis request.
 */
export type VarianceAnalysisResponse = {
  /**
   * Summary statistics for key metrics
   */
  summary: {
    irr?: {
      irr?: {
        p5?: number;
        p25?: number;
        p50?: number;
        p75?: number;
        p95?: number;
      };
    };
    equity_multiple?: {
      equity_multiple?: {
        p5?: number;
        p25?: number;
        p50?: number;
        p75?: number;
        p95?: number;
      };
    };
    roi?: {
      roi?: {
        p5?: number;
        p25?: number;
        p50?: number;
        p75?: number;
        p95?: number;
      };
    };
    var_95?: number;
    cvar_95?: number;
  };
  /**
   * Histogram data for visualization
   */
  histograms: {
    irr?: {
      bins: Array<number>;
      counts: Array<number>;
      bin_edges: Array<number>;
    };
    equity_multiple?: {
      bins: Array<number>;
      counts: Array<number>;
      bin_edges: Array<number>;
    };
    roi?: {
      bins: Array<number>;
      counts: Array<number>;
      bin_edges: Array<number>;
    };
  };
  /**
   * Fan chart data for visualization
   */
  fan_chart: {
    years: Array<number>;
    p5: Array<number>;
    p25: Array<number>;
    p50: Array<number>;
    p75: Array<number>;
    p95: Array<number>;
  };
  /**
   * Raw simulation results
   */
  raw_results?: Array<Record<string, any>>;
};
