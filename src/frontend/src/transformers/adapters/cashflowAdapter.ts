/**
 * Cashflow adapter for transforming cashflow API responses
 */
import { CashflowModel, CashflowPoint, CashflowChartData } from '../models/cashflow';
import { TransformOptions } from '../models/common';
import { safeExtract, ensureArray, normalize } from '../core/utils';
import { wrapTransformError, logTransformWarning, TransformationError } from '../core/errorHandling';

export namespace CashflowAdapter {
  /**
   * Transforms cashflow API response to standardized model
   * Handles multiple possible API response formats
   * @param apiResponse Raw API response
   * @param options Transformation options
   * @returns Standardized cashflow model
   */
  export const transform = wrapTransformError((
    apiResponse: any, 
    options: TransformOptions = {}
  ): CashflowModel => {
    // Set default options
    const { cumulative = false } = options;
    
    // Find source data - handle multiple possible API structures
    const cashflowData = safeExtract(apiResponse, ['cashflows'], null) ||
                        safeExtract(apiResponse, ['cash_flows'], null) ||
                        safeExtract(apiResponse, ['data'], null) ||
                        (apiResponse && apiResponse.cash_flows ? apiResponse.cash_flows : null) ||
                        apiResponse;
    
    if (!cashflowData) {
      logTransformWarning('No cashflow data found in API response', apiResponse);
      return createEmptyCashflowModel();
    }
    
    let points: CashflowPoint[] = [];
    
    // Handle format 1: Array-based (years, capital_calls, distributions)
    if (Array.isArray(cashflowData.years) && 
       (Array.isArray(cashflowData.capital_calls) || Array.isArray(cashflowData.distributions))) {
      points = transformArrayFormat(cashflowData, cumulative);
    }
    // Handle format 2: Datasets-based
    else if (Array.isArray(cashflowData.labels) && Array.isArray(cashflowData.datasets)) {
      points = transformDatasetsFormat(cashflowData, cumulative);
    }
    // Handle format 3: Array of objects
    else if (Array.isArray(cashflowData)) {
      points = transformObjectsArray(cashflowData, cumulative);
    }
    // Handle format 4: Yearly object
    else if (cashflowData.yearly && typeof cashflowData.yearly === 'object') {
      points = transformYearlyObject(cashflowData.yearly, cumulative);
    }
    // Handle format 5: Plain object whose keys are all numeric (e.g. {0:{...},1:{...}})
    else if (
      cashflowData &&
      typeof cashflowData === 'object' &&
      !Array.isArray(cashflowData)
    ) {
      // If it has a decent amount of numeric keys treat those as period buckets
      const numericKeys = Object.keys(cashflowData).filter(k => !isNaN(Number(k)));
      if (numericKeys.length > 0) {
        const numericObj: Record<number, any> = {};
        numericKeys.sort((a, b) => Number(a) - Number(b)).forEach(k => {
          numericObj[Number(k)] = (cashflowData as any)[k];
        });
        points = transformYearlyObject(numericObj, cumulative);
      } else {
        logTransformWarning('Unrecognized cashflow data format', cashflowData);
        return createEmptyCashflowModel();
      }
    }
    // Unknown format
    else {
      logTransformWarning('Unrecognized cashflow data format', cashflowData);
      return createEmptyCashflowModel();
    }
    
    // Calculate summary metrics
    const summary = calculateSummary(points);
    
    // Create chart data
    const chart = createChartData(points);
    
    return {
      points,
      chart,
      summary
    };
  }, 'Cashflow transformation error');
  
  /**
   * Transform array format (years, capital_calls, distributions)
   */
  function transformArrayFormat(data: any, cumulative: boolean): CashflowPoint[] {
    const points: CashflowPoint[] = [];
    const years = ensureArray(data.years || []);
    const capitalCalls = ensureArray(data.capital_calls || []);
    const distributions = ensureArray(data.distributions || []);
    const netCashflow = ensureArray(data.net_cashflow || []);
    
    let cumulativeCapitalCalls = 0;
    let cumulativeDistributions = 0;
    
    years.forEach((year: any, index: number) => {
      const yearValue = normalize(year, 0);
      const capitalCallsValue = normalize(capitalCalls[index], 0);
      const distributionsValue = normalize(distributions[index], 0);
      
      // Use provided net cashflow if available, otherwise calculate
      const netCashflowValue = netCashflow[index] !== undefined 
        ? normalize(netCashflow[index], 0)
        : distributionsValue - capitalCallsValue;
      
      if (cumulative) {
        cumulativeCapitalCalls += capitalCallsValue;
        cumulativeDistributions += distributionsValue;
        
        points.push({
          year: yearValue,
          capitalCalls: cumulativeCapitalCalls,
          distributions: cumulativeDistributions,
          netCashflow: cumulativeDistributions - cumulativeCapitalCalls,
          cumulative: true
        });
      } else {
        points.push({
          year: yearValue,
          capitalCalls: capitalCallsValue,
          distributions: distributionsValue,
          netCashflow: netCashflowValue,
          cumulative: false
        });
      }
    });
    
    return points;
  }
  
  /**
   * Transform datasets format (labels, datasets[])
   */
  function transformDatasetsFormat(data: any, cumulative: boolean): CashflowPoint[] {
    const points: CashflowPoint[] = [];
    const labels = ensureArray(data.labels || []);
    const datasets = ensureArray(data.datasets || []);
    
    // Find the relevant datasets
    const capitalCallsDataset = datasets.find(ds => 
      ds.label?.toLowerCase().includes('capital') || 
      ds.label?.toLowerCase().includes('call')
    );
    const distributionsDataset = datasets.find(ds => 
      ds.label?.toLowerCase().includes('distribution')
    );
    const netCashflowDataset = datasets.find(ds => 
      ds.label?.toLowerCase().includes('net') || 
      ds.label?.toLowerCase().includes('cashflow')
    );
    
    if (!capitalCallsDataset && !distributionsDataset) {
      throw new TransformationError('No capital calls or distributions datasets found', data);
    }
    
    let cumulativeCapitalCalls = 0;
    let cumulativeDistributions = 0;
    
    labels.forEach((label: any, index: number) => {
      const yearValue = typeof label === 'number' ? label : parseInt(label, 10);
      
      // Get raw values with fallbacks
      const capitalCallsValue = normalize(
        capitalCallsDataset?.data?.[index] !== undefined 
          ? capitalCallsDataset.data[index] 
          : 0, 
        0
      );
      
      const distributionsValue = normalize(
        distributionsDataset?.data?.[index] !== undefined 
          ? distributionsDataset.data[index] 
          : 0, 
        0
      );
      
      // Use provided net cashflow if available, otherwise calculate
      const providedNetCashflow = netCashflowDataset?.data?.[index] !== undefined 
        ? normalize(netCashflowDataset.data[index], 0)
        : null;
      
      const netCashflowValue = providedNetCashflow !== null
        ? providedNetCashflow
        : distributionsValue - capitalCallsValue;
      
      if (cumulative) {
        cumulativeCapitalCalls += capitalCallsValue;
        cumulativeDistributions += distributionsValue;
        
        points.push({
          year: yearValue,
          capitalCalls: cumulativeCapitalCalls,
          distributions: cumulativeDistributions,
          netCashflow: cumulativeDistributions - cumulativeCapitalCalls,
          cumulative: true
        });
      } else {
        points.push({
          year: yearValue,
          capitalCalls: capitalCallsValue,
          distributions: distributionsValue,
          netCashflow: netCashflowValue,
          cumulative: false
        });
      }
    });
    
    return points;
  }
  
  /**
   * Transform objects array ([{year, capital_calls, distributions}, ...])
   */
  function transformObjectsArray(data: any[], cumulative: boolean): CashflowPoint[] {
    // Sort by year
    const sortedData = [...data].sort((a, b) => {
      const yearA = normalize(a.year, 0);
      const yearB = normalize(b.year, 0);
      return yearA - yearB;
    });
    
    const points: CashflowPoint[] = [];
    let cumulativeCapitalCalls = 0;
    let cumulativeDistributions = 0;
    
    sortedData.forEach(item => {
      const yearValue = normalize(item.year, 0);
      
      // Look for different possible property names
      const capitalCallsValue = normalize(
        item.capital_calls !== undefined ? item.capital_calls :
        item.capitalCalls !== undefined ? item.capitalCalls :
        0,
        0
      );
      
      const distributionsValue = normalize(
        item.distributions !== undefined ? item.distributions :
        0,
        0
      );
      
      // Use provided net cashflow if available, otherwise calculate
      const providedNetCashflow = 
        item.net_cashflow !== undefined ? item.net_cashflow :
        item.netCashflow !== undefined ? item.netCashflow :
        null;
      
      const netCashflowValue = providedNetCashflow !== null
        ? normalize(providedNetCashflow, 0)
        : distributionsValue - capitalCallsValue;
      
      if (cumulative) {
        cumulativeCapitalCalls += capitalCallsValue;
        cumulativeDistributions += distributionsValue;
        
        points.push({
          year: yearValue,
          capitalCalls: cumulativeCapitalCalls,
          distributions: cumulativeDistributions,
          netCashflow: cumulativeDistributions - cumulativeCapitalCalls,
          cumulative: true
        });
      } else {
        points.push({
          year: yearValue,
          capitalCalls: capitalCallsValue,
          distributions: distributionsValue,
          netCashflow: netCashflowValue,
          cumulative: false
        });
      }
    });
    
    return points;
  }
  
  /**
   * Transform yearly object ({2020: {capital_calls, distributions}, ...})
   */
  function transformYearlyObject(data: any, cumulative: boolean): CashflowPoint[] {
    // Convert object to array and sort by year
    const years = Object.keys(data).map(Number).sort((a, b) => a - b);
    
    const points: CashflowPoint[] = [];
    let cumulativeCapitalCalls = 0;
    let cumulativeDistributions = 0;
    
    years.forEach(year => {
      const yearData = data[year];
      if (!yearData) return;
      
      const capitalCallsValue = normalize(yearData.capital_calls, 0);
      const distributionsValue = normalize(
        yearData.distributions !== undefined ? yearData.distributions :
        yearData.exit_proceeds !== undefined ? yearData.exit_proceeds :
        0,
        0
      );
      
      // Use provided net cashflow if available, otherwise calculate
      const netCashflowValue = yearData.net_cashflow !== undefined
        ? normalize(yearData.net_cashflow, 0)
        : distributionsValue - capitalCallsValue;
      
      if (cumulative) {
        cumulativeCapitalCalls += capitalCallsValue;
        cumulativeDistributions += distributionsValue;
        
        points.push({
          year,
          capitalCalls: cumulativeCapitalCalls,
          distributions: cumulativeDistributions,
          netCashflow: cumulativeDistributions - cumulativeCapitalCalls,
          cumulative: true
        });
      } else {
        points.push({
          year,
          capitalCalls: capitalCallsValue,
          distributions: distributionsValue,
          netCashflow: netCashflowValue,
          cumulative: false
        });
      }
    });
    
    return points;
  }
  
  /**
   * Calculate summary metrics from cashflow points
   */
  function calculateSummary(points: CashflowPoint[]) {
    if (points.length === 0) {
      return {
        totalCapitalCalls: 0,
        totalDistributions: 0,
        netCashflow: 0,
        yearRange: [0, 0] as [number, number]
      };
    }
    
    // For cumulative data, use the last point
    if (points[0]?.cumulative) {
      const lastPoint = points[points.length - 1];
      return {
        totalCapitalCalls: lastPoint.capitalCalls,
        totalDistributions: lastPoint.distributions,
        netCashflow: lastPoint.netCashflow,
        yearRange: [points[0].year, lastPoint.year] as [number, number]
      };
    }
    
    // For non-cumulative data, sum all points
    let totalCapitalCalls = 0;
    let totalDistributions = 0;
    
    points.forEach(point => {
      totalCapitalCalls += point.capitalCalls;
      totalDistributions += point.distributions;
    });
    
    return {
      totalCapitalCalls,
      totalDistributions,
      netCashflow: totalDistributions - totalCapitalCalls,
      yearRange: [points[0].year, points[points.length - 1].year] as [number, number]
    };
  }
  
  /**
   * Create chart data from cashflow points
   */
  function createChartData(points: CashflowPoint[]): CashflowChartData {
    const labels = points.map(point => point.year);
    
    return {
      labels,
      datasets: [
        {
          label: 'Capital Calls',
          data: points.map(point => point.capitalCalls),
          color: '#f44336' // Red
        },
        {
          label: 'Distributions',
          data: points.map(point => point.distributions),
          color: '#4caf50' // Green
        },
        {
          label: 'Net Cashflow',
          data: points.map(point => point.netCashflow),
          color: '#2196f3' // Blue
        }
      ]
    };
  }
  
  /**
   * Create an empty cashflow model
   */
  function createEmptyCashflowModel(): CashflowModel {
    return {
      points: [],
      chart: {
        labels: [],
        datasets: []
      },
      summary: {
        totalCapitalCalls: 0,
        totalDistributions: 0,
        netCashflow: 0,
        yearRange: [0, 0] as [number, number]
      }
    };
  }
} 