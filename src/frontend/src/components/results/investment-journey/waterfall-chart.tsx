import React from 'react';
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
  Label
} from 'recharts';
import { formatCurrency, formatPercentage } from '@/utils/format';

interface WaterfallItem {
  name: string;
  value: number;
  percentage?: string;
  color?: string;
  description?: string;
  isTotal?: boolean;
  isPreferred?: boolean;
  isGpCatchup?: boolean;
  isCarry?: boolean;
  isPositive?: boolean;
  isNegative?: boolean;
}

interface AmericanWaterfallChartProps {
  data: WaterfallItem[];
  height?: number;
  showPercentages?: boolean;
  title?: string;
}

export function AmericanWaterfallChart({
  data,
  height = 350,
  showPercentages = true,
  title = 'Distribution Waterfall'
}: AmericanWaterfallChartProps) {
  // Default colors if not specified in the data
  const defaultColors = {
    return: '#22c55e',      // green
    preferred: '#3b82f6',   // blue
    catchup: '#f97316',     // orange
    carry: '#8b5cf6',       // purple
    total: '#64748b',       // slate
    default: '#94a3b8'      // slate-400
  };

  // Custom tooltip for the waterfall chart
  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-background border rounded-md shadow-sm p-3 max-w-xs">
          <p className="font-medium text-sm mb-2">{data.name}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span>Amount:</span>
              <span className="font-medium">
                {data.value < 0 ? '-' : ''}
                {formatCurrency(Math.abs(data.value))}
              </span>
            </div>
            {showPercentages && data.percentage && (
              <div className="flex justify-between items-center text-xs">
                <span>Percentage:</span>
                <span className="font-medium">{data.percentage}</span>
              </div>
            )}
            {data.description && (
              <div className="mt-2 text-xs text-muted-foreground">
                {data.description}
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // Fill in missing colors based on item type
  const processedData = data.map(item => {
    let color = item.color;

    if (!color) {
      if (item.isTotal) {
        color = defaultColors.total;
      } else if (item.isPreferred) {
        color = defaultColors.preferred;
      } else if (item.isGpCatchup) {
        color = defaultColors.catchup;
      } else if (item.isCarry) {
        color = defaultColors.carry;
      } else if (item.isNegative) {
        color = '#ef4444'; // red-500
      } else if (item.isPositive) {
        color = '#10b981'; // green-500
      } else {
        color = defaultColors.default;
      }
    }

    return {
      ...item,
      color
    };
  });

  // Custom bar fill function for the bar chart
  const getBarFill = (entry: WaterfallItem) => {
    return entry.color || defaultColors.default;
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      {title && <h3 className="text-lg font-medium mb-4">{title}</h3>}
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            margin={{ top: 20, right: 30, left: 30, bottom: 50 }}
            barCategoryGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              yAxisId="primary"
              tickFormatter={(value) => {
                // Format as percentage if all values are small (likely IRR percentages)
                const isPercentage = data.every(item => Math.abs(item.value) < 100);
                return isPercentage
                  ? formatPercentage(value / 100)
                  : formatCurrency(value, { maximumFractionDigits: 0 });
              }}
              tick={{ fontSize: 12 }}
            >
              <Label
                value={data.every(item => Math.abs(item.value) < 100) ? "Percentage (%)" : "Amount ($)"}
                position="left"
                angle={-90}
                offset={-20}
                style={{ textAnchor: 'middle' }}
              />
            </YAxis>
            <Tooltip content={customTooltip} />
            <ReferenceLine y={0} stroke="#000" yAxisId="primary" />
            <Bar
              yAxisId="primary"
              dataKey="value"
              name={data.every(item => Math.abs(item.value) < 100) ? "IRR Component" : "Distribution"}
              radius={[4, 4, 0, 0]}
              fill={defaultColors.default} // Default fill color
              fillOpacity={0.9}
              isAnimationActive={true}
              animationDuration={1000}
              animationBegin={200}
            />

            {/* Add a custom legend that uses the correct colors */}
            <Legend
              content={(props) => {
                const { payload } = props;
                return (
                  <ul className="flex flex-wrap justify-center gap-4 mt-2">
                    {processedData.map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <svg width="16" height="16">
                          <rect width="16" height="16" fill={item.color || defaultColors.default} />
                        </svg>
                        <span className="text-xs">{item.name}</span>
                      </li>
                    ))}
                  </ul>
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}