/**
 * Backend logging interceptor
 * 
 * This module provides utilities to intercept and format backend logs
 * from API responses and WebSocket messages.
 */

import { LogLevel, LogCategory, SimulationPhase, log } from './logging';

// Define backend log structure
interface BackendLog {
  timestamp?: string;
  level?: string;
  message: string;
  data?: any;
  simulation_id?: string;
  step?: string | number;
  phase?: string;
}

// Map backend log levels to frontend log levels
const mapLogLevel = (level?: string): LogLevel => {
  if (!level) return LogLevel.INFO;
  
  switch (level.toLowerCase()) {
    case 'debug':
      return LogLevel.DEBUG;
    case 'info':
      return LogLevel.INFO;
    case 'warning':
    case 'warn':
      return LogLevel.WARN;
    case 'error':
    case 'critical':
      return LogLevel.ERROR;
    default:
      return LogLevel.INFO;
  }
};

// Map backend phase to frontend simulation phase
const mapPhase = (phase?: string): SimulationPhase | undefined => {
  if (!phase) return undefined;
  
  // Try to match phase names
  const phaseMap: Record<string, SimulationPhase> = {
    'market_conditions': SimulationPhase.INITIALIZATION,
    'portfolio': SimulationPhase.PORTFOLIO_GENERATION,
    'loan_lifecycle': SimulationPhase.LOAN_LIFECYCLE,
    'cash_flows': SimulationPhase.CASH_FLOWS,
    'waterfall': SimulationPhase.WATERFALL,
    'performance_metrics': SimulationPhase.PERFORMANCE_METRICS,
    'monte_carlo': SimulationPhase.MONTE_CARLO,
    'optimization': SimulationPhase.OPTIMIZATION,
    'stress_testing': SimulationPhase.STRESS_TESTING,
    'reports': SimulationPhase.REPORTING
  };
  
  return phaseMap[phase.toLowerCase()] || undefined;
};

/**
 * Process a backend log and format it for the frontend
 */
export function processBackendLog(backendLog: BackendLog): void {
  const level = mapLogLevel(backendLog.level);
  const phase = mapPhase(backendLog.phase);
  
  log(
    level,
    LogCategory.BACKEND_DATA,
    backendLog.message,
    backendLog.data,
    {
      phase,
      simulationId: backendLog.simulation_id,
      component: 'Backend',
      deduplicateKey: `backend:${backendLog.message}:${backendLog.simulation_id}`
    }
  );
}

/**
 * Process simulation progress update from WebSocket
 */
export function processSimulationProgress(progressData: any): void {
  if (!progressData) return;
  
  const { simulation_id, step, progress, message, current_step } = progressData;
  
  // Map step to phase if possible
  const phase = mapPhase(current_step);
  
  // Log the progress update
  log(
    LogLevel.INFO,
    LogCategory.SIMULATION,
    `Progress: ${(progress * 100).toFixed(1)}% - ${message || current_step || step}`,
    {
      simulationId: simulation_id,
      step,
      progress,
      currentStep: current_step
    },
    {
      phase,
      simulationId: simulation_id,
      deduplicateKey: `progress:${simulation_id}:${step}:${current_step}`
    }
  );
  
  // If there's a snapshot with metrics, log those too
  if (progressData.snapshot?.metrics) {
    Object.entries(progressData.snapshot.metrics).forEach(([key, value]) => {
      log(
        LogLevel.INFO,
        LogCategory.METRICS,
        `${key}: ${value}`,
        { [key]: value },
        {
          phase,
          simulationId: simulation_id,
          deduplicateKey: `metric:${key}:${simulation_id}`
        }
      );
    });
  }
}

/**
 * Process API response for logging
 */
export function processApiResponse(endpoint: string, response: any, simulationId?: string): void {
  // Don't log empty responses
  if (!response) return;
  
  // Log the response structure
  log(
    LogLevel.DEBUG,
    LogCategory.API,
    `Response from ${endpoint}`,
    {
      endpoint,
      keys: Object.keys(response),
      simulationId
    },
    {
      simulationId,
      deduplicateKey: `api:${endpoint}:${simulationId}`
    }
  );
  
  // If it's a simulation result, log key metrics
  if (endpoint.includes('/results') && response.performance_metrics) {
    const metrics = response.performance_metrics;
    
    // Log IRR metrics
    if (metrics.irr) {
      log(
        LogLevel.INFO,
        LogCategory.METRICS,
        `Gross IRR: ${(metrics.irr * 100).toFixed(2)}%`,
        { grossIrr: metrics.irr },
        {
          simulationId,
          deduplicateKey: `metric:grossIrr:${simulationId}`
        }
      );
    }
    
    if (metrics.net_irr) {
      log(
        LogLevel.INFO,
        LogCategory.METRICS,
        `Net IRR: ${(metrics.net_irr * 100).toFixed(2)}%`,
        { netIrr: metrics.net_irr },
        {
          simulationId,
          deduplicateKey: `metric:netIrr:${simulationId}`
        }
      );
    }
    
    if (metrics.lp_irr) {
      log(
        LogLevel.INFO,
        LogCategory.METRICS,
        `LP IRR: ${(metrics.lp_irr * 100).toFixed(2)}%`,
        { lpIrr: metrics.lp_irr },
        {
          simulationId,
          deduplicateKey: `metric:lpIrr:${simulationId}`
        }
      );
    }
  }
}
