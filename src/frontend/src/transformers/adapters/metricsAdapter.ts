/**
 * Metrics adapter for transforming metrics API responses
 */
import { MetricsModel } from '../models/metrics';
import { normalize, safeExtract, firstValid } from '../core/utils';
import { wrapTransformError, logTransformWarning } from '../core/errorHandling';

export namespace MetricsAdapter {
  /**
   * Transforms key metrics API response to standardized model
   * Handles multiple possible API response formats
   * @param apiResponse Raw API response
   * @returns Standardized metrics model
   */
  export const transform = wrapTransformError((apiResponse: any): MetricsModel => {
    // Handle different response formats
    // First try to find metrics in standard locations
    const sourceData = 
      safeExtract(apiResponse, ['key_metrics'], null) || 
      safeExtract(apiResponse, ['metrics'], null) || 
      apiResponse;
    
    if (!sourceData) {
      logTransformWarning('No metrics data found in API response', apiResponse);
      // Return a model with all null values
      return createEmptyMetricsModel();
    }
    
    // Create standardized result with proper type handling
    return {
      // Return metrics
      irr: normalize(sourceData?.irr, null),
      multiple: firstValid([
        sourceData?.multiple,
        sourceData?.equity_multiple,
        sourceData?.moic
      ], null),
      roi: normalize(sourceData?.roi, null),
      tvpi: normalize(sourceData?.tvpi, null),
      dpi: normalize(sourceData?.dpi, null),
      rvpi: normalize(sourceData?.rvpi, null),
      moic: firstValid([
        sourceData?.moic,
        sourceData?.multiple,
        sourceData?.equity_multiple
      ], null),
      
      // Risk metrics
      defaultRate: normalize(sourceData?.default_rate, null),
      volatility: normalize(sourceData?.volatility, null),
      sharpeRatio: normalize(sourceData?.sharpe_ratio, null),
      sortinoRatio: normalize(sourceData?.sortino_ratio, null),
      maxDrawdown: normalize(sourceData?.max_drawdown, null),
      
      // Fund info
      fundSize: normalize(sourceData?.fund_size, null),
      fundTerm: normalize(sourceData?.fund_term, null),
      
      // Timing metrics
      paybackPeriod: normalize(sourceData?.payback_period, null),
      avgExitYear: normalize(sourceData?.avg_exit_year, null),
      
      // Cashflow totals
      distributionsTotal: normalize(sourceData?.distributions_total, null),
      capitalCallsTotal: normalize(sourceData?.capital_calls_total, null)
    };
  }, 'Metrics transformation error');
  
  /**
   * Creates an empty metrics model with all null values
   * @returns Empty metrics model
   */
  function createEmptyMetricsModel(): MetricsModel {
    return {
      irr: null,
      multiple: null,
      roi: null,
      tvpi: null,
      dpi: null,
      rvpi: null,
      moic: null,
      defaultRate: null,
      volatility: null,
      sharpeRatio: null,
      sortinoRatio: null,
      maxDrawdown: null,
      fundSize: null,
      fundTerm: null,
      paybackPeriod: null,
      avgExitYear: null,
      distributionsTotal: null,
      capitalCallsTotal: null
    };
  }
} 