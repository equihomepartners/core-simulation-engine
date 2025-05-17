import { PortfolioAdapter } from '../adapters';
import { MetricsAdapter } from '../adapters';
import { CashflowAdapter } from '../adapters';
import { MonteCarloAdapter } from '../adapters';
import { GPEntityAdapter } from '../adapters';
import { MetricsModel } from '../models/metrics';
import { CashflowModel } from '../models/cashflow';
import { PortfolioModel } from '../models/portfolio';
import { MonteCarloResult } from '../models/monteCarlo';
import { GPEntityModel } from '../models/gpEntity';
import { TransformOptions } from '../models/common';
import { 
  withCache, 
  metricsCache, 
  cashflowCache, 
  portfolioCache, 
  monteCarloCache, 
  gpEntityCache 
} from '../core/performance';

/**
 * Service for transforming API responses into frontend models
 */
export class ApiTransformService {
  /**
   * Transform metrics API response into Metrics model
   * @param apiResponse The raw API response
   * @returns Transformed metrics data
   */
  static transformMetrics = withCache(
    (apiResponse: any): MetricsModel => {
      return MetricsAdapter.transform(apiResponse);
    },
    metricsCache,
    (apiResponse: any) => JSON.stringify({ type: 'metrics', data: apiResponse })
  );

  /**
   * Transform cashflow API response into Cashflow model
   * @param apiResponse The raw API response
   * @param options Optional transformation options
   * @returns Transformed cashflow data
   */
  static transformCashflow = withCache(
    (apiResponse: any, options?: TransformOptions): CashflowModel => {
      // @ts-ignore: The adapter implementation may accept options but TypeScript doesn't recognize it
      return CashflowAdapter.transform(apiResponse, options);
    },
    cashflowCache,
    (apiResponse: any, options?: TransformOptions) => 
      JSON.stringify({ type: 'cashflow', data: apiResponse, options })
  );

  /**
   * Transform portfolio API response into Portfolio model
   * @param apiResponse The raw API response
   * @returns Transformed portfolio data
   */
  static transformPortfolio = withCache(
    (apiResponse: any): PortfolioModel => {
      return PortfolioAdapter.transform(apiResponse);
    },
    portfolioCache,
    (apiResponse: any) => JSON.stringify({ type: 'portfolio', data: apiResponse })
  );

  /**
   * Transform Monte Carlo API response into Monte Carlo result model
   * @param apiResponse The raw API response
   * @param resultType The type of Monte Carlo result (distribution, sensitivity, confidence)
   * @param metricType The metric type (irr, multiple, default_rate)
   * @returns Transformed Monte Carlo result
   */
  static transformMonteCarloResults = withCache(
    (
      apiResponse: any,
      resultType: 'distribution' | 'sensitivity' | 'confidence' = 'distribution',
      metricType: 'irr' | 'multiple' | 'default_rate' = 'irr'
    ): MonteCarloResult => {
      // @ts-ignore: The adapter implementation may accept multiple parameters
      return MonteCarloAdapter.transform(apiResponse, resultType, metricType);
    },
    monteCarloCache,
    (apiResponse: any, resultType?: string, metricType?: string) => 
      JSON.stringify({ type: 'monteCarlo', data: apiResponse, resultType, metricType })
  );

  /**
   * Transform GP Entity API response into GP Entity model
   * @param apiResponse The raw API response
   * @returns Transformed GP Entity data
   */
  static transformGpEntity = withCache(
    (apiResponse: any): GPEntityModel => {
      return GPEntityAdapter.transform(apiResponse);
    },
    gpEntityCache,
    (apiResponse: any) => JSON.stringify({ type: 'gpEntity', data: apiResponse })
  );

  /**
   * Clear all transformation caches
   */
  static clearCaches(): void {
    metricsCache.clear();
    cashflowCache.clear();
    portfolioCache.clear();
    monteCarloCache.clear();
    gpEntityCache.clear();
  }
} 