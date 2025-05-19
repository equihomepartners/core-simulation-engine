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

  // Ensure value is within a reasonable range to avoid errors
  if (Math.abs(value as number) > 1000000000000) { // Cap at trillion
    value = value > 0 ? 1000000000000 : -1000000000000;
  }

  // Validate and cap maximumFractionDigits to avoid errors
  const safeOptions = { ...options };
  if (safeOptions.maximumFractionDigits !== undefined) {
    safeOptions.maximumFractionDigits = Math.min(
      Math.max(0, safeOptions.maximumFractionDigits),
      20 // Maximum allowed by Intl.NumberFormat
    );
  }

  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };

  try {
    // For large numbers, use millions/billions format
    if (value >= 1_000_000) {
      if (value >= 1_000_000_000) {
        return formatCurrency(value / 1_000_000_000, {
          ...defaultOptions,
          ...safeOptions,
          maximumFractionDigits: 1,
        }) + 'B';
      }
      return formatCurrency(value / 1_000_000, {
        ...defaultOptions,
        ...safeOptions,
        maximumFractionDigits: 1,
      }) + 'M';
    }

    return new Intl.NumberFormat('en-US', {
      ...defaultOptions,
      ...safeOptions,
    }).format(value as number);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return value !== undefined && value !== null ? `$${(value as number).toFixed(0)}` : 'N/A';
  }
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

  // Ensure value is within a reasonable range to avoid errors
  if (Math.abs(value as number) > 100) {
    value = value > 0 ? 100 : -100;
  }

  // Validate and cap maximumFractionDigits to avoid errors
  const safeOptions = { ...options };
  if (safeOptions.maximumFractionDigits !== undefined) {
    safeOptions.maximumFractionDigits = Math.min(
      Math.max(0, safeOptions.maximumFractionDigits),
      20 // Maximum allowed by Intl.NumberFormat
    );
  } else {
    // Default to 1 decimal place if not specified
    safeOptions.maximumFractionDigits = 1;
  }

  // Set minimumFractionDigits to be at most maximumFractionDigits
  if (safeOptions.minimumFractionDigits !== undefined) {
    safeOptions.minimumFractionDigits = Math.min(
      safeOptions.minimumFractionDigits,
      safeOptions.maximumFractionDigits
    );
  }

  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  };

  try {
    return new Intl.NumberFormat('en-US', {
      ...defaultOptions,
      ...safeOptions,
    }).format(value as number);
  } catch (error) {
    console.error('Error formatting percentage:', error);
    // Fallback to simple percentage formatting
    const decimals = safeOptions.maximumFractionDigits || 1;
    return value !== undefined && value !== null ? `${(value * 100).toFixed(decimals)}%` : 'N/A';
  }
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
  value: number | undefined | null,
  options: Intl.NumberFormatOptions = {}
): string {
  if (value === undefined || value === null || isNaN(value as number)) {
    return 'N/A';
  }

  // Validate and cap maximumFractionDigits to avoid errors
  const safeOptions = { ...options };
  if (safeOptions.maximumFractionDigits !== undefined) {
    safeOptions.maximumFractionDigits = Math.min(
      Math.max(0, safeOptions.maximumFractionDigits),
      20 // Maximum allowed by Intl.NumberFormat
    );
  }

  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };

  try {
    return new Intl.NumberFormat('en-US', {
      ...defaultOptions,
      ...safeOptions,
    }).format(value as number);
  } catch (error) {
    console.error('Error formatting number:', error);
    return value !== undefined && value !== null ? value.toString() : 'N/A';
  }
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

  // Ensure value is within a reasonable range to avoid errors
  if (Math.abs(value as number) > 1000000) {
    value = value > 0 ? 1000000 : -1000000;
  }

  // Ensure decimals is within valid range
  const safeDecimals = Math.min(Math.max(0, decimals), 20);

  // Validate and cap maximumFractionDigits to avoid errors
  const safeOptions = { ...options };
  if (safeOptions.maximumFractionDigits !== undefined) {
    safeOptions.maximumFractionDigits = Math.min(
      Math.max(0, safeOptions.maximumFractionDigits),
      20 // Maximum allowed by Intl.NumberFormat
    );
  }

  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: safeDecimals,
    maximumFractionDigits: safeDecimals,
  };

  try {
    return new Intl.NumberFormat('en-US', {
      ...defaultOptions,
      ...safeOptions,
    }).format(value as number);
  } catch (error) {
    console.error('Error formatting decimal:', error);
    return value !== undefined && value !== null ? (value as number).toFixed(safeDecimals) : 'N/A';
  }
}

/**
 * Format a number as a multiple (e.g., 2.5x)
 * @param value Number to format
 * @param options Options object with decimals and signDisplay properties
 * @returns Formatted multiple string
 */
export function formatMultiple(
  value: number | undefined | null,
  options: { decimals?: number; signDisplay?: 'auto' | 'always' | 'never' } = {}
): string {
  if (value === undefined || value === null || isNaN(value as number)) {
    return 'N/A';
  }

  // Ensure value is within a reasonable range to avoid errors
  if (Math.abs(value as number) > 1000000) {
    value = value > 0 ? 1000000 : -1000000;
  }

  const decimals = options.decimals !== undefined ? options.decimals : 2;
  const showSign = options.signDisplay === 'always';

  try {
    // Format with the specified number of decimal places
    const formattedValue = (value as number).toFixed(decimals);
    return showSign && value > 0 ? `+${formattedValue}x` : `${formattedValue}x`;
  } catch (error) {
    console.error('Error formatting multiple:', error);
    return 'N/A';
  }
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

/**
 * Alias for formatPercentage for backward compatibility
 */
export const formatPercent = formatPercentage;
