import { ApiTransformService } from './apiTransformService';
import { visualizationClient } from '../../api/visualizationClient';
import { MetricsModel } from '../models/metrics';
import { CashflowModel } from '../models/cashflow';
import { PortfolioModel } from '../models/portfolio';
import { MonteCarloResult } from '../models/monteCarlo';
import { GPEntityModel } from '../models/gpEntity';
import { TransformOptions } from '../models/common';

/**
 * Interface for a basic API client
 */
export interface BaseApiClient {
  fetchMetrics: (simulationId: string) => Promise<any>;
  fetchCashflow: (simulationId: string, options?: any) => Promise<any>;
  fetchPortfolio: (simulationId: string) => Promise<any>;
  fetchWaterfall?: (simulationId: string) => Promise<any>;
  fetchMonteCarloResults?: (simulationId: string, options?: any) => Promise<any>;
  fetchGpEntity?: (entityId: string, options?: any) => Promise<any>;
  [key: string]: any; // Allow for additional methods
}

/**
 * Enhanced API client that wraps a basic API client and adds transformation functionality
 */
export class EnhancedApiClient {
  private client: BaseApiClient;

  /**
   * Create a new enhanced API client
   * @param baseClient The base API client to wrap
   */
  constructor(baseClient: BaseApiClient) {
    this.client = baseClient;
  }

  /**
   * Fetch and transform metrics data
   * @param simulationId The simulation ID to fetch metrics for
   * @returns Promise resolving to transformed metrics data
   */
  async fetchMetrics(simulationId: string): Promise<MetricsModel> {
    const response = await this.client.fetchMetrics(simulationId);
    return ApiTransformService.transformMetrics(response);
  }

  /**
   * Fetch and transform cashflow data
   * @param simulationId The simulation ID to fetch cashflow for
   * @param options Optional transformation options
   * @returns Promise resolving to transformed cashflow data
   */
  async fetchCashflow(simulationId: string, options?: TransformOptions): Promise<CashflowModel> {
    const response = await this.client.fetchCashflow(simulationId, options);
    // @ts-ignore: The adapter implementation may accept options but TypeScript doesn't recognize it
    return ApiTransformService.transformCashflow(response, options);
  }

  /**
   * Fetch and transform portfolio data
   * @param simulationId The simulation ID to fetch portfolio for
   * @returns Promise resolving to transformed portfolio data
   */
  async fetchPortfolio(simulationId: string): Promise<PortfolioModel> {
    const response = await this.client.fetchPortfolio(simulationId);
    return ApiTransformService.transformPortfolio(response);
  }

  /**
   * Fetch and transform waterfall data if available in the base client
   * @param simulationId The simulation ID to fetch waterfall for
   * @returns Promise resolving to transformed waterfall data
   */
  async fetchWaterfall(simulationId: string): Promise<any> {
    if (!this.client.fetchWaterfall) {
      // Use visualization client if the base client doesn't have this method
      const response = await visualizationClient.fetchWaterfall(simulationId);
      return response; // TODO: Add WaterfallAdapter when available
    }
    
    const response = await this.client.fetchWaterfall(simulationId);
    return response; // TODO: Add WaterfallAdapter when available
  }

  /**
   * Fetch and transform Monte Carlo results
   * @param simulationId The simulation ID to fetch Monte Carlo results for
   * @param options Monte Carlo options
   * @returns Promise resolving to transformed Monte Carlo results
   */
  async fetchMonteCarloResults(
    simulationId: string, 
    options: { 
      resultType?: 'distribution' | 'sensitivity' | 'confidence';
      metricType?: 'irr' | 'multiple' | 'default_rate';
    } = {}
  ): Promise<MonteCarloResult> {
    const resultType = options.resultType || 'distribution';
    const metricType = options.metricType || 'irr';

    let response;
    if (!this.client.fetchMonteCarloResults) {
      // Use visualization client if the base client doesn't have this method
      response = await visualizationClient.fetchMonteCarloResults(simulationId, {
        chart_type: resultType,
        format: metricType
      });
    } else {
      response = await this.client.fetchMonteCarloResults(simulationId, {
        chart_type: resultType,
        format: metricType
      });
    }

    return ApiTransformService.transformMonteCarloResults(response, resultType, metricType);
  }

  /**
   * Fetch and transform GP entity data
   * @param simulationId The simulation ID to fetch GP entity data for
   * @param options GP entity options
   * @returns Promise resolving to transformed GP entity data
   */
  async fetchGpEntity(
    simulationId: string,
    options: {
      chartType?: string;
      format?: string;
    } = {}
  ): Promise<GPEntityModel> {
    let response;
    if (!this.client.fetchGpEntity) {
      // Use visualization client if the base client doesn't have this method
      response = await visualizationClient.fetchGpEntity(simulationId, {
        chart_type: options.chartType,
        format: options.format
      });
    } else {
      response = await this.client.fetchGpEntity(simulationId, options);
    }

    return ApiTransformService.transformGpEntity(response);
  }

  /**
   * Access the underlying base client
   * @returns The base API client
   */
  getBaseClient(): BaseApiClient {
    return this.client;
  }
}

/**
 * Create an enhanced API client from a base client
 * @param baseClient The base API client to enhance
 * @returns An enhanced API client with transformation capabilities
 */
export function createEnhancedApiClient(baseClient: BaseApiClient): EnhancedApiClient {
  return new EnhancedApiClient(baseClient);
}

/**
 * Create an enhanced API client using the visualization client
 * @returns An enhanced API client
 */
export function createVisualizationApiClient(): EnhancedApiClient {
  return createEnhancedApiClient(visualizationClient);
} 