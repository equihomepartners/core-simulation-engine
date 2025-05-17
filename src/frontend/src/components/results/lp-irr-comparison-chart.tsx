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
  LabelList
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatPercentage, formatCurrency } from '@/utils/format';
import { Info } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LPIRRComparisonChartProps {
  results: any;
  isLoading: boolean;
  expanded?: boolean;
}

export function LPIRRComparisonChart({ results, isLoading, expanded = false }: LPIRRComparisonChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'waterfall'>('bar');

  // Extract IRR data from results
  const irrData = React.useMemo(() => {
    if (isLoading || !results || !results.metrics) return null;

    // Extract IRR values
    const grossIrr = results.metrics.gross_irr || results.metrics.grossIrr;
    const fundIrr = results.metrics.fund_irr || results.metrics.fundIrr || results.metrics.irr;
    const lpIrr = results.metrics.lp_irr || results.metrics.lpIrr;

    // Log missing data
    if (grossIrr === undefined) {
      log(LogLevel.WARN, LogCategory.DATA, 'Missing gross_irr in LPIRRComparisonChart');
    }
    if (fundIrr === undefined) {
      log(LogLevel.WARN, LogCategory.DATA, 'Missing fund_irr in LPIRRComparisonChart');
    }
    if (lpIrr === undefined) {
      log(LogLevel.WARN, LogCategory.DATA, 'Missing lp_irr in LPIRRComparisonChart');
    }

    // Calculate fee impact
    const managementFeeImpact = grossIrr !== undefined && fundIrr !== undefined ? grossIrr - fundIrr : undefined;
    const carriedInterestImpact = fundIrr !== undefined && lpIrr !== undefined ? fundIrr - lpIrr : undefined;

    // Create bar chart data
    const barData = [
      {
        name: 'Gross IRR',
        value: grossIrr !== undefined ? grossIrr * 100 : 0,
        color: '#22c55e', // green
        description: 'Before any fees'
      },
      {
        name: 'Fund IRR',
        value: fundIrr !== undefined ? fundIrr * 100 : 0,
        color: '#3b82f6', // blue
        description: 'After management fees'
      },
      {
        name: 'LP IRR',
        value: lpIrr !== undefined ? lpIrr * 100 : 0,
        color: '#6366f1', // indigo
        description: 'After all fees'
      }
    ];

    // Create waterfall chart data
    const waterfallData = [
      {
        name: 'Gross IRR',
        value: grossIrr !== undefined ? grossIrr * 100 : 0,
        color: '#22c55e', // green
        description: 'Before any fees'
      },
      {
        name: 'Management Fees',
        value: managementFeeImpact !== undefined ? -managementFeeImpact * 100 : 0,
        color: '#ef4444', // red
        description: 'Impact of management fees'
      },
      {
        name: 'Fund IRR',
        value: 0, // This is calculated in the chart
        isSum: true,
        color: '#3b82f6', // blue
        description: 'After management fees'
      },
      {
        name: 'Carried Interest',
        value: carriedInterestImpact !== undefined ? -carriedInterestImpact * 100 : 0,
        color: '#f97316', // orange
        description: 'Impact of carried interest'
      },
      {
        name: 'LP IRR',
        value: 0, // This is calculated in the chart
        isSum: true,
        color: '#6366f1', // indigo
        description: 'After all fees'
      }
    ];

    return {
      barData,
      waterfallData
    };
  }, [results, isLoading]);

  // Process waterfall data to calculate running totals
  const processedWaterfallData = React.useMemo(() => {
    if (!irrData) return [];

    let runningTotal = 0;
    return irrData.waterfallData.map(item => {
      if (item.isSum) {
        item.value = runningTotal;
      } else {
        runningTotal += item.value;
      }
      return { ...item, total: runningTotal };
    });
  }, [irrData]);

  // Custom tooltip formatter
  const tooltipFormatter = (value: number, name: string, props: any) => {
    return [formatPercentage(value / 100), name];
  };

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (!irrData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No IRR data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <Tabs value={chartType} onValueChange={(value) => setChartType(value as 'bar' | 'waterfall')} className="w-[200px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bar">Bar</TabsTrigger>
            <TabsTrigger value="waterfall">Waterfall</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="h-[calc(100%-50px)]">
        {chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={irrData.barData}
              margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
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
                tickFormatter={(value) => `${value}%`}
                domain={[
                  Math.min(0, Math.floor(Math.min(...irrData.barData.map(d => d.value)) / 5) * 5),
                  Math.ceil(Math.max(...irrData.barData.map(d => d.value)) / 5) * 5 + 2
                ]}
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
                width={40}
              />
              <Tooltip formatter={tooltipFormatter} />
              <Legend verticalAlign="top" height={36} />
              <ReferenceLine y={0} stroke="#000" />
              <Bar dataKey="value" name="IRR">
                {irrData.barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList dataKey="value" position="top" formatter={(value: number) => `${value.toFixed(1)}%`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedWaterfallData}
              margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
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
                tickFormatter={(value) => `${value}%`}
                domain={[
                  Math.min(0, Math.floor(Math.min(...processedWaterfallData.map(d => d.value)) / 5) * 5),
                  Math.ceil(Math.max(...processedWaterfallData.map(d => d.value)) / 5) * 5 + 2
                ]}
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                axisLine={{ stroke: '#e5e7eb' }}
                width={40}
              />
              <Tooltip
                formatter={tooltipFormatter}
                labelFormatter={(label, payload) => {
                  const item = payload[0]?.payload;
                  return `${label}: ${item?.description}`;
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <ReferenceLine y={0} stroke="#000" />
              <Bar dataKey="value" name="IRR Component">
                {processedWaterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList dataKey="value" position="top" formatter={(value: number) => `${value.toFixed(1)}%`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>


    </div>
  );
}
