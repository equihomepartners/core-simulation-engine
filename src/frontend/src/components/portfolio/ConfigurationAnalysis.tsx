import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { formatCurrency, formatPercentage, formatNumber, formatDecimal, formatMultiple } from '../../lib/formatters';

interface ConfigurationAnalysisProps {
  data: any;
  isLoading: boolean;
}

const ConfigurationAnalysis: React.FC<ConfigurationAnalysisProps> = ({ data, isLoading }) => {
  // Extract configuration and portfolio metrics
  const config = data?.config || {};
  const portfolioMetrics = data?.portfolio?.metrics || {};
  const portfolioEvolution = data?.portfolio_evolution || data?.portfolioEvolution || {};
  const loans = data?.portfolio?.loans || [];
  const performanceMetrics = data?.performance_metrics || data?.performanceMetrics || {};

  // Get the last year with data for current portfolio state
  const years = Object.keys(portfolioEvolution).map(Number).sort((a, b) => b - a);
  const lastYear = years[0]?.toString();
  const lastYearData = lastYear ? portfolioEvolution[lastYear] : null;

  // Zone allocation comparison
  const zoneDistribution = portfolioMetrics?.zone_distribution || portfolioMetrics?.zoneDistribution || {};
  const zoneAllocationData = [
    {
      name: 'Green Zone',
      target: config?.zone_allocations?.green || config?.zone_targets?.green || 0,
      actual: zoneDistribution?.green?.percentage || 0,
      variance: (zoneDistribution?.green?.percentage || 0) / (config?.zone_allocations?.green || config?.zone_targets?.green || 1) - 1,
      color: '#10b981'
    },
    {
      name: 'Orange Zone',
      target: config?.zone_allocations?.orange || config?.zone_targets?.orange || 0,
      actual: zoneDistribution?.orange?.percentage || 0,
      variance: (zoneDistribution?.orange?.percentage || 0) / (config?.zone_allocations?.orange || config?.zone_targets?.orange || 1) - 1,
      color: '#f59e0b'
    },
    {
      name: 'Red Zone',
      target: config?.zone_allocations?.red || config?.zone_targets?.red || 0,
      actual: zoneDistribution?.red?.percentage || 0,
      variance: (zoneDistribution?.red?.percentage || 0) / (config?.zone_allocations?.red || config?.zone_targets?.red || 1) - 1,
      color: '#ef4444'
    },
  ];

  // Calculate average loan size
  const avgLoanSize = portfolioMetrics?.total_loan_amount && portfolioMetrics?.loan_count
    ? portfolioMetrics.total_loan_amount / portfolioMetrics.loan_count
    : portfolioMetrics?.average_loan_size || portfolioMetrics?.averageLoanSize;

  // Calculate average property value
  const avgPropertyValue = portfolioMetrics?.total_property_value && portfolioMetrics?.loan_count
    ? portfolioMetrics.total_property_value / portfolioMetrics.loan_count
    : portfolioMetrics?.average_property_value || portfolioMetrics?.averagePropertyValue;

  // Calculate average loan term
  const avgLoanTerm = loans.length > 0
    ? loans.reduce((sum: number, loan: any) => sum + (loan.term || 0), 0) / loans.length
    : config?.avg_loan_term || config?.avgLoanTerm;

  // Calculate actual exit year
  const avgExitYear = loans.filter((loan: any) => loan.is_exited || loan.isExited).length > 0
    ? loans.filter((loan: any) => loan.is_exited || loan.isExited)
        .reduce((sum: number, loan: any) => sum + (loan.actual_exit_year || loan.actualExitYear || 0), 0) /
      loans.filter((loan: any) => loan.is_exited || loan.isExited).length
    : config?.avg_loan_exit_year || config?.avgLoanExitYear;

  // Calculate actual default rate
  const actualDefaultRate = lastYearData && (lastYearData.active_loans || lastYearData.activeLoans) > 0
    ? (lastYearData.defaulted_loans || lastYearData.defaultedLoans || 0) /
      ((lastYearData.active_loans || lastYearData.activeLoans) +
       (lastYearData.exited_loans || lastYearData.exitedLoans || 0))
    : portfolioMetrics?.expected_default_rate || portfolioMetrics?.expectedDefaultRate || 0;

  // Key metrics comparison
  const keyMetricsData = [
    {
      name: 'Loan Size',
      target: config?.avg_loan_size || 0,
      actual: avgLoanSize || 0,
      format: 'currency',
      category: 'loan',
    },
    {
      name: 'Property Value',
      target: config?.avg_property_value || (config?.avg_loan_size && config?.avg_loan_ltv ? config.avg_loan_size / config.avg_loan_ltv : 0),
      actual: avgPropertyValue || 0,
      format: 'currency',
      category: 'loan',
    },
    {
      name: 'LTV',
      target: config?.avg_loan_ltv || 0,
      actual: portfolioMetrics?.weighted_average_ltv || portfolioMetrics?.weightedAverageLtv || 0,
      format: 'percentage',
      category: 'loan',
    },
    {
      name: 'Interest Rate',
      target: config?.avg_loan_interest_rate || 0,
      actual: portfolioMetrics?.weighted_average_interest_rate || portfolioMetrics?.weightedAverageInterestRate || 0,
      format: 'percentage',
      category: 'loan',
    },
    {
      name: 'Loan Term',
      target: config?.avg_loan_term || 0,
      actual: avgLoanTerm || 0,
      format: 'decimal',
      category: 'loan',
    },
    {
      name: 'Exit Year',
      target: config?.avg_loan_exit_year || 0,
      actual: avgExitYear || 0,
      format: 'decimal',
      category: 'performance',
    },
    {
      name: 'Early Exit Rate',
      target: config?.early_exit_probability || 0,
      actual: portfolioMetrics?.early_exit_rate || portfolioMetrics?.earlyExitRate || 0,
      format: 'percentage',
      category: 'performance',
    },
    {
      name: 'Default Rate',
      target: config?.base_default_rate || 0,
      actual: actualDefaultRate,
      format: 'percentage',
      category: 'performance',
    },
    {
      name: 'Appreciation Rate',
      target: config?.base_appreciation_rate || 0,
      actual: portfolioMetrics?.weighted_average_appreciation_rate || portfolioMetrics?.weightedAverageAppreciationRate || 0,
      format: 'percentage',
      category: 'performance',
    },
    {
      name: 'IRR',
      target: config?.target_irr || 0,
      actual: performanceMetrics?.irr || 0,
      format: 'percentage',
      category: 'returns',
    },
    {
      name: 'Equity Multiple',
      target: config?.target_multiple || 0,
      actual: performanceMetrics?.equity_multiple || performanceMetrics?.equityMultiple || performanceMetrics?.moic || 0,
      format: 'multiple',
      category: 'returns',
    },
  ];

  // Risk radar data
  const riskRadarData = [
    {
      metric: 'Default Risk',
      value: actualDefaultRate / (config?.base_default_rate || 0.05),
      benchmark: 1,
      actualValue: actualDefaultRate,
      targetValue: config?.base_default_rate || 0.05,
      format: 'percentage',
    },
    {
      metric: 'LTV Risk',
      value: (portfolioMetrics?.weighted_average_ltv || portfolioMetrics?.weightedAverageLtv || 0) /
             (config?.avg_loan_ltv || 0.7),
      benchmark: 1,
      actualValue: portfolioMetrics?.weighted_average_ltv || portfolioMetrics?.weightedAverageLtv || 0,
      targetValue: config?.avg_loan_ltv || 0.7,
      format: 'percentage',
    },
    {
      metric: 'Zone Risk',
      value: (zoneDistribution?.red?.percentage || 0) /
             (config?.zone_allocations?.red || config?.zone_targets?.red || 0.1),
      benchmark: 1,
      actualValue: zoneDistribution?.red?.percentage || 0,
      targetValue: config?.zone_allocations?.red || config?.zone_targets?.red || 0.1,
      format: 'percentage',
    },
    {
      metric: 'Concentration',
      value: Math.max(
        (zoneDistribution?.green?.percentage || 0) / (config?.zone_allocations?.green || config?.zone_targets?.green || 0.6),
        (zoneDistribution?.orange?.percentage || 0) / (config?.zone_allocations?.orange || config?.zone_targets?.orange || 0.3),
        (zoneDistribution?.red?.percentage || 0) / (config?.zone_allocations?.red || config?.zone_targets?.red || 0.1)
      ),
      benchmark: 1,
      actualValue: Math.max(
        zoneDistribution?.green?.percentage || 0,
        zoneDistribution?.orange?.percentage || 0,
        zoneDistribution?.red?.percentage || 0
      ),
      targetValue: Math.max(
        config?.zone_allocations?.green || config?.zone_targets?.green || 0.6,
        config?.zone_allocations?.orange || config?.zone_targets?.orange || 0.3,
        config?.zone_allocations?.red || config?.zone_targets?.red || 0.1
      ),
      format: 'percentage',
    },
    {
      metric: 'Interest Rate',
      value: (portfolioMetrics?.weighted_average_interest_rate || portfolioMetrics?.weightedAverageInterestRate || 0) /
             (config?.avg_loan_interest_rate || 0.08),
      benchmark: 1,
      actualValue: portfolioMetrics?.weighted_average_interest_rate || portfolioMetrics?.weightedAverageInterestRate || 0,
      targetValue: config?.avg_loan_interest_rate || 0.08,
      format: 'percentage',
    },
    {
      metric: 'Appreciation',
      value: (portfolioMetrics?.weighted_average_appreciation_rate || portfolioMetrics?.weightedAverageAppreciationRate || 0) /
             (config?.base_appreciation_rate || 0.03),
      benchmark: 1,
      actualValue: portfolioMetrics?.weighted_average_appreciation_rate || portfolioMetrics?.weightedAverageAppreciationRate || 0,
      targetValue: config?.base_appreciation_rate || 0.03,
      format: 'percentage',
    },
  ];

  // Group metrics by category
  const loanMetrics = keyMetricsData.filter(metric => metric.category === 'loan');
  const performanceMetricsData = keyMetricsData.filter(metric => metric.category === 'performance');
  const returnsMetrics = keyMetricsData.filter(metric => metric.category === 'returns');

  // Format metric values based on their type
  const formatMetricValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'decimal':
        return value.toFixed(2);
      case 'multiple':
        return value.toFixed(2) + 'x';
      default:
        return value.toString();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configuration Analysis</CardTitle>
        <CardDescription>Comparison of target configuration vs. actual portfolio metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Zone Allocation Chart */}
          <div className="h-[300px]">
            <h3 className="text-lg font-medium mb-2">Zone Allocation</h3>
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={zoneAllocationData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip
                    formatter={(value: number, name) => [
                      `${(value * 100).toFixed(2)}%`,
                      name === 'target' ? 'Target Allocation' : 'Actual Allocation'
                    ]}
                    labelFormatter={(name) => `${name}`}
                  />
                  <Legend />
                  <Bar dataKey="target" name="Target Allocation" fill="#8884d8">
                    {zoneAllocationData.map((entry, index) => (
                      <Cell key={`cell-target-${index}`} fill="#8884d8" />
                    ))}
                  </Bar>
                  <Bar dataKey="actual" name="Actual Allocation">
                    {zoneAllocationData.map((entry, index) => (
                      <Cell key={`cell-actual-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Risk Profile Chart */}
          <div className="h-[300px]">
            <h3 className="text-lg font-medium mb-2">Risk Profile</h3>
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius={80} data={riskRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={30} domain={[0, Math.max(...riskRadarData.map(d => d.value)) * 1.2]} />
                  <Radar
                    name="Risk Ratio"
                    dataKey="value"
                    stroke="#ff7300"
                    fill="#ff7300"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Benchmark"
                    dataKey="benchmark"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Legend />
                  <Tooltip
                    formatter={(value: number, name, entry) => {
                      const item = entry.payload;
                      if (name === 'Risk Ratio') {
                        return [
                          <div>
                            <div>{value.toFixed(2)}</div>
                            <div>Actual: {formatMetricValue(item.actualValue, item.format)}</div>
                            <div>Target: {formatMetricValue(item.targetValue, item.format)}</div>
                          </div>,
                          item.metric
                        ];
                      }
                      return [value, name];
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Loan Metrics Table */}
          <div>
            <h3 className="text-lg font-medium mb-2">Loan Metrics</h3>
            {isLoading ? (
              <Skeleton className="w-full h-[200px]" />
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 text-left">Metric</th>
                      <th className="p-2 text-left">Target</th>
                      <th className="p-2 text-left">Actual</th>
                      <th className="p-2 text-left">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanMetrics.map((metric, index) => {
                      const variance = metric.target ? (metric.actual / metric.target - 1) : 0;
                      const formatter = (value: number) => formatMetricValue(value, metric.format);
                      const varianceClass = Math.abs(variance) > 0.1
                        ? (variance > 0 ? 'text-green-600' : 'text-red-600')
                        : 'text-green-600';

                      return (
                        <tr key={metric.name} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                          <td className="p-2 font-medium">{metric.name}</td>
                          <td className="p-2">{formatter(metric.target)}</td>
                          <td className="p-2">{formatter(metric.actual)}</td>
                          <td className={`p-2 ${varianceClass}`}>
                            {formatPercentage(variance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Performance Metrics Table */}
          <div>
            <h3 className="text-lg font-medium mb-2">Performance Metrics</h3>
            {isLoading ? (
              <Skeleton className="w-full h-[200px]" />
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 text-left">Metric</th>
                      <th className="p-2 text-left">Target</th>
                      <th className="p-2 text-left">Actual</th>
                      <th className="p-2 text-left">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceMetricsData.concat(returnsMetrics).map((metric, index) => {
                      const variance = metric.target ? (metric.actual / metric.target - 1) : 0;
                      const formatter = (value: number) => formatMetricValue(value, metric.format);
                      const varianceClass = metric.category === 'performance'
                        ? (Math.abs(variance) > 0.1 ? (variance < 0 ? 'text-green-600' : 'text-red-600') : 'text-green-600')
                        : (Math.abs(variance) > 0.1 ? (variance > 0 ? 'text-green-600' : 'text-red-600') : 'text-green-600');

                      return (
                        <tr key={metric.name} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                          <td className="p-2 font-medium">{metric.name}</td>
                          <td className="p-2">{formatter(metric.target)}</td>
                          <td className="p-2">{formatter(metric.actual)}</td>
                          <td className={`p-2 ${varianceClass}`}>
                            {formatPercentage(variance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigurationAnalysis;
