/**
 * Simplified logging utilities for investment journey visualization
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
  CONFIG = 'CONFIG'
}

/**
 * Generic log function
 */
export function log(
  level: LogLevel,
  category: LogCategory,
  message: string,
  data?: any
): void {
  const timestamp = new Date().toISOString();
  
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(`[${category}] ${message}`, data || '');
      break;
    case LogLevel.INFO:
      console.info(`[${category}] ${message}`, data || '');
      break;
    case LogLevel.WARN:
      console.warn(`[${category}] ${message}`, data || '');
      break;
    case LogLevel.ERROR:
      console.error(`[${category}] ${message}`, data || '');
      break;
    default:
      console.log(`[${category}] ${message}`, data || '');
  }
}

/**
 * Log missing data for a component
 */
export function logMissingData(
  component: string,
  dataName: string,
  expectedType: string,
  receivedValue: any
): void {
  console.warn(
    `[DATA][${component}] Missing or invalid ${dataName} (expected ${expectedType})`,
    receivedValue
  );
}

/**
 * Log successful data loading
 */
export function logDataLoaded(component: string, dataType: string): void {
  console.info(`[DATA][${component}] Successfully loaded ${dataType}`);
}

/**
 * Log backend data structure
 */
export function logBackendDataStructure(data: any, dataSource: string): void {
  console.debug(`[DATA][${dataSource}] Structure:`, 
    Object.keys(data || {}).map(key => {
      const value = data[key];
      return {
        key,
        type: Array.isArray(value) ? `Array(${value.length})` : typeof value,
        sample: Array.isArray(value) ? value.slice(0, 2) : (typeof value === 'object' && value !== null) ? Object.keys(value) : value
      };
    })
  );
}
