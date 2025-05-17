# Core Utilities Documentation

The core utilities provide essential helper functions used throughout the API transformation layer. This document provides detailed information about their purpose, implementation, and usage.

## Data Type Conversion Utilities

### `toCamelCase`

Converts snake_case strings to camelCase.

```typescript
/**
 * Converts a snake_case string to camelCase
 * @param str The snake_case string to convert
 * @returns The camelCase version of the string
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
```

Example:
```typescript
toCamelCase('hello_world'); // Returns: 'helloWorld'
toCamelCase('api_response_data'); // Returns: 'apiResponseData'
```

### `objectKeysToCamelCase`

Recursively converts all keys in an object from snake_case to camelCase.

```typescript
/**
 * Recursively converts object keys from snake_case to camelCase
 * @param obj The object to convert
 * @returns A new object with all keys in camelCase
 */
export function objectKeysToCamelCase<T extends object>(obj: T): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => objectKeysToCamelCase(item));
  }

  return Object.keys(obj).reduce((result, key) => {
    const camelKey = toCamelCase(key);
    const value = obj[key as keyof T];
    
    result[camelKey] = objectKeysToCamelCase(value);
    return result;
  }, {} as Record<string, any>);
}
```

Example:
```typescript
const apiResponse = {
  user_id: 123,
  user_name: 'John',
  user_details: {
    email_address: 'john@example.com',
    phone_number: '555-1234'
  }
};

const transformed = objectKeysToCamelCase(apiResponse);
// Returns:
// {
//   userId: 123,
//   userName: 'John',
//   userDetails: {
//     emailAddress: 'john@example.com',
//     phoneNumber: '555-1234'
//   }
// }
```

## Data Normalization Utilities

### `normalize`

Handles null, undefined, and NaN values with appropriate defaults.

```typescript
/**
 * Normalizes a value, handling null, undefined, and NaN
 * @param value The value to normalize
 * @param defaultValue The default value to use if the input is null, undefined, or NaN
 * @returns The normalized value or the default value
 */
export function normalize<T>(value: any, defaultValue: T): T {
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return defaultValue;
  }
  return value;
}
```

Example:
```typescript
normalize(null, 0); // Returns: 0
normalize(undefined, 'N/A'); // Returns: 'N/A'
normalize(NaN, 0); // Returns: 0
normalize(42, 0); // Returns: 42
normalize('Hello', 'N/A'); // Returns: 'Hello'
```

### `safeExtract`

Safely extracts values from nested objects with fallbacks.

```typescript
/**
 * Safely extracts a value from a nested object
 * @param obj The object to extract from
 * @param path Array of keys representing the path to the value
 * @param defaultValue Default value if the path doesn't exist
 * @returns The extracted value or the default value
 */
export function safeExtract<T>(obj: any, path: string[], defaultValue: T): T {
  if (!obj) {
    return defaultValue;
  }

  let current = obj;
  
  for (const key of path) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    
    current = current[key];
    
    if (current === undefined) {
      return defaultValue;
    }
  }
  
  return current === null ? defaultValue : current;
}
```

Example:
```typescript
const data = {
  user: {
    profile: {
      name: 'John',
      age: 30
    }
  }
};

safeExtract(data, ['user', 'profile', 'name'], 'Unknown'); // Returns: 'John'
safeExtract(data, ['user', 'profile', 'email'], 'N/A'); // Returns: 'N/A'
safeExtract(data, ['user', 'settings'], {}); // Returns: {}
```

### `firstValid`

Returns the first non-null, non-undefined value from an array of values.

```typescript
/**
 * Returns the first non-null, non-undefined value from an array
 * @param values Array of values to check
 * @param defaultValue Default value if all values are null or undefined
 * @returns The first valid value or the default value
 */
export function firstValid<T>(values: any[], defaultValue: T): T {
  for (const value of values) {
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  return defaultValue;
}
```

Example:
```typescript
firstValid([null, undefined, 0, 42], 'N/A'); // Returns: 0
firstValid([null, undefined, NaN], 0); // Returns: NaN
firstValid([null, undefined], 'Default'); // Returns: 'Default'
```

## Error Handling Utilities

### `TransformationError`

Custom error class for transformation-specific errors.

```typescript
/**
 * Custom error class for transformation-specific errors
 */
export class TransformationError extends Error {
  public readonly data: any;
  
  /**
   * Create a new TransformationError
   * @param message Error message
   * @param data Data that caused the error
   */
  constructor(message: string, data?: any) {
    super(message);
    this.name = 'TransformationError';
    this.data = data;
    
    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TransformationError);
    }
  }
}
```

Example:
```typescript
try {
  throw new TransformationError('Failed to transform metrics data', apiResponse);
} catch (error) {
  if (error instanceof TransformationError) {
    console.error(`${error.name}: ${error.message}`);
    console.error('Problematic data:', error.data);
  }
}
```

### `wrapTransformError`

Higher-order function that wraps transformers with error handling.

```typescript
/**
 * Wraps a transformer function with error handling
 * @param fn The transformer function to wrap
 * @param errorPrefix Prefix for the error message
 * @returns Wrapped function with error handling
 */
export function wrapTransformError<T extends (...args: any[]) => any>(
  fn: T,
  errorPrefix: string = 'Transformation error'
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args);
    } catch (error) {
      if (error instanceof TransformationError) {
        throw error; // Re-throw TransformationError
      }
      
      // Wrap other errors
      throw new TransformationError(
        `${errorPrefix}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        args[0] // Assume first argument is the data being transformed
      );
    }
  }) as T;
}
```

Example:
```typescript
const transformMetrics = wrapTransformError((apiResponse) => {
  // Transformation logic that might throw errors
  if (!apiResponse) {
    throw new Error('Missing API response');
  }
  // ...continue with transformation
}, 'Metrics transformation error');

// Usage
try {
  const metrics = transformMetrics(apiResponse);
} catch (error) {
  // Error is already wrapped as a TransformationError
  console.error(error.message);
}
```

### `logTransformWarning`

Utility to log transformation warnings without throwing errors.

```typescript
/**
 * Logs a transformation warning
 * @param message Warning message
 * @param data Data that caused the warning
 */
export function logTransformWarning(message: string, data?: any): void {
  console.warn(`[Transform Warning] ${message}`);
  if (process.env.NODE_ENV !== 'production' && data) {
    console.warn('Data:', data);
  }
}
```

Example:
```typescript
if (!apiResponse.metrics) {
  logTransformWarning('No metrics found in API response', apiResponse);
  // Continue with fallback behavior
}
```

## Array and Collection Utilities

### `ensureArray`

Ensures a value is an array, converting it if necessary.

```typescript
/**
 * Ensures a value is an array
 * @param value The value to ensure is an array
 * @returns An array containing the value, or an empty array
 */
export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) {
    return [];
  }
  
  return Array.isArray(value) ? value : [value];
}
```

Example:
```typescript
ensureArray('hello'); // Returns: ['hello']
ensureArray(['a', 'b', 'c']); // Returns: ['a', 'b', 'c']
ensureArray(null); // Returns: []
```

### `groupBy`

Groups an array of objects by a specified key.

```typescript
/**
 * Groups an array of objects by a specified key
 * @param array The array to group
 * @param key The key to group by
 * @returns An object with groups
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    result[groupKey] = result[groupKey] || [];
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}
```

Example:
```typescript
const data = [
  { id: 1, category: 'A', value: 10 },
  { id: 2, category: 'B', value: 20 },
  { id: 3, category: 'A', value: 30 }
];

const grouped = groupBy(data, 'category');
// Returns:
// {
//   'A': [
//     { id: 1, category: 'A', value: 10 },
//     { id: 3, category: 'A', value: 30 }
//   ],
//   'B': [
//     { id: 2, category: 'B', value: 20 }
//   ]
// }
```

## Best Practices for Using Core Utilities

1. **Use Type Safety**: Always provide proper generic types when using these utilities to ensure type safety.

2. **Provide Default Values**: Always provide sensible default values when using `normalize` and `safeExtract`.

3. **Handle Edge Cases**: Consider edge cases such as null, undefined, or empty arrays when transforming data.

4. **Error Handling**: Use the error handling utilities to gracefully handle transformation errors.

5. **Performance**: Be mindful of performance when using recursive functions like `objectKeysToCamelCase` on large objects.

6. **Logging**: Use `logTransformWarning` to log warnings without interrupting the transformation process.

7. **Testing**: Create comprehensive tests for all utility functions to ensure they work correctly in all scenarios. 