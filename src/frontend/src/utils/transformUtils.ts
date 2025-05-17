/**
 * Utility functions for transforming data between different formats
 * (e.g., snake_case to camelCase and vice versa)
 */

/**
 * Converts a snake_case string to camelCase
 * @param str The snake_case string to convert
 * @returns The camelCase version of the string
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
};

/**
 * Converts a camelCase string to snake_case
 * @param str The camelCase string to convert
 * @returns The snake_case version of the string
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Recursively transforms all keys in an object from snake_case to camelCase
 * Handles nested objects and arrays
 *
 * @param obj The object to transform
 * @returns A new object with all keys transformed to camelCase
 */
export const transformKeysToCamelCase = <T extends unknown>(obj: T): any => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformKeysToCamelCase(item));
  }

  return Object.keys(obj).reduce((result, key) => {
    const camelKey = snakeToCamel(key);
    const value = (obj as any)[key];

    result[camelKey] = transformKeysToCamelCase(value);
    return result;
  }, {} as Record<string, any>);
};

/**
 * Recursively transforms all keys in an object from camelCase to snake_case
 * Handles nested objects and arrays
 *
 * @param obj The object to transform
 * @returns A new object with all keys transformed to snake_case
 */
export const transformKeysToSnakeCase = <T extends unknown>(obj: T): any => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformKeysToSnakeCase(item));
  }

  return Object.keys(obj).reduce((result, key) => {
    const snakeKey = camelToSnake(key);
    const value = (obj as any)[key];

    result[snakeKey] = transformKeysToSnakeCase(value);
    return result;
  }, {} as Record<string, any>);
};

/**
 * Transforms API response data to the format expected by the UI
 * This is a comprehensive transformation that handles all field names
 *
 * @param data The API response data to transform
 * @returns Transformed data with camelCase field names
 */
export const transformApiResponse = <T extends unknown>(data: T): any => {
  if (data === null || data === undefined) {
    return data;
  }

  // First transform keys to camelCase
  const camelCaseData = transformKeysToCamelCase(data);

  // Then ensure both snake_case and camelCase versions are present
  return ensureBothCases(camelCaseData);
};

/**
 * Ensures that an object has both snake_case and camelCase versions of each key
 * This helps with compatibility between different parts of the application
 *
 * @param obj The object to transform
 * @returns A new object with both snake_case and camelCase keys
 */
export const ensureBothCases = <T extends unknown>(obj: T): any => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => ensureBothCases(item));
  }

  const result: Record<string, any> = {};

  // Process each key in the object
  Object.keys(obj).forEach(key => {
    const value = (obj as any)[key];

    // Add the original key-value pair
    result[key] = typeof value === 'object' ? ensureBothCases(value) : value;

    // Add the transformed key if it's different from the original
    if (key.includes('_')) {
      // It's snake_case, add camelCase
      const camelKey = snakeToCamel(key);
      if (camelKey !== key) {
        result[camelKey] = typeof value === 'object' ? ensureBothCases(value) : value;
      }
    } else if (/[a-z][A-Z]/.test(key)) {
      // It's camelCase, add snake_case
      const snakeKey = camelToSnake(key);
      if (snakeKey !== key) {
        result[snakeKey] = typeof value === 'object' ? ensureBothCases(value) : value;
      }
    }
  });

  return result;
};

/**
 * Transforms UI data to the format expected by the API
 * This is a comprehensive transformation that handles all field names
 *
 * @param data The UI data to transform
 * @returns Transformed data with snake_case field names
 */
export const transformApiRequest = <T extends unknown>(data: T): any => {
  return transformKeysToSnakeCase(data);
};
