import { MonteCarloAdapter } from '../../src/transformers/adapters';

describe('MonteCarloAdapter', () => {
  describe('transform', () => {
    it('should transform distribution data correctly', () => {
      // Sample API response for distribution data
      const apiResponse = {
        labels: [0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.14, 0.15],
        datasets: [
          {
            label: 'IRR Distribution',
            data: [5, 10, 20, 35, 25, 15, 8, 2]
          }
        ],
        statistics: {
          min: 0.08,
          max: 0.15,
          mean: 0.12,
          median: 0.115,
          std_dev: 0.02,
          percentiles: {
            p10: 0.09,
            p25: 0.10,
            p50: 0.115,
            p75: 0.13,
            p90: 0.14
          }
        }
      };

      // Transform the data
      const result = MonteCarloAdapter.transform(apiResponse, 'distribution', 'irr');

      // Assert the result type and structure
      expect(result.type).toBe('distribution');
      expect(result.data.labels).toEqual(apiResponse.labels);
      expect(result.data.datasets).toHaveLength(1);
      expect(result.data.datasets[0].label).toBe('IRR Distribution');
      expect(result.data.datasets[0].data).toEqual(apiResponse.datasets[0].data);
      
      // Assert the statistics
      expect(result.data.statistics.min).toBe(0.08);
      expect(result.data.statistics.max).toBe(0.15);
      expect(result.data.statistics.mean).toBe(0.12);
      expect(result.data.statistics.median).toBe(0.115);
      expect(result.data.statistics.std_dev).toBe(0.02);
      expect(result.data.statistics.percentiles.p10).toBe(0.09);
      expect(result.data.statistics.percentiles.p25).toBe(0.10);
      expect(result.data.statistics.percentiles.p50).toBe(0.115);
      expect(result.data.statistics.percentiles.p75).toBe(0.13);
      expect(result.data.statistics.percentiles.p90).toBe(0.14);
    });

    it('should transform sensitivity data correctly', () => {
      // Sample API response for sensitivity data
      const apiResponse = {
        labels: ['appreciation_rate', 'default_rate', 'exit_timing', 'ltv_ratio', 'interest_rate'],
        datasets: [
          {
            label: 'Impact on IRR',
            data: [0.032, -0.028, 0.018, -0.015, 0.012]
          }
        ]
      };

      // Transform the data
      const result = MonteCarloAdapter.transform(apiResponse, 'sensitivity', 'irr');

      // Assert the result type and structure
      expect(result.type).toBe('sensitivity');
      expect(result.data.labels).toEqual(apiResponse.labels);
      expect(result.data.datasets).toHaveLength(1);
      expect(result.data.datasets[0].label).toBe('Impact on IRR');
      expect(result.data.datasets[0].data).toEqual(apiResponse.datasets[0].data);
    });

    it('should transform confidence data correctly', () => {
      // Sample API response for confidence data
      const apiResponse = {
        mean: 0.143,
        median: 0.145,
        confidence_intervals: {
          p10_p90: [0.11, 0.18],
          p25_p75: [0.125, 0.16]
        }
      };

      // Transform the data
      const result = MonteCarloAdapter.transform(apiResponse, 'confidence', 'irr');

      // Assert the result type and structure
      expect(result.type).toBe('confidence');
      expect(result.data.mean).toBe(0.143);
      expect(result.data.median).toBe(0.145);
      expect(result.data.confidence_intervals.p10_p90).toEqual([0.11, 0.18]);
      expect(result.data.confidence_intervals.p25_p75).toEqual([0.125, 0.16]);
    });

    it('should handle empty or null input correctly', () => {
      // Empty API response
      const emptyResult = MonteCarloAdapter.transform(null, 'distribution', 'irr');
      
      // Assert the result is a valid empty distribution
      expect(emptyResult.type).toBe('distribution');
      expect(emptyResult.data.labels).toEqual([]);
      expect(emptyResult.data.datasets).toEqual([]);
      expect(emptyResult.data.statistics.min).toBeNull();
      expect(emptyResult.data.statistics.max).toBeNull();
      
      // Empty API response with different result type
      const emptySensitivityResult = MonteCarloAdapter.transform(null, 'sensitivity', 'irr');
      
      // Assert the result is a valid empty sensitivity
      expect(emptySensitivityResult.type).toBe('sensitivity');
      expect(emptySensitivityResult.data.labels).toEqual([]);
      expect(emptySensitivityResult.data.datasets).toEqual([]);
    });

    it('should use default result type and metric type when not specified', () => {
      // Sample API response
      const apiResponse = {
        labels: [0.08, 0.09, 0.10],
        datasets: [{ label: 'Test', data: [1, 2, 3] }]
      };

      // Transform with default parameters
      const result = MonteCarloAdapter.transform(apiResponse);

      // Assert defaults were used
      expect(result.type).toBe('distribution');
    });
  });
}); 