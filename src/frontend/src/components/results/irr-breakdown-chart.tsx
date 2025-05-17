import React, { useState, useMemo } from 'react';
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
  ComposedChart,
  Line,
  Label,
  LabelList
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogLevel, LogCategory, logMissingData } from '@/utils/logging';
import { formatPercentage, formatCurrency } from '@/utils/format';

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

interface IRRBreakdownChartProps {
  results: any;
  isLoading: boolean;
  expanded?: boolean;
}

export function IRRBreakdownChart({
  results,
  isLoading,
  expanded = false
}: IRRBreakdownChartProps) {
  const [viewMode, setViewMode] = useState<'stacked' | 'detailed'>('stacked');
  const [showDollarValues, setShowDollarValues] = useState(false);

  // Extract IRR values
  const irrValues = useMemo(() => {
    if (isLoading || !results || !results.metrics) return null;

    const metrics = results.metrics;

    const grossIrr = metrics.gross_irr || metrics.grossIrr || 0;
    const fundIrr = metrics.fund_irr || metrics.fundIrr || metrics.irr || 0;
    const lpIrr = metrics.lp_irr || metrics.lpIrr || 0;

    // Calculate fee impacts
    const managementFeeImpact = grossIrr - fundIrr;
    const carriedInterestImpact = fundIrr - lpIrr;

    // Get fund size for dollar value calculations
    const fundSize = metrics.fund_size || metrics.fundSize || results.config?.fund_size || 100000000; // Default to $100M
    const fundTerm = metrics.fund_term || metrics.fundTerm || results.config?.fund_term || 10; // Default to 10 years

    // Get IRR components
    const irrComponents = metrics.irr_components || metrics.irrComponents || {};
    const appreciation = irrComponents.appreciation || grossIrr * 0.6; // Estimate if not available
    const interest = irrComponents.interest || grossIrr * 0.4; // Estimate if not available

    // Calculate dollar values (approximate)
    const appreciationDollar = fundSize * appreciation * fundTerm / 10;
    const interestDollar = fundSize * interest * fundTerm / 10;
    const managementFeesDollar = fundSize * managementFeeImpact * fundTerm / 10;
    const carriedInterestDollar = fundSize * carriedInterestImpact * fundTerm / 10;

    return {
      grossIrr,
      fundIrr,
      lpIrr,
      appreciation,
      interest,
      managementFeeImpact,
      carriedInterestImpact,
      appreciationDollar,
      interestDollar,
      managementFeesDollar,
      carriedInterestDollar,
      fundSize,
      fundTerm
    };
  }, [results, isLoading]);

  // Generate stacked chart data
  const stackedData = useMemo(() => {
    if (!irrValues) return [];

    return [
      {
        name: 'Gross IRR',
        appreciation: irrValues.appreciation * 100,
        interest: irrValues.interest * 100,
        total: irrValues.grossIrr * 100,
        dollarAppreciation: irrValues.appreciationDollar,
        dollarInterest: irrValues.interestDollar,
        dollarTotal: irrValues.appreciationDollar + irrValues.interestDollar
      },
      {
        name: 'Fund IRR',
        appreciation: irrValues.appreciation * 100,
        interest: irrValues.interest * 100,
        managementFees: -irrValues.managementFeeImpact * 100,
        total: irrValues.fundIrr * 100,
        dollarAppreciation: irrValues.appreciationDollar,
        dollarInterest: irrValues.interestDollar,
        dollarManagementFees: -irrValues.managementFeesDollar,
        dollarTotal: irrValues.appreciationDollar + irrValues.interestDollar - irrValues.managementFeesDollar
      },
      {
        name: 'LP IRR',
        appreciation: irrValues.appreciation * 100,
        interest: irrValues.interest * 100,
        managementFees: -irrValues.managementFeeImpact * 100,
        carriedInterest: -irrValues.carriedInterestImpact * 100,
        total: irrValues.lpIrr * 100,
        dollarAppreciation: irrValues.appreciationDollar,
        dollarInterest: irrValues.interestDollar,
        dollarManagementFees: -irrValues.managementFeesDollar,
        dollarCarriedInterest: -irrValues.carriedInterestDollar,
        dollarTotal: irrValues.appreciationDollar + irrValues.interestDollar - irrValues.managementFeesDollar - irrValues.carriedInterestDollar
      }
    ];
  }, [irrValues]);

  // Format tooltip values
  const formatTooltipValue = (value: number, name: string) => {
    if (showDollarValues) {
      return [`$${(value / 1000000).toFixed(1)}M`, name];
    }
    return [`${value.toFixed(1)}%`, name];
  };

  if (isLoading || !irrValues) {
    return <Skeleton className="w-full h-full" />;
  }

  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'stacked' | 'detailed')} className="w-[200px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stacked">Stacked</TabsTrigger>
              <TabsTrigger value="detailed">Detailed</TabsTrigger>
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

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-background/50 p-4 rounded border border-muted text-center">
          <div className="text-sm text-muted-foreground">Gross IRR</div>
          <div className="text-2xl font-bold text-green-600">{formatPercentage(irrValues.grossIrr)}</div>
          <div className="text-xs text-muted-foreground">Pre-fee return</div>
        </div>
        <div className="bg-background/50 p-4 rounded border border-muted text-center">
          <div className="text-sm text-muted-foreground">Fund IRR</div>
          <div className="text-2xl font-bold text-blue-600">{formatPercentage(irrValues.fundIrr)}</div>
          <div className="text-xs text-muted-foreground">After management fees</div>
        </div>
        <div className="bg-background/50 p-4 rounded border border-muted text-center">
          <div className="text-sm text-muted-foreground">LP IRR</div>
          <div className="text-2xl font-bold text-indigo-600">{formatPercentage(irrValues.lpIrr)}</div>
          <div className="text-xs text-muted-foreground">After all fees</div>
        </div>
      </div>

      <div className="h-[calc(100%-180px)]">
        {viewMode === 'stacked' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={stackedData}
              margin={{ top: 20, right: 30, left: 30, bottom: 50 }}
              barGap={0}
              barCategoryGap={60}
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
                    ? Math.ceil(Math.max(...stackedData.map(d => d.dollarTotal)) / 5000000) * 5000000 * 1.1
                    : Math.ceil(Math.max(...stackedData.map(d => d.total)) / 5) * 5 * 1.1
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
              <Tooltip formatter={formatTooltipValue} />
              <Legend verticalAlign="top" height={36} />

              <Bar
                dataKey={showDollarValues ? "dollarAppreciation" : "appreciation"}
                name="Appreciation"
                stackId="a"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  position="center"
                  formatter={(value: number) => value > 3 ? (showDollarValues ? `$${(value / 1000000).toFixed(1)}M` : `${value.toFixed(1)}%`) : ''}
                  fill="#fff"
                  fontWeight="bold"
                />
              </Bar>
              <Bar
                dataKey={showDollarValues ? "dollarInterest" : "interest"}
                name="Interest"
                stackId="a"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  position="center"
                  formatter={(value: number) => value > 3 ? (showDollarValues ? `$${(value / 1000000).toFixed(1)}M` : `${value.toFixed(1)}%`) : ''}
                  fill="#fff"
                  fontWeight="bold"
                />
              </Bar>
              <Bar
                dataKey={showDollarValues ? "dollarManagementFees" : "managementFees"}
                name="Management Fees"
                stackId="a"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  position="center"
                  formatter={(value: number) => value < -3 ? (showDollarValues ? `$${(value / 1000000).toFixed(1)}M` : `${value.toFixed(1)}%`) : ''}
                  fill="#fff"
                  fontWeight="bold"
                />
              </Bar>
              <Bar
                dataKey={showDollarValues ? "dollarCarriedInterest" : "carriedInterest"}
                name="Carried Interest"
                stackId="a"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  position="center"
                  formatter={(value: number) => value < -3 ? (showDollarValues ? `$${(value / 1000000).toFixed(1)}M` : `${value.toFixed(1)}%`) : ''}
                  fill="#fff"
                  fontWeight="bold"
                />
              </Bar>

              {/* Total line */}
              <Line
                type="monotone"
                dataKey={showDollarValues ? "dollarTotal" : "total"}
                name="Total"
                stroke="#000"
                strokeWidth={2}
                dot={{ r: 6, fill: "#fff", stroke: "#000", strokeWidth: 2 }}
              >
                <LabelList
                  position="top"
                  formatter={(value: number) => showDollarValues ? `$${(value / 1000000).toFixed(1)}M` : `${value.toFixed(1)}%`}
                  fill="#000"
                  fontWeight="bold"
                />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'detailed' && (
          <div className="grid grid-cols-3 gap-6 h-full">
            {/* Gross IRR Breakdown */}
            <div className="bg-background/50 p-4 rounded border border-muted flex flex-col">
              <h3 className="text-base font-semibold mb-4 text-green-600">Gross IRR Breakdown</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={[
                      {
                        name: 'Appreciation',
                        value: irrValues.appreciation * 100,
                        dollarValue: irrValues.appreciationDollar,
                        fill: '#3b82f6'
                      },
                      {
                        name: 'Interest',
                        value: irrValues.interest * 100,
                        dollarValue: irrValues.interestDollar,
                        fill: '#22c55e'
                      },
                      {
                        name: 'Gross IRR',
                        value: irrValues.grossIrr * 100,
                        dollarValue: irrValues.appreciationDollar + irrValues.interestDollar,
                        fill: '#22c55e',
                        isTotal: true
                      }
                    ]}
                    margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    barGap={0}
                    barCategoryGap={30}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis
                      tickFormatter={(value) => showDollarValues ? `$${(value / 1000000).toFixed(0)}M` : `${value}%`}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip formatter={formatTooltipValue} />
                    <Bar
                      dataKey={showDollarValues ? "dollarValue" : "value"}
                      radius={[4, 4, 0, 0]}
                    >
                      {[
                        { fill: '#3b82f6' },
                        { fill: '#22c55e' },
                        { fill: '#22c55e' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList
                        dataKey={showDollarValues ? "dollarValue" : "value"}
                        position="top"
                        formatter={(value: number) => showDollarValues ? `$${(value / 1000000).toFixed(1)}M` : `${value.toFixed(1)}%`}
                        fontSize={10}
                      />
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-xs">
                <div className="flex justify-between border-t pt-2">
                  <span>Appreciation</span>
                  <span className="font-semibold">{formatPercentage(irrValues.appreciation)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Interest</span>
                  <span className="font-semibold">{formatPercentage(irrValues.interest)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed pt-2 font-semibold">
                  <span>Gross IRR</span>
                  <span className="text-green-600">{formatPercentage(irrValues.grossIrr)}</span>
                </div>
              </div>
            </div>

            {/* Fund IRR Breakdown */}
            <div className="bg-background/50 p-4 rounded border border-muted flex flex-col">
              <h3 className="text-base font-semibold mb-4 text-blue-600">Fund IRR Breakdown</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={[
                      {
                        name: 'Gross IRR',
                        value: irrValues.grossIrr * 100,
                        dollarValue: irrValues.appreciationDollar + irrValues.interestDollar,
                        fill: '#22c55e'
                      },
                      {
                        name: 'Mgmt Fees',
                        value: -irrValues.managementFeeImpact * 100,
                        dollarValue: -irrValues.managementFeesDollar,
                        fill: '#ef4444'
                      },
                      {
                        name: 'Fund IRR',
                        value: irrValues.fundIrr * 100,
                        dollarValue: irrValues.appreciationDollar + irrValues.interestDollar - irrValues.managementFeesDollar,
                        fill: '#3b82f6',
                        isTotal: true
                      }
                    ]}
                    margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    barGap={0}
                    barCategoryGap={30}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis
                      tickFormatter={(value) => showDollarValues ? `$${(value / 1000000).toFixed(0)}M` : `${value}%`}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip formatter={formatTooltipValue} />
                    <Bar
                      dataKey={showDollarValues ? "dollarValue" : "value"}
                      radius={[4, 4, 0, 0]}
                    >
                      {[
                        { fill: '#22c55e' },
                        { fill: '#ef4444' },
                        { fill: '#3b82f6' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList
                        dataKey={showDollarValues ? "dollarValue" : "value"}
                        position="top"
                        formatter={(value: number) => showDollarValues ? `$${(value / 1000000).toFixed(1)}M` : `${value.toFixed(1)}%`}
                        fontSize={10}
                      />
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-xs">
                <div className="flex justify-between border-t pt-2">
                  <span>Gross IRR</span>
                  <span className="font-semibold text-green-600">{formatPercentage(irrValues.grossIrr)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Management Fees</span>
                  <span className="font-semibold text-red-600">-{formatPercentage(irrValues.managementFeeImpact)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed pt-2 font-semibold">
                  <span>Fund IRR</span>
                  <span className="text-blue-600">{formatPercentage(irrValues.fundIrr)}</span>
                </div>
              </div>
            </div>

            {/* LP IRR Breakdown */}
            <div className="bg-background/50 p-4 rounded border border-muted flex flex-col">
              <h3 className="text-base font-semibold mb-4 text-indigo-600">LP IRR Breakdown</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={[
                      {
                        name: 'Fund IRR',
                        value: irrValues.fundIrr * 100,
                        dollarValue: irrValues.appreciationDollar + irrValues.interestDollar - irrValues.managementFeesDollar,
                        fill: '#3b82f6'
                      },
                      {
                        name: 'Carried Int',
                        value: -irrValues.carriedInterestImpact * 100,
                        dollarValue: -irrValues.carriedInterestDollar,
                        fill: '#f97316'
                      },
                      {
                        name: 'LP IRR',
                        value: irrValues.lpIrr * 100,
                        dollarValue: irrValues.appreciationDollar + irrValues.interestDollar - irrValues.managementFeesDollar - irrValues.carriedInterestDollar,
                        fill: '#6366f1',
                        isTotal: true
                      }
                    ]}
                    margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    barGap={0}
                    barCategoryGap={30}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis
                      tickFormatter={(value) => showDollarValues ? `$${(value / 1000000).toFixed(0)}M` : `${value}%`}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip formatter={formatTooltipValue} />
                    <Bar
                      dataKey={showDollarValues ? "dollarValue" : "value"}
                      radius={[4, 4, 0, 0]}
                    >
                      {[
                        { fill: '#3b82f6' },
                        { fill: '#f97316' },
                        { fill: '#6366f1' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList
                        dataKey={showDollarValues ? "dollarValue" : "value"}
                        position="top"
                        formatter={(value: number) => showDollarValues ? `$${(value / 1000000).toFixed(1)}M` : `${value.toFixed(1)}%`}
                        fontSize={10}
                      />
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-xs">
                <div className="flex justify-between border-t pt-2">
                  <span>Fund IRR</span>
                  <span className="font-semibold text-blue-600">{formatPercentage(irrValues.fundIrr)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Carried Interest</span>
                  <span className="font-semibold text-orange-600">-{formatPercentage(irrValues.carriedInterestImpact)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed pt-2 font-semibold">
                  <span>LP IRR</span>
                  <span className="text-indigo-600">{formatPercentage(irrValues.lpIrr)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
