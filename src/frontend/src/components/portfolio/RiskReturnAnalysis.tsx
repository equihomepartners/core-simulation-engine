import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ReferenceLine,
} from 'recharts';
import { formatCurrency, formatPercentage, formatMultiple } from '../../lib/formatters';

interface RiskReturnAnalysisProps {
  data: any;
  isLoading: boolean;
}

const RiskReturnAnalysis: React.FC<RiskReturnAnalysisProps> = ({ data, isLoading }) => {
  const [analysisType, setAnalysisType] = useState<'irr' | 'multiple' | 'risk'>('irr');

  // Extract performance metrics
  const performanceMetrics = data?.performance_metrics || data?.performanceMetrics || {};

  // IRR Components
  const irrDetails = performanceMetrics?.irr_details || performanceMetrics?.irrDetails || {};
  const irrComponents = [
    { name: 'Base IRR', value: irrDetails?.base_irr || irrDetails?.baseIrr || 0, color: '#10b981' },
    { name: 'Fees Impact', value: irrDetails?.fees_impact || irrDetails?.feesImpact || 0, color: '#ef4444' },
    { name: 'Expenses Impact', value: irrDetails?.expenses_impact || irrDetails?.expensesImpact || 0, color: '#f59e0b' },
    { name: 'Timing Impact', value: irrDetails?.timing_impact || irrDetails?.timingImpact || 0, color: '#3b82f6' },
  ];

  // Equity Multiple Components
  const equityMultipleDetails = performanceMetrics?.equity_multiple_details || performanceMetrics?.equityMultipleDetails || {};
  const multipleComponents = [
    { name: 'Principal', value: 1, color: '#6b7280' },
    { name: 'Interest', value: equityMultipleDetails?.interest_component || equityMultipleDetails?.interestComponent || 0, color: '#10b981' },
    { name: 'Appreciation', value: equityMultipleDetails?.appreciation_component || equityMultipleDetails?.appreciationComponent || 0, color: '#3b82f6' },
    { name: 'Fees', value: -(equityMultipleDetails?.fees_component || equityMultipleDetails?.feesComponent || 0), color: '#ef4444' },
    { name: 'Expenses', value: -(equityMultipleDetails?.expenses_component || equityMultipleDetails?.expensesComponent || 0), color: '#f59e0b' },
  ].filter(item => item.value !== 0);

  // Risk Metrics
  const riskMetrics = performanceMetrics?.risk_metrics || performanceMetrics?.riskMetrics || {};
  const riskRadarData = [
    { metric: 'Volatility', value: riskMetrics?.volatility || 0, fullMark: 0.2 },
    { metric: 'Drawdown', value: riskMetrics?.max_drawdown || riskMetrics?.maxDrawdown || 0, fullMark: 0.3 },
    { metric: 'Default Rate', value: riskMetrics?.default_rate || riskMetrics?.defaultRate || 0, fullMark: 0.1 },
    { metric: 'Concentration', value: riskMetrics?.concentration_risk || riskMetrics?.concentrationRisk || 0, fullMark: 0.5 },
    { metric: 'Timing Risk', value: riskMetrics?.timing_risk || riskMetrics?.timingRisk || 0, fullMark: 0.4 },
  ];

  // Distribution Metrics
  const distributionMetrics = performanceMetrics?.distribution_metrics || performanceMetrics?.distributionMetrics || {};
  const distributionData = Object.entries(distributionMetrics).map(([year, amount]: [string, any]) => ({
    year: Number(year),
    amount: typeof amount === 'number' ? amount : 0,
  })).sort((a, b) => a.year - b.year);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Risk & Return Analysis</CardTitle>
            <CardDescription>Detailed breakdown of returns and risk factors</CardDescription>
          </div>
          <Tabs
            value={analysisType}
            onValueChange={(value) => setAnalysisType(value as 'irr' | 'multiple' | 'risk')}
            className="w-[300px]"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="irr">IRR Components</TabsTrigger>
              <TabsTrigger value="multiple">Multiple Breakdown</TabsTrigger>
              <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[300px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : analysisType === 'irr' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={irrComponents}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${(value * 100).toFixed(1)}%`} />
                  <Tooltip
                    formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Value']}
                  />
                  <Legend />
                  <Bar dataKey="value" name="IRR Component">
                    {irrComponents.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                  <ReferenceLine y={0} stroke="#000" />
                </BarChart>
              </ResponsiveContainer>
            ) : analysisType === 'multiple' ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={multipleComponents}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name} (${value.toFixed(2)}x)`}
                  >
                    {multipleComponents.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name) => [`${value.toFixed(2)}x`, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius={80} data={riskRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                  <Radar
                    name="Risk Metrics"
                    dataKey="value"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Value']}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Performance Summary</h3>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">IRR:</span>
                    <span className="text-lg font-medium">
                      {formatPercentage(performanceMetrics?.irr || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Equity Multiple:</span>
                    <span className="text-lg font-medium">
                      {formatMultiple(performanceMetrics?.equity_multiple || performanceMetrics?.equityMultiple || performanceMetrics?.moic || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">ROI:</span>
                    <span className="text-lg font-medium">
                      {formatPercentage(performanceMetrics?.roi || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Payback Period:</span>
                    <span className="text-lg font-medium">
                      {performanceMetrics?.payback_period || performanceMetrics?.paybackPeriod || 'N/A'} years
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">DPI:</span>
                    <span className="text-lg font-medium">
                      {formatMultiple(performanceMetrics?.dpi || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">RVPI:</span>
                    <span className="text-lg font-medium">
                      {formatMultiple(performanceMetrics?.rvpi || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">TVPI:</span>
                    <span className="text-lg font-medium">
                      {formatMultiple(performanceMetrics?.tvpi || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskReturnAnalysis;
