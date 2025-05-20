import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Label,
  LabelList,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/formatters';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// Define color constants
const COLORS = {
  midnight: '#0B1C3F',
  steel: '#314C7E',
  aqua: '#00A0B0',
  positive: '#4CAF50',
  negative: '#F44336',
  neutral: '#9E9E9E',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  background: '#FFFFFF',
  gridLines: '#E5E7EB'
};

interface WaterfallDataPoint {
  name: string;
  value: number;
  color: string;
  isTotal?: boolean;
  isStacked?: boolean;
}

interface HeatStripDataPoint {
  quarter: string;
  netCashFlow: number;
  loansExited: number;
  newLoans: number;
}

interface CashflowWaterfallEProps {
  simulation: any;
  results: any;
  isLoading: boolean;
}

// Custom tooltip for waterfall chart
const CustomWaterfallTooltip = ({ active, payload, label, waterfallData }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    // Special handling for Exit Proceeds to show breakdown
    if (data.name === 'Exit Proceeds') {
      // Find the component in the waterfallData array
      const exitProceedsData = waterfallData.find((item: any) => item.name === 'Exit Proceeds');
      const breakdown = exitProceedsData?.breakdown;

      if (breakdown) {
        return (
          <div className="bg-white p-4 border border-gray-200 rounded shadow-lg text-xs">
            <p className="font-semibold text-sm mb-1 text-[#0B1C3F]">Exit Proceeds</p>
            <p className="font-medium text-sm">{formatCurrency(data.value)}</p>
            <div className="mt-2 border-t pt-2 space-y-1.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-2.5 h-2.5 rounded-sm mr-1.5 bg-gradient-to-r from-[#0B1C3F] to-[#314C7E]"></div>
                  <span>Principal</span>
                </div>
                <span>{formatCurrency(breakdown.principal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-2.5 h-2.5 rounded-sm mr-1.5 bg-gradient-to-r from-[#314C7E] to-[#4A6CA0]"></div>
                  <span>Interest</span>
                </div>
                <span>{formatCurrency(breakdown.interest)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-2.5 h-2.5 rounded-sm mr-1.5 bg-gradient-to-r from-[#4A6CA0] to-[#00A0B0]"></div>
                  <span>Appreciation</span>
                </div>
                <span>{formatCurrency(breakdown.appreciation)}</span>
              </div>
            </div>
          </div>
        );
      }
    }

    // For Capital Calls (negative value)
    if (data.name === 'Capital Calls') {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-lg text-xs">
          <p className="font-semibold text-sm mb-1 text-[#0B1C3F]">Capital Calls</p>
          <p className="font-medium text-sm text-red-600">{formatCurrency(data.value)}</p>
          <p className="mt-1 text-gray-600">Funds invested by LPs</p>
        </div>
      );
    }

    // For Management Fees (negative value)
    if (data.name === 'Management Fees') {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-lg text-xs">
          <p className="font-semibold text-sm mb-1 text-[#0B1C3F]">Management Fees</p>
          <p className="font-medium text-sm text-red-600">{formatCurrency(data.value)}</p>
          <p className="mt-1 text-gray-600">Fees paid to the GP</p>
        </div>
      );
    }

    // For GP Carry (negative value)
    if (data.name === 'GP Carry') {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-lg text-xs">
          <p className="font-semibold text-sm mb-1 text-[#0B1C3F]">GP Carry</p>
          <p className="font-medium text-sm text-red-600">{formatCurrency(data.value)}</p>
          <p className="mt-1 text-gray-600">GP's share of profits</p>
        </div>
      );
    }

    // For GP Net Distribution (positive value)
    if (data.name === 'GP Net Distribution') {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-lg text-xs">
          <p className="font-semibold text-sm mb-1 text-[#0B1C3F]">GP Net Distribution</p>
          <p className="font-medium text-sm text-green-600">{formatCurrency(data.value)}</p>
          <p className="mt-1 text-gray-600">Total returns to the GP</p>
        </div>
      );
    }

    // For LP Net Distribution (positive value)
    if (data.name === 'LP Net Distribution') {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-lg text-xs">
          <p className="font-semibold text-sm mb-1 text-[#0B1C3F]">LP Net Distribution</p>
          <p className="font-medium text-sm text-green-600">{formatCurrency(data.value)}</p>
          <p className="mt-1 text-gray-600">Total returns to LPs</p>
        </div>
      );
    }

    // For Origination Fees (positive value)
    if (data.name === 'Origination Fees') {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-lg text-xs">
          <p className="font-semibold text-sm mb-1 text-[#0B1C3F]">Origination Fees</p>
          <p className="font-medium text-sm text-green-600">{formatCurrency(data.value)}</p>
          <p className="mt-1 text-gray-600">Fees collected on loan origination</p>
        </div>
      );
    }

    // For Total Cash Flows
    if (data.name === 'Total Cash Flows') {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-lg text-xs">
          <p className="font-semibold text-sm mb-1 text-[#0B1C3F]">Total Cash Flows</p>
          <p className="font-medium text-sm">{formatCurrency(data.value)}</p>
          <p className="mt-1 text-gray-600">Net of all cash flows</p>
        </div>
      );
    }

    // For any other bars (fallback)
    return (
      <div className="bg-white p-4 border border-gray-200 rounded shadow-lg text-xs">
        <p className="font-semibold text-sm mb-1 text-[#0B1C3F]">{data.name}</p>
        <p className="font-medium text-sm">{formatCurrency(data.value)}</p>
        {data.percentage && <p className="mt-1 text-gray-600">{formatPercentage(data.percentage)} of total</p>}
      </div>
    );
  }
  return null;
};

// Custom tooltip for heat strip
const CustomHeatStripTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border border-gray-200 rounded shadow-lg text-xs">
        <p className="font-semibold text-sm mb-1 text-[#0B1C3F]">{data.quarter}</p>
        <div className="space-y-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">LP Net Distribution:</span>
            <span className="font-medium text-[#0B1C3F]">{formatCurrency(data.netCashFlow)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Loans Exited:</span>
            <span className="font-medium text-[#0B1C3F]">{data.loansExited}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">New Loans:</span>
            <span className="font-medium text-[#0B1C3F]">{data.newLoans}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function CashflowWaterfallE({ simulation, results, isLoading }: CashflowWaterfallEProps) {
  // Time granularity state for heat strip
  const [timeGranularity, setTimeGranularity] = useState<'yearly' | 'quarterly' | 'monthly'>('yearly');

  // Selected year for waterfall chart (null means cumulative/all years)
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  // Get available years from cash flows
  const availableYears = useMemo(() => {
    if (!results?.cash_flows) return [];

    return Object.keys(results.cash_flows)
      .filter(key => !isNaN(Number(key)))
      .map(Number)
      .sort((a, b) => a - b);
  }, [results]);

  // Define the consistent order of waterfall components
  // Removed Interest Income and Appreciation as they're not actual cash flows
  // They're accounting entries that accrue until exit, when they're realized as part of Exit Proceeds
  const waterfallComponentOrder = [
    'Capital Calls',
    'Origination Fees',
    'Exit Proceeds',
    'Management Fees',
    'GP Carry',
    'GP Net Distribution',
    'LP Net Distribution',
    'Total Cash Flows'
  ];

  // Process waterfall data
  const waterfallData = useMemo(() => {
    if (!results) return [];

    // Enhanced debug: Log the structure of the results object with more details
    console.log("Results structure:", {
      hasCashFlows: !!results.cash_flows,
      cashFlowsKeys: results.cash_flows ? Object.keys(results.cash_flows) : [],
      hasWaterfall: !!results.waterfall,
      waterfallKeys: results.waterfall ? Object.keys(results.waterfall) : [],
      hasCashFlowComponents: !!results.cash_flow_components,
      cashFlowComponentsKeys: results.cash_flow_components ? Object.keys(results.cash_flow_components) : [],
      hasExitProceedsBreakdown: results.waterfall?.exit_proceeds_breakdown ? true : false,
      exitProceedsBreakdown: results.waterfall?.exit_proceeds_breakdown,
      hasExitProceedsBreakdownInComponents: results.cash_flow_components?.exit_proceeds_breakdown ? true : false,
      exitProceedsBreakdownInComponents: results.cash_flow_components?.exit_proceeds_breakdown
    });

    // Check if any year has exit_proceeds_breakdown
    if (results.cash_flows) {
      const yearsWithBreakdown = Object.entries(results.cash_flows)
        .filter(([_, yearData]: [string, any]) =>
          yearData && (yearData.exit_proceeds_breakdown || yearData.exitProceedsBreakdown))
        .map(([year]) => year);

      console.log("Years with exit proceeds breakdown:", yearsWithBreakdown);

      if (yearsWithBreakdown.length > 0) {
        const sampleYear = yearsWithBreakdown[0];
        const sampleData = results.cash_flows[sampleYear];
        console.log(`Sample exit proceeds breakdown (Year ${sampleYear}):`,
          sampleData.exit_proceeds_breakdown || sampleData.exitProceedsBreakdown);
      } else {
        console.log("No years found with exit proceeds breakdown");
      }
    }

    // Check if exit proceeds breakdown is in cash_flow_components
    if (results.cash_flow_components?.exit_proceeds_breakdown) {
      console.log("Exit proceeds breakdown found in cash_flow_components:",
        results.cash_flow_components.exit_proceeds_breakdown);
    }

    try {
      // Only use cash_flows data if available
      if (results.cash_flows) {
        console.log("Cash flows data found:", results.cash_flows);

        // Debug: Check if exit_proceeds_breakdown exists in the data
        const hasBreakdown = Object.values(results.cash_flows)
          .some((yearData: any) => yearData && yearData.exit_proceeds_breakdown);
        console.log("Has exit proceeds breakdown in cash_flows:", hasBreakdown);

        if (hasBreakdown) {
          // Show an example of the breakdown
          const sampleYear = Object.values(results.cash_flows)
            .find((yearData: any) => yearData && yearData.exit_proceeds_breakdown);
          console.log("Sample exit proceeds breakdown from cash_flows:", sampleYear?.exit_proceeds_breakdown);
        }

        // Check if we have the breakdown in the waterfall data
        if (results.waterfall) {
          console.log("Waterfall data:", results.waterfall);
          if (results.waterfall.exit_proceeds_breakdown) {
            console.log("Exit proceeds breakdown from waterfall:", results.waterfall.exit_proceeds_breakdown);
          } else {
            console.log("No exit proceeds breakdown in waterfall data");
          }
        } else {
          console.log("No waterfall data found in results");
        }

        // Create a map to store all possible components with default values of 0
        const componentsMap: Record<string, { value: number, color: string, isTotal?: boolean, isStacked?: boolean, breakdown?: any }> = {
          'Capital Calls': { value: 0, color: COLORS.negative },
          'Origination Fees': { value: 0, color: COLORS.positive },
          'Exit Proceeds': {
            value: 0,
            color: COLORS.positive,
            breakdown: {
              principal: 0,
              interest: 0,
              appreciation: 0
            }
          },
          'Management Fees': { value: 0, color: COLORS.negative },
          'GP Carry': { value: 0, color: COLORS.negative },
          'GP Net Distribution': { value: 0, color: COLORS.positive },
          'LP Net Distribution': { value: 0, color: COLORS.positive },
          'Total Cash Flows': { value: 0, color: COLORS.positive, isTotal: true }
        };

        // If selectedYear is null, aggregate data across all years
        // Otherwise, use data for the selected year
        if (selectedYear !== null) {
          // Use data for the selected year
          const yearData = results.cash_flows[selectedYear] || {};

          // Debug: Log the structure of the year data
          console.log(`Year ${selectedYear} data:`, {
            hasExitProceedsBreakdown: !!(yearData.exit_proceeds_breakdown || yearData.exitProceedsBreakdown),
            exitProceedsBreakdown: yearData.exit_proceeds_breakdown || yearData.exitProceedsBreakdown,
            exitProceeds: yearData.exit_proceeds || yearData.exitProceeds || 0,
            yearDataKeys: Object.keys(yearData)
          });

          // Extract waterfall components for the selected year
          componentsMap['Capital Calls'].value = -(yearData.capital_calls || yearData.capitalCalls || 0);
          componentsMap['Origination Fees'].value = (yearData.origination_fees || yearData.originationFees || 0);

          // Get exit proceeds breakdown if available
          if (yearData.exit_proceeds_breakdown || yearData.exitProceedsBreakdown) {
            const breakdown = yearData.exit_proceeds_breakdown || yearData.exitProceedsBreakdown;
            componentsMap['Exit Proceeds'].breakdown.principal = breakdown.principal || 0;
            componentsMap['Exit Proceeds'].breakdown.interest = breakdown.interest || 0;
            componentsMap['Exit Proceeds'].breakdown.appreciation = breakdown.appreciation || 0;
            componentsMap['Exit Proceeds'].value =
              (breakdown.principal || 0) +
              (breakdown.interest || 0) +
              (breakdown.appreciation || 0);

            console.log(`Year ${selectedYear} exit proceeds breakdown:`, {
              principal: breakdown.principal || 0,
              interest: breakdown.interest || 0,
              appreciation: breakdown.appreciation || 0,
              total: (breakdown.principal || 0) + (breakdown.interest || 0) + (breakdown.appreciation || 0)
            });
          } else {
            // If breakdown not available, just use the total
            componentsMap['Exit Proceeds'].value = (yearData.exit_proceeds || yearData.exitProceeds || 0);
            console.log(`Year ${selectedYear} has no exit proceeds breakdown. Total exit proceeds:`,
              (yearData.exit_proceeds || yearData.exitProceeds || 0));
          }

          // Remove the old components that are not used anymore
          delete componentsMap['Interest Income'];
          delete componentsMap['Appreciation'];

          console.log(`Year ${selectedYear} exit proceeds breakdown:`, componentsMap['Exit Proceeds'].breakdown);

          componentsMap['Management Fees'].value = -(yearData.management_fees || yearData.managementFees || 0);

          // For individual years, estimate GP Carry as a percentage of positive returns
          // Use the total exit proceeds value
          const totalExitProceeds = componentsMap['Exit Proceeds'].value;

          // GP Carry is typically 20% of profits above a hurdle rate
          // For simplicity, we'll estimate it as 20% of positive returns
          componentsMap['GP Carry'].value = totalExitProceeds > 0 ? -totalExitProceeds * 0.2 : 0;

          // Calculate GP Net Distribution (management fees + carry)
          componentsMap['GP Net Distribution'].value = -componentsMap['Management Fees'].value +
                                                     -componentsMap['GP Carry'].value;

          // Use the actual lp_net_cash_flow for this year
          componentsMap['LP Net Distribution'].value = yearData.lp_net_cash_flow || yearData.lpNetCashFlow || 0;

          // AUDIT: Log the LP Net Distribution value for comparison with heat map
          console.log(`AUDIT - Waterfall Year ${selectedYear + 25} LP Net Distribution:`, {
            waterfallValue: componentsMap['LP Net Distribution'].value,
            rawLpNetCashFlow: yearData.lp_net_cash_flow || yearData.lpNetCashFlow,
            yearDataKeys: Object.keys(yearData)
          });

          // Ensure LP Net Distribution is always shown, even if it's 0
          if (componentsMap['LP Net Distribution'].value === 0) {
            console.log(`Year ${selectedYear} has no LP Net Distribution, setting to small value to ensure visibility`);
            // Set to a very small value to ensure it's visible in the chart
            componentsMap['LP Net Distribution'].value = 0.000001;
          }

          // Calculate total cash flows
          componentsMap['Total Cash Flows'].value =
            componentsMap['Exit Proceeds'].value +
            componentsMap['Origination Fees'].value +
            componentsMap['Capital Calls'].value +
            componentsMap['Management Fees'].value;
        } else {
          // Aggregate data across all years
          Object.values(results.cash_flows)
            .filter((data): data is Record<string, any> => typeof data === 'object' && data !== null)
            .forEach(yearData => {
              componentsMap['Capital Calls'].value += -(yearData.capital_calls || yearData.capitalCalls || 0);
              componentsMap['Origination Fees'].value += (yearData.origination_fees || yearData.originationFees || 0);

              // Get exit proceeds breakdown if available
              if (yearData.exit_proceeds_breakdown || yearData.exitProceedsBreakdown) {
                const breakdown = yearData.exit_proceeds_breakdown || yearData.exitProceedsBreakdown;
                componentsMap['Exit Proceeds'].breakdown.principal += breakdown.principal || 0;
                componentsMap['Exit Proceeds'].breakdown.interest += breakdown.interest || 0;
                componentsMap['Exit Proceeds'].breakdown.appreciation += breakdown.appreciation || 0;
                componentsMap['Exit Proceeds'].value +=
                  (breakdown.principal || 0) +
                  (breakdown.interest || 0) +
                  (breakdown.appreciation || 0);
              } else {
                // If breakdown not available, just use the total
                componentsMap['Exit Proceeds'].value += (yearData.exit_proceeds || yearData.exitProceeds || 0);
              }

              // Remove the old components that are not used anymore
              delete componentsMap['Interest Income'];
              delete componentsMap['Appreciation'];

              componentsMap['Management Fees'].value += -(yearData.management_fees || yearData.managementFees || 0);
            });

          // Get GP Carry from metrics if available
          if (results.metrics) {
            componentsMap['GP Carry'].value = -(results.metrics.carried_interest ||
                                             results.metrics.carriedInterest || 0);
          } else {
            // Estimate GP Carry as a percentage of positive returns
            // Use the total exit proceeds
            const totalExitProceeds = componentsMap['Exit Proceeds'].value;

            // GP Carry is typically 20% of profits above a hurdle rate
            componentsMap['GP Carry'].value = totalExitProceeds > 0 ? -totalExitProceeds * 0.2 : 0;
          }

          // Calculate GP Net Distribution (management fees + carry)
          componentsMap['GP Net Distribution'].value = -componentsMap['Management Fees'].value +
                                                     -componentsMap['GP Carry'].value;

          // If we have the breakdown in the waterfall data for the cumulative view
          if (results.waterfall && results.waterfall.exit_proceeds_breakdown && selectedYear === null) {
            const breakdown = results.waterfall.exit_proceeds_breakdown;
            componentsMap['Exit Proceeds'].breakdown.principal = breakdown.principal || 0;
            componentsMap['Exit Proceeds'].breakdown.interest = breakdown.interest || 0;
            componentsMap['Exit Proceeds'].breakdown.appreciation = breakdown.appreciation || 0;
            componentsMap['Exit Proceeds'].value =
              (breakdown.principal || 0) +
              (breakdown.interest || 0) +
              (breakdown.appreciation || 0);

            // Remove the old components that are not used anymore
            delete componentsMap['Interest Income'];
            delete componentsMap['Appreciation'];

            console.log("Using waterfall exit proceeds breakdown:", breakdown);
          }
          // Check if exit proceeds breakdown is in cash_flow_components
          else if (results.cash_flow_components?.exit_proceeds_breakdown && selectedYear === null) {
            const breakdown = results.cash_flow_components.exit_proceeds_breakdown;
            componentsMap['Exit Proceeds'].breakdown.principal = breakdown.principal || 0;
            componentsMap['Exit Proceeds'].breakdown.interest = breakdown.interest || 0;
            componentsMap['Exit Proceeds'].breakdown.appreciation = breakdown.appreciation || 0;
            componentsMap['Exit Proceeds'].value =
              (breakdown.principal || 0) +
              (breakdown.interest || 0) +
              (breakdown.appreciation || 0);

            // Remove the old components that are not used anymore
            delete componentsMap['Interest Income'];
            delete componentsMap['Appreciation'];

            console.log("Using cash_flow_components exit proceeds breakdown:", breakdown);
          }

          // Get LP Net Distribution from metrics if available
          // For cumulative view, use the total_lp_distribution from metrics
          if (results.metrics && results.metrics.total_lp_distribution !== undefined) {
            componentsMap['LP Net Distribution'].value = results.metrics.total_lp_distribution;
          } else if (results.metrics && results.metrics.totalLpDistribution !== undefined) {
            componentsMap['LP Net Distribution'].value = results.metrics.totalLpDistribution;
          } else {
            // If not available in metrics, calculate from yearly data
            let totalLpDistribution = 0;

            // Sum up all yearly lp_net_cash_flow values (excluding the initial capital call)
            Object.entries(results.cash_flows)
              .filter(([key]) => !isNaN(Number(key)) && Number(key) > 0) // Skip year 0 (initial capital)
              .forEach(([_, yearData]: [string, any]) => {
                totalLpDistribution += (yearData.lp_net_cash_flow || yearData.lpNetCashFlow || 0);
              });

            componentsMap['LP Net Distribution'].value = totalLpDistribution;

            // Ensure LP Net Distribution is always shown, even if it's 0
            if (componentsMap['LP Net Distribution'].value === 0) {
              console.log("Cumulative LP Net Distribution is 0, setting to small value to ensure visibility");
              // Set to a very small value to ensure it's visible in the chart
              componentsMap['LP Net Distribution'].value = 0.000001;
            }
          }

          // Calculate total cash flows
          componentsMap['Total Cash Flows'].value =
            componentsMap['Exit Proceeds'].value +
            componentsMap['Origination Fees'].value +
            componentsMap['Capital Calls'].value +
            componentsMap['Management Fees'].value;
        }

        // Convert the map to an array with consistent ordering
        // Include all components, even those with zero values
        const components = waterfallComponentOrder
          .filter(name => componentsMap[name])
          .map(name => ({
            name,
            value: componentsMap[name].value,
            color: componentsMap[name].color,
            isTotal: componentsMap[name].isTotal,
            isStacked: componentsMap[name].isStacked,
            breakdown: componentsMap[name].breakdown
          }));

        return components;
      }

      // If no cash_flows data, return empty array
      return [];
    } catch (error) {
      console.error('Error processing waterfall data:', error);
      return [];
    }
  }, [results, selectedYear]);

  // Check available time granularities
  const availableGranularities = useMemo(() => {
    const available = {
      yearly: false,
      quarterly: false,
      monthly: false
    };

    if (results?.cash_flows && Object.keys(results.cash_flows).some(key => !isNaN(Number(key)))) {
      available.yearly = true;
    }

    if (results?.quarterly_cash_flows || results?.quarterlyCashFlows) {
      available.quarterly = true;
    }

    if (results?.monthly_cash_flows || results?.monthlyCashFlows) {
      available.monthly = true;
    }

    return available;
  }, [results]);

  // Process heat strip data based on selected time granularity
  const heatStripData = useMemo(() => {
    if (!results) return [];

    try {
      // Process monthly data if selected and available
      if (timeGranularity === 'monthly' && availableGranularities.monthly) {
        console.log("Processing monthly cash flows");
        const monthlyCashFlows = results.monthly_cash_flows || results.monthlyCashFlows;

        return Object.entries(monthlyCashFlows)
          .filter(([key]) => !isNaN(Number(key)))
          .sort(([keyA], [keyB]) => Number(keyA) - Number(keyB))
          .map(([key, data]: [string, any]) => {
            const monthIndex = Number(key);
            const year = Math.floor(monthIndex / 12) + 25; // Starting from 2025
            const month = (monthIndex % 12) + 1;

            // Format month name
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = monthNames[month - 1];

            return {
              quarter: `${monthName} '${year}`,
              netCashFlow: data.lp_net_cash_flow || data.lpNetCashFlow || 0,
              loansExited: data.exited_loans || data.exitedLoans || 0,
              newLoans: data.new_loans || data.newLoans || 0
            };
          })
          .slice(0, 20); // Limit to 20 months
      }

      // Process quarterly data if selected and available
      if (timeGranularity === 'quarterly' && availableGranularities.quarterly) {
        console.log("Processing quarterly cash flows");
        const quarterlyCashFlows = results.quarterly_cash_flows || results.quarterlyCashFlows;

        return Object.entries(quarterlyCashFlows)
          .filter(([key]) => !isNaN(Number(key)))
          .sort(([keyA], [keyB]) => Number(keyA) - Number(keyB))
          .map(([key, data]: [string, any]) => {
            const quarterIndex = Number(key);
            const year = Math.floor(quarterIndex / 4) + 25; // Starting from 2025
            const quarter = (quarterIndex % 4) + 1;

            return {
              quarter: `Q${quarter} '${year}`,
              netCashFlow: data.net_cash_flow || data.netCashFlow || 0,
              loansExited: data.exited_loans || data.exitedLoans || 0,
              newLoans: data.new_loans || data.newLoans || 0
            };
          })
          .slice(0, 20); // Limit to 20 quarters
      }

      // Process yearly data if selected and available (default)
      if ((timeGranularity === 'yearly' || !availableGranularities[timeGranularity]) && availableGranularities.yearly) {
        console.log("Processing yearly cash flows");

        // Extract yearly cash flows
        return Object.entries(results.cash_flows)
          .filter(([key]) => !isNaN(Number(key)))
          .sort(([keyA], [keyB]) => Number(keyA) - Number(keyB))
          .map(([key, data]: [string, any]) => {
            const yearIndex = Number(key);
            const year = yearIndex + 25; // Starting from 2025

            // AUDIT: Log the raw data for this year
            console.log(`AUDIT - Heat Map Data Processing Year ${year}:`, {
              rawData: data,
              exitProceeds: data.exit_proceeds || data.exitProceeds || 0,
              managementFees: data.management_fees || data.managementFees || 0,
              fundExpenses: data.fund_expenses || data.fundExpenses || 0,
              lpNetCashFlow: data.lp_net_cash_flow || data.lpNetCashFlow || 0
            });

            // FOUND THE ISSUE: The heat map was using a calculated value instead of the actual LP Net Distribution
            // Use the actual LP Net Distribution value directly from the backend
            const netCashFlow = data.lp_net_cash_flow || data.lpNetCashFlow || 0;

            // Estimate loan activity based on loan deployments and exits
            const loansExited = Math.round(Math.abs((data.exit_proceeds || data.exitProceeds || 0) / 1000000));
            const newLoans = Math.round(Math.abs((data.loan_deployments || data.loanDeployments || 0) / 1000000));

            return {
              quarter: `Year ${year}`,
              netCashFlow,
              loansExited,
              newLoans
            };
          })
          .slice(0, 10); // Limit to 10 years
      }

      // If no data available for selected granularity, return empty array
      return [];
    } catch (error) {
      console.error('Error processing heat strip data:', error);
      return [];
    }
  }, [results, timeGranularity, availableGranularities]);

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  // Calculate color for heat strip cells
  const getHeatColor = (value: number) => {
    if (value > 0) return `rgba(76, 175, 80, ${Math.min(0.9, Math.abs(value) / 1000000)})`; // Green for positive
    if (value < 0) return `rgba(244, 67, 54, ${Math.min(0.9, Math.abs(value) / 1000000)})`; // Red for negative
    return '#E5E7EB'; // Gray for zero
  };

  // Calculate contrast color for text based on background color
  const getContrastColor = (backgroundColor: string) => {
    // For rgba colors, extract the opacity
    if (backgroundColor.startsWith('rgba')) {
      const matches = backgroundColor.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
      if (matches) {
        const r = parseInt(matches[1], 10);
        const g = parseInt(matches[2], 10);
        const b = parseInt(matches[3], 10);
        const opacity = parseFloat(matches[4]);

        // If opacity is low, use dark text
        if (opacity < 0.5) return '#1F2937';

        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#1F2937' : '#FFFFFF';
      }
    }

    // For hex colors or fallback
    if (backgroundColor === '#E5E7EB') return '#1F2937';
    return '#FFFFFF'; // Default to white text
  };

  // Check if we have data to display
  const hasWaterfallData = waterfallData.length > 0;
  const hasHeatStripData = heatStripData.length > 0;

  return (
    <Card className="border border-gray-200">
      <CardHeader className="py-3 px-4 border-b border-gray-200 bg-gradient-to-r from-[#0B1C3F]/5 to-transparent">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base font-semibold text-[#0B1C3F]">Cash-Flow Waterfall Analysis</CardTitle>
            {(results.waterfall?.exit_proceeds_breakdown || results.cash_flow_components?.exit_proceeds_breakdown) && (
              <div className="text-xs text-gray-600 mt-2 space-y-1">
                <p>Exit Proceeds Breakdown:</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 mr-1.5 rounded-sm bg-gradient-to-r from-[#0B1C3F] to-[#314C7E]"></div>
                    <span>Principal: ${formatNumber(
                      results.waterfall?.exit_proceeds_breakdown?.principal ||
                      results.cash_flow_components?.exit_proceeds_breakdown?.principal || 0
                    )}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 mr-1.5 rounded-sm bg-gradient-to-r from-[#314C7E] to-[#4A6CA0]"></div>
                    <span>Interest: ${formatNumber(
                      results.waterfall?.exit_proceeds_breakdown?.interest ||
                      results.cash_flow_components?.exit_proceeds_breakdown?.interest || 0
                    )}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 mr-1.5 rounded-sm bg-gradient-to-r from-[#4A6CA0] to-[#00A0B0]"></div>
                    <span>Appreciation: ${formatNumber(
                      results.waterfall?.exit_proceeds_breakdown?.appreciation ||
                      results.cash_flow_components?.exit_proceeds_breakdown?.appreciation || 0
                    )}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 mr-1.5 rounded-sm bg-gradient-to-r from-[#0B1C3F] to-[#00A0B0]"></div>
                    <span className="font-medium">Total: ${formatNumber(
                      (results.waterfall?.exit_proceeds_breakdown?.principal ||
                       results.cash_flow_components?.exit_proceeds_breakdown?.principal || 0) +
                      (results.waterfall?.exit_proceeds_breakdown?.interest ||
                       results.cash_flow_components?.exit_proceeds_breakdown?.interest || 0) +
                      (results.waterfall?.exit_proceeds_breakdown?.appreciation ||
                       results.cash_flow_components?.exit_proceeds_breakdown?.appreciation || 0)
                    )}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-700">View:</span>
              <ToggleGroup
                type="single"
                value={selectedYear === null ? 'cumulative' : selectedYear.toString()}
                onValueChange={(value) => {
                  if (value === 'cumulative') {
                    setSelectedYear(null);
                  } else if (value) {
                    setSelectedYear(Number(value));
                  }
                }}
                className="h-7"
              >
                <ToggleGroupItem
                  value="cumulative"
                  className="px-3 py-1 text-xs h-auto data-[state=on]:bg-[#0B1C3F] data-[state=on]:text-white font-medium"
                >
                  Cumulative
                </ToggleGroupItem>
                {availableYears.map(year => (
                  <ToggleGroupItem
                    key={year}
                    value={year.toString()}
                    className="px-3 py-1 text-xs h-auto data-[state=on]:bg-[#0B1C3F] data-[state=on]:text-white font-medium"
                  >
                    Year {year + 25}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Waterfall Chart */}
          <div className="h-[350px]">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              {selectedYear === null
                ? "Cumulative Cash-Flow Waterfall (Fund Lifecycle)"
                : `Cash-Flow Waterfall for Year ${selectedYear + 25}`}
            </h3>
            {hasWaterfallData ? (
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={waterfallData}
                  margin={{ top: 20, right: 60, left: 20, bottom: 5 }}
                  layout="vertical"
                  barSize={55}
                  barGap={0}
                  barCategoryGap={20}
                >
                  <defs>
                    <linearGradient id="principalGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0B1C3F" />
                      <stop offset="100%" stopColor="#314C7E" />
                    </linearGradient>
                    <linearGradient id="interestGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#314C7E" />
                      <stop offset="100%" stopColor="#4A6CA0" />
                    </linearGradient>
                    <linearGradient id="appreciationGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4A6CA0" />
                      <stop offset="100%" stopColor="#00A0B0" />
                    </linearGradient>
                    <linearGradient id="totalGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0B1C3F" />
                      <stop offset="100%" stopColor="#00A0B0" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.8} />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => formatCurrency(value, 0)}
                    domain={['auto', 'auto']}
                    padding={{ left: 0, right: 20 }}
                    axisLine={{ stroke: '#D1D5DB' }}
                    tickLine={{ stroke: '#D1D5DB' }}
                    tick={{ fill: '#4B5563', fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={160}
                    tick={{ fontSize: 12, fill: '#1F2937' }}
                    tickMargin={10}
                    axisLine={{ stroke: '#D1D5DB' }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={(props) => <CustomWaterfallTooltip {...props} waterfallData={waterfallData} />}
                    cursor={{ fill: 'rgba(243, 244, 246, 0.6)' }}
                    wrapperStyle={{ outline: 'none' }}
                  />
                  {/* Legend removed to save space */}
                  <ReferenceLine x={0} stroke="#0B1C3F" strokeWidth={1} />

                  {/* Exit Proceeds Bar with breakdown in tooltip */}
                  <Bar
                    name="Exit Proceeds"
                    dataKey={(entry) => entry.name === 'Exit Proceeds' ? entry.value : 0}
                    fill="url(#totalGradient)"
                    radius={[0, 0, 0, 0]}
                    animationDuration={800}
                  />

                  {/* Non-stacked bars */}
                  {/* Individual bars for each component except Exit Proceeds and Total Cash Flows */}
                  {waterfallData
                    .filter(entry =>
                      entry.name !== 'Exit Proceeds' &&
                      entry.name !== 'Total Cash Flows')
                    .map((entry, index) => (
                      <Bar
                        key={`bar-${index}`}
                        name={entry.name}
                        dataKey={(item) => item.name === entry.name ? item.value : 0}
                        fill={entry.color}
                        radius={[0, 0, 0, 0]}
                        animationDuration={800}
                        animationBegin={300 + index * 50}
                      />
                    ))}


                  {/* Total Cash Flows Bar */}
                  <Bar
                    name="Total Cash Flows"
                    dataKey={(entry) => entry.name === 'Total Cash Flows' ? entry.value : 0}
                    fill="url(#totalGradient)"
                    radius={[0, 0, 0, 0]}
                    animationDuration={800}
                    animationBegin={400}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">No waterfall data available from the backend.</p>
              </div>
            )}
          </div>

          {/* Heat Strip */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-[#0B1C3F]">
                {timeGranularity === 'yearly' ? 'Yearly' :
                 timeGranularity === 'quarterly' ? 'Quarterly' :
                 'Monthly'} LP Net Distribution Heat Map
              </h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-sm mr-1.5 bg-red-500/30"></div>
                    <span className="text-xs text-gray-600">Low</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-sm mr-1.5 bg-yellow-500/60"></div>
                    <span className="text-xs text-gray-600">Medium</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-sm mr-1.5 bg-green-600/70"></div>
                    <span className="text-xs text-gray-600">High</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-700">View:</span>
                  <ToggleGroup
                    type="single"
                    value={timeGranularity}
                    onValueChange={(value) => {
                      if (value && availableGranularities[value as 'yearly' | 'quarterly' | 'monthly']) {
                        setTimeGranularity(value as 'yearly' | 'quarterly' | 'monthly');

                        // If switching to yearly view, sync with waterfall year selection
                        if (value === 'yearly' && selectedYear !== null) {
                          // Highlight the corresponding year in the heat strip
                          console.log(`Syncing heat strip with waterfall year: ${selectedYear}`);
                        }
                      }
                    }}
                    className="h-7"
                  >
                    <ToggleGroupItem
                      value="yearly"
                      disabled={!availableGranularities.yearly}
                      className="px-3 py-1 text-xs h-auto data-[state=on]:bg-[#0B1C3F] data-[state=on]:text-white font-medium"
                    >
                      Yearly
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="quarterly"
                      disabled={!availableGranularities.quarterly}
                      className="px-3 py-1 text-xs h-auto data-[state=on]:bg-[#0B1C3F] data-[state=on]:text-white font-medium"
                    >
                      Quarterly
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="monthly"
                      disabled={!availableGranularities.monthly}
                      className="px-3 py-1 text-xs h-auto data-[state=on]:bg-[#0B1C3F] data-[state=on]:text-white font-medium"
                    >
                      Monthly
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </div>

            {hasHeatStripData ? (
              <div className="flex flex-wrap rounded-md overflow-hidden border border-gray-200 shadow-sm">
                {heatStripData.map((quarter, index) => (
                  <Popover key={index}>
                    <PopoverTrigger asChild>
                      <div
                        className={`flex-1 min-w-[70px] h-16 flex flex-col items-center justify-center text-xs cursor-pointer hover:opacity-90 transition-all duration-200 border-r border-white/30 last:border-r-0 ${
                          // Highlight the cell if it corresponds to the selected year in yearly view
                          timeGranularity === 'yearly' &&
                          selectedYear !== null &&
                          quarter.quarter === `Year ${selectedYear + 25}` ?
                          'ring-2 ring-[#0B1C3F] ring-inset shadow-inner' : ''
                        }`}
                        style={{
                          backgroundColor: getHeatColor(quarter.netCashFlow),
                          color: getContrastColor(getHeatColor(quarter.netCashFlow))
                        }}
                        onClick={() => {
                          // Only allow clicking in yearly view to select a year for the waterfall
                          if (timeGranularity === 'yearly') {
                            // Extract year from the quarter string (e.g., "Year 2025" -> 0)
                            const yearMatch = quarter.quarter.match(/Year (\d+)/);
                            if (yearMatch && yearMatch[1]) {
                              const year = parseInt(yearMatch[1]) - 25; // Convert back to index

                              // Log the data for comparison
                              console.log(`AUDIT - Heat Map Year ${year + 25}:`, {
                                heatMapValue: quarter.netCashFlow,
                                rawData: results.cash_flows[year]
                              });

                              // Toggle selection: if already selected, go back to cumulative view
                              if (selectedYear === year) {
                                setSelectedYear(null);
                              } else {
                                setSelectedYear(year);
                              }
                            }
                          }
                        }}
                      >
                        <div className="font-semibold">{quarter.quarter}</div>
                        <div className="mt-1 font-medium">{formatCurrency(quarter.netCashFlow, 0)}</div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-3 text-xs shadow-lg rounded-md border border-gray-200">
                      <div className="font-semibold mb-2 text-sm text-[#0B1C3F]">{quarter.quarter}</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">LP Net Distribution:</span>
                          <span className="font-medium text-[#0B1C3F]">{formatCurrency(quarter.netCashFlow)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Loans Exited:</span>
                          <span className="font-medium text-[#0B1C3F]">{quarter.loansExited}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">New Loans:</span>
                          <span className="font-medium text-[#0B1C3F]">{quarter.newLoans}</span>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            ) : (
              <div className="h-16 flex items-center justify-center text-sm text-gray-500 border border-gray-200 rounded-md">
                <p>
                  {timeGranularity === 'yearly' ? 'No yearly' :
                   timeGranularity === 'quarterly' ? 'No quarterly' :
                   'No monthly'} cash flow data available.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
