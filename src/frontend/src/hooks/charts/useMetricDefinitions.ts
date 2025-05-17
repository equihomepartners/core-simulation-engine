import { useMemo } from 'react';
import { MetricDefinition } from '../../utils/charts/dataTransformers';
import { formatNumber, formatLargeNumber } from '../../utils/charts/dataTransformers';

// Define all available metrics with their metadata
const allMetricDefinitions: MetricDefinition[] = [
  // Cashflow Metrics
  {
    id: 'net_cashflow',
    name: 'Net Cashflow',
    color: '#4e79a7',
    category: 'Cashflows',
    description: 'Net cash flow for the period',
    formatter: (value) => formatLargeNumber(value)
  },
  {
    id: 'distributions',
    name: 'Distributions',
    color: '#f28e2c',
    category: 'Cashflows',
    description: 'Cash distributions to investors',
    formatter: (value) => formatLargeNumber(value)
  },
  {
    id: 'capital_calls',
    name: 'Capital Calls',
    color: '#e15759',
    category: 'Cashflows',
    description: 'Capital called from investors',
    formatter: (value) => formatLargeNumber(value)
  },
  {
    id: 'management_fees',
    name: 'Management Fees',
    color: '#76b7b2',
    category: 'Cashflows',
    description: 'Management fees paid',
    formatter: (value) => formatLargeNumber(value)
  },
  
  // Portfolio Metrics
  {
    id: 'portfolio_value',
    name: 'Portfolio Value',
    color: '#59a14f',
    category: 'Portfolio',
    description: 'Total value of the portfolio',
    formatter: (value) => formatLargeNumber(value)
  },
  {
    id: 'nav',
    name: 'NAV',
    color: '#edc949',
    category: 'Portfolio',
    description: 'Net Asset Value',
    formatter: (value) => formatLargeNumber(value)
  },
  {
    id: 'loan_count',
    name: 'Loan Count',
    color: '#af7aa1',
    category: 'Portfolio',
    description: 'Number of active loans',
    formatter: (value) => formatNumber(value, 'number', 0)
  },
  {
    id: 'new_loans',
    name: 'New Loans',
    color: '#ff9da7',
    category: 'Portfolio',
    description: 'Number of new loans originated',
    formatter: (value) => formatNumber(value, 'number', 0)
  },
  {
    id: 'exited_loans',
    name: 'Exited Loans',
    color: '#9c755f',
    category: 'Portfolio',
    description: 'Number of loans that exited',
    formatter: (value) => formatNumber(value, 'number', 0)
  },
  
  // Return Metrics
  {
    id: 'irr',
    name: 'IRR',
    color: '#bab0ab',
    category: 'Returns',
    description: 'Internal Rate of Return',
    formatter: (value) => formatNumber(value, 'percent', 2)
  },
  {
    id: 'moic',
    name: 'MOIC',
    color: '#d37295',
    category: 'Returns',
    description: 'Multiple on Invested Capital',
    formatter: (value) => formatNumber(value, 'number', 2) + 'x'
  },
  {
    id: 'tvpi',
    name: 'TVPI',
    color: '#a5a5a5',
    category: 'Returns',
    description: 'Total Value to Paid-In Capital',
    formatter: (value) => formatNumber(value, 'number', 2) + 'x'
  },
  {
    id: 'dpi',
    name: 'DPI',
    color: '#ffa15a',
    category: 'Returns',
    description: 'Distributions to Paid-In Capital',
    formatter: (value) => formatNumber(value, 'number', 2) + 'x'
  },
  {
    id: 'rvpi',
    name: 'RVPI',
    color: '#19d3f3',
    category: 'Returns',
    description: 'Residual Value to Paid-In Capital',
    formatter: (value) => formatNumber(value, 'number', 2) + 'x'
  },
  
  // GP Economics Metrics
  {
    id: 'gp_carried_interest',
    name: 'GP Carried Interest',
    color: '#637939',
    category: 'GP Economics',
    description: 'Carried interest earned by the GP',
    formatter: (value) => formatLargeNumber(value)
  },
  {
    id: 'gp_management_fees',
    name: 'GP Management Fees',
    color: '#8c564b',
    category: 'GP Economics',
    description: 'Management fees earned by the GP',
    formatter: (value) => formatLargeNumber(value)
  },
  {
    id: 'gp_total_revenue',
    name: 'GP Total Revenue',
    color: '#e377c2',
    category: 'GP Economics',
    description: 'Total revenue earned by the GP',
    formatter: (value) => formatLargeNumber(value)
  },
  {
    id: 'gp_expenses',
    name: 'GP Expenses',
    color: '#7f7f7f',
    category: 'GP Economics',
    description: 'Total expenses incurred by the GP',
    formatter: (value) => formatLargeNumber(value)
  },
  {
    id: 'gp_net_income',
    name: 'GP Net Income',
    color: '#bcbd22',
    category: 'GP Economics',
    description: 'Net income earned by the GP',
    formatter: (value) => formatLargeNumber(value)
  },
  
  // Risk Metrics
  {
    id: 'volatility',
    name: 'Volatility',
    color: '#17becf',
    category: 'Risk',
    description: 'Volatility of returns',
    formatter: (value) => formatNumber(value, 'percent', 2)
  },
  {
    id: 'sharpe_ratio',
    name: 'Sharpe Ratio',
    color: '#aec7e8',
    category: 'Risk',
    description: 'Sharpe ratio (risk-adjusted return)',
    formatter: (value) => formatNumber(value, 'number', 2)
  },
  {
    id: 'max_drawdown',
    name: 'Max Drawdown',
    color: '#ffbb78',
    category: 'Risk',
    description: 'Maximum drawdown',
    formatter: (value) => formatNumber(value, 'percent', 2)
  }
];

export interface UseMetricDefinitionsProps {
  category?: string;
  metricIds?: string[];
}

export const useMetricDefinitions = ({
  category,
  metricIds
}: UseMetricDefinitionsProps = {}): MetricDefinition[] => {
  return useMemo(() => {
    let filteredMetrics = [...allMetricDefinitions];
    
    // Filter by category if provided
    if (category) {
      filteredMetrics = filteredMetrics.filter(metric => metric.category === category);
    }
    
    // Filter by specific metric IDs if provided
    if (metricIds && metricIds.length > 0) {
      filteredMetrics = filteredMetrics.filter(metric => metricIds.includes(metric.id));
    }
    
    return filteredMetrics;
  }, [category, metricIds]);
};

export default useMetricDefinitions;
