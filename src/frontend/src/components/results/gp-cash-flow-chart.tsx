import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Line,
  Area,
  Label
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatCurrency, formatPercentage } from '@/utils/format';

interface GPCashFlowChartProps {
  data: any;
  isLoading?: boolean;
}

export function GPCashFlowChart({ data, isLoading = false }: GPCashFlowChartProps) {
  // Chart view options
  const [viewType, setViewType] = useState<'periodic' | 'cumulative'>('periodic');
  const [displayMode, setDisplayMode] = useState<'detailed' | 'simplified'>('simplified');
  const [chartType, setChartType] = useState<'stacked' | 'grouped' | 'line'>('stacked');

  // Color scheme for consistent visualization
  const COLORS = {
    // Income streams (positive)
    managementFees: '#3b82f6',    // Blue
    carriedInterest: '#22c55e',   // Green
    catchUp: '#a855f7',           // Purple
    investmentReturn: '#ec4899',  // Pink

    // Outflows (negative)
    investment: '#ef4444',        // Red

    // Totals
    netCashFlow: '#f59e0b',       // Amber
    totalIncome: '#6366f1'        // Indigo
  };

  // Chart configuration for better visibility
  const chartConfig = React.useMemo(() => {
    return {
      margin: { top: 40, right: 60, left: 80, bottom: 40 },
      height: 600,
      barSize: 30,
      barGap: 5,
      barCategoryGap: '15%',
      yAxis: {
        tickFormatter: (value: number) => formatCurrency(value, 0),
        label: {
          value: 'Amount ($)',
          angle: -90,
          position: 'insideLeft',
          offset: -15,
          style: { textAnchor: 'middle' }
        },
        padding: { top: 60 },
        width: 80,
        domain: [(dataMin: number) => Math.min(dataMin * 1.1, 0), (dataMax: number) => Math.ceil(dataMax * 1.2)],
      },
      xAxis: {
        label: {
          value: 'Year',
          position: 'insideBottom',
          offset: -5,
          style: { textAnchor: 'middle' }
        },
        padding: { left: 20, right: 20 },
        height: 60,
      },
      tooltip: {
        separator: ': ',
        formatter: (value: number) => formatCurrency(value),
      },
      legend: {
        verticalAlign: 'top',
        align: 'center',
        wrapperStyle: { paddingBottom: '20px' }
      }
    };
  }, []);

  // Process GP cash flow data for the chart
  const processedData = React.useMemo(() => {
    if (isLoading || !data) return { chartData: [], summaryData: null };

    // Handle both camelCase and snake_case property names
    const cashFlows = data.cash_flows || data.cashFlows;
    const waterfallResults = data.waterfall_results || data.waterfallResults;
    const config = data.config || {};

    if (!cashFlows || !waterfallResults) {
      log(LogLevel.WARN, LogCategory.DATA, 'Missing cash_flows or waterfall_results data in GPCashFlowChart');
      return { chartData: [], summaryData: null };
    }

    // Get yearly cash flow data
    const timeSeriesData = Object.keys(cashFlows)
      .filter(key => !isNaN(Number(key)))
      .sort((a, b) => Number(a) - Number(b))
      .map(key => ({
        year: Number(key),
        ...cashFlows[key]
      }));

    if (timeSeriesData.length === 0) {
      log(LogLevel.WARN, LogCategory.DATA, 'No cash flow data available for GP cash flows');
      return { chartData: [], summaryData: null };
    }

    // Get GP commitment from waterfall results
    const gpCommitmentPercentage = config.gp_commitment_percentage || config.gpCommitmentPercentage || 0;
    const fundSize = config.fund_size || config.fundSize || 0;
    const gpCommitment = waterfallResults.gp_return_of_capital ||
                        waterfallResults.gpReturnOfCapital ||
                        config.gp_commitment ||
                        config.gpCommitment ||
                        gpCommitmentPercentage * fundSize;

    // Get yearly waterfall breakdown
    const yearlyWaterfall = waterfallResults.yearly_breakdown ||
                           waterfallResults.yearlyBreakdown || {};

    // Log the yearly waterfall structure
    console.log('Yearly Waterfall Structure:', {
      hasYearlyBreakdown: !!waterfallResults.yearly_breakdown || !!waterfallResults.yearlyBreakdown,
      yearlyBreakdownKeys: Object.keys(yearlyWaterfall),
      sampleYear: yearlyWaterfall['10'] || yearlyWaterfall['5'] || yearlyWaterfall['1'] || null
    });

    // Extract GP-specific cash flows from the data
    const normalizedData = timeSeriesData.map((item: any, index: number) => {
      const year = item.year.toString();
      const yearWaterfall = yearlyWaterfall[year] || {};

      // Management fees (positive income for GP)
      // In cash flows they're recorded as negative (expense to fund)
      const managementFees = Math.abs(item.management_fees || item.managementFees || 0);

      // Carried interest (GP's share of profits above hurdle)
      let carriedInterest = 0;

      // Get total carried interest from waterfall results
      const totalCarriedInterest = waterfallResults.gp_carried_interest ||
                                  waterfallResults.gpCarriedInterest || 0;

      // Check if we have yearly breakdown data for carried interest
      if (yearWaterfall.gp_carried_interest !== undefined || yearWaterfall.gpCarriedInterest !== undefined) {
        // Use the yearly breakdown data
        carriedInterest = yearWaterfall.gp_carried_interest || yearWaterfall.gpCarriedInterest || 0;
      } else {
        // If no yearly breakdown, allocate carried interest to the last year
        const fundTerm = config.fund_term || config.fundTerm || 10;
        if (index === fundTerm) {
          carriedInterest = totalCarriedInterest;
        }
      }

      // Catch-up (GP's share to "catch up" after preferred return)
      let catchUp = 0;

      // Get total catch-up from waterfall results
      const totalCatchUp = waterfallResults.gp_catch_up ||
                          waterfallResults.gpCatchUp || 0;

      // Check if we have yearly breakdown data for catch-up
      if (yearWaterfall.gp_catch_up !== undefined || yearWaterfall.gpCatchUp !== undefined) {
        // Use the yearly breakdown data
        catchUp = yearWaterfall.gp_catch_up || yearWaterfall.gpCatchUp || 0;
      } else {
        // If no yearly breakdown, allocate catch-up to the last year
        const fundTerm = config.fund_term || config.fundTerm || 10;
        if (index === fundTerm) {
          catchUp = totalCatchUp;
        }
      }

      // GP investment (capital contribution, only in year 0)
      const gpInvestment = index === 0 ? -Math.abs(gpCommitment) : 0;

      // GP distributions (return of capital + profits on GP's investment)
      // For year 0, this is the initial investment (negative)
      // For later years, we need to calculate from the GP return of capital
      let gpDistributions = 0;

      // Get GP return of capital from waterfall results
      const gpReturnOfCapital = waterfallResults.gp_return_of_capital ||
                               waterfallResults.gpReturnOfCapital || 0;

      if (index === 0) {
        // Year 0 is the initial investment
        gpDistributions = -Math.abs(gpCommitment);
      } else if (yearWaterfall.gp_distribution !== undefined || yearWaterfall.gpDistribution !== undefined) {
        // Use the yearly breakdown data if available
        gpDistributions = yearWaterfall.gp_distribution || yearWaterfall.gpDistribution || 0;
      } else if (yearWaterfall.total_gp_distribution !== undefined || yearWaterfall.totalGpDistribution !== undefined) {
        // Alternative field name
        gpDistributions = yearWaterfall.total_gp_distribution || yearWaterfall.totalGpDistribution || 0;
      } else {
        // If no yearly breakdown, allocate return of capital to the last year
        const fundTerm = config.fund_term || config.fundTerm || 10;
        if (index === fundTerm) {
          gpDistributions = gpReturnOfCapital;
        }
      }

      // Log the yearly data for a few key years
      if (index === 0 || index === 5 || index === 10 || index === timeSeriesData.length - 1) {
        console.log(`Year ${year} Data:`, {
          cashFlow: item,
          yearWaterfall,
          managementFees,
          carriedInterest,
          totalCarriedInterest,
          catchUp,
          totalCatchUp,
          gpDistributions,
          gpReturnOfCapital
        });
      }

      // Investment return (distributions minus commitment)
      // This is the profit on GP's own investment
      // For year 0, this is negative (the investment)
      // For later years, this is the distributions
      const investmentReturn = gpDistributions;

      // Calculate total income (all positive cash flows)
      const totalIncome = managementFees + carriedInterest + catchUp + (gpDistributions > 0 ? gpDistributions : 0);

      // Calculate total outflow (all negative cash flows)
      const totalOutflow = gpDistributions < 0 ? gpDistributions : 0; // Already negative

      // Calculate net cash flow
      const netCashFlow = totalIncome + totalOutflow; // Outflow is already negative

      return {
        year: item.year,
        // Income streams (positive cash flows)
        managementFees: managementFees,
        carriedInterest: carriedInterest,
        catchUp: catchUp,
        investmentReturn: gpDistributions > 0 ? gpDistributions : 0,

        // Outflows (negative cash flows)
        gpInvestment: gpDistributions < 0 ? gpDistributions : 0, // Already negative

        // Simplified view categories
        feeIncome: managementFees,
        performanceIncome: carriedInterest + catchUp,
        investmentIncome: gpDistributions > 0 ? gpDistributions : 0,
        investmentOutflow: gpDistributions < 0 ? gpDistributions : 0, // Already negative

        // Totals
        totalIncome: totalIncome,
        totalOutflow: totalOutflow, // Already negative
        netCashFlow: netCashFlow
      };
    });
    // Calculate cumulative values if needed
    const finalData = viewType === 'cumulative'
      ? normalizedData.reduce((acc: any[], item: any, index: number) => {
          const prevItem = index > 0 ? acc[index - 1] : {
            managementFees: 0,
            carriedInterest: 0,
            catchUp: 0,
            investmentReturn: 0,
            gpInvestment: 0,
            feeIncome: 0,
            performanceIncome: 0,
            investmentIncome: 0,
            investmentOutflow: 0,
            totalIncome: 0,
            totalOutflow: 0,
            netCashFlow: 0
          };

          acc.push({
            ...item,
            managementFees: prevItem.managementFees + item.managementFees,
            carriedInterest: prevItem.carriedInterest + item.carriedInterest,
            catchUp: prevItem.catchUp + item.catchUp,
            investmentReturn: prevItem.investmentReturn + item.investmentReturn,
            gpInvestment: prevItem.gpInvestment + item.gpInvestment,
            feeIncome: prevItem.feeIncome + item.feeIncome,
            performanceIncome: prevItem.performanceIncome + item.performanceIncome,
            investmentIncome: prevItem.investmentIncome + item.investmentIncome,
            investmentOutflow: prevItem.investmentOutflow + item.investmentOutflow,
            totalIncome: prevItem.totalIncome + item.totalIncome,
            totalOutflow: prevItem.totalOutflow + item.totalOutflow,
            netCashFlow: prevItem.netCashFlow + item.netCashFlow
          });

          return acc;
        }, [])
      : normalizedData;

    // Calculate summary data (totals)
    const summaryData = finalData.reduce((acc: any, item: any) => {
      // For periodic view, sum up all values
      if (viewType === 'periodic') {
        return {
          managementFees: acc.managementFees + item.managementFees,
          carriedInterest: acc.carriedInterest + item.carriedInterest,
          catchUp: acc.catchUp + item.catchUp,
          investmentReturn: acc.investmentReturn + item.investmentReturn,
          gpInvestment: acc.gpInvestment + item.gpInvestment,
          feeIncome: acc.feeIncome + item.feeIncome,
          performanceIncome: acc.performanceIncome + item.performanceIncome,
          investmentIncome: acc.investmentIncome + item.investmentIncome,
          investmentOutflow: acc.investmentOutflow + item.investmentOutflow,
          totalIncome: acc.totalIncome + item.totalIncome,
          totalOutflow: acc.totalOutflow + item.totalOutflow,
          netCashFlow: acc.netCashFlow + item.netCashFlow
        };
      } else {
        // For cumulative view, just take the last item
        return finalData[finalData.length - 1];
      }
    }, {
      managementFees: 0,
      carriedInterest: 0,
      catchUp: 0,
      investmentReturn: 0,
      gpInvestment: 0,
      feeIncome: 0,
      performanceIncome: 0,
      investmentIncome: 0,
      investmentOutflow: 0,
      totalIncome: 0,
      totalOutflow: 0,
      netCashFlow: 0
    });

    // Log the raw data for debugging
    console.log('GP Cash Flow Chart - Raw Data:', {
      cashFlows: cashFlows ? Object.keys(cashFlows).length : 0,
      waterfallResults: waterfallResults ? Object.keys(waterfallResults).length : 0,
      yearlyWaterfall: yearlyWaterfall ? Object.keys(yearlyWaterfall).length : 0,
      gpCommitment,
      gpCarriedInterest: waterfallResults.gp_carried_interest || waterfallResults.gpCarriedInterest,
      gpCatchUp: waterfallResults.gp_catch_up || waterfallResults.gpCatchUp,
      totalGpDistribution: waterfallResults.total_gp_distribution || waterfallResults.totalGpDistribution,
      firstYearData: timeSeriesData.length > 0 ? timeSeriesData[0] : null,
      firstYearWaterfall: yearlyWaterfall['0'] || null,
      processedFirstYear: finalData.length > 0 ? finalData[0] : null,
      processedLastYear: finalData.length > 0 ? finalData[finalData.length - 1] : null,
      summaryData
    });

    // Log the GP economics metrics from the waterfall results
    const gpReturnOfCapital = waterfallResults.gp_return_of_capital || waterfallResults.gpReturnOfCapital || 0;
    const gpCatchUp = waterfallResults.gp_catch_up || waterfallResults.gpCatchUp || 0;
    const gpCarriedInterest = waterfallResults.gp_carried_interest || waterfallResults.gpCarriedInterest || 0;
    const totalGpDistribution = waterfallResults.total_gp_distribution || waterfallResults.totalGpDistribution || 0;
    const gpMultiple = waterfallResults.gp_multiple || waterfallResults.gpMultiple || 0;
    const gpIrr = waterfallResults.gp_irr || waterfallResults.gpIrr || 0;

    // Calculate GP investment return (distributions minus commitment)
    const gpInvestmentReturn = gpReturnOfCapital - gpCommitment;

    // Calculate total GP return (management fees + carried interest + catch-up + investment return)
    const totalManagementFees = timeSeriesData.reduce((sum, item) =>
      sum + Math.abs(item.management_fees || item.managementFees || 0), 0);
    const totalGpReturn = totalManagementFees + gpCarriedInterest + gpCatchUp + gpInvestmentReturn;

    console.log('GP Economics from Waterfall Results:', {
      gpCommitment,
      gpReturnOfCapital,
      gpCatchUp,
      gpCarriedInterest,
      totalGpDistribution,
      gpInvestmentReturn,
      totalManagementFees,
      totalGpReturn,
      gpMultiple,
      gpIrr
    });

    // Log the yearly breakdown of GP distributions
    console.log('GP Distributions by Year:', finalData.map(item => ({
      year: item.year,
      managementFees: item.managementFees,
      carriedInterest: item.carriedInterest,
      catchUp: item.catchUp,
      investmentReturn: item.investmentReturn,
      gpInvestment: item.gpInvestment,
      netCashFlow: item.netCashFlow
    })));

    // Return the processed data along with GP economics metrics
    return {
      chartData: finalData,
      summaryData,
      gpEconomics: {
        gpCommitment,
        gpReturnOfCapital,
        gpCatchUp,
        gpCarriedInterest,
        totalGpDistribution,
        gpInvestmentReturn,
        totalManagementFees,
        totalGpReturn,
        gpMultiple,
        gpIrr
      }
    };
  }, [data, isLoading, viewType]);
  // Extract chart data and summary data
  const { chartData, summaryData, gpEconomics } = processedData;

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Group entries by type for better organization
      const incomeEntries = payload.filter((entry: any) =>
        entry.value >= 0 &&
        ['managementFees', 'carriedInterest', 'catchUp', 'investmentReturn',
         'feeIncome', 'performanceIncome', 'investmentIncome', 'totalIncome'].includes(entry.dataKey)
      );

      const outflowEntries = payload.filter((entry: any) =>
        entry.value < 0 &&
        ['gpInvestment', 'investmentOutflow', 'totalOutflow'].includes(entry.dataKey)
      );

      const totalEntries = payload.filter((entry: any) =>
        ['netCashFlow'].includes(entry.dataKey)
      );

      return (
        <div className="bg-background border rounded-md shadow-md p-4 max-w-md">
          <p className="font-medium text-lg border-b pb-2 mb-3">{`Year ${label}`}</p>

          {incomeEntries.length > 0 && (
            <div className="mb-3">
              <p className="font-medium text-sm text-muted-foreground mb-2">Income:</p>
              {incomeEntries.map((entry: any, index: number) => (
                <div key={`income-${index}`} className="flex justify-between items-center mb-1">
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                    <span>{entry.name}:</span>
                  </span>
                  <span className="font-medium">{formatCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          )}

          {outflowEntries.length > 0 && (
            <div className="mb-3">
              <p className="font-medium text-sm text-muted-foreground mb-2">Outflows:</p>
              {outflowEntries.map((entry: any, index: number) => (
                <div key={`outflow-${index}`} className="flex justify-between items-center mb-1">
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                    <span>{entry.name}:</span>
                  </span>
                  <span className="font-medium">{formatCurrency(Math.abs(entry.value))}</span>
                </div>
              ))}
            </div>
          )}

          {totalEntries.length > 0 && (
            <div className="pt-2 border-t">
              {totalEntries.map((entry: any, index: number) => (
                <div key={`total-${index}`} className="flex justify-between items-center font-medium">
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                    <span>{entry.name}:</span>
                  </span>
                  <span>{formatCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          )}

          {/* If net cash flow is not already included, calculate it */}
          {!totalEntries.some(entry => entry.dataKey === 'netCashFlow') && (
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center font-medium">
                <span>Net Cash Flow:</span>
                <span>{formatCurrency(
                  incomeEntries.reduce((sum: number, entry: any) => sum + entry.value, 0) +
                  outflowEntries.reduce((sum: number, entry: any) => sum + entry.value, 0)
                )}</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>GP Cash Flows</CardTitle>
          <CardDescription>Comprehensive breakdown of all GP income streams and investments</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[600px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || chartData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>GP Cash Flows</CardTitle>
          <CardDescription>Comprehensive breakdown of all GP income streams and investments</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[600px]">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">No GP cash flow data available</p>
            <p className="text-sm text-muted-foreground">Run a simulation to see detailed GP cash flows</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>GP Cash Flows</CardTitle>
            <CardDescription>Comprehensive breakdown of all GP income streams and investments</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={viewType} onValueChange={(value: any) => setViewType(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="View Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="periodic">Periodic</SelectItem>
                <SelectItem value="cumulative">Cumulative</SelectItem>
              </SelectContent>
            </Select>

            <Select value={displayMode} onValueChange={(value: any) => setDisplayMode(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Display Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simplified">Simplified</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stacked">Stacked</SelectItem>
                <SelectItem value="grouped">Grouped</SelectItem>
                <SelectItem value="line">Line</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${chartConfig.height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'stacked' ? (
              <BarChart
                data={chartData}
                margin={chartConfig.margin}
                barSize={chartConfig.barSize}
                barGap={chartConfig.barGap}
                barCategoryGap={chartConfig.barCategoryGap}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  height={chartConfig.xAxis.height}
                  padding={chartConfig.xAxis.padding}
                >
                  <Label {...chartConfig.xAxis.label} />
                </XAxis>
                <YAxis
                  {...chartConfig.yAxis}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign={chartConfig.legend.verticalAlign}
                  align={chartConfig.legend.align}
                  wrapperStyle={chartConfig.legend.wrapperStyle}
                />
                <ReferenceLine y={0} stroke="#000" strokeWidth={2} />

                {displayMode === 'simplified' ? (
                  <>
                    <Bar dataKey="investmentOutflow" name="Investment Outflow" stackId="a" fill={COLORS.investment} />
                    <Bar dataKey="feeIncome" name="Fee Income" stackId="a" fill={COLORS.managementFees} />
                    <Bar dataKey="performanceIncome" name="Performance Income" stackId="a" fill={COLORS.catchUp} />
                    <Bar dataKey="investmentIncome" name="Investment Return" stackId="a" fill={COLORS.investmentReturn} />
                  </>
                ) : (
                  <>
                    <Bar dataKey="gpInvestment" name="GP Investment" stackId="a" fill={COLORS.investment} />
                    <Bar dataKey="managementFees" name="Management Fees" stackId="a" fill={COLORS.managementFees} />
                    <Bar dataKey="carriedInterest" name="Carried Interest" stackId="a" fill={COLORS.carriedInterest} />
                    <Bar dataKey="catchUp" name="Catch-Up" stackId="a" fill={COLORS.catchUp} />
                    <Bar dataKey="investmentReturn" name="Investment Return" stackId="a" fill={COLORS.investmentReturn} />
                  </>
                )}
              </BarChart>
            ) : chartType === 'grouped' ? (
              <BarChart
                data={chartData}
                margin={chartConfig.margin}
                barSize={chartConfig.barSize}
                barGap={chartConfig.barGap}
                barCategoryGap={chartConfig.barCategoryGap}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  height={chartConfig.xAxis.height}
                  padding={chartConfig.xAxis.padding}
                >
                  <Label {...chartConfig.xAxis.label} />
                </XAxis>
                <YAxis
                  {...chartConfig.yAxis}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign={chartConfig.legend.verticalAlign}
                  align={chartConfig.legend.align}
                  wrapperStyle={chartConfig.legend.wrapperStyle}
                />
                <ReferenceLine y={0} stroke="#000" strokeWidth={2} />

                {displayMode === 'simplified' ? (
                  <>
                    <Bar dataKey="investmentOutflow" name="Investment Outflow" fill={COLORS.investment} />
                    <Bar dataKey="feeIncome" name="Fee Income" fill={COLORS.managementFees} />
                    <Bar dataKey="performanceIncome" name="Performance Income" fill={COLORS.catchUp} />
                    <Bar dataKey="investmentIncome" name="Investment Return" fill={COLORS.investmentReturn} />
                    <Bar dataKey="netCashFlow" name="Net Cash Flow" fill={COLORS.netCashFlow} />
                  </>
                ) : (
                  <>
                    <Bar dataKey="gpInvestment" name="GP Investment" fill={COLORS.investment} />
                    <Bar dataKey="managementFees" name="Management Fees" fill={COLORS.managementFees} />
                    <Bar dataKey="carriedInterest" name="Carried Interest" fill={COLORS.carriedInterest} />
                    <Bar dataKey="catchUp" name="Catch-Up" fill={COLORS.catchUp} />
                    <Bar dataKey="investmentReturn" name="Investment Return" fill={COLORS.investmentReturn} />
                    <Bar dataKey="netCashFlow" name="Net Cash Flow" fill={COLORS.netCashFlow} />
                  </>
                )}
              </BarChart>
            ) : (
              <ComposedChart
                data={chartData}
                margin={chartConfig.margin}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  height={chartConfig.xAxis.height}
                  padding={chartConfig.xAxis.padding}
                >
                  <Label {...chartConfig.xAxis.label} />
                </XAxis>
                <YAxis
                  {...chartConfig.yAxis}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign={chartConfig.legend.verticalAlign}
                  align={chartConfig.legend.align}
                  wrapperStyle={chartConfig.legend.wrapperStyle}
                />
                <ReferenceLine y={0} stroke="#000" strokeWidth={2} />

                {displayMode === 'simplified' ? (
                  <>
                    <Line type="monotone" dataKey="investmentOutflow" name="Investment Outflow" stroke={COLORS.investment} strokeWidth={2} />
                    <Line type="monotone" dataKey="feeIncome" name="Fee Income" stroke={COLORS.managementFees} strokeWidth={2} />
                    <Line type="monotone" dataKey="performanceIncome" name="Performance Income" stroke={COLORS.catchUp} strokeWidth={2} />
                    <Line type="monotone" dataKey="investmentIncome" name="Investment Return" stroke={COLORS.investmentReturn} strokeWidth={2} />
                    <Line type="monotone" dataKey="netCashFlow" name="Net Cash Flow" stroke={COLORS.netCashFlow} strokeWidth={3} />
                  </>
                ) : (
                  <>
                    <Line type="monotone" dataKey="gpInvestment" name="GP Investment" stroke={COLORS.investment} strokeWidth={2} />
                    <Line type="monotone" dataKey="managementFees" name="Management Fees" stroke={COLORS.managementFees} strokeWidth={2} />
                    <Line type="monotone" dataKey="carriedInterest" name="Carried Interest" stroke={COLORS.carriedInterest} strokeWidth={2} />
                    <Line type="monotone" dataKey="catchUp" name="Catch-Up" stroke={COLORS.catchUp} strokeWidth={2} />
                    <Line type="monotone" dataKey="investmentReturn" name="Investment Return" stroke={COLORS.investmentReturn} strokeWidth={2} />
                    <Line type="monotone" dataKey="netCashFlow" name="Net Cash Flow" stroke={COLORS.netCashFlow} strokeWidth={3} />
                  </>
                )}
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Summary section */}
        {gpEconomics && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Management Fees</h4>
              <p className="text-2xl font-bold">{formatCurrency(gpEconomics.totalManagementFees)}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Performance Income</h4>
              <p className="text-2xl font-bold">{formatCurrency(gpEconomics.gpCarriedInterest + gpEconomics.gpCatchUp)}</p>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="inline-block mr-2">Carried Interest: {formatCurrency(gpEconomics.gpCarriedInterest)}</span>
                <span className="inline-block">Catch-Up: {formatCurrency(gpEconomics.gpCatchUp)}</span>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Investment Return</h4>
              <p className="text-2xl font-bold">{formatCurrency(gpEconomics.gpInvestmentReturn)}</p>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="inline-block mr-2">Investment: {formatCurrency(gpEconomics.gpCommitment)}</span>
                <span className="inline-block">Multiple: {gpEconomics.gpMultiple.toFixed(2)}x</span>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Total GP Income</h4>
              <p className="text-2xl font-bold">{formatCurrency(gpEconomics.totalGpReturn)}</p>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="inline-block">Net Cash Flow: {formatCurrency(gpEconomics.totalGpReturn - gpEconomics.gpCommitment)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
