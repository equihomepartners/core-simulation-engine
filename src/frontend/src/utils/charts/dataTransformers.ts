/**
 * Utility functions for transforming API data into chart-friendly formats
 */

import { TimeGranularity } from '../../components/controls/TimeGranularitySelector';
import { DisplayMode } from '../../components/controls/DisplayModeToggle';
import { CumulativeMode } from '../../components/controls/CumulativeToggle';

// Define common interfaces
export interface TimeSeriesDataPoint {
  year: number;
  quarter?: number | null;
  month?: number | null;
  // Allow any additional numeric properties
  capital_calls?: number;
  distributions?: number;
  management_fees?: number;
  net_cashflow?: number;
  // Portfolio properties
  active_loans?: number;
  loans_exited?: number;
  default_rate?: number;
  portfolio_value?: number;
  // Returns properties
  irr?: number;
  moic?: number;
  tvpi?: number;
  dpi?: number;
  rvpi?: number;
  // GP economics properties
  gp_management_fees?: number;
  gp_carried_interest?: number;
  gp_total_revenue?: number;
  gp_expenses?: number;
  gp_net_income?: number;
  // Allow any other properties
  [key: string]: any;
}

export interface ChartDataPoint {
  x: string | number;
  y: number;
}

export interface MetricDefinition {
  id: string;
  name: string;
  color?: string;
  category?: string;
  description?: string;
  formatter?: (value: number) => string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor: string | string[];
  borderWidth: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

// Generate chart colors
export const generateChartColors = (count: number): string[] => {
  const baseColors = [
    '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
    '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'
  ];

  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  // If we need more colors, generate them
  const colors = [...baseColors];
  const opacity = 0.7;

  for (let i = baseColors.length; i < count; i++) {
    const index = i % baseColors.length;
    const color = baseColors[index];
    const newColor = color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
    colors.push(newColor);
  }

  return colors;
};

// Format numbers for display
export const formatNumber = (value: number, format: 'currency' | 'percent' | 'number' = 'number', decimals = 2): string => {
  if (isNaN(value)) return 'N/A';

  if (format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  if (format === 'percent') {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

// Format large numbers with abbreviations
export const formatLargeNumber = (value: number): string => {
  if (value === 0) return '$0';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1000000000) {
    return `${sign}$${(absValue / 1000000000).toFixed(1)}B`;
  }

  if (absValue >= 1000000) {
    return `${sign}$${(absValue / 1000000).toFixed(1)}M`;
  }

  if (absValue >= 1000) {
    return `${sign}$${(absValue / 1000).toFixed(1)}K`;
  }

  return `${sign}$${absValue.toFixed(2)}`;
};

// Format number as percentage
export const formatPercentage = (value: number): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.0%';
  }

  // Convert to percentage (multiply by 100) and format with 1 decimal place
  return `${(value * 100).toFixed(1)}%`;
};

// Format number with specified precision
export const formatNumberWithPrecision = (value: number, precision: number = 2): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }

  return value.toFixed(precision);
};

// Get time period label based on granularity
export const getTimePeriodLabel = (dataPoint: TimeSeriesDataPoint, granularity: TimeGranularity): string => {
  switch (granularity) {
    case 'yearly':
      return `${dataPoint.year}`;
    case 'quarterly':
      return `${dataPoint.year} Q${dataPoint.quarter}`;
    case 'monthly':
      return `${dataPoint.year}-${String(dataPoint.month).padStart(2, '0')}`;
    default:
      return `${dataPoint.year}`;
  }
};

// Filter time series data by date range
export const filterTimeSeriesByDateRange = (
  data: TimeSeriesDataPoint[],
  startYear: number,
  endYear: number
): TimeSeriesDataPoint[] => {
  return data.filter(point => point.year >= startYear && point.year <= endYear);
};

// Convert time series data to cumulative
export const convertToCumulative = (
  data: TimeSeriesDataPoint[],
  metricIds: string[]
): TimeSeriesDataPoint[] => {
  const result = [...data];
  const cumulativeValues: Record<string, number> = {};

  metricIds.forEach(metricId => {
    cumulativeValues[metricId] = 0;
  });

  result.forEach((point, index) => {
    metricIds.forEach(metricId => {
      if (typeof point[metricId] === 'number') {
        cumulativeValues[metricId] += point[metricId];
        result[index] = {
          ...point,
          [metricId]: cumulativeValues[metricId]
        };
      }
    });
  });

  return result;
};

// Convert values to percentages
export const convertToPercentage = (
  data: TimeSeriesDataPoint[],
  metricIds: string[]
): TimeSeriesDataPoint[] => {
  // First, calculate the total for each time period
  const result = data.map(point => {
    const total = metricIds.reduce((sum, metricId) => {
      return sum + (typeof point[metricId] === 'number' ? Math.abs(point[metricId]) : 0);
    }, 0);

    const percentagePoint: TimeSeriesDataPoint = { ...point };

    metricIds.forEach(metricId => {
      if (typeof point[metricId] === 'number') {
        percentagePoint[metricId] = total === 0 ? 0 : (point[metricId] / total) * 100;
      }
    });

    return percentagePoint;
  });

  return result;
};

// Transform time series data for Chart.js
export const transformTimeSeriesForChart = (
  data: TimeSeriesDataPoint[],
  metricIds: string[],
  metricDefinitions: MetricDefinition[],
  granularity: TimeGranularity,
  displayMode: DisplayMode,
  cumulativeMode: CumulativeMode
): {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }[];
} => {
  // Apply transformations based on options
  let transformedData = [...data];

  // Filter metrics to only those that exist in the data
  const availableMetricIds = metricIds.filter(metricId =>
    data.some(point => typeof point[metricId] === 'number')
  );

  // Apply cumulative transformation if needed
  if (cumulativeMode === 'cumulative') {
    transformedData = convertToCumulative(transformedData, availableMetricIds);
  }

  // Apply percentage transformation if needed
  if (displayMode === 'percentage') {
    transformedData = convertToPercentage(transformedData, availableMetricIds);
  }

  // Generate labels based on granularity
  const labels = transformedData.map(point => getTimePeriodLabel(point, granularity));

  // Generate datasets
  const datasets = availableMetricIds.map((metricId, index) => {
    const metricDef = metricDefinitions.find(m => m.id === metricId);
    const color = metricDef?.color || generateChartColors(availableMetricIds.length)[index];

    return {
      label: metricDef?.name || metricId,
      data: transformedData.map(point => typeof point[metricId] === 'number' ? point[metricId] : 0),
      backgroundColor: color + '80', // Add transparency
      borderColor: color,
      borderWidth: 1
    };
  });

  return {
    labels,
    datasets
  };
};

// Transform data for pie/doughnut charts
export const transformDataForPieChart = (
  data: Record<string, number>,
  labels: string[],
  colors?: string[]
): {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
} => {
  const chartColors = colors || generateChartColors(labels.length);

  return {
    labels,
    datasets: [{
      data: labels.map(label => data[label] || 0),
      backgroundColor: chartColors.map(color => color + '80'), // Add transparency
      borderColor: chartColors,
      borderWidth: 1
    }]
  };
};

// Calculate statistics for a metric
export const calculateStatistics = (
  data: TimeSeriesDataPoint[],
  metricId: string
): {
  min: number;
  max: number;
  avg: number;
  sum: number;
  count: number;
} => {
  const values = data
    .map(point => point[metricId])
    .filter((value): value is number => typeof value === 'number');

  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      sum: 0,
      count: 0
    };
  }

  const sum = values.reduce((acc, val) => acc + val, 0);

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: sum / values.length,
    sum,
    count: values.length
  };
};

// Calculate year-over-year growth
export const calculateYoYGrowth = (
  data: TimeSeriesDataPoint[],
  metricId: string
): TimeSeriesDataPoint[] => {
  if (data.length < 2) return [];

  const result: TimeSeriesDataPoint[] = [];

  for (let i = 1; i < data.length; i++) {
    const currentValue = data[i][metricId];
    const previousValue = data[i - 1][metricId];

    if (typeof currentValue === 'number' && typeof previousValue === 'number' && previousValue !== 0) {
      const growth = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;

      result.push({
        ...data[i],
        [metricId]: growth
      });
    } else {
      result.push({
        ...data[i],
        [metricId]: 0
      });
    }
  }

  return result;
};

// Calculate compound annual growth rate (CAGR)
export const calculateCAGR = (
  startValue: number,
  endValue: number,
  years: number
): number => {
  if (startValue <= 0 || years <= 0) return 0;

  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
};

// Calculate moving average
export const calculateMovingAverage = (
  data: TimeSeriesDataPoint[],
  metricId: string,
  periods: number
): TimeSeriesDataPoint[] => {
  if (data.length < periods) return [];

  const result: TimeSeriesDataPoint[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < periods - 1) {
      result.push({
        ...data[i],
        [`${metricId}_ma`]: null
      });
      continue;
    }

    let sum = 0;
    let count = 0;

    for (let j = 0; j < periods; j++) {
      const value = data[i - j][metricId];
      if (typeof value === 'number') {
        sum += value;
        count++;
      }
    }

    const average = count > 0 ? sum / count : 0;

    result.push({
      ...data[i],
      [`${metricId}_ma`]: average
    });
  }

  return result;
};

/**
 * Convert API visualization data to Chart.js format
 *
 * @param apiData Data from the visualization API
 * @param metricDefinitions Metric definitions with colors and labels
 * @returns Formatted chart data ready for Chart.js
 */
export const convertApiFormatToChartFormat = (
  apiData: any,
  metricDefinitions: MetricDefinition[]
): ChartData => {
  if (!apiData) {
    return {
      labels: [],
      datasets: [
        {
          label: 'No Data',
          data: [],
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          borderWidth: 1
        }
      ]
    };
  }

  // Case 1: Time series format with years and metrics
  if (apiData.years && Object.keys(apiData).some(key => key !== 'years' && Array.isArray(apiData[key]))) {
    const labels = apiData.years.map(String);
    const datasets = Object.keys(apiData)
      .filter(key => key !== 'years' && Array.isArray(apiData[key]))
      .map((metricId, index) => {
        const metricDef = metricDefinitions.find(m => m.id === metricId) || {
          id: metricId,
          name: metricId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          color: `hsl(${index * 30}, 70%, 50%)`
        };

        const color = metricDef.color || `hsl(${index * 30}, 70%, 50%)`;

        return {
          label: metricDef.name,
          data: apiData[metricId],
          backgroundColor: `${color}80`, // Add transparency
          borderColor: color,
          borderWidth: 1
        };
      });

    return { labels, datasets };
  }

  // Case 2: Revenue sources or expense breakdown (pie chart data)
  if (apiData.labels && apiData.values && Array.isArray(apiData.labels) && Array.isArray(apiData.values)) {
    const labels = apiData.labels;
    const data = apiData.values;
    const colors = apiData.colors || generateChartColors(labels.length);

    const datasets = [{
      label: 'Value',
      data,
      backgroundColor: Array.isArray(colors)
        ? colors.map(color => `${color}80`)
        : Object.values(colors).map(color => `${color}80`),
      borderColor: Array.isArray(colors) ? colors : Object.values(colors),
      borderWidth: 1
    }];

    return { labels, datasets };
  }

  // Case 3: Object with key-value pairs (like revenue_sources)
  if (typeof apiData === 'object' && !Array.isArray(apiData) && Object.keys(apiData).length > 0) {
    const keys = Object.keys(apiData);
    const values = Object.values(apiData) as number[];

    if (values.every(v => typeof v === 'number')) {
      const colors = generateChartColors(keys.length);

      return {
        labels: keys,
        datasets: [{
          label: 'Value',
          data: values,
          backgroundColor: colors.map(color => `${color}80`),
          borderColor: colors,
          borderWidth: 1
        }]
      };
    }
  }

  // Case 4: Portfolio composition format
  if (apiData.time_points && apiData.categories && apiData.values) {
    const labels = apiData.time_points;
    const datasets = apiData.categories.map((category: string, index: number) => {
      const color = apiData.colors?.[category] || `hsl(${index * 30}, 70%, 50%)`;
      return {
        label: category,
        data: apiData.values.map((yearValues: number[]) => yearValues[index]),
        backgroundColor: `${color}80`,
        borderColor: color,
        borderWidth: 1
      };
    });

    return { labels, datasets };
  }

  // Default: Return empty chart data
  console.warn('Unknown API data format, could not convert to chart format:', apiData);
  return {
    labels: [],
    datasets: [
      {
        label: 'No Data',
        data: [],
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1
      }
    ]
  };
};

/**
 * Enhanced API response handling - converts various backend visualization formats
 * to a standardized format for our components
 *
 * @param apiResponse The complete API response from the visualization endpoint
 * @param metricDefinitions Metric definitions with colors and labels
 * @param dataType The requested data type (cashflows, portfolio, etc.)
 * @returns Formatted chart data ready for frontend components
 */
export const processVisualizationApiResponse = (
  apiResponse: any,
  metricDefinitions: MetricDefinition[],
  dataType: string
): { chartData: ChartData, rawData: TimeSeriesDataPoint[] } => {
  if (!apiResponse) {
    console.warn('Received null or undefined API response');
    return {
      chartData: createEmptyChartData('No data available'),
      rawData: []
    };
  }

  // First, try to find the relevant data section
  let visualizationData = null;
  let extractionPath = '';

  // Handle both camelCase and snake_case versions of dataType
  const camelDataType = dataType.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  const snakeDataType = dataType.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

  // Case 1: Direct data property (try both camelCase and snake_case)
  if (apiResponse[dataType]) {
    visualizationData = apiResponse[dataType];
    extractionPath = dataType;
  }
  else if (apiResponse[camelDataType]) {
    visualizationData = apiResponse[camelDataType];
    extractionPath = camelDataType;
  }
  else if (apiResponse[snakeDataType]) {
    visualizationData = apiResponse[snakeDataType];
    extractionPath = snakeDataType;
  }
  // Case 2: visualization_data object (try both camelCase and snake_case)
  else if (apiResponse.visualization_data && apiResponse.visualization_data[dataType]) {
    visualizationData = apiResponse.visualization_data[dataType];
    extractionPath = `visualization_data.${dataType}`;
  }
  else if (apiResponse.visualizationData && apiResponse.visualizationData[camelDataType]) {
    visualizationData = apiResponse.visualizationData[camelDataType];
    extractionPath = `visualizationData.${camelDataType}`;
  }
  // Case 3: Common alternative names for specific data types
  else if (dataType === 'cashflows' || dataType === 'cash_flows' || camelDataType === 'cashflows') {
    // Try all possible cashflow data locations
    if (apiResponse.cashflow_over_time) {
      visualizationData = apiResponse.cashflow_over_time;
      extractionPath = 'cashflow_over_time';
    }
    else if (apiResponse.cashflowOverTime) {
      visualizationData = apiResponse.cashflowOverTime;
      extractionPath = 'cashflowOverTime';
    }
    else if (apiResponse.cash_flows) {
      visualizationData = apiResponse.cash_flows;
      extractionPath = 'cash_flows';
    }
    else if (apiResponse.cashFlows) {
      visualizationData = apiResponse.cashFlows;
      extractionPath = 'cashFlows';
    }
    else if (apiResponse.results && apiResponse.results.cash_flows) {
      visualizationData = apiResponse.results.cash_flows;
      extractionPath = 'results.cash_flows';
    }
    else if (apiResponse.results && apiResponse.results.cashFlows) {
      visualizationData = apiResponse.results.cashFlows;
      extractionPath = 'results.cashFlows';
    }
  }
  else if (dataType === 'portfolio' || dataType === 'portfolio_evolution' ||
           camelDataType === 'portfolio' || camelDataType === 'portfolioEvolution') {
    // Try all possible portfolio data locations
    if (apiResponse.portfolio_composition) {
      visualizationData = apiResponse.portfolio_composition;
      extractionPath = 'portfolio_composition';
    }
    else if (apiResponse.portfolioComposition) {
      visualizationData = apiResponse.portfolioComposition;
      extractionPath = 'portfolioComposition';
    }
    else if (apiResponse.portfolio_evolution) {
      visualizationData = apiResponse.portfolio_evolution;
      extractionPath = 'portfolio_evolution';
    }
    else if (apiResponse.portfolioEvolution) {
      visualizationData = apiResponse.portfolioEvolution;
      extractionPath = 'portfolioEvolution';
    }
    else if (apiResponse.yearly_portfolio) {
      visualizationData = apiResponse.yearly_portfolio;
      extractionPath = 'yearly_portfolio';
    }
    else if (apiResponse.yearlyPortfolio) {
      visualizationData = apiResponse.yearlyPortfolio;
      extractionPath = 'yearlyPortfolio';
    }
    else if (apiResponse.results && apiResponse.results.portfolio_evolution) {
      visualizationData = apiResponse.results.portfolio_evolution;
      extractionPath = 'results.portfolio_evolution';
    }
    else if (apiResponse.results && apiResponse.results.portfolioEvolution) {
      visualizationData = apiResponse.results.portfolioEvolution;
      extractionPath = 'results.portfolioEvolution';
    }
  }
  else if (dataType === 'gp_economics' || camelDataType === 'gpEconomics') {
    // Try all possible GP economics data locations
    if (apiResponse.gp_economics) {
      visualizationData = apiResponse.gp_economics;
      extractionPath = 'gp_economics';
    }
    else if (apiResponse.gpEconomics) {
      visualizationData = apiResponse.gpEconomics;
      extractionPath = 'gpEconomics';
    }
    else if (apiResponse.expense_breakdown) {
      visualizationData = apiResponse.expense_breakdown;
      extractionPath = 'expense_breakdown';
    }
    else if (apiResponse.expenseBreakdown) {
      visualizationData = apiResponse.expenseBreakdown;
      extractionPath = 'expenseBreakdown';
    }
    else if (apiResponse.revenue_breakdown) {
      visualizationData = apiResponse.revenue_breakdown;
      extractionPath = 'revenue_breakdown';
    }
    else if (apiResponse.revenueBreakdown) {
      visualizationData = apiResponse.revenueBreakdown;
      extractionPath = 'revenueBreakdown';
    }
    else if (apiResponse.results && apiResponse.results.gp_economics) {
      visualizationData = apiResponse.results.gp_economics;
      extractionPath = 'results.gp_economics';
    }
    else if (apiResponse.results && apiResponse.results.gpEconomics) {
      visualizationData = apiResponse.results.gpEconomics;
      extractionPath = 'results.gpEconomics';
    }
  }
  // Case 4: Data at the root
  else if (apiResponse.data) {
    visualizationData = apiResponse.data;
    extractionPath = 'data';
  }
  // Case 5: Metrics directly at the root for summary data
  else if (apiResponse.metrics || apiResponse.key_metrics) {
    visualizationData = apiResponse.metrics || apiResponse.key_metrics;
    extractionPath = apiResponse.metrics ? 'metrics' : 'key_metrics';
  }
  // Case 6: Results object
  else if (apiResponse.results) {
    visualizationData = apiResponse.results;
    extractionPath = 'results';
  }
  // Case 7: Try the entire response as a last resort
  else if (Object.keys(apiResponse).length > 0) {
    visualizationData = apiResponse;
    extractionPath = 'root';
  }

  console.log(`Found data at: ${extractionPath}`, visualizationData);

  // If we still don't have data, create empty chart data
  if (!visualizationData) {
    console.warn('No visualization data found in API response');
    return {
      chartData: createEmptyChartData('No data found'),
      rawData: []
    };
  }

  // Normalize the data to ensure it has the expected structure
  visualizationData = normalizeVisualizationData(visualizationData, dataType);

  // Convert to chart data
  const chartData = convertApiFormatToChartFormat(visualizationData, metricDefinitions);

  // Extract raw data for other uses
  let rawData: TimeSeriesDataPoint[] = [];

  // Try to convert to raw data based on format
  if (visualizationData.years && Array.isArray(visualizationData.years)) {
    // Format: { years: [2020, 2021], metric1: [100, 200], metric2: [300, 400] }
    rawData = visualizationData.years.map((year: number, index: number) => {
      const dataPoint: TimeSeriesDataPoint = { year };

      Object.keys(visualizationData).forEach(key => {
        if (key !== 'years' && Array.isArray(visualizationData[key])) {
          dataPoint[key] = visualizationData[key][index];
        }
      });

      return dataPoint;
    });
  }
  else if (Array.isArray(visualizationData)) {
    // Format: [{ year: 2020, metric1: 100, metric2: 300 }, { year: 2021, ... }]
    rawData = visualizationData.filter((point: any) =>
      point && (typeof point.year === 'number' || typeof point.year === 'string')
    ).map((point: any) => ({
      ...point,
      year: typeof point.year === 'string' ? parseInt(point.year) : point.year
    }));
  }
  else if (typeof visualizationData === 'object' && !Array.isArray(visualizationData)) {
    // Format: { 2020: { metric1: 100, metric2: 300 }, 2021: { ... } }
    const yearKeys = Object.keys(visualizationData).filter(key => /^\d{4}$/.test(key));

    if (yearKeys.length > 0) {
      rawData = yearKeys.map(yearStr => {
        const year = parseInt(yearStr);
        return {
          year,
          ...visualizationData[yearStr]
        };
      });
    }
  }

  // If we still don't have raw data, create empty array
  if (rawData.length === 0) {
    console.warn('Could not extract raw data from visualization data');
  }

  return { chartData, rawData };
};

/**
 * Normalize visualization data to ensure it has the expected structure
 * @param data The visualization data to normalize
 * @param dataType The type of data (cashflows, portfolio, etc.)
 * @returns Normalized visualization data
 */
function normalizeVisualizationData(data: any, dataType: string): any {
  if (!data) return {};

  // Create a copy of the data
  const normalized = { ...data };

  // Handle different data types
  switch (dataType) {
    case 'cashflows':
    case 'cash_flows':
      return normalizeCashFlowsData(normalized);
    case 'portfolio':
    case 'portfolio_evolution':
      return normalizePortfolioData(normalized);
    case 'gp_economics':
      return normalizeGPEconomicsData(normalized);
    default:
      return normalized;
  }
}

/**
 * Normalize cash flows data
 * @param data The cash flows data to normalize
 * @returns Normalized cash flows data
 */
function normalizeCashFlowsData(data: any): any {
  if (!data) return {};

  const normalized = { ...data };

  // Ensure years array exists
  if (!normalized.years || !Array.isArray(normalized.years) || normalized.years.length === 0) {
    // Try to extract years from other arrays
    const metricArrays = Object.entries(normalized)
      .filter(([key, value]) => key !== 'years' && Array.isArray(value))
      .map(([_, value]) => value as any[]);

    if (metricArrays.length > 0) {
      // Use the length of the first array to create years
      const yearCount = metricArrays[0].length;
      normalized.years = Array.from({ length: yearCount }, (_, i) => i);
    } else {
      // Default years array
      normalized.years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    }
  }

  // Ensure all required metrics exist with proper length
  const requiredMetrics = [
    'capital_called', 'capitalCalled',
    'distributions',
    'net_cash_flow', 'netCashFlow'
  ];

  requiredMetrics.forEach(metric => {
    if (!normalized[metric] || !Array.isArray(normalized[metric])) {
      normalized[metric] = new Array(normalized.years.length).fill(0);
    } else if (normalized[metric].length < normalized.years.length) {
      // Pad the array if it's shorter than years
      normalized[metric] = [
        ...normalized[metric],
        ...new Array(normalized.years.length - normalized[metric].length).fill(0)
      ];
    }
  });

  return normalized;
}

/**
 * Normalize portfolio data
 * @param data The portfolio data to normalize
 * @returns Normalized portfolio data
 */
function normalizePortfolioData(data: any): any {
  if (!data) return {};

  const normalized = { ...data };

  // Handle portfolio evolution data (time series)
  if (normalized.years ||
      normalized.active_loans || normalized.activeLoans ||
      normalized.new_loans || normalized.newLoans) {

    // Ensure years array exists
    if (!normalized.years || !Array.isArray(normalized.years) || normalized.years.length === 0) {
      // Try to extract years from other arrays
      const metricArrays = Object.entries(normalized)
        .filter(([key, value]) => key !== 'years' && Array.isArray(value))
        .map(([_, value]) => value as any[]);

      if (metricArrays.length > 0) {
        // Use the length of the first array to create years
        const yearCount = metricArrays[0].length;
        normalized.years = Array.from({ length: yearCount }, (_, i) => i);
      } else {
        // Default years array
        normalized.years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      }
    }

    // Ensure all required metrics exist with proper length
    const requiredMetrics = [
      'active_loans', 'activeLoans',
      'new_loans', 'newLoans',
      'exited_loans', 'exitedLoans',
      'defaulted_loans', 'defaultedLoans',
      'total_value', 'totalValue'
    ];

    requiredMetrics.forEach(metric => {
      if (!normalized[metric] || !Array.isArray(normalized[metric])) {
        normalized[metric] = new Array(normalized.years.length).fill(0);
      } else if (normalized[metric].length < normalized.years.length) {
        // Pad the array if it's shorter than years
        normalized[metric] = [
          ...normalized[metric],
          ...new Array(normalized.years.length - normalized[metric].length).fill(0)
        ];
      }
    });
  }
  // Handle portfolio composition data (pie chart)
  else {
    // Ensure zone_distribution exists
    if (!normalized.zone_distribution && !normalized.zoneDistribution) {
      normalized.zone_distribution = { green: 0.6, orange: 0.3, red: 0.1 };
    }

    // Ensure loan counts exist
    normalized.total_loans = normalized.total_loans || normalized.totalLoans || 0;
    normalized.active_loans = normalized.active_loans || normalized.activeLoans || 0;
    normalized.exited_loans = normalized.exited_loans || normalized.exitedLoans || 0;
    normalized.defaulted_loans = normalized.defaulted_loans || normalized.defaultedLoans || 0;
  }

  return normalized;
}

/**
 * Normalize GP economics data
 * @param data The GP economics data to normalize
 * @returns Normalized GP economics data
 */
function normalizeGPEconomicsData(data: any): any {
  if (!data) return {};

  const normalized = { ...data };

  // Ensure years array exists
  if (!normalized.years || !Array.isArray(normalized.years) || normalized.years.length === 0) {
    // Try to extract years from other arrays
    const metricArrays = Object.entries(normalized)
      .filter(([key, value]) => key !== 'years' && Array.isArray(value))
      .map(([_, value]) => value as any[]);

    if (metricArrays.length > 0) {
      // Use the length of the first array to create years
      const yearCount = metricArrays[0].length;
      normalized.years = Array.from({ length: yearCount }, (_, i) => i);
    } else {
      // Default years array
      normalized.years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    }
  }

  // Ensure all required metrics exist with proper length
  const requiredMetrics = [
    'management_fees', 'managementFees',
    'carried_interest', 'carriedInterest',
    'gp_commitment_returns', 'gpCommitmentReturns',
    'total_gp_economics', 'totalGpEconomics'
  ];

  requiredMetrics.forEach(metric => {
    if (!normalized[metric] || !Array.isArray(normalized[metric])) {
      normalized[metric] = new Array(normalized.years.length).fill(0);
    } else if (normalized[metric].length < normalized.years.length) {
      // Pad the array if it's shorter than years
      normalized[metric] = [
        ...normalized[metric],
        ...new Array(normalized.years.length - normalized[metric].length).fill(0)
      ];
    }
  });

  // Ensure revenue_sources exists
  if (!normalized.revenue_sources && !normalized.revenueSources) {
    normalized.revenue_sources = {
      management_fees: 0,
      carried_interest: 0,
      gp_commitment_returns: 0
    };
  }

  return normalized;
}

/**
 * Create empty chart data with optional message
 */
export const createEmptyChartData = (message: string = 'No Data'): ChartData => ({
  labels: [],
  datasets: [
    {
      label: message,
      data: [],
      backgroundColor: 'rgba(75,192,192,0.4)',
      borderColor: 'rgba(75,192,192,1)',
      borderWidth: 1
    }
  ]
});