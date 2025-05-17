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
  PieChart,
  Pie,
  Sector,
  Label,
  LabelList,
  ReferenceLine
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatPercentage } from '@/utils/format';

interface LPIRRBreakdownChartProps {
  results: any;
  isLoading: boolean;
}

export function LPIRRBreakdownChart({ results, isLoading }: LPIRRBreakdownChartProps) {
  const [chartType, setChartType] = useState<'horizontal' | 'vertical' | 'pie' | 'waterfall'>('waterfall');
  const [irrType, setIrrType] = useState<'lp' | 'fund' | 'gross'>('lp');
  const [showDollarValues, setShowDollarValues] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Extract IRR breakdown data from results
  const irrBreakdownData = React.useMemo(() => {
    if (isLoading || !results) return null;

    // Get metrics
    const metrics = results.metrics;
    if (!metrics) {
      log(LogLevel.WARN, LogCategory.DATA, 'Missing metrics in LPIRRBreakdownChart');
      return null;
    }

    // Get IRR values
    const grossIrr = metrics.gross_irr || metrics.grossIrr;
    const fundIrr = metrics.fund_irr || metrics.fundIrr || metrics.irr;
    const lpIrr = metrics.lp_irr || metrics.lpIrr;

    // Check if we have all IRR values
    if (grossIrr === undefined || fundIrr === undefined || lpIrr === undefined) {
      log(LogLevel.WARN, LogCategory.DATA, 'Missing IRR values in LPIRRBreakdownChart');
      return null;
    }

    // Get fund size and commitment for dollar value calculations
    const fundSize = metrics.fund_size || metrics.fundSize || results.config?.fund_size || 100000000; // Default to $100M
    const fundTerm = metrics.fund_term || metrics.fundTerm || results.config?.fund_term || 10; // Default to 10 years

    // Calculate fee impacts
    const managementFeeImpact = grossIrr - fundIrr;
    const carriedInterestImpact = fundIrr - lpIrr;

    // Try to get IRR components from results
    const irrComponents = metrics.irr_components || metrics.irrComponents || {};

    // Get appreciation and interest components
    const appreciation = irrComponents.appreciation || grossIrr * 0.6; // Estimate if not available
    const interest = irrComponents.interest || grossIrr * 0.4; // Estimate if not available

    // Calculate approximate dollar values based on IRR percentages
    // These are rough approximations for illustration purposes
    const appreciationDollar = fundSize * appreciation * fundTerm / 10;
    const interestDollar = fundSize * interest * fundTerm / 10;
    const managementFeesDollar = fundSize * managementFeeImpact * fundTerm / 10;
    const carriedInterestDollar = fundSize * carriedInterestImpact * fundTerm / 10;
    const grossIrrDollar = appreciationDollar + interestDollar;
    const fundIrrDollar = grossIrrDollar - managementFeesDollar;
    const lpIrrDollar = fundIrrDollar - carriedInterestDollar;

    // Create different breakdowns based on selected IRR type
    if (irrType === 'gross') {
      // For Gross IRR, show only positive components
      return [
        {
          name: 'Appreciation',
          value: appreciation * 100,
          dollarValue: appreciationDollar,
          description: 'Property value gains over time',
          color: '#3b82f6', // blue
          order: 1
        },
        {
          name: 'Interest',
          value: interest * 100,
          dollarValue: interestDollar,
          description: 'Interest income from loans',
          color: '#22c55e', // green
          order: 2
        },
        {
          name: 'Total Gross IRR',
          value: grossIrr * 100,
          dollarValue: grossIrrDollar,
          description: 'Pre-fee return on investments',
          color: '#22c55e', // green
          isTotal: true,
          order: 3
        }
      ];
    } else if (irrType === 'fund') {
      // For Fund IRR, show gross components and management fee impact
      return [
        {
          name: 'Gross Return',
          value: grossIrr * 100,
          dollarValue: grossIrrDollar,
          description: 'Pre-fee investment return',
          color: '#22c55e', // green
          order: 1
        },
        {
          name: 'Management Fees',
          value: -managementFeeImpact * 100,
          dollarValue: -managementFeesDollar,
          description: 'Annual fees paid to the GP',
          color: '#ef4444', // red
          order: 2
        },
        {
          name: 'Total Fund IRR',
          value: fundIrr * 100,
          dollarValue: fundIrrDollar,
          description: 'Return after management fees',
          color: '#3b82f6', // blue
          isTotal: true,
          order: 3
        }
      ];
    } else {
      // For LP IRR (default), show all components
      return [
        {
          name: 'Gross Return',
          value: grossIrr * 100,
          dollarValue: grossIrrDollar,
          description: 'Pre-fee investment return',
          color: '#22c55e', // green
          order: 1
        },
        {
          name: 'Management Fees',
          value: -managementFeeImpact * 100,
          dollarValue: -managementFeesDollar,
          description: 'Annual fees paid to the GP',
          color: '#ef4444', // red
          order: 2
        },
        {
          name: 'Carried Interest',
          value: -carriedInterestImpact * 100,
          dollarValue: -carriedInterestDollar,
          description: 'Performance fee paid to the GP',
          color: '#f97316', // orange
          order: 3
        },
        {
          name: 'Total LP IRR',
          value: lpIrr * 100,
          dollarValue: lpIrrDollar,
          description: 'Final return to limited partners',
          color: '#6366f1', // indigo
          isTotal: true,
          order: 4
        }
      ];
    }
  }, [results, isLoading, irrType]);

  // Helper function to get color for component
  function getComponentColor(name: string) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('appreciation') || lowerName.includes('value')) return '#3b82f6'; // blue
    if (lowerName.includes('interest') || lowerName.includes('income')) return '#22c55e'; // green
    if (lowerName.includes('management') || lowerName.includes('fee')) return '#ef4444'; // red
    if (lowerName.includes('carried') || lowerName.includes('carry')) return '#f97316'; // orange
    if (lowerName.includes('total') || lowerName.includes('irr')) return '#6366f1'; // indigo
    if (lowerName.includes('default') || lowerName.includes('loss')) return '#dc2626'; // red
    if (lowerName.includes('reinvestment')) return '#0ea5e9'; // sky
    return '#6b7280'; // gray
  }

  // Custom tooltip formatter
  const tooltipFormatter = (value: number, name: string) => {
    return [formatPercentage(value / 100), name];
  };

  // Render active shape for pie chart
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#333" fontSize={14} fontWeight={500}>
          {payload.name}
        </text>
        <text x={cx} y={cy} textAnchor="middle" fill="#333" fontSize={16} fontWeight={600}>
          {formatPercentage(value / 100)}
        </text>
        <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#999" fontSize={12}>
          {`${Math.abs(percent * 100).toFixed(1)}% of total impact`}
        </text>
      </g>
    );
  };

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (!irrBreakdownData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No IRR breakdown data available</p>
      </div>
    );
  }

  // Filter out the total for pie chart
  const pieData = irrBreakdownData.filter(item => !item.isTotal);

  return (
    <div className="w-full h-full">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Tabs value={irrType} onValueChange={(value) => setIrrType(value as 'lp' | 'fund' | 'gross')} className="w-[300px]">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="lp">LP IRR</TabsTrigger>
                <TabsTrigger value="fund">Fund IRR</TabsTrigger>
                <TabsTrigger value="gross">Gross IRR</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs value={chartType} onValueChange={(value) => setChartType(value as 'horizontal' | 'vertical' | 'pie' | 'waterfall')} className="w-[400px]">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="waterfall">Waterfall</TabsTrigger>
                <TabsTrigger value="horizontal">Bar</TabsTrigger>
                <TabsTrigger value="vertical">Column</TabsTrigger>
                <TabsTrigger value="pie">Pie</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm">Show Dollar Values:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showDollarValues}
                onChange={() => setShowDollarValues(!showDollarValues)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 bg-muted/30 p-3 rounded">
          {irrType === 'lp' && (
            <>
              <div className="text-center p-2 bg-background/50 rounded border border-muted">
                <div className="text-sm font-medium">Gross IRR</div>
                <div className="text-xl font-bold text-green-600">{(irrBreakdownData?.find(d => d.name === 'Gross Return')?.value || 0).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Pre-fee return</div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded border border-muted">
                <div className="text-sm font-medium">Fund IRR</div>
                <div className="text-xl font-bold text-blue-600">{(irrBreakdownData?.find(d => d.name === 'Total Fund IRR')?.value || 0).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">After management fees</div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded border border-muted">
                <div className="text-sm font-medium">LP IRR</div>
                <div className="text-xl font-bold text-indigo-600">{(irrBreakdownData?.find(d => d.name === 'Total LP IRR')?.value || 0).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">After all fees</div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded border border-muted">
                <div className="text-sm font-medium">Fee Impact</div>
                <div className="text-xl font-bold text-red-600">
                  {(
                    (irrBreakdownData?.find(d => d.name === 'Management Fees')?.value || 0) +
                    (irrBreakdownData?.find(d => d.name === 'Carried Interest')?.value || 0)
                  ).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Total fee reduction</div>
              </div>
            </>
          )}

          {irrType === 'fund' && (
            <>
              <div className="text-center p-2 bg-background/50 rounded border border-muted">
                <div className="text-sm font-medium">Gross IRR</div>
                <div className="text-xl font-bold text-green-600">{(irrBreakdownData?.find(d => d.name === 'Gross Return')?.value || 0).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Pre-fee return</div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded border border-muted">
                <div className="text-sm font-medium">Fund IRR</div>
                <div className="text-xl font-bold text-blue-600">{(irrBreakdownData?.find(d => d.name === 'Total Fund IRR')?.value || 0).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">After management fees</div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded border border-muted">
                <div className="text-sm font-medium">Management Fee Impact</div>
                <div className="text-xl font-bold text-red-600">{(irrBreakdownData?.find(d => d.name === 'Management Fees')?.value || 0).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Fee reduction</div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded border border-muted">
                <div className="text-sm font-medium">Time-Weighted Effect</div>
                <div className="text-xl font-bold text-amber-600">
                  {(
                    (irrBreakdownData?.find(d => d.name === 'Total Fund IRR')?.value || 0) -
                    (irrBreakdownData?.find(d => d.name === 'Gross Return')?.value || 0) -
                    (irrBreakdownData?.find(d => d.name === 'Management Fees')?.value || 0)
                  ).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Timing impact</div>
              </div>
            </>
          )}

          {irrType === 'gross' && (
            <>
              <div className="text-center p-2 bg-background/50 rounded border border-muted">
                <div className="text-sm font-medium">Appreciation</div>
                <div className="text-xl font-bold text-blue-600">{(irrBreakdownData?.find(d => d.name === 'Appreciation')?.value || 0).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Property value gains</div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded border border-muted">
                <div className="text-sm font-medium">Interest</div>
                <div className="text-xl font-bold text-green-600">{(irrBreakdownData?.find(d => d.name === 'Interest')?.value || 0).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Loan interest income</div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded border border-muted">
                <div className="text-sm font-medium">Gross IRR</div>
                <div className="text-xl font-bold text-green-600">{(irrBreakdownData?.find(d => d.name === 'Total Gross IRR')?.value || 0).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Pre-fee return</div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded border border-muted">
                <div className="text-sm font-medium">Time-Weighted Effect</div>
                <div className="text-xl font-bold text-amber-600">
                  {(
                    (irrBreakdownData?.find(d => d.name === 'Total Gross IRR')?.value || 0) -
                    (irrBreakdownData?.find(d => d.name === 'Appreciation')?.value || 0) -
                    (irrBreakdownData?.find(d => d.name === 'Interest')?.value || 0)
                  ).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Timing impact</div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="h-[calc(100%-250px)]">
        {chartType === 'waterfall' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={irrBreakdownData.sort((a, b) => a.order - b.order)}
              margin={{ top: 20, right: 30, left: 30, bottom: 50 }}
              barGap={0}
              barCategoryGap={40}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
                height={50}
                angle={-10}
                textAnchor="end"
              />
              <YAxis
                tickFormatter={(value) => showDollarValues ? `$${(value / 1000000).toFixed(1)}M` : `${value}%`}
                domain={[
                  // Ensure we include negative values if they exist, and add some padding
                  showDollarValues
                    ? Math.min(0, Math.floor(Math.min(...irrBreakdownData.map(d => d.dollarValue)) / 1000000) * 1000000 - 2000000)
                    : Math.min(0, Math.floor(Math.min(...irrBreakdownData.map(d => d.value)) / 5) * 5 - 2),
                  // Add padding to the top
                  showDollarValues
                    ? Math.ceil(Math.max(...irrBreakdownData.map(d => d.dollarValue)) / 1000000) * 1000000 + 2000000
                    : Math.ceil(Math.max(...irrBreakdownData.map(d => d.value)) / 5) * 5 + 2
                ]}
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
                width={60}
              >
                <Label
                  value={showDollarValues ? "Dollar Value ($)" : "IRR Contribution (%)"}
                  position="left"
                  angle={-90}
                  style={{ textAnchor: 'middle', fontSize: 12 }}
                  offset={-20}
                />
              </YAxis>
              <Tooltip
                formatter={(value: any, name: string, props: any) => {
                  const entry = props.payload;
                  if (showDollarValues) {
                    return [`$${(value / 1000000).toFixed(1)}M`, entry.description];
                  }
                  return [`${value.toFixed(1)}%`, entry.description];
                }}
                labelFormatter={(label) => {
                  const item = irrBreakdownData.find(d => d.name === label);
                  return `${label}: ${item?.description || ''}`;
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <ReferenceLine y={0} stroke="#000" />
              <Bar
                dataKey={showDollarValues ? "dollarValue" : "value"}
                name={showDollarValues ? "Dollar Value" : "IRR Component"}
                fill="#8884d8"
              >
                {irrBreakdownData.map((entry, index) => (
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

        {chartType === 'horizontal' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={irrBreakdownData}
              margin={{ top: 10, right: 10, left: 30, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
                height={50}
                angle={-10}
                textAnchor="end"
              />
              <YAxis
                tickFormatter={(value) => showDollarValues ? `$${(value / 1000000).toFixed(1)}M` : `${value}%`}
                domain={[
                  // Ensure we include negative values if they exist, and add some padding
                  showDollarValues
                    ? Math.min(0, Math.floor(Math.min(...irrBreakdownData.map(d => d.dollarValue)) / 1000000) * 1000000 - 2000000)
                    : Math.min(0, Math.floor(Math.min(...irrBreakdownData.map(d => d.value)) / 5) * 5 - 2),
                  // Add padding to the top
                  showDollarValues
                    ? Math.ceil(Math.max(...irrBreakdownData.map(d => d.dollarValue)) / 1000000) * 1000000 + 2000000
                    : Math.ceil(Math.max(...irrBreakdownData.map(d => d.value)) / 5) * 5 + 2
                ]}
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
                width={60}
              >
                <Label
                  value={showDollarValues ? "Dollar Value ($)" : "IRR Contribution (%)"}
                  position="left"
                  angle={-90}
                  style={{ textAnchor: 'middle', fontSize: 12 }}
                  offset={-20}
                />
              </YAxis>
              <Tooltip
                formatter={(value: any, name: string, props: any) => {
                  const entry = props.payload;
                  if (showDollarValues) {
                    return [`$${(value / 1000000).toFixed(1)}M`, entry.description];
                  }
                  return [`${value.toFixed(1)}%`, entry.description];
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <ReferenceLine y={0} stroke="#000" />
              <Bar
                dataKey={showDollarValues ? "dollarValue" : "value"}
                name={showDollarValues ? "Dollar Value" : "IRR Component"}
              >
                {irrBreakdownData.map((entry, index) => (
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

        {chartType === 'vertical' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={irrBreakdownData}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(value) => showDollarValues ? `$${(value / 1000000).toFixed(1)}M` : `${value}%`}
                domain={[
                  // Ensure we include negative values if they exist, and add some padding
                  showDollarValues
                    ? Math.min(0, Math.floor(Math.min(...irrBreakdownData.map(d => d.dollarValue)) / 1000000) * 1000000 - 2000000)
                    : Math.min(0, Math.floor(Math.min(...irrBreakdownData.map(d => d.value)) / 5) * 5 - 2),
                  // Add padding to the top
                  showDollarValues
                    ? Math.ceil(Math.max(...irrBreakdownData.map(d => d.dollarValue)) / 1000000) * 1000000 + 2000000
                    : Math.ceil(Math.max(...irrBreakdownData.map(d => d.value)) / 5) * 5 + 2
                ]}
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
              >
                <Label
                  value={showDollarValues ? "Dollar Value ($)" : "IRR Contribution (%)"}
                  position="bottom"
                  style={{ textAnchor: 'middle', fontSize: 12 }}
                  offset={0}
                />
              </XAxis>
              <YAxis
                dataKey="name"
                type="category"
                width={120}
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip
                formatter={(value: any, name: string, props: any) => {
                  const entry = props.payload;
                  if (showDollarValues) {
                    return [`$${(value / 1000000).toFixed(1)}M`, entry.description];
                  }
                  return [`${value.toFixed(1)}%`, entry.description];
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <ReferenceLine x={0} stroke="#000" />
              <Bar
                dataKey={showDollarValues ? "dollarValue" : "value"}
                name={showDollarValues ? "Dollar Value" : "IRR Component"}
              >
                {irrBreakdownData.map((entry, index) => (
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
        )}

        {chartType === 'pie' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey={showDollarValues ? "dollarValue" : "value"}
                onMouseEnter={(_, index) => setActiveIndex(index)}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: string, props: any) => {
                  const entry = props.payload;
                  if (showDollarValues) {
                    return [`$${(value / 1000000).toFixed(1)}M`, entry.description];
                  }
                  return [`${value.toFixed(1)}%`, entry.description];
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 bg-muted/30 p-4 rounded text-sm">
        <h4 className="font-semibold mb-2">Understanding IRR Components</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium mb-1">Why components don't simply add up:</h5>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><span className="font-medium text-foreground">Time-weighted effects</span> - Components affect cash flows at different times</li>
              <li><span className="font-medium text-foreground">Compounding</span> - Early cash flows have more impact than later ones</li>
              <li><span className="font-medium text-foreground">Waterfall structure</span> - Carried interest only applies after hurdle is met</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-1">IRR Types Explained:</h5>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><span className="font-medium text-green-600">Gross IRR</span> - Return before any fees (property appreciation + interest)</li>
              <li><span className="font-medium text-blue-600">Fund IRR</span> - Return after management fees but before carried interest</li>
              <li><span className="font-medium text-indigo-600">LP IRR</span> - Final return to limited partners after all fees</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
