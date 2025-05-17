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
  Label
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatPercentage, formatCurrency } from '@/utils/format';

interface LPFeeImpactChartProps {
  results: any;
  isLoading: boolean;
}

export function LPFeeImpactChart({ results, isLoading }: LPFeeImpactChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Extract fee data from results
  const feeData = React.useMemo(() => {
    if (isLoading || !results || !results.metrics) return null;
    
    const metrics = results.metrics;
    
    // Extract IRR values
    const grossIrr = metrics.gross_irr || metrics.grossIrr;
    const fundIrr = metrics.fund_irr || metrics.fundIrr || metrics.irr;
    const lpIrr = metrics.lp_irr || metrics.lpIrr;
    
    // Extract fee values
    const managementFees = metrics.management_fees || metrics.managementFees || 0;
    const carriedInterest = metrics.carried_interest || metrics.carriedInterest || 0;
    
    // Log missing data
    if (grossIrr === undefined) {
      log(LogLevel.WARN, LogCategory.DATA, 'Missing gross_irr in LPFeeImpactChart');
    }
    if (fundIrr === undefined) {
      log(LogLevel.WARN, LogCategory.DATA, 'Missing fund_irr in LPFeeImpactChart');
    }
    if (lpIrr === undefined) {
      log(LogLevel.WARN, LogCategory.DATA, 'Missing lp_irr in LPFeeImpactChart');
    }
    
    // Calculate fee impact on IRR
    const managementFeeImpact = grossIrr !== undefined && fundIrr !== undefined ? grossIrr - fundIrr : undefined;
    const carriedInterestImpact = fundIrr !== undefined && lpIrr !== undefined ? fundIrr - lpIrr : undefined;
    const totalImpact = grossIrr !== undefined && lpIrr !== undefined ? grossIrr - lpIrr : undefined;
    
    // Calculate fee percentages
    const totalFees = managementFees + carriedInterest;
    const managementFeePercentage = totalFees > 0 ? managementFees / totalFees * 100 : 0;
    const carriedInterestPercentage = totalFees > 0 ? carriedInterest / totalFees * 100 : 0;
    
    // Create bar chart data
    const barData = [
      {
        name: 'Management Fees',
        value: managementFees,
        impact: managementFeeImpact !== undefined ? managementFeeImpact * 100 : 0,
        percentage: managementFeePercentage,
        color: '#ef4444' // red
      },
      {
        name: 'Carried Interest',
        value: carriedInterest,
        impact: carriedInterestImpact !== undefined ? carriedInterestImpact * 100 : 0,
        percentage: carriedInterestPercentage,
        color: '#f97316' // orange
      }
    ];
    
    // Create pie chart data
    const pieData = [
      {
        name: 'Management Fees',
        value: managementFees,
        color: '#ef4444' // red
      },
      {
        name: 'Carried Interest',
        value: carriedInterest,
        color: '#f97316' // orange
      }
    ];
    
    // Create IRR impact data
    const irrImpactData = [
      {
        name: 'Gross IRR',
        value: grossIrr !== undefined ? grossIrr * 100 : 0,
        color: '#22c55e' // green
      },
      {
        name: 'Management Fee Impact',
        value: managementFeeImpact !== undefined ? managementFeeImpact * 100 : 0,
        color: '#ef4444' // red
      },
      {
        name: 'Fund IRR',
        value: fundIrr !== undefined ? fundIrr * 100 : 0,
        color: '#3b82f6' // blue
      },
      {
        name: 'Carried Interest Impact',
        value: carriedInterestImpact !== undefined ? carriedInterestImpact * 100 : 0,
        color: '#f97316' // orange
      },
      {
        name: 'LP IRR',
        value: lpIrr !== undefined ? lpIrr * 100 : 0,
        color: '#6366f1' // indigo
      }
    ];
    
    return {
      barData,
      pieData,
      irrImpactData,
      totalFees,
      totalImpact: totalImpact !== undefined ? totalImpact * 100 : 0
    };
  }, [results, isLoading]);
  
  // Custom tooltip formatter
  const tooltipFormatter = (value: number, name: string, props: any) => {
    if (name === 'value') return [formatCurrency(value), 'Amount'];
    if (name === 'impact') return [formatPercentage(value / 100), 'IRR Impact'];
    if (name === 'percentage') return [`${value.toFixed(1)}%`, 'Percentage of Total Fees'];
    return [value, name];
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
          {formatCurrency(value)}
        </text>
        <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#999" fontSize={12}>
          {`${(percent * 100).toFixed(1)}% of total fees`}
        </text>
      </g>
    );
  };
  
  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }
  
  if (!feeData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No fee data available</p>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Fee Impact Analysis</h3>
        <Tabs value={chartType} onValueChange={(value) => setChartType(value as 'bar' | 'pie')} className="w-[200px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bar">Bar</TabsTrigger>
            <TabsTrigger value="pie">Pie</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="h-[calc(100%-60px)]">
        {chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={feeData.barData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Bar dataKey="value" name="Amount" fill="#8884d8">
                {feeData.barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
              <Bar dataKey="impact" name="IRR Impact" fill="#82ca9d">
                {feeData.barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={feeData.pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
              >
                {feeData.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <Label
                  value={`Total: ${formatCurrency(feeData.totalFees)}`}
                  position="center"
                  fontSize={14}
                  fontWeight={500}
                />
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      
      <div className="mt-4 space-y-2 text-xs">
        <div className="bg-muted/30 p-3 rounded">
          <h4 className="font-semibold mb-2">Fee Impact on IRR</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Gross IRR</span>
              </div>
              <span>{formatPercentage(feeData.irrImpactData[0].value / 100)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Management Fee Impact</span>
              </div>
              <span>-{formatPercentage(feeData.irrImpactData[1].value / 100)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span>Fund IRR</span>
              </div>
              <span>{formatPercentage(feeData.irrImpactData[2].value / 100)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                <span>Carried Interest Impact</span>
              </div>
              <span>-{formatPercentage(feeData.irrImpactData[3].value / 100)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                <span>LP IRR</span>
              </div>
              <span>{formatPercentage(feeData.irrImpactData[4].value / 100)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-muted">
              <div className="flex items-center">
                <span className="font-semibold">Total Fee Drag</span>
              </div>
              <span className="font-semibold">-{formatPercentage(feeData.totalImpact / 100)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
