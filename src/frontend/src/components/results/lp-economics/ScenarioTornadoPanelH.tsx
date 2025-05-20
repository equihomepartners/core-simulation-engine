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
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPercentage, formatNumber } from '@/lib/formatters';
import { LogLevel, LogCategory, log } from '@/utils/logging';

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

interface SensitivityData {
  parameter: string;
  impact: number;
  correlation: number;
}

interface BreachedMetric {
  metric: string;
  threshold: number;
  value: number;
  severity: 'high' | 'medium' | 'low';
}

interface ScenarioTornadoPanelHProps {
  simulation: any;
  results: any;
  isLoading: boolean;
}

type ScenarioType = 'base' | 'rate_increase' | 'price_dip' | 'airport_corridor';

// Custom tooltip for tornado chart
const CustomTornadoTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-xs">
        <p className="font-semibold">{label}</p>
        <p>Impact on IRR: {formatPercentage(payload[0].value)}</p>
        <p>Correlation: {formatNumber(payload[0].payload.correlation, 2)}</p>
      </div>
    );
  }
  return null;
};

export function ScenarioTornadoPanelH({ simulation, results, isLoading }: ScenarioTornadoPanelHProps) {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('base');
  
  // Process sensitivity data for tornado chart
  const sensitivityData = useMemo(() => {
    if (!results || !results.sensitivity) return [];
    
    try {
      // Get sensitivity data for the selected scenario
      const scenarioData = results.sensitivity[selectedScenario] || results.sensitivity;
      
      if (!Array.isArray(scenarioData)) return [];
      
      // Map and sort by absolute impact
      return scenarioData
        .map((item: any) => ({
          parameter: item.parameter || '',
          impact: item.impact || 0,
          correlation: item.correlation || 0
        }))
        .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    } catch (error) {
      console.error('Error processing sensitivity data:', error);
      return [];
    }
  }, [results, selectedScenario]);
  
  // Process breached metrics data
  const breachedMetrics = useMemo(() => {
    if (!results || !results.breached_metrics) return [];
    
    try {
      // Get breached metrics for the selected scenario
      const scenarioMetrics = results.breached_metrics?.[selectedScenario] || [];
      
      if (!Array.isArray(scenarioMetrics)) return [];
      
      // Map and sort by severity
      return scenarioMetrics
        .map((item: any) => ({
          metric: item.metric || '',
          threshold: item.threshold || 0,
          value: item.value || 0,
          severity: item.severity || 'medium'
        }))
        .sort((a, b) => {
          const severityOrder = { high: 0, medium: 1, low: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        });
    } catch (error) {
      console.error('Error processing breached metrics:', error);
      return [];
    }
  }, [results, selectedScenario]);
  
  // If no real data, create placeholder data
  const displaySensitivityData = useMemo(() => {
    if (sensitivityData.length > 0) return sensitivityData;
    
    // Create placeholder data if no real data available
    return [
      { parameter: 'Exit Lag', impact: 0.025, correlation: 0.85 },
      { parameter: 'Interest Rate', impact: -0.018, correlation: -0.72 },
      { parameter: 'Default Rate', impact: -0.015, correlation: -0.68 },
      { parameter: 'Property Appreciation', impact: 0.012, correlation: 0.65 },
      { parameter: 'Leverage Cost', impact: -0.008, correlation: -0.45 }
    ];
  }, [sensitivityData]);
  
  // If no real data, create placeholder breached metrics
  const displayBreachedMetrics = useMemo(() => {
    if (breachedMetrics.length > 0) return breachedMetrics;
    
    // Create placeholder data if no real data available
    if (selectedScenario === 'base') return [];
    
    return [
      { metric: 'Liquidity Buffer', threshold: 0.04, value: 0.02, severity: 'high' },
      { metric: 'Leverage Utilization', threshold: 0.30, value: 0.35, severity: 'medium' },
      { metric: 'Default Rate', threshold: 0.05, value: 0.07, severity: 'medium' }
    ] as BreachedMetric[];
  }, [breachedMetrics, selectedScenario]);
  
  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />;
  }
  
  return (
    <Card className="border border-gray-200">
      <CardHeader className="py-3 px-4 border-b border-gray-200">
        <CardTitle className="text-base font-semibold text-[#0B1C3F]">Scenario Toggle & Tornado Panel</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Scenario Toggle Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedScenario === 'base' ? 'default' : 'outline'} 
              onClick={() => setSelectedScenario('base')}
              className={selectedScenario === 'base' ? 'bg-[#0B1C3F]' : ''}
            >
              Base
            </Button>
            <Button 
              variant={selectedScenario === 'rate_increase' ? 'default' : 'outline'} 
              onClick={() => setSelectedScenario('rate_increase')}
              className={selectedScenario === 'rate_increase' ? 'bg-[#0B1C3F]' : ''}
            >
              Rate +200 bp
            </Button>
            <Button 
              variant={selectedScenario === 'price_dip' ? 'default' : 'outline'} 
              onClick={() => setSelectedScenario('price_dip')}
              className={selectedScenario === 'price_dip' ? 'bg-[#0B1C3F]' : ''}
            >
              10% Sydney Price Dip
            </Button>
            <Button 
              variant={selectedScenario === 'airport_corridor' ? 'default' : 'outline'} 
              onClick={() => setSelectedScenario('airport_corridor')}
              className={selectedScenario === 'airport_corridor' ? 'bg-[#0B1C3F]' : ''}
            >
              Airport-corridor Uplift
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tornado Chart */}
            <div className="h-[250px]">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Sensitivity Analysis</h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={displaySensitivityData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLines} />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => formatPercentage(value)}
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="parameter" 
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTornadoTooltip />} />
                  <Legend />
                  <ReferenceLine x={0} stroke={COLORS.midnight} />
                  <Bar dataKey="impact" name="Impact on IRR">
                    {displaySensitivityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.impact > 0 ? COLORS.positive : COLORS.negative} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Breached Metrics Table */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {displayBreachedMetrics.length > 0 
                  ? 'Top Metrics Breached Under Scenario' 
                  : 'No Metrics Breached Under This Scenario'}
              </h3>
              {displayBreachedMetrics.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Threshold</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Severity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayBreachedMetrics.map((metric, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{metric.metric}</TableCell>
                        <TableCell>{formatPercentage(metric.threshold)}</TableCell>
                        <TableCell>{formatPercentage(metric.value)}</TableCell>
                        <TableCell>
                          <span 
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              metric.severity === 'high' 
                                ? 'bg-red-100 text-red-800' 
                                : metric.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {metric.severity.charAt(0).toUpperCase() + metric.severity.slice(1)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-[200px] border rounded-md bg-gray-50">
                  <p className="text-gray-500">All metrics within acceptable thresholds</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
