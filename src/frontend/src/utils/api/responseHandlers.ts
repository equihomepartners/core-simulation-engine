/**
 * Utility functions for handling API responses consistently across the application
 */

/**
 * Safely extracts data from API responses with different formats
 * @param response - The API response object
 * @param primaryPath - The primary path to look for data (e.g., 'cashflows')
 * @param fallbackPaths - Additional paths to check if primary path doesn't exist
 * @returns The extracted data or null if not found
 */
export const extractApiData = (
  response: any, 
  primaryPath: string,
  fallbackPaths: string[] = []
): any => {
  // Log the response for debugging
  console.log(`Extracting data from API response for path: ${primaryPath}`, response);
  
  if (!response) {
    console.warn('API response is null or undefined');
    return null;
  }
  
  // Check if the primary path exists
  if (response[primaryPath] !== undefined) {
    console.log(`Found data at primary path: ${primaryPath}`);
    return response[primaryPath];
  }
  
  // Check fallback paths
  for (const path of fallbackPaths) {
    if (response[path] !== undefined) {
      console.log(`Found data at fallback path: ${path}`);
      return response[path];
    }
  }
  
  // If the response itself is an array, return it
  if (Array.isArray(response)) {
    console.log('Response is an array, returning directly');
    return response;
  }
  
  // If no specific path is found but response is an object, return the whole object
  if (typeof response === 'object' && response !== null && Object.keys(response).length > 0) {
    console.log('No specific path found, returning entire response object');
    return response;
  }
  
  console.warn('No data found in API response');
  return null;
};

/**
 * Analyzes the structure of an API response for debugging
 * @param response - The API response to analyze
 * @returns An object describing the structure
 */
export const analyzeApiResponse = (response: any): any => {
  if (!response) {
    return { type: 'null/undefined' };
  }
  
  const analysis: Record<string, any> = {
    type: typeof response,
    isArray: Array.isArray(response),
  };
  
  if (Array.isArray(response)) {
    analysis.length = response.length;
    analysis.isEmpty = response.length === 0;
    analysis.sample = response.length > 0 ? response.slice(0, 2) : [];
  } else if (typeof response === 'object' && response !== null) {
    const keys = Object.keys(response);
    analysis.keys = keys;
    analysis.isEmpty = keys.length === 0;
    
    // Analyze each key
    if (keys.length > 0) {
      analysis.properties = {};
      keys.forEach(key => {
        const value = response[key];
        analysis.properties[key] = {
          type: typeof value,
          isArray: Array.isArray(value),
          isEmpty: Array.isArray(value) ? value.length === 0 : 
                  (typeof value === 'object' && value !== null) ? Object.keys(value).length === 0 : false,
          sample: Array.isArray(value) ? value.slice(0, 2) : 
                 (typeof value === 'object' && value !== null) ? '(object)' : value
        };
      });
    }
  }
  
  return analysis;
};

/**
 * Standardizes error handling for API responses
 * @param error - The error object
 * @returns A standardized error object
 */
export const standardizeApiError = (error: any): { message: string; details?: any } => {
  if (!error) {
    return { message: 'Unknown error occurred' };
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    return {
      message: error.message || 'An error occurred',
      details: {
        name: error.name,
        stack: error.stack,
        ...(error as any)
      }
    };
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return { message: error };
  }
  
  // Handle object errors
  if (typeof error === 'object') {
    return {
      message: error.message || error.error || 'API error occurred',
      details: error
    };
  }
  
  // Default case
  return { message: 'Unexpected error format', details: error };
};
