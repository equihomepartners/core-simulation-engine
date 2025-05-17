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
  Cell,
  ReferenceLine,
  Label,
  LabelList,
  ComposedChart,
  Line
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label as UILabel } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatPercentage, formatCurrency } from '@/lib/formatters';
import { Info } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Helper function to get color for IRR component
const getComponentColor = (componentName: string): string => {
  const colorMap: Record<string, string> = {
    'Base Income': '#22c55e', // green
    'Interest': '#22c55e', // green
    'Appreciation': '#3b82f6', // blue
    'Leverage': '#f59e0b', // amber
    'Fees': '#ef4444', // red
    'Management Fees': '#ef4444', // red
    'Fund Expenses': '#ef4444', // red
    'Total IRR': '#6366f1', // indigo
  };

  return colorMap[componentName] || '#6b7280'; // gray as default
};

interface EnhancedIRRBreakdownChartProps {
  data: any;
  isLoading?: boolean;
}

export function EnhancedIRRBreakdownChart({ data, isLoading = false }: EnhancedIRRBreakdownChartProps) {
  // State for chart type and display options
  const [chartType, setChartType] = useState<'waterfall' | 'detailed'>('waterfall');
  const [showDollarValues, setShowDollarValues] = useState(false);
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);

  // Extract IRR data from results
  // Extract metrics from data
  const metrics = React.useMemo(() => {
    if (!data) return {};
    return data.metrics || data.performance_metrics || data.performanceMetrics || {};
  }, [data]);

  const irrData = React.useMemo(() => {
    if (isLoading || !data) return null;
    const waterfallResults = data.waterfall_results || data.waterfallResults || {};

    // Log available data for debugging
    console.log('IRR Breakdown data sources:', {
      metrics: metrics,
      waterfall: waterfallResults
    });

    // Extract IRR values, prioritizing waterfall results for LP IRR
    // Get LP IRR from waterfall results or metrics. Default to 0 if not found or not positive.
    const lpIrr = (waterfallResults.lp_irr !== null && waterfallResults.lp_irr !== undefined && waterfallResults.lp_irr > 0) ? waterfallResults.lp_irr :
                 (waterfallResults.lpIrr !== null && waterfallResults.lpIrr !== undefined && waterfallResults.lpIrr > 0) ? waterfallResults.lpIrr :
                 (waterfallResults.lp_net_irr !== null && waterfallResults.lp_net_irr !== undefined && waterfallResults.lp_net_irr > 0) ? waterfallResults.lp_net_irr :
                 (waterfallResults.lpNetIrr !== null && waterfallResults.lpNetIrr !== undefined && waterfallResults.lpNetIrr > 0) ? waterfallResults.lpNetIrr :
                 (metrics.lp_irr !== null && metrics.lp_irr !== undefined && metrics.lp_irr > 0) ? metrics.lp_irr :
                 (metrics.lpIrr !== null && metrics.lpIrr !== undefined && metrics.lpIrr > 0) ? metrics.lpIrr :
                 0;

    // For Fund IRR, use metrics. Default to 0 if not found or not positive.
    const fundIrr = (metrics.fund_irr !== null && metrics.fund_irr !== undefined && metrics.fund_irr > 0) ? metrics.fund_irr :
                   (metrics.fundIrr !== null && metrics.fundIrr !== undefined && metrics.fundIrr > 0) ? metrics.fundIrr :
                   (metrics.irr !== null && metrics.irr !== undefined && metrics.irr > 0) ? metrics.irr :
                   0;

    // For Gross IRR, use metrics. Default to 0 if not found or not positive.
    const grossIrr = (metrics.gross_irr !== null && metrics.gross_irr !== undefined && metrics.gross_irr > 0) ? metrics.gross_irr :
                    (metrics.grossIrr !== null && metrics.grossIrr !== undefined && metrics.grossIrr > 0) ? metrics.grossIrr :
                    0;

    // Log the extracted IRR values
    console.log('Extracted IRR values:', {
      lpIrr,
      fundIrr,
      grossIrr,
      lpIrrSource: waterfallResults.lp_irr ? 'waterfall' : (metrics.lp_irr ? 'metrics' : 'estimated'),
      fundIrrSource: metrics.fund_irr ? 'metrics' : (metrics.irr ? 'metrics.irr' : 'estimated'),
      grossIrrSource: metrics.gross_irr ? 'metrics' : 'estimated'
    });

    // Calculate fee impact
    // Management fee impact is the difference between Gross IRR and Fund IRR
    const managementFeeImpact = grossIrr > 0 && fundIrr > 0 ? grossIrr - fundIrr : (grossIrr > 0 ? grossIrr * 0.3 : 0.01);

    // Carried interest impact is the difference between Fund IRR and LP IRR
    const carriedInterestImpact = fundIrr > 0 && lpIrr > 0 ? fundIrr - lpIrr : (lpIrr > 0 ? lpIrr * 0.2 : 0.005);

    // Total fee impact is the difference between Gross IRR and LP IRR
    const totalFeeImpact = grossIrr > 0 && lpIrr > 0 ? grossIrr - lpIrr : (lpIrr > 0 ? lpIrr * 0.5 : 0.015);

    // Get fund size for dollar value calculations
    const fundSize = metrics.fund_size || metrics.fundSize || data.config?.fund_size || 100000000; // Default to $100M
    const fundTerm = metrics.fund_term || metrics.fundTerm || data.config?.fund_term || 10; // Default to 10 years

    // Get IRR components
    const irrComponents = metrics.irr_components || metrics.irrComponents || {};
    const appreciation = irrComponents.appreciation || (grossIrr ? grossIrr * 0.6 : 0); // Estimate if not available
    const interest = irrComponents.interest || (grossIrr ? grossIrr * 0.4 : 0); // Estimate if not available

    // Calculate dollar values (approximate)
    const appreciationDollar = fundSize * appreciation * fundTerm / 10;
    const interestDollar = fundSize * interest * fundTerm / 10;
    const managementFeesDollar = managementFeeImpact ? fundSize * managementFeeImpact * fundTerm / 10 : 0;
    const carriedInterestDollar = carriedInterestImpact ? fundSize * carriedInterestImpact * fundTerm / 10 : 0;
    const grossIrrDollar = appreciationDollar + interestDollar;
    const fundIrrDollar = grossIrrDollar - managementFeesDollar;
    const lpIrrDollar = fundIrrDollar - carriedInterestDollar;

    return {
      grossIrr,
      fundIrr,
      lpIrr,
      appreciation,
      interest,
      managementFeeImpact,
      carriedInterestImpact,
      totalFeeImpact,
      appreciationDollar,
      interestDollar,
      managementFeesDollar,
      carriedInterestDollar,
      grossIrrDollar,
      fundIrrDollar,
      lpIrrDollar,
      fundSize,
      fundTerm
    };
  }, [data, isLoading]);

  // Generate waterfall chart data
  const waterfallData = React.useMemo(() => {
    if (!irrData) return [];

    // Add a note for estimated values
    const hasGrossIrr = metrics && (metrics.gross_irr || metrics.grossIrr);
    const hasFundIrr = metrics && (metrics.fund_irr || metrics.fundIrr || metrics.irr);

    const grossIrrNote = irrData.lpIrr > 0 && !hasGrossIrr ? ' (est.)' : '';
    const fundIrrNote = irrData.lpIrr > 0 && !hasFundIrr ? ' (est.)' : '';

    return [
      {
        name: `Gross IRR${grossIrrNote}`,
        value: irrData.grossIrr * 100,
        dollarValue: irrData.grossIrrDollar,
        description: 'Pre-fee IRR calculated on raw investment returns before any fees',
        color: '#22c55e', // green
        isStartPoint: true
      },
      {
        name: 'Management Fees',
        value: -irrData.managementFeeImpact * 100,
        dollarValue: -irrData.managementFeesDollar,
        description: 'Impact of management fees and fund expenses on IRR',
        color: '#ef4444', // red
        isNegative: true
      },
      {
        name: `Fund IRR${fundIrrNote}`,
        value: irrData.fundIrr * 100,
        dollarValue: irrData.fundIrrDollar,
        description: 'IRR after deducting management fees but before carried interest',
        color: '#3b82f6', // blue
        isIntermediate: true
      },
      {
        name: 'Carried Interest',
        value: -irrData.carriedInterestImpact * 100,
        dollarValue: -irrData.carriedInterestDollar,
        description: 'Impact of carried interest (performance fee) paid to the GP',
        color: '#f97316', // orange
        isNegative: true
      },
      {
        name: 'LP IRR',
        value: irrData.lpIrr * 100,
        dollarValue: irrData.lpIrrDollar,
        description: 'Final IRR received by limited partners after all fees',
        color: '#6366f1', // indigo
        isEndPoint: true
      }
    ];
  }, [irrData, metrics]);

  // Generate detailed breakdown data
  const detailedData = React.useMemo(() => {
    if (!irrData) return { grossIrrData: [], fundIrrData: [], lpIrrData: [] };

    // Gross IRR breakdown
    const grossIrrData = [
      {
        name: 'Interest',
        value: irrData.interest * 100,
        dollarValue: irrData.interestDollar,
        description: 'Interest income from loans',
        color: '#22c55e', // green
      },
      {
        name: 'Appreciation',
        value: irrData.appreciation * 100,
        dollarValue: irrData.appreciationDollar,
        description: 'Property value gains',
        color: '#3b82f6', // blue
      },
      {
        name: 'Gross IRR',
        value: irrData.grossIrr * 100,
        dollarValue: irrData.grossIrrDollar,
        description: 'Pre-fee IRR calculated on raw investment returns',
        color: '#22c55e', // green
        isTotal: true
      }
    ];

    // Fund IRR breakdown
    const fundIrrData = [
      {
        name: 'Gross IRR',
        value: irrData.grossIrr * 100,
        dollarValue: irrData.grossIrrDollar,
        description: 'Pre-fee IRR calculated on raw investment returns',
        color: '#22c55e', // green
      },
      {
        name: 'Management Fees',
        value: -irrData.managementFeeImpact * 100,
        dollarValue: -irrData.managementFeesDollar,
        description: 'Impact of management fees and fund expenses on IRR',
        color: '#ef4444', // red
        isNegative: true
      },
      {
        name: 'Fund IRR',
        value: irrData.fundIrr * 100,
        dollarValue: irrData.fundIrrDollar,
        description: 'IRR after deducting management fees but before carried interest',
        color: '#3b82f6', // blue
        isTotal: true
      }
    ];

    // LP IRR breakdown
    const lpIrrData = [
      {
        name: 'Fund IRR',
        value: irrData.fundIrr * 100,
        dollarValue: irrData.fundIrrDollar,
        description: 'IRR after deducting management fees but before carried interest',
        color: '#3b82f6', // blue
      },
      {
        name: 'Carried Interest',
        value: -irrData.carriedInterestImpact * 100,
        dollarValue: -irrData.carriedInterestDollar,
        description: 'Impact of carried interest (performance fee) paid to the GP',
        color: '#f97316', // orange
        isNegative: true
      },
      {
        name: 'LP IRR',
        value: irrData.lpIrr * 100,
        dollarValue: irrData.lpIrrDollar,
        description: 'Final IRR received by limited partners after all fees',
        color: '#6366f1', // indigo
        isTotal: true
      }
    ];

    return { grossIrrData, fundIrrData, lpIrrData };
  }, [irrData]);

  // Custom tooltip formatter
  const tooltipFormatter = (value: number, name: string, props: any) => {
    const item = props.payload;
    if (showDollarValues) {
      return [`$${(Math.abs(value) / 1000000).toFixed(1)}M`, item.description || name];
    }
    return [`${Math.abs(value).toFixed(1)}%`, item.description || name];
  };

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (!irrData || !waterfallData.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No IRR breakdown data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <Tabs value={chartType} onValueChange={(value) => setChartType(value as 'waterfall' | 'detailed')} className="w-[240px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="waterfall" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">Waterfall</TabsTrigger>
              <TabsTrigger value="detailed" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">Detailed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Detailed Breakdown</span>
            <button
              onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
              className={`relative inline-flex h-5 w-10 items-center rounded-full ${showDetailedBreakdown ? 'bg-green-100' : 'bg-muted'}`}
            >
              <div
                className={`absolute mx-0.5 h-4 w-4 rounded-full transition-transform ${
                  showDetailedBreakdown ? 'translate-x-5 bg-green-500' : 'translate-x-0 bg-gray-400'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Dollar Values</span>
            <button
              onClick={() => setShowDollarValues(!showDollarValues)}
              className={`relative inline-flex h-5 w-10 items-center rounded-full ${showDollarValues ? 'bg-green-100' : 'bg-muted'}`}
            >
              <div
                className={`absolute mx-0.5 h-4 w-4 rounded-full transition-transform ${
                  showDollarValues ? 'translate-x-5 bg-green-500' : 'translate-x-0 bg-gray-400'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* IRR Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-background/50 p-4 rounded border border-muted text-center">
          <div className="text-sm text-muted-foreground">Gross IRR</div>
          <div className="text-2xl font-bold text-green-600">
            {formatPercentage(irrData.grossIrr)}
            {irrData.lpIrr > 0 && !(metrics && (metrics.gross_irr || metrics.grossIrr)) &&
              <span className="text-xs ml-1 text-muted-foreground">(est.)</span>}
          </div>
          <div className="text-xs text-muted-foreground">Pre-fee IRR on raw investment returns</div>
        </div>
        <div className="bg-background/50 p-4 rounded border border-muted text-center">
          <div className="text-sm text-muted-foreground">Fund IRR</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatPercentage(irrData.fundIrr)}
            {irrData.lpIrr > 0 && !(metrics && (metrics.fund_irr || metrics.fundIrr || metrics.irr)) &&
              <span className="text-xs ml-1 text-muted-foreground">(est.)</span>}
          </div>
          <div className="text-xs text-muted-foreground">After management fees, before carried interest</div>
        </div>
        <div className="bg-background/50 p-4 rounded border border-muted text-center">
          <div className="text-sm text-muted-foreground">LP IRR</div>
          <div className="text-2xl font-bold text-indigo-600">
            {formatPercentage(irrData.lpIrr)}
          </div>
          <div className="text-xs text-muted-foreground">After all fees and carried interest</div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-[calc(100%-180px)]">
        {chartType === 'waterfall' && !showDetailedBreakdown && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={waterfallData}
              margin={{ top: 20, right: 30, left: 30, bottom: 50 }}
              barCategoryGap={20}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tickFormatter={(value) => showDollarValues ? `$${(value / 1000000).toFixed(0)}M` : `${value}%`}
                domain={[
                  0,
                  showDollarValues
                    ? Math.ceil(Math.max(...waterfallData.map(d => d.dollarValue)) / 5000000) * 5000000 * 1.2
                    : Math.ceil(Math.max(...waterfallData.map(d => d.value)) / 5) * 5 * 1.2
                ]}
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
                width={60}
              >
                <Label
                  value={showDollarValues ? "Dollar Value" : "IRR (%)"}
                  position="left"
                  angle={-90}
                  style={{ textAnchor: 'middle', fontSize: 12 }}
                  offset={-20}
                />
              </YAxis>
              <Tooltip formatter={tooltipFormatter} />
              <Legend verticalAlign="top" height={36} />
              <ReferenceLine y={0} stroke="#000" />
              <Bar
                dataKey={showDollarValues ? "dollarValue" : "value"}
                name={showDollarValues ? "Dollar Value" : "IRR Component"}
                fill="#8884d8"
              >
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList
                  dataKey={showDollarValues ? "dollarValue" : "value"}
                  position="top"
                  formatter={(value: number) => showDollarValues
                    ? `$${(value / 1000000).toFixed(1)}M`
                    : `${value.toFixed(1)}%`
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === 'waterfall' && showDetailedBreakdown && (
          <div className="h-full flex flex-col">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={waterfallData}
                  margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
                  barCategoryGap={20}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tickFormatter={(value) => showDollarValues ? `$${(value / 1000000).toFixed(0)}M` : `${value}%`}
                    domain={[
                      0,
                      showDollarValues
                        ? Math.ceil(Math.max(...waterfallData.map(d => d.dollarValue)) / 5000000) * 5000000 * 1.2
                        : Math.ceil(Math.max(...waterfallData.map(d => d.value)) / 5) * 5 * 1.2
                    ]}
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    width={60}
                  >
                    <Label
                      value={showDollarValues ? "Dollar Value" : "IRR (%)"}
                      position="left"
                      angle={-90}
                      style={{ textAnchor: 'middle', fontSize: 12 }}
                      offset={-20}
                    />
                  </YAxis>
                  <Tooltip formatter={tooltipFormatter} />
                  <Legend verticalAlign="top" height={36} />
                  <ReferenceLine y={0} stroke="#000" />
                  <Bar
                    dataKey={showDollarValues ? "dollarValue" : "value"}
                    name={showDollarValues ? "Dollar Value" : "IRR Component"}
                    fill="#8884d8"
                  >
                    {waterfallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList
                      dataKey={showDollarValues ? "dollarValue" : "value"}
                      position="top"
                      formatter={(value: number) => showDollarValues
                        ? `$${(value / 1000000).toFixed(1)}M`
                        : `${value.toFixed(1)}%`
                      }
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 bg-muted/30 p-4 rounded-lg border">
              <h3 className="text-sm font-medium mb-3">Fee Impact on IRR</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Management Fees</span>
                    <span className="text-sm font-semibold text-red-600">
                      -{formatPercentage(irrData.managementFeeImpact)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 rounded-full"
                      style={{ width: `${(irrData.managementFeeImpact / irrData.grossIrr) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Carried Interest</span>
                    <span className="text-sm font-semibold text-orange-600">
                      -{formatPercentage(irrData.carriedInterestImpact)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-600 rounded-full"
                      style={{ width: `${(irrData.carriedInterestImpact / irrData.grossIrr) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Fee Drag</span>
                    <span className="text-sm font-semibold text-red-600">
                      -{formatPercentage(irrData.totalFeeImpact)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${(irrData.totalFeeImpact / irrData.grossIrr) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {chartType === 'detailed' && (
          <div className="grid grid-cols-3 gap-6 h-full">
            {/* Gross IRR Breakdown */}
            <div className="bg-background/50 p-4 rounded border border-muted flex flex-col">
              <h3 className="text-base font-semibold mb-4 text-green-600">Gross IRR Breakdown</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={detailedData.grossIrrData}
                    margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(value) => showDollarValues ? `$${(value / 1000000).toFixed(0)}M` : `${value}%`}
                    />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip formatter={tooltipFormatter} />
                    <Bar
                      dataKey={showDollarValues ? "dollarValue" : "value"}
                      name={showDollarValues ? "Dollar Value" : "IRR Component"}
                    >
                      {detailedData.grossIrrData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList
                        dataKey={showDollarValues ? "dollarValue" : "value"}
                        position="right"
                        formatter={(value: number) => showDollarValues
                          ? `$${(value / 1000000).toFixed(1)}M`
                          : `${value.toFixed(1)}%`
                        }
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-xs">
                <div className="flex justify-between border-t pt-2">
                  <span>Interest</span>
                  <span className="font-semibold">{formatPercentage(irrData.interest)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Appreciation</span>
                  <span className="font-semibold">{formatPercentage(irrData.appreciation)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed pt-2 font-semibold">
                  <span>Gross IRR</span>
                  <span className="text-green-600">{formatPercentage(irrData.grossIrr)}</span>
                </div>
              </div>
            </div>

            {/* Fund IRR Breakdown */}
            <div className="bg-background/50 p-4 rounded border border-muted flex flex-col">
              <h3 className="text-base font-semibold mb-4 text-blue-600">Fund IRR Breakdown</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={detailedData.fundIrrData}
                    margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(value) => showDollarValues ? `$${(value / 1000000).toFixed(0)}M` : `${value}%`}
                    />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip formatter={tooltipFormatter} />
                    <Bar
                      dataKey={showDollarValues ? "dollarValue" : "value"}
                      name={showDollarValues ? "Dollar Value" : "IRR Component"}
                    >
                      {detailedData.fundIrrData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList
                        dataKey={showDollarValues ? "dollarValue" : "value"}
                        position="right"
                        formatter={(value: number) => showDollarValues
                          ? `$${(value / 1000000).toFixed(1)}M`
                          : `${value.toFixed(1)}%`
                        }
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-xs">
                <div className="flex justify-between border-t pt-2">
                  <span>Gross IRR</span>
                  <span className="font-semibold text-green-600">{formatPercentage(irrData.grossIrr)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Management Fees</span>
                  <span className="font-semibold text-red-600">-{formatPercentage(irrData.managementFeeImpact)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed pt-2 font-semibold">
                  <span>Fund IRR</span>
                  <span className="text-blue-600">{formatPercentage(irrData.fundIrr)}</span>
                </div>
              </div>
            </div>

            {/* LP IRR Breakdown */}
            <div className="bg-background/50 p-4 rounded border border-muted flex flex-col">
              <h3 className="text-base font-semibold mb-4 text-indigo-600">LP IRR Breakdown</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={detailedData.lpIrrData}
                    margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(value) => showDollarValues ? `$${(value / 1000000).toFixed(0)}M` : `${value}%`}
                    />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip formatter={tooltipFormatter} />
                    <Bar
                      dataKey={showDollarValues ? "dollarValue" : "value"}
                      name={showDollarValues ? "Dollar Value" : "IRR Component"}
                    >
                      {detailedData.lpIrrData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList
                        dataKey={showDollarValues ? "dollarValue" : "value"}
                        position="right"
                        formatter={(value: number) => showDollarValues
                          ? `$${(value / 1000000).toFixed(1)}M`
                          : `${value.toFixed(1)}%`
                        }
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-xs">
                <div className="flex justify-between border-t pt-2">
                  <span>Fund IRR</span>
                  <span className="font-semibold text-blue-600">{formatPercentage(irrData.fundIrr)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Carried Interest</span>
                  <span className="font-semibold text-orange-600">-{formatPercentage(irrData.carriedInterestImpact)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed pt-2 font-semibold">
                  <span>LP IRR</span>
                  <span className="text-indigo-600">{formatPercentage(irrData.lpIrr)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
