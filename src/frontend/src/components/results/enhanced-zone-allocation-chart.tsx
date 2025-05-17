import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatPercentage, formatCurrency } from '@/lib/formatters';

// Helper function to get color for zone
const getZoneColor = (zoneName: string): string => {
  const zoneColors: Record<string, string> = {
    'zone_1': '#3b82f6', // blue
    'zone_2': '#22c55e', // green
    'zone_3': '#eab308', // yellow
    'zone_4': '#ef4444', // red
    'zone_5': '#6366f1', // indigo
    'other': '#a855f7',  // purple
    'Green Zone': '#10b981', // emerald
    'Orange Zone': '#f59e0b', // amber
    'Red Zone': '#ef4444', // red
  };

  return zoneColors[zoneName] || '#a855f7'; // purple as default
};

interface EnhancedZoneAllocationChartProps {
  data: any;
  isLoading?: boolean;
}

export function EnhancedZoneAllocationChart({ data, isLoading = false }: EnhancedZoneAllocationChartProps) {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [activeIndex, setActiveIndex] = useState(0);

  // Process zone allocation data for the chart with camelCase/snake_case handling
  const chartData = React.useMemo(() => {
    if (isLoading || !data) return [];

    // Log the data structure for debugging
    log(LogLevel.DEBUG, LogCategory.DATA, 'EnhancedZoneAllocationChart data structure:', {
      hasZoneAllocation: !!data.zone_allocation || !!data.zoneAllocation,
      hasPortfolio: !!data.portfolio,
      hasPortfolioZoneAllocation: !!(data.portfolio?.zone_allocation || data.portfolio?.zoneAllocation),
      hasZoneDistribution: !!(data.portfolio?.zone_distribution || data.portfolio?.zoneDistribution)
    });

    // Get fund size with fallbacks for both camelCase and snake_case
    const fundSize = data.fund_size || data.fundSize || 100000000;

    // Try to get zone allocation from different sources
    let zoneData = null;

    // Format 1: Direct zone_allocation in results (handle both camelCase and snake_case)
    if (data.zone_allocation || data.zoneAllocation) {
      zoneData = data.zone_allocation || data.zoneAllocation;
      log(LogLevel.DEBUG, LogCategory.DATA, 'Using direct zone_allocation data');
    }
    // Format 2: portfolio.zone_allocation (handle both camelCase and snake_case)
    else if (data.portfolio && (data.portfolio.zone_allocation || data.portfolio.zoneAllocation)) {
      zoneData = data.portfolio.zone_allocation || data.portfolio.zoneAllocation;
      log(LogLevel.DEBUG, LogCategory.DATA, 'Using portfolio.zone_allocation data');
    }
    // Format 3: portfolio.zone_distribution (handle both camelCase and snake_case)
    else if (data.portfolio && (data.portfolio.zone_distribution || data.portfolio.zoneDistribution)) {
      const zoneDistribution = data.portfolio.zone_distribution || data.portfolio.zoneDistribution;

      // Convert zone_distribution to zone_allocation format
      zoneData = {};

      // Handle different zone_distribution formats
      if (zoneDistribution.green && typeof zoneDistribution.green === 'object') {
        // Format: { green: { percentage: 0.6 }, orange: { percentage: 0.3 }, red: { percentage: 0.1 } }
        zoneData = {
          green: zoneDistribution.green.percentage || 0,
          orange: zoneDistribution.orange.percentage || 0,
          red: zoneDistribution.red.percentage || 0
        };
      } else {
        // Format: { green: 0.6, orange: 0.3, red: 0.1 }
        zoneData = {
          green: zoneDistribution.green || 0,
          orange: zoneDistribution.orange || 0,
          red: zoneDistribution.red || 0
        };
      }

      log(LogLevel.DEBUG, LogCategory.DATA, 'Using portfolio.zone_distribution data');
    }

    // If we still don't have zone data, check for zone_counts
    if (!zoneData && data.portfolio && (data.portfolio.zone_counts || data.portfolio.zoneCounts)) {
      const zoneCounts = data.portfolio.zone_counts || data.portfolio.zoneCounts;
      const totalLoans = data.portfolio.total_loans || data.portfolio.totalLoans ||
                        (zoneCounts.green || 0) + (zoneCounts.orange || 0) + (zoneCounts.red || 0);

      if (totalLoans > 0) {
        zoneData = {
          green: (zoneCounts.green || 0) / totalLoans,
          orange: (zoneCounts.orange || 0) / totalLoans,
          red: (zoneCounts.red || 0) / totalLoans
        };

        log(LogLevel.DEBUG, LogCategory.DATA, 'Using portfolio.zone_counts data');
      }
    }

    // If we still don't have zone data, use default values
    if (!zoneData) {
      log(LogLevel.WARN, LogCategory.DATA, 'No zone allocation data found, using defaults');
      zoneData = {
        green: 0.6,
        orange: 0.3,
        red: 0.1
      };
    }

    // Handle special format with zones and values arrays
    if (zoneData.zones && Array.isArray(zoneData.zones) && zoneData.values && Array.isArray(zoneData.values)) {
      log(LogLevel.DEBUG, LogCategory.DATA, 'Using zones/values array format');

      return zoneData.zones.map((zone: string, index: number) => ({
        name: zone,
        value: zoneData.values[index] * fundSize, // Convert percentage to value
        percentage: zoneData.values[index],
        fill: zoneData.colors?.[index] || getZoneColor(zone)
      }));
    }

    // Handle standard object format
    log(LogLevel.DEBUG, LogCategory.DATA, 'Using standard object format');

    return Object.entries(zoneData)
      .filter(([key, value]) =>
        // Handle both camelCase and snake_case keys
        (key.startsWith('zone_') || key.startsWith('Zone') ||
         key === 'green' || key === 'orange' || key === 'red') &&
        typeof value === 'number' &&
        value > 0
      )
      .map(([key, value]) => {
        // Format the zone name for display
        let displayName = key;
        if (key.startsWith('zone_')) {
          displayName = key.replace('zone_', 'Zone ');
        } else if (key === 'green' || key === 'orange' || key === 'red') {
          displayName = `${key.charAt(0).toUpperCase() + key.slice(1)} Zone`;
        }

        return {
          name: displayName,
          value: value * fundSize, // Convert percentage to value
          percentage: value,
          fill: getZoneColor(displayName)
        };
      });
  }, [data, isLoading]);

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <p className="font-medium">{payload[0].name}</p>
          <p style={{ color: payload[0].color }}>
            {formatCurrency(payload[0].value)}
          </p>
          <p style={{ color: payload[0].color }}>
            {formatPercentage(payload[0].payload.percentage)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Active shape for pie chart
  const renderActiveShape = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

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
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" fontSize={12}>
          {payload.name}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" fontSize={12}>
          {formatCurrency(value)}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={36} textAnchor={textAnchor} fill="#999" fontSize={12}>
          {formatPercentage(payload.percentage)}
        </text>
      </g>
    );
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Zone Allocation</CardTitle>
          <CardDescription>Portfolio allocation by risk zone</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || chartData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Zone Allocation</CardTitle>
          <CardDescription>Portfolio allocation by risk zone</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">No zone allocation data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Zone Allocation</CardTitle>
            <CardDescription>Portfolio allocation by risk zone</CardDescription>
          </div>
          <Tabs value={chartType} onValueChange={(value) => setChartType(value as any)} className="w-[200px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pie">Pie</TabsTrigger>
              <TabsTrigger value="bar">Bar</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          {chartType === 'pie' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                >
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}

          {chartType === 'bar' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value, 0)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="value" name="Allocation">
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {chartData.map((zone: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 p-2 rounded-md border">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: zone.fill }}></div>
              <div className="flex-1">
                <div className="font-medium">{zone.name}</div>
                <div className="text-sm text-muted-foreground">{formatPercentage(zone.percentage)}</div>
              </div>
              <div className="font-medium">{formatCurrency(zone.value, 0)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
