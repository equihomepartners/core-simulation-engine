import { apiClient } from './apiClient';

/**
 * Interface for visualization data request options
 */
export interface VisualizationOptions {
  chart_type?: 'key_metrics' | 'cashflows' | 'portfolio' | 'risk' | 'waterfall' | 'zone_performance' | 'loan_performance' | 'portfolio_evolution' | 'all';
  format?: 'summary' | 'bar' | 'pie' | 'line' | 'scatter' | 'yearly';
  time_granularity?: 'yearly' | 'quarterly' | 'monthly';
  cumulative?: boolean;
  start_year?: number;
  end_year?: number;
  metrics?: string[];
  filter?: Record<string, any>;
}

/**
 * Interface for Monte Carlo visualization options
 */
export interface MonteCarloVisualizationOptions {
  chart_type: 'distribution' | 'sensitivity' | 'confidence';
  format: 'irr' | 'multiple' | 'default_rate';
  metrics?: string[];
}

/**
 * Interface for GP Entity visualization options
 */
export interface GPEntityVisualizationOptions {
  chart_type?: 'revenue_sources' | 'expense_breakdown' | 'team_allocation' | 'cashflows' | 'yearly_revenue' | 'yearly_distributions' | 'all';
  format?: 'summary' | 'bar' | 'pie' | 'line';
}

/**
 * Client for fetching visualization data from the API
 */
export class VisualizationClient {
  /**
   * Fetch metrics data for a simulation
   * @param simulationId The simulation ID
   * @returns Promise resolving to metrics data
   */
  async fetchMetrics(simulationId: string): Promise<any> {
    const response = await apiClient.get(`api/simulations/${simulationId}/visualization`, {
      params: {
        chart_type: 'key_metrics',
        format: 'summary'
      }
    });
    return response.data;
  }

  /**
   * Fetch cashflow data for a simulation
   * @param simulationId The simulation ID
   * @param cumulative Whether to return cumulative cashflows
   * @returns Promise resolving to cashflow data
   */
  async fetchCashflow(simulationId: string, cumulative: boolean = false): Promise<any> {
    const response = await apiClient.get(`api/simulations/${simulationId}/visualization`, {
      params: {
        chart_type: 'cashflows',
        format: 'bar',
        cumulative
      }
    });
    return response.data;
  }

  /**
   * Fetch portfolio data for a simulation
   * @param simulationId The simulation ID
   * @returns Promise resolving to portfolio data
   */
  async fetchPortfolio(simulationId: string): Promise<any> {
    const response = await apiClient.get(`api/simulations/${simulationId}/visualization`, {
      params: {
        chart_type: 'portfolio',
        format: 'pie'
      }
    });
    return response.data;
  }

  /**
   * Fetch waterfall data for a simulation
   * @param simulationId The simulation ID
   * @returns Promise resolving to waterfall data
   */
  async fetchWaterfall(simulationId: string): Promise<any> {
    const response = await apiClient.get(`api/simulations/${simulationId}/visualization`, {
      params: {
        chart_type: 'waterfall',
        format: 'summary'
      }
    });
    return response.data;
  }

  /**
   * Fetch Monte Carlo results for a simulation
   * @param simulationId The simulation ID
   * @param options Monte Carlo visualization options
   * @returns Promise resolving to Monte Carlo results
   */
  async fetchMonteCarloResults(simulationId: string, options: MonteCarloVisualizationOptions): Promise<any> {
    const params = new URLSearchParams();
    params.append('chart_type', options.chart_type);
    params.append('format', options.format);
    
    if (options.metrics && options.metrics.length > 0) {
      params.append('metrics', options.metrics.join(','));
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`api/simulations/${simulationId}/monte-carlo/visualization${query}`);
    return response.data;
  }

  /**
   * Fetch GP entity data for a simulation
   * @param simulationId The simulation ID
   * @param options GP entity visualization options
   * @returns Promise resolving to GP entity data
   */
  async fetchGpEntity(simulationId: string, options: GPEntityVisualizationOptions = {}): Promise<any> {
    const chart_type = options.chart_type || 'revenue_sources';
    const format = options.format || 'pie';

    const response = await apiClient.get(`api/simulations/${simulationId}/gp-entity/visualization`, {
      params: {
        chart_type,
        format
      }
    });
    return response.data;
  }

  /**
   * Fetch generic visualization data with custom options
   * @param simulationId The simulation ID
   * @param options Visualization options
   * @returns Promise resolving to visualization data
   */
  async fetchVisualizationData(simulationId: string, options: VisualizationOptions): Promise<any> {
    const params: Record<string, any> = {};
    
    // Add all options to params
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'metrics' && Array.isArray(value)) {
          params[key] = value.join(',');
        } else if (key === 'filter' && typeof value === 'object') {
          Object.entries(value).forEach(([filterKey, filterValue]) => {
            params[`filter_${filterKey}`] = filterValue;
          });
        } else {
          params[key] = value;
        }
      }
    });

    const response = await apiClient.get(`api/simulations/${simulationId}/visualization`, { params });
    return response.data;
  }
}

// Export a singleton instance
export const visualizationClient = new VisualizationClient(); 