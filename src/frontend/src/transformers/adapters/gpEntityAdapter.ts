/**
 * GP Entity adapter for transforming GP Entity API responses
 */
import { 
  GPEntityModel, 
  GPEntityMetrics, 
  RevenueSource, 
  Expense, 
  TeamAllocation, 
  GPEntityCashflowPoint, 
  GPEntityPieChartData, 
  GPEntityLineChartData 
} from '../models/gpEntity';
import { safeExtract, normalize, objectKeysToCamelCase } from '../core/utils';
import { wrapTransformError, logTransformWarning } from '../core/errorHandling';

export namespace GPEntityAdapter {
  /**
   * Transforms GP Entity API response to standardized model
   * @param apiResponse Raw API response
   * @returns Standardized GP Entity model
   */
  export const transform = wrapTransformError((apiResponse: any): GPEntityModel => {
    if (!apiResponse) {
      logTransformWarning('Empty API response for GP Entity data', apiResponse);
      return createEmptyGPEntityModel();
    }

    // Extract different parts of the response
    const metrics = transformMetrics(apiResponse);
    const revenueSources = transformRevenueSources(apiResponse);
    const expenses = transformExpenses(apiResponse);
    const teamAllocation = transformTeamAllocation(apiResponse);
    const cashflows = transformCashflows(apiResponse);

    // Create chart data
    const revenueSourcesChart = createPieChartData(revenueSources, 'source', 'amount');
    const expenseBreakdownChart = createPieChartData(expenses, 'category', 'amount');
    const teamAllocationChart = createPieChartData(teamAllocation, 'role', 'cost');
    const cashflowChart = createCashflowChart(cashflows);
    const yearlyRevenueChart = createYearlyRevenueChart(cashflows);
    const yearlyDistributionsChart = createYearlyDistributionsChart(apiResponse);

    return {
      metrics,
      revenueSources,
      expenses,
      teamAllocation,
      cashflows,
      charts: {
        revenueSourcesChart,
        expenseBreakdownChart,
        teamAllocationChart,
        cashflowChart,
        yearlyRevenueChart,
        yearlyDistributionsChart
      }
    };
  }, 'GP Entity transformation error');

  /**
   * Transform metrics data
   */
  function transformMetrics(apiResponse: any): GPEntityMetrics {
    // Try to extract from different possible locations in the API response
    const metricsData = 
      safeExtract(apiResponse, ['metrics'], null) || 
      safeExtract(apiResponse, ['gp_entity', 'metrics'], null) || 
      apiResponse;

    if (!metricsData) {
      return createEmptyMetrics();
    }

    // Convert snake_case to camelCase and normalize
    const camelCaseMetrics = objectKeysToCamelCase(metricsData);

    return {
      totalRevenue: normalize(camelCaseMetrics.totalRevenue, null),
      totalExpenses: normalize(camelCaseMetrics.totalExpenses, null),
      totalProfit: normalize(camelCaseMetrics.totalProfit, null),
      profitMargin: normalize(camelCaseMetrics.profitMargin, null),
      revenueCAGR: normalize(camelCaseMetrics.revenueCAGR, null),
      averageHeadcount: normalize(camelCaseMetrics.averageHeadcount, null),
      averageExpensePerEmployee: normalize(camelCaseMetrics.averageExpensePerEmployee, null)
    };
  }

  /**
   * Transform revenue sources data
   */
  function transformRevenueSources(apiResponse: any): RevenueSource[] {
    const sourceData = 
      safeExtract(apiResponse, ['revenue_sources'], null) || 
      safeExtract(apiResponse, ['revenueSources'], null) || 
      safeExtract(apiResponse, ['gp_entity', 'revenue_sources'], null) || 
      [];

    if (!Array.isArray(sourceData) || sourceData.length === 0) {
      return [];
    }

    return sourceData.map(source => ({
      source: source.source || source.name || 'Unknown',
      amount: normalize(source.amount || source.value, 0),
      percentage: normalize(source.percentage, 0),
      color: source.color
    }));
  }

  /**
   * Transform expenses data
   */
  function transformExpenses(apiResponse: any): Expense[] {
    const expenseData = 
      safeExtract(apiResponse, ['expenses'], null) || 
      safeExtract(apiResponse, ['expense_breakdown'], null) || 
      safeExtract(apiResponse, ['gp_entity', 'expenses'], null) || 
      [];

    if (!Array.isArray(expenseData) || expenseData.length === 0) {
      return [];
    }

    return expenseData.map(expense => ({
      category: expense.category || expense.name || 'Unknown',
      amount: normalize(expense.amount || expense.value, 0),
      percentage: normalize(expense.percentage, 0),
      color: expense.color
    }));
  }

  /**
   * Transform team allocation data
   */
  function transformTeamAllocation(apiResponse: any): TeamAllocation[] {
    const teamData = 
      safeExtract(apiResponse, ['team_allocation'], null) || 
      safeExtract(apiResponse, ['teamAllocation'], null) || 
      safeExtract(apiResponse, ['gp_entity', 'team_allocation'], null) || 
      [];

    if (!Array.isArray(teamData) || teamData.length === 0) {
      return [];
    }

    return teamData.map(role => ({
      role: role.role || role.name || 'Unknown',
      headcount: normalize(role.headcount, 0),
      cost: normalize(role.cost || role.value, 0),
      percentage: normalize(role.percentage, 0),
      color: role.color
    }));
  }

  /**
   * Transform cashflows data
   */
  function transformCashflows(apiResponse: any): GPEntityCashflowPoint[] {
    const cashflowData = 
      safeExtract(apiResponse, ['cashflows'], null) || 
      safeExtract(apiResponse, ['gp_entity', 'cashflows'], null);
    
    if (!cashflowData) {
      return [];
    }

    // Handle different cashflow data formats
    if (Array.isArray(cashflowData)) {
      // Format 1: Array of objects with year, revenue, expenses, profit
      return cashflowData.map(cf => ({
        year: normalize(cf.year, 0),
        revenue: normalize(cf.revenue, 0),
        expenses: normalize(cf.expenses, 0),
        profit: normalize(cf.profit !== undefined ? cf.profit : (cf.revenue - cf.expenses), 0),
        cumulative: !!cf.cumulative
      }));
    } else if (cashflowData.labels && cashflowData.datasets) {
      // Format 2: Chart.js style with labels and datasets
      const labels = cashflowData.labels || [];
      const revenueData = cashflowData.datasets.find((ds: any) => 
        ds.label?.toLowerCase().includes('revenue'))?.data || [];
      const expensesData = cashflowData.datasets.find((ds: any) => 
        ds.label?.toLowerCase().includes('expense'))?.data || [];
      const profitData = cashflowData.datasets.find((ds: any) => 
        ds.label?.toLowerCase().includes('profit'))?.data || [];
      
      return labels.map((year: any, index: number) => ({
        year: normalize(year, 0),
        revenue: normalize(revenueData[index], 0),
        expenses: normalize(expensesData[index], 0),
        profit: normalize(profitData[index], 0)
      }));
    }
    
    return [];
  }

  /**
   * Create pie chart data from a list of items
   */
  function createPieChartData(
    items: any[], 
    labelField: string, 
    valueField: string
  ): GPEntityPieChartData {
    if (!Array.isArray(items) || items.length === 0) {
      return { labels: [], values: [] };
    }

    const labels = items.map(item => item[labelField] || 'Unknown');
    const values = items.map(item => normalize(item[valueField], 0));
    const colors = items.map(item => item.color).filter(Boolean);

    return {
      labels,
      values,
      colors: colors.length === items.length ? colors : undefined
    };
  }

  /**
   * Create cashflow chart data
   */
  function createCashflowChart(cashflows: GPEntityCashflowPoint[]): GPEntityLineChartData {
    if (!Array.isArray(cashflows) || cashflows.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = cashflows.map(cf => cf.year);
    
    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: cashflows.map(cf => cf.revenue),
          color: '#4caf50' // Green
        },
        {
          label: 'Expenses',
          data: cashflows.map(cf => cf.expenses),
          color: '#f44336' // Red
        },
        {
          label: 'Profit',
          data: cashflows.map(cf => cf.profit),
          color: '#2196f3' // Blue
        }
      ]
    };
  }

  /**
   * Create yearly revenue chart data
   */
  function createYearlyRevenueChart(cashflows: GPEntityCashflowPoint[]): GPEntityLineChartData {
    if (!Array.isArray(cashflows) || cashflows.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = cashflows.map(cf => cf.year);
    
    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: cashflows.map(cf => cf.revenue),
          color: '#4caf50' // Green
        }
      ]
    };
  }

  /**
   * Create yearly distributions chart data
   */
  function createYearlyDistributionsChart(apiResponse: any): GPEntityLineChartData {
    const distributionsData = 
      safeExtract(apiResponse, ['distributions'], null) || 
      safeExtract(apiResponse, ['yearly_distributions'], null) || 
      safeExtract(apiResponse, ['gp_entity', 'distributions'], null);
    
    if (!distributionsData) {
      return { labels: [], datasets: [] };
    }

    // Handle different data formats
    if (Array.isArray(distributionsData)) {
      // Format 1: Array of objects with year and amount
      const labels = distributionsData.map(d => d.year);
      
      return {
        labels,
        datasets: [
          {
            label: 'Distributions',
            data: distributionsData.map(d => normalize(d.amount || d.value, 0)),
            color: '#9c27b0' // Purple
          }
        ]
      };
    } else if (distributionsData.labels && distributionsData.datasets) {
      // Format 2: Chart.js style with labels and datasets
      return {
        labels: distributionsData.labels || [],
        datasets: (distributionsData.datasets || []).map((ds: any) => ({
          label: ds.label || 'Distributions',
          data: ds.data || [],
          color: ds.color
        }))
      };
    }
    
    return { labels: [], datasets: [] };
  }

  /**
   * Create empty GP Entity metrics
   */
  function createEmptyMetrics(): GPEntityMetrics {
    return {
      totalRevenue: null,
      totalExpenses: null,
      totalProfit: null,
      profitMargin: null,
      revenueCAGR: null,
      averageHeadcount: null,
      averageExpensePerEmployee: null
    };
  }

  /**
   * Create empty GP Entity model
   */
  function createEmptyGPEntityModel(): GPEntityModel {
    return {
      metrics: createEmptyMetrics(),
      revenueSources: [],
      expenses: [],
      teamAllocation: [],
      cashflows: [],
      charts: {
        revenueSourcesChart: { labels: [], values: [] },
        expenseBreakdownChart: { labels: [], values: [] },
        teamAllocationChart: { labels: [], values: [] },
        cashflowChart: { labels: [], datasets: [] },
        yearlyRevenueChart: { labels: [], datasets: [] },
        yearlyDistributionsChart: { labels: [], datasets: [] }
      }
    };
  }
} 