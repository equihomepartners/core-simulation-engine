/**
 * Portfolio adapter for transforming portfolio API responses
 */
import { PortfolioModel, PortfolioChartData, PortfolioSummary } from '../models/portfolio';
import { ZoneAllocation, Nullable } from '../models/common';
import { safeExtract, normalize } from '../core/utils';
import { wrapTransformError, logTransformWarning } from '../core/errorHandling';

export namespace PortfolioAdapter {
  /**
   * Transforms portfolio API response to standardized model
   * Handles multiple possible API response formats
   * @param apiResponse Raw API response
   * @returns Standardized portfolio model
   */
  export const transform = wrapTransformError((apiResponse: any): PortfolioModel => {
    // Find source data - handle multiple possible API structures
    const portfolioData = safeExtract(apiResponse, ['portfolio'], null) || 
                         safeExtract(apiResponse, ['data'], null) || 
                         apiResponse;
    
    if (!portfolioData) {
      logTransformWarning('No portfolio data found in API response', apiResponse);
      return createEmptyPortfolioModel();
    }
    
    // Extract zone allocation from different possible formats
    const zoneAllocation = extractZoneAllocation(portfolioData);
    
    // Extract portfolio summary metrics
    const summary = extractPortfolioSummary(portfolioData, zoneAllocation);
    
    // Create chart data
    const chart = createChartData(zoneAllocation);
    
    // Extract zone performance data if available
    const zonePerformance = extractZonePerformance(portfolioData);
    
    return {
      summary,
      chart,
      zonePerformance
    };
  }, 'Portfolio transformation error');
  
  /**
   * Extract zone allocation from various API response formats
   */
  function extractZoneAllocation(data: any): ZoneAllocation {
    // Format 1: Direct zone allocation object
    if (data.zone_allocation || data.zoneAllocation) {
      const zoneData = data.zone_allocation || data.zoneAllocation;
      return {
        green: normalize(zoneData.green, 0),
        orange: normalize(zoneData.orange, 0),
        red: normalize(zoneData.red, 0)
      };
    }
    
    // Format 2: Zones array/object with values
    if (data.zones) {
      // Handle object format
      if (typeof data.zones === 'object' && !Array.isArray(data.zones)) {
        return {
          green: normalize(data.zones.green, 0),
          orange: normalize(data.zones.orange, 0),
          red: normalize(data.zones.red, 0)
        };
      }
      
      // Handle array format with labels/values
      if (Array.isArray(data.zones)) {
        const greenZone = data.zones.find((z: any) => 
          z.name?.toLowerCase() === 'green' || 
          z.label?.toLowerCase() === 'green'
        );
        const orangeZone = data.zones.find((z: any) => 
          z.name?.toLowerCase() === 'orange' || 
          z.label?.toLowerCase() === 'orange'
        );
        const redZone = data.zones.find((z: any) => 
          z.name?.toLowerCase() === 'red' || 
          z.label?.toLowerCase() === 'red'
        );
        
        return {
          green: normalize(greenZone?.value, 0),
          orange: normalize(orangeZone?.value, 0),
          red: normalize(redZone?.value, 0)
        };
      }
    }
    
    // Format 3: Portfolio composition with labels, values, and colors (pie chart format)
    if (Array.isArray(data.labels) && Array.isArray(data.values)) {
      const zoneAllocation: ZoneAllocation = { green: 0, orange: 0, red: 0 };
      
      data.labels.forEach((label: string, index: number) => {
        const lowerLabel = label.toLowerCase();
        const value = normalize(data.values[index], 0);
        
        if (lowerLabel.includes('green')) {
          zoneAllocation.green = value;
        } else if (lowerLabel.includes('orange')) {
          zoneAllocation.orange = value;
        } else if (lowerLabel.includes('red')) {
          zoneAllocation.red = value;
        }
      });
      
      return zoneAllocation;
    }
    
    // Default if no matching format is found
    logTransformWarning('Could not extract zone allocation, using default values', data);
    return { green: 0.33, orange: 0.33, red: 0.34 };
  }
  
  /**
   * Extract portfolio summary metrics
   */
  function extractPortfolioSummary(data: any, zoneAllocation: ZoneAllocation): PortfolioSummary {
    let totalActiveLoans: Nullable<number> = null;
    let totalValue: Nullable<number> = null;
    let avgLoanSize: Nullable<number> = null;
    let defaultRate: Nullable<number> = null;
    
    // Try to extract from portfolio metrics
    if (data.metrics) {
      totalActiveLoans = normalize(data.metrics.active_loans || data.metrics.activeLoans, null);
      totalValue = normalize(data.metrics.total_value || data.metrics.totalValue, null);
      avgLoanSize = normalize(data.metrics.avg_loan_size || data.metrics.avgLoanSize, null);
      defaultRate = normalize(data.metrics.default_rate || data.metrics.defaultRate, null);
    } else {
      // Try to extract from direct properties
      totalActiveLoans = normalize(
        data.active_loans || 
        data.activeLoans || 
        data.total_loans || 
        data.totalLoans, 
        null
      );
      
      totalValue = normalize(
        data.total_value || 
        data.totalValue || 
        data.loan_value || 
        data.loanValue, 
        null
      );
      
      avgLoanSize = normalize(
        data.avg_loan_size || 
        data.avgLoanSize || 
        data.average_loan_size || 
        data.averageLoanSize, 
        null
      );
      
      defaultRate = normalize(
        data.default_rate || 
        data.defaultRate || 
        data.defaulted_rate || 
        data.defaultedRate, 
        null
      );
    }
    
    return {
      zoneAllocation,
      totalActiveLoans,
      totalValue,
      avgLoanSize,
      defaultRate
    };
  }
  
  /**
   * Create chart data from zone allocation
   */
  function createChartData(zoneAllocation: ZoneAllocation): PortfolioChartData {
    return {
      labels: ['Green Zone', 'Orange Zone', 'Red Zone'],
      datasets: [{
        label: 'Zone Allocation',
        data: [zoneAllocation.green, zoneAllocation.orange, zoneAllocation.red]
      }],
      colors: ['#4caf50', '#ff9800', '#f44336'] // Green, Orange, Red
    };
  }
  
  /**
   * Extract zone performance metrics
   */
  function extractZonePerformance(data: any): any {
    // Try to extract from zone_performance or zonePerformance
    const zonePerformance = data.zone_performance || data.zonePerformance;
    
    if (!zonePerformance) {
      return undefined;
    }
    
    return {
      green: {
        irr: normalize(zonePerformance.green?.irr, null),
        multiple: normalize(zonePerformance.green?.multiple, null),
        defaultRate: normalize(zonePerformance.green?.default_rate || zonePerformance.green?.defaultRate, null)
      },
      orange: {
        irr: normalize(zonePerformance.orange?.irr, null),
        multiple: normalize(zonePerformance.orange?.multiple, null),
        defaultRate: normalize(zonePerformance.orange?.default_rate || zonePerformance.orange?.defaultRate, null)
      },
      red: {
        irr: normalize(zonePerformance.red?.irr, null),
        multiple: normalize(zonePerformance.red?.multiple, null),
        defaultRate: normalize(zonePerformance.red?.default_rate || zonePerformance.red?.defaultRate, null)
      }
    };
  }
  
  /**
   * Create an empty portfolio model
   */
  function createEmptyPortfolioModel(): PortfolioModel {
    const emptyZoneAllocation: ZoneAllocation = { green: 0, orange: 0, red: 0 };
    
    return {
      summary: {
        zoneAllocation: emptyZoneAllocation,
        totalActiveLoans: null,
        totalValue: null,
        avgLoanSize: null,
        defaultRate: null
      },
      chart: {
        labels: ['Green Zone', 'Orange Zone', 'Red Zone'],
        datasets: [{
          label: 'Zone Allocation',
          data: [0, 0, 0]
        }],
        colors: ['#4caf50', '#ff9800', '#f44336'] // Green, Orange, Red
      }
    };
  }
} 