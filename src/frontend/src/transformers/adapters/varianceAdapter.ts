export interface VarianceFanChartSeries {
  label: string;
  data: number[];
  color?: string;
}

export interface VarianceFanChart {
  labels: number[];
  series: VarianceFanChartSeries[];
}

export interface DispersionOverlayData {
  labels: string[];
  values: number[];
}

export interface VarianceAnalysisModel {
  fanChart: VarianceFanChart | null;
  dispersion: DispersionOverlayData | null;
}

import { safeExtract } from '../core/utils';
import { wrapTransformError, logTransformWarning } from '../core/errorHandling';

export namespace VarianceAdapter {
  export const transform = wrapTransformError((apiResponse: any): VarianceAnalysisModel => {
    if (!apiResponse) {
      logTransformWarning('Empty API response for variance analysis', apiResponse);
      return { fanChart: null, dispersion: null };
    }

    const fanChart = transformFanChart(apiResponse.fan_chart || apiResponse.fanChart);
    const dispersion = transformDispersion(apiResponse.dispersion);

    return { fanChart, dispersion };
  }, 'Variance analysis transformation error');

  function transformFanChart(data: any): VarianceFanChart | null {
    if (!data) return null;
    const labels = safeExtract(data, ['labels'], []);
    const series: VarianceFanChartSeries[] = [];

    const p5 = safeExtract(data, ['p5'], null);
    const p10 = safeExtract(data, ['p10'], null);
    const p50 = safeExtract(data, ['p50'], null);
    const p90 = safeExtract(data, ['p90'], null);
    const p95 = safeExtract(data, ['p95'], null);
    const mean = safeExtract(data, ['mean'], null);

    if (Array.isArray(p5)) series.push({ label: 'P5', data: p5 });
    if (Array.isArray(p10)) series.push({ label: 'P10', data: p10 });
    if (Array.isArray(p50)) series.push({ label: 'P50', data: p50 });
    if (Array.isArray(p90)) series.push({ label: 'P90', data: p90 });
    if (Array.isArray(p95)) series.push({ label: 'P95', data: p95 });
    if (Array.isArray(mean)) series.push({ label: 'Mean', data: mean });

    return { labels, series };
  }

  function transformDispersion(data: any): DispersionOverlayData | null {
    if (!data) return null;
    const labels = safeExtract(data, ['labels'], []);
    const values = safeExtract(data, ['values'], []);
    return { labels, values };
  }
}
