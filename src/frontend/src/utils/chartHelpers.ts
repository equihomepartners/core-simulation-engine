/**
 * Utility functions for chart data processing and formatting
 */

import { financialColors } from '../theme/resultsTheme';

/**
 * Generate a gradient for chart backgrounds
 */
export const createGradient = (ctx: CanvasRenderingContext2D, chartArea: any, colorSet: string[]) => {
  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  
  // Add color stops
  colorSet.forEach((color, index) => {
    gradient.addColorStop(index / (colorSet.length - 1), color);
  });
  
  return gradient;
};

/**
 * Generate chart colors with opacity
 */
export const generateChartColors = (count: number, opacity: number = 1) => {
  const colors = [];
  const baseColors = financialColors.chart;
  
  for (let i = 0; i < count; i++) {
    const color = baseColors[i % baseColors.length];
    // Convert hex to rgba if opacity is less than 1
    if (opacity < 1) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      colors.push(`rgba(${r}, ${g}, ${b}, ${opacity})`);
    } else {
      colors.push(color);
    }
  }
  
  return colors;
};

/**
 * Format large numbers for axis labels
 */
export const formatAxisLabel = (value: number): string => {
  if (value === 0) return '0';
  
  if (Math.abs(value) >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
  
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  
  return value.toString();
};

/**
 * Calculate nice axis intervals
 */
export const calculateNiceScale = (min: number, max: number, maxTicks: number = 10): number[] => {
  const range = niceNumber(max - min, false);
  const tickSpacing = niceNumber(range / (maxTicks - 1), true);
  const niceMin = Math.floor(min / tickSpacing) * tickSpacing;
  const niceMax = Math.ceil(max / tickSpacing) * tickSpacing;
  
  const ticks = [];
  for (let tick = niceMin; tick <= niceMax; tick += tickSpacing) {
    ticks.push(parseFloat(tick.toFixed(10)));
  }
  
  return ticks;
};

/**
 * Helper function for calculateNiceScale
 */
const niceNumber = (range: number, round: boolean): number => {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  
  let niceFraction;
  
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }
  
  return niceFraction * Math.pow(10, exponent);
};

/**
 * Generate a series of dates for time-based charts
 */
export const generateDateSeries = (startDate: Date, endDate: Date, interval: 'month' | 'quarter' | 'year'): Date[] => {
  const dates: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    dates.push(new Date(current));
    
    if (interval === 'month') {
      current.setMonth(current.getMonth() + 1);
    } else if (interval === 'quarter') {
      current.setMonth(current.getMonth() + 3);
    } else {
      current.setFullYear(current.getFullYear() + 1);
    }
  }
  
  return dates;
};

/**
 * Format a date for chart labels
 */
export const formatDateLabel = (date: Date, format: 'short' | 'medium' | 'long' = 'short'): string => {
  if (format === 'short') {
    return `${date.getMonth() + 1}/${date.getFullYear().toString().substr(2, 2)}`;
  } else if (format === 'medium') {
    return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
  } else {
    return date.toLocaleDateString();
  }
};

/**
 * Calculate moving average for smoothing chart data
 */
export const calculateMovingAverage = (data: number[], windowSize: number): number[] => {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      // Not enough data points yet, use the actual value
      result.push(data[i]);
    } else {
      // Calculate average of the window
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        sum += data[i - j];
      }
      result.push(sum / windowSize);
    }
  }
  
  return result;
};

/**
 * Generate a color scale for heatmaps
 */
export const generateColorScale = (min: number, max: number, steps: number): string[] => {
  const colors: string[] = [];
  const colorRanges = [
    { r: [0, 0], g: [0, 255], b: [255, 0] },    // Blue to Red
    { r: [0, 255], g: [255, 0], b: [0, 0] }     // Yellow to Red
  ];
  
  const range = max - min;
  const stepSize = range / (steps - 1);
  
  for (let i = 0; i < steps; i++) {
    const value = min + (i * stepSize);
    const normalizedValue = (value - min) / range;
    
    // Determine which color range to use
    const rangeIndex = Math.min(
      Math.floor(normalizedValue * colorRanges.length),
      colorRanges.length - 1
    );
    
    // Calculate position within the selected range
    const rangePosition = (normalizedValue * colorRanges.length) % 1;
    
    const range = colorRanges[rangeIndex];
    const r = Math.round(range.r[0] + rangePosition * (range.r[1] - range.r[0]));
    const g = Math.round(range.g[0] + rangePosition * (range.g[1] - range.g[0]));
    const b = Math.round(range.b[0] + rangePosition * (range.b[1] - range.b[0]));
    
    colors.push(`rgb(${r}, ${g}, ${b})`);
  }
  
  return colors;
};
