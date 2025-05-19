/**
 * Enhanced logging utilities for the simulation engine
 *
 * This module provides structured logging capabilities with support for:
 * - Log levels (DEBUG, INFO, WARN, ERROR)
 * - Categories (DATA, UI, API, etc.)
 * - Simulation phases (initialization, portfolio-generation, etc.)
 * - Component-specific logging
 * - Deduplication of repeated logs
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export enum LogCategory {
  DATA = 'DATA',
  UI = 'UI',
  API = 'API',
  PERFORMANCE = 'PERFORMANCE',
  BACKEND_DATA = 'BACKEND_DATA',
  CONFIG = 'CONFIG',
  SIMULATION = 'SIMULATION',
  METRICS = 'METRICS'
}

export enum SimulationPhase {
  INITIALIZATION = 'initialization',
  PORTFOLIO_GENERATION = 'portfolio-generation',
  LOAN_LIFECYCLE = 'loan-lifecycle',
  CASH_FLOWS = 'cash-flows',
  WATERFALL = 'waterfall',
  PERFORMANCE_METRICS = 'performance-metrics',
  MONTE_CARLO = 'monte-carlo',
  OPTIMIZATION = 'optimization',
  STRESS_TESTING = 'stress-testing',
  REPORTING = 'reporting'
}

// Store for logged messages to avoid duplicates
const loggedMessages = new Set<string>();

/**
 * Enhanced log function with support for components and phases
 */
export interface LogOptions {
  component?: string;
  phase?: SimulationPhase;
  deduplicateKey?: string;
  simulationId?: string;
}

export function log(
  level: LogLevel,
  category: LogCategory,
  message: string,
  data?: any,
  options?: LogOptions
): void {
  const timestamp = new Date().toISOString();

  // Build the formatted message
  let formattedMessage = `[${category}]`;

  // Add component if provided
  if (options?.component) {
    formattedMessage += `[${options.component}]`;
  }

  // Add phase if provided
  if (options?.phase) {
    formattedMessage += `[${options.phase}]`;
  }

  // Add simulation ID if provided
  if (options?.simulationId) {
    formattedMessage += `[Sim:${options.simulationId}]`;
  }

  // Add the actual message
  formattedMessage += ` ${message}`;

  // Check for duplicate logs if deduplication is requested
  if (options?.deduplicateKey) {
    const key = `${level}:${formattedMessage}:${JSON.stringify(data || {})}`;

    if (loggedMessages.has(key)) {
      return; // Skip duplicate log
    }

    loggedMessages.add(key);
  }

  // Output the log based on level
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(formattedMessage, data || '');
      break;
    case LogLevel.INFO:
      console.info(formattedMessage, data || '');
      break;
    case LogLevel.WARN:
      console.warn(formattedMessage, data || '');
      break;
    case LogLevel.ERROR:
      console.error(formattedMessage, data || '');
      break;
    default:
      console.log(formattedMessage, data || '');
  }
}

/**
 * Log missing data for a component
 */
export function logMissingData(
  component: string,
  dataName: string,
  expectedType: string,
  receivedValue: any,
  options?: Omit<LogOptions, 'component'>
): void {
  log(
    LogLevel.WARN,
    LogCategory.DATA,
    `Missing or invalid ${dataName} (expected ${expectedType})`,
    receivedValue,
    {
      component,
      deduplicateKey: `missing:${component}:${dataName}`,
      ...options
    }
  );
}

/**
 * Log successful data loading
 */
export function logDataLoaded(
  component: string,
  dataType: string,
  options?: Omit<LogOptions, 'component'>
): void {
  log(
    LogLevel.INFO,
    LogCategory.DATA,
    `Successfully loaded ${dataType}`,
    undefined,
    {
      component,
      deduplicateKey: `loaded:${component}:${dataType}`,
      ...options
    }
  );
}

/**
 * Log backend data structure
 */
export function logBackendDataStructure(
  data: any,
  dataSource: string,
  options?: Omit<LogOptions, 'component'>
): void {
  const structureSummary = Object.keys(data || {}).map(key => {
    const value = data[key];
    return {
      key,
      type: Array.isArray(value) ? `Array(${value.length})` : typeof value,
      sample: Array.isArray(value) ? value.slice(0, 2) : (typeof value === 'object' && value !== null) ? Object.keys(value) : value
    };
  });

  log(
    LogLevel.DEBUG,
    LogCategory.BACKEND_DATA,
    `Structure:`,
    structureSummary,
    {
      component: dataSource,
      ...options
    }
  );
}

/**
 * Log simulation phase start
 */
export function logPhaseStart(
  phase: SimulationPhase,
  simulationId?: string,
  data?: any
): void {
  log(
    LogLevel.INFO,
    LogCategory.SIMULATION,
    `Starting phase: ${phase}`,
    data,
    {
      phase,
      simulationId,
      deduplicateKey: `phase:${phase}:${simulationId}:start`
    }
  );
}

/**
 * Log simulation phase completion
 */
export function logPhaseComplete(
  phase: SimulationPhase,
  simulationId?: string,
  metrics?: any
): void {
  log(
    LogLevel.INFO,
    LogCategory.SIMULATION,
    `Completed phase: ${phase}`,
    metrics,
    {
      phase,
      simulationId,
      deduplicateKey: `phase:${phase}:${simulationId}:complete`
    }
  );
}

/**
 * Log performance metric
 */
export function logMetric(
  metricName: string,
  value: any,
  component?: string,
  simulationId?: string
): void {
  log(
    LogLevel.INFO,
    LogCategory.METRICS,
    `${metricName}: ${typeof value === 'number' ? value.toFixed(4) : value}`,
    { [metricName]: value },
    {
      component,
      simulationId,
      deduplicateKey: `metric:${metricName}:${simulationId}`
    }
  );
}

/**
 * Clear logged messages cache
 */
export function clearLoggedMessages(): void {
  loggedMessages.clear();
}
