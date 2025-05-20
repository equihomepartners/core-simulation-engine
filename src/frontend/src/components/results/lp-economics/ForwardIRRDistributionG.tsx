import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { formatPercentage } from '@/lib/formatters';
import { LogLevel, LogCategory, log } from '@/utils/logging';

// Define color constants
const COLORS = {
  midnight: '#0B1C3F',
  steel: '#314C7E',
  aqua: '#00A0B0',
  green: '#4CAF50',
  yellow: '#FFC107',
  red: '#F44336',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  background: '#FFFFFF',
  gridLines: '#E5E7EB'
};

interface IRRDistributionPoint {
  zone: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  negCashFlowProb?: number;
}

interface ForwardIRRDistributionGProps {
  simulation: any;
  results: any;
  isLoading: boolean;
}

// Custom tooltip for IRR distribution
const CustomIRRTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-xs">
        <p className="font-semibold">{label}</p>
        <p>P50 (Median): {formatPercentage(payload.find((p: any) => p.dataKey === 'p50')?.value || 0)}</p>
        <p>P25-P75 Range: {formatPercentage(payload.find((p: any) => p.dataKey === 'p25')?.value || 0)} - {formatPercentage(payload.find((p: any) => p.dataKey === 'p75')?.value || 0)}</p>
        <p>P10-P90 Range: {formatPercentage(payload.find((p: any) => p.dataKey === 'p10')?.value || 0)} - {formatPercentage(payload.find((p: any) => p.dataKey === 'p90')?.value || 0)}</p>
        {payload[0].payload.negCashFlowProb !== undefined && (
          <p>Neg. Cash Flow Prob: {formatPercentage(payload[0].payload.negCashFlowProb)}</p>
        )}
      </div>
    );
  }
  return null;
};

export function ForwardIRRDistributionG({ simulation, results, isLoading }: ForwardIRRDistributionGProps) {
  const [showNegCashFlowProb, setShowNegCashFlowProb] = useState<boolean>(false);

  // Process IRR distribution data
  const irrDistributionData = useMemo(() => {
    if (!results || !results.monte_carlo_results) {
      log(LogLevel.INFO, LogCategory.DATA, 'No Monte Carlo results available for IRR distribution');
      return [];
    }

    try {
      const mcResults = results.monte_carlo_results;
      if (!mcResults.zone_irrs) {
        log(LogLevel.INFO, LogCategory.DATA, 'No zone IRRs available in Monte Carlo results');
        return [];
      }

      const zoneIRRs = mcResults.zone_irrs;

      // Extract IRR distributions by zone
      const zones = Object.keys(zoneIRRs);
      if (zones.length === 0) {
        log(LogLevel.INFO, LogCategory.DATA, 'No zones found in zone IRRs data');
        return [];
      }

      const zoneData = zones.map(zone => {
        const zoneData = zoneIRRs[zone] || {};

        // Skip zones with missing percentile data
        if (!zoneData.percentiles) {
          log(LogLevel.INFO, LogCategory.DATA, `Zone ${zone} has no percentile data`);
          return null;
        }

        const percentiles = zoneData.percentiles;

        // Skip zones with incomplete percentile data
        if (!percentiles.p10 || !percentiles.p25 || !percentiles.p50 ||
            !percentiles.p75 || !percentiles.p90) {
          log(LogLevel.INFO, LogCategory.DATA, `Zone ${zone} has incomplete percentile data`);
          return null;
        }

        return {
          zone,
          p10: percentiles.p10,
          p25: percentiles.p25,
          p50: percentiles.p50,
          p75: percentiles.p75,
          p90: percentiles.p90,
          negCashFlowProb: zoneData.negative_cash_flow_probability || 0
        };
      }).filter(Boolean); // Remove null entries

      if (zoneData.length === 0) {
        log(LogLevel.INFO, LogCategory.DATA, 'No valid zone data after filtering');
      }

      return zoneData;
    } catch (error) {
      console.error('Error processing IRR distribution data:', error);
      log(LogLevel.ERROR, LogCategory.DATA, `Error processing IRR distribution data: ${error}`);
      return [];
    }
  }, [results]);

  // Use only real data, no fallbacks
  const hasData = irrDistributionData.length > 0;

  if (isLoading) {
    return <Skeleton className="h-[150px] w-full" />;
  }

  // Get zone color
  const getZoneColor = (zone: string) => {
    if (zone.toLowerCase().includes('green')) return COLORS.green;
    if (zone.toLowerCase().includes('yellow') || zone.toLowerCase().includes('orange')) return COLORS.yellow;
    if (zone.toLowerCase().includes('red')) return COLORS.red;
    return COLORS.steel; // Default for "Overall" or other zones
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="py-3 px-4 border-b border-gray-200 flex flex-row justify-between items-center">
        <CardTitle className="text-base font-semibold text-[#0B1C3F]">Forward IRR Distribution Ribbon</CardTitle>
        {hasData && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="showNegCashFlow"
                checked={showNegCashFlowProb}
                onCheckedChange={setShowNegCashFlowProb}
                className="data-[state=checked]:bg-[#314C7E]"
              />
              <Label htmlFor="showNegCashFlow" className="text-xs">Show Negative Cash-Flow Probability</Label>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4">
        {!hasData ? (
          <div className="h-[150px] flex items-center justify-center flex-col">
            <p className="text-sm text-muted-foreground">No IRR distribution data available</p>
            <p className="text-xs text-muted-foreground mt-1">Run Monte Carlo simulation to generate IRR distributions by zone</p>
          </div>
        ) : (
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={irrDistributionData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLines} />
                <XAxis
                  dataKey="zone"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(value) => formatPercentage(value)}
                  domain={[0, 'dataMax']}
                  tick={{ fontSize: 12 }}
                  label={{ value: showNegCashFlowProb ? 'Probability' : 'IRR', angle: -90, position: 'insideLeft', offset: 0, fontSize: 12 }}
                />
                {!showNegCashFlowProb ? (
                  // IRR Distribution View
                  <>
                    {/* P10-P90 Range */}
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="p10"
                      stackId="1"
                      stroke="none"
                      fill="none"
                      name="P10-P90 Range"
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="p90"
                      stackId="1"
                      stroke="none"
                      fill={COLORS.steel} // Use a static color
                      fillOpacity={0.2}
                      name="P10-P90 Range"
                    >
                      {/* Use Cell components to apply dynamic colors */}
                      {irrDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getZoneColor(entry.zone)} />
                      ))}
                    </Area>

                    {/* P25-P75 Range */}
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="p25"
                      stackId="2"
                      stroke="none"
                      fill="none"
                      name="P25-P75 Range"
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="p75"
                      stackId="2"
                      stroke="none"
                      fill={COLORS.steel} // Use a static color
                      fillOpacity={0.4}
                      name="P25-P75 Range"
                    >
                      {/* Use Cell components to apply dynamic colors */}
                      {irrDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getZoneColor(entry.zone)} />
                      ))}
                    </Area>

                    {/* P50 (Median) Line */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="p50"
                      stroke={COLORS.steel} // Use a static color instead of a function
                      strokeWidth={2}
                      dot={false} // Disable default dots and use custom dots via Cell
                      name="P50 (Median)"
                    >
                      {/* Use Cell components to apply dynamic colors */}
                      {irrDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} stroke={getZoneColor(entry.zone)} fill={getZoneColor(entry.zone)} />
                      ))}
                    </Line>

                    {/* Reference line for hurdle rate if available */}
                    {simulation?.config?.hurdle_rate && (
                      <ReferenceLine
                        y={simulation.config.hurdle_rate}
                        yAxisId="left"
                        stroke={COLORS.midnight}
                        strokeDasharray="3 3"
                        label={{ value: 'Hurdle', position: 'right', fontSize: 10 }}
                      />
                    )}
                  </>
                ) : (
                  // Negative Cash Flow Probability View
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="negCashFlowProb"
                    stroke={COLORS.red}
                    strokeWidth={2}
                    dot={{ r: 5, fill: COLORS.red }}
                    name="Negative Cash-Flow Probability"
                  />
                )}
                <Tooltip content={<CustomIRRTooltip />} />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
