import { VarianceAdapter } from '../../src/transformers/adapters';

describe('VarianceAdapter', () => {
  describe('transform', () => {
    it('should transform variance analysis data correctly', () => {
      const apiResponse = {
        fan_chart: {
          labels: [1, 2, 3],
          p5: [0.1, 0.2, 0.3],
          p50: [0.15, 0.25, 0.35],
          p95: [0.2, 0.3, 0.4],
          mean: [0.16, 0.26, 0.36]
        },
        dispersion: {
          labels: ['A', 'B', 'C'],
          values: [5, 10, 15]
        }
      };

      const result = VarianceAdapter.transform(apiResponse);

      expect(result.fanChart?.labels).toEqual([1, 2, 3]);
      expect(result.fanChart?.series).toHaveLength(4);
      expect(result.fanChart?.series[0].label).toBe('P5');
      expect(result.fanChart?.series[0].data).toEqual([0.1, 0.2, 0.3]);
      expect(result.dispersion?.labels).toEqual(['A', 'B', 'C']);
      expect(result.dispersion?.values).toEqual([5, 10, 15]);
    });

    it('should handle empty input gracefully', () => {
      const result = VarianceAdapter.transform(null as any);
      expect(result.fanChart).toBeNull();
      expect(result.dispersion).toBeNull();
    });
  });
});
