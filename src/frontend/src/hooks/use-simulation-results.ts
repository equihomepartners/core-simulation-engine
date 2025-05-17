import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useSimulationStore } from '@/store/simulation-store';
import { LogLevel, LogCategory, log, logBackendDataStructure } from '@/utils/logging';
import { simulationSDK } from '@/sdk';

interface UseSimulationResultsOptions {
  timeGranularity?: 'yearly' | 'monthly';
  enabled?: boolean;
  refetchInterval?: number | false;
  includeVisualization?: boolean;
}

/**
 * Hook for fetching and accessing simulation results
 * @param id Simulation ID
 * @param options Options for fetching the simulation results
 * @returns Object containing simulation results data and loading state
 */
export function useSimulationResults(
  id: string,
  options: UseSimulationResultsOptions = {}
) {
  const {
    timeGranularity = 'yearly',
    enabled = true,
    refetchInterval = false,
    includeVisualization = false
  } = options;

  // Use the professional SDK directly
  // Fetch the main simulation results
  const {
    data: results,
    isLoading: isLoadingResults,
    error: resultsError,
    refetch: refetchResults
  } = useQuery(
    ['simulationResults', id, timeGranularity],
    async () => {
      try {
        log(LogLevel.INFO, LogCategory.API, `Fetching simulation results for ${id} with granularity ${timeGranularity}`);

        // Use the professional SDK to get simulation results
        const results = await simulationSDK.getSimulationResults(id, timeGranularity);

        // Log the structure of the results for debugging
        log(LogLevel.DEBUG, LogCategory.API, `Results structure:`,
          Object.keys(results || {}).length > 0 ?
            `Found ${Object.keys(results).length} top-level keys` :
            'Empty results'
        );

        // Process the results to ensure we have the right structure
        const processedResults = processResults(results);

        // Log the processed results structure
        logBackendDataStructure(processedResults, `Processed Simulation Results (ID: ${id})`);

        return processedResults;
      } catch (err) {
        log(LogLevel.ERROR, LogCategory.API, `Error fetching simulation results for ${id}:`, err);
        throw err;
      }
    },
    {
      enabled: !!id && enabled,
      refetchInterval,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      onError: (err) => {
        log(LogLevel.ERROR, LogCategory.API, `Error in useSimulationResults for ${id}:`, err);
      }
    }
  );

  // Fetch visualization data if requested
  const {
    data: visualizationData,
    isLoading: isLoadingVisualization,
    error: visualizationError
  } = useQuery(
    ['simulationVisualization', id, timeGranularity],
    async () => {
      try {
        log(LogLevel.INFO, LogCategory.API, `Fetching visualization data for ${id}`);

        // Use the professional SDK to get visualization data
        const data = await simulationSDK.getVisualization(id, 'all', timeGranularity, {
          cumulative: false
        });

        // Log the visualization data structure
        logBackendDataStructure(data, `Visualization Data (ID: ${id})`);

        return data;
      } catch (err) {
        log(LogLevel.ERROR, LogCategory.API, `Error fetching visualization data for ${id}:`, err);
        throw err;
      }
    },
    {
      enabled: !!id && enabled && includeVisualization,
      refetchInterval,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1
    }
  );



  // Process the results to ensure we have the right structure
  const processResults = (data: any) => {
    if (!data) return null;

    // Create a processed copy of the data
    const processed = { ...data };

    // Ensure metrics exists
    if (!processed.metrics) {
      processed.metrics = {};
    }

    // Ensure metrics has the right properties with both camelCase and snake_case
    if (processed.metrics) {
      // Map moic to multiple if it exists
      if (processed.metrics.moic !== undefined && processed.metrics.multiple === undefined) {
        processed.metrics.multiple = processed.metrics.moic;
      } else if (processed.metrics.multiple !== undefined && processed.metrics.moic === undefined) {
        processed.metrics.moic = processed.metrics.multiple;
      }

      // Map totalCapitalCalls to total_capital_calls if needed
      if (processed.metrics.totalCapitalCalls !== undefined && processed.metrics.total_capital_calls === undefined) {
        processed.metrics.total_capital_calls = processed.metrics.totalCapitalCalls;
      } else if (processed.metrics.total_capital_calls !== undefined && processed.metrics.totalCapitalCalls === undefined) {
        processed.metrics.totalCapitalCalls = processed.metrics.total_capital_calls;
      }

      // Map totalDistributions to total_distributions if needed
      if (processed.metrics.totalDistributions !== undefined && processed.metrics.total_distributions === undefined) {
        processed.metrics.total_distributions = processed.metrics.totalDistributions;
      } else if (processed.metrics.total_distributions !== undefined && processed.metrics.totalDistributions === undefined) {
        processed.metrics.totalDistributions = processed.metrics.total_distributions;
      }

      // Map IRR components
      if (processed.metrics.irrComponents && !processed.metrics.irr_components) {
        processed.metrics.irr_components = processed.metrics.irrComponents;
      } else if (processed.metrics.irr_components && !processed.metrics.irrComponents) {
        processed.metrics.irrComponents = processed.metrics.irr_components;
      }

      // Map IRR
      if (processed.metrics.iRR !== undefined && processed.metrics.irr === undefined) {
        processed.metrics.irr = processed.metrics.iRR;
      } else if (processed.metrics.irr !== undefined && processed.metrics.iRR === undefined) {
        processed.metrics.iRR = processed.metrics.irr;
      }

      // Map Gross IRR
      if (processed.metrics.grossIrr !== undefined && processed.metrics.gross_irr === undefined) {
        processed.metrics.gross_irr = processed.metrics.grossIrr;
      } else if (processed.metrics.gross_irr !== undefined && processed.metrics.grossIrr === undefined) {
        processed.metrics.grossIrr = processed.metrics.gross_irr;
      }

      // Map PME
      if (processed.metrics.pME !== undefined && processed.metrics.pme === undefined) {
        processed.metrics.pme = processed.metrics.pME;
      } else if (processed.metrics.pme !== undefined && processed.metrics.pME === undefined) {
        processed.metrics.pME = processed.metrics.pme;
      }

      // Map Sharpe Ratio
      if (processed.metrics.sharpeRatio !== undefined && processed.metrics.sharpe_ratio === undefined) {
        processed.metrics.sharpe_ratio = processed.metrics.sharpeRatio;
      } else if (processed.metrics.sharpe_ratio !== undefined && processed.metrics.sharpeRatio === undefined) {
        processed.metrics.sharpeRatio = processed.metrics.sharpe_ratio;
      }

      // Map Sortino Ratio
      if (processed.metrics.sortinoRatio !== undefined && processed.metrics.sortino_ratio === undefined) {
        processed.metrics.sortino_ratio = processed.metrics.sortinoRatio;
      } else if (processed.metrics.sortino_ratio !== undefined && processed.metrics.sortinoRatio === undefined) {
        processed.metrics.sortinoRatio = processed.metrics.sortino_ratio;
      }

      // Map Max Drawdown
      if (processed.metrics.maxDrawdown !== undefined && processed.metrics.max_drawdown === undefined) {
        processed.metrics.max_drawdown = processed.metrics.maxDrawdown;
      } else if (processed.metrics.max_drawdown !== undefined && processed.metrics.maxDrawdown === undefined) {
        processed.metrics.maxDrawdown = processed.metrics.max_drawdown;
      }

      // Map J-Curve Depth
      if (processed.metrics.jCurveDepth !== undefined && processed.metrics.j_curve_depth === undefined) {
        processed.metrics.j_curve_depth = processed.metrics.jCurveDepth;
      } else if (processed.metrics.j_curve_depth !== undefined && processed.metrics.jCurveDepth === undefined) {
        processed.metrics.jCurveDepth = processed.metrics.j_curve_depth;
      }

      // Map J-Curve Recovery
      if (processed.metrics.jCurveRecovery !== undefined && processed.metrics.j_curve_recovery === undefined) {
        processed.metrics.j_curve_recovery = processed.metrics.jCurveRecovery;
      } else if (processed.metrics.j_curve_recovery !== undefined && processed.metrics.jCurveRecovery === undefined) {
        processed.metrics.jCurveRecovery = processed.metrics.j_curve_recovery;
      }

      // Map Time to Breakeven
      if (processed.metrics.timeToBreakeven !== undefined && processed.metrics.time_to_breakeven === undefined) {
        processed.metrics.time_to_breakeven = processed.metrics.timeToBreakeven;
      } else if (processed.metrics.time_to_breakeven !== undefined && processed.metrics.timeToBreakeven === undefined) {
        processed.metrics.timeToBreakeven = processed.metrics.time_to_breakeven;
      }

      // Map GP Investment Return
      if (processed.metrics.gpInvestmentReturn !== undefined && processed.metrics.gp_investment_return === undefined) {
        processed.metrics.gp_investment_return = processed.metrics.gpInvestmentReturn;
      } else if (processed.metrics.gp_investment_return !== undefined && processed.metrics.gpInvestmentReturn === undefined) {
        processed.metrics.gpInvestmentReturn = processed.metrics.gp_investment_return;
      }

      // Map Carried Interest
      if (processed.metrics.carriedInterest !== undefined && processed.metrics.carried_interest === undefined) {
        processed.metrics.carried_interest = processed.metrics.carriedInterest;
      } else if (processed.metrics.carried_interest !== undefined && processed.metrics.carriedInterest === undefined) {
        processed.metrics.carriedInterest = processed.metrics.carried_interest;
      }
    }

    // Ensure cash_flows has the right structure with both camelCase and snake_case
    if (!processed.cash_flows && !processed.cashFlows) {
      processed.cash_flows = {};
      processed.cashFlows = {};
    } else if (processed.cashFlows && !processed.cash_flows) {
      processed.cash_flows = processed.cashFlows;
    } else if (processed.cash_flows && !processed.cashFlows) {
      processed.cashFlows = processed.cash_flows;
    }

    // Ensure portfolio has the right structure with both camelCase and snake_case
    if (!processed.portfolio) {
      processed.portfolio = {};
    }

    if (processed.portfolio) {
      // Ensure zone_allocation exists with both camelCase and snake_case
      if (!processed.portfolio.zone_allocation && !processed.portfolio.zoneAllocation) {
        processed.portfolio.zone_allocation = {};
        processed.portfolio.zoneAllocation = {};
      } else if (!processed.portfolio.zone_allocation && processed.portfolio.zoneAllocation) {
        processed.portfolio.zone_allocation = processed.portfolio.zoneAllocation;
      } else if (processed.portfolio.zone_allocation && !processed.portfolio.zoneAllocation) {
        processed.portfolio.zoneAllocation = processed.portfolio.zone_allocation;
      }
    }

    // Ensure GP Economics exists with both camelCase and snake_case
    if (!processed.gp_economics && !processed.gpEconomics) {
      processed.gp_economics = {};
      processed.gpEconomics = {};
    } else if (processed.gpEconomics && !processed.gp_economics) {
      processed.gp_economics = processed.gpEconomics;
    } else if (processed.gp_economics && !processed.gpEconomics) {
      processed.gpEconomics = processed.gp_economics;
    }

    // Map GP Economics properties
    if (processed.gp_economics) {
      // Management Fees
      if (processed.gp_economics.managementFees !== undefined && processed.gp_economics.management_fees === undefined) {
        processed.gp_economics.management_fees = processed.gp_economics.managementFees;
      } else if (processed.gp_economics.management_fees !== undefined && processed.gp_economics.managementFees === undefined) {
        processed.gp_economics.managementFees = processed.gp_economics.management_fees;
      }

      // Carried Interest
      if (processed.gp_economics.carriedInterest !== undefined && processed.gp_economics.carried_interest === undefined) {
        processed.gp_economics.carried_interest = processed.gp_economics.carriedInterest;
      } else if (processed.gp_economics.carried_interest !== undefined && processed.gp_economics.carriedInterest === undefined) {
        processed.gp_economics.carriedInterest = processed.gp_economics.carried_interest;
      }

      // Investment Return
      if (processed.gp_economics.investmentReturn !== undefined && processed.gp_economics.investment_return === undefined) {
        processed.gp_economics.investment_return = processed.gp_economics.investmentReturn;
      } else if (processed.gp_economics.investment_return !== undefined && processed.gp_economics.investmentReturn === undefined) {
        processed.gp_economics.investmentReturn = processed.gp_economics.investment_return;
      }
    }

    // Do the same for gpEconomics
    if (processed.gpEconomics) {
      // Management Fees
      if (processed.gpEconomics.managementFees !== undefined && processed.gpEconomics.management_fees === undefined) {
        processed.gpEconomics.management_fees = processed.gpEconomics.managementFees;
      } else if (processed.gpEconomics.management_fees !== undefined && processed.gpEconomics.managementFees === undefined) {
        processed.gpEconomics.managementFees = processed.gpEconomics.management_fees;
      }

      // Carried Interest
      if (processed.gpEconomics.carriedInterest !== undefined && processed.gpEconomics.carried_interest === undefined) {
        processed.gpEconomics.carried_interest = processed.gpEconomics.carriedInterest;
      } else if (processed.gpEconomics.carried_interest !== undefined && processed.gpEconomics.carriedInterest === undefined) {
        processed.gpEconomics.carriedInterest = processed.gpEconomics.carried_interest;
      }

      // Investment Return
      if (processed.gpEconomics.investmentReturn !== undefined && processed.gpEconomics.investment_return === undefined) {
        processed.gpEconomics.investment_return = processed.gpEconomics.investmentReturn;
      } else if (processed.gpEconomics.investment_return !== undefined && processed.gpEconomics.investmentReturn === undefined) {
        processed.gpEconomics.investmentReturn = processed.gpEconomics.investment_return;
      }
    }

    // Ensure portfolio_evolution exists with both camelCase and snake_case
    if (!processed.portfolio_evolution && !processed.portfolioEvolution) {
      processed.portfolio_evolution = {};
      processed.portfolioEvolution = {};
    } else if (processed.portfolioEvolution && !processed.portfolio_evolution) {
      processed.portfolio_evolution = processed.portfolioEvolution;
    } else if (processed.portfolio_evolution && !processed.portfolioEvolution) {
      processed.portfolioEvolution = processed.portfolio_evolution;
    }

    // Ensure zone_allocation exists with both camelCase and snake_case
    if (!processed.zone_allocation && !processed.zoneAllocation) {
      processed.zone_allocation = {};
      processed.zoneAllocation = {};
    } else if (processed.zoneAllocation && !processed.zone_allocation) {
      processed.zone_allocation = processed.zoneAllocation;
    } else if (processed.zone_allocation && !processed.zoneAllocation) {
      processed.zoneAllocation = processed.zone_allocation;
    }

    // Ensure IRR breakdown exists with both camelCase and snake_case
    if (!processed.irr_breakdown && !processed.irrBreakdown) {
      processed.irr_breakdown = {};
      processed.irrBreakdown = {};
    } else if (processed.irrBreakdown && !processed.irr_breakdown) {
      processed.irr_breakdown = processed.irrBreakdown;
    } else if (processed.irr_breakdown && !processed.irrBreakdown) {
      processed.irrBreakdown = processed.irr_breakdown;
    }

    // Ensure Sensitivity Analysis exists with both camelCase and snake_case
    if (!processed.sensitivity && !processed.sensitivityAnalysis) {
      processed.sensitivity = {};
      processed.sensitivityAnalysis = {};
    } else if (processed.sensitivityAnalysis && !processed.sensitivity) {
      processed.sensitivity = processed.sensitivityAnalysis;
    } else if (processed.sensitivity && !processed.sensitivityAnalysis) {
      processed.sensitivityAnalysis = processed.sensitivity;
    }

    // Map Sensitivity Analysis properties
    if (processed.sensitivity) {
      // Map Gross IRR
      if (processed.sensitivity.grossIrr !== undefined && processed.sensitivity.gross_irr === undefined) {
        processed.sensitivity.gross_irr = processed.sensitivity.grossIrr;
      } else if (processed.sensitivity.gross_irr !== undefined && processed.sensitivity.grossIrr === undefined) {
        processed.sensitivity.grossIrr = processed.sensitivity.gross_irr;
      }

      // Map Net IRR
      if (processed.sensitivity.netIrr !== undefined && processed.sensitivity.net_irr === undefined) {
        processed.sensitivity.net_irr = processed.sensitivity.netIrr;
      } else if (processed.sensitivity.net_irr !== undefined && processed.sensitivity.netIrr === undefined) {
        processed.sensitivity.netIrr = processed.sensitivity.net_irr;
      }

      // Map PME
      if (processed.sensitivity.pME !== undefined && processed.sensitivity.pme === undefined) {
        processed.sensitivity.pme = processed.sensitivity.pME;
      } else if (processed.sensitivity.pme !== undefined && processed.sensitivity.pME === undefined) {
        processed.sensitivity.pME = processed.sensitivity.pme;
      }

      // Map Sharpe Ratio
      if (processed.sensitivity.sharpeRatio !== undefined && processed.sensitivity.sharpe_ratio === undefined) {
        processed.sensitivity.sharpe_ratio = processed.sensitivity.sharpeRatio;
      } else if (processed.sensitivity.sharpe_ratio !== undefined && processed.sensitivity.sharpeRatio === undefined) {
        processed.sensitivity.sharpeRatio = processed.sensitivity.sharpe_ratio;
      }

      // Map Sortino Ratio
      if (processed.sensitivity.sortinoRatio !== undefined && processed.sensitivity.sortino_ratio === undefined) {
        processed.sensitivity.sortino_ratio = processed.sensitivity.sortinoRatio;
      } else if (processed.sensitivity.sortino_ratio !== undefined && processed.sensitivity.sortinoRatio === undefined) {
        processed.sensitivity.sortinoRatio = processed.sensitivity.sortino_ratio;
      }

      // Map Max Drawdown
      if (processed.sensitivity.maxDrawdown !== undefined && processed.sensitivity.max_drawdown === undefined) {
        processed.sensitivity.max_drawdown = processed.sensitivity.maxDrawdown;
      } else if (processed.sensitivity.max_drawdown !== undefined && processed.sensitivity.maxDrawdown === undefined) {
        processed.sensitivity.maxDrawdown = processed.sensitivity.max_drawdown;
      }
    }

    // Process yearly and monthly data
    if (processed.yearly) {
      if (!processed.cash_flows) {
        processed.cash_flows = { yearly: processed.yearly };
        processed.cashFlows = { yearly: processed.yearly };
      } else if (!processed.cash_flows.yearly) {
        processed.cash_flows.yearly = processed.yearly;
        if (processed.cashFlows) {
          processed.cashFlows.yearly = processed.yearly;
        }
      }
    }

    if (processed.monthly) {
      if (!processed.cash_flows) {
        processed.cash_flows = { monthly: processed.monthly };
        processed.cashFlows = { monthly: processed.monthly };
      } else if (!processed.cash_flows.monthly) {
        processed.cash_flows.monthly = processed.monthly;
        if (processed.cashFlows) {
          processed.cashFlows.monthly = processed.monthly;
        }
      }
    }

    return processed;
  };

  // Combine the loading states
  const isLoading = isLoadingResults || (includeVisualization && isLoadingVisualization);

  // Combine the errors
  const error = resultsError || (includeVisualization ? visualizationError : null);

  return {
    results,
    visualizationData: includeVisualization ? visualizationData : null,
    isLoading,
    error,
    refetch: refetchResults
  };
}
