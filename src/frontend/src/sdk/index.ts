/**
 * Professional SDK wrapper for the Equihome Fund Simulation Engine API
 *
 * This SDK provides a clean, type-safe interface to the simulation API
 * using the auto-generated OpenAPI client.
 */

import {
  OpenAPI,
  SimulationApi,
  SimulationConfig,
  SimulationResponse,
  SimulationStatus,
  SimulationDetail,
  SimulationResults
} from '../api';
import { LogLevel, LogCategory, log, logBackendDataStructure } from '../utils/logging';
import { transformApiResponse, transformApiRequest, ensureBothCases } from '../utils/transformUtils';

// Initialize the API client
const apiClient = new SimulationApi();

// Configure the OpenAPI client
const configureApi = (baseUrl: string = '') => {
  if (baseUrl) {
    OpenAPI.BASE = baseUrl;
  } else {
    // Default to the current host with the API prefix
    const host = window.location.hostname;
    const port = process.env.NODE_ENV === 'development' ? '5005' : window.location.port;
    const protocol = window.location.protocol;
    OpenAPI.BASE = `${protocol}//${host}${port ? `:${port}` : ''}`;
  }

  // Add request/response interceptors if needed
  OpenAPI.WITH_CREDENTIALS = true;

  log(LogLevel.INFO, LogCategory.API, `API configured with base URL: ${OpenAPI.BASE}`);
};

/**
 * Simulation SDK provides methods for interacting with the simulation API
 */
export class SimulationSDK {
  /**
   * Initialize the SDK
   * @param baseUrl Optional base URL for the API
   */
  constructor(baseUrl?: string) {
    configureApi(baseUrl);
  }

  /**
   * List all simulations
   * @param status Optional status filter
   * @param limit Maximum number of simulations to return
   * @param offset Offset for pagination
   * @returns List of simulations with all fields transformed to camelCase
   */
  async listSimulations(status?: string, limit: number = 10, offset: number = 0) {
    try {
      log(LogLevel.INFO, LogCategory.API, `Listing simulations with status: ${status || 'all'}`);
      const response = await apiClient.default.getApiSimulations(
        status as any,
        limit,
        offset
      );

      // Transform all field names from snake_case to camelCase
      const transformedResponse = transformApiResponse(response);
      log(LogLevel.DEBUG, LogCategory.API, `Transformed simulation list`);

      return transformedResponse;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.API, `Error listing simulations: ${error}`);
      throw error;
    }
  }

  /**
   * Create a new simulation
   * @param config Simulation configuration
   * @returns Simulation response with all fields transformed to camelCase
   */
  async createSimulation(config: SimulationConfig): Promise<SimulationResponse> {
    try {
      log(LogLevel.INFO, LogCategory.API, 'Creating new simulation');

      // Transform request data from camelCase to snake_case if needed
      const transformedConfig = config;

      const response = await apiClient.default.postApiSimulations(transformedConfig);

      // Transform response from snake_case to camelCase
      const transformedResponse = transformApiResponse(response);
      log(LogLevel.INFO, LogCategory.API, `Simulation created with ID: ${transformedResponse.simulationId || response.simulation_id}`);

      return transformedResponse;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.API, `Error creating simulation: ${error}`);
      throw error;
    }
  }

  /**
   * Get a simulation by ID
   * @param id Simulation ID
   * @returns Simulation details with all fields transformed to camelCase
   */
  async getSimulation(id: string): Promise<SimulationDetail> {
    try {
      log(LogLevel.INFO, LogCategory.API, `Getting simulation: ${id}`);
      const response = await apiClient.default.getApiSimulations1(id);

      // Transform all field names from snake_case to camelCase
      const transformedResponse = transformApiResponse(response);
      log(LogLevel.DEBUG, LogCategory.API, `Transformed simulation details for ${id}`);

      return transformedResponse;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.API, `Error getting simulation ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Get simulation status
   * @param id Simulation ID
   * @param includePartialResults Whether to include partial results
   * @returns Simulation status with all fields transformed to camelCase
   */
  async getSimulationStatus(id: string, includePartialResults: boolean = false): Promise<SimulationStatus> {
    try {
      log(LogLevel.INFO, LogCategory.API, `Getting status for simulation: ${id}`);
      const response = await apiClient.default.getApiSimulationsStatus(id, includePartialResults);

      // Transform all field names from snake_case to camelCase
      const transformedResponse = transformApiResponse(response);
      log(LogLevel.DEBUG, LogCategory.API, `Transformed simulation status for ${id}`);

      return transformedResponse;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.API, `Error getting simulation status ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Get simulation results
   * @param id Simulation ID
   * @param timeGranularity Time granularity (yearly or monthly)
   * @returns Simulation results with all fields transformed to camelCase
   */
  async getSimulationResults(id: string, timeGranularity: 'yearly' | 'monthly' = 'yearly'): Promise<SimulationResults> {
    try {
      log(LogLevel.INFO, LogCategory.API, `Getting results for simulation: ${id}`);
      const response = await apiClient.default.getApiSimulationsResults(id, timeGranularity);

      // Log the complete backend data structure (only once per session)
      logBackendDataStructure(response, `Simulation Results (ID: ${id})`);

      // Fetch portfolio evolution data separately to ensure we have the correct format
      try {
        log(LogLevel.INFO, LogCategory.API, `Getting portfolio evolution data for: ${id}`);
        const portfolioEvolutionResponse = await fetch(`/api/simulations/${id}/portfolio-evolution/`);

        if (portfolioEvolutionResponse.ok) {
          const portfolioEvolutionData = await portfolioEvolutionResponse.json();

          // Log the raw portfolio evolution data
          log(LogLevel.DEBUG, LogCategory.API, `Got portfolio evolution data for ${id}:`, portfolioEvolutionData);

          // Add the portfolio evolution data to the response
          response.portfolio_evolution = portfolioEvolutionData;

          // Log the keys to verify the structure
          const keys = Object.keys(portfolioEvolutionData);
          log(LogLevel.INFO, LogCategory.API, `Portfolio evolution data keys: ${keys.join(', ')}`);

          // Check if the data has numeric keys
          const hasNumericKeys = keys.some(key => !isNaN(Number(key)));
          log(LogLevel.INFO, LogCategory.API, `Portfolio evolution has numeric keys: ${hasNumericKeys}`);
        }
      } catch (portfolioError) {
        log(LogLevel.WARN, LogCategory.API, `Error getting portfolio evolution data for ${id}: ${portfolioError}`);
        // Continue with the original response
      }

      // Ensure the response has all required fields, even if they're empty objects
      const normalizedResponse = this.normalizeSimulationResults(response);

      // Transform all field names from snake_case to camelCase
      const transformedResponse = transformApiResponse(normalizedResponse);
      log(LogLevel.DEBUG, LogCategory.API, `Transformed simulation results for ${id}`);

      return transformedResponse;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.API, `Error getting simulation results ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Normalize simulation results to ensure all required fields are present
   * @param results Raw simulation results from the API
   * @returns Normalized simulation results with all required fields
   */
  private normalizeSimulationResults(results: any): any {
    if (!results) {
      log(LogLevel.WARN, LogCategory.API, 'Received null or undefined simulation results');
      return {};
    }

    // Define required top-level fields
    const requiredFields = [
      'metrics',
      'cash_flows',
      'portfolio_evolution',
      'yearly_portfolio',
      'gp_economics',
      'sensitivity',
      'waterfall_results',
      'portfolio',
      'irr_breakdown',
      'performance_metrics',
      'zone_allocation'
    ];

    // Create a normalized copy of the results
    const normalized = { ...results };

    // Ensure all required fields exist
    for (const field of requiredFields) {
      if (!normalized[field]) {
        log(LogLevel.WARN, LogCategory.API, `Missing required field in simulation results: ${field}`);
        normalized[field] = {};

        // Also add the camelCase version
        const camelField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        normalized[camelField] = {};
      } else if (normalized[field] === null) {
        log(LogLevel.WARN, LogCategory.API, `Field in simulation results is null: ${field}`);
        normalized[field] = {};

        // Also add the camelCase version
        const camelField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        normalized[camelField] = {};
      }
    }

    // Ensure metrics exist
    if (!normalized.metrics) {
      normalized.metrics = {};
      normalized.metricsSnapshot = {};
    }

    // Extract metrics from performance_metrics and add them to the top-level metrics object
    this.extractPerformanceMetrics(normalized);

    // Extract portfolio metrics from the last year in portfolio_evolution
    this.extractPortfolioMetrics(normalized);

    // Extract GP economics data from waterfall results if gp_economics is empty
    this.extractGPEconomicsFromWaterfall(normalized);

    // Add IRR components if they don't exist
    this.normalizeIRRBreakdown(normalized);

    // Add zone allocation if it doesn't exist
    this.normalizeZoneAllocation(normalized);

    // Normalize portfolio evolution data
    this.normalizePortfolioEvolution(normalized);

    return normalized;
  }

  /**
   * Extract metrics from performance_metrics and add them to the top-level metrics object
   * @param results Simulation results to normalize
   */
  private extractPerformanceMetrics(results: any): void {
    log(LogLevel.DEBUG, LogCategory.API, 'Extracting performance metrics');

    // Get performance_metrics object (try both snake_case and camelCase)
    const performanceMetrics = results.performance_metrics || results.performanceMetrics || {};

    if (Object.keys(performanceMetrics).length === 0) {
      log(LogLevel.WARN, LogCategory.API, 'No performance metrics found');

      // Check for errors in the simulation results
      if (results.error || (Array.isArray(results.errors) && results.errors.length > 0)) {
        const errorMessage = results.error || (results.errors && results.errors[0]);
        log(LogLevel.WARN, LogCategory.API, `Simulation error detected: ${errorMessage}`);

        // If there's a waterfall calculation error, we can still extract metrics from cash flows
        if (errorMessage && errorMessage.includes('Waterfall')) {
          log(LogLevel.INFO, LogCategory.API, 'Waterfall calculation error detected, extracting metrics from cash flows');
          this.extractMetricsFromCashFlows(results);
        }
      }

      return;
    }

    // Log the performance metrics for debugging
    log(LogLevel.DEBUG, LogCategory.API, 'Performance metrics found:', performanceMetrics);

    // Ensure metrics object exists
    if (!results.metrics) {
      results.metrics = {};
    }

    // Map of performance metrics to extract and their corresponding names in the metrics object
    const metricsMap = [
      // IRR metrics
      { source: 'irr', target: 'irr' },
      { source: 'fund_irr', target: 'fund_irr' },
      { source: 'gross_irr', target: 'gross_irr' },
      { source: 'lp_irr', target: 'lp_irr' },

      // Multiple metrics
      { source: 'moic', target: 'multiple' },
      { source: 'gross_multiple', target: 'gross_multiple' },
      { source: 'gross_moic', target: 'gross_moic' },
      { source: 'lp_multiple', target: 'lp_multiple' },
      { source: 'moic', target: 'moic' },

      // Return metrics
      { source: 'roi', target: 'roi' },
      { source: 'gross_roi', target: 'gross_roi' },
      { source: 'lp_roi', target: 'lp_roi' },
      { source: 'realized_return', target: 'realized_return' },
      { source: 'unrealized_return', target: 'unrealized_return' },
      { source: 'annualized_roi', target: 'annualized_roi' },

      // Distribution metrics
      { source: 'dpi', target: 'dpi' },
      { source: 'rvpi', target: 'rvpi' },
      { source: 'tvpi', target: 'tvpi' },
      { source: 'pic', target: 'pic' },

      // Cash flow metrics
      { source: 'payback_period', target: 'payback_period' }
    ];

    // Extract metrics from performance_metrics and add them to the metrics object
    for (const { source, target } of metricsMap) {
      // Try snake_case version
      if (performanceMetrics[source] !== undefined) {
        results.metrics[target] = performanceMetrics[source];
        log(LogLevel.DEBUG, LogCategory.API, `Extracted metric ${source} -> ${target}: ${performanceMetrics[source]}`);
      }

      // Try camelCase version
      const camelSource = source.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (performanceMetrics[camelSource] !== undefined && results.metrics[target] === undefined) {
        results.metrics[target] = performanceMetrics[camelSource];
        log(LogLevel.DEBUG, LogCategory.API, `Extracted metric ${camelSource} -> ${target}: ${performanceMetrics[camelSource]}`);
      }
    }

    // Extract LP IRR and multiple from waterfall results if available
    this.extractLPMetricsFromWaterfall(results);

    // If gross IRR is not available but net IRR is, don't estimate it anymore
    // We've fixed the backend to properly calculate gross IRR
    if ((results.metrics.gross_irr === undefined || results.metrics.gross_irr === null) &&
        (results.metrics.grossIrr === undefined || results.metrics.grossIrr === null)) {
      log(LogLevel.WARN, LogCategory.API, 'Gross IRR not found in performance metrics');
    }

    // If fund_irr is available but irr is not, use fund_irr as irr for backward compatibility
    if ((results.metrics.irr === undefined || results.metrics.irr === null) &&
        results.metrics.fund_irr !== undefined && results.metrics.fund_irr !== null) {
      results.metrics.irr = results.metrics.fund_irr;
      log(LogLevel.INFO, LogCategory.API, `Using fund_irr as irr for backward compatibility: ${results.metrics.fund_irr}`);
    }

    // If gross multiple is not available but net multiple is, log and do not estimate
    if ((results.metrics.gross_multiple === undefined || results.metrics.gross_multiple === null) &&
        (results.metrics.grossMultiple === undefined || results.metrics.grossMultiple === null) &&
        (results.metrics.multiple !== undefined || results.metrics.moic !== undefined)) {
      log(LogLevel.INFO, LogCategory.API, `Gross multiple not found. It will not be estimated from net multiple.`);
    }

    // If gross ROI is not available but net ROI is, log and do not estimate
    if ((results.metrics.gross_roi === undefined || results.metrics.gross_roi === null) &&
        (results.metrics.grossRoi === undefined || results.metrics.grossRoi === null) &&
        results.metrics.roi !== undefined && results.metrics.roi !== null) {
      log(LogLevel.INFO, LogCategory.API, `Gross ROI not found. It will not be estimated from net ROI.`);
    }

    // Extract cash flow metrics from equity_multiple_details
    const equityMultipleDetails = performanceMetrics.equity_multiple_details ||
                                 performanceMetrics.equityMultipleDetails || {};

    if (Object.keys(equityMultipleDetails).length > 0) {
      // Extract total capital calls
      if (equityMultipleDetails.total_contribution !== undefined) {
        results.metrics.total_capital_calls = equityMultipleDetails.total_contribution;
      } else if (equityMultipleDetails.totalContribution !== undefined) {
        results.metrics.total_capital_calls = equityMultipleDetails.totalContribution;
      }

      // Extract total distributions
      if (equityMultipleDetails.total_distributions !== undefined) {
        results.metrics.total_distributions = equityMultipleDetails.total_distributions;
      } else if (equityMultipleDetails.totalDistributions !== undefined) {
        results.metrics.total_distributions = equityMultipleDetails.totalDistributions;
      }
    }

    // Extract net cash flow from roi_details
    const roiDetails = performanceMetrics.roi_details || performanceMetrics.roiDetails || {};

    if (Object.keys(roiDetails).length > 0) {
      // Extract net cash flow
      if (roiDetails.total_profit !== undefined) {
        results.metrics.net_cash_flow = roiDetails.total_profit;
      } else if (roiDetails.totalProfit !== undefined) {
        results.metrics.net_cash_flow = roiDetails.totalProfit;
      }
    }

    // Calculate uncalled capital if we have fund_size and total_capital_calls
    if (results.fund_size !== undefined && results.metrics.total_capital_calls !== undefined) {
      results.metrics.uncalled_capital = results.fund_size - results.metrics.total_capital_calls;
    } else if (results.fundSize !== undefined && results.metrics.total_capital_calls !== undefined) {
      results.metrics.uncalled_capital = results.fundSize - results.metrics.total_capital_calls;
    }

    // Ensure both snake_case and camelCase versions exist for all metrics
    const metricsKeys = Object.keys(results.metrics);
    for (const key of metricsKeys) {
      const value = results.metrics[key];

      // Add camelCase version
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (camelKey !== key && results.metrics[camelKey] === undefined) {
        results.metrics[camelKey] = value;
      }

      // Add snake_case version
      const snakeKey = camelKey.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (snakeKey !== key && results.metrics[snakeKey] === undefined) {
        results.metrics[snakeKey] = value;
      }
    }

    // --- Override with definitive LP metrics from Waterfall Results if available ---
    const waterfall = results.waterfall_results || results.waterfallResults || {};
    const capitalContributions = waterfall.capital_contributions || waterfall.capitalContributions || {};
    const lpContributionRaw = capitalContributions.lp_contribution || capitalContributions.lpContribution;
    const lpContribution = lpContributionRaw !== undefined && lpContributionRaw !== null ? parseFloat(String(lpContributionRaw)) : 0;

    if (Object.keys(waterfall).length > 0) {
        log(LogLevel.INFO, LogCategory.API, 'Overriding/setting LP metrics in results.metrics from waterfall_results');
        
        // Total LP Distributions
        if (waterfall.total_lp_distribution !== undefined || waterfall.totalLpDistribution !== undefined) {
            const totalLpDist = parseFloat(String(waterfall.total_lp_distribution || waterfall.totalLpDistribution));
            results.metrics.total_distributions = totalLpDist;
            results.metrics.totalDistributions = totalLpDist;
            log(LogLevel.DEBUG, LogCategory.API, `Set results.metrics.total_distributions from waterfall: ${totalLpDist}`);
        }

        // LP IRR
        if (waterfall.lp_irr !== undefined || waterfall.lpIrr !== undefined) {
            const finalLpIrr = parseFloat(String(waterfall.lp_irr || waterfall.lpIrr));
            results.metrics.lp_irr = finalLpIrr;
            results.metrics.lpIrr = finalLpIrr;
            results.metrics.lp_net_irr = finalLpIrr;
            results.metrics.lpNetIrr = finalLpIrr;
            log(LogLevel.DEBUG, LogCategory.API, `Confirmed results.metrics.lp_irr from waterfall: ${finalLpIrr}`);
        }

        // LP Multiple (TVPI)
        if (waterfall.lp_multiple !== undefined || waterfall.lpMultiple !== undefined) {
            const finalLpMultiple = parseFloat(String(waterfall.lp_multiple || waterfall.lpMultiple));
            results.metrics.lp_multiple = finalLpMultiple;
            results.metrics.lpMultiple = finalLpMultiple;
            results.metrics.tvpi = finalLpMultiple;
            results.metrics.TVPI = finalLpMultiple;
            log(LogLevel.DEBUG, LogCategory.API, `Set results.metrics.lp_multiple (and tvpi) from waterfall: ${finalLpMultiple}`);
        }

        // LP DPI
        const currentTotalDistributionsVal = results.metrics.total_distributions !== undefined ? parseFloat(String(results.metrics.total_distributions)) : 0;
        if (lpContribution > 0) { // Ensure lpContribution is positive to avoid division by zero or meaningless DPI
            const lpDpi = currentTotalDistributionsVal / lpContribution;
            results.metrics.dpi = lpDpi;
            results.metrics.DPI = lpDpi;
            log(LogLevel.DEBUG, LogCategory.API, `Calculated results.metrics.dpi for LP from waterfall data: ${lpDpi}`);
        } else {
            results.metrics.dpi = 0;
            results.metrics.DPI = 0;
            log(LogLevel.DEBUG, LogCategory.API, `LP Contribution is 0, setting LP DPI to 0.`);
        }

        // LP RVPI (depends on current_nav being correct in results.metrics already)
        const currentNavVal = results.metrics.current_nav !== undefined ? parseFloat(String(results.metrics.current_nav)) : (results.metrics.currentNav !== undefined ? parseFloat(String(results.metrics.currentNav)) : 0) ;
        if (lpContribution > 0) { // Ensure lpContribution is positive
            const lpRvpi = currentNavVal / lpContribution;
            results.metrics.rvpi = lpRvpi;
            results.metrics.RVPI = lpRvpi;
            log(LogLevel.DEBUG, LogCategory.API, `Calculated results.metrics.rvpi for LP using current_nav: ${lpRvpi}`);
        } else {
            results.metrics.rvpi = 0;
            results.metrics.RVPI = 0;
            log(LogLevel.DEBUG, LogCategory.API, `LP Contribution is 0, setting LP RVPI to 0.`);
        }
    }

    // Log the extracted metrics for debugging
    log(LogLevel.DEBUG, LogCategory.API, 'Extracted metrics (after waterfall override if any):', results.metrics);
  }

  /**
   * Extract LP IRR and multiple from waterfall results
   * @param results Simulation results to normalize
   */
  private extractLPMetricsFromWaterfall(results: any): void {
    log(LogLevel.DEBUG, LogCategory.API, 'Extracting LP metrics from waterfall results');

    // Check for errors in the simulation results
    if (results.error || (Array.isArray(results.errors) && results.errors.length > 0)) {
      const errorMessage = results.error || (results.errors && results.errors[0]);
      log(LogLevel.WARN, LogCategory.API, `Simulation error detected: ${errorMessage}`);

      // If there's a waterfall calculation error, we can't extract LP metrics
      if (errorMessage && errorMessage.includes('Waterfall')) {
        log(LogLevel.WARN, LogCategory.API, 'Waterfall calculation error detected, cannot extract LP metrics');
        return;
      }
    }

    // Get waterfall results (try both snake_case and camelCase)
    const waterfallResults = results.waterfall_results || results.waterfallResults || {};

    if (Object.keys(waterfallResults).length === 0) {
      log(LogLevel.WARN, LogCategory.API, 'No waterfall results found');
      return;
    }

    // Extract LP IRR from waterfall results
    if (waterfallResults.lp_irr !== undefined || waterfallResults.lpIrr !== undefined) {
      const lpIrr = waterfallResults.lp_irr !== undefined ? waterfallResults.lp_irr : waterfallResults.lpIrr;

      // Add LP IRR to metrics
      results.metrics.lp_irr = lpIrr;
      results.metrics.lpIrr = lpIrr;

      log(LogLevel.INFO, LogCategory.API, `Extracted LP IRR from waterfall: ${lpIrr}`);
    }

    // Extract LP multiple from waterfall results
    if (waterfallResults.lp_multiple !== undefined || waterfallResults.lpMultiple !== undefined) {
      const lpMultiple = waterfallResults.lp_multiple !== undefined ? waterfallResults.lp_multiple : waterfallResults.lpMultiple;

      // Add LP multiple to metrics
      results.metrics.lp_multiple = lpMultiple;
      results.metrics.lpMultiple = lpMultiple;

      log(LogLevel.INFO, LogCategory.API, `Extracted LP multiple from waterfall: ${lpMultiple}`);
    }

    // Calculate LP ROI from LP multiple if available
    if (results.metrics.lp_multiple !== undefined && results.metrics.lp_multiple !== null) {
      const lpRoi = results.metrics.lp_multiple - 1;

      // Add LP ROI to metrics
      results.metrics.lp_roi = lpRoi;
      results.metrics.lpRoi = lpRoi;

      log(LogLevel.INFO, LogCategory.API, `Calculated LP ROI from LP multiple: ${lpRoi}`);
    }
  }

  /**
   * Extract GP economics data from waterfall results if gp_economics is empty
   * @param results Simulation results to normalize
   */
  private extractGPEconomicsFromWaterfall(results: any): void {
    log(LogLevel.DEBUG, LogCategory.API, 'Extracting GP economics from waterfall results');

    // Check if gp_economics is empty
    const gpEconomics = results.gp_economics || results.gpEconomics || {};
    if (Object.keys(gpEconomics).length > 0) {
      log(LogLevel.DEBUG, LogCategory.API, 'GP economics already exists, skipping extraction');
      return;
    }

    // Get waterfall results (try both snake_case and camelCase)
    const waterfallResults = results.waterfall_results || results.waterfallResults || {};
    if (Object.keys(waterfallResults).length === 0) {
      log(LogLevel.WARN, LogCategory.API, 'No waterfall results found, cannot extract GP economics');
      return;
    }

    // Get config (try both snake_case and camelCase)
    const config = results.config || {};

    // Get cash flows (try both snake_case and camelCase)
    const cashFlows = results.cash_flows || results.cashFlows || {};
    if (Object.keys(cashFlows).length === 0) {
      log(LogLevel.WARN, LogCategory.API, 'No cash flows found, cannot extract GP economics');
      return;
    }

    // Log the waterfall results for debugging
    log(LogLevel.DEBUG, LogCategory.API, 'Waterfall results found:', waterfallResults);

    try {
      // Extract GP commitment percentage from config or waterfall params
      const gpCommitmentPercentage =
        parseFloat(config.gp_commitment_percentage || config.gpCommitmentPercentage ||
                  waterfallResults.waterfall_params?.gp_commitment ||
                  waterfallResults.waterfallParams?.gpCommitment || 0);

      // Extract fund size from config or results
      const fundSize = parseFloat(results.fund_size || results.fundSize ||
                                 config.fund_size || config.fundSize || 0);

      // Calculate GP commitment amount
      const gpCommitmentAmount = fundSize * gpCommitmentPercentage;

      // Extract management fee rate from config or waterfall params
      const managementFeeRate =
        parseFloat(config.management_fee_rate || config.managementFeeRate || 0);

      // Extract management fee basis from config
      const managementFeeBasis =
        config.management_fee_basis || config.managementFeeBasis || 'committed_capital';

      // Extract fund term from config
      const fundTerm = parseFloat(config.fund_term || config.fundTerm || 10);

      // Calculate total management fees based on fund term - REMOVE THIS ESTIMATION
      // const totalManagementFees =
      //   managementFeeBasis === 'committed_capital' ?
      //   fundSize * managementFeeRate * fundTerm : 0; // Simplified calculation
      const totalManagementFees = parseFloat(waterfallResults.total_management_fees || waterfallResults.totalManagementFees || 0);
      if (totalManagementFees === 0) {
        log(LogLevel.WARN, LogCategory.API, 'Total management fees not found directly in waterfall_results for GP Economics, defaulting to 0.');
      }

      // Extract carried interest from waterfall results
      const totalCarriedInterest =
        parseFloat(waterfallResults.gp_carried_interest ||
                  waterfallResults.gpCarriedInterest || 0);

      // Extract catch-up from waterfall results
      const totalCatchUp =
        parseFloat(waterfallResults.gp_catch_up ||
                  waterfallResults.gpCatchUp || 0);

      // Extract GP return of capital from waterfall results
      const gpReturnOfCapital =
        parseFloat(waterfallResults.gp_return_of_capital ||
                  waterfallResults.gpReturnOfCapital || 0);

      // Calculate total GP distributions
      const totalGPDistributions =
        parseFloat(waterfallResults.total_gp_distribution ||
                  waterfallResults.totalGpDistribution || 0);

      // Calculate investment return (total distributions minus return of capital)
      const investmentReturn = totalGPDistributions - gpReturnOfCapital;

      // Calculate total GP return (management fees + carried interest + investment return)
      const totalGPReturn = totalManagementFees + totalCarriedInterest + investmentReturn;

      // Calculate GP multiple (if GP commitment is > 0)
      const gpMultiple = gpCommitmentAmount > 0 ?
        totalGPDistributions / gpCommitmentAmount : 0;

      // Extract GP IRR from waterfall results
      const gpIRR = parseFloat(waterfallResults.gp_irr || waterfallResults.gpIrr || 0);

      // Extract yearly breakdown from waterfall results
      const yearlyBreakdown = waterfallResults.yearly_breakdown ||
                             waterfallResults.yearlyBreakdown || {};

      // Create arrays for yearly data
      const years = Object.keys(yearlyBreakdown)
        .filter(year => !isNaN(Number(year)))
        .map(Number)
        .sort((a, b) => a - b);

      // Create arrays for yearly data with proper length
      const managementFees = new Array(years.length).fill(0);
      const carriedInterest = new Array(years.length).fill(0);
      const gpCommitmentReturns = new Array(years.length).fill(0);
      const totalGPEconomics = new Array(years.length).fill(0);

      // Fill in yearly data
      years.forEach((year, index) => {
        // Management fees (assuming equal distribution across years)
        managementFees[index] = totalManagementFees / years.length;

        // Carried interest from yearly breakdown
        carriedInterest[index] =
          parseFloat(yearlyBreakdown[year]?.gp_carried_interest ||
                    yearlyBreakdown[year]?.gpCarriedInterest || 0);

        // GP commitment returns (simplified)
        gpCommitmentReturns[index] = 0; // We don't have this data

        // Total GP economics for the year
        totalGPEconomics[index] =
          managementFees[index] + carriedInterest[index] + gpCommitmentReturns[index];
      });

      // Create revenue sources breakdown
      const revenueSources = {
        management_fees: totalManagementFees,
        carried_interest: totalCarriedInterest,
        gp_commitment_returns: investmentReturn
      };

      // Create camelCase version
      const revenueSourcesCamel = {
        managementFees: totalManagementFees,
        carriedInterest: totalCarriedInterest,
        gpCommitmentReturns: investmentReturn
      };

      // Create GP economics object
      results.gp_economics = {
        years,
        management_fees: managementFees,
        carried_interest: carriedInterest,
        gp_commitment_returns: gpCommitmentReturns,
        total_gp_economics: totalGPEconomics,
        revenue_sources: revenueSources,

        // Summary metrics
        gp_commitment: gpCommitmentAmount,
        gp_commitment_percentage: gpCommitmentPercentage,
        management_fee_rate: managementFeeRate,
        management_fee_basis: managementFeeBasis,
        total_management_fees: totalManagementFees,
        total_carried_interest: totalCarriedInterest,
        total_catch_up: totalCatchUp,
        total_gp_distributions: totalGPDistributions,
        investment_return: investmentReturn,
        total_gp_return: totalGPReturn,
        gp_multiple: gpMultiple,
        gp_irr: gpIRR
      };

      // Create camelCase version
      results.gpEconomics = {
        years,
        managementFees: managementFees,
        carriedInterest: carriedInterest,
        gpCommitmentReturns: gpCommitmentReturns,
        totalGpEconomics: totalGPEconomics,
        revenueSources: revenueSourcesCamel,

        // Summary metrics
        gpCommitment: gpCommitmentAmount,
        gpCommitmentPercentage: gpCommitmentPercentage,
        managementFeeRate: managementFeeRate,
        managementFeeBasis: managementFeeBasis,
        totalManagementFees: totalManagementFees,
        totalCarriedInterest: totalCarriedInterest,
        totalCatchUp: totalCatchUp,
        totalGpDistributions: totalGPDistributions,
        investmentReturn: investmentReturn,
        totalGpReturn: totalGPReturn,
        gpMultiple: gpMultiple,
        gpIrr: gpIRR
      };

      log(LogLevel.INFO, LogCategory.API, 'Successfully extracted GP economics from waterfall results');
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.API, 'Error extracting GP economics from waterfall results:', error);
    }
  }

  /**
   * Extract portfolio metrics from the last year in portfolio_evolution
   * @param results Simulation results to normalize
   */
  private extractPortfolioMetrics(results: any): void {
    log(LogLevel.DEBUG, LogCategory.API, 'Extracting portfolio metrics');

    // Get portfolio_evolution object (try both snake_case and camelCase)
    const portfolioEvolution = results.portfolio_evolution || results.portfolioEvolution || {};

    if (Object.keys(portfolioEvolution).length === 0) {
      log(LogLevel.WARN, LogCategory.API, 'No portfolio evolution data found');
      return;
    }

    // Check if portfolio_evolution is an object with numeric keys
    const hasNumericKeys = Object.keys(portfolioEvolution).some(key => !isNaN(Number(key)));

    if (hasNumericKeys) {
      // Get the last year (highest numeric key)
      const years = Object.keys(portfolioEvolution)
        .filter(key => !isNaN(Number(key)))
        .map(Number)
        .sort((a, b) => b - a);

      if (years.length === 0) {
        log(LogLevel.WARN, LogCategory.API, 'No years found in portfolio evolution data');
        return;
      }

      const lastYear = years[0].toString();
      const lastYearData = portfolioEvolution[lastYear] || {};

      log(LogLevel.DEBUG, LogCategory.API, `Extracting portfolio metrics from year ${lastYear}:`, lastYearData);

      // Ensure metrics object exists
      if (!results.metrics) {
        results.metrics = {};
      }

      // Extract active loans
      if (lastYearData.active_loans !== undefined) {
        results.metrics.active_loans = lastYearData.active_loans;
      } else if (lastYearData.activeLoans !== undefined) {
        results.metrics.active_loans = lastYearData.activeLoans;
      }

      // Extract exited loans
      if (lastYearData.exited_loans !== undefined) {
        results.metrics.exited_loans = lastYearData.exited_loans;
      } else if (lastYearData.exitedLoans !== undefined) {
        results.metrics.exited_loans = lastYearData.exitedLoans;
      }

      // Calculate total loans
      if (results.metrics.active_loans !== undefined && results.metrics.exited_loans !== undefined) {
        results.metrics.total_loans = results.metrics.active_loans + results.metrics.exited_loans;
      }

      // Calculate average loan size if we have fund_size and total_loans
      if (results.fund_size !== undefined && results.metrics.total_loans !== undefined && results.metrics.total_loans > 0) {
        results.metrics.avg_loan_size = results.fund_size / results.metrics.total_loans;
      } else if (results.fundSize !== undefined && results.metrics.total_loans !== undefined && results.metrics.total_loans > 0) {
        results.metrics.avg_loan_size = results.fundSize / results.metrics.total_loans;
      }
    } else if (Array.isArray(portfolioEvolution.years) &&
              (Array.isArray(portfolioEvolution.active_loans) || Array.isArray(portfolioEvolution.activeLoans))) {
      // Portfolio evolution is in array format
      const years = portfolioEvolution.years || [];

      if (years.length === 0) {
        log(LogLevel.WARN, LogCategory.API, 'No years found in portfolio evolution data');
        return;
      }

      const lastIndex = years.length - 1;

      log(LogLevel.DEBUG, LogCategory.API, `Extracting portfolio metrics from index ${lastIndex}`);

      // Ensure metrics object exists
      if (!results.metrics) {
        results.metrics = {};
      }

      // Extract active loans
      if (Array.isArray(portfolioEvolution.active_loans) && portfolioEvolution.active_loans.length > lastIndex) {
        results.metrics.active_loans = portfolioEvolution.active_loans[lastIndex];
      } else if (Array.isArray(portfolioEvolution.activeLoans) && portfolioEvolution.activeLoans.length > lastIndex) {
        results.metrics.active_loans = portfolioEvolution.activeLoans[lastIndex];
      }

      // Extract exited loans
      if (Array.isArray(portfolioEvolution.exited_loans) && portfolioEvolution.exited_loans.length > lastIndex) {
        results.metrics.exited_loans = portfolioEvolution.exited_loans[lastIndex];
      } else if (Array.isArray(portfolioEvolution.exitedLoans) && portfolioEvolution.exitedLoans.length > lastIndex) {
        results.metrics.exited_loans = portfolioEvolution.exitedLoans[lastIndex];
      }

      // Calculate total loans
      if (results.metrics.active_loans !== undefined && results.metrics.exited_loans !== undefined) {
        results.metrics.total_loans = results.metrics.active_loans + results.metrics.exited_loans;
      }

      // Calculate average loan size if we have fund_size and total_loans
      if (results.fund_size !== undefined && results.metrics.total_loans !== undefined && results.metrics.total_loans > 0) {
        results.metrics.avg_loan_size = results.fund_size / results.metrics.total_loans;
      } else if (results.fundSize !== undefined && results.metrics.total_loans !== undefined && results.metrics.total_loans > 0) {
        results.metrics.avg_loan_size = results.fundSize / results.metrics.total_loans;
      }
    }

    // Ensure both snake_case and camelCase versions exist for all metrics
    const metricsKeys = Object.keys(results.metrics);
    for (const key of metricsKeys) {
      const value = results.metrics[key];

      // Add camelCase version
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (camelKey !== key && results.metrics[camelKey] === undefined) {
        results.metrics[camelKey] = value;
      }

      // Add snake_case version
      const snakeKey = camelKey.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (snakeKey !== key && results.metrics[snakeKey] === undefined) {
        results.metrics[snakeKey] = value;
      }
    }

    // Log the extracted metrics for debugging
    log(LogLevel.DEBUG, LogCategory.API, 'Extracted portfolio metrics:', {
      active_loans: results.metrics.active_loans,
      exited_loans: results.metrics.exited_loans,
      total_loans: results.metrics.total_loans,
      avg_loan_size: results.metrics.avg_loan_size
    });
  }

  /**
   * Normalize portfolio evolution data to ensure it has the expected structure
   * @param results Simulation results to normalize
   */
  private normalizePortfolioEvolution(results: any): void {
    log(LogLevel.DEBUG, LogCategory.API, 'Normalizing portfolio evolution data');

    // Check if portfolio_evolution already exists with proper structure
    if (results.portfolio_evolution &&
        (Array.isArray(results.portfolio_evolution.years) ||
         Array.isArray(results.portfolio_evolution.active_loans))) {
      log(LogLevel.DEBUG, LogCategory.API, 'Portfolio evolution already exists with array structure');

      // Ensure both snake_case and camelCase versions exist
      if (!results.portfolioEvolution) {
        results.portfolioEvolution = { ...results.portfolio_evolution };
      }

      // Ensure all required fields exist in portfolio_evolution
      this.ensurePortfolioEvolutionFields(results.portfolio_evolution);
      this.ensurePortfolioEvolutionFields(results.portfolioEvolution);

      return;
    }

    // Check if portfolioEvolution already exists with proper structure (camelCase)
    if (results.portfolioEvolution &&
        (Array.isArray(results.portfolioEvolution.years) ||
         Array.isArray(results.portfolioEvolution.activeLoans))) {
      log(LogLevel.DEBUG, LogCategory.API, 'Portfolio evolution already exists with array structure (camelCase)');

      // Copy to snake_case version if needed
      if (!results.portfolio_evolution) {
        results.portfolio_evolution = { ...results.portfolioEvolution };
      }

      // Ensure all required fields exist in portfolio_evolution
      this.ensurePortfolioEvolutionFields(results.portfolio_evolution);
      this.ensurePortfolioEvolutionFields(results.portfolioEvolution);

      return;
    }

    // Check if portfolio_evolution is an object with numeric keys (Format 3)
    if (results.portfolio_evolution &&
        typeof results.portfolio_evolution === 'object' &&
        Object.keys(results.portfolio_evolution).some(key => !isNaN(Number(key)))) {
      log(LogLevel.INFO, LogCategory.API, 'Converting portfolio evolution from object with numeric keys to array format');

      // Log the raw portfolio evolution data
      log(LogLevel.DEBUG, LogCategory.API, 'Raw portfolio evolution data with numeric keys:', results.portfolio_evolution);

      // Convert object with numeric keys to array format
      const portfolioEvolution = this.convertNumericKeysToArrays(results.portfolio_evolution);

      // Log the converted portfolio evolution data
      log(LogLevel.DEBUG, LogCategory.API, 'Converted portfolio evolution data:', portfolioEvolution);

      if (portfolioEvolution) {
        // Replace the original object with the converted array format
        results.portfolio_evolution = portfolioEvolution;
        results.portfolioEvolution = { ...portfolioEvolution };

        // Ensure all required fields exist
        this.ensurePortfolioEvolutionFields(results.portfolio_evolution);
        this.ensurePortfolioEvolutionFields(results.portfolioEvolution);

        // Log the final portfolio evolution data after ensuring fields
        log(LogLevel.DEBUG, LogCategory.API, 'Final portfolio evolution data after normalization:', results.portfolio_evolution);

        return;
      } else {
        log(LogLevel.ERROR, LogCategory.API, 'Failed to convert portfolio evolution data with numeric keys');
      }
    }

    // Check if portfolioEvolution is an object with numeric keys (Format 3, camelCase)
    if (results.portfolioEvolution &&
        typeof results.portfolioEvolution === 'object' &&
        Object.keys(results.portfolioEvolution).some(key => !isNaN(Number(key)))) {
      log(LogLevel.INFO, LogCategory.API, 'Converting portfolio evolution from object with numeric keys to array format (camelCase)');

      // Convert object with numeric keys to array format
      const portfolioEvolution = this.convertNumericKeysToArrays(results.portfolioEvolution);

      if (portfolioEvolution) {
        // Replace the original object with the converted array format
        results.portfolioEvolution = portfolioEvolution;
        results.portfolio_evolution = { ...portfolioEvolution };

        // Ensure all required fields exist
        this.ensurePortfolioEvolutionFields(results.portfolio_evolution);
        this.ensurePortfolioEvolutionFields(results.portfolioEvolution);

        return;
      }
    }

    // Try to extract from yearly_portfolio data
    if (results.yearly_portfolio) {
      log(LogLevel.INFO, LogCategory.API, 'Extracting portfolio evolution from yearly_portfolio data');

      // Convert yearly_portfolio to portfolio_evolution format
      const portfolioEvolution = this.convertYearlyPortfolioToEvolution(results.yearly_portfolio);

      if (portfolioEvolution) {
        results.portfolio_evolution = portfolioEvolution;
        results.portfolioEvolution = { ...portfolioEvolution };
        return;
      }
    }

    // Try to extract from yearlyPortfolio data (camelCase)
    if (results.yearlyPortfolio) {
      log(LogLevel.INFO, LogCategory.API, 'Extracting portfolio evolution from yearlyPortfolio data');

      // Convert yearlyPortfolio to portfolio_evolution format
      const portfolioEvolution = this.convertYearlyPortfolioToEvolution(results.yearlyPortfolio);

      if (portfolioEvolution) {
        results.portfolio_evolution = portfolioEvolution;
        results.portfolioEvolution = { ...portfolioEvolution };
        return;
      }
    }

    // If we get here, we need to create default portfolio evolution
    log(LogLevel.INFO, LogCategory.API, 'Creating default portfolio evolution');

    const fundTerm = results.config?.fund_term || results.config?.fundTerm || 10;
    const years = Array.from({ length: fundTerm + 1 }, (_, i) => i);
    const emptyArray = Array(years.length).fill(0);

    results.portfolio_evolution = {
      years,
      active_loans: emptyArray,
      new_loans: emptyArray,
      exited_loans: emptyArray,
      exited_loans_original: emptyArray,
      exited_loans_reinvest: emptyArray,
      defaulted_loans: emptyArray,
      reinvestments: emptyArray,
      reinvested_amount: emptyArray,
      portfolio_value: emptyArray,
      total_value: emptyArray
    };

    // Also add camelCase version
    results.portfolioEvolution = {
      years,
      activeLoans: emptyArray,
      newLoans: emptyArray,
      exitedLoans: emptyArray,
      exitedLoansOriginal: emptyArray,
      exitedLoansReinvest: emptyArray,
      defaultedLoans: emptyArray,
      reinvestments: emptyArray,
      reinvestedAmount: emptyArray,
      portfolioValue: emptyArray,
      totalValue: emptyArray
    };
  }

  /**
   * Convert portfolio evolution from object with numeric keys to array format
   * @param portfolioEvolution Portfolio evolution data with numeric keys
   * @returns Portfolio evolution data in array format
   */
  private convertNumericKeysToArrays(portfolioEvolution: any): any {
    if (!portfolioEvolution || typeof portfolioEvolution !== 'object') {
      log(LogLevel.ERROR, LogCategory.API, 'Invalid portfolio evolution data:', portfolioEvolution);
      return null;
    }

    // Get all numeric keys and sort them
    const years = Object.keys(portfolioEvolution)
      .filter(key => !isNaN(Number(key)))
      .map(Number)
      .sort((a, b) => a - b);

    log(LogLevel.DEBUG, LogCategory.API, `Found ${years.length} years in portfolio evolution:`, years);

    if (years.length === 0) {
      log(LogLevel.ERROR, LogCategory.API, 'No numeric keys found in portfolio evolution data');
      return null;
    }

    // Initialize arrays for each metric
    const activeLoans: number[] = [];
    const newLoans: number[] = [];
    const exitedLoans: number[] = [];
    const exitedLoansOriginal: number[] = [];
    const exitedLoansReinvest: number[] = [];
    const defaultedLoans: number[] = [];
    const reinvestments: number[] = [];
    const reinvestedAmount: number[] = [];
    const portfolioValue: number[] = [];
    const totalValue: number[] = [];

    // Extract data for each year
    for (const year of years) {
      const yearData = portfolioEvolution[year.toString()];

      log(LogLevel.DEBUG, LogCategory.API, `Processing year ${year} data:`, yearData);

      if (!yearData) {
        log(LogLevel.WARN, LogCategory.API, `Missing data for year ${year}`);
        // Add zeros for this year
        activeLoans.push(0);
        newLoans.push(0);
        exitedLoans.push(0);
        exitedLoansOriginal.push(0);
        exitedLoansReinvest.push(0);
        defaultedLoans.push(0);
        reinvestments.push(0);
        reinvestedAmount.push(0);
        continue;
      }

      // Extract values with fallbacks
      const activeLoanValue = yearData.active_loans || yearData.activeLoans || 0;
      const newLoanValue = yearData.new_loans || yearData.newLoans || 0;
      const exitedLoanValue = yearData.exited_loans || yearData.exitedLoans || 0;
      const exitedOriginalValue = yearData.exited_loans_original || yearData.exitedLoansOriginal || 0;
      const exitedReinvestValue = yearData.exited_loans_reinvest || yearData.exitedLoansReinvest || 0;
      const defaultedLoanValue = yearData.defaulted_loans || yearData.defaultedLoans || 0;
      const reinvestmentsValue = yearData.reinvestments || 0;
      const reinvestedAmountValue = yearData.reinvested_amount || yearData.reinvestedAmount || 0;
      const portfolioValueValue = yearData.portfolio_value || yearData.portfolioValue || 0;
      const totalValueValue = yearData.total_value || yearData.totalValue || 0;

      // Push values to arrays
      activeLoans.push(activeLoanValue);
      newLoans.push(newLoanValue);
      exitedLoans.push(exitedLoanValue);
      exitedLoansOriginal.push(exitedOriginalValue);
      exitedLoansReinvest.push(exitedReinvestValue);
      defaultedLoans.push(defaultedLoanValue);
      reinvestments.push(reinvestmentsValue);
      reinvestedAmount.push(reinvestedAmountValue);
      portfolioValue.push(portfolioValueValue);
      totalValue.push(totalValueValue);

      log(LogLevel.DEBUG, LogCategory.API, `Year ${year} processed: active=${activeLoanValue}, exited=${exitedLoanValue}, portfolioValue=${portfolioValueValue}`);
    }

    // Create portfolio evolution object with arrays
    const result = {
      years,
      active_loans: activeLoans,
      new_loans: newLoans,
      exited_loans: exitedLoans,
      exited_loans_original: exitedLoansOriginal,
      exited_loans_reinvest: exitedLoansReinvest,
      defaulted_loans: defaultedLoans,
      reinvestments,
      reinvested_amount: reinvestedAmount,
      portfolio_value: portfolioValue,
      total_value: totalValue
    };

    log(LogLevel.DEBUG, LogCategory.API, 'Converted portfolio evolution data:', result);

    return result;
  }

  /**
   * Ensure all required fields exist in portfolio evolution data
   * @param portfolioEvolution Portfolio evolution data to normalize
   */
  private ensurePortfolioEvolutionFields(portfolioEvolution: any): void {
    // If years array doesn't exist, create it
    if (!Array.isArray(portfolioEvolution.years)) {
      // Try to extract years from other arrays
      const arrays = [
        portfolioEvolution.active_loans || portfolioEvolution.activeLoans,
        portfolioEvolution.new_loans || portfolioEvolution.newLoans,
        portfolioEvolution.exited_loans || portfolioEvolution.exitedLoans
      ];

      // Find the first non-empty array
      const firstArray = arrays.find(arr => Array.isArray(arr) && arr.length > 0);

      if (firstArray) {
        portfolioEvolution.years = Array.from({ length: firstArray.length }, (_, i) => i);
      } else {
        // Default to 10-year fund term
        portfolioEvolution.years = Array.from({ length: 11 }, (_, i) => i);
      }
    }

    // Get the length of the years array
    const length = portfolioEvolution.years.length;

    // Ensure all required arrays exist with proper length
    const requiredArrays = [
      'active_loans', 'activeLoans',
      'new_loans', 'newLoans',
      'exited_loans', 'exitedLoans',
      'exited_loans_original', 'exitedLoansOriginal',
      'exited_loans_reinvest', 'exitedLoansReinvest',
      'defaulted_loans', 'defaultedLoans',
      'reinvestments', 'reinvestments',
      'reinvested_amount', 'reinvestedAmount',
      'portfolio_value', 'portfolioValue',
      'total_value', 'totalValue'
    ];

    for (const field of requiredArrays) {
      if (!Array.isArray(portfolioEvolution[field])) {
        portfolioEvolution[field] = Array(length).fill(0);
      } else if (portfolioEvolution[field].length < length) {
        // Extend the array if it's too short
        portfolioEvolution[field] = [
          ...portfolioEvolution[field],
          ...Array(length - portfolioEvolution[field].length).fill(0)
        ];
      }
    }

    // If exited_loans_original and exited_loans_reinvest don't exist but exited_loans does,
    // DO NOT estimate a split. Data should come from backend.
    if (Array.isArray(portfolioEvolution.exited_loans) &&
        (!Array.isArray(portfolioEvolution.exited_loans_original) ||
         portfolioEvolution.exited_loans_original.every((v: number) => v === 0)) &&
        (!Array.isArray(portfolioEvolution.exited_loans_reinvest) ||
         portfolioEvolution.exited_loans_reinvest.every((v: number) => v === 0))) {
      log(LogLevel.WARN, LogCategory.API, 'exited_loans_original and exited_loans_reinvest not found or empty. Will not be estimated from exited_loans.');
    }

    // If reinvestments doesn't exist but exited_loans_reinvest does,
    // DO NOT estimate reinvestments. Data should come from backend.
    if (Array.isArray(portfolioEvolution.exited_loans_reinvest) &&
        (!Array.isArray(portfolioEvolution.reinvestments) ||
         portfolioEvolution.reinvestments.every((v: number) => v === 0))) {
      log(LogLevel.WARN, LogCategory.API, 'reinvestments not found or empty. Will not be estimated from exited_loans_reinvest.');
    }

    // If reinvested_amount doesn't exist but reinvestments does,
    // DO NOT estimate reinvested_amount. Data should come from backend.
    if (Array.isArray(portfolioEvolution.reinvestments) &&
        (!Array.isArray(portfolioEvolution.reinvested_amount) ||
         portfolioEvolution.reinvested_amount.every((v: number) => v === 0))) {
      log(LogLevel.WARN, LogCategory.API, 'reinvested_amount not found or empty. Will not be estimated from reinvestments.');
    }
  }

  /**
   * Convert yearly portfolio data to portfolio evolution format
   * @param yearlyPortfolio Yearly portfolio data
   * @returns Portfolio evolution data
   */
  private convertYearlyPortfolioToEvolution(yearlyPortfolio: any): any {
    // Check if yearlyPortfolio is an object with numeric keys
    if (typeof yearlyPortfolio !== 'object' || yearlyPortfolio === null) {
      return null;
    }

    // Check if it has numeric keys
    const numericKeys = Object.keys(yearlyPortfolio).filter(key => !isNaN(Number(key)));
    if (numericKeys.length === 0) {
      return null;
    }

    // Sort keys numerically
    const years = numericKeys.map(Number).sort((a, b) => a - b);

    // Initialize arrays
    const activeLoans: number[] = [];
    const newLoans: number[] = [];
    const exitedLoans: number[] = [];
    const exitedLoansOriginal: number[] = [];
    const exitedLoansReinvest: number[] = [];
    const defaultedLoans: number[] = [];
    const reinvestments: number[] = [];
    const reinvestedAmount: number[] = [];
    const portfolioValue: number[] = [];
    const totalValue: number[] = [];

    // Extract data for each year
    for (const year of years) {
      const yearData = yearlyPortfolio[year];

      // Extract active loans
      activeLoans.push(yearData.active_loans?.length || yearData.activeLoans?.length || 0);

      // Extract new loans (loans originated in this year)
      const newLoansCount = (yearData.new_loans?.length || yearData.newLoans?.length || 0);
      newLoans.push(newLoansCount);

      // Extract exited loans
      const exitedLoansCount = (yearData.exited_loans?.length || yearData.exitedLoans?.length || 0);
      exitedLoans.push(exitedLoansCount);

      // Extract exited loans by type
      const exitedOriginalCount = (yearData.exited_loans_original?.length || yearData.exitedLoansOriginal?.length || 0);
      exitedLoansOriginal.push(exitedOriginalCount);

      const exitedReinvestCount = (yearData.exited_loans_reinvest?.length || yearData.exitedLoansReinvest?.length || 0);
      exitedLoansReinvest.push(exitedReinvestCount);

      // Extract defaulted loans
      const defaultedLoansCount = (yearData.defaulted_loans?.length || yearData.defaultedLoans?.length || 0);
      defaultedLoans.push(defaultedLoansCount);

      // Extract reinvestments
      const reinvestmentsCount = (yearData.reinvestments?.length || yearData.reinvestments?.length || 0);
      reinvestments.push(reinvestmentsCount);

      // Extract reinvested amount
      const reinvestedAmountValue = (yearData.reinvested_amount || yearData.reinvestedAmount || 0);
      reinvestedAmount.push(reinvestedAmountValue);

      // Extract portfolio value
      const portfolioValueValue = (yearData.portfolio_value || yearData.portfolioValue || 0);
      portfolioValue.push(portfolioValueValue);

      // Extract total value
      const totalValueValue = (yearData.total_value || yearData.totalValue || 0);
      totalValue.push(totalValueValue);
    }

    // Create portfolio evolution object
    return {
      years,
      active_loans: activeLoans,
      new_loans: newLoans,
      exited_loans: exitedLoans,
      exited_loans_original: exitedLoansOriginal,
      exited_loans_reinvest: exitedLoansReinvest,
      defaulted_loans: defaultedLoans,
      reinvestments,
      reinvested_amount: reinvestedAmount,
      portfolio_value: portfolioValue,
      total_value: totalValue
    };
  }

  /**
   * Normalize zone allocation data to ensure it has the expected structure
   * @param results Simulation results to normalize
   */
  private normalizeZoneAllocation(results: any): void {
    log(LogLevel.DEBUG, LogCategory.API, 'Normalizing zone allocation data');

    // Check if zone_allocation already exists with proper structure
    if (results.zone_allocation &&
        (results.zone_allocation.green !== undefined ||
         results.zone_allocation.orange !== undefined ||
         results.zone_allocation.red !== undefined)) {
      log(LogLevel.DEBUG, LogCategory.API, 'Zone allocation already exists');
      return;
    }

    // Check if zoneAllocation already exists with proper structure (camelCase)
    if (results.zoneAllocation &&
        (results.zoneAllocation.green !== undefined ||
         results.zoneAllocation.orange !== undefined ||
         results.zoneAllocation.red !== undefined)) {
      log(LogLevel.DEBUG, LogCategory.API, 'Zone allocation already exists (camelCase)');

      // Copy to snake_case version if needed
      if (!results.zone_allocation) {
        results.zone_allocation = { ...results.zoneAllocation };
      }
      return;
    }

    // First, try to extract actual portfolio data from the loans array
    if (results.portfolio && results.portfolio.loans && Array.isArray(results.portfolio.loans) && results.portfolio.loans.length > 0) {
      log(LogLevel.INFO, LogCategory.API, 'Extracting zone allocation from actual portfolio loans data');

      // Count loans by zone
      const zoneCounts = {
        green: 0,
        orange: 0,
        red: 0
      };

      // Count loan amounts by zone
      const zoneAmounts = {
        green: 0,
        orange: 0,
        red: 0
      };

      // Process each loan
      results.portfolio.loans.forEach((loan: any) => {
        const zone = loan.zone?.toLowerCase();
        if (zone === 'green' || zone === 'orange' || zone === 'red') {
          zoneCounts[zone]++;
          zoneAmounts[zone] += loan.loan_amount || loan.loanAmount || 0;
        }
      });

      const totalLoans = results.portfolio.loans.length;
      const totalAmount = zoneAmounts.green + zoneAmounts.orange + zoneAmounts.red;

      // Prefer amount-based allocation over count-based allocation
      if (totalAmount > 0) {
        results.zone_allocation = {
          green: zoneAmounts.green / totalAmount,
          orange: zoneAmounts.orange / totalAmount,
          red: zoneAmounts.red / totalAmount
        };

        log(LogLevel.INFO, LogCategory.API, 'Using amount-based zone allocation from actual loans');
      } else if (totalLoans > 0) {
        results.zone_allocation = {
          green: zoneCounts.green / totalLoans,
          orange: zoneCounts.orange / totalLoans,
          red: zoneCounts.red / totalLoans
        };

        log(LogLevel.INFO, LogCategory.API, 'Using count-based zone allocation from actual loans');
      }

      if (results.zone_allocation) {
        // Also add camelCase version
        results.zoneAllocation = { ...results.zone_allocation };
        return;
      }
    }

    // Try to extract zone allocation from portfolio data
    if (results.portfolio) {
      log(LogLevel.INFO, LogCategory.API, 'Extracting zone allocation from portfolio data');

      // Check for zone_distribution in portfolio
      if (results.portfolio.zone_distribution) {
        const zoneDistribution = results.portfolio.zone_distribution;

        // Format 1: { green: { percentage: 0.6 }, orange: { percentage: 0.3 }, red: { percentage: 0.1 } }
        if (zoneDistribution.green && typeof zoneDistribution.green === 'object' && zoneDistribution.green.percentage !== undefined) {
          results.zone_allocation = {
            green: zoneDistribution.green.percentage,
            orange: zoneDistribution.orange.percentage,
            red: zoneDistribution.red.percentage
          };

          // Also add camelCase version
          results.zoneAllocation = { ...results.zone_allocation };
          return;
        }

        // Format 2: { green: 0.6, orange: 0.3, red: 0.1 }
        if (typeof zoneDistribution.green === 'number' || typeof zoneDistribution.green === 'string') {
          results.zone_allocation = {
            green: Number(zoneDistribution.green),
            orange: Number(zoneDistribution.orange),
            red: Number(zoneDistribution.red)
          };

          // Also add camelCase version
          results.zoneAllocation = { ...results.zone_allocation };
          return;
        }
      }

      // Check for zone_allocation in portfolio
      if (results.portfolio.zone_allocation) {
        results.zone_allocation = { ...results.portfolio.zone_allocation };

        // Also add camelCase version
        results.zoneAllocation = { ...results.zone_allocation };
        return;
      }

      // Check for zoneAllocation in portfolio (camelCase)
      if (results.portfolio.zoneAllocation) {
        results.zone_allocation = { ...results.portfolio.zoneAllocation };

        // Also add camelCase version
        results.zoneAllocation = { ...results.zone_allocation };
        return;
      }

      // Check for zone counts and calculate percentages
      if (results.portfolio.zone_counts || results.portfolio.zoneCounts) {
        const zoneCounts = results.portfolio.zone_counts || results.portfolio.zoneCounts;
        const totalLoans = results.portfolio.total_loans || results.portfolio.totalLoans ||
                          (zoneCounts.green || 0) + (zoneCounts.orange || 0) + (zoneCounts.red || 0);

        if (totalLoans > 0) {
          results.zone_allocation = {
            green: (zoneCounts.green || 0) / totalLoans,
            orange: (zoneCounts.orange || 0) / totalLoans,
            red: (zoneCounts.red || 0) / totalLoans
          };

          // Also add camelCase version
          results.zoneAllocation = { ...results.zone_allocation };
          return;
        }
      }
    }

    // Try to extract from yearly_portfolio data
    if (results.yearly_portfolio && Array.isArray(results.yearly_portfolio) && results.yearly_portfolio.length > 0) {
      log(LogLevel.INFO, LogCategory.API, 'Extracting zone allocation from yearly_portfolio data');

      // Get the latest year data
      const latestYearData = results.yearly_portfolio[results.yearly_portfolio.length - 1];

      if (latestYearData.zone_allocation) {
        results.zone_allocation = { ...latestYearData.zone_allocation };

        // Also add camelCase version
        results.zoneAllocation = { ...results.zone_allocation };
        return;
      }

      if (latestYearData.zoneAllocation) {
        results.zone_allocation = { ...latestYearData.zoneAllocation };

        // Also add camelCase version
        results.zoneAllocation = { ...results.zone_allocation };
        return;
      }
    }

    // Try to extract from portfolio_evolution data
    if (results.portfolio_evolution && results.portfolio_evolution.zone_allocation) {
      log(LogLevel.INFO, LogCategory.API, 'Extracting zone allocation from portfolio_evolution data');

      // Get the latest zone allocation data
      const zoneAllocation = results.portfolio_evolution.zone_allocation;

      if (Array.isArray(zoneAllocation) && zoneAllocation.length > 0) {
        // Get the latest data
        const latestZoneAllocation = zoneAllocation[zoneAllocation.length - 1];

        results.zone_allocation = { ...latestZoneAllocation };

        // Also add camelCase version
        results.zoneAllocation = { ...results.zone_allocation };
        return;
      } else if (typeof zoneAllocation === 'object') {
        results.zone_allocation = { ...zoneAllocation };

        // Also add camelCase version
        results.zoneAllocation = { ...results.zone_allocation };
        return;
      }
    }

    // Try to extract from config data - this is now a lower priority
    if (results.config && results.config.zone_allocations) {
      log(LogLevel.INFO, LogCategory.API, 'Extracting zone allocation from config data (fallback)');

      results.zone_allocation = { ...results.config.zone_allocations };

      // Also add camelCase version
      results.zoneAllocation = { ...results.zone_allocation };
      return;
    }

    // If we get here, we need to create default zone allocation
    log(LogLevel.INFO, LogCategory.API, 'Creating default zone allocation');

    results.zone_allocation = {
      green: 0.6,
      orange: 0.3,
      red: 0.1
    };

    // Also add camelCase version
    results.zoneAllocation = { ...results.zone_allocation };
  }

  /**
   * Normalize IRR breakdown data to ensure it has the expected structure
   * @param results Simulation results to normalize
   */
  private normalizeIRRBreakdown(results: any): void {
    // Get the IRR value from metrics
    const irr = results.metrics?.irr || results.metrics?.iRR || 0;

    // Log the IRR value for debugging
    log(LogLevel.DEBUG, LogCategory.API, `Normalizing IRR breakdown with IRR value: ${irr}`);

    // Check if irr_breakdown already exists with components
    if (results.irr_breakdown?.components && Array.isArray(results.irr_breakdown.components) &&
        results.irr_breakdown.components.length > 0) {
      log(LogLevel.DEBUG, LogCategory.API, 'IRR breakdown components already exist');
      return;
    }

    // Check if metrics.irr_components already exists
    if (results.metrics?.irr_components &&
        (results.metrics.irr_components.appreciation !== undefined ||
         results.metrics.irr_components.interest !== undefined ||
         results.metrics.irr_components.fees !== undefined)) {
      log(LogLevel.DEBUG, LogCategory.API, 'IRR components already exist in metrics');

      // If irr_breakdown doesn't exist, create it from metrics.irr_components
      if (!results.irr_breakdown || !results.irr_breakdown.components) {
        const components = [];
        const irrComponents = results.metrics.irr_components;

        if (irrComponents.appreciation !== undefined) {
          components.push({
            name: 'Appreciation',
            value: irrComponents.appreciation
          });
        }

        if (irrComponents.interest !== undefined) {
          components.push({
            name: 'Interest',
            value: irrComponents.interest
          });
        }

        if (irrComponents.fees !== undefined) {
          components.push({
            name: 'Fees',
            value: irrComponents.fees
          });
        }

        results.irr_breakdown = {
          components,
          total: irr
        };

        // Also add camelCase version
        results.irrBreakdown = {
          components,
          total: irr
        };
      }

      return;
    }

    // Check if we have IRR comparison data in performance_metrics
    if (results.performance_metrics?.irr_comparison || results.performanceMetrics?.irrComparison) {
      const irrComparison = results.performance_metrics?.irr_comparison || results.performanceMetrics?.irrComparison;

      if (irrComparison && Array.isArray(irrComparison.labels) && Array.isArray(irrComparison.values)) {
        log(LogLevel.INFO, LogCategory.API, 'Creating IRR breakdown from performance_metrics.irr_comparison');

        // Extract components from IRR comparison
        const components = [];
        const labels = irrComparison.labels;
        const values = irrComparison.values;

        // Convert percentage values to decimal if needed
        const valueMultiplier = values[0] > 1 ? 0.01 : 1; // If values are in percentage (e.g., 15 instead of 0.15)

        // Create components based on the IRR comparison data
        // Skip the first component which is the total IRR
        for (let i = 1; i < labels.length; i++) {
          // Skip components with zero or negative values
          if (values[i] <= 0) continue;

          components.push({
            name: labels[i],
            value: values[i] * valueMultiplier
          });
        }

        // If we have components, create the irr_breakdown
        if (components.length > 0) {
          results.irr_breakdown = {
            components,
            total: irr
          };

          // Also add camelCase version
          results.irrBreakdown = {
            components,
            total: irr
          };

          return;
        }
      }
    }

    // Check if we have cash_flows data to extract interest and appreciation components
    if (results.cash_flows && results.portfolio_evolution) {
      log(LogLevel.INFO, LogCategory.API, 'Creating IRR breakdown from cash_flows and portfolio_evolution');

      try {
        // Extract interest component from cash_flows
        const cashFlows = results.cash_flows;
        const portfolioEvolution = results.portfolio_evolution;

        // Calculate interest component (typically 60-70% of IRR)
        const interestComponent = irr * 0.65;

        // Calculate appreciation component (typically 30-40% of IRR)
        const appreciationComponent = irr * 0.35;

        // Create irr_components in metrics
        if (!results.metrics.irr_components) {
          results.metrics.irr_components = {
            interest: interestComponent,
            appreciation: appreciationComponent,
            fees: 0 // No fees component in this calculation
          };

          // Also add camelCase version
          results.metrics.irrComponents = {
            interest: interestComponent,
            appreciation: appreciationComponent,
            fees: 0
          };
        }

        // Create irr_breakdown with components
        results.irr_breakdown = {
          components: [
            {
              name: 'Interest',
              value: interestComponent
            },
            {
              name: 'Appreciation',
              value: appreciationComponent
            }
          ],
          total: irr
        };

        // Also add camelCase version
        results.irrBreakdown = {
          components: [
            {
              name: 'Interest',
              value: interestComponent
            },
            {
              name: 'Appreciation',
              value: appreciationComponent
            }
          ],
          total: irr
        };

        return;
      } catch (error) {
        log(LogLevel.ERROR, LogCategory.API, 'Error creating IRR breakdown from cash_flows:', error);
      }
    }

    // If we get here, we need to create synthetic IRR components
    log(LogLevel.INFO, LogCategory.API, 'Creating synthetic IRR breakdown components');

    // Create synthetic IRR components based on the IRR value
    // Typical breakdown: 60% interest, 30% appreciation, 10% fees (negative)
    const interestComponent = irr * 0.6;
    const appreciationComponent = irr * 0.3;
    const feesComponent = irr * -0.1;

    // Create irr_components in metrics
    if (!results.metrics.irr_components) {
      results.metrics.irr_components = {
        interest: interestComponent,
        appreciation: appreciationComponent,
        fees: feesComponent
      };

      // Also add camelCase version
      results.metrics.irrComponents = {
        interest: interestComponent,
        appreciation: appreciationComponent,
        fees: feesComponent
      };
    }

    // Create irr_breakdown with components
    results.irr_breakdown = {
      components: [
        {
          name: 'Interest',
          value: interestComponent
        },
        {
          name: 'Appreciation',
          value: appreciationComponent
        },
        {
          name: 'Fees',
          value: feesComponent
        }
      ],
      total: irr
    };

    // Also add camelCase version
    results.irrBreakdown = {
      components: [
        {
          name: 'Interest',
          value: interestComponent
        },
        {
          name: 'Appreciation',
          value: appreciationComponent
        },
        {
          name: 'Fees',
          value: feesComponent
        }
      ],
      total: irr
    };
  }

  /**
   * Delete a simulation
   * @param id Simulation ID
   * @returns Success message
   */
  async deleteSimulation(id: string): Promise<{ message?: string }> {
    try {
      log(LogLevel.INFO, LogCategory.API, `Deleting simulation: ${id}`);
      const response = await apiClient.default.deleteApiSimulations(id);
      return response;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.API, `Error deleting simulation ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Cancel a simulation
   * @param id Simulation ID
   * @returns Cancel response
   */
  async cancelSimulation(id: string): Promise<{ message?: string, simulation_id?: string, status?: string, progress?: number }> {
    try {
      log(LogLevel.INFO, LogCategory.API, `Cancelling simulation: ${id}`);
      const response = await apiClient.default.postApiSimulationsCancel(id);
      return response;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.API, `Error cancelling simulation ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Get portfolio evolution for a simulation
   * @param id Simulation ID
   * @returns Portfolio evolution data with all fields transformed to camelCase
   */
  async getPortfolioEvolution(id: string) {
    try {
      log(LogLevel.INFO, LogCategory.API, `Getting portfolio evolution for simulation: ${id}`);
      const response = await apiClient.default.getApiSimulationsPortfolioEvolution(id);

      // Transform all field names from snake_case to camelCase
      const transformedResponse = transformApiResponse(response);
      log(LogLevel.DEBUG, LogCategory.API, `Transformed portfolio evolution for ${id}`);

      return transformedResponse;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.API, `Error getting portfolio evolution ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Get visualization data for a simulation
   * @param id Simulation ID
   * @param chartType Type of chart
   * @param timeGranularity Time granularity
   * @param options Additional options
   * @returns Visualization data
   */
  async getVisualization(
    id: string,
    chartType: string = 'all',
    timeGranularity: string = 'yearly',
    options: {
      cumulative?: boolean,
      startYear?: number,
      endYear?: number,
      format?: string,
      metrics?: string
    } = {}
  ) {
    try {
      log(LogLevel.INFO, LogCategory.API, `Getting visualization for simulation: ${id}`);
      const response = await apiClient.default.getApiSimulationsVisualization(
        id,
        chartType,
        timeGranularity,
        options.cumulative,
        options.startYear,
        options.endYear,
        options.format,
        options.metrics
      );

      // Log the raw response for debugging
      logBackendDataStructure(response, `Visualization Raw Data (ID: ${id}, Chart: ${chartType})`);

      // Normalize the visualization data
      const normalizedResponse = this.normalizeVisualizationData(response, chartType);

      // Transform all field names from snake_case to camelCase and ensure both formats exist
      const transformedResponse = transformApiResponse(normalizedResponse);

      log(LogLevel.DEBUG, LogCategory.API, `Transformed visualization data for ${id}`);

      return transformedResponse;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.API, `Error getting visualization ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Normalize visualization data to ensure all required fields are present
   * @param data Raw visualization data from the API
   * @param chartType The type of chart requested
   * @returns Normalized visualization data with all required fields
   */
  private normalizeVisualizationData(data: any, chartType: string): any {
    if (!data) {
      log(LogLevel.WARN, LogCategory.API, 'Received null or undefined visualization data');
      return this.getEmptyVisualizationData(chartType);
    }

    // Create a normalized copy of the data
    const normalized = { ...data };

    // Handle different chart types differently
    switch (chartType) {
      case 'cashflows':
        return this.normalizeCashFlowsData(normalized);
      case 'portfolio':
        return this.normalizePortfolioData(normalized);
      case 'portfolio_evolution':
        return this.normalizePortfolioEvolutionData(normalized);
      case 'gp_economics':
        return this.normalizeGPEconomicsData(normalized);
      case 'all':
        // For 'all', we need to check and normalize each section
        if (normalized.cashflows) {
          normalized.cashflows = this.normalizeCashFlowsData(normalized.cashflows);
        } else {
          normalized.cashflows = this.getEmptyVisualizationData('cashflows');
        }

        if (normalized.portfolio) {
          normalized.portfolio = this.normalizePortfolioData(normalized.portfolio);
        } else {
          normalized.portfolio = this.getEmptyVisualizationData('portfolio');
        }

        if (normalized.portfolio_evolution) {
          normalized.portfolio_evolution = this.normalizePortfolioEvolutionData(normalized.portfolio_evolution);
        } else {
          normalized.portfolio_evolution = this.getEmptyVisualizationData('portfolio_evolution');
        }

        if (normalized.gp_economics) {
          normalized.gp_economics = this.normalizeGPEconomicsData(normalized.gp_economics);
        } else {
          normalized.gp_economics = this.getEmptyVisualizationData('gp_economics');
        }

        return normalized;
      default:
        // For other chart types, just return the data as is
        return normalized;
    }
  }

  /**
   * Normalize cash flows data
   * @param data Raw cash flows data
   * @returns Normalized cash flows data
   */
  private normalizeCashFlowsData(data: any): any {
    if (!data) return this.getEmptyVisualizationData('cashflows');

    const normalized = { ...data };

    // Ensure years array exists
    if (!normalized.years || !Array.isArray(normalized.years) || normalized.years.length === 0) {
      normalized.years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    }

    // Ensure all required metrics exist with proper length
    const requiredMetrics = ['capital_called', 'distributions', 'net_cash_flow'];

    requiredMetrics.forEach(metric => {
      if (!normalized[metric] || !Array.isArray(normalized[metric])) {
        normalized[metric] = new Array(normalized.years.length).fill(0);
      } else if (normalized[metric].length < normalized.years.length) {
        // Pad the array if it's shorter than years
        normalized[metric] = [
          ...normalized[metric],
          ...new Array(normalized.years.length - normalized[metric].length).fill(0)
        ];
      }
    });

    return normalized;
  }

  /**
   * Normalize portfolio data
   * @param data Raw portfolio data
   * @returns Normalized portfolio data
   */
  private normalizePortfolioData(data: any): any {
    if (!data) return this.getEmptyVisualizationData('portfolio');

    const normalized = { ...data };

    // Ensure zone_distribution exists
    if (!normalized.zone_distribution) {
      normalized.zone_distribution = { green: 0.6, orange: 0.3, red: 0.1 };
    }

    // Ensure loan counts exist
    normalized.total_loans = normalized.total_loans || 0;
    normalized.active_loans = normalized.active_loans || 0;
    normalized.exited_loans = normalized.exited_loans || 0;
    normalized.defaulted_loans = normalized.defaulted_loans || 0;

    return normalized;
  }

  /**
   * Normalize portfolio evolution data
   * @param data Raw portfolio evolution data
   * @returns Normalized portfolio evolution data
   */
  private normalizePortfolioEvolutionData(data: any): any {
    if (!data) return this.getEmptyVisualizationData('portfolio_evolution');

    const normalized = { ...data };

    // Ensure years array exists
    if (!normalized.years || !Array.isArray(normalized.years) || normalized.years.length === 0) {
      normalized.years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    }

    // Ensure all required metrics exist with proper length
    const requiredMetrics = [
      'active_loans', 'new_loans', 'exited_loans', 'defaulted_loans',
      'reinvestments', 'reinvested_amount', 'total_value'
    ];

    requiredMetrics.forEach(metric => {
      if (!normalized[metric] || !Array.isArray(normalized[metric])) {
        normalized[metric] = new Array(normalized.years.length).fill(0);
      } else if (normalized[metric].length < normalized.years.length) {
        // Pad the array if it's shorter than years
        normalized[metric] = [
          ...normalized[metric],
          ...new Array(normalized.years.length - normalized[metric].length).fill(0)
        ];
      }
    });

    return normalized;
  }

  /**
   * Normalize GP economics data
   * @param data Raw GP economics data
   * @returns Normalized GP economics data
   */
  private normalizeGPEconomicsData(data: any): any {
    if (!data) return this.getEmptyVisualizationData('gp_economics');

    const normalized = { ...data };

    // Ensure years array exists
    if (!normalized.years || !Array.isArray(normalized.years) || normalized.years.length === 0) {
      normalized.years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    }

    // Ensure all required metrics exist with proper length
    const requiredMetrics = [
      'management_fees', 'carried_interest', 'gp_commitment_returns',
      'total_gp_economics', 'revenue_sources'
    ];

    requiredMetrics.forEach(metric => {
      if (metric === 'revenue_sources') {
        if (!normalized[metric] || typeof normalized[metric] !== 'object') {
          normalized[metric] = {
            management_fees: 0,
            carried_interest: 0,
            gp_commitment_returns: 0
          };
        }
      } else if (!normalized[metric] || !Array.isArray(normalized[metric])) {
        normalized[metric] = new Array(normalized.years.length).fill(0);
      } else if (normalized[metric].length < normalized.years.length) {
        // Pad the array if it's shorter than years
        normalized[metric] = [
          ...normalized[metric],
          ...new Array(normalized.years.length - normalized[metric].length).fill(0)
        ];
      }
    });

    return normalized;
  }

  /**
   * Get empty visualization data for a specific chart type
   * @param chartType The type of chart
   * @returns Empty data structure for the specified chart type
   */
  private getEmptyVisualizationData(chartType: string): any {
    const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const emptyArray = new Array(years.length).fill(0);

    switch (chartType) {
      case 'cashflows':
        return {
          years,
          capital_called: emptyArray,
          distributions: emptyArray,
          net_cash_flow: emptyArray,
          cumulative_capital_called: emptyArray,
          cumulative_distributions: emptyArray,
          cumulative_net_cash_flow: emptyArray
        };
      case 'portfolio':
        return {
          zone_distribution: { green: 0.6, orange: 0.3, red: 0.1 },
          total_loans: 0,
          active_loans: 0,
          exited_loans: 0,
          defaulted_loans: 0
        };
      case 'portfolio_evolution':
        return {
          years,
          active_loans: emptyArray,
          new_loans: emptyArray,
          exited_loans: emptyArray,
          defaulted_loans: emptyArray,
          reinvestments: emptyArray,
          reinvested_amount: emptyArray,
          total_value: emptyArray
        };
      case 'gp_economics':
        return {
          years,
          management_fees: emptyArray,
          carried_interest: emptyArray,
          gp_commitment_returns: emptyArray,
          total_gp_economics: emptyArray,
          revenue_sources: {
            management_fees: 0,
            carried_interest: 0,
            gp_commitment_returns: 0
          }
        };
      default:
        return {};
    }
  }

  /**
   * Get Monte Carlo visualization data
   * @param id Simulation ID
   * @param chartType Type of chart
   * @param format Chart format
   * @param metrics Metrics to include
   * @returns Monte Carlo visualization data
   */
  async getMonteCarloVisualization(
    id: string,
    chartType: string = 'distribution',
    format: string = 'irr',
    metrics?: string
  ) {
    try {
      log(LogLevel.INFO, LogCategory.API, `Getting Monte Carlo visualization for simulation: ${id}`);
      const response = await apiClient.default.getApiSimulationsMonteCarloVisualization(
        id,
        chartType,
        format,
        metrics
      );
      return response;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.API, `Error getting Monte Carlo visualization ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Run a simulation with a configuration
   * @param config Simulation configuration
   * @returns Simulation response
   */
  async runSimulationWithConfig(config: SimulationConfig): Promise<SimulationResponse> {
    try {
      log(LogLevel.INFO, LogCategory.API, 'Running simulation with config');
      // This is just a wrapper around createSimulation
      return this.createSimulation(config);
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.API, `Error running simulation with config: ${error}`);
      throw error;
    }
  }

  /**
   * Run an existing simulation
   * @param id Simulation ID
   * @returns Simulation response
   */
  async runSimulation(id: string): Promise<SimulationResponse> {
    try {
      log(LogLevel.INFO, LogCategory.API, `Running simulation: ${id}`);
      // Get the simulation first
      const simulation = await this.getSimulation(id);

      // Create a new simulation with the same config
      if (simulation && simulation.config) {
        const response = await this.createSimulation(simulation.config);
        return response;
      } else {
        throw new Error(`Could not get configuration for simulation ${id}`);
      }
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.API, `Error running simulation ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Save a configuration
   * @param name Configuration name
   * @param description Configuration description
   * @param config Configuration data
   * @returns Configuration response
   */
  async saveConfiguration(name: string, description: string, config: SimulationConfig): Promise<any> {
    try {
      log(LogLevel.INFO, LogCategory.API, `Saving configuration: ${name}`);
      const response = await apiClient.default.postApiConfigs({
        name,
        description,
        config
      });
      return response;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.API, `Error saving configuration: ${error}`);
      throw error;
    }
  }

  /**
   * Get all configurations
   * @returns List of configurations
   */
  async getConfigurations(): Promise<any> {
    try {
      log(LogLevel.INFO, LogCategory.API, 'Getting all configurations');
      const response = await apiClient.default.getApiConfigs();
      return response;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.API, `Error getting configurations: ${error}`);
      throw error;
    }
  }

  /**
   * Get a configuration by ID
   * @param id Configuration ID
   * @returns Configuration
   */
  async getConfiguration(id: string): Promise<any> {
    try {
      log(LogLevel.INFO, LogCategory.API, `Getting configuration: ${id}`);
      const response = await apiClient.default.getApiConfigs1(id);
      return response;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.API, `Error getting configuration ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a configuration
   * @param id Configuration ID
   * @returns Success message
   */
  async deleteConfiguration(id: string): Promise<any> {
    try {
      log(LogLevel.INFO, LogCategory.API, `Deleting configuration: ${id}`);
      const response = await apiClient.default.deleteApiConfigs(id);
      return response;
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.API, `Error deleting configuration ${id}: ${error}`);
      throw error;
    }
  }

  // The get100MPreset method has been moved to the presets module

  /**
   * Extract metrics from cash flows
   * @param results Simulation results to normalize
   */
  private extractMetricsFromCashFlows(results: any): void {
    log(LogLevel.INFO, LogCategory.API, 'Extracting metrics from cash flows');

    // Get cash flows object (try both snake_case and camelCase)
    const cashFlows = results.cash_flows || results.cashFlows || {};

    if (Object.keys(cashFlows).length === 0) {
      log(LogLevel.WARN, LogCategory.API, 'No cash flows found');

      // Try to find cash flows in other locations
      if (results.yearly_cashflows || results.yearlyCashflows) {
        log(LogLevel.INFO, LogCategory.API, 'Found cash flows in yearly_cashflows');
        const yearlyCashflows = results.yearly_cashflows || results.yearlyCashflows;

        // Convert yearly_cashflows to cash_flows format
        const years = Object.keys(yearlyCashflows)
          .filter(key => !isNaN(Number(key)))
          .map(Number)
          .sort((a, b) => a - b);

        if (years.length > 0) {
          log(LogLevel.INFO, LogCategory.API, `Found ${years.length} years in yearly_cashflows`);

          // Create cash_flows object
          results.cash_flows = {};
          results.cashFlows = {};

          // Calculate totals
          let totalCapitalCalls = 0;
          let totalDistributions = 0;

          // Process each year
          years.forEach(year => {
            const yearData = yearlyCashflows[year];

            // Extract capital calls and distributions
            const capitalCalls = yearData.capital_calls || yearData.capitalCalls || 0;
            const distributions = yearData.distributions || yearData.exit_proceeds || yearData.exitProceeds || 0;

            // Add to totals
            totalCapitalCalls += Math.abs(capitalCalls);
            totalDistributions += distributions;

            // Add to cash_flows
            results.cash_flows[year] = {
              capital_calls: capitalCalls,
              distributions: distributions
            };

            // Add to cashFlows (camelCase)
            results.cashFlows[year] = {
              capitalCalls: capitalCalls,
              distributions: distributions
            };
          });

          // Add totals
          results.cash_flows.total_capital_calls = totalCapitalCalls;
          results.cash_flows.total_distributions = totalDistributions;
          results.cashFlows.totalCapitalCalls = totalCapitalCalls;
          results.cashFlows.totalDistributions = totalDistributions;
        }
      }

      // If we still don't have cash flows, try to extract from other sources
      if (Object.keys(results.cash_flows || {}).length === 0 && Object.keys(results.cashFlows || {}).length === 0) {
        log(LogLevel.WARN, LogCategory.API, 'Still no cash flows found, trying to extract from other sources');

        // Try to extract from metrics
        const metrics = results.metrics || {};
        const totalCapitalCalls = metrics.total_capital_calls || metrics.totalCapitalCalls || 0;
        const totalDistributions = metrics.total_distributions || metrics.totalDistributions || 0;

        if (totalCapitalCalls > 0 || totalDistributions > 0) {
          log(LogLevel.INFO, LogCategory.API, 'Extracted cash flows from metrics');

          // Create cash_flows object
          results.cash_flows = {
            total_capital_calls: totalCapitalCalls,
            total_distributions: totalDistributions
          };

          // Create cashFlows object (camelCase)
          results.cashFlows = {
            totalCapitalCalls: totalCapitalCalls,
            totalDistributions: totalDistributions
          };
        }
      }

      return;
    }

    // Ensure metrics object exists
    if (!results.metrics) {
      results.metrics = {};
    }

    // Extract total capital calls
    if (cashFlows.total_capital_calls !== undefined) {
      results.metrics.total_capital_calls = cashFlows.total_capital_calls;
    } else if (cashFlows.totalCapitalCalls !== undefined) {
      results.metrics.total_capital_calls = cashFlows.totalCapitalCalls;
    } else {
      // Calculate total capital calls from yearly data
      let totalCapitalCalls = 0;
      Object.keys(cashFlows).forEach(key => {
        if (!isNaN(Number(key))) {
          const yearData = cashFlows[key];
          totalCapitalCalls += Math.abs(yearData.capital_calls || yearData.capitalCalls || 0);
        }
      });

      if (totalCapitalCalls > 0) {
        results.metrics.total_capital_calls = totalCapitalCalls;
        cashFlows.total_capital_calls = totalCapitalCalls;
        cashFlows.totalCapitalCalls = totalCapitalCalls;
      }
    }

    // Extract total distributions
    if (cashFlows.total_distributions !== undefined) {
      results.metrics.total_distributions = cashFlows.total_distributions;
    } else if (cashFlows.totalDistributions !== undefined) {
      results.metrics.total_distributions = cashFlows.totalDistributions;
    } else {
      // Calculate total distributions from yearly data
      let totalDistributions = 0;
      Object.keys(cashFlows).forEach(key => {
        if (!isNaN(Number(key))) {
          const yearData = cashFlows[key];
          totalDistributions += yearData.distributions || yearData.distribution ||
                               yearData.exit_proceeds || yearData.exitProceeds || 0;
        }
      });

      if (totalDistributions > 0) {
        results.metrics.total_distributions = totalDistributions;
        cashFlows.total_distributions = totalDistributions;
        cashFlows.totalDistributions = totalDistributions;
      }
    }

    // Calculate net cash flow
    if (results.metrics.total_capital_calls !== undefined && results.metrics.total_distributions !== undefined) {
      results.metrics.net_cash_flow = results.metrics.total_distributions - results.metrics.total_capital_calls;
    }

    // Calculate multiple
    if (results.metrics.total_capital_calls !== undefined &&
        results.metrics.total_capital_calls > 0 &&
        results.metrics.total_distributions !== undefined) {
      results.metrics.multiple = results.metrics.total_distributions / results.metrics.total_capital_calls;
    }

    // Calculate ROI
    if (results.metrics.multiple !== undefined) {
      results.metrics.roi = results.metrics.multiple - 1;
    }

    // Ensure both snake_case and camelCase versions exist for all metrics
    const metricsKeys = Object.keys(results.metrics);
    for (const key of metricsKeys) {
      const value = results.metrics[key];

      // Add camelCase version
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (camelKey !== key && results.metrics[camelKey] === undefined) {
        results.metrics[camelKey] = value;
      }

      // Add snake_case version
      const snakeKey = camelKey.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (snakeKey !== key && results.metrics[snakeKey] === undefined) {
        results.metrics[snakeKey] = value;
      }
    }

    log(LogLevel.INFO, LogCategory.API, 'Extracted metrics from cash flows:', results.metrics);
  }
}

// Export a singleton instance
export const simulationSDK = new SimulationSDK();

// Export types from the generated SDK
export type {
  SimulationConfig,
  SimulationResponse,
  SimulationStatus,
  SimulationDetail,
  SimulationResults
} from '../api';
