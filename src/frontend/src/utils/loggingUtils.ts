/**
 * Utility functions for logging with deduplication
 */
import { LogLevel, LogCategory, log } from './logging';

// Store for logged messages to avoid duplicates
const loggedMessages = new Set<string>();

/**
 * Log a message only once to avoid repetitive warnings
 * 
 * @param level Log level
 * @param category Log category
 * @param message Message to log
 * @param data Optional data to include
 * @returns True if the message was logged, false if it was a duplicate
 */
export const logOnce = (
  level: LogLevel,
  category: LogCategory,
  message: string,
  data?: any
): boolean => {
  // Create a unique key for this message
  const key = `${level}:${category}:${message}:${JSON.stringify(data || {})}`;
  
  // Check if we've already logged this message
  if (loggedMessages.has(key)) {
    return false;
  }
  
  // Log the message and store it
  log(level, category, message, data);
  loggedMessages.add(key);
  return true;
};

/**
 * Log missing data only once to avoid repetitive warnings
 * 
 * @param component Component name
 * @param metric Metric name
 * @param expectedType Expected type
 * @param actualValue Actual value
 * @returns True if the message was logged, false if it was a duplicate
 */
export const logMissingDataOnce = (
  component: string,
  metric: string,
  expectedType: string,
  actualValue: any
): boolean => {
  // Create a unique key for this message
  const key = `${component}:${metric}:${expectedType}`;
  
  // Check if we've already logged this message
  if (loggedMessages.has(key)) {
    return false;
  }
  
  // Determine the actual type
  const valueType = actualValue === null ? 'null' : typeof actualValue;
  
  // Log the message and store it
  log(LogLevel.WARN, LogCategory.DATA, `Missing or invalid data for ${metric} in ${component}`, {
    component,
    metric,
    expectedType,
    valueType,
    actualValue: JSON.stringify(actualValue)
  });
  
  loggedMessages.add(key);
  return true;
};

/**
 * Clear the logged messages store
 * Useful for testing or when you want to re-log messages
 */
export const clearLoggedMessages = (): void => {
  loggedMessages.clear();
};
