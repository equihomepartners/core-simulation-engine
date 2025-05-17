/**
 * Utility functions for dashboard components
 */

/**
 * Formats a number as a percentage
 * @param value - The value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals = 2): string => {
  if (value === null || value === undefined) return '-';
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Formats a number as currency
 * @param value - The value to format
 * @param currency - Currency symbol (default: '$')
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, currency = '$', decimals = 0): string => {
  if (value === null || value === undefined) return '-';
  
  // For large numbers, use abbreviations
  if (Math.abs(value) >= 1_000_000_000) {
    return `${currency}${(value / 1_000_000_000).toFixed(decimals)}B`;
  } else if (Math.abs(value) >= 1_000_000) {
    return `${currency}${(value / 1_000_000).toFixed(decimals)}M`;
  } else if (Math.abs(value) >= 1_000) {
    return `${currency}${(value / 1_000).toFixed(decimals)}K`;
  }
  
  return `${currency}${value.toFixed(decimals)}`;
};

/**
 * Formats a number with appropriate suffix (K, M, B)
 * @param value - The value to format
 * @param prefix - Optional prefix (default: '')
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted number string
 */
export const formatLargeNumber = (value: number, prefix = '', decimals = 1): string => {
  if (value === null || value === undefined) return '-';
  
  if (Math.abs(value) >= 1_000_000_000) {
    return `${prefix}${(value / 1_000_000_000).toFixed(decimals)}B`;
  } else if (Math.abs(value) >= 1_000_000) {
    return `${prefix}${(value / 1_000_000).toFixed(decimals)}M`;
  } else if (Math.abs(value) >= 1_000) {
    return `${prefix}${(value / 1_000).toFixed(decimals)}K`;
  }
  
  return `${prefix}${value.toFixed(decimals)}`;
};

/**
 * Formats a decimal number
 * @param value - The value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted decimal string
 */
export const formatDecimal = (value: number, decimals = 2): string => {
  if (value === null || value === undefined) return '-';
  return value.toFixed(decimals);
};

/**
 * Formats a year value
 * @param value - The year value
 * @returns Formatted year string
 */
export const formatYear = (value: number): string => {
  if (value === null || value === undefined) return '-';
  return `Year ${value}`;
};

/**
 * Generates a color scale for charts
 * @param baseColor - Base color in hex format
 * @param count - Number of colors to generate
 * @returns Array of hex color strings
 */
export const generateColorScale = (baseColor: string, count: number): string[] => {
  // Simple implementation - in a real app, you'd use a proper color library
  const colors = [];
  
  // Convert hex to RGB
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  
  for (let i = 0; i < count; i++) {
    // Adjust brightness based on index
    const factor = 0.7 + (0.3 * i / (count - 1 || 1));
    
    // Calculate new RGB values
    const newR = Math.min(255, Math.round(r * factor));
    const newG = Math.min(255, Math.round(g * factor));
    const newB = Math.min(255, Math.round(b * factor));
    
    // Convert back to hex
    const hex = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    colors.push(hex);
  }
  
  return colors;
};

/**
 * Default chart colors for consistent styling
 */
export const defaultChartColors = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  
  // Specific metrics
  irr: '#4caf50',
  multiple: '#2196f3',
  tvpi: '#9c27b0',
  dpi: '#ff9800',
  rvpi: '#f44336',
  
  // Cashflows
  capital_calls: '#f44336',
  distributions: '#4caf50',
  net_cashflow: '#2196f3',
  
  // Risk metrics
  default_rate: '#f44336',
  loss_ratio: '#ff9800',
  volatility: '#9c27b0',
  
  // GP metrics
  management_fees: '#2196f3',
  carried_interest: '#4caf50',
};

/**
 * Generates a layout configuration for react-grid-layout
 * @param items - Array of item IDs
 * @param cols - Number of columns
 * @returns Layout configuration object
 */
export const generateDefaultLayout = (items: string[], cols = 12): any => {
  const layout = [];
  let x = 0;
  let y = 0;
  
  items.forEach((id, index) => {
    // Default width is half the columns (or full width if cols is 1)
    const w = cols === 1 ? 1 : Math.floor(cols / 2);
    
    // Place items in a grid pattern
    layout.push({
      i: id,
      x: x,
      y: y,
      w: w,
      h: 2,
      minW: 2,
      minH: 1
    });
    
    // Update position for next item
    x += w;
    if (x >= cols) {
      x = 0;
      y += 2;
    }
  });
  
  return layout;
};

/**
 * Formats a metric value based on its type
 * @param value - The value to format
 * @param metricType - Type of metric (percentage, currency, decimal, year)
 * @returns Formatted string
 */
export const formatMetricValue = (value: number, metricType: string): string => {
  if (value === null || value === undefined) return '-';
  
  switch (metricType) {
    case 'percentage':
      return formatPercentage(value);
    case 'currency':
      return formatCurrency(value);
    case 'decimal':
      return formatDecimal(value);
    case 'year':
      return formatYear(value);
    default:
      return value.toString();
  }
};

/**
 * Determines the appropriate chart type for a metric
 * @param metricId - ID of the metric
 * @returns Recommended chart type
 */
export const getRecommendedChartType = (metricId: string): string => {
  // Time series metrics are best shown as line charts
  const timeSeriesMetrics = [
    'irr_over_time', 'tvpi_over_time', 'dpi_over_time', 'rvpi_over_time',
    'capital_calls', 'distributions', 'net_cashflow'
  ];
  
  // Categorical data is best shown as bar or pie charts
  const categoricalMetrics = [
    'sector_allocation', 'geographic_allocation', 'strategy_allocation'
  ];
  
  // Comparison metrics are best shown as bar charts
  const comparisonMetrics = [
    'irr', 'multiple', 'tvpi', 'dpi', 'rvpi', 'moic'
  ];
  
  if (timeSeriesMetrics.includes(metricId)) {
    return 'line';
  } else if (categoricalMetrics.includes(metricId)) {
    return 'pie';
  } else if (comparisonMetrics.includes(metricId)) {
    return 'bar';
  }
  
  // Default to bar chart
  return 'bar';
};
