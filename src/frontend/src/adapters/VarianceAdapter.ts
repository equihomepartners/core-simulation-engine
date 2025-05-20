/**
 * Adapter for transforming variance analysis data for visualization.
 */

import { VarianceAnalysisResponse } from '../api/models/VarianceAnalysisResponse';

export interface FanChartData {
  years: number[];
  p5: number[];
  p25: number[];
  p50: number[];
  p75: number[];
  p95: number[];
}

export interface DispersionData {
  bins: number[];
  counts: number[];
  binEdges: number[];
  metric: string;
}

export interface VarianceAdapterOutput {
  fanChart: FanChartData;
  dispersion: {
    irr: DispersionData;
    equityMultiple: DispersionData;
    roi: DispersionData;
  };
  summary: {
    irr: {
      p5: number;
      p25: number;
      p50: number;
      p75: number;
      p95: number;
    };
    equityMultiple: {
      p5: number;
      p25: number;
      p50: number;
      p75: number;
      p95: number;
    };
    roi: {
      p5: number;
      p25: number;
      p50: number;
      p75: number;
      p95: number;
    };
  };
}

/**
 * Transforms variance analysis data for visualization.
 */
export class VarianceAdapter {
  /**
   * Transforms variance analysis data for visualization.
   * 
   * @param data - Variance analysis response from the API
   * @returns Transformed data for visualization
   */
  static transform(data: VarianceAnalysisResponse): VarianceAdapterOutput {
    if (!data) {
      throw new Error('No variance analysis data provided');
    }

    // Transform fan chart data
    const fanChart: FanChartData = {
      years: data.fan_chart?.years || [],
      p5: data.fan_chart?.p5 || [],
      p25: data.fan_chart?.p25 || [],
      p50: data.fan_chart?.p50 || [],
      p75: data.fan_chart?.p75 || [],
      p95: data.fan_chart?.p95 || [],
    };

    // Transform dispersion data
    const dispersion = {
      irr: this.transformHistogram(data.histograms?.irr, 'IRR'),
      equityMultiple: this.transformHistogram(data.histograms?.equity_multiple, 'Equity Multiple'),
      roi: this.transformHistogram(data.histograms?.roi, 'ROI'),
    };

    // Transform summary data
    const summary = {
      irr: this.transformSummary(data.summary?.irr?.irr),
      equityMultiple: this.transformSummary(data.summary?.equity_multiple?.equity_multiple),
      roi: this.transformSummary(data.summary?.roi?.roi),
    };

    return {
      fanChart,
      dispersion,
      summary,
    };
  }

  /**
   * Transforms histogram data.
   * 
   * @param histogram - Histogram data from the API
   * @param metric - Metric name
   * @returns Transformed histogram data
   */
  private static transformHistogram(histogram: any, metric: string): DispersionData {
    if (!histogram) {
      return {
        bins: [],
        counts: [],
        binEdges: [],
        metric,
      };
    }

    return {
      bins: histogram.bins || [],
      counts: histogram.counts || [],
      binEdges: histogram.bin_edges || [],
      metric,
    };
  }

  /**
   * Transforms summary data.
   * 
   * @param summary - Summary data from the API
   * @returns Transformed summary data
   */
  private static transformSummary(summary: any): any {
    if (!summary) {
      return {
        p5: 0,
        p25: 0,
        p50: 0,
        p75: 0,
        p95: 0,
      };
    }

    return {
      p5: summary.p5 || 0,
      p25: summary.p25 || 0,
      p50: summary.p50 || 0,
      p75: summary.p75 || 0,
      p95: summary.p95 || 0,
    };
  }
}
