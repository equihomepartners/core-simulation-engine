/**
 * Format a number as currency
 * @param value Number to format
 * @param options Intl.NumberFormat options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | undefined | null,
  options: Intl.NumberFormatOptions = {}
): string {
  if (value === undefined || value === null || isNaN(value as number)) {
    return 'N/A';
  }

  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };

  // For large numbers, use millions/billions format
  if (value >= 1_000_000) {
    if (value >= 1_000_000_000) {
      return formatCurrency(value / 1_000_000_000, {
        ...defaultOptions,
        ...options,
        maximumFractionDigits: 1,
      }) + 'B';
    }
    return formatCurrency(value / 1_000_000, {
      ...defaultOptions,
      ...options,
      maximumFractionDigits: 1,
    }) + 'M';
  }

  return new Intl.NumberFormat('en-US', {
    ...defaultOptions,
    ...options,
  }).format(value as number);
}

/**
 * Format a number as percentage
 * @param value Number to format (0.1 = 10%)
 * @param options Intl.NumberFormat options
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number | undefined | null,
  options: Intl.NumberFormatOptions = {}
): string {
  if (value === undefined || value === null || isNaN(value as number)) {
    return 'N/A';
  }

  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  };

  return new Intl.NumberFormat('en-US', {
    ...defaultOptions,
    ...options,
  }).format(value as number);
}

/**
 * Format a date
 * @param date Date to format
 * @param options Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat('en-US', {
    ...defaultOptions,
    ...options,
  }).format(date);
}

/**
 * Format a number with commas
 * @param value Number to format
 * @param options Intl.NumberFormat options
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {}
): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };

  return new Intl.NumberFormat('en-US', {
    ...defaultOptions,
    ...options,
  }).format(value);
}

/**
 * Format a decimal number with specified precision
 * @param value Number to format
 * @param decimals Number of decimal places
 * @param options Intl.NumberFormat options
 * @returns Formatted decimal string
 */
export function formatDecimal(
  value: number | undefined | null,
  decimals: number = 2,
  options: Intl.NumberFormatOptions = {}
): string {
  if (value === undefined || value === null || isNaN(value as number)) {
    return 'N/A';
  }

  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  };

  return new Intl.NumberFormat('en-US', {
    ...defaultOptions,
    ...options,
  }).format(value as number);
}

/**
 * Format a number as a multiple (e.g., 2.5x)
 * @param value Number to format
 * @param decimals Number of decimal places
 * @returns Formatted multiple string
 */
export function formatMultiple(
  value: number | undefined | null,
  decimals: number = 2
): string {
  if (value === undefined || value === null || isNaN(value as number)) {
    return 'N/A';
  }

  // Format with the specified number of decimal places
  return `${(value as number).toFixed(decimals)}x`;
}

/**
 * Format a simulation value based on its type
 * @param value Value to format
 * @param type Type of the value (currency, percentage, number, decimal, date, boolean, array, object, multiple)
 * @returns Formatted string
 */
export function formatSimulationValue(value: any, type: string): string {
  if (value === undefined || value === null) {
    return 'N/A';
  }

  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'number':
      return formatNumber(value);
    case 'decimal':
      return formatDecimal(value);
    case 'multiple':
      return formatMultiple(value);
    case 'date':
      return typeof value === 'string' || typeof value === 'number'
        ? formatDate(new Date(value))
        : formatDate(value);
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'array':
      return Array.isArray(value) ? value.join(', ') : String(value);
    case 'object':
      return JSON.stringify(value);
    default:
      return String(value);
  }
}
