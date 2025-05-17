/**
 * Utility functions for formatting values
 */

/**
 * Safely convert a value to a number, returning 0 if invalid
 */
export const safeNumber = (value: any, defaultValue = 0): number => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return defaultValue;
  }
  return Number(value);
};

/**
 * Format a number as a percentage
 * @param value Number to format (decimal, e.g. 0.12 for 12%)
 * @param decimals Number of decimal places
 * @param defaultValue Default value to return if input is invalid
 * @returns Formatted percentage string
 */
export const safeFormatPercent = (value: any, decimals: number = 0, defaultValue = 'N/A'): string => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  // Convert to number and handle NaN
  let num: number;
  try {
    num = Number(value);
    if (isNaN(num)) {
      return defaultValue;
    }
  } catch (error) {
    return defaultValue;
  }

  // Check if the value is already a percentage (greater than 1)
  // If so, divide by 100 to convert to decimal
  const formattedNum = num > 1 ? num / 100 : num;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(formattedNum);
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Format a number as currency
 * @param value Number to format
 * @param decimals Number of decimal places
 * @param defaultValue Default value to return if input is invalid
 * @returns Formatted currency string
 */
export const safeFormatCurrency = (value: any, decimals: number = 2, defaultValue = 'N/A'): string => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  // Convert to number and handle NaN
  let num: number;
  try {
    num = Number(value);
    if (isNaN(num)) {
      return defaultValue;
    }
  } catch (error) {
    return defaultValue;
  }

  try {
    // For large numbers, use compact format
    if (num >= 1000000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        compactDisplay: 'short',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 // No decimal places for cleaner display
      }).format(num);
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Format a number with thousands separators
 * @param value Number to format
 * @param decimals Number of decimal places
 * @param defaultValue Default value to return if input is invalid
 * @returns Formatted number string
 */
export const safeFormatNumber = (value: any, decimals: number = 0, defaultValue = 'N/A'): string => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  // Convert to number and handle NaN
  let num: number;
  try {
    num = Number(value);
    if (isNaN(num)) {
      return defaultValue;
    }
  } catch (error) {
    return defaultValue;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Safely format a value with fixed decimal places
 * @param value Number to format
 * @param decimalPlaces Number of decimal places
 * @param defaultValue Default value to return if input is invalid
 * @returns Formatted number string with fixed decimal places
 */
export const safeToFixed = (value: any, decimalPlaces = 2, defaultValue = '0'): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return defaultValue;
  }
  return Number(value).toFixed(decimalPlaces);
};

/**
 * Format a date
 * @param value Date to format
 * @param defaultValue Default value to return if input is invalid
 * @returns Formatted date string
 */
export const safeFormatDate = (value: any, defaultValue = 'N/A'): string => {
  if (!value) return defaultValue;

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return defaultValue;

    return date.toLocaleDateString();
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Format a date and time
 * @param value Date to format
 * @param defaultValue Default value to return if input is invalid
 * @returns Formatted date and time string
 */
export const safeFormatDateTime = (value: any, defaultValue = 'N/A'): string => {
  if (!value) return defaultValue;

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return defaultValue;

    return date.toLocaleString();
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Format a duration in years
 * @param value Number of years
 * @param defaultValue Default value to return if input is invalid
 * @returns Formatted duration string
 */
export const safeFormatDuration = (value: any, defaultValue = 'N/A'): string => {
  if (value === undefined || value === null) return defaultValue;

  const num = Number(value);
  if (isNaN(num)) return defaultValue;

  if (num === 1) return '1 year';
  return `${num} years`;
};

/**
 * Format a number as a compact number (e.g. 1.2M)
 * @param value Number to format
 * @param decimals Number of decimal places
 * @param defaultValue Default value to return if input is invalid
 * @returns Formatted compact number string
 */
export const safeFormatCompactNumber = (value: any, decimals: number = 1, defaultValue = 'N/A'): string => {
  if (value === undefined || value === null) return defaultValue;

  const num = Number(value);
  if (isNaN(num)) return defaultValue;

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

/**
 * Format a number as currency
 */
export const formatCurrency = (value: any): string => {
  return safeFormatCurrency(value, 0, 'N/A');
};

/**
 * Format a number as percentage
 */
export const formatPercentage = (value: any): string => {
  return safeFormatPercent(value, 0, 'N/A');
};

/**
 * Format a number with thousands separators
 */
export const formatNumber = (value: any): string => {
  return safeFormatNumber(value, 0, 'N/A');
};