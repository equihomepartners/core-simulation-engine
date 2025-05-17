/**
 * Core utilities for the API transformation layer
 * Contains basic functions used throughout the transformers
 */

/**
 * Converts a snake_case string to camelCase
 * @param str The string to convert
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (match, group) => group.toUpperCase());
}

/**
 * Recursively converts all keys in an object from snake_case to camelCase
 * Handles nested objects and arrays
 * @param obj The object to transform
 */
export function objectKeysToCamelCase<T>(obj: any): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => objectKeysToCamelCase(item)) as unknown as T;
  }

  return Object.entries(obj).reduce((result, [key, value]) => {
    const camelKey = toCamelCase(key);
    result[camelKey] = objectKeysToCamelCase(value);
    return result;
  }, {} as any) as T;
}

/**
 * Safely extracts a value from a nested object with fallback
 * @param obj The object to extract from
 * @param path The path to the value as an array of keys
 * @param defaultValue Fallback value if path doesn't exist
 */
export function safeExtract<T>(obj: any, path: string[], defaultValue: T): T {
  if (!obj) return defaultValue;
  
  let current = obj;
  for (const key of path) {
    if (current === undefined || current === null) return defaultValue;
    current = current[key];
  }
  
  return (current !== undefined && current !== null) ? current : defaultValue;
}

/**
 * Normalizes a numeric value, handling nulls, undefined, and NaN
 * @param value The value to normalize
 * @param defaultValue Default value if value is invalid
 */
export function normalize<T extends number | null>(value: any, defaultValue: T): T {
  if (value === undefined || value === null) return defaultValue;
  const num = Number(value);
  return (isNaN(num) ? defaultValue : num) as T;
}

/**
 * Ensures a value is an array, wrapping non-array values
 * @param value The value to ensure is an array
 */
export function ensureArray<T>(value: T | T[]): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Finds the first non-null, non-undefined value in a list of options
 * @param options List of potential values
 * @param defaultValue Fallback if all options are null/undefined
 */
export function firstValid<T>(options: any[], defaultValue: T): T {
  for (const option of options) {
    if (option !== undefined && option !== null) {
      return option as T;
    }
  }
  return defaultValue;
} 