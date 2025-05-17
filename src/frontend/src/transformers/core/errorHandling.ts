/**
 * Error handling utilities for the API transformation layer
 */

/**
 * Custom error class for transformation-specific errors
 */
export class TransformationError extends Error {
  constructor(message: string, public source?: any) {
    super(message);
    this.name = 'TransformationError';
    
    // Capture the source data that caused the error (for debugging)
    this.source = source;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TransformationError.prototype);
  }
}

/**
 * Handles missing data gracefully with helpful error messages
 * @param data The data to check
 * @param errorMessage The error message to throw
 * @throws TransformationError if data is null or undefined
 */
export function handleMissingData(data: any, errorMessage: string): void {
  if (data === undefined || data === null) {
    throw new TransformationError(errorMessage);
  }
}

/**
 * Higher-order function that wraps a transformer function with error handling
 * @param transformFn The transformer function to wrap
 * @param errorPrefix Prefix for error messages
 */
export function wrapTransformError<T, U>(
  transformFn: (data: T) => U,
  errorPrefix: string
): (data: T) => U {
  return (data: T) => {
    try {
      return transformFn(data);
    } catch (error) {
      if (error instanceof TransformationError) {
        // Re-throw with the original source data
        throw error;
      }
      
      // Wrap other errors
      throw new TransformationError(
        `${errorPrefix}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data
      );
    }
  };
}

/**
 * Logs a warning message for non-critical transformation issues
 * @param message The warning message
 * @param data Optional data to log
 */
export function logTransformWarning(message: string, data?: any): void {
  console.warn(`[Transform Warning] ${message}`, data);
} 