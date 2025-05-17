/**
 * Monte Carlo adapter for transforming Monte Carlo API responses
 */
import { 
  MonteCarloResult, 
  MonteCarloDistributionModel, 
  MonteCarloSensitivityModel, 
  MonteCarloConfidenceModel 
} from '../models/monteCarlo';
import { safeExtract, normalize } from '../core/utils';
import { wrapTransformError, logTransformWarning } from '../core/errorHandling';

export namespace MonteCarloAdapter {
  /**
   * Transforms Monte Carlo API response to standardized model
   * @param apiResponse The raw API response
   * @param resultType The type of Monte Carlo result (distribution, sensitivity, confidence)
   * @param metricType The metric type (irr, multiple, default_rate)
   * @returns Standardized Monte Carlo model
   */
  export const transform = wrapTransformError(
    (
      apiResponse: any, 
      resultType: 'distribution' | 'sensitivity' | 'confidence' = 'distribution',
      metricType: 'irr' | 'multiple' | 'default_rate' = 'irr'
    ): MonteCarloResult => {
      if (!apiResponse) {
        logTransformWarning('Empty API response for Monte Carlo data', apiResponse);
        return createEmptyMonteCarloResult(resultType);
      }

      // Different transformations based on result type
      switch (resultType) {
        case 'distribution':
          return {
            type: 'distribution',
            data: transformDistribution(apiResponse, metricType)
          };
        case 'sensitivity':
          return {
            type: 'sensitivity',
            data: transformSensitivity(apiResponse, metricType)
          };
        case 'confidence':
          return {
            type: 'confidence',
            data: transformConfidence(apiResponse, metricType)
          };
        default:
          logTransformWarning(`Unknown Monte Carlo result type: ${resultType}`, apiResponse);
          return createEmptyMonteCarloResult(resultType as any);
      }
    },
    'Monte Carlo transformation error'
  );

  /**
   * Transform distribution data
   */
  function transformDistribution(apiResponse: any, metricType: string): MonteCarloDistributionModel {
    // Extract data from API response
    const labels = safeExtract(apiResponse, ['labels'], []);
    const datasets = safeExtract(apiResponse, ['datasets'], []);
    const statistics = safeExtract(apiResponse, ['statistics'], {});

    // Format statistics
    const formattedStatistics = {
      min: normalize(statistics.min, null),
      max: normalize(statistics.max, null),
      mean: normalize(statistics.mean, null),
      median: normalize(statistics.median, null),
      std_dev: normalize(statistics.std_dev, null),
      percentiles: {
        p10: normalize(statistics.percentiles?.p10, null),
        p25: normalize(statistics.percentiles?.p25, null),
        p50: normalize(statistics.percentiles?.p50, null),
        p75: normalize(statistics.percentiles?.p75, null),
        p90: normalize(statistics.percentiles?.p90, null)
      }
    };

    // Format datasets
    const formattedDatasets = datasets.map((dataset: any) => ({
      label: dataset.label || `${metricType.toUpperCase()} Distribution`,
      data: Array.isArray(dataset.data) ? dataset.data : [],
      color: dataset.color
    }));

    return {
      labels,
      datasets: formattedDatasets,
      statistics: formattedStatistics
    };
  }

  /**
   * Transform sensitivity data
   */
  function transformSensitivity(apiResponse: any, metricType: string): MonteCarloSensitivityModel {
    // Extract data from API response
    const labels = safeExtract(apiResponse, ['labels'], []);
    const datasets = safeExtract(apiResponse, ['datasets'], []);

    // Format datasets
    const formattedDatasets = datasets.map((dataset: any) => ({
      label: dataset.label || `Impact on ${metricType.toUpperCase()}`,
      data: Array.isArray(dataset.data) ? dataset.data : [],
      color: dataset.color
    }));

    return {
      labels,
      datasets: formattedDatasets
    };
  }

  /**
   * Transform confidence data
   */
  function transformConfidence(apiResponse: any, metricType: string): MonteCarloConfidenceModel {
    // Extract data from API response
    const mean = normalize(safeExtract(apiResponse, ['mean'], null), null);
    const median = normalize(safeExtract(apiResponse, ['median'], null), null);
    const confidenceIntervals = safeExtract(apiResponse, ['confidence_intervals'], {});

    return {
      mean,
      median,
      confidence_intervals: {
        p10_p90: [
          normalize(confidenceIntervals?.p10_p90?.[0], null),
          normalize(confidenceIntervals?.p10_p90?.[1], null)
        ],
        p25_p75: [
          normalize(confidenceIntervals?.p25_p75?.[0], null),
          normalize(confidenceIntervals?.p25_p75?.[1], null)
        ]
      }
    };
  }

  /**
   * Create an empty Monte Carlo result
   */
  function createEmptyMonteCarloResult(
    resultType: 'distribution' | 'sensitivity' | 'confidence'
  ): MonteCarloResult {
    switch (resultType) {
      case 'distribution':
        return {
          type: 'distribution',
          data: {
            labels: [],
            datasets: [],
            statistics: {
              min: null,
              max: null,
              mean: null,
              median: null,
              std_dev: null,
              percentiles: {
                p10: null,
                p25: null,
                p50: null,
                p75: null,
                p90: null
              }
            }
          }
        };
      case 'sensitivity':
        return {
          type: 'sensitivity',
          data: {
            labels: [],
            datasets: []
          }
        };
      case 'confidence':
        return {
          type: 'confidence',
          data: {
            mean: null,
            median: null,
            confidence_intervals: {
              p10_p90: [null, null],
              p25_p75: [null, null]
            }
          }
        };
      default:
        return {
          type: 'distribution',
          data: {
            labels: [],
            datasets: [],
            statistics: {
              min: null,
              max: null,
              mean: null,
              median: null,
              std_dev: null,
              percentiles: {
                p10: null,
                p25: null,
                p50: null,
                p75: null,
                p90: null
              }
            }
          }
        };
    }
  }
} 